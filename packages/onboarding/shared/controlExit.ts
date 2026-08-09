/**
 * DIE ZWEI AUSGÄNGE DES COMMUNITY-SWITCHERS — als ZIEL, nicht als Link
 * (F50-Nachtrag, Davids Entscheidung 2026-08-08).
 *
 * Unter der Community-Liste stehen zwei Einträge, die den Mandanten-Host
 * verlassen: „Community anlegen" führt auf den Wizard-Host (`start.*`),
 * „Communities verwalten" auf den Kundenbereich (`my.*`). Bis heute waren das
 * schlichte Links — und wer sie klickte, stand drüben VOR DEM LOGIN-FORMULAR,
 * obwohl es dieselbe Platform-App und dasselbe Pool-Projekt ist. Session-Cookies
 * sind host-only; das ist keine Panne, sondern die Bauart. Der Community-WECHSEL
 * im selben Menü löst dasselbe Problem längst über das Siegel-Verfahren, die
 * zwei Ausgänge bekommen es hiermit nach.
 *
 * ── WARUM DAS HIER STEHT UND NICHT NEBEN `switcherExternalLink` ───────────
 * `packages/admin/shared/communitySwitcherLinks.ts` baut eine fertige URL für
 * das MENÜ. Diese Datei liefert das ZIEL für den SERVER: Host und Pfad
 * getrennt, weil der Host in das Siegel eingebacken wird
 * (`sealControlHostHandoff`) und der Pfad als `?to=` an
 * `/api/auth/site-session` reist. Zwei Aufgaben, zwei Formen — und `admin` darf
 * `onboarding` ohnehin nicht importieren (A14).
 *
 * ── DER ZIEL-HOST KOMMT AUS DER CONFIG, NIE VOM AUFRUFER ──────────────────
 * Das ist dieselbe Eigenschaft, die der Sicherheits-Audit vom 2026-08-02 beim
 * Community-Sprung erzwungen hat (dort: aus der Mitgliedschaftsliste). Der
 * Aufrufer sagt nur, WELCHEN der zwei Ausgänge er meint (`'create' | 'manage'`);
 * WOHIN das führt, entscheidet der Server aus `pukalani.tenancy.*`. Ein
 * präparierter Link kann damit kein fremdes Ziel in das Siegel schreiben — und
 * das Siegel selbst gilt ohnehin nur auf dem Host, für den es ausgestellt wurde.
 *
 * ── UND WARUM HIER KEINE MITGLIEDSCHAFT GEPRÜFT WIRD ──────────────────────
 * Beim Community-Sprung ist die Prüfung der Kern der Sache: dort betritt man
 * einen fremden MANDANTEN-Kontext, und die Zugehörigkeit muss serverseitig
 * belegt sein, bevor ein Siegel entsteht. Ein Kontroll-Host ist kein Mandant —
 * auf `my.*` und `start.*` ist man nur „man selbst": die Übersicht zeigt
 * ausschließlich die eigenen Mitgliedschaften, der Wizard legt eine neue
 * Community an. Es gibt dort nichts, wozu eine Mitgliedschaft berechtigen
 * könnte, also gäbe es auch nichts zu prüfen. Die einzige Bedingung ist eine
 * gültige Session — und die bringt der Klickende mit, sonst gäbe es kein Secret
 * zu siegeln.
 *
 * ── HOST-WAHL: DERSELBE GRIFF WIE IM MENÜ ─────────────────────────────────
 * Erster nicht-leerer, getrimmter Eintrag. Die zwei Listen sind eigene Achsen
 * (s. `controlHomeTarget` in core/shared/controlCenter.ts) — es wird nichts aus
 * der Reihenfolge der jeweils ANDEREN geraten. KEINE Liste, kein Ziel: `null`.
 * Eine App ohne konfigurierte Kontroll-Hosts (Silo, Playground) zeigt den
 * Menüpunkt gar nicht erst; die Route antwortet dann 404 statt auf `https:///`
 * zu siegeln.
 */

/** Welcher der zwei Ausgänge gemeint ist. */
export type ControlExit = 'create' | 'manage'

/** Wohin der Sprung geht — Host für das Siegel, Pfad für `?to=`. */
export interface ControlExitDestination {
  host: string
  path: string
}

export interface ControlExitTenancy {
  controlHosts?: readonly string[]
  wizardHosts?: readonly string[]
}

/**
 * Was `POST /api/community/control-handoff` zurückgibt: das Siegel UND das
 * Ziel, für das es gilt. Der Klickende baut seine URL aus DIESEN Feldern, nie
 * aus der eigenen Seite — das Siegel ist an genau diesen Host gebunden.
 */
export interface ControlExitHandoff {
  token: string
  host: string
  path: string
}

/**
 * Der Pfad je Ausgang. Absichtlich hier und nicht beim Aufrufer: Menü, Route
 * und Test sollen dieselbe Zeile lesen — ein `/communities`, das an zwei
 * Stellen steht, wandert beim nächsten Umbenennen nur an einer mit.
 */
const EXIT_PATHS: Record<ControlExit, string> = {
  create: '/start',
  manage: '/communities',
}

export function controlExitTarget(
  target: ControlExit,
  tenancy: ControlExitTenancy,
): ControlExitDestination | null {
  const hosts = target === 'create' ? tenancy.wizardHosts : tenancy.controlHosts
  const host = (hosts ?? []).map(entry => entry.trim()).find(entry => entry !== '')
  if (!host) return null
  return { host, path: EXIT_PATHS[target] }
}
