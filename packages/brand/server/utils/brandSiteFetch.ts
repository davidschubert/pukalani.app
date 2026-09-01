import { lookup as dnsLookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import type { IncomingMessage, RequestOptions } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { Readable } from 'node:stream'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'
import {
  BRAND_SITE_ANALYSIS_TIMEOUT_MS,
  type BrandSiteAnalysisErrorCode,
  type BrandSiteContent,
  allIpsAllowed,
  analyzableUrl,
  contentTypeIsHtml,
  exceedsByteBudget,
  extractSiteContent,
  ipIsForbidden,
  isRedirectStatus,
  redirectBudgetLeft,
  redirectTarget,
} from '../../shared/brandSiteAnalysis'

/**
 * DER EINE AUSGEHENDE ABRUF DES BRAND-WIZARDS — und die Umsetzung des
 * SSRF-Vertrags aus `shared/brandSiteAnalysis.ts`.
 *
 * ── WARUM NICHT `fetch` ───────────────────────────────────────────────────
 * `fetch` (undici) kann nicht sagen, ZU WELCHER Adresse es verbunden hat, und
 * es folgt Weiterleitungen selbst — beides ist genau das, was hier nicht
 * passieren darf. Ein `dispatcher` mit eigenem Connector könnte es, kostete
 * aber `undici` als DIREKTE Abhängigkeit; im Baum liegen heute VIER Fassungen
 * davon als transitive Kopien (6.27, 6.28, 8.9, 8.10), und `check:single-copy`
 * ist genau deshalb ein Gate. `node:http`/`node:https` bringen mit, was
 * gebraucht wird, und kosten nichts.
 *
 * ── DAS REBINDING-FENSTER WIRD GESCHLOSSEN, NICHT VERKLEINERT ─────────────
 * Zwischen „Name aufgelöst und geprüft" und „Verbindung steht" liegt bei jedem
 * naiven Ansatz eine Lücke: der Auflöser wird ein ZWEITES Mal gefragt (vom
 * Betriebssystem, beim Verbinden), und ein Angreifer, der seinen DNS-Eintrag
 * mit TTL 0 wechseln lässt, antwortet beim zweiten Mal mit 127.0.0.1. Deshalb
 * wird hier EINMAL aufgelöst, jede Antwort geprüft — und dem Request eine
 * eigene `lookup`-Funktion mitgegeben, die AUSSCHLIESSLICH diese geprüften
 * Adressen zurückgibt. Es gibt keine zweite Auflösung, also auch kein Fenster.
 * Die tatsächlich verbundene Adresse wird trotzdem noch einmal geprüft (Gürtel
 * UND Hosenträger — die Kosten sind ein Vergleich).
 *
 * ── ROHES HTML VERLÄSST DIESE DATEI NIE ───────────────────────────────────
 * Der Plan (§9b) verlangt, das Rohmaterial nach der Extraktion früh zu
 * verwerfen. Deshalb gibt diese Funktion `BrandSiteContent` zurück und nicht
 * den Quelltext: es gibt gar keinen Aufrufer, der ihn speichern KÖNNTE.
 */

export class BrandSiteFetchError extends Error {
  // Ein GEWÖHNLICHES Feld statt einer Parameter-Eigenschaft (`readonly code`
  // im Konstruktor): die ist reine TypeScript-Syntax mit Laufzeit-Wirkung, und
  // Nodes „strip-only"-Modus (jedes `--experimental-strip-types`-Skript im
  // Repo) bricht daran. Der Gewinn wäre eine gesparte Zeile.
  readonly code: BrandSiteAnalysisErrorCode

  constructor(code: BrandSiteAnalysisErrorCode, message: string) {
    super(message)
    this.name = 'BrandSiteFetchError'
    this.code = code
  }
}

export interface BrandSiteFetchResult {
  content: BrandSiteContent
  /** Die Adresse, bei der wir nach allen Sprüngen gelandet sind. */
  finalUrl: string
  /** Nur fürs Log — der HOST, nie der Pfad. */
  finalHost: string
}

/** Ein Hostname ohne die Klammern, die `URL.hostname` einer v6-Adresse lässt. */
function bareHost(url: URL): string {
  return url.hostname.replace(/^\[/, '').replace(/\]$/, '')
}

interface CheckedAddress { address: string, family: number }

/**
 * EINMAL AUFLÖSEN, ALLES PRÜFEN. Eine einzige verbotene Adresse lässt den
 * ganzen Namen durchfallen: ein Name mit zwei A-Records (einer öffentlich,
 * einer intern) wäre sonst ein Würfel, und jeder zweite Versuch gewönne.
 */
async function resolveChecked(host: string): Promise<CheckedAddress[]> {
  let addresses: CheckedAddress[]
  try {
    addresses = (await dnsLookup(host, { all: true })).map(entry => ({
      address: entry.address,
      family: entry.family,
    }))
  }
  catch {
    throw new BrandSiteFetchError('fetch_failed', 'DNS lookup failed')
  }
  if (!allIpsAllowed(addresses.map(entry => entry.address))) {
    throw new BrandSiteFetchError('blocked_target', 'Resolved address is not allowed')
  }
  return addresses
}

/**
 * Die `lookup`-Option des Requests: sie beantwortet die Frage des Sockets mit
 * den BEREITS GEPRÜFTEN Adressen und fragt niemanden. Geprüft wird trotzdem
 * noch einmal — diese Funktion ist die einzige Stelle, an der eine Adresse in
 * den Socket geht, und sie soll auch dann richtig sein, wenn jemand sie später
 * mit einer anderen Liste aufruft.
 */
type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address?: string | CheckedAddress[],
  family?: number,
) => void

