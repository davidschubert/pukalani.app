import { safeRedirectTarget } from '../../../core/shared/redirectTarget'
import { isControlOnlyPath } from '../../shared/controlOnlyPaths'

/**
 * Trennt die zwei Welten DESSELBEN Deployments, symmetrisch:
 *
 *  - Auf einem KONTROLL-Host (account.pukalani.app) zeigt `/` den
 *    Kundenbereich, nicht die Startseite einer Community — dort gibt es keine.
 *  - Auf einem Community-Host bleiben Trichter, Übersicht und die Konto-Flächen
 *    unerreichbar (404, Liste + Begründung in shared/controlOnlyPaths.ts).
 *
 * ── WAS `/` AUF DEM KONTROLL-HOST IST (AH-2, 2026-08-11) ───────────────────
 * Seit AH-2 ist es eine SEITE und keine Weiterleitung mehr: die
 * Account-Startseite mit den Wegen in die Bereiche (Communities, Profil,
 * Einstellungen, Community anlegen). Vorher ging `/` hart auf `/communities`
 * weiter — was ein Konto ohne Community sofort weiter in den Wizard warf und
 * jedem anderen die Frage „wo ist mein Profil?" gar nicht erst stellte.
 *
 * Die pure Regel dahinter (`controlHomeTarget`, core/shared/controlCenter.ts)
 * ist UNVERÄNDERT geblieben und beantwortet weiterhin genau eine Frage:
 * Trichter oder Kundenbereich? Nur die Antwort „Kundenbereich" führt jetzt
 * nicht mehr woanders hin, sondern bleibt hier stehen. Ein `?code=` schlägt
 * nach wie vor alles — eine Einladung ist eine unmissverständliche Absicht.
 *
 * ── WARUM DIE ANMELDE-PFLICHT HIER STEHT UND NICHT IN DER SEITE ────────────
 * `/` gehört der APP (apps/platform/app/pages/index.vue), nicht diesem Layer:
 * auf einem Mandanten-Host rendert dieselbe Route die öffentliche
 * Startseite der Community, die JEDER sehen darf. Ein
 * `definePageMeta({ middleware: 'auth' })` dort würde also die Community-
 * Startseite hinter eine Anmeldung sperren. Die Pflicht gilt nur für die
 * Kontroll-Host-Hälfte — und die entscheidet sich hier. Der Rückweg reist als
 * `?redirect=` mit, damit man nach der Anmeldung dort landet, wo man hinwollte
 * (dieselbe Mechanik wie in der `auth`-Middleware des Core).
 *
 * `setPageLayout` gehört aus demselben Grund hierher: die Layout-Wahl fällt bei
 * SSR, BEVOR das Setup der Seite läuft — in der Seite gesetzt käme sie zu spät
 * und der Browser hydrierte ein anderes Layout, als der Server geschickt hat.
 *
 * Serverseitig hängt die Grenze nicht an dieser Middleware, sondern an
 * 00.tenant.ts + 01.control-center.ts — das hier ist die Navigations-Hälfte.
 */
export default defineNuxtRouteMiddleware((to) => {
  const isControlCenter = useIsControlCenter()
  const localePath = useLocalePath()
  // Pfad ohne Locale-Prefix vergleichen (prefix_except_default: /start und /de/start)
  const path = to.path.replace(/^\/(de|en)(?=\/|$)/, '') || '/'

  if (isControlCenter) {
    if (path === '/') {
      const hasInviteCode = typeof to.query.code === 'string' && to.query.code.trim() !== ''
      if (useControlHomeTarget(hasInviteCode) === 'wizard') {
        // Query MITNEHMEN: der Direktlink aus der Einladungs-Mail ist
        // `https://account.pukalani.app?code=…`. Ohne das fiele der Code beim
        // Weiterleiten weg und der Eingeladene müsste ihn abtippen.
        return navigateTo({ path: localePath('/start'), query: to.query })
      }

      if (!useAuthStore().isLoggedIn) {
        const target = safeRedirectTarget(to.fullPath)
        return navigateTo({
          path: localePath('/login'),
          ...(target ? { query: { redirect: target } } : {}),
        })
      }

      setPageLayout('onboarding')
      return
    }
    return
  }

  if (isControlOnlyPath(path)) {
    throw createError({ status: 404, statusText: 'Not found' })
  }
})
