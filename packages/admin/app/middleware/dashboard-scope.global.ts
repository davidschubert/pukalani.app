import { resolveDashboardPlace, scopeVisibleAt } from '../../../core/shared/dashboardNav'

/**
 * ORTS-WÄCHTER für Dashboard-Seiten (Davids Entscheidung 2026-08-18):
 * Instanz-Seiten sind nur dort erreichbar, wo ihr Menü-Eintrag stehen darf —
 * dieselbe pure Regel `scopeVisibleAt` wie die Navigation (E9,
 * core/shared/dashboardNav.ts). Auf einem Mandanten-Host antwortet
 * /dashboard/admin & Co. damit 404, wie Betreiber-Inhalt nach N7 (öffentlicher
 * Changelog) — nicht 403, denn ein 403 wäre die Auskunft, dass es hier etwas
 * gäbe. Eine Seite erklärt ihre Ebene über `definePageMeta({ dashboardScope })`
 * (Augmentation in ./admin.ts); ohne das Feld ist diese Middleware ein No-Op.
 *
 * GLOBAL statt in der benannten `admin`-Middleware, und das ist der Punkt: die
 * Seiten listen `middleware: ['auth', 'admin']`, und `auth` läuft zuerst — ein
 * Anonymer bekäme den Login-Redirect, BEVOR der Wächter je liefe, und die 302
 * verriete ihm die Existenz der Seite (ein unbekannter /dashboard-Pfad
 * antwortet 404). Globale Middleware läuft vor allen benannten; die Seite
 * existiert an diesem Ort damit für NIEMANDEN, egal ob angemeldet.
 *
 * Der Ort wird exakt wie im Layout berechnet (layouts/dashboard.vue): beide
 * Eingaben sind Tatsachen des Requests (Config + Host), SSR und Client kommen
 * also zwangsläufig zum selben Ergebnis — kein Hydration-Bruch.
 */
export default defineNuxtRouteMiddleware((to) => {
  const scope = to.meta.dashboardScope
  if (!scope) return

  const appConfig = useAppConfig()
  const place = resolveDashboardPlace(
    (appConfig.pukalani as { tenancy?: { enabled?: boolean } }).tenancy?.enabled === true,
    useIsTenantHost(),
  )
  if (!scopeVisibleAt(scope, place)) {
    throw createError({ status: 404, statusText: 'Not Found' })
  }
})
