import { decodeHtmlEntities } from '../../core/shared/markdown'

/**
 * DER SSRF-VERTRAG DER URL-ANALYSE (Plan §9b „URL-Analyse — SSRF-Vertrag",
 * Referenz OWASP SSRF Cheat Sheet) — als PURE Regeln, ohne Netz, ohne h3, ohne
 * Appwrite.
 *
 * ── WARUM PUR UND WARUM HIER ──────────────────────────────────────────────
 * Ein Schutz, den man nur mit einem echten Server im Rücken prüfen kann, wird
 * einmal von Hand ausprobiert und danach nie wieder. Die gefährlichen Fälle
 * sind aber genau die, die man im Alltag NIE trifft: `169.254.169.254` (die
 * Metadaten-Adresse jeder Cloud), `::ffff:127.0.0.1` (dieselbe Loopback in
 * v6-Kleidung), ein DNS-Name, der beim ZWEITEN Auflösen auf 10.0.0.1 zeigt.
 * Deshalb liegt jede Entscheidung hier als Funktion, die ein Test mit einer
 * Zeichenkette füttern kann — der Transport (`server/utils/brandSiteFetch.ts`)
 * hat danach keine eigene Meinung mehr.
 *
 * ── WAS DER TRANSPORT DARAUS BAUEN MUSS ───────────────────────────────────
 *  1. `analyzableUrl()` — nur http/https, nur Standard-Ports.
 *  2. Alle DNS-Antworten durch `ipIsForbidden()`; EINE verbotene Adresse
 *     genügt zum Nein (ein Name mit zwei A-Records ist sonst ein Würfel).
 *  3. Verbunden wird NUR zu den geprüften Adressen (`lookup`-Option), und die
 *     TATSÄCHLICH verbundene Adresse (`socket.remoteAddress`) wird ERNEUT
 *     geprüft — das ist die Hälfte, die DNS-Rebinding schliesst.
 *  4. Weiterleitungen von Hand, je Sprung von vorn (1–3), höchstens
 *     `BRAND_SITE_ANALYSIS_MAX_REDIRECTS`.
 *  5. `contentTypeIsHtml()`, Byte-Deckel beim LESEN (nicht `Content-Length`
 *     glauben) und derselbe Deckel nach dem Entpacken.
 *
 * ── UMFANG PHASE 1: EINE SEITE ────────────────────────────────────────────
 * Nur die eingereichte Adresse. Der Plan sieht später eine Auswahl von bis zu
 * fünf Same-Origin-Seiten vor; die NAHT dafür ist `extractSiteContent()`, das
 * schon heute eine einzelne Seite in eine benannte Form bringt — mehrere
 * Seiten wären mehrere Aufrufe und ein Zusammenschreiben, keine neue Regel.
 * Gebaut wird das hier NICHT.
 */

// ── Die Zahlen ─────────────────────────────────────────────────────────────

/**
 * Was wir höchstens vom Draht lesen — roh UND entpackt. Der zweite Teil ist
 * der Punkt: eine 4-KB-gzip-Antwort kann sich zu 4 GB entfalten (Zip-Bomb),
 * und ein Deckel, der nur die komprimierten Bytes zählt, sieht davon nichts.
 */
export const BRAND_SITE_ANALYSIS_MAX_BYTES = 2_000_000

/** Deckel des EXTRAHIERTEN Textes (die Spalte ist MEDIUMTEXT, der Prompt nicht). */
export const BRAND_SITE_ANALYSIS_MAX_TEXT = 20_000

/**
 * Was davon in Georges Prompt wandert. Kleiner als der gespeicherte Text, und
 * zwar bewusst: gespeichert wird, was wir gelesen haben (später sollen daraus
 * mehrere Slots schöpfen), gesendet wird, was ein Auftrag verträgt.
 */
export const BRAND_SITE_ANALYSIS_PROMPT_MAX = 6_000

/** Höchstens drei Sprünge — jeder mit voller Prüfung. */
export const BRAND_SITE_ANALYSIS_MAX_REDIRECTS = 3

/** Hartes Zeitbudget über ALLE Sprünge, nicht je Sprung. */
export const BRAND_SITE_ANALYSIS_TIMEOUT_MS = 10_000

/** Titel und Beschreibung sind Beschriftungen, keine Texte. */
export const BRAND_SITE_TITLE_MAX = 200
export const BRAND_SITE_DESCRIPTION_MAX = 500

