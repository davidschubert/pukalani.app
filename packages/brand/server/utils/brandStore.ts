import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import { AppwriteException, Query } from 'node-appwrite'
import type {
  BrandGenerationsView,
  BrandProfileSummary,
  BrandSlotView,
  BrandStepSummary,
  BrandStoryView,
} from '../../shared/types/brand'
import {
  type BrandConfidence,
  type BrandJourneyStep,
  type BrandProfileFacts,
  type BrandStepFacts,
  type BrandStoredStepState,
  canEnterBrandStep,
  resolveBrandJourney,
} from '../../shared/brandJourney'
import {
  BRAND_SLOTS,
  BRAND_STEP_KEYS,
  BRAND_STEP_SLOTS_MAX_LENGTH,
  type BrandSlotStateFacts,
  type BrandStepKey,
} from '../../shared/slotRegistry'

/**
 * DER LESE-/SCHREIB-UNTERBAU DER `/api/brand/**`-ROUTEN — alles, was mehr als
 * eine Route braucht, steht EINMAL hier.
 *
 * ── KEIN `tenantDb`, UND DAS IST KEINE ABKÜRZUNG ──────────────────────────
 * `brand` ist ein SILO-Layer auf der Single-Tenant-Instanz `branding`; seine
 * Tabellen tragen kein `communityId`, und der ESLint-Backstop gegen rohes
 * `.tablesDB` gilt den GEPOOLTEN Layern. Die Grenze zwischen zwei Konten ist
 * hier `assertBrandOwnerAccess` — sie ist die EINZIGE, weil alle
 * `brand_*`-Tabellen server-only sind (Permissions `[]`, `rowSecurity: false`).
 * Deshalb gilt für jede Route dieselbe Reihenfolge: `requireBrandAccess` →
 * Zeile laden → `assertBrandOwnerAccess` → erst dann wirken.
 *
 * ── ZEILEN-IDS DER BAUSTEINE SIND ABLEITBAR ───────────────────────────────
 * `brand_steps` hat einen UNIQUE-Index auf (profileId, stepKey) — die Zeile ist
 * also ohnehin eindeutig. Wir vergeben ihre Id zusätzlich DETERMINISTISCH
 * (`<profileId>_<stepKey>`, beides aus unserem eigenen Vorrat, zusammen ≤ 33
 * Zeichen): das macht aus „such die Zeile" ein `getRow`, und aus dem Anlegen
 * der neun Zeilen eine idempotente Handlung (ein zweiter Lauf läuft in 409
 * statt Dubletten zu bauen). Der LESER fällt trotzdem auf die Abfrage zurück
 * (`loadStepRow`) — eine Zeile aus einem späteren Import oder von Hand hat
 * diese Id nicht, und ein Leser, der sie dann nicht findet, wäre ein stiller
 * Datenverlust.
 */

export const BRAND_PROFILES_TABLE = 'brand_profiles'
export const BRAND_STEPS_TABLE = 'brand_steps'
export const BRAND_MESSAGES_TABLE = 'brand_messages'
export const BRAND_SHARES_TABLE = 'brand_shares'
export const BRAND_INVITES_TABLE = 'brand_invites'
export const BRAND_EVENTS_TABLE = 'brand_events'

export type BrandProfileRow = Models.Row & {
  createdByUserId: string
  ownerType: string
  ownerId: string
  title?: string
  contentLocale: string
  pathKind: string
  relaunchScope?: string | null
  hasName: boolean
  team: string
  subBrands?: string
  /**
   * Der Chip „Name auf den Prüfstand?" (Katalog §2.2). Optional getypt, weil
   * die Spalte mit brand-008 additiv dazukam — ein Deploy vor der Migration
   * liest `undefined`, und das ist genau der Default `false`.
   */
  namingOpted?: boolean
  progressPct: number
  currentStepKey?: string
  lastActivityAt: string
  storyBody?: string | null
  storyMeta?: string | null
  designPresetId?: string
  designPresetVersion?: string
}

export type BrandStepRow = Models.Row & {
  profileId: string
  stepKey: string
  state: BrandStoredStepState
  slots: string
  generations: string
  inputHash?: string
  revision: number
  confidence?: BrandConfidence | null
  startedAt?: string | null
  completedAt?: string | null
  activeSeconds: number
}

