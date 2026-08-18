/**
 * AH-4c — die PUREN Regeln des Appwrite-Projekt-Umzugs `control` → `admin`.
 *
 * ABGRENZUNG ZU `../f3-lib/rules.mts` (F3, comments→Pool). Dort zieht ein SILO
 * in einen POOL: jede Zeile bekommt einen Mandanten-Stempel, jede Permission
 * wird übersetzt, Konten können auf fremde Ids gemappt werden. HIER zieht ein
 * PROJEKT 1:1 auf dieselbe Instanz um —
 *
 *   · kein `communityId`-Stempel (es gibt keinen neuen Mandanten),
 *   · kein Id-Remapping (Row-Ids, User-Ids und Datei-Ids bleiben wörtlich),
 *   · kein Umschreiben von Permissions (dieselben Rollen, dasselbe Publikum).
 *
 * Genau deshalb ist der Vergleich hier die kritische Rechnung und nicht die
 * Übersetzung: der zweite Lauf (Delta vor dem Flip, Runbook Schritt 4) muss
 * entscheiden können, ob eine Zeile im Ziel noch dieselbe ist. Ein zu
 * großzügiger Vergleich lässt eine veraltete Zeile stehen, ein zu strenger
 * schreibt bei jedem Lauf alles neu — beides läuft GRÜN durch. Deshalb stehen
 * diese Regeln hier abgetrennt, ohne I/O, und hängen an Tests
 * (`packages/control/tests/ah4cProjectTransfer.test.ts`).
 *
 * Geteilt wird mit F3 genau EINE Rechnung: die Wahl des Users-API-Endpunkts
 * anhand des Passwort-Hashes. Sie wird IMPORTIERT statt kopiert — zwei
 * Kopien derselben Hash-Tabelle wären zwei Wahrheiten.
 *
 * Runbook: docs/runbooks/ADMIN-PROJEKT-CUTOVER.md · Werkzeug:
 * scripts/ops/ah4c-project-transfer.mjs
 */
import { hashPlanFor } from '../f3-lib/rules.mts'
import type { HashPlan, SourceCredentials } from '../f3-lib/rules.mts'

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Zeilen: Nutzdaten, Vergleich, Entscheidung
// ─────────────────────────────────────────────────────────────────────────────

/** Eine Appwrite-Row, wie die REST-API sie herausgibt: Nutzdaten plus
 *  `$`-Metafelder ($id, $permissions, $createdAt, $updatedAt, $tableId,
 *  $databaseId, $sequence …). */
export interface SourceRow {
  $id: string
  $permissions?: readonly string[]
  [key: string]: unknown
}

/** Was beim Anlegen im Ziel wörtlich übernommen wird. */
export interface RowTransfer {
  rowId: string
  data: Record<string, unknown>
  permissions: string[]
}

/**
 * Die NUTZDATEN einer Zeile — alle `$`-Metafelder fallen weg.
 *
 * `$id` und `$permissions` sind hier ebenfalls raus, obwohl beide mitwandern:
 * sie sind beim Schreiben eigene Felder des Requests (`rowId`, `permissions`)
 * und keine Spalten. Stünden sie im `data`-Objekt, antwortete Appwrite mit
 * „Unknown attribute" — und zwar erst beim ECHTEN Lauf, nie im Trockenlauf.
 */
export function rowPayloadOf(row: Readonly<SourceRow>): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('$')) continue
    data[key] = value
  }
  return data
}

/** Zeile → Schreib-Auftrag. Id und Permissions bleiben wörtlich (1:1-Umzug). */
export function rowTransferOf(row: Readonly<SourceRow>): RowTransfer {
  return {
    rowId: row.$id,
    data: rowPayloadOf(row),
    permissions: [...(row.$permissions ?? [])],
  }
}

/** Schlüssel, deren Array-Inhalt eine MENGE ist und keine Reihenfolge hat.
 *  Appwrite gibt Permissions nicht stabil sortiert zurück; ein
 *  reihenfolge-strenger Vergleich meldete bei jedem Delta-Lauf falsche
 *  Unterschiede und schriebe 178 Zeilen ohne Not neu. */