/**
 * DIE ABLEHNUNGSGRÜNDE — sie reisen als `data.code` und werden vom zentralen
 * Fehler-Handler als `reason` ins Envelope gehoben.
 *
 * Sie sind ABSICHTLICH grob: „welche IP war es" oder „welcher Header fehlte"
 * gehört ins Log, nicht in eine Antwort, die ein Fremder auslösen kann — sonst
 * ist die Analyse ein Portscanner mit Oberfläche. Unterschieden werden nur die
 * vier Dinge, auf die ein MENSCH verschieden reagiert: keine Adresse da ·
 * die Adresse dürfen wir nicht lesen · da war keine Website · das war zu gross
 * · wir kamen nicht dran.
 */
export type BrandSiteAnalysisErrorCode
  = 'no_url'
    | 'blocked_target'
    | 'not_html'
    | 'too_large'
    | 'fetch_failed'

// ── 1. Die Adresse ─────────────────────────────────────────────────────────

/**
 * NUR http/https AUF STANDARD-PORTS — sonst `null`.
 *
 * Der Port ist Teil des Vertrags und nicht Kosmetik: die interessanten Ziele
 * eines Angreifers hören auf 6379 (Redis), 9200 (Elasticsearch), 11211
 * (memcached) oder 8080; ein http-Request dorthin ist oft genug „gültig
 * genug", um etwas auszulösen. Erlaubt sind deshalb nur der leere Port (die
 * Vorgabe des Schemas) und der zum Schema passende.
 *
 * `javascript:`, `data:`, `file:`, `ftp:`, `gopher:` fallen mit demselben
 * Nein heraus — normalisiert wird NICHTS: eine Adresse, die still zu etwas
 * anderem wird, als der Mensch getippt hat, ist schwerer zu erklären als ein
 * ehrliches Nein (dieselbe Haltung wie `isBrandWebsiteUrl`).
 */
export function analyzableUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  }
  catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (!url.hostname) return null

  const standardPort = url.protocol === 'http:' ? '80' : '443'
  if (url.port !== '' && url.port !== standardPort) return null

  return url
}

// ── 2. Die Adressbereiche ──────────────────────────────────────────────────

/** Ein IPv4-Literal als vier Zahlen — `null`, wenn es keins ist. */
function parseIpv4(value: string): [number, number, number, number] | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const octets: number[] = []
  for (const part of parts) {
    // Führende Nullen sind hier VERBOTEN, nicht bloss hässlich: `0177.0.0.1`
    // ist für manche Auflöser oktal (= 127.0.0.1) und für uns eine ganz
    // gewöhnliche 177 — genau diese Uneinigkeit ist der Trick.
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    octets.push(octet)
  }
  return octets as [number, number, number, number]
}

/**
 * DIE VERBOTENEN v4-BEREICHE. Über Loopback und RFC1918 hinaus stehen hier
 * bewusst auch die Bereiche, die „nur" seltsam sind: 0.0.0.0/8 (auf Linux
 * dasselbe wie localhost), 100.64/10 (Carrier-NAT — im Rechenzentrum durchaus
 * erreichbar), 192.0.0/24 und die Test-/Doku-Netze, 198.18/15 (Benchmark),
 * Multicast und der reservierte Rest ab 240.
 *
 * 169.254/16 trägt die Cloud-Metadaten-Adresse 169.254.169.254 — das ist der
 * Klassiker, gegen den dieser ganze Vertrag geschrieben ist.
 */
function ipv4IsForbidden(octets: [number, number, number, number]): boolean {
  const [a, b] = octets
  if (a === 0) return true // „dieses Netz" — auf Linux erreichbar wie 127.0.0.1
  if (a === 10) return true // RFC1918
  if (a === 127) return true // Loopback
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a === 169 && b === 254) return true // Link-Local + Cloud-Metadaten
  if (a === 172 && b >= 16 && b <= 31) return true // RFC1918
  if (a === 192 && b === 0) return true // IETF-Protokollzuweisungen + TEST-NET-1
  if (a === 192 && b === 168) return true // RFC1918
  if (a === 198 && (b === 18 || b === 19)) return true // Benchmark
  if (a === 198 && b === 51) return true // TEST-NET-2
  if (a === 203 && b === 0) return true // TEST-NET-3
  if (a >= 224) return true // Multicast, reserviert, 255.255.255.255
  return false
}