export type BrandMessageRow = Models.Row & {
  profileId: string
  stepKey: string
  role: string
  body: string
  parts?: string | null
  generationId?: string | null
}

export type BrandShareRow = Models.Row & {
  profileId: string
  tokenHash: string
  snapshot: string
  publishedAt: string
  expiresAt: string
  revokedAt?: string | null
}

/** Der Admin-Client + die Database-Id des Requests — EIN Aufruf statt zwei. */
export function brandDb(event: H3Event) {
  const databaseId = useRuntimeConfig(event).public.appwriteDatabaseId
  const { tablesDB } = createAdminClient(event)
  return { tablesDB, databaseId }
}

export function isAppwriteNotFound(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}

/** Deterministische Zeilen-Id eines Bausteins (s. Kopf). */
export function brandStepRowId(profileId: string, stepKey: string): string {
  return `${profileId}_${stepKey}`
}

/** Ein bekannter Baustein-Schlüssel — oder `null`. Nie geraten. */
export function toBrandStepKey(value: string | undefined): BrandStepKey | null {
  return (BRAND_STEP_KEYS as readonly string[]).includes(value ?? '')
    ? value as BrandStepKey
    : null
}

// ── Slots ───────────────────────────────────────────────────────────────────

/** Die gespeicherte Form EINES Slots (Schema-Anhang §2, Versions-Vertrag). */
export interface BrandSlotRecord {
  firstDraft?: string | null
  latestDraft?: string | null
  confirmed?: string | null
  confidence?: BrandConfidence | null
  updatedAt?: string | null
}

/**
 * `slots` ist eine JSON-Spalte. Kaputtes JSON, ein Array oder `null` ergeben
 * ein LEERES Objekt statt einer Ausnahme: eine unlesbare Spalte darf den
 * Wizard nicht unbedienbar machen — der nächste Autosave schreibt sie neu.
 * Unbekannte Slot-Ids bleiben im gelesenen Objekt (Bestandsdaten sollen
 * lesbar bleiben), gefiltert wird erst beim Hinausgeben.
 */
export function parseSlotRecords(raw: string | null | undefined): Record<string, BrandSlotRecord> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, BrandSlotRecord> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = value as BrandSlotRecord
      }
    }
    return out
  }
  catch {
    return {}
  }
}

/** Die Form, die nach draußen geht — fehlende Felder werden `null`, nie `undefined`. */
export function toSlotView(record: BrandSlotRecord | undefined): BrandSlotView {
  return {
    firstDraft: record?.firstDraft ?? null,
    latestDraft: record?.latestDraft ?? null,
    confirmed: record?.confirmed ?? null,
    confidence: record?.confidence ?? null,
    updatedAt: record?.updatedAt ?? null,
  }
}

/**
 * DER GELTENDE WERT EINES SLOTS auf der SERVER-Seite: bestätigt schlägt
 * Entwurf, letzter Entwurf schlägt ersten. Dieselbe Rangfolge wie
 * `brandSlotDisplayValue` im Client (`shared/brandAutosaveDiff.ts`) — die
 * arbeitet aber auf der HINAUSGEGEBENEN Form (`BrandSlotView`, alles `null`),
 * hier steht die GESPEICHERTE (Felder können fehlen). Ein gemeinsamer Helfer
 * müsste beide Formen kennen und wäre an keiner von beiden mehr ehrlich.
 */
export function brandSlotStoredValue(record: BrandSlotRecord | undefined): string {
  return record?.confirmed || record?.latestDraft || record?.firstDraft || ''
}

/**
 * DEAKTIVIERTE UND UNBEKANNTE SLOTS FLIEGEN BEIM HINAUSGEBEN NICHT RAUS.
 * Ein Leser muss alte Daten anzeigen können (Migrationsvertrag) — geschrieben
 * werden dürfen sie trotzdem nicht, das verhindert das Schema.
 */
export function toSlotViews(records: Record<string, BrandSlotRecord>): Record<string, BrandSlotView> {
  const out: Record<string, BrandSlotView> = {}
  for (const [slotId, record] of Object.entries(records)) out[slotId] = toSlotView(record)
  return out
}

