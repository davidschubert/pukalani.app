import { resolveSeoOrigin } from '../../../../packages/core/shared/seoOrigin'

/**
 * Die Origin, auf die das Structured Data dieser Site zeigt — DIESELBE
 * Rechnung, die `useLocaleSeoHead()` (packages/core) für canonical, hreflang
 * und og:url anstellt.
 *
 * Warum es das gibt: die Seiten nahmen `useRequestURL().origin` ROH. Hinter
 * nginx spricht der Node-Prozess http, der Request-Origin lautet dort also
 * `http://…` — im JSON-LD standen damit `http`-Adressen (`@id`, `url`, `logo`,
 * `image`), während canonical im selben Dokument `https` sagte. Für Google
 * sind das zwei verschiedene Ressourcen: die Knoten des Graphen hängen sich an
 * eine Adresse, die nicht die kanonische ist.
 *
 * Die Regel steht deshalb genau einmal (core/shared/seoOrigin.ts): HOST+PORT
 * aus dem Request (diese Site bedient nach der Domain-Freischaltung zwei
 * Hosts), das SCHEMA aus `NUXT_PUBLIC_I18N_BASE_URL`. Ist das Gate
 * `pukalani.seo.originFromRequest` aus, gilt die Env-Basis komplett — dann
 * schreibt `useLocaleSeoHead()` den Kopf nämlich auch nicht um und canonical
 * trägt genau diese Basis.
 *
 * Kein Hydration-Risiko: `useRequestURL()` liefert im SSR den Request-Host und
 * im Browser `location` — auf demselben Host also denselben Origin. Bewusst
 * ein einfacher String und kein `computed`: der Origin eines Requests ändert
 * sich innerhalb einer Seite nicht.
 */
export function useSiteOrigin(): string {
  const requestUrl = useRequestURL()
  const appConfig = useAppConfig() as { pukalani?: { seo?: { originFromRequest?: boolean } } }
  const publicConfig = useRuntimeConfig().public as { i18n?: { baseUrl?: unknown } }
  const configured = typeof publicConfig.i18n?.baseUrl === 'string' ? publicConfig.i18n.baseUrl : ''

  if (appConfig.pukalani?.seo?.originFromRequest !== true) {
    return configured.replace(/\/+$/, '') || requestUrl.origin
  }
  return resolveSeoOrigin(requestUrl.origin, configured) || requestUrl.origin
}