function pinnedLookup(addresses: readonly CheckedAddress[]) {
  return (_host: string, options: unknown, callback: LookupCallback): void => {
    const safe = addresses.filter(entry => !ipIsForbidden(entry.address))
    if (!safe.length) {
      callback(Object.assign(new Error('Blocked target'), { code: 'EACCES' }))
      return
    }
    const wantsAll = typeof options === 'object' && options !== null
      && (options as { all?: boolean }).all === true
    if (wantsAll) callback(null, [...safe])
    else callback(null, safe[0]!.address, safe[0]!.family)
  }
}

/** utf-8, ausser die Seite sagt ausdrücklich etwas anderes Bekanntes. */
function bufferEncoding(contentType: string | undefined): BufferEncoding {
  const charset = /charset\s*=\s*"?([\w-]+)"?/i.exec(contentType ?? '')?.[1]?.toLowerCase()
  if (charset === 'iso-8859-1' || charset === 'latin1' || charset === 'windows-1252') return 'latin1'
  return 'utf8'
}

/**
 * Der entpackende Strom — MIT eigenem Zähler. Ein Deckel, der nur die Bytes
 * vom Draht zählt, sieht eine Zip-Bombe nicht: 4 KB gzip können sich zu
 * Gigabytes entfalten, und der Speicher ist dann weg, bevor irgendein Limit
 * greift.
 */
function decodedStream(res: IncomingMessage): Readable {
  const encoding = String(res.headers['content-encoding'] ?? '').toLowerCase().trim()
  if (!encoding || encoding === 'identity') return res
  if (encoding === 'gzip' || encoding === 'x-gzip') return res.pipe(createGunzip())
  if (encoding === 'deflate') return res.pipe(createInflate())
  if (encoding === 'br') return res.pipe(createBrotliDecompress())
  throw new BrandSiteFetchError('fetch_failed', 'Unsupported content encoding')
}

type HopResult
  = { kind: 'body', html: string }
    | { kind: 'redirect', location: string | undefined }

/**
 * EIN Sprung: verbinden, Kopf prüfen, Rumpf lesen — mit hartem Byte-Deckel.
 * Wirft `BrandSiteFetchError`; alles andere wäre für den Aufrufer ein Rätsel.
 */
