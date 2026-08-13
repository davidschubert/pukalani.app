import { isPlausibleScriptId, plausibleScriptUrl } from '../../shared/analyticsScript'

/**
 * DAS MESS-SCRIPT VOM EIGENEN HOST (F47/Paket 5, 2026-08-12).
 *
 * Holt `…/js/pa-<id>.js` von unserer Plausible-Instanz und liefert es unter
 * einem Pfad aus, der wie eine eigene Datei aussieht. Warum überhaupt, und
 * warum der Name so neutral ist, steht bei den Pfad-Konstanten in
 * core/shared/analyticsScript.ts.
 *
 * DIE ID KOMMT AUS DEM QUERY, DIE HERKUNFT NIE. Das ist derselbe Entwurf wie
 * beim Script-Tag selbst: geprüft wird eine ID (`isPlausibleScriptId` — ein
 * Zeichenvorrat ohne `.`, `/` und `:`), die Basis-Adresse kommt aus der
 * App-Config. Ein Aufrufer kann damit keine fremde Adresse benennen; das Beste,
 * was er erreichen kann, ist eine 404 unserer eigenen Instanz. Deshalb ist die
 * Route auch unauthentifiziert — sie muss für jeden Gast auf jeder Seite
 * funktionieren und gibt nichts preis, was nicht ohnehin im Quelltext steht.
 *
 * GECACHT, WEIL USER-AGNOSTISCH: das Script ist für alle Besucher dasselbe
 * (Microcache-Regel). Der Browser bekommt sechs Stunden `max-age` mit — bei
 * einem Kaltstart oder nach einem Deploy hätte sonst jeder erste Seitenaufbau
 * einen Umweg über die fremde Instanz. Ereignisse werden NIE gecacht, die
 * Gegen-Route sagt das ausdrücklich.
 *
 * FAIL-SOFT OHNE DETAILS: antwortet die Instanz nicht (oder nicht mit 2xx),
 * gibt es 503 und sonst nichts. Der Grund steht im Server-Log — die Antwort
 * einer fremden Instanz kann Angaben über sie enthalten, und der Browser kann
 * mit ihnen ohnehin nichts anfangen.
 */

/** Sechs Stunden — dieselbe Spanne wie im `Cache-Control` unten. */
const SCRIPT_TTL_MS = 6 * 60 * 60 * 1000
const SCRIPT_MAX_AGE_S = 6 * 60 * 60

const scriptCache = createMicrocache<string>(SCRIPT_TTL_MS)

export default defineEventHandler(async (event): Promise<string> => {
  const base = requireAnalyticsProxy(event)

  const id = getQuery(event).id
  if (typeof id !== 'string' || !id || !isPlausibleScriptId(id)) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  setResponseHeader(event, 'content-type', 'application/javascript; charset=utf-8')
  setResponseHeader(event, 'cache-control', `public, max-age=${SCRIPT_MAX_AGE_S}`)

  const cacheKey = `${base}|${id}`
  const cached = scriptCache.get(cacheKey)
  if (cached !== undefined) return cached

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ANALYTICS_PROXY_TIMEOUT_MS)
  try {
    const upstream = await fetch(plausibleScriptUrl(base, id), { signal: controller.signal })
    if (!upstream.ok) {
      console.error(`[analytics-proxy] Script ${upstream.status} für ${id}`)
      throw createError({ status: 503, statusText: 'Service unavailable' })
    }
    const body = await upstream.text()
    scriptCache.set(cacheKey, body)
    return body
  }
  catch (error) {
    // Der eigene 503 von oben reist unverändert weiter; alles andere (Abbruch,
    // DNS, Verbindung) wird hier zu demselben nichtssagenden 503.
    if (error && typeof error === 'object' && 'status' in error) throw error
    console.error(`[analytics-proxy] Script nicht erreichbar: ${(error as Error)?.message ?? 'unbekannt'}`)
    throw createError({ status: 503, statusText: 'Service unavailable' })
  }
  finally {
    clearTimeout(timeout)
  }
})
