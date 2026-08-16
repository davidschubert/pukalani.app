import { safeRedirectTarget } from '../../shared/redirectTarget'

/**
 * Wohin nach erfolgreicher Anmeldung/Registrierung?
 *
 * EINE Stelle für alle Auth-Formulare (Passwort, Registrierung, Code) — sonst
 * hätten wir drei Orte, an denen man das `?redirect=` vergessen kann. Die
 * Prüfung des Ziels liegt in `safeRedirectTarget` (Open-Redirect-Schutz,
 * unit-getestet).
 */
export function useAuthRedirect() {
  const route = useRoute()
  const localePath = useLocalePath()

  /** Das validierte Ziel oder die Startseite. */
  function afterAuthTarget(): string {
    return safeRedirectTarget(route.query.redirect) ?? localePath('/')
  }

  /**
   * Ziel eines QUER-LINKS zwischen den Auth-Formularen — mit `?redirect=`.
   *
   * Die Formulare oben haben das Ziel längst richtig behandelt; verloren ging
   * es auf dem WEG zwischen ihnen. Neun Links (Anmelden ↔ Registrieren ↔
   * Code-Varianten) zeigten auf den nackten Pfad, und mit dem ersten Klick war
   * das Ziel weg.
   *
   * Was das kostete, ist am Einladungs-Link zu sehen (2026-08-15 durchgespielt):
   * Wer eingeladen wird und noch KEIN Konto hat, landet über
   * `/join?token=…` → Auth-Guard → `/login?redirect=…` genau richtig — klickt
   * dann aber auf „Registrieren" und steht auf `/register` ohne Ziel. Nach der
   * Anmeldung geht es auf die Startseite statt zur Einladung: die Einladung
   * bleibt offen, und die darin vergebene ROLLE ist still verloren (der
   * A5-Beitritt macht die Person zum `viewer`, egal was der Owner wollte).
   *
   * Durch `safeRedirectTarget` auch beim WEITERREICHEN, nicht nur beim Landen:
   * was wir nicht annehmen würden, geben wir auch nicht weiter.
   */
  function authLinkTarget(path: string, extra: Record<string, string> = {}) {
    const target = safeRedirectTarget(route.query.redirect)
    return {
      path: localePath(path),
      query: { ...(target ? { redirect: target } : {}), ...extra },
    }
  }

  return { afterAuthTarget, authLinkTarget }
}