const UNORDERED_KEYS = new Set(['$permissions', 'permissions'])

function deepEqual(a: unknown, b: unknown, unordered = false): boolean {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    if (!unordered) return a.every((item, index) => deepEqual(item, b[index]))
    // Mengen-Vergleich mit Verbrauch: Duplikate bleiben dadurch relevant
    // (zwei gleiche Permissions sind nicht dasselbe wie eine).
    const rest = [...b]
    for (const item of a) {
      const index = rest.findIndex(candidate => deepEqual(item, candidate))
      if (index === -1) return false
      rest.splice(index, 1)
    }
    return true
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const left = a as Record<string, unknown>
    const right = b as Record<string, unknown>
    const keys = Object.keys(left)
    if (keys.length !== Object.keys(right).length) return false
    return keys.every(key => Object.prototype.hasOwnProperty.call(right, key)
      && deepEqual(left[key], right[key], UNORDERED_KEYS.has(key)))
  }
  return false
}

/**
 * Sind zwei Nutzdaten-Objekte inhaltlich gleich?
 *
 * Tief, typ-streng (`1` ≠ `'1'`, `null` ≠ `undefined`) und für gewöhnliche
 * Arrays reihenfolge-TREU — eine Spalte vom Typ `string[]` ist im Produkt eine
 * Liste, keine Menge. AUSNAHME sind `$permissions`/`permissions`: die kommen
 * aus Appwrite unsortiert.
 */
export function samePayload(a: unknown, b: unknown): boolean {
  return deepEqual(a, b, false)
}

/** Permissions sind eine MENGE — `read("any")` vor oder nach `update("user:x")`
 *  bedeutet dasselbe. */
export function samePermissions(a: readonly string[] = [], b: readonly string[] = []): boolean {
  return deepEqual([...a], [...b], true)
}

export type RowDecision =
  /** Gibt es im Ziel noch nicht → anlegen, Id + Permissions wörtlich. */
  | { action: 'create' }
  /** Gibt es, inhaltlich identisch → nichts tun (der Normalfall im 2. Lauf). */
  | { action: 'skip' }
  /** Gibt es, unterscheidet sich → mit `--execute` aktualisieren. `fields`
   *  benennt WAS abweicht, damit der Bericht mehr sagt als „ungleich". */
  | { action: 'update', fields: string[] }

/**
 * Die Delta-Semantik des zweiten Laufs (Runbook Schritt 4).
 *
 * Bewusst KEIN „im Zweifel überschreiben": das Ziel ist zwischen Phase 3 und
 * dem Flip noch nicht in Betrieb, aber der AI-Runner oder ein Betreiber-Klick
 * kann dort geschrieben haben. Was abweicht, wird deshalb BENANNT — der
 * Bericht ist die Grundlage der Entscheidung, nicht das Werkzeug.
 */
export function rowDecisionFor(
  source: Readonly<SourceRow>,
  target: Readonly<SourceRow> | null,
): RowDecision {
  if (!target) return { action: 'create' }
  const fields = differingFields(rowPayloadOf(source), rowPayloadOf(target))
  if (!samePermissions(source.$permissions ?? [], target.$permissions ?? [])) fields.push('$permissions')
  return fields.length ? { action: 'update', fields } : { action: 'skip' }
}

/** Welche Schlüssel unterscheiden sich? (Vereinigung beider Schlüsselmengen —
 *  ein im Ziel FEHLENDES Feld ist genauso ein Unterschied wie ein anderer Wert.) */
export function differingFields(
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys]
    .filter(key => !deepEqual(a[key], b[key], UNORDERED_KEYS.has(key)))
    .sort()
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Konten: übernehmen, vergleichen, fail-closed
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceUser extends SourceCredentials {
  $id: string
  email?: string
  name?: string
  phone?: string
  labels?: readonly string[]
  prefs?: Record<string, unknown>
  /** Appwrite: `true` = aktiv, `false` = gesperrt. */
  status?: boolean
  emailVerification?: boolean
  phoneVerification?: boolean
}

