/**
 * Kontroll-Hosts (Kundenbereich/Onboarding) — PURE Auflösung + Pfad-Regel.
 *
 * Hier, im shared-Bereich, weil BEIDE Seiten dieselbe Wahrheit brauchen:
 * der Server entscheidet daran über Mandant/kein Mandant und über erlaubte
 * API-Pfade, der Browser darüber, ob er den Kundenbereich statt einer
 * Community rendert. Zwei Kopien dieser Logik wären ein sicherer Weg in einen
 * Zustand, in dem die Seite den Kundenbereich zeigt, der Server aber einen
 * Mandanten erwartet.
 */

/** Kommagetrennte Env-Liste → normalisierte Hostnamen. */
export function parseControlHosts(raw: string | undefined | null): string[] {
  return (raw || '')
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Laufzeit (Env) vor Build (app.config) — die Hosts unterscheiden sich je
 * Umgebung (lokal `app.localhost`, Prod `app.pukalani.app`).
 */
export function resolveControlHosts(envValue: string | undefined | null, configured: readonly string[] | undefined): string[] {
  const fromEnv = parseControlHosts(envValue)
  if (fromEnv.length) return fromEnv
  return (configured ?? []).map(host => host.trim().toLowerCase()).filter(Boolean)
}

export function isControlHost(host: string | undefined | null, hosts: readonly string[]): boolean {
  const normalized = (host || '').trim().toLowerCase()
  return normalized.length > 0 && hosts.includes(normalized)
}

/**
 * Gegenprobe: läuft dieser Request auf einem MANDANTEN-Host? PURE.
 *
 * Für BETREIBER-Inhalte, die es auf einer Kunden-Community nicht geben darf
 * (N7: der öffentliche Changelog). Die Herleitung ist eine Ausschluss-Rechnung
 * und genau deshalb ohne aufgelösten Tenant-Kontext möglich — `00.tenant.ts`
 * beantwortet bei aktivem Gate JEDEN Request auf genau drei Arten:
 * Kontroll-Host, aufgelöster Mandant oder 404 für unbekannte Hosts. Was also
 * überhaupt rendert und kein Kontroll-Host ist, IST ein Mandanten-Host.
 * Ohne Tenant-Gate (Silo-Apps wie comments, Playground) gibt es überhaupt
 * keine Mandanten → immer false, Bestands-Apps bleiben unverändert.
 *
 * Fail-CLOSED beim unbekannten Host: der bekommt zwar schon in der Middleware
 * 404, aber die Rechnung hier würde ihn ohnehin als Mandanten-Host werten —
 * lieber ein 404 zu viel auf Betreiber-Inhalt als eines zu wenig.
 *
 * Serverseitig ist das NICHT die Wahrheit, sondern `useTenant(event)`
 * (server/utils/tenant.ts): dort liegt der wirklich aufgelöste Kontext.
 */
export function isTenantHost(
  tenancyEnabled: boolean,
  host: string | undefined | null,
  controlHosts: readonly string[],
): boolean {
  if (!tenancyEnabled) return false
  return !isControlHost(host, controlHosts)
}

/**
 * Wohin führt `/` auf einem KONTROLL-Host? PURE (unit-getestet).
 *
 * Bis F12 gab es darauf nur eine Antwort: der Wizard. Das war richtig, solange
 * es nur Neukunden gab, und wurde zur Zumutung, sobald jemand eine Community
 * HAT — der Kundenbereich begrüßte den Bestandskunden mit „Neue Community
 * anlegen" statt mit seiner eigenen.
 *
 * SEIT AH-1 (2026-08-11) ist `wizardHosts` in Produktion LEER: es gibt nur noch
 * `account.pukalani.app`, und dort ist die ÜBERSICHT das Zuhause. Der Fall
 * bleibt trotzdem gebaut, weil er kostenlos ist und die Umgebungen
 * auseinanderlaufen dürfen — lokal ist `start.localhost` weiterhin ein
 * nützlicher Kurz-Link, und die Regel entscheidet ihn ohne Deploy.
 *
 * Die frühere Aufteilung (`my.*` = Übersicht, `start.*` = Trichter) war eine
 * NAMENS-Entscheidung, keine technische: wer einen Host namens „start" abtippt,
 * will anlegen; ihn auf eine Liste zu werfen, wäre ein Bruch des Versprechens,
 * das im Hostnamen steht. Genau deshalb hat der EINE Name „account" jetzt auch
 * nur EINE Antwort.
 *
 * `hasInviteCode` schlägt beides: `?code=…` ist eine unmissverständliche
 * Absicht und kommt auf jedem Kontroll-Host vor (weitergeleitete Mail,
 * kopierter Link, seit AH-1 auch jede 301 von `start.*`). Ein Code, der auf
 * einer Übersicht landet, wäre still verloren.
 *
 * Die Liste der Wizard-Hosts ist eine EIGENE Achse, keine Reihenfolge in
 * controlHosts: „der erste Eintrag ist der Kundenbereich" wäre eine Regel, die
 * beim nächsten Env-Override unbemerkt kippt.
 */
export type ControlHomeTarget = 'wizard' | 'overview'

export function controlHomeTarget(
  host: string | undefined | null,
  wizardHosts: readonly string[],
  hasInviteCode: boolean,
): ControlHomeTarget {
  if (hasInviteCode) return 'wizard'
  return isControlHost(host, wizardHosts) ? 'wizard' : 'overview'
}

/**
 * WO LIEGT DER WIZARD? — die Host-Liste für einen LINK dorthin (AH-1).
 *
 * Das ist NICHT dieselbe Frage wie `controlHomeTarget()`. Dort geht es darum,
 * was `/` auf einem Host ZEIGT; hier darum, wohin ein Link FÜHRT, der den
 * Wizard meint. Und genau deshalb darf hier zurückgefallen werden, wo dort
 * nichts geraten werden darf: `/start` existiert auf JEDEM Kontroll-Host —
 * die Seite gehört dem onboarding-Layer, nicht einem bestimmten Hostnamen.
 *
 * Nötig geworden mit dem Cutover: bis dahin gab es mit `start.pukalani.app`
 * einen eigenen Wizard-Host, seither ist `wizardHosts` in Produktion leer.
 * Ohne diesen Rückfall verschwände „Community anlegen" stillschweigend aus dem
 * Community-Switcher und `POST /api/community/control-handoff` antwortete 404 —
 * ein Ausgang weniger, ohne dass irgendwo etwas rot würde.
 */
export function resolveWizardHosts(
  controlHosts: readonly string[] | undefined,
  wizardHosts: readonly string[] | undefined,
): readonly string[] {
  const wizard = wizardHosts ?? []
  return wizard.some(host => host.trim() !== '') ? wizard : (controlHosts ?? [])
}

/**
 * Darf dieser API-Pfad auf einem Kontroll-Host laufen?
 *
 * FAIL-CLOSED — nur ausdrücklich erlaubte Präfixe kommen durch. Der Grund ist
 * Datentrennung, nicht Ordnung: auf einem Host OHNE Mandanten scopt
 * `scopeQuery` nicht, `/api/comments` würde dort quer über ALLE Communities
 * des Pool-Projekts antworten. Ein neuer Endpunkt im Kundenbereich muss
 * deshalb bewusst eingetragen werden.
 *
 * Nicht-API-Pfade (Seiten, /_nuxt, /_i18n) prüft die Regel NICHT: sie liefern
 * keine Mandanten-Daten aus, und der Kundenbereich braucht eigene Seiten.
 */
export function isAllowedControlPath(path: string, prefixes: readonly string[]): boolean {
  if (!path.startsWith('/api/')) return true
  return prefixes.some(prefix => matchesPathPrefix(path, prefix))
}

/**
 * Präfix-Vergleich AN DER SEGMENTGRENZE (Audit-Befund 9, 2026-08-02).
 *
 * Vorher genügte `path.startsWith(prefix)`. Mit einem Präfix ohne Schrägstrich
 * — und vier der sieben stehen so in der Liste (`/api/health`,
 * `/api/notifications`, `/api/feedback`, `/api/abuse`) — öffnete das auch
 * `/api/feedbackfoo` oder `/api/abuse-export`. Heute existiert keine solche
 * Route; die Regel ist aber ein SICHERHEITSTOR, und eines, das eine noch nicht
 * geschriebene Route mit-erlaubt, ist eine Falle für den nächsten Menschen.
 *
 * Die Regel ist dieselbe wie im Produkt-Gate (04.product-gate.ts): exakter
 * Treffer, oder es folgt `/` bzw. `?`. Ein Schrägstrich AM ENDE des Präfixes
 * wird vorher abgeschnitten — sonst verlangte `/api/auth/` ein `//`, und der
 * gesamte Kundenbereich fiele auf 404.
 */
function matchesPathPrefix(path: string, prefix: string): boolean {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  if (!base) return false
  return path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`)
}
