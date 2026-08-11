/**
 * WELCHE SEITEN GEHÖREN NUR DEM KUNDENBEREICH? — PURE Regel (AH-2, 2026-08-11).
 *
 * Die Gegenprobe zur Kontroll-Host-Erkennung: auf einem MANDANTEN-Host
 * (kunde.pukalani.app) müssen diese Pfade 404 antworten. Ein „Community
 * anlegen" unter `kunde.pukalani.app/start` wäre für Mitglieder verwirrend, eine
 * Liste FREMDER Communities unter `/communities` wäre Betreiber-Inhalt am
 * falschen Ort (dieselbe Regel wie beim Changelog, N7) — und seit AH-2 gilt
 * dasselbe für die Konto-Flächen: `/profile` und `/settings` sind die
 * PUKALANI-ID, nicht die Mitgliedschaft in dieser einen Community. Wer sie auf
 * einem Mandanten-Host öffnete, bekäme Konto-Einstellungen unter fremdem
 * Branding zu sehen und würde die Community-Einstellungen daneben suchen.
 *
 * WARUM EINE EIGENE DATEI: die Liste stand als Ausdruck IN der Middleware
 * (`path === '/start' || path.startsWith('/start/') || path === '/communities'`)
 * und wuchs mit AH-2 auf das Doppelte. Ein Vergleich, der beim Wachsen nicht
 * mehr zu lesen ist, verliert irgendwann einen Fall — hier kostet der Fehler
 * eine offene Betreiber-Fläche auf einem Kundenhost. Als Funktion ist sie
 * prüfbar (tests/controlOnlyPaths.test.ts), ohne dass jemand einen Browser
 * starten muss.
 *
 * AN DER SEGMENTGRENZE verglichen, aus demselben Grund wie
 * `isAllowedControlPath` (Audit-Befund 9, 2026-08-02): mit blossem
 * `startsWith` fiele auch `/settings-der-community` unter die Sperre — ein
 * Pfad, der diesem Layer gar nicht gehört und den ein anderer morgen anlegen
 * darf, ohne zu ahnen, dass er hier still 404 wird.
 *
 * Der Pfad kommt OHNE Locale-Prefix herein (`/de/start` ⇒ `/start`); das
 * Abschneiden bleibt Sache des Aufrufers, weil nur er die Locale-Codes kennt.
 */
export const CONTROL_ONLY_PATHS = ['/start', '/communities', '/profile', '/settings'] as const

export function isControlOnlyPath(path: string): boolean {
  return CONTROL_ONLY_PATHS.some(base => path === base || path.startsWith(`${base}/`))
}