/**
 * Die Brücke zur puren Zustandsmaschine: aus dem VERSIONS-Vertrag wird das
 * schmale Faktenpaar, mit dem `resolveBrandJourney`/`stepProgress` rechnen.
 *
 * `hasValue` = es liegt ein Entwurf vor (der Balken bewegt sich schon),
 * `confirmed` = der Mensch hat zugestimmt (erst das schliesst einen Baustein
 * ab). Genau diese zwei Fragen trennt `stepProgress` bewusst.
 */
export function toSlotFacts(records: Record<string, BrandSlotRecord>): Record<string, BrandSlotStateFacts> {
  const facts: Record<string, BrandSlotStateFacts> = {}
  for (const [slotId, record] of Object.entries(records)) {
    const confirmed = typeof record.confirmed === 'string' && record.confirmed.length > 0
    const hasValue = confirmed
      || (typeof record.latestDraft === 'string' && record.latestDraft.length > 0)
      || (typeof record.firstDraft === 'string' && record.firstDraft.length > 0)
    facts[slotId] = { hasValue, confirmed }
  }
  return facts
}

export function serializeSlotRecords(records: Record<string, BrandSlotRecord>): string {
  const json = JSON.stringify(records)
  if (json.length > BRAND_STEP_SLOTS_MAX_LENGTH) {
    // Der Deckel steht im Schema-Anhang §2 und wird hier erzwungen, weil er
    // erst NACH dem Zusammenführen entscheidbar ist: jeder einzelne Slot kann
    // unter seinem Limit liegen und die Summe trotzdem darüber.
    throw createError({
      status: 413,
      statusText: 'Step payload too large',
      data: { code: 'slots_too_large' },
    })
  }
  return json
}

/** Generations-METADATEN — Inhalte stehen dort ohnehin nicht (Log-Regel §6). */
export function parseGenerations(raw: string | null | undefined): BrandGenerationsView {
  const empty: BrandGenerationsView = { items: [], count: 0 }
  if (!raw) return empty
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty
    const record = parsed as { items?: unknown, count?: unknown }
    return {
      items: Array.isArray(record.items) ? record.items as BrandGenerationsView['items'] : [],
      count: typeof record.count === 'number' ? record.count : 0,
    }
  }
  catch {
    return empty
  }
}

export const BRAND_EMPTY_GENERATIONS = '{"items":[],"count":0}'

// ── Profil ──────────────────────────────────────────────────────────────────

/** Die Weichen-Tatsachen des Profils, so wie die pure Regel sie erwartet. */
export function profileFacts(row: BrandProfileRow): BrandProfileFacts {
  return {
    pathKind: row.pathKind === 'relaunch' ? 'relaunch' : 'new',
    relaunchScope: row.relaunchScope === 'refine' || row.relaunchScope === 'recut' ? row.relaunchScope : null,
    hasName: !!row.hasName,
    team: row.team === 'team' ? 'team' : 'solo',
    subBrands: row.subBrands === 'yes' || row.subBrands === 'no' ? row.subBrands : 'unknown',
    namingOpted: row.namingOpted === true,
  }
}

export function toProfileSummary(row: BrandProfileRow, hasActiveShare: boolean): BrandProfileSummary {
  const facts = profileFacts(row)
  return {
    id: row.$id,
    title: row.title ?? '',
    contentLocale: row.contentLocale,
    ownerType: row.ownerType === 'community' ? 'community' : 'user',
    ownerId: row.ownerId,
    pathKind: facts.pathKind,
    relaunchScope: facts.relaunchScope ?? null,
    hasName: facts.hasName,
    namingOpted: facts.namingOpted === true,
    team: facts.team,
    subBrands: facts.subBrands,
    progressPct: row.progressPct ?? 0,
    currentStepKey: row.currentStepKey ?? '',
    lastActivityAt: row.lastActivityAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
    hasActiveShare,
  }
}

/**
 * Die Brand Story mit ihren Metadaten. `storyMeta` ist eine kleine JSON-Spalte
 * ({ inputHash, generatedAt, editedByUser }); kaputtes JSON ergibt die leere
 * Form, weil eine unlesbare Nebenangabe die Story selbst nicht kosten darf.
 *
 * VERALTET ist ABGELEITET und wird deshalb NICHT hier entschieden: die Frage
 * lautet „passt `inputHash` noch zum heutigen Slot-Stand?", und die kann erst
 * beantworten, wer die Slots kennt (Schema-Anhang §2 — kein `stale`-Flag).
 */