export type UserTransferPlan =
  /** OTP-only — `POST /users` OHNE `password` (das Betreiber-Konto ist per H2
   *  genau so angelegt, Runbook Schritt 0). */
  | { action: 'create-without-password', method: 'create' }
  /** Konto MIT Passwort: der Hash wandert unverändert über den zum Verfahren
   *  passenden Endpunkt. `plan` trägt die Zusatzfelder (scrypt-Parameter,
   *  SHA-Version). Klartext-Passwörter (`hash: 'plaintext'`) laufen ebenfalls
   *  hier durch — Endpunkt ist dann `/users` MIT `password`. */
  | { action: 'create-with-hash', method: HashMethod, plan: HashPlan }
  /** FAIL-CLOSED: Verfahren, das die Users-API nicht übernimmt. Lieber ein
   *  Konto im Bericht als eines, das sich nie wieder anmelden kann. */
  | { action: 'unsupported', hash: string }

export type HashMethod = Exclude<HashPlan['method'], 'unsupported'>

/**
 * Wie kommt dieses Konto ins Ziel?
 *
 * Die Hash-Tabelle selbst steht in `../f3-lib/rules.mts` (`hashPlanFor`) und
 * wird hier nur noch in die drei Fälle einsortiert, die das Werkzeug
 * unterscheiden muss. Was AH-4c NICHT tut und F3 sehr wohl: Konten
 * zusammenführen. Beim 1:1-Umzug gibt es im Ziel per Definition niemanden,
 * mit dem zusammenzuführen wäre — eine belegte Id ist deshalb kein
 * „Einzelfall", sondern ein Wiederanlauf (s. `userDiffFields`).
 */
export function userTransferPlan(user: Readonly<SourceUser>): UserTransferPlan {
  const plan = hashPlanFor(user)
  if (plan.method === 'unsupported') return { action: 'unsupported', hash: plan.hash }
  if (plan.method === 'create' && plan.needs.length === 0) {
    return { action: 'create-without-password', method: 'create' }
  }
  return { action: 'create-with-hash', method: plan.method, plan }
}

/** Felder, die beim Wiederanlauf verglichen werden. Der HASH steht bewusst
 *  NICHT dabei: die Users-API gibt ihn beim Lesen des Ziels nicht heraus, ein
 *  Vergleich wäre also immer „unterschiedlich" und die Warnung wertlos. */
const USER_COMPARE_FIELDS = [
  'email', 'name', 'phone', 'status',
  'emailVerification', 'phoneVerification', 'labels', 'prefs',
] as const

/**
 * Steht im Ziel DASSELBE Konto? Leere Liste = ja, dann wird übersprungen.
 *
 * Ein Unterschied führt NIE zum Überschreiben: die Id ist im Ziel belegt, und
 * wer sie belegt hat, weiß dieses Werkzeug nicht. Es warnt und lässt liegen —
 * dieselbe fail-closed-Haltung wie bei F3, nur mit anderem Anlass.
 */
export function userDiffFields(
  source: Readonly<SourceUser>,
  target: Readonly<SourceUser>,
): string[] {
  const differences: string[] = []
  for (const field of USER_COMPARE_FIELDS) {
    const left = normalizeUserField(source[field])
    const right = normalizeUserField(target[field])
    if (!deepEqual(left, right, field === 'labels')) differences.push(field)
  }
  return differences
}

/** `undefined`, `null` und `''` bedeuten bei der Users-API dasselbe: nicht
 *  gesetzt. Ohne diese Angleichung meldete jedes Konto ohne Telefonnummer
 *  einen Unterschied. */
