/**
 * Migration brand-007: `brand_events` — der append-only Funnel
 * (docs/plans/BRAND-WIZARD-SCHEMA.md §6). Gemeinsame Regeln aller
 * brand_*-Tabellen: Kopf von `001-brand-profiles.ts`.
 *
 * ── APPEND-ONLY ───────────────────────────────────────────────────────────
 * Es gibt keine Updates. Ein Ereignis ist eine Tatsache über einen Zeitpunkt;
 * wer es nachträglich ändert, verfälscht die Messung. Typen z. B.
 * `wizard.started`, `step.completed`, `generation.requested`, `result.rating`
 * (die eine freiwillige Abschlussfrage, §9b), `share.published`.
 *
 * ── `payload` BLEIBT KLEIN, UND ER ENTHÄLT NIE INHALT ─────────────────────
 * varchar 4096, JSON. NIE Prompt- oder Inhaltstext (Log-Regel Plan §6) — der
 * Funnel misst VERHALTEN, nicht die Marke. Eine Analyse-Tabelle, in die
 * Inhalte sickern, wird stillschweigend zu einer zweiten Kopie der
 * Nutzerdaten mit anderer Aufbewahrung und anderer Löschung.
 *
 * ── `profileId`/`userId` SIND OPTIONAL, UND DAS IST ABSICHT ───────────────
 * Ereignisse VOR der Anlage eines Brandings (Trichter-Einstieg) haben noch
 * keine profileId. Ein Pflichtfeld hätte genau die Ereignisse verhindert, für
 * die es den Funnel gibt.
 *
 * ── RETENTION: 24 MONATE ──────────────────────────────────────────────────
 * Ein Sweep im Layer räumt Älteres weg. Er läuft ohne Request und damit ohne
 * H3Event — die ESLint-Ausnahme dafür wird an DER Stelle begründet, nicht
 * durch eine Aufweichung der Regel.
 *
 * ── DER INDEX WEICHT BEWUSST VOM ANHANG AB ────────────────────────────────
 * Der Schema-Anhang nennt `idx_type_time (type, $createdAt)`. Hier steht nur
 * `idx_type (type)`: auf INTERNE Attribute legt dieses Projekt nirgends
 * Indizes (ausgeschrieben in system-021, ebenso messages-001 und
 * control-037) — Appwrite verwaltet `$createdAt` selbst, und die
 * Zeitfenster-Abfrage läuft als `orderDesc($createdAt)` auf dem gefilterten
 * Ergebnis. Ein zweiter Index über eine fremdverwaltete Spalte wäre eine
 * Ausnahme ohne Not.
 *
 * Idempotent (409 → skip). Aufruf über den Runner:
 *
 *   pnpm migrate --app portfolio --layer brand
 */
import { Client, Query, TablesDB, TablesDBIndexType } from 'node-appwrite'
import { createIndexSteps } from '../../../../scripts/migrations-lib/indexRetry.mts'

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID

const apiKey = process.env.NUXT_APPWRITE_MIGRATIONS_KEY ?? process.env.NUXT_APPWRITE_KEY
if (!process.env.NUXT_APPWRITE_MIGRATIONS_KEY) {
  console.warn('⚠️  NUXT_APPWRITE_MIGRATIONS_KEY nicht gesetzt — Fallback auf NUXT_APPWRITE_KEY.')
}
if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error('Fehlende Env-Vars — über den Runner aufrufen: pnpm migrate --app <app>')
  process.exit(1)
}

const tablesDB = new TablesDB(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey))
const { indexStep } = createIndexSteps(tablesDB, databaseId)

const EVENTS = 'brand_events'

function hasCode(error: unknown, code: number): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}
async function step(label: string, run: () => Promise<unknown>) {
  try {
    await run()
    console.log(`✔ ${label}`)
  }
  catch (error) {
    if (hasCode(error, 409)) {
      console.log(`↷ ${label} (existiert bereits)`)
      return
    }
    throw error
  }
}
async function existingColumnKeys(tableId: string): Promise<Set<string>> {
  try {
    const { columns } = await tablesDB.listColumns({
      databaseId: databaseId!, tableId, queries: [Query.limit(200)],
    })
    return new Set(columns.map(column => column.key))
  }
  catch (error) {
    if (hasCode(error, 404)) return new Set()
    throw error
  }
}
async function columnStep(label: string, key: string, existing: Set<string>, run: () => Promise<unknown>) {
  if (existing.has(key)) {
    console.log(`↷ ${label} (existiert bereits)`)
    return
  }
  await step(label, run)
}
async function waitForColumns(tableId: string) {
  for (let i = 0; i < 300; i++) {
    const { columns } = await tablesDB.listColumns({
      databaseId: databaseId!, tableId, queries: [Query.limit(200)],
    })
    if (columns.length > 0 && columns.every(c => c.status === 'available')) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Columns von "${tableId}" wurden nicht verfügbar`)
}

console.log(`Migration brand-007 gegen ${endpoint} / Projekt ${projectId} / DB ${databaseId}`)

await step(`Table ${EVENTS}`, () => tablesDB.createTable({
  databaseId, tableId: EVENTS, name: 'Brand Events', permissions: [], rowSecurity: false,
}))

{
  const cols = await existingColumnKeys(EVENTS)

  // Kein Enum: die Typ-Liste wächst mit jeder Messung, die man erst später
  // braucht — ein neuer Funnel-Schritt soll keine Migration kosten.
  await columnStep(`Column ${EVENTS}.type`, 'type', cols, () => tablesDB.createVarcharColumn({
    databaseId, tableId: EVENTS, key: 'type', size: 64, required: true,
  }))
  await columnStep(`Column ${EVENTS}.profileId`, 'profileId', cols, () => tablesDB.createVarcharColumn({
    databaseId, tableId: EVENTS, key: 'profileId', size: 64, required: false, xdefault: '',
  }))
  await columnStep(`Column ${EVENTS}.userId`, 'userId', cols, () => tablesDB.createVarcharColumn({
    databaseId, tableId: EVENTS, key: 'userId', size: 64, required: false, xdefault: '',
  }))
  await columnStep(`Column ${EVENTS}.payload`, 'payload', cols, () => tablesDB.createVarcharColumn({
    databaseId, tableId: EVENTS, key: 'payload', size: 4096, required: false, xdefault: '',
  }))

  await waitForColumns(EVENTS)

  // Die Funnel-Abfrage („wie viele wizard.started im Zeitraum?") und der
  // Retention-Sweep. Zu `$createdAt` siehe Kopf.
  await indexStep(`Index ${EVENTS}.idx_type`, {
    tableId: EVENTS, key: 'idx_type', type: TablesDBIndexType.Key, columns: ['type'],
  })
  // Löschkaskade eines Brandings …
  await indexStep(`Index ${EVENTS}.idx_profile`, {
    tableId: EVENTS, key: 'idx_profile', type: TablesDBIndexType.Key, columns: ['profileId'],
  })
  // … und die GDPR-Löschung eines KONTOS. Der Anhang nennt sie in §7
  // („events(userId) löschen"), ohne einen Index dafür zu fordern — ohne ihn
  // wäre die Löschung ein voller Durchlauf über den gesamten Funnel.
  await indexStep(`Index ${EVENTS}.idx_user`, {
    tableId: EVENTS, key: 'idx_user', type: TablesDBIndexType.Key, columns: ['userId'],
  })
}

console.log('✔ Migration brand-007 fertig')