export function toStoryView(row: BrandProfileRow): BrandStoryView {
  const fallback: BrandStoryView = {
    body: row.storyBody ?? '',
    generatedAt: null,
    editedByUser: false,
    inputHash: '',
  }
  if (!row.storyMeta) return fallback
  try {
    const parsed: unknown = JSON.parse(row.storyMeta)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
    const meta = parsed as { inputHash?: unknown, generatedAt?: unknown, editedByUser?: unknown }
    return {
      body: fallback.body,
      generatedAt: typeof meta.generatedAt === 'string' ? meta.generatedAt : null,
      editedByUser: meta.editedByUser === true,
      inputHash: typeof meta.inputHash === 'string' ? meta.inputHash : '',
    }
  }
  catch {
    return fallback
  }
}

/**
 * Profil laden UND den Besitz belegen — in dieser Reihenfolge, an EINER Stelle.
 * Eine fehlende Zeile und eine fremde Zeile antworten identisch (404): ein
 * Unterschied wäre die Bestätigung, dass es die Id gibt.
 */
export async function loadOwnedProfile(
  event: H3Event,
  userId: string,
  profileId: string,
): Promise<BrandProfileRow> {
  const { tablesDB, databaseId } = brandDb(event)
  let row: BrandProfileRow
  try {
    row = await tablesDB.getRow<BrandProfileRow>({
      databaseId, tableId: BRAND_PROFILES_TABLE, rowId: profileId,
    })
  }
  catch (error) {
    if (isAppwriteNotFound(error)) throw createError({ status: 404, statusText: 'Not Found' })
    throw toH3Error(error, 'Brand profile could not be loaded')
  }
  assertBrandOwnerAccess(event, row, userId)
  return row
}

/** Die Profil-Id aus dem Pfad — vorhanden und plausibel, sonst 404. */
export function requireProfileIdParam(event: H3Event): string {
  const id = getRouterParam(event, 'id')
  if (!id || id.length > 64) throw createError({ status: 404, statusText: 'Not Found' })
  return id
}

// ── Bausteine ───────────────────────────────────────────────────────────────

export async function loadStepRows(event: H3Event, profileId: string): Promise<BrandStepRow[]> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    const res = await tablesDB.listRows<BrandStepRow>({
      databaseId,
      tableId: BRAND_STEPS_TABLE,
      // Neun Bausteine, mehr kann es nicht geben — das Limit steht trotzdem
      // explizit da (Repo-Regel: nie das Default-25 erben).
      queries: [Query.equal('profileId', profileId), Query.limit(BRAND_STEP_KEYS.length)],
    })
    return res.rows
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return []
    throw toH3Error(error, 'Brand steps could not be loaded')
  }
}

/** Erst die abgeleitete Id, dann die Abfrage (s. Kopf). `null` = gibt es nicht. */
export async function loadStepRow(
  event: H3Event,
  profileId: string,
  stepKey: BrandStepKey,
): Promise<BrandStepRow | null> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    return await tablesDB.getRow<BrandStepRow>({
      databaseId, tableId: BRAND_STEPS_TABLE, rowId: brandStepRowId(profileId, stepKey),
    })
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) throw toH3Error(error, 'Brand step could not be loaded')
  }
  const rows = await loadStepRows(event, profileId)
  return rows.find(row => row.stepKey === stepKey) ?? null
}

/** Die gelesenen Zeilen als Fakten für `resolveBrandJourney`. */
export function toStepFacts(rows: readonly BrandStepRow[]): BrandStepFacts[] {
  const facts: BrandStepFacts[] = []
  for (const row of rows) {
    const stepKey = toBrandStepKey(row.stepKey)
    if (!stepKey) continue
    facts.push({
      stepKey,
      state: row.state,
      confidence: row.confidence ?? null,
      slots: toSlotFacts(parseSlotRecords(row.slots)),
    })
  }
  return facts
}

export function toStepSummary(row: BrandStepRow, stepKey: BrandStepKey): BrandStepSummary {
  return {
    stepKey,
    storedState: row.state,
    revision: row.revision ?? 0,
    confidence: row.confidence ?? null,
    startedAt: row.startedAt ?? null,
    completedAt: row.completedAt ?? null,
    activeSeconds: row.activeSeconds ?? 0,
  }
}