function normalizeUserField(value: unknown): unknown {
  if (value === undefined || value === null) return ''
  return value
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Schutzregeln des Laufs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quelle und Ziel MÜSSEN verschiedene Projekte sein.
 *
 * Der teuerste denkbare Bedienfehler dieses Werkzeugs ist ein Lauf mit
 * zweimal derselben Env-Datei: jede Zeile fände sich selbst, `rowDecisionFor`
 * sagte brav „skip", und der Bericht meldete einen vollständigen, grünen
 * Umzug — ohne dass je etwas umgezogen wäre.
 */
export function assertDistinctProjects(sourceProject: string, targetProject: string): void {
  if (!sourceProject || !targetProject) {
    throw new Error('AH-4c: Projekt-Id fehlt — Quelle und Ziel müssen beide benannt sein.')
  }
  if (sourceProject === targetProject) {
    throw new Error(`AH-4c: Quelle und Ziel sind DASSELBE Projekt ("${sourceProject}"). `
      + 'Ein Lauf gegen sich selbst meldet einen grünen Umzug, der nie stattgefunden hat — '
      + '--source-env und --target-env prüfen.')
  }
}

/** Was es in der Quelle gibt und im Ziel nicht. Für Tabellen wie für Buckets:
 *  beide werden vom Schema angelegt (Runbook Schritt 2), nicht von diesem
 *  Werkzeug — es kopiert Inhalte, es baut kein Schema. */
export function missingInTarget(
  sourceIds: readonly string[],
  targetIds: readonly string[],
): string[] {
  const known = new Set(targetIds)
  return sourceIds.filter(id => !known.has(id)).sort()
}

export type TransferScope = 'users' | 'teams' | 'files' | 'buckets' | 'rows' | 'tables'

/** Welcher Scope fehlt bei welcher Ressource — die Namen stehen so in der
 *  Appwrite-Konsole. */
const SCOPE_NAMES: Record<TransferScope, string> = {
  users: 'users.read',
  teams: 'teams.read',
  files: 'files.read',
  buckets: 'buckets.read',
  rows: 'rows.read',
  tables: 'tables.read',
}

/**
 * Welche Ressource spricht dieser Pfad an?
 *
 * Damit hängt der Scope-Hinweis an der EINEN Stelle, an der ein 401 entsteht
 * (dem API-Aufruf), statt an jeder Fangstelle: sonst tragen ihn die Wege, an
 * die jemand gedacht hat, und ausgerechnet der überraschende 401 kommt roh
 * heraus. Genau das ist beim ersten Probelauf passiert — der Fehler kam aus
 * einer Existenzprüfung mitten in der Schleife.
 */
export function resourceFromPath(path: string): TransferScope {
  if (path.startsWith('/users')) return 'users'
  if (path.startsWith('/teams')) return 'teams'
  if (path.includes('/files')) return 'files'
  if (path.startsWith('/storage/buckets')) return 'buckets'
  if (path.includes('/rows')) return 'rows'
  return 'tables'
}

/**
 * Aus einem rohen 401 eine handlungsleitende Zeile machen.
 *
 * Anlass: der heutige Migrations-Key auf `control` trägt weder `users`- noch
 * `files`-Scope (Runbook, Inventar-Kasten). Wer stattdessen nur
 * „401 general_unauthorized_scope" liest, sucht den Fehler im Werkzeug.
 *
 * Gibt `null` zurück, wenn der Fehler NICHTS mit Scopes zu tun hat — dann
 * gehört die Originalmeldung durchgereicht und nicht überdeckt.
 */
export function scopeErrorHint(
  status: number | undefined,
  type: string | undefined,
  resource: TransferScope,
): string | null {
  const scopeType = type === 'general_unauthorized_scope' || type === 'user_unauthorized'
  if (status !== 401 && !scopeType) return null
  return `Dem Schlüssel dieser Instanz fehlt "${SCOPE_NAMES[resource]}" — `
    + 'kein Fehler des Werkzeugs. Runbook docs/runbooks/ADMIN-PROJEKT-CUTOVER.md '
    + 'Schritt 0 „Transfer-Key": der Lauf braucht users.read, teams.read und '
    + 'files.read ZUSÄTZLICH zu den Migrations-Scopes, auf BEIDEN Seiten. '
    + 'Gegenprobe: node scripts/ops/probe-key-scopes.mjs <env-datei>'
}