/** Die acht Gruppen eines IPv6-Literals (mit `::`-Kurzform) — sonst `null`. */
function parseIpv6(value: string): number[] | null {
  let text = value.trim()
  if (!text) return null
  // Ein Zonen-Index (`fe80::1%eth0`) gehört nicht in eine Zieladresse — er ist
  // ein Hinweis auf genau die Link-Local-Adresse, die hier verboten ist.
  if (text.includes('%')) return null
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1)
  if (!text.includes(':')) return null

  // Eingebettetes v4 (`::ffff:127.0.0.1`, `64:ff9b::10.0.0.1`) wird zu zwei
  // Gruppen — danach ist es eine gewöhnliche v6-Adresse.
  const lastColon = text.lastIndexOf(':')
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const v4 = parseIpv4(tail)
    if (!v4) return null
    const high = (v4[0] << 8) | v4[1]
    const low = (v4[2] << 8) | v4[3]
    text = `${text.slice(0, lastColon + 1)}${high.toString(16)}:${low.toString(16)}`
  }

  const halves = text.split('::')
  if (halves.length > 2) return null

  const toGroups = (part: string): number[] | null => {
    if (!part) return []
    const groups: number[] = []
    for (const piece of part.split(':')) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(piece)) return null
      groups.push(Number.parseInt(piece, 16))
    }
    return groups
  }

  const head = toGroups(halves[0] ?? '')
  const rest = halves.length === 2 ? toGroups(halves[1] ?? '') : null
  if (!head) return null

  if (halves.length === 1) return head.length === 8 ? head : null
  if (!rest) return null
  const missing = 8 - head.length - rest.length
  if (missing < 1) return null
  return [...head, ...Array.from({ length: missing }, () => 0), ...rest]
}

/**
 * DIE VERBOTENEN v6-BEREICHE — und die zwei Fälle, die kein Mensch im Kopf
 * hat: eine v4-Adresse KANN als v6 auftreten (`::ffff:127.0.0.1`,
 * v4-mapped) und ein NAT64-Präfix (`64:ff9b::/96`) trägt ebenfalls eine v4 in
 * den letzten 32 Bit. Beide werden auf ihre v4 zurückgerechnet und mit den
 * v4-Regeln beantwortet — sonst wäre `::ffff:169.254.169.254` erlaubt, und
 * der ganze Vertrag oben wäre Zierde.
 */
function ipv6IsForbidden(groups: number[]): boolean {
  const isPrefix = (...prefix: number[]): boolean =>
    prefix.every((value, index) => groups[index] === value)

  // v4-mapped (::ffff:a.b.c.d) und NAT64 (64:ff9b::a.b.c.d) → als v4 beurteilen.
  const embedded = (): [number, number, number, number] | null => {
    const last = [
      (groups[6] ?? 0) >> 8, (groups[6] ?? 0) & 0xFF,
      (groups[7] ?? 0) >> 8, (groups[7] ?? 0) & 0xFF,
    ] as [number, number, number, number]
    if (isPrefix(0, 0, 0, 0, 0, 0xFFFF)) return last
    if (isPrefix(0, 0, 0, 0, 0xFFFF, 0)) return last // v4-translated
    if (isPrefix(0x64, 0xFF9B, 0, 0, 0, 0)) return last // NAT64
    return null
  }
  const v4 = embedded()
  if (v4) return ipv4IsForbidden(v4)

  if (groups.every(group => group === 0)) return true // ::
  if (isPrefix(0, 0, 0, 0, 0, 0, 0) && groups[7] === 1) return true // ::1
  if (((groups[0] ?? 0) & 0xFE00) === 0xFC00) return true // fc00::/7 (ULA)
  if (((groups[0] ?? 0) & 0xFFC0) === 0xFE80) return true // fe80::/10 (Link-Local)
  if (((groups[0] ?? 0) & 0xFF00) === 0xFF00) return true // ff00::/8 (Multicast)
  if (isPrefix(0x2001, 0x0DB8)) return true // Doku-Präfix
  if (isPrefix(0x2001, 0x0000)) return true // Teredo — tunnelt zu beliebigen Zielen
  return false
}

/**
 * DIE EINE FRAGE, DIE DER TRANSPORT ZWEIMAL STELLT: vor dem Verbinden für
 * JEDE aufgelöste Adresse, und nach dem Verbinden für die TATSÄCHLICHE.
 *
 * FAIL-CLOSED: was sich nicht als IP lesen lässt, ist verboten. Diese Funktion
 * bekommt nur Ausgaben von `dns.lookup` und `socket.remoteAddress` zu sehen —
 * ist eine davon unlesbar, ist das kein Grund, sie durchzulassen.
 */
export function ipIsForbidden(ip: string): boolean {
  const value = ip.trim()
  if (!value) return true
  const v4 = parseIpv4(value)
  if (v4) return ipv4IsForbidden(v4)
  const v6 = parseIpv6(value)
  if (v6) return ipv6IsForbidden(v6)
  return true
}