/**
 * DER GEMEINSAME EINSTIEG DER DREI BAUSTEIN-ROUTEN (lesen, speichern,
 * abschliessen): Profil laden, Besitz belegen, Baustein-Schlüssel prüfen,
 * Journey rechnen, Eintritt entscheiden — in dieser Reihenfolge und EINMAL.
 *
 * Stünde diese Kette in jeder Route, wäre sie dreimal da und irgendwann
 * zweimal richtig. Die Reihenfolge ist dabei nicht kosmetisch: der Besitz wird
 * belegt, BEVOR überhaupt eine Baustein-Zeile gelesen wird, und der Eintritt
 * entschieden, bevor irgendetwas wirkt.
 *
 * ABGEWIESEN WIRD MIT 403 UND EINEM `code` — nicht mit 404: dass es dieses
 * Profil gibt, weiss der Aufrufer an dieser Stelle bereits (es gehört ihm), es
 * gibt also nichts mehr zu verbergen. Verborgen bleibt nur, was NICHT ihm
 * gehört, und das hat `assertBrandOwnerAccess` schon eine Zeile vorher mit 404
 * beantwortet.
 */
export interface BrandStepContext {
  profile: BrandProfileRow
  stepKey: BrandStepKey
  stepRow: BrandStepRow
  stepRows: BrandStepRow[]
  journey: readonly BrandJourneyStep[]
}

export async function loadBrandStepContext(event: H3Event, userId: string): Promise<BrandStepContext> {
  const profileId = requireProfileIdParam(event)
  const profile = await loadOwnedProfile(event, userId, profileId)

  const stepKey = toBrandStepKey(getRouterParam(event, 'stepKey'))
  if (!stepKey) throw createError({ status: 404, statusText: 'Not Found' })

  const stepRows = await loadStepRows(event, profileId)
  const journey = resolveBrandJourney(profileFacts(profile), toStepFacts(stepRows))

  const entry = canEnterBrandStep(journey, stepKey)
  if (!entry.allowed) {
    throw createError({
      status: 403,
      statusText: 'Brand step is not available',
      data: { code: entry.reason ?? 'locked' },
    })
  }

  const stepRow = stepRows.find(row => row.stepKey === stepKey)
  // Kein `createRow`-Nachzügler hier: die neun Zeilen entstehen bei der Anlage
  // (index.post.ts). Fehlt eine, ist die Zeile verlorengegangen — das ist ein
  // Datenfehler und keine Gelegenheit, still eine neue anzulegen und damit den
  // Verlust zu verdecken.
  if (!stepRow) throw createError({ status: 404, statusText: 'Not Found' })

  return { profile, stepKey, stepRow, stepRows, journey }
}

// ── Fortschritt am Profil (DENORM-Cache) ────────────────────────────────────

export interface BrandProfileProgress {
  progressPct: number
  currentStepKey: string
}

/**
 * DER CACHE FÜR DIE KARTEN, aus der Journey gerechnet — nie aus dem Client.
 *
 * Gezählt wird über ALLE Bausteine, die auf dem Weg liegen: übersprungene
 * zählen weder oben noch unten (sonst könnte ein Profil mit abgewähltem Naming
 * nie 100 % erreichen). „Gerade dran" ist der erste aktive Baustein, sonst der
 * erste offene — steht nichts mehr offen, bleibt der letzte auf dem Weg.
 */
export function resolveProfileProgress(journey: readonly BrandJourneyStep[]): BrandProfileProgress {
  let total = 0
  let filled = 0
  let current = ''
  let lastOnPath = ''

  for (const step of journey) {
    if (step.state === 'skipped') continue
    lastOnPath = step.stepKey
    total += step.progress.requiredTotal
    filled += step.progress.requiredFilled
    if (!current && (step.state === 'active' || step.state === 'open')) current = step.stepKey
  }

  return {
    progressPct: total === 0 ? 100 : Math.round((filled / total) * 100),
    currentStepKey: current || lastOnPath,
  }
}