async function fetchHop(url: URL, addresses: readonly CheckedAddress[], deadline: number): Promise<HopResult> {
  const host = bareHost(url)
  const secure = url.protocol === 'https:'
  const remaining = Math.max(1, deadline - Date.now())

  const options: RequestOptions = {
    method: 'GET',
    hostname: host,
    port: url.port || (secure ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    // Ohne eigenen Agent landet dieser Request im globalen Pool — und damit in
    // einer wiederverwendeten Verbindung, deren Ziel nicht mehr unsere geprüfte
    // Adresse sein muss.
    agent: false,
    lookup: pinnedLookup(addresses) as RequestOptions['lookup'],
    headers: {
      'host': url.host,
      // Ein ehrlicher Absender: wer im Log seines Servers sieht, wer da liest,
      // soll es zuordnen können. Kein Browser-Kostüm.
      'user-agent': 'PukalaniBrandWizard/1.0 (+https://pukalani.app)',
      'accept': 'text/html,application/xhtml+xml',
      // Wir BITTEN um Unkomprimiertes; wer trotzdem packt, wird entpackt (s.
      // `decodedStream`) — die Bitte allein ist keine Sicherung.
      'accept-encoding': 'identity',
      'accept-language': 'en;q=0.9,de;q=0.8',
    },
    timeout: remaining,
    ...(secure ? { servername: host } : {}),
  }

  return await new Promise<HopResult>((resolve, reject) => {
    const send = secure ? httpsRequest : httpRequest
    const req = send(options, (res) => {
      // DIE VERBUNDENE ADRESSE, nicht die aufgelöste (s. Kopf).
      const remote = res.socket?.remoteAddress ?? ''
      if (ipIsForbidden(remote)) {
        res.destroy()
        req.destroy()
        reject(new BrandSiteFetchError('blocked_target', 'Connected address is not allowed'))
        return
      }

      const status = res.statusCode ?? 0
      if (isRedirectStatus(status)) {
        const location = res.headers.location
        res.resume()
        req.destroy()
        resolve({ kind: 'redirect', location })
        return
      }
      if (status < 200 || status >= 300) {
        res.resume()
        req.destroy()
        reject(new BrandSiteFetchError('fetch_failed', `Unexpected status ${status}`))
        return
      }

      const contentType = res.headers['content-type']
      if (!contentTypeIsHtml(contentType)) {
        res.destroy()
        req.destroy()
        reject(new BrandSiteFetchError('not_html', 'Response is not HTML'))
        return
      }
      // `Content-Length` ist ein VERSPRECHEN, kein Beweis — es erspart im
      // Gutfall nur das Lesen. Der wirksame Deckel steht unten am Strom.
      const promised = Number(res.headers['content-length'] ?? '0')
      if (Number.isFinite(promised) && exceedsByteBudget(promised)) {
        res.destroy()
        req.destroy()
        reject(new BrandSiteFetchError('too_large', 'Content-Length exceeds budget'))
        return
      }

      let stream: Readable
      try {
        stream = decodedStream(res)
      }
      catch (error) {
        res.destroy()
        req.destroy()
        reject(error)
        return
      }

      const encoding = bufferEncoding(contentType)
      const chunks: Buffer[] = []
      let raw = 0
      let decoded = 0
      let settled = false

      const stop = (error: BrandSiteFetchError): void => {
        if (settled) return
        settled = true
        res.destroy()
        stream.destroy()
        req.destroy()
        reject(error)
      }

      res.on('data', (chunk: Buffer) => {
        raw += chunk.length
        if (exceedsByteBudget(raw)) stop(new BrandSiteFetchError('too_large', 'Response body exceeds budget'))
      })
      stream.on('data', (chunk: Buffer) => {
        decoded += chunk.length
        if (exceedsByteBudget(decoded)) {
          stop(new BrandSiteFetchError('too_large', 'Decompressed body exceeds budget'))
          return
        }
        chunks.push(chunk)
      })
      stream.on('error', () => stop(new BrandSiteFetchError('fetch_failed', 'Response stream failed')))
      stream.on('end', () => {
        if (settled) return
        settled = true
        resolve({ kind: 'body', html: Buffer.concat(chunks).toString(encoding) })
      })
    })

    // Die Adresse, die der Socket wirklich benutzt — sie kommt aus unserer
    // eigenen `lookup`, wird hier aber nicht geglaubt, sondern geprüft.
    req.on('socket', (socket) => {
      socket.on('lookup', (_error, address: string) => {
        if (address && ipIsForbidden(address)) {
          socket.destroy(new Error('Blocked target'))
        }
      })
    })
    req.on('timeout', () => {
      req.destroy(new BrandSiteFetchError('fetch_failed', 'Request timed out'))
    })
    req.on('error', (error) => {
      reject(error instanceof BrandSiteFetchError
        ? error
        : new BrandSiteFetchError('fetch_failed', 'Request failed'))
    })
    req.end()
  })
}

/**
 * DIE EINGEREICHTE ADRESSE LESEN — und höchstens drei Sprünge weit folgen.
 *
 * JEDER Sprung durchläuft dieselbe Kette von vorn: Adresse prüfen (Schema,
 * Port) → auflösen → alle Adressen prüfen → verbinden → verbundene Adresse
 * prüfen. Ein `Location:`-Kopf ist damit kein Sonderfall, sondern eine neue
 * Eingabe — genau das ist der Punkt, an dem Prüfungen sonst durchrutschen.
 *
 * UMFANG PHASE 1: EINE Seite. Gefundene Unterseiten werden weder gelesen noch
 * angeboten (Plan §9b, „zuerst NUR die eingereichte URL").
 */
export async function fetchBrandSite(raw: string): Promise<BrandSiteFetchResult> {
  let target = analyzableUrl(raw)
  if (!target) throw new BrandSiteFetchError('blocked_target', 'URL is not analyzable')

  const deadline = Date.now() + BRAND_SITE_ANALYSIS_TIMEOUT_MS

  for (let hop = 0; ; hop++) {
    if (Date.now() >= deadline) throw new BrandSiteFetchError('fetch_failed', 'Timed out')

    const addresses = await resolveChecked(bareHost(target))
    const result = await fetchHop(target, addresses, deadline)

    if (result.kind === 'body') {
      return {
        content: extractSiteContent(result.html),
        finalUrl: target.toString(),
        finalHost: target.host,
      }
    }

    if (!redirectBudgetLeft(hop)) {
      throw new BrandSiteFetchError('fetch_failed', 'Too many redirects')
    }
    const next = redirectTarget(result.location, target)
    if (!next) throw new BrandSiteFetchError('blocked_target', 'Redirect target is not allowed')
    target = next
  }
}