/** Eine einzige verbotene Adresse genügt (s. Kopf, Punkt 2). Leer ⇒ nein. */
export function allIpsAllowed(ips: readonly string[]): boolean {
  return ips.length > 0 && ips.every(ip => !ipIsForbidden(ip))
}

// ── 3. Weiterleitungen ─────────────────────────────────────────────────────

export function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

/** Ist dieser Sprung noch im Budget? (`hop` ist 0-basiert: der erste Sprung ist 0.) */
export function redirectBudgetLeft(hop: number): boolean {
  return hop < BRAND_SITE_ANALYSIS_MAX_REDIRECTS
}

/**
 * DAS ZIEL EINES SPRUNGS — relativ aufgelöst und durch dieselbe Prüfung wie
 * die erste Adresse. `null` heisst „nicht folgen".
 *
 * Ein `Location: http://169.254.169.254/` ist der bequemste Weg an einer
 * Prüfung vorbei, die nur die EINGEREICHTE Adresse ansieht — deshalb ist der
 * Sprung hier kein Sonderfall, sondern derselbe Fall von vorn.
 */
export function redirectTarget(location: string | undefined, base: URL): URL | null {
  if (!location || !location.trim()) return null
  let absolute: URL
  try {
    absolute = new URL(location.trim(), base)
  }
  catch {
    return null
  }
  return analyzableUrl(absolute.toString())
}

// ── 4. Content-Type und Grösse ─────────────────────────────────────────────

/**
 * NUR HTML. Ein PDF, ein Bild oder ein 300-MB-Video sind keine Website-Texte,
 * und ein `application/octet-stream` ist die höfliche Form von „ich sage dir
 * nicht, was das ist".
 *
 * FEHLENDER Header ⇒ NEIN. Das ist strenger als ein Browser und hier richtig:
 * wir lesen nicht, um anzuzeigen, sondern um einem Sprachmodell Material zu
 * geben — im Zweifel lieber „das war keine Website".
 */
export function contentTypeIsHtml(value: string | undefined): boolean {
  if (!value) return false
  const type = value.split(';')[0]?.trim().toLowerCase() ?? ''
  return type === 'text/html' || type === 'application/xhtml+xml'
}

/** Der Lese-Deckel — gilt für rohe UND entpackte Bytes (s. Kopf der Konstante). */
export function exceedsByteBudget(bytes: number, max: number = BRAND_SITE_ANALYSIS_MAX_BYTES): boolean {
  return bytes > max
}

// ── 5. Die Text-Extraktion ─────────────────────────────────────────────────

/** Was aus einer Seite herauskommt — benannt, damit der Prompt es benennen kann. */
export interface BrandSiteContent {
  title: string
  description: string
  /** Der Fliesstext, Tags entfernt, Entities aufgelöst, Weissraum zusammengezogen. */
  text: string
}

const BLOCK_ELEMENTS = /<\/?(?:p|div|section|article|header|footer|main|aside|nav|h[1-6]|li|tr|td|th|br|hr)\b[^>]*>/gi
const DROPPED_BLOCKS = /<(script|style|noscript|template|svg|iframe|object|canvas)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const SELF_CLOSED_DROPPED = /<(?:script|style|noscript|template|svg|iframe|object|canvas)\b[^>]*\/?>/gi
const HTML_COMMENT = /<!--[\s\S]*?-->/g
const ANY_TAG = /<[^>]*>/g

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** Ein Attribut aus einem Tag — Anführungszeichen beider Sorten, sonst unquoted. */
function attribute(tag: string, name: string): string {
  const quoted = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag)
  if (quoted) return quoted[2] ?? quoted[3] ?? ''
  const bare = new RegExp(`\\b${name}\\s*=\\s*([^\\s"'>]+)`, 'i').exec(tag)
  return bare?.[1] ?? ''
}

