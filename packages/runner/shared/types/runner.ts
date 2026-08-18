import type { Models } from 'node-appwrite'

/**
 * Datenmodell des AI-Runners — docs/plans/AI-RUNNER.md § 4.
 *
 * Alle drei Tabellen laufen mit `rowSecurity: false` und werden
 * AUSSCHLIESSLICH über Server-Routen (Admin-Client) geschrieben; gelesen wird
 * nur mit dem Label `admin` (§ 4: Repo-Schlüssel, Branch-Namen und Kosten
 * eines fremden Rechners sind keine Moderations-Sache).
 */

export const RUNNERS_TABLE = 'runners'
export const RUNS_TABLE = 'runs'
export const RUN_EVENTS_TABLE = 'run_events'
/**
 * EIGENER Bucket, bewusst NICHT `ticket-files` (§ 4): dessen Upload-Route
 * verlangt Session + `tickets.manage` — der Runner hat nur sein
 * Bearer-Secret —, und `runner` kennt `tickets` ohnehin nicht (A14).
 */
export const RUNNER_FILES_BUCKET = 'runner-files'

/**
 * Der Zustandsautomat eines Laufs (§ 4):
 *
 *   queued → claimed → running → ┬→ succeeded
 *                                ├→ needs_input  (Rückfrage, per --resume weiter)
 *                                ├→ failed
 *                                └→ cancelled
 *
 * `queued → cancelled` muss auch VOR dem Claim gehen (Knopf „Abbrechen").
 */
export const RUN_STATUSES = [
  'queued',
  'claimed',
  'running',
  'succeeded',
  'needs_input',
  'failed',
  'cancelled',
] as const
export type RunStatus = (typeof RUN_STATUSES)[number]

/**
 * Berechtigungs-Modi der Claude-Code-CLI (`--permission-mode`). Die Liste ist
 * eine ANZEIGE-Menge, keine Erlaubnis: was wirklich zulässig ist, entscheidet
 * die LOKALE Allowlist auf dem Rechner des Runners (§ 8.1) — die Datenbank
 * darf auswählen, was der Runner erlaubt, nie umgekehrt.
 */
export const PERMISSION_MODES = [
  'default',
  'auto',
  'plan',
  'acceptEdits',
  'dontAsk',
  'bypassPermissions',
] as const
export type PermissionMode = (typeof PERMISSION_MODES)[number]

/** Ein registrierter Rechner — ein Eintrag je Runner. */
export interface RunnerRow extends Models.Row {
  /** Anzeigename, z. B. „MacBook Pro (David)" */
  name: string
  /** Reine Anzeige — WIE der Runner arbeitet, entscheidet er selbst */
  kind: 'local' | 'ssh'
  /**
   * HASH des Bearer-Secrets (M9-Muster wie `community_invites.tokenHash`),
   * nie der Klartext: die Zeile ist für jeden Admin lesbar, das Secret ist
   * Code-Ausführung auf einem fremden Rechner.
   */
  secretHash: string
  /**
   * Was der Runner beim Heartbeat meldet (JSON: Repos, Modelle, erlaubte
   * Modi). ANZEIGE-KOPIE, keine Wahrheit (§ 8.1) — die Allowlist liegt lokal.
   */
  capabilitiesJson: string
  /** Letzter Claim-Poll; null = hat sich nie gemeldet */
  lastSeenAt: string | null
  status: 'active' | 'disabled'
}

/** Ein Auftrag. Der Zustandsautomat lebt hier. */
export interface RunRow extends Models.Row {
  /**
   * NEUTRALER Bezug statt `ticketId` (§ 3.1): heute nur `'ticket'`, später
   * auch Roadmap-Eintrag oder GitHub-Issue — ohne Migration und ohne dass
   * dieser Layer `tickets` kennen muss (A14).
   */
  subjectType: string
  subjectId: string
  /** Ziel-Runner; '' = beliebiger */
  runnerId: string
  /** Heute immer 'claude-code' — die Spalte spart später eine Migration */
  executor: string
  status: RunStatus
  /** SCHLÜSSEL aus der Runner-Allowlist, NIE ein Pfad (§ 8.1) */
  repoKey: string
  baseBranch: string
  /**
   * Vom Runner AUSGELESEN, nicht erfunden: mit `--worktree` vergibt die CLI
   * den Namen selbst (gemessen 2026-08-17). '' = noch nicht bekannt.
   */
  workBranch: string
  /** 'fable' | 'opus' | 'sonnet' oder ein voller Modellname */
  model: string
  permissionMode: PermissionMode
  /** false = headless (MVP), true = Terminal öffnen (§ 7.3) */
  interactive: boolean
  /**
   * Der zusammengesetzte Auftrag, wie er abgeschickt wurde — MEDIUMTEXT
   * (off-row): Beschreibung + Checkliste + zitiertes Feedback sprengen sonst
   * das ~65-KB-Zeilenbudget von MariaDB (Lektion pages-002).
   */
  promptSource: string
  /**
   * false, wenn Text aus GAST-Feedback stammt (§ 8.2). Gast-Feedback ist ein
   * Prompt-Injection-Pfad: `feedback/index.post.ts` nimmt bewusst auch Gäste
   * an, und daraus wird per „Übernehmen" ein Ticket. Dass ein Mensch geklickt
   * hat, ist kein Schutz — er liest nicht jede Zeile. Bei false wird der
   * fremde Text in `prompt.md` als DATEN gerahmt und `permissionMode` auf
   * `plan`/`acceptEdits` begrenzt; die Sperre sitzt serverseitig UND im
   * Runner, nie nur in einer ausgegrauten Schaltfläche.
   */
  promptTrusted: boolean
  /** JSON string[], z. B. ["pnpm lint","pnpm -r test"]; '' = keine */
  testCommands: string
  /** Kosten-Deckel in USD; 0 = kein eigener — der Runner kappt ohnehin gegen seinen */
  maxBudgetUsd: number
  /**
   * UUID, VOR dem Start vergeben (§ 7.2): so kennt das Ticket seine Session ab
   * Sekunde null und `--resume` trägt auch dann noch, wenn der Runner
   * zwischendurch abstürzt.
   */
  sessionId: string
  claimedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  /** JSON: Commit, Diffstat, Tests, Kosten, Dauer; '' = noch keins */
  resultJson: string
  /** Klartext-Grund bei `failed`; '' = keiner */
  error: string
  createdBy: string
}

/**
 * Eine Zeile Fortschritt — das ist die Live-Anzeige (§ 4). Hier landet
 * BEWUSST NICHT das komplette `stream-json`: der Runner verdichtet auf
 * Statuszeilen, Werkzeugaufrufe mit Ziel und Fehler; das volle Transkript
 * geht als Datei in den Bucket `runner-files`.
 */
export interface RunEventRow extends Models.Row {
  runId: string
  /** Monoton je Lauf — der Runner zählt, der Server ordnet danach */
  seq: number
  kind: 'status' | 'tool' | 'text' | 'error'
  message: string
  at: string
}