/**
 * Profil-Kopf nachziehen. FAIL-SOFT ist hier bewusst NICHT die Regel: der Cache
 * ist zwar nie Autorität, aber ein Autosave, dessen Karte danach falsch steht,
 * sieht für den Menschen wie Datenverlust aus. Wirft also weiter.
 */
export async function touchProfile(
  event: H3Event,
  profileId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { tablesDB, databaseId } = brandDb(event)
  await tablesDB.updateRow({
    databaseId,
    tableId: BRAND_PROFILES_TABLE,
    rowId: profileId,
    data: { ...data, lastActivityAt: new Date().toISOString() },
  })
}

// ── Veröffentlichungen ──────────────────────────────────────────────────────

/**
 * „Geteilt" ist ABGELEITET (Audit 5/6): eine Zeile ohne `revokedAt`, deren
 * `expiresAt` in der Zukunft liegt. Es gibt bewusst kein `visibility`-Feld, das
 * damit auseinanderlaufen könnte.
 */
export async function listActiveShares(event: H3Event, profileId: string): Promise<BrandShareRow[]> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    const res = await tablesDB.listRows<BrandShareRow>({
      databaseId,
      tableId: BRAND_SHARES_TABLE,
      queries: [
        Query.equal('profileId', profileId),
        Query.isNull('revokedAt'),
        Query.greaterThan('expiresAt', new Date().toISOString()),
        Query.limit(25),
      ],
    })
    return res.rows
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return []
    throw toH3Error(error, 'Brand shares could not be loaded')
  }
}

/**
 * `hasActiveShare` für VIELE Profile in EINER Abfrage — die Liste „Meine
 * Brandings" darf nicht je Karte eine Frage stellen (N+1). Leere Eingabe ⇒
 * leere Antwort ohne Roundtrip.
 */
export async function activeShareProfileIds(
  event: H3Event,
  profileIds: readonly string[],
): Promise<Set<string>> {
  if (!profileIds.length) return new Set()
  const { tablesDB, databaseId } = brandDb(event)
  try {
    const res = await tablesDB.listRows<BrandShareRow>({
      databaseId,
      tableId: BRAND_SHARES_TABLE,
      queries: [
        Query.equal('profileId', [...profileIds]),
        Query.isNull('revokedAt'),
        Query.greaterThan('expiresAt', new Date().toISOString()),
        Query.limit(100),
      ],
    })
    return new Set(res.rows.map(row => row.profileId))
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return new Set()
    // Eine unbeantwortbare Nebenfrage darf die Liste nicht kosten: „geteilt"
    // ist eine ANZEIGE, kein Recht. Fail-soft, aber sichtbar im Log.
    logEvent('warn', 'brand.active_shares_failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return new Set()
  }
}

/** Nur die BESTÄTIGTEN Werte eines Bausteins — Entwürfe gehören nie in einen Snapshot. */
export function confirmedSlotValues(row: BrandStepRow): { slotId: string, value: string }[] {
  const records = parseSlotRecords(row.slots)
  const out: { slotId: string, value: string }[] = []
  for (const slot of Object.keys(records)) {
    const confirmed = records[slot]?.confirmed
    if (typeof confirmed === 'string' && confirmed.length > 0) out.push({ slotId: slot, value: confirmed })
  }
  // Registry-Reihenfolge statt Objekt-Reihenfolge: ein Kapitel soll überall
  // gleich aussehen, auch wenn die Slots in anderer Folge gefüllt wurden.
  return out.sort((a, b) => slotOrder(a.slotId) - slotOrder(b.slotId))
}

/**
 * Die Katalog-Reihenfolge — EINMAL aus der Registry gebaut, nicht als zweite
 * Liste gepflegt. `BRAND_SLOTS` ist bereits in Baustein- und Katalog-Ordnung
 * (Kopf von `slotRegistry.ts`), der Index daraus ist also genau die Ordnung,
 * in der ein Kapitel gelesen werden soll. Unbekannte Ids (Bestandsdaten eines
 * älteren Katalogs) wandern ans Ende, statt zu verschwinden.
 */
const BRAND_SLOT_ORDER = new Map<string, number>(
  BRAND_SLOTS.map((slot, index) => [slot.id, index]),
)

function slotOrder(slotId: string): number {
  return BRAND_SLOT_ORDER.get(slotId) ?? Number.MAX_SAFE_INTEGER
}
