/**
 * AH-1-NACHZÜGLER: Communities, die noch auf das EINGEFRORENE `pool`-Projekt
 * zeigen, auf `account` umhängen.
 *
 * HINTERGRUND (gefunden 2026-08-14 über einen Reaktions-500 auf demo): der
 * Account-Cutover (AH-1, 2026-08-11) hat Schema, Rows, Dateien und Nutzer
 * nach `account` migriert und `pool` eingefroren — aber die
 * `communities.runtimeProjectId`-Zeiger der VOR dem Cutover angelegten
 * Communities blieben auf 'pool'. Folge: demo las und schrieb weiter im
 * eingefrorenen Projekt, und jede seitdem neue Tabelle (system-030…035,
 * posts-017) fehlte dort — Nav/SEO warnten fail-soft, die Reaktions-Route
 * antwortete 500.
 *
 * SICHERHEIT: der Lauf hängt NUR um, er kopiert nichts — vorher wurde die
 * Abweichung gemessen (alle 37 pool-Tabellen: 0 Änderungen seit dem Cutover;
 * Bestände t-demo beidseitig identisch: 10 posts, 8 pages, 24 comments).
 * Wo eine echte Abweichung bestünde, wäre ERST zu kopieren (F3-Werkzeug),
 * dann umzuhängen — dieser Lauf prüft deshalb defensiv erneut, dass im
 * pool-Projekt seit dem Stichtag nichts geschrieben wurde, und bricht sonst ab.
 *
 * Aufruf (Control-Plane-Env; POOL_KEY = Key des pool-Projekts für die
 * Abweichungs-Gegenprüfung):
 *   POOL_KEY=… node --env-file=$HOME/.appwrite-secrets/migrations/control.env \
 *     scripts/ops/repair-runtime-project.mjs [--apply]
 *
 * Trocken per Default. Idempotent: bereits umgehängte Zeilen sind No-ops.
 */

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const controlProject = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
const controlKey = process.env.NUXT_APPWRITE_MIGRATIONS_KEY || process.env.NUXT_APPWRITE_KEY
const poolKey = process.env.POOL_KEY
const apply = process.argv.includes('--apply')

const CUTOVER = '2026-08-11T12:00:00.000Z'
const FROZEN = 'pool'
const TARGET = 'account'

if (!endpoint || !controlProject || !controlKey || !poolKey) {
  console.error('Fehlende Env — Aufruf siehe Dateikopf (POOL_KEY nicht vergessen).')
  process.exit(1)
}

async function api(project, key, path, options = {}) {
  const res = await fetch(`${endpoint}${path}`, {
    ...options,
    headers: {
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': key,
      'content-type': 'application/json',
      ...options.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`${path} → ${res.status} ${body?.message ?? ''}`)
  return body
}

// 1. Kandidaten: alle communities-Zeilen mit dem eingefrorenen Zeiger.
//    Gefiltert im CODE, nicht in Appwrite — `runtimeProjectId` trägt keinen
//    Index, und für eine Handvoll Communities lohnt keiner.
const limitQ = encodeURIComponent(JSON.stringify({ method: 'limit', values: [100] }))
const all = await api(controlProject, controlKey, `/tablesdb/${databaseId}/tables/communities/rows?queries[]=${limitQ}`)
const rows = all.rows.filter(row => row.projectId === FROZEN)
if (!rows.length) {
  console.log('✔ Keine Community zeigt mehr auf das eingefrorene Projekt — nichts zu tun.')
  process.exit(0)
}
console.log(`${rows.length} Community(s) zeigen auf '${FROZEN}':`)
for (const row of rows) console.log(`  ${row.host} (${row.$id}, status ${row.status})`)

// 2. Defensive Gegenprüfung: hat seit dem Stichtag IRGENDJEMAND ins
//    eingefrorene Projekt geschrieben? Wenn ja, wäre Umhängen Datenverlust.
const tables = await api(FROZEN, poolKey, `/tablesdb/${databaseId}/tables?queries[]=${encodeURIComponent(JSON.stringify({ method: 'limit', values: [100] }))}`)
let dirty = 0
for (const table of tables.tables) {
  const query = encodeURIComponent(JSON.stringify({ method: 'greaterThan', attribute: '$updatedAt', values: [CUTOVER] }))
  const limit = encodeURIComponent(JSON.stringify({ method: 'limit', values: [1] }))
  const res = await api(FROZEN, poolKey, `/tablesdb/${databaseId}/tables/${table.$id}/rows?queries[]=${query}&queries[]=${limit}`)
  if (res.total > 0) {
    console.error(`✗ ${table.$id}: ${res.total} Zeile(n) seit ${CUTOVER} geändert — NICHT umhängen, erst Delta kopieren.`)
    dirty += res.total
  }
}
if (dirty > 0) process.exit(2)
console.log(`✔ Gegenprüfung: 0 Schreibvorgänge in '${FROZEN}' seit ${CUTOVER} (${tables.tables.length} Tabellen).`)

// 3. Umhängen.
if (!apply) {
  console.log(`Trockenlauf — nichts geschrieben. Mit --apply werden ${rows.length} Zeiger auf '${TARGET}' gesetzt.`)
  process.exit(0)
}
for (const row of rows) {
  await api(controlProject, controlKey, `/tablesdb/${databaseId}/tables/communities/rows/${row.$id}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { projectId: TARGET } }),
  })
  console.log(`✔ ${row.host} → ${TARGET}`)
}
console.log(`✔ ${rows.length} Zeile(n) umgehängt.`)