/**
 * TITEL, BESCHREIBUNG UND FLIESSTEXT — ohne neue Abhängigkeit.
 *
 * ── WARUM KEIN PARSER ─────────────────────────────────────────────────────
 * Ein echter HTML-Parser (`cheerio`, `linkedom`, `jsdom`) wäre genauer und
 * kostete eine Abhängigkeit im Server-Bündel, deren Angriffsfläche grösser ist
 * als das Problem: wir bauen keinen DOM, wir wollen Wörter. Was hier
 * schiefgehen kann, ist ein Stück Text zu viel oder zu wenig — nie eine
 * Ausführung, denn nichts davon wird je gerendert (der Text landet in einer
 * Spalte und in einem Prompt, und der Prompt sagt ausdrücklich, dass es DATEN
 * sind).
 *
 * ── DIE REIHENFOLGE IST DIE AUSSAGE ───────────────────────────────────────
 * Kommentare raus (sie tragen oft ganze alte Seitenversionen) → Titel und
 * Beschreibung LESEN (sie stehen im `head`, den wir gleich mit ausräumen) →
 * `script`/`style`/`noscript`/`template`/`svg`/`iframe` samt Inhalt weg →
 * Block-Tags zu Zeilenumbrüchen (sonst klebt „Impressum"+"Kontakt" zu einem
 * Wort) → alle übrigen Tags weg → Entities → Weissraum.
 *
 * ENTITIES DEKODIERT DER CORE (`decodeHtmlEntities` aus `core/shared/
 * markdown.ts`) — dieselbe Tabelle, die der Markdown-Leser benutzt. Eine
 * zweite Dekodier-Tabelle im Repo wäre eine, die irgendwann anders entscheidet.
 */
export function extractSiteContent(html: string): BrandSiteContent {
  const withoutComments = html.replace(HTML_COMMENT, ' ')

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(withoutComments)
  const title = collapse(decodeHtmlEntities(collapse(titleMatch?.[1] ?? '').replace(ANY_TAG, ' ')))
    .slice(0, BRAND_SITE_TITLE_MAX)

  let description = ''
  let ogDescription = ''
  for (const tag of withoutComments.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attribute(tag, 'name').toLowerCase()
    const property = attribute(tag, 'property').toLowerCase()
    const content = collapse(decodeHtmlEntities(attribute(tag, 'content')))
    if (!content) continue
    if (name === 'description' && !description) description = content
    if (property === 'og:description' && !ogDescription) ogDescription = content
  }

  const body = withoutComments
    .replace(DROPPED_BLOCKS, ' ')
    .replace(SELF_CLOSED_DROPPED, ' ')
    .replace(BLOCK_ELEMENTS, '\n')
    .replace(ANY_TAG, ' ')

  const text = collapse(decodeHtmlEntities(body).replace(/[\t ]+/g, ' ').replace(/\n{2,}/g, '\n'))
    .slice(0, BRAND_SITE_ANALYSIS_MAX_TEXT)

  return {
    title,
    description: (description || ogDescription).slice(0, BRAND_SITE_DESCRIPTION_MAX),
    text,
  }
}

/**
 * DIE GESPEICHERTE FORM — beschriftete Blöcke, genau wie die Startkarte im
 * Prompt. Was leer ist, steht nicht da: eine Zeile „description:" ohne Inhalt
 * ist für ein Sprachmodell eine Einladung, sie zu füllen.
 *
 * Gespeichert wird der ZUSAMMENGESETZTE Text und nicht drei Spalten: Titel und
 * Beschreibung sind Teil desselben Fundes, sie veralten gemeinsam mit ihm, und
 * eine Spalte, die man vergessen kann mitzuschreiben, ist eine halbe Wahrheit.
 * Das ROHE HTML wird nach diesem Schritt VERWORFEN (Plan §9b) — es verlässt
 * `fetchBrandSite()` nie.
 */
export function composeSiteAnalysis(content: BrandSiteContent): string {
  const blocks: string[] = []
  if (content.title) blocks.push(`[title]\n${content.title}`)
  if (content.description) blocks.push(`[description]\n${content.description}`)
  if (content.text) blocks.push(`[page text]\n${content.text}`)
  return blocks.join('\n\n').slice(0, BRAND_SITE_ANALYSIS_MAX_TEXT)
}

/**
 * IST DER ZWISCHENSPEICHER NOCH DER, DEN DIE STARTKARTE MEINT?
 *
 * Verglichen wird die Adresse, die der Cache BESCHREIBT, mit der, die heute im
 * Profil steht — nicht die Zeit. Wer seine Website wechselt, hat einen Cache
 * über eine fremde Seite; wer nur wartet, hat einen alten über die richtige.
 * Der zweite Fall ist harmlos, der erste ist eine Falschaussage.
 *
 * Ein LEERES `websiteUrl` macht keinen Cache veraltet: die Adresse zu löschen
 * heisst „ich will nichts mehr gelesen haben" — dann ist die Anzeige weg, und
 * eine „veraltet"-Warnung über etwas, das niemand mehr sieht, wäre Lärm.
 */
export function siteAnalysisIsStale(analyzedUrl: string, websiteUrl: string): boolean {
  if (!analyzedUrl || !websiteUrl) return false
  return analyzedUrl.trim() !== websiteUrl.trim()
}
