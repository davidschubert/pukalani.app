import { safeRedirectTarget } from '../../shared/redirectTarget'

/**
 * Route-Middleware für Gast-Pages (Login/Register): eingeloggte User weiter.
 *
 * WOHIN WEITER, ENTSCHEIDET DAS ZIEL IM LINK (U1/M2, 2026-08-10). Vorher ging
 * es bedingungslos nach `/` — und damit verlor genau der Fall sein Ziel, für
 * den `?redirect=` überhaupt gebaut wurde: wer einer Einladungs-Mail auf
 * `/login?redirect=/join?token=…` folgt und ZUFÄLLIG schon angemeldet ist,
 * landete auf der Startseite und musste die Mail noch einmal suchen. Der
 * Erfolgsfall (Anmeldung durchgeführt) las dieselbe Query längst — nur der
 * „schon angemeldet"-Fall nicht.
 *
 * Dieselbe pure Prüfung wie dort (`safeRedirectTarget`, core/shared): nur
 * Pfade auf DIESEM Host, keine Rückkehr auf eine Anmeldeseite. Alles andere
 * fällt still auf `/` zurück — ein `?redirect=` ist die klassische
 * Open-Redirect-Lücke, und eine Middleware ist kein Grund, die Prüfung
 * abzukürzen.
 *
 * KEIN `localePath()` auf dem Ziel: das steht schon fertig in der Query (die
 * Auth-Guards hängen es mit Präfix an) — ein zweiter Durchlauf machte aus
 * `/de/join` ein `/de/de/join`. Nur der Rückfall `/` geht durch localePath.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!useAuthStore().isLoggedIn) return

  const target = safeRedirectTarget(to.query.redirect)
  return navigateTo(target ?? useLocalePath()('/'))
})
