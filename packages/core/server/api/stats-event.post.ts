/**
 * DAS EREIGNIS VOM EIGENEN HOST (F47/Paket 5, 2026-08-12) — die Gegenseite zu
 * stats-script.js.get.ts. Reicht den Rumpf 1:1 an `<instanz>/api/event` weiter.
 *
 * ── WELCHE KOPFZEILEN MITGEHEN, UND WARUM GENAU DIESE ──────────────────────
 * Ein Proxy, der nur den Rumpf weitergibt, misst Unsinn: Plausible liest die
 * Herkunft eines Besuchs NICHT aus dem Rumpf, sondern aus den Kopfzeilen des
 * Requests. Ohne sie sähe die Instanz nur noch UNSEREN Server — ein einziger
 * Besucher, ein Land, ein Browser.
 *  · `user-agent`   → Browser, Betriebssystem, Gerätetyp. Fehlt er, ist jeder
 *                     Besuch „unbekannt".
 *  · `x-forwarded-for` → Land/Region und der tägliche Besucher-Hash. Fehlt er,
 *                     ist jeder Besucher DERSELBE (unser Server).
 *  · `x-forwarded-proto`/`-host` → wie im offiziellen nginx-Rezept.
 * Die IP kommt aus `trustedClientIp()`, nicht aus dem rohen Header: unser nginx
 * HÄNGT die echte IP hinten an, das erste Segment ist Behauptung des Aufrufers
 * (server/utils/clientIp.ts). Ein Aufrufer kann seine eigene Herkunft damit
 * immer noch fälschen — das kann er auch, indem er direkt bei Plausible
 * einliefert; nur unsere Nachbarn kann er nicht mehr belasten.
 *
 * WAS BEWUSST NICHT MITGEHT: `cookie`. Auf einem Mandanten-Host trägt der die
 * Appwrite-Session; sie hat auf einer fremden Instanz nichts zu suchen — auch
 * nicht auf unserer eigenen. Plausible misst ohnehin cookielos, es fehlt ihm
 * also nichts. Ebenso bleiben `authorization` und `referer` hier.
 *
 * NIE GECACHT (Microcache-Regel): jedes Ereignis ist genau einmal gültig.
 *
 * DIE ANTWORT DER INSTANZ kommt mit ihrem STATUS zurück (202 im Normalfall) —
 * der Rumpf aber nur, wenn sie zufrieden war. Fehlertexte einer fremden Instanz
 * gehören ins Log, nicht in den Browser; das Mess-Script liest den Rumpf nicht.
 */

/**
 * Ein Plausible-Ereignis ist ein paar hundert Byte. Die Grenze verhindert, dass
 * die Route zum Weiterleitungsdienst für beliebige Nutzlast wird — sie ist
 * großzügig genug, dass keine echte Messung sie je berührt.
 */
const MAX_EVENT_BODY_BYTES = 16 * 1024

export default defineEventHandler(async (event): Promise<string> => {
  const base = requireAnalyticsProxy(event)

  const body = await readRawBody(event, 'utf8')
  if (!body || Buffer.byteLength(body, 'utf8') > MAX_EVENT_BODY_BYTES) {
    throw createError({ status: 400, statusText: 'Bad request' })
  }

  const headers: Record<string, string> = {
    'content-type': getRequestHeader(event, 'content-type') || 'text/plain',
  }
  const userAgent = getRequestHeader(event, 'user-agent')
  if (userAgent) headers['user-agent'] = userAgent
  const ip = trustedClientIp(event)
  if (ip) headers['x-forwarded-for'] = ip
  const host = getRequestHeader(event, 'host')
  if (host) headers['x-forwarded-host'] = host
  headers['x-forwarded-proto'] = getRequestProtocol(event)

  setResponseHeader(event, 'cache-control', 'no-store')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ANALYTICS_PROXY_TIMEOUT_MS)
  try {
    const upstream = await fetch(`${base}/api/event`, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body,
    })
    setResponseStatus(event, upstream.status)
    if (!upstream.ok) {
      console.error(`[analytics-proxy] Ereignis ${upstream.status}: ${(await upstream.text()).slice(0, 300)}`)
      return ''
    }
    return await upstream.text()
  }
  catch (error) {
    // Eine nicht erreichbare Instanz darf keine 5xx im Browser des Besuchers
    // erzeugen — gemessen wurde eben nichts. Der Grund steht im Log.
    console.error(`[analytics-proxy] Ereignis nicht zustellbar: ${(error as Error)?.message ?? 'unbekannt'}`)
    throw createError({ status: 503, statusText: 'Service unavailable' })
  }
  finally {
    clearTimeout(timeout)
  }
})
