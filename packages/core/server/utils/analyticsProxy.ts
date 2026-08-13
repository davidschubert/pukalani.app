import type { H3Event } from 'h3'
import { analyticsUpstreamBase } from '../../shared/analyticsScript'

/**
 * DAS GATE DES ADBLOCK-PROXYS (F47/Paket 5, 2026-08-12) — EINE Antwort auf die
 * Frage „darf dieser Request proxyen, und WOHIN?".
 *
 * Sie steht hier und nicht zweimal in den Routen, weil Script und Ereignis
 * sonst auseinanderlaufen könnten: eine App, deren Script noch über uns läuft,
 * während die Ereignisse schon 404 bekommen, misst nichts mehr und sagt es
 * niemandem.
 *
 * DREI BEDINGUNGEN, alle aus der App-CONFIG und nie aus der Anfrage:
 *  1. `pukalani.analytics.enabled` — dieselbe Tür wie beim Script-Tag. Eine App
 *     ohne Analytics hat diese Routen schlicht nicht (404, nicht 403: sie soll
 *     nicht einmal verraten, dass es sie gibt).
 *  2. `pukalani.analytics.proxy` — der Not-Aus (s. app.config.ts).
 *  3. Eine Basis-Adresse muss herauskommen. Ohne sie gäbe es kein Ziel.
 *
 * DIE ENV-VARIABLE IST DER TEST-EINGANG (`NUXT_ANALYTICS_PROXY_ORIGIN`): sie
 * biegt die Herkunft auf eine andere Adresse um. Gebraucht wird sie für den
 * Beweis (Attrappe statt der echten Instanz) — im Betrieb bleibt sie leer, und
 * dann gilt die Config. Sie läuft durch DIESELBE Prüfung wie die Config-Werte;
 * ein Tippfehler dort schaltet den Proxy ab, statt irgendwohin zu zeigen.
 */

interface AnalyticsProxyConfig {
  enabled?: boolean
  proxy?: boolean
  instance?: string
  src?: string
}

/**
 * Die Upstream-Basis für diesen Request — `''` heißt „dieser Host proxyt nicht".
 */
export function analyticsProxyBase(event: H3Event): string {
  // OHNE `event` — dieselbe Form wie in aiComplete.ts/controlCenter.ts: die
  // App-Config ist gebaut und für alle Requests dieselbe, und in
  // `server/utils/**` kennt der Auto-Import nur diese Signatur (mit Argument
  // ist es ein Typfehler, den erst `pnpm typecheck` zeigt).
  const appConfig = useAppConfig() as { pukalani?: { analytics?: AnalyticsProxyConfig } }
  const analytics = appConfig.pukalani?.analytics

  if (analytics?.enabled !== true) return ''
  if (analytics.proxy === false) return ''

  const override = useRuntimeConfig(event).analyticsProxyOrigin
  if (typeof override === 'string' && override.trim()) {
    return analyticsUpstreamBase({ instance: override })
  }
  return analyticsUpstreamBase(analytics)
}

/**
 * Dasselbe, aber als Türsteher: 404 statt `''`. Beide Routen beginnen damit.
 */
export function requireAnalyticsProxy(event: H3Event): string {
  const base = analyticsProxyBase(event)
  if (!base) throw createError({ status: 404, statusText: 'Not found' })
  return base
}

/**
 * Abbruch, bevor eine hängende fremde Instanz einen unserer Worker bindet.
 * Großzügiger als nötig (ein Script sind ein paar KB), aber deutlich unter
 * allem, was einen Seitenaufbau spürbar aufhalten würde — das Script lädt
 * `async`, das Ereignis interessiert den Besucher gar nicht.
 */
export const ANALYTICS_PROXY_TIMEOUT_MS = 5_000
