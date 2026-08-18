/**
 * Die Naht zur Betreiber-Konsole — docs/plans/AI-RUNNER.md § 5.
 *
 * BEWUSST EINE KOPIE der Typen aus `packages/runner/shared/types/runner.ts`
 * und KEIN Import: dieses Paket hat absichtlich keine einzige Laufzeit-
 * Abhängigkeit (nur `node:`-Builtins und das globale `fetch`), die Layer-Typen
 * hängen aber an `node-appwrite` (`Models.Row`). Ein Import zöge das SDK samt
 * seiner Transitiven auf einen Rechner, der davon nichts braucht — der Runner
 * spricht ausschliesslich HTTPS (§ 3.2: „der Runner braucht kein
 * Appwrite-SDK").
 *
 * Der Preis ist eine zweite Stelle, die sich bei einer Schema-Änderung bewegen
 * muss. Er ist bezahlbar, weil die Kopie NUR das enthält, was der Runner
 * tatsächlich liest — fällt ein Feld weg, merkt es der erste Lauf, und ein
 * neues Feld interessiert ihn nicht.
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

/**
 * Die Modi, die ein Lauf mit UNGEPRÜFTEM Auftragstext haben darf (§ 8.2) —
 * dieselbe Liste wie `UNTRUSTED_PERMISSION_MODES` im Layer. Sie steht hier ein
 * zweites Mal, weil die Sperre „serverseitig UND im Runner" sitzt: eine
 * Sicherung, die nur an einem Ende hängt, ist keine.
 */
export const UNTRUSTED_PERMISSION_MODES: readonly PermissionMode[] = ['plan', 'acceptEdits']

export type RunStatus =
  | 'draft'
  | 'queued'
  | 'claimed'
  | 'running'
  | 'succeeded'
  | 'needs_input'
  | 'failed'
  | 'cancelled'

/** Endzustände, die der Runner selbst melden darf (`runFinishSchema`). */
export type RunFinalStatus = 'succeeded' | 'needs_input' | 'failed' | 'cancelled'

/** Ein Auftrag, so wie ihn die Claim-Antwort liefert (nur die gelesenen Felder). */
export interface RunPayload {
  $id: string
  subjectType: string
  subjectId: string
  runnerId: string
  executor: string
  status: RunStatus
  /** SCHLÜSSEL aus der LOKALEN Allowlist, NIE ein Pfad (§ 8.1) */
  repoKey: string
  baseBranch: string
  workBranch: string
  model: string
  permissionMode: string
  interactive: boolean
  promptSource: string
  promptTrusted: boolean
  /** JSON `string[]`; '' = keine */
  testCommands: string
  maxBudgetUsd: number
  sessionId: string
}

export interface ClaimResponse {
  run: RunPayload | null
}

export interface RunAttachment {
  fileId: string
  name: string
  mimeType: string
  size: number
}

export interface RunAttachmentsResponse {
  attachments: RunAttachment[]
}

export type RunEventKind = 'status' | 'tool' | 'text' | 'error'

export interface RunEventPayload {
  seq: number
  kind: RunEventKind
  message: string
  /** ISO 8601 MIT Zeitzone — der Server prüft `datetime({ offset: true })` */
  at: string
}

export interface EventsAckResponse {
  /** DER Rückkanal für „Abbrechen" (§ 9) — es gibt keinen zweiten */
  status: RunStatus
  accepted: number
}

export interface TranscriptUploadResponse {
  fileId: string
}

export interface HeartbeatResponse {
  ok: true
  lastSeenAt: string
}

/**
 * `runs.testCommands` ist eine JSON-Zeichenkette und kommt von der anderen
 * Seite der Naht. DEFENSIV: '' und kaputtes JSON ergeben eine leere Liste, nie
 * einen Fehler — ein verstümmelter Wert soll den Lauf ohne Tests fahren
 * lassen, nicht ihn abschiessen (dasselbe Muster wie `parseRunAttachments`).
 */
export function parseTestCommands(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map(entry => entry.trim())
  }
  catch {
    return []
  }
}
