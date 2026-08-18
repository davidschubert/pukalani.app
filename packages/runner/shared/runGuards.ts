import { PERMISSION_MODES, type PermissionMode, type RunStatus } from './types/runner'

/**
 * Die zwei puren Regeln des AI-Runners — docs/plans/AI-RUNNER.md § 4 (der
 * Zustandsautomat) und § 8.2 (die Modus-Sperre für ungeprüfte Prompts).
 *
 * BEWUSST PUR UND BEWUSST HIER: beide Regeln werden an mehreren Stellen
 * gebraucht (Anlege-Route, Runner-Routen, später die Oberfläche und der
 * Mac-Daemon), und beide sind Sicherungen. Eine Sicherung, die in einem
 * Handler zwischen zwei Appwrite-Aufrufen steht, lässt sich nicht einzeln
 * gegenprüfen — diese hier schon (tests/runGuards.test.ts).
 */

/**
 * Wer eine Zustandsänderung auslöst. Zwei Publikums-Klassen, streng getrennt
 * (§ 5): das BOARD spricht mit Session + Capability `runner.manage`, der
 * RUNNER mit seinem Bearer-Secret. Sie dürfen ausdrücklich NICHT dasselbe.
 */
export type RunActor = 'board' | 'runner'

/**
 * Endzustände. Aus ihnen führt KEIN Weg zurück — auch nicht `needs_input`:
 * eine Rückfrage wird über einen NEUEN Lauf mit `--resume` fortgesetzt
 * (§ 4, § 9), nicht durch Wiederbelebung des alten. Sonst hätte ein Lauf zwei
 * Berichte, zwei Kostenzeilen und keine ehrliche Dauer.
 */
export const TERMINAL_RUN_STATUSES = ['succeeded', 'needs_input', 'failed', 'cancelled'] as const

export function isTerminalRunStatus(status: RunStatus): boolean {
  return (TERMINAL_RUN_STATUSES as readonly RunStatus[]).includes(status)
}

/**
 * Die Modi, die ein Lauf mit UNGEPRÜFTEM Auftragstext haben darf (§ 8.2).
 *
 * `promptTrusted: false` heißt: im Text steckt Fremdmaterial — Gast-Feedback,
 * aus dem per „Übernehmen" ein Ticket wurde. Das ist ein Prompt-Injection-Pfad,
 * und dass ein Mensch geklickt hat, ist kein Schutz (er liest nicht jede
 * Zeile). `plan` schreibt gar nichts, `acceptEdits` schreibt nur Dateien im
 * Worktree; `dontAsk` und `bypassPermissions` würden einem fremden Text die
 * volle Werkzeugkiste auf Davids Rechner geben.
 */
export const UNTRUSTED_PERMISSION_MODES = ['plan', 'acceptEdits'] as const

/**
 * Darf dieser Berechtigungs-Modus für diesen Auftrag gewählt werden? (§ 8.2)
 *
 * Die Sperre sitzt SERVERSEITIG beim Anlegen des Laufs UND im Runner. Eine
 * Oberfläche, die den Knopf ausgraut, ist keine Sicherung — sie ist eine
 * Höflichkeit gegenüber dem, der das Formular benutzt.
 */
export function permissionModeAllowed(mode: PermissionMode, promptTrusted: boolean): boolean {
  if (!(PERMISSION_MODES as readonly string[]).includes(mode)) return false
  if (promptTrusted) return true
  return (UNTRUSTED_PERMISSION_MODES as readonly string[]).includes(mode)
}

/**
 * Der Zustandsautomat aus § 4, als Tabelle statt als verstreute if-Ketten:
 *
 *   queued → claimed → running → ┬→ succeeded
 *                                ├→ needs_input
 *                                ├→ failed
 *                                └→ cancelled
 *
 * Zwei Dinge, die die Tabelle über das Bild hinaus festhält:
 *
 *  1. `queued → cancelled` muss auch VOR dem Claim gehen (Knopf „Abbrechen",
 *     § 4) — deshalb steht `queued` beim Board.
 *  2. Der Runner darf `claimed` direkt beenden, ohne über `running` zu gehen.
 *     Ein Lauf, der schon beim Auflösen des `repoKey` scheitert (§ 7.2
 *     Schritt 2), hat nie gestartet — ihn erst künstlich auf `running` zu
 *     heben, wäre eine erfundene Startzeit im Bericht.
 *
 * `queued → claimed` steht zwar hier, passiert aber AUSSCHLIESSLICH in
 * `runs/claim.post.ts` (serialisiert, § 5): ein Runner kann sich keinen
 * bestimmten Lauf aussuchen.
 */
const RUN_TRANSITIONS: Record<RunActor, Partial<Record<RunStatus, readonly RunStatus[]>>> = {
  board: {
    queued: ['cancelled'],
    claimed: ['cancelled'],
    running: ['cancelled'],
  },
  runner: {
    queued: ['claimed'],
    claimed: ['running', 'succeeded', 'needs_input', 'failed', 'cancelled'],
    running: ['succeeded', 'needs_input', 'failed', 'cancelled'],
  },
}

/**
 * Ist dieser Übergang für diesen Handelnden erlaubt? (§ 4)
 *
 * Terminale Ausgangszustände stehen in KEINER Zeile der Tabelle — sie sind
 * damit für jeden Handelnden zu, ohne Sonderfall im Code. Ein Lauf, den das
 * Board abgebrochen hat, bleibt also abgebrochen, auch wenn der Runner danach
 * noch ein `finish: succeeded` schickt (er lief bis zur nächsten
 * Ereignis-Antwort weiter und erfährt den Abbruch erst dort, § 9).
 */
export function runTransitionAllowed(from: RunStatus, to: RunStatus, actor: RunActor): boolean {
  return (RUN_TRANSITIONS[actor][from] ?? []).includes(to)
}
