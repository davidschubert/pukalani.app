/**
 * AH-4c — ein Appwrite-Projekt zieht 1:1 in ein anderes um (`control` → `admin`).
 *
 *   node --experimental-strip-types scripts/ops/ah4c-project-transfer.mjs \
 *     --phase inventory \
 *     --source-env ~/.appwrite-secrets/migrations/control.env \
 *     --target-env ~/.appwrite-secrets/migrations/admin.env
 *
 * Runbook: docs/runbooks/ADMIN-PROJEKT-CUTOVER.md · Vorbild: AH-1
 * (docs/runbooks/ACCOUNT-CUTOVER.md) · Bauform: scripts/ops/f3-comments-to-pool.mjs.
 *
 * PHASEN — in dieser Reihenfolge, und die Reihenfolge ist nicht beliebig:
 *
 *     inventory → users → rows → files → verify
 *
 * `users` VOR `rows`, weil Row-Permissions Strings mit User-Ids darin sind:
 * eine Zeile mit `read("user:…")` ins Leere ist im Ziel unsichtbar, und
 * „unsichtbar" sieht aus wie „verloren" (Runbook Schritt 3, dieselbe Lehre wie
 * bei F3). `files` danach, weil Dateien niemanden brauchen und am längsten
 * dauern.
 *
 * WAS DIESES WERKZEUG ANDERS MACHT ALS F3 (scripts/ops/f3-comments-to-pool.mjs):
 * dort zog ein SILO in einen POOL — mit Mandanten-Stempel, umgeschriebenen
 * Permissions und der Möglichkeit, Konten zusammenzuführen. Hier ist der Umzug
 * WÖRTLICH: kein `communityId`-Stempel, kein Id-Remapping, keine
 * Permission-Übersetzung. Was hier zählt, ist der VERGLEICH (siehe
 * scripts/ops/ah4c-lib/rules.mts) — er trägt den Delta-Lauf direkt vor dem
 * Env-Schnitt.
 *
 * WAS ES BEWUSST NICHT TUT:
 *   · Schema anlegen. Tabellen und Buckets kommen aus `pnpm migrate --app
 *     control` gegen das Ziel (Runbook Schritt 2). Fehlt eine, bricht der Lauf
 *     ab statt zu raten.
 *   · Etwas löschen oder in der QUELLE schreiben. Der Rückweg ist, dass das
 *     alte Projekt unverändert weiterlebt (Runbook „Wenn es schiefgeht").
 *   · Bestehendes im Ziel überschreiben, das es nicht selbst geschrieben hat:
 *     ein abweichendes KONTO wird gemeldet, nie ersetzt.
 *
 * SCHREIBT NICHTS, solange `--execute` fehlt — auch keine Berichte (dieselbe
 * Trockenlauf-Semantik wie F3: ein Trockenlauf, der Dateien anlegt, ist keiner).
 *
 * Exit 0 = Lauf sauber · Exit 1 = mindestens ein Befund.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  assertDistinctProjects,
  differingFields,
  missingInTarget,
  rowDecisionFor,
  rowPayloadOf,
  resourceFromPath,
  rowTransferOf,
  samePayload,
  samePermissions,
  scopeErrorHint,
  userDiffFields,
  userTransferPlan,
} from './ah4c-lib/rules.mts'

const PHASES = ['inventory', 'users', 'rows', 'files', 'verify']
const PAGE = 100
/** Appwrite nimmt größere Dateien nur stückweise entgegen (content-range).
 *  5 MiB ist die Größe, die auch die offiziellen SDKs verwenden. */
const CHUNK = 5 * 1024 * 1024
const RUNBOOK = 'docs/runbooks/ADMIN-PROJEKT-CUTOVER.md'

// ── Argumente ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { flags: new Set(), values: {} }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) { args.values[key] = next; i++ }
    else args.flags.add(key)
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const DRY_RUN = !args.flags.has('execute')
const SELF_TEST = args.flags.has('self-test')
const REPORT_DIR = args.values['report-dir'] ?? join(homedir(), '.appwrite-secrets', 'ah4c')

let failures = 0
const log = (...parts) => console.log(...parts)
const fail = (message) => { failures++; console.log(`✖  ${message}`) }
const warn = message => log(`⚠  ${message}`)

function usage() {
  log(`
AH-4c — Appwrite-Projekt 1:1 umziehen (control → admin)

  --phase <${PHASES.join('|')}>   Pflicht (Reihenfolge: inventory → users → rows → files → verify)
  --source-env <pfad>              Env des QUELL-Projekts (wird nur GELESEN)
  --target-env <pfad>              Env des ZIEL-Projekts (bei --phase inventory optional)
  --tables a,b                     nur diese Tabellen (Phase rows)
  --buckets a,b                    nur diese Buckets (Phase files)
  --report-dir <pfad>              Default ${REPORT_DIR}
  --execute                        SCHREIBEN. Ohne dieses Flag: Trockenlauf.
  --self-test                      Pure Regeln gegen Fixtures prüfen, ohne Netz.

Env-Dateien im Format der Migrations-Envs:
  NUXT_PUBLIC_APPWRITE_ENDPOINT / _PROJECT_ID / _DATABASE_ID,
  NUXT_APPWRITE_MIGRATIONS_KEY (sonst NUXT_APPWRITE_KEY).

Der Schlüssel der QUELLE braucht zusätzlich users.read / teams.read /
files.read — ${RUNBOOK} Schritt 0 „Transfer-Key".
`)
}

// ── Env + Clients ────────────────────────────────────────────────────────────

/** Gleicher Parser wie in f3-comments-to-pool.mjs und verify-schema-parity.mjs —
 *  bewusst dieselbe Form, damit dieselben Dateien passen. */
function parseEnvFile(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match || match[1].startsWith('#')) continue
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
  return env
}

/**
 * Angesprochen wird die REST-API, NICHT das node-appwrite-SDK — dieselbe
 * Entscheidung wie in f3-comments-to-pool.mjs: die Wurzel-`scripts/` liegen in
 * keinem Workspace-Paket, `node scripts/…` löst dort kein `node-appwrite` auf.
 * Für die DATEIEN ist es zusätzlich die einzig gangbare Form (AH-1-Lektion:
 * `getFileDownload` des Server-SDK liefert keinen Buffer-tauglichen Typ).
 */
function loadInstance(label, path) {
  if (!path) throw new Error(`${label}: Env-Pfad fehlt (--${label}-env)`)
  const expanded = path.startsWith('~/') ? join(homedir(), path.slice(2)) : path
  if (!existsSync(expanded)) throw new Error(`${label}: ${expanded} gibt es nicht`)
  const env = parseEnvFile(expanded)
  const cfg = {
    label,
    endpoint: (env.NUXT_PUBLIC_APPWRITE_ENDPOINT ?? '').replace(/\/$/, ''),
    project: env.NUXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: env.NUXT_PUBLIC_APPWRITE_DATABASE_ID,
    key: env.NUXT_APPWRITE_MIGRATIONS_KEY || env.NUXT_APPWRITE_KEY,
  }
  for (const field of ['endpoint', 'project', 'databaseId', 'key']) {
    if (!cfg[field]) throw new Error(`${label}: ${expanded} — ${field} fehlt`)
  }
  const headers = () => ({ 'X-Appwrite-Project': cfg.project, 'X-Appwrite-Key': cfg.key })

  /**
   * Ein Fehler entsteht an EINER Stelle, also gehört der Hinweis auch dorthin.
   * Beim ersten Probelauf kam der einzige echte 401 aus einer Existenzprüfung
   * mitten in einer Schleife — an einer Stelle also, an die niemand ein
   * try/catch mit Hinweis gestellt hätte. Seither trägt JEDER 401 die Zeile,
   * die sagt, welcher Scope fehlt.
   */
  const decorate = (error, path) => {
    const hint = scopeErrorHint(error.status, error.type, resourceFromPath(path))
    if (hint) { error.scopeHint = hint; error.message = `${error.message}\n   → ${hint}` }
    return error
  }

  /** JSON-Aufruf. Der Fehler trägt `status` UND `type` — `type` ist das, woran
   *  scopeErrorHint() einen fehlenden Scope von einem echten 401 unterscheidet. */
  cfg.api = async (path, method = 'GET', body) => {
    const res = await fetch(`${cfg.endpoint}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(`${cfg.label} ${method} ${path} → ${res.status} ${json.message ?? ''}`.trim())
      error.status = res.status
      error.type = json.type
      throw decorate(error, path)
    }
    return json
  }

  /** Roh — für Datei-Bytes (kein JSON) und für multipart-Uploads. */
  cfg.raw = async (path, init = {}) => {
    const res = await fetch(`${cfg.endpoint}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let parsed = {}
      try { parsed = JSON.parse(text) } catch { /* Binär-Antwort ohne JSON */ }
      const error = new Error(`${cfg.label} ${init.method ?? 'GET'} ${path} → ${res.status} ${parsed.message ?? ''}`.trim())
      error.status = res.status
      error.type = parsed.type
      throw decorate(error, path)
    }
    return res
  }
  return cfg
}

/**
 * Beide Instanzen öffnen, den Kopf drucken und die Selbst-Umzug-Sperre ziehen.
 * Jede Phase beginnt hiermit — die zwei Projekt-Ids stehen deshalb in JEDEM
 * Lauf im Protokoll, auch im Trockenlauf.
 */
function openPair({ targetOptional = false } = {}) {
  const source = loadInstance('source', args.values['source-env'])
  const target = args.values['target-env']
    ? loadInstance('target', args.values['target-env'])
    : null
  if (!target && !targetOptional) throw new Error('target: Env-Pfad fehlt (--target-env)')
  if (target) assertDistinctProjects(source.project, target.project)

  log(`   Quelle: ${source.project} @ ${source.endpoint} (db ${source.databaseId}) — wird NUR gelesen`)
  log(`   Ziel:   ${target ? `${target.project} @ ${target.endpoint} (db ${target.databaseId})` : 'nicht angegeben'}`)
  return { source, target }
}

// Query-Bausteine (das SDK würde sie genauso als JSON serialisieren).
const qLimit = value => ({ method: 'limit', values: [value] })
const qOffset = value => ({ method: 'offset', values: [value] })
const qCursorAfter = value => ({ method: 'cursorAfter', values: [value] })
const queryString = queries => queries.map(query => `queries[]=${encodeURIComponent(JSON.stringify(query))}`).join('&')
const withQueries = (path, queries) => (queries.length ? `${path}?${queryString(queries)}` : path)

const tablesPath = (instance, queries = []) => withQueries(`/tablesdb/${instance.databaseId}/tables`, queries)
const rowsPath = (instance, tableId, queries = []) =>
  withQueries(`/tablesdb/${instance.databaseId}/tables/${tableId}/rows`, queries)
const rowPath = (instance, tableId, rowId) => `/tablesdb/${instance.databaseId}/tables/${tableId}/rows/${rowId}`
const filesPath = (bucketId, queries = []) => withQueries(`/storage/buckets/${bucketId}/files`, queries)
const filePath = (bucketId, fileId) => `/storage/buckets/${bucketId}/files/${fileId}`

// ── kleine Helfer ────────────────────────────────────────────────────────────

function writeJson(path, data) {
  if (DRY_RUN) { log(`   (Trockenlauf) würde schreiben: ${path}`); return }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  log(`   geschrieben: ${path}`)
}

const isConflict = error => error?.status === 409
const isMissing = error => error?.status === 404
/** 404 zu `null` machen — sonst trüge jede Existenzprüfung ein try/catch. */
const orNull = error => (isMissing(error) ? null : Promise.reject(error))

/**
 * Fehler melden. Den Scope-Hinweis trägt die Meldung bereits (s. `decorate`) —
 * hier wird nur noch entschieden, ob er den Lauf ROT macht. In `inventory`
 * nicht: dieser Lauf gehört laut Runbook VOR die Ausstellung des
 * Transfer-Keys und ist genau das Werkzeug, mit dem man sein Fehlen merkt.
 */
function reportScoped(error, { fatal = true } = {}) {
  const message = error?.message ?? String(error)
  if (fatal) fail(message)
  else warn(message)
  return Boolean(error?.scopeHint)
}

/** Alle Zeilen einer Tabelle, seitenweise. Immer explizites limit. */
async function* eachRow(instance, tableId, queries = []) {
  let cursor = null
  for (;;) {
    const page = await instance.api(rowsPath(instance, tableId, [
      ...queries, qLimit(PAGE), ...(cursor ? [qCursorAfter(cursor)] : []),
    ]))
    for (const row of page.rows) yield row
    if (page.rows.length < PAGE) return
    cursor = page.rows[page.rows.length - 1].$id
  }
}

async function countRows(instance, tableId) {
  const page = await instance.api(rowsPath(instance, tableId, [qLimit(1)]))
  return page.total
}

async function listTableIds(instance) {
  const page = await instance.api(tablesPath(instance, [qLimit(500)]))
  return page.tables.map(table => table.$id).sort()
}

async function listBucketIds(instance) {
  const page = await instance.api(withQueries('/storage/buckets', [qLimit(500)]))
  return page.buckets.map(bucket => bucket.$id).sort()
}

async function* eachFile(instance, bucketId) {
  let cursor = null
  for (;;) {
    const page = await instance.api(filesPath(bucketId, [
      qLimit(PAGE), ...(cursor ? [qCursorAfter(cursor)] : []),
    ]))
    for (const file of page.files) yield file
    if (page.files.length < PAGE) return
    cursor = page.files[page.files.length - 1].$id
  }
}

async function countFiles(instance, bucketId) {
  const page = await instance.api(filesPath(bucketId, [qLimit(1)]))
  return page.total
}

async function* eachUser(instance) {
  let cursor = null
  for (;;) {
    const page = await instance.api(withQueries('/users', [qLimit(PAGE), ...(cursor ? [qCursorAfter(cursor)] : [])]))
    for (const user of page.users) yield user
    if (page.users.length < PAGE) return
    cursor = page.users[page.users.length - 1].$id
  }
}

/** HashPlan-Methode → REST-Endpunkt der Users-API (identisch zu F3). */
const CREATE_PATHS = {
  create: '/users',
  createBcryptUser: '/users/bcrypt',
  createArgon2User: '/users/argon2',
  createMD5User: '/users/md5',
  createPHPassUser: '/users/phpass',
  createSHAUser: '/users/sha',
  createScryptUser: '/users/scrypt',
  createScryptModifiedUser: '/users/scrypt-modified',
}

// ── Phase: inventory ─────────────────────────────────────────────────────────

/**
 * Read-only. Fehlende Scopes sind hier eine WARNUNG und kein Befund: dieser
 * Lauf gehört laut Runbook VOR die Ausstellung des Transfer-Keys — er ist
 * genau das Werkzeug, mit dem man merkt, dass er fehlt.
 */
async function phaseInventory() {
  const { source, target } = openPair({ targetOptional: true })
  log('')

  const report = { at: new Date().toISOString(), source: source.project, target: target?.project ?? null }

  // Tabellen + Zeilen
  const sourceTables = await listTableIds(source)
  const targetTables = target ? await listTableIds(target).catch(() => null) : null
  const tables = []
  let rowTotal = 0
  for (const tableId of sourceTables) {
    const here = await countRows(source, tableId)
    const there = targetTables?.includes(tableId) ? await countRows(target, tableId).catch(() => null) : null
    rowTotal += here
    tables.push({ tableId, source: here, target: there })
  }
  log(`  Tabellen: ${sourceTables.length} · Zeilen gesamt: ${rowTotal}`)
  for (const entry of tables) {
    const right = target ? (targetTables?.includes(entry.tableId) ? String(entry.target ?? '?') : 'FEHLT') : '—'
    log(`    ${entry.tableId.padEnd(26)} ${String(entry.source).padStart(5)}  →  ${right}`)
  }
  if (targetTables) {
    const missing = missingInTarget(sourceTables, targetTables)
    if (missing.length) warn(`Im Ziel fehlen ${missing.length} Tabelle(n): ${missing.join(', ')} — Runbook Schritt 2 (pnpm migrate --app control gegen das Ziel).`)
  }
  report.tables = tables
  report.rowTotal = rowTotal

  // Buckets + Dateien
  log('\n  Buckets:')
  const buckets = []
  try {
    const sourceBuckets = await listBucketIds(source)
    const targetBuckets = target ? await listBucketIds(target).catch(() => null) : null
    for (const bucketId of sourceBuckets) {
      let here = null
      try { here = await countFiles(source, bucketId) }
      catch (error) { reportScoped(error, { fatal: false }); here = null }
      const there = targetBuckets?.includes(bucketId)
        ? await countFiles(target, bucketId).catch(() => null)
        : null
      buckets.push({ bucketId, source: here, target: there })
      log(`    ${bucketId.padEnd(26)} ${String(here ?? '?').padStart(5)}  →  ${target ? (targetBuckets?.includes(bucketId) ? String(there ?? '?') : 'FEHLT') : '—'}`)
    }
    if (targetBuckets) {
      const missing = missingInTarget(sourceBuckets, targetBuckets)
      if (missing.length) warn(`Im Ziel fehlen ${missing.length} Bucket(s): ${missing.join(', ')} — Runbook Schritt 2.`)
    }
  } catch (error) {
    reportScoped(error, { fatal: false })
  }
  report.buckets = buckets

  // Konten + Teams — die zwei Zahlen, die im Runbook noch leer stehen.
  log('\n  Konten und Teams:')
  try {
    const page = await source.api(withQueries('/users', [qLimit(1)]))
    const targetTotal = target ? (await target.api(withQueries('/users', [qLimit(1)])).catch(() => null))?.total ?? null : null
    log(`    Users: Quelle ${page.total}${target ? ` · Ziel ${targetTotal ?? '?'}` : ''}`)
    report.users = { source: page.total, target: targetTotal }

    // Hash-Verfahren zählen — Runbook Schritt 0 fragt danach.
    const hashes = new Map()
    let withoutPassword = 0
    let unsupported = 0
    for await (const user of eachUser(source)) {
      const plan = userTransferPlan(user)
      if (plan.action === 'create-without-password') { withoutPassword++; continue }
      if (plan.action === 'unsupported') { unsupported++; hashes.set(`${plan.hash} (NICHT übernehmbar)`, (hashes.get(`${plan.hash} (NICHT übernehmbar)`) ?? 0) + 1); continue }
      const label = user.hash ?? '(leer)'
      hashes.set(label, (hashes.get(label) ?? 0) + 1)
    }
    log(`    davon OTP-only (ohne Passwort): ${withoutPassword}`)
    log(`    Hash-Verfahren: ${hashes.size ? [...hashes].map(([hash, n]) => `${hash}=${n}`).join(' · ') : '—'}`)
    if (unsupported) warn(`${unsupported} Konto/Konten mit nicht übernehmbarem Hash-Verfahren — sie kämen ohne Passwort NICHT mit.`)
    report.hashes = Object.fromEntries(hashes)
    report.usersWithoutPassword = withoutPassword
  } catch (error) {
    reportScoped(error, { fatal: false })
    report.users = null
  }

  try {
    const page = await source.api(withQueries('/teams', [qLimit(1)]))
    const targetTotal = target ? (await target.api(withQueries('/teams', [qLimit(1)])).catch(() => null))?.total ?? null : null
    log(`    Teams: Quelle ${page.total}${target ? ` · Ziel ${targetTotal ?? '?'}` : ''}`)
    report.teams = { source: page.total, target: targetTotal }
  } catch (error) {
    reportScoped(error, { fatal: false })
    report.teams = null
  }

  writeJson(join(REPORT_DIR, 'inventory.json'), report)
  log('\n  Nächster Schritt: --phase users')
}

// ── Phase: users ─────────────────────────────────────────────────────────────

async function phaseUsers() {
  const { source, target } = openPair()
  log('')

  let created = 0
  let skipped = 0
  let mismatched = 0
  let blocked = 0
  const entries = []

  let users
  try {
    users = []
    for await (const user of eachUser(source)) users.push(user)
  } catch (error) {
    reportScoped(error)
    return
  }

  for (const user of users) {
    const existing = await target.api(`/users/${user.$id}`).catch(orNull)
    if (existing) {
      const differences = userDiffFields(user, existing)
      if (differences.length === 0) { skipped++; continue }
      // NIE stumm überschreiben: die Id ist im Ziel belegt, und wer sie belegt
      // hat, weiß dieses Werkzeug nicht.
      mismatched++
      entries.push({ userId: user.$id, result: 'mismatch', fields: differences })
      warn(`${user.$id} steht im Ziel MIT ANDEREN Werten (${differences.join(', ')}) — nicht angefasst.`)
      continue
    }

    const plan = userTransferPlan(user)
    if (plan.action === 'unsupported') {
      blocked++
      entries.push({ userId: user.$id, result: 'unsupported_hash', hash: plan.hash })
      fail(`${user.$id}: Hash-Verfahren "${plan.hash}" übernimmt die Users-API nicht — Konto NICHT angelegt.`)
      continue
    }

    if (DRY_RUN) {
      created++
      entries.push({ userId: user.$id, result: 'would_create', method: plan.method })
      log(`  + ${user.$id} (Trockenlauf, ${plan.method})`)
      continue
    }

    // Id BEHALTEN — beim 1:1-Umzug ist das keine Optimierung, sondern die
    // Bedingung: die Row-Permissions der nächsten Phase nennen diese Ids.
    const body = { userId: user.$id, email: user.email, name: user.name }
    if (plan.action === 'create-with-hash') {
      body.password = user.password
      if (plan.method === 'createSHAUser') body.passwordVersion = plan.plan.passwordVersion
      if (plan.method === 'createScryptUser' || plan.method === 'createScryptModifiedUser') {
        Object.assign(body, plan.plan.options)
      }
    }
    await target.api(CREATE_PATHS[plan.method], 'POST', body)

    // Alles, was `POST /users` nicht mitnimmt, hängt an eigenen Endpunkten.
    // Ohne die Verifikations-Flags müsste sich jeder Mensch seine Adresse ein
    // zweites Mal bestätigen lassen (AH-1-Lektion).
    if (user.phone) await target.api(`/users/${user.$id}/phone`, 'PATCH', { number: user.phone }).catch(error => warn(`${user.$id}: Telefonnummer nicht übernommen (${error?.message ?? error})`))
    if (user.prefs && Object.keys(user.prefs).length) await target.api(`/users/${user.$id}/prefs`, 'PATCH', { prefs: user.prefs })
    if (user.labels?.length) await target.api(`/users/${user.$id}/labels`, 'PUT', { labels: user.labels })
    if (user.emailVerification) await target.api(`/users/${user.$id}/verification`, 'PATCH', { emailVerification: true })
    if (user.phoneVerification) await target.api(`/users/${user.$id}/verification/phone`, 'PATCH', { phoneVerification: true })
    // `status: false` heißt gesperrt — der Default beim Anlegen ist aktiv,
    // also nur der gesperrte Fall braucht einen Handgriff.
    if (user.status === false) await target.api(`/users/${user.$id}/status`, 'PATCH', { status: false })

    created++
    entries.push({ userId: user.$id, result: 'created', method: plan.method })
    log(`  + ${user.$id} (${plan.method})`)
  }

  log(`\n  Konten: angelegt ${created} · schon gleich ${skipped} · abweichend ${mismatched} · blockiert ${blocked}`)

  // ── Teams ──────────────────────────────────────────────────────────────────
  // Anders als bei F3 wandern Teams MIT: das Ziel ist dasselbe Projekt unter
  // neuem Namen, ein Team bedeutet dort dasselbe wie hier.
  const teams = { created: 0, skipped: 0, memberships: 0 }
  try {
    const page = await source.api(withQueries('/teams', [qLimit(PAGE)]))
    for (const team of page.teams) {
      const existing = await target.api(`/teams/${team.$id}`).catch(orNull)
      if (existing) teams.skipped++
      else if (DRY_RUN) teams.created++
      else {
        await target.api('/teams', 'POST', { teamId: team.$id, name: team.name })
        if (team.prefs && Object.keys(team.prefs).length) {
          await target.api(`/teams/${team.$id}/prefs`, 'PUT', { prefs: team.prefs })
        }
        teams.created++
      }
      const members = await source.api(withQueries(`/teams/${team.$id}/memberships`, [qLimit(PAGE)]))
      for (const membership of members.memberships) {
        if (DRY_RUN) { teams.memberships++; continue }
        try {
          // Mit `userId` (statt E-Mail) lädt Appwrite niemanden ein, sondern
          // trägt direkt ein — es geht also keine Mail an einen Betreiber.
          await target.api(`/teams/${team.$id}/memberships`, 'POST', { userId: membership.userId, roles: membership.roles })
          teams.memberships++
        } catch (error) {
          if (isConflict(error)) continue
          warn(`Team ${team.$id}: Mitgliedschaft ${membership.userId} nicht übernommen (${error?.message ?? error})`)
        }
      }
    }
    log(`  Teams: angelegt ${teams.created} · vorhanden ${teams.skipped} · Mitgliedschaften ${teams.memberships}`)
  } catch (error) {
    reportScoped(error)
  }

  writeJson(join(REPORT_DIR, 'users-report.json'), {
    at: new Date().toISOString(),
    dryRun: DRY_RUN,
    source: source.project,
    target: target.project,
    counts: { created, skipped, mismatched, blocked },
    teams,
    // Bewusst nur Ids und FELDNAMEN, keine Werte: der Bericht liegt außerhalb
    // des Repos, soll aber trotzdem so wenig Personenbezug wie möglich tragen.
    entries,
  })
  log('\n  Nächster Schritt: --phase rows')
}

// ── Phase: rows ──────────────────────────────────────────────────────────────

async function phaseRows() {
  const { source, target } = openPair()

  const sourceTables = await listTableIds(source)
  const targetTables = await listTableIds(target)
  const missing = missingInTarget(sourceTables, targetTables)
  if (missing.length) {
    throw new Error(`Im Ziel fehlen ${missing.length} Tabelle(n): ${missing.join(', ')}. `
      + `Erst \`pnpm migrate --app control\` gegen das ZIEL fahren — ${RUNBOOK} Schritt 2. `
      + 'Dieses Werkzeug kopiert Inhalte und legt kein Schema an.')
  }

  const only = args.values.tables?.split(',').map(part => part.trim()).filter(Boolean) ?? null
  const tableIds = only ?? sourceTables
  if (only) log(`  --tables: nur ${only.join(', ')}`)
  log('')

  const summary = []
  for (const tableId of tableIds) {
    let seen = 0; let wrote = 0; let updated = 0; let same = 0; let conflicted = 0
    const changed = []
    try {
      for await (const row of eachRow(source, tableId)) {
        seen++
        const existing = await target.api(rowPath(target, tableId, row.$id)).catch(orNull)
        const decision = rowDecisionFor(row, existing)
        if (decision.action === 'skip') { same++; continue }
        if (decision.action === 'update') changed.push({ rowId: row.$id, fields: decision.fields })

        const transfer = rowTransferOf(row)
        if (DRY_RUN) {
          if (decision.action === 'create') wrote++
          else updated++
          continue
        }

        if (decision.action === 'update') {
          await target.api(rowPath(target, tableId, row.$id), 'PATCH', {
            data: transfer.data,
            permissions: transfer.permissions,
          })
          updated++
          continue
        }

        try {
          await target.api(rowsPath(target, tableId), 'POST', transfer)
          wrote++
        } catch (error) {
          if (!isConflict(error)) throw error
          // 409 heißt hier NICHT „Id belegt" (danach wurde gerade gefragt),
          // sondern: ein UNIQUE-Index schlägt zu — eine FREMDE Zeile im Ziel
          // trägt denselben Schlüssel. Blind zu aktualisieren wäre stiller
          // Datenverlust an einer Zeile, die uns nicht gehört.
          conflicted++
        }
      }
    } catch (error) {
      reportScoped(error)
      continue
    }
    if (conflicted) fail(`${tableId}: ${conflicted} Zeile(n) mit UNIQUE-Konflikt — von Hand ansehen`)
    summary.push({ tableId, seen, created: wrote, updated, unchanged: same, conflicted, changed })
    log(`  ${tableId.padEnd(26)} gelesen ${String(seen).padStart(5)} · neu ${String(wrote).padStart(5)} · aktualisiert ${String(updated).padStart(5)} · unverändert ${String(same).padStart(5)}`)
  }

  const totals = summary.reduce((acc, entry) => ({
    seen: acc.seen + entry.seen,
    created: acc.created + entry.created,
    updated: acc.updated + entry.updated,
    unchanged: acc.unchanged + entry.unchanged,
  }), { seen: 0, created: 0, updated: 0, unchanged: 0 })
  log(`\n  Summe: gelesen ${totals.seen} · ${DRY_RUN ? 'würde anlegen' : 'angelegt'} ${totals.created} · ${DRY_RUN ? 'würde aktualisieren' : 'aktualisiert'} ${totals.updated} · unverändert ${totals.unchanged}`)

  writeJson(join(REPORT_DIR, 'rows-report.json'), {
    at: new Date().toISOString(), dryRun: DRY_RUN, source: source.project, target: target.project, totals, tables: summary,
  })
  log('\n  Nächster Schritt: --phase files')
}

// ── Phase: files ─────────────────────────────────────────────────────────────

/** Bytes einer Datei — per REST, nie über das SDK (AH-1: `getFileDownload`
 *  liefert keinen Buffer-tauglichen Typ). */
async function downloadFile(instance, bucketId, fileId) {
  const res = await instance.raw(`${filePath(bucketId, fileId)}/download`)
  return new Uint8Array(await res.arrayBuffer())
}

/**
 * Upload mit Id-Erhalt und Permissions. Stückweise, weil Appwrite größere
 * Dateien nur über `content-range` annimmt; die Id wandert ab dem zweiten
 * Stück zusätzlich im Header `x-appwrite-id`, sonst legt der Server für jedes
 * Stück eine neue Datei an.
 */
async function uploadFile(instance, bucketId, file, bytes) {
  const total = bytes.byteLength
  const name = file.name || file.$id
  const type = file.mimeType || 'application/octet-stream'
  let last = null
  for (let start = 0; start < Math.max(total, 1); start += CHUNK) {
    const end = Math.min(start + CHUNK, total)
    const form = new FormData()
    form.append('fileId', file.$id)
    for (const permission of file.$permissions ?? []) form.append('permissions[]', permission)
    form.append('file', new Blob([bytes.subarray(start, end)], { type }), name)
    const headers = { 'x-appwrite-id': file.$id }
    if (total > CHUNK) headers['content-range'] = `bytes ${start}-${end - 1}/${total}`
    const res = await instance.raw(filesPath(bucketId), { method: 'POST', body: form, headers })
    last = await res.json().catch(() => null)
  }
  return last
}

async function phaseFiles() {
  const { source, target } = openPair()

  const sourceBuckets = await listBucketIds(source)
  const targetBuckets = await listBucketIds(target)
  const missing = missingInTarget(sourceBuckets, targetBuckets)
  if (missing.length) {
    throw new Error(`Im Ziel fehlen ${missing.length} Bucket(s): ${missing.join(', ')}. `
      + `Erst Schema/Buckets anlegen — ${RUNBOOK} Schritt 2 (die AH-1-Lücke: avatars und `
      + 'gdpr-exports existierten dort nur von Hand). Dieses Werkzeug legt keine Buckets an.')
  }

  const only = args.values.buckets?.split(',').map(part => part.trim()).filter(Boolean) ?? null
  const bucketIds = only ?? sourceBuckets
  if (only) log(`  --buckets: nur ${only.join(', ')}`)
  log('')

  const summary = []
  for (const bucketId of bucketIds) {
    let seen = 0; let copied = 0; let skipped = 0; let bytes = 0
    try {
      for await (const file of eachFile(source, bucketId)) {
        seen++
        const existing = await target.api(filePath(bucketId, file.$id)).catch(orNull)
        // Eine Datei ist unveränderlich: gleiche Id im Ziel ⇒ nichts zu tun.
        // Ein Byte-Vergleich gehört in die Phase verify, nicht in jeden Lauf.
        if (existing) { skipped++; continue }
        if (DRY_RUN) { copied++; bytes += file.sizeOriginal ?? 0; continue }
        const payload = await downloadFile(source, bucketId, file.$id)
        await uploadFile(target, bucketId, file, payload)
        copied++
        bytes += payload.byteLength
      }
    } catch (error) {
      reportScoped(error)
      continue
    }
    summary.push({ bucketId, seen, copied, skipped, bytes })
    log(`  ${bucketId.padEnd(26)} gelesen ${String(seen).padStart(5)} · ${DRY_RUN ? 'würde kopieren' : 'kopiert'} ${String(copied).padStart(5)} · vorhanden ${String(skipped).padStart(5)}`)
  }

  writeJson(join(REPORT_DIR, 'files-report.json'), {
    at: new Date().toISOString(), dryRun: DRY_RUN, source: source.project, target: target.project, buckets: summary,
  })
  log('\n  Nächster Schritt: --phase verify')
}

// ── Phase: verify ────────────────────────────────────────────────────────────

/** Eine Zeile an einer bestimmten Position — ohne die Tabelle zu laden. */
async function rowAt(instance, tableId, offset) {
  const page = await instance.api(rowsPath(instance, tableId, [qLimit(1), qOffset(offset)]))
  return page.rows[0] ?? null
}

async function phaseVerify() {
  const { source, target } = openPair()
  log('\n  Zählstände:')

  const report = { at: new Date().toISOString(), source: source.project, target: target.project }

  // 1 · Tabellen
  const sourceTables = await listTableIds(source)
  const targetTables = await listTableIds(target)
  const tables = []
  for (const tableId of sourceTables) {
    const here = await countRows(source, tableId)
    if (!targetTables.includes(tableId)) { fail(`${tableId}: fehlt im ZIEL`); tables.push({ tableId, source: here, target: null }); continue }
    const there = await countRows(target, tableId)
    if (there !== here) fail(`${tableId}: Quelle ${here} · Ziel ${there}`)
    tables.push({ tableId, source: here, target: there })
    log(`    ${there === here ? '✔' : '✖'} ${tableId.padEnd(26)} ${String(here).padStart(5)} / ${String(there).padStart(5)}`)
  }
  report.tables = tables

  // 2 · Konten
  try {
    const here = (await source.api(withQueries('/users', [qLimit(1)]))).total
    const there = (await target.api(withQueries('/users', [qLimit(1)]))).total
    if (there < here) fail(`Users: Quelle ${here} · Ziel ${there}`)
    log(`    ${there >= here ? '✔' : '✖'} ${'users'.padEnd(26)} ${String(here).padStart(5)} / ${String(there).padStart(5)}`)
    report.users = { source: here, target: there }
  } catch (error) {
    reportScoped(error)
  }

  // 3 · Buckets
  const buckets = []
  try {
    for (const bucketId of await listBucketIds(source)) {
      const here = await countFiles(source, bucketId)
      const there = await countFiles(target, bucketId).catch(() => null)
      if (there !== here) fail(`Bucket ${bucketId}: Quelle ${here} · Ziel ${there ?? 'FEHLT'}`)
      buckets.push({ bucketId, source: here, target: there })
      log(`    ${there === here ? '✔' : '✖'} ${bucketId.padEnd(26)} ${String(here).padStart(5)} / ${String(there ?? '?').padStart(5)}`)
    }
  } catch (error) {
    reportScoped(error)
  }
  report.buckets = buckets

  // 4 · Stichproben: 10 zufällige Zeilen, TIEF verglichen (inkl. Permissions).
  //    Zähler allein beweisen nichts über den INHALT — eine leere Zeile mit
  //    richtiger Id zählt genauso wie die echte.
  log('\n  Zeilen-Stichproben (Nutzdaten + Permissions, deep-equal):')
  const populated = tables.filter(entry => entry.source > 0 && entry.target !== null)
  const samples = []
  for (let i = 0; i < 10 && populated.length; i++) {
    const table = populated[Math.floor(Math.random() * populated.length)]
    const offset = Math.floor(Math.random() * table.source)
    const row = await rowAt(source, table.tableId, offset)
    if (!row) continue
    const twin = await target.api(rowPath(target, table.tableId, row.$id)).catch(orNull)
    if (!twin) {
      fail(`Stichprobe ${table.tableId}/${row.$id}: im Ziel nicht vorhanden`)
      samples.push({ tableId: table.tableId, rowId: row.$id, ok: false, reason: 'missing' })
      continue
    }
    const dataOk = samePayload(rowPayloadOf(row), rowPayloadOf(twin))
    const permissionsOk = samePermissions(row.$permissions ?? [], twin.$permissions ?? [])
    if (!dataOk || !permissionsOk) {
      fail(`Stichprobe ${table.tableId}/${row.$id}: ${dataOk ? 'Permissions' : 'Nutzdaten'} weichen ab (${differingFields(rowPayloadOf(row), rowPayloadOf(twin)).join(', ') || 'Permissions'})`)
    }
    samples.push({ tableId: table.tableId, rowId: row.$id, ok: dataOk && permissionsOk })
    log(`    ${dataOk && permissionsOk ? '✔' : '✖'} ${table.tableId}/${row.$id}`)
  }
  report.samples = samples

  // 5 · Zwei Datei-Stichproben: Byte-LÄNGE beidseitig. Ein Upload, der die
  //    Bytes verliert, hinterlässt trotzdem eine Datei mit richtiger Id.
  log('\n  Datei-Stichproben (Byte-Länge):')
  const fileSamples = []
  try {
    // Erst die Kandidaten sammeln, dann laden — ein Abbruch mitten in einer
    // geschachtelten Schleife wäre hier nur ein Sprung mit Etikett.
    const candidates = []
    for (const bucketId of await listBucketIds(source)) {
      const page = await source.api(filesPath(bucketId, [qLimit(2)]))
      for (const file of page.files) candidates.push({ bucketId, fileId: file.$id })
    }
    for (const candidate of candidates.slice(0, 2)) {
      const here = await downloadFile(source, candidate.bucketId, candidate.fileId)
      const there = await downloadFile(target, candidate.bucketId, candidate.fileId).catch(() => null)
      const ok = there !== null && there.byteLength === here.byteLength
      if (!ok) fail(`Datei ${candidate.bucketId}/${candidate.fileId}: Quelle ${here.byteLength} B · Ziel ${there === null ? 'nicht lesbar' : `${there.byteLength} B`}`)
      log(`    ${ok ? '✔' : '✖'} ${candidate.bucketId}/${candidate.fileId} — ${here.byteLength} B`)
      fileSamples.push({ ...candidate, bytes: here.byteLength, ok })
    }
    if (fileSamples.length === 0) log('    (keine Datei vorhanden)')
  } catch (error) {
    reportScoped(error)
  }
  report.fileSamples = fileSamples

  writeJson(join(REPORT_DIR, 'verify-report.json'), { ...report, failures })
}

// ── Selbsttest: die puren Regeln gegen erfundene Fixtures ────────────────────

function selfTest() {
  log('\n▸ Selbsttest der puren Regeln (kein Netz, erfundene Fixtures)\n')
  const checks = []
  const check = (name, condition) => { checks.push({ name, ok: Boolean(condition) }) }

  // 1 · Nutzdaten und Meta
  const row = {
    $id: 'r1',
    $permissions: ['read("any")', 'update("user:u1")'],
    $createdAt: '2026-01-01T00:00:00.000Z',
    $updatedAt: '2026-01-02T00:00:00.000Z',
    $tableId: 't',
    $databaseId: 'main',
    $sequence: 7,
    title: 'Hallo',
    tags: ['a', 'b'],
  }
  const payload = rowPayloadOf(row)
  check('Nutzdaten ohne $-Felder', Object.keys(payload).join() === 'title,tags')
  check('$id und $permissions sind KEINE Spalten', !('$id' in payload) && !('$permissions' in payload))
  const transfer = rowTransferOf(row)
  check('Transfer behält Id und Permissions', transfer.rowId === 'r1' && transfer.permissions.length === 2)

  // 2 · Vergleich
  check('gleiche Nutzdaten ⇒ gleich', samePayload(payload, { title: 'Hallo', tags: ['a', 'b'] }))
  check('anderer Wert ⇒ NICHT gleich', !samePayload(payload, { title: 'Hallo!', tags: ['a', 'b'] }))
  check('fehlendes Feld ⇒ NICHT gleich', !samePayload(payload, { title: 'Hallo' }))
  check('Zahl ist kein String', !samePayload({ n: 1 }, { n: '1' }))
  check('gewöhnliches Array bleibt reihenfolge-treu', !samePayload({ tags: ['a', 'b'] }, { tags: ['b', 'a'] }))
  check('Permissions-Reihenfolge ist egal', samePermissions(['a', 'b'], ['b', 'a']))
  check('fehlende Permission fällt auf', !samePermissions(['a', 'b'], ['a']))

  // 3 · Delta-Entscheidung
  check('Zeile fehlt ⇒ create', rowDecisionFor(row, null).action === 'create')
  check('identische Zeile ⇒ skip', rowDecisionFor(row, { ...row, $updatedAt: 'egal' }).action === 'skip')
  check('Permissions gedreht ⇒ trotzdem skip',
    rowDecisionFor(row, { ...row, $permissions: ['update("user:u1")', 'read("any")'] }).action === 'skip')
  const update = rowDecisionFor(row, { ...row, title: 'Anders' })
  check('anderer Inhalt ⇒ update mit Feldnamen', update.action === 'update' && update.fields.join() === 'title')
  const permissionChange = rowDecisionFor(row, { ...row, $permissions: ['read("any")'] })
  check('andere Permissions ⇒ update', permissionChange.action === 'update' && permissionChange.fields.includes('$permissions'))

  // 4 · Konten
  check('OTP-only ⇒ ohne Passwort', userTransferPlan({ $id: 'u1' }).action === 'create-without-password')
  const bcrypt = userTransferPlan({ $id: 'u2', password: 'hash', hash: 'bcrypt' })
  check('bcrypt ⇒ eigener Endpunkt', bcrypt.action === 'create-with-hash' && bcrypt.method === 'createBcryptUser')
  check('plaintext ⇒ /users MIT Passwort',
    userTransferPlan({ $id: 'u3', password: 'geheim', hash: 'plaintext' }).method === 'create')
  const quantum = userTransferPlan({ $id: 'u4', password: 'x', hash: 'quantum' })
  check('unbekannter Hash ⇒ fail-closed', quantum.action === 'unsupported' && quantum.hash === 'quantum')
  const person = { $id: 'u1', email: 'a@b.de', name: 'A', labels: ['admin'], prefs: { x: 1 }, emailVerification: true, status: true }
  check('gleiches Konto ⇒ keine Unterschiede', userDiffFields(person, { ...person }).length === 0)
  check('fehlende Telefonnummer ist kein Unterschied', userDiffFields(person, { ...person, phone: '' }).length === 0)
  check('andere Adresse fällt auf', userDiffFields(person, { ...person, email: 'c@d.de' }).join() === 'email')

  // 5 · Schutzregeln
  let selfMove = false
  try { assertDistinctProjects('control', 'control') } catch { selfMove = true }
  check('Lauf gegen sich selbst wird abgewiesen', selfMove)
  check('verschiedene Projekte sind in Ordnung', (() => {
    try { assertDistinctProjects('control', 'admin'); return true } catch { return false }
  })())
  check('fehlende Ziel-Tabellen werden benannt',
    missingInTarget(['a', 'b', 'c'], ['b']).join() === 'a,c')
  check('401 wird zum Runbook-Hinweis', (scopeErrorHint(401, 'general_unauthorized_scope', 'users') ?? '').includes('users.read'))
  check('Hinweis nennt den Runbook-Schritt', (scopeErrorHint(401, undefined, 'files') ?? '').includes('Schritt 0'))
  check('ein 404 ist KEIN Scope-Problem', scopeErrorHint(404, 'row_not_found', 'rows') === null)
  check('Datei-Pfad wird als files erkannt', resourceFromPath('/storage/buckets/fonts/files/f1/download') === 'files')
  check('Row-Pfad wird als rows erkannt', resourceFromPath('/tablesdb/main/tables/tickets/rows/r1') === 'rows')

  for (const entry of checks) log(`  ${entry.ok ? '✔' : '✖'} ${entry.name}`)
  const bad = checks.filter(entry => !entry.ok).length
  if (bad) failures += bad
  log(`\n  ${checks.length - bad}/${checks.length} Regeln in Ordnung.`)
}

// ── Einstieg ─────────────────────────────────────────────────────────────────

const phase = args.values.phase
if (SELF_TEST) {
  selfTest()
} else if (!phase || !PHASES.includes(phase)) {
  usage()
  if (phase) fail(`Unbekannte Phase "${phase}"`)
  process.exit(phase ? 1 : 0)
} else {
  log(DRY_RUN
    ? '\n⚠  TROCKENLAUF — es wird NICHTS geschrieben (auch kein Bericht). Für den echten Lauf: --execute'
    : '\n‼  ECHTLAUF — es wird GESCHRIEBEN.')
  log(`   Phase: ${phase} · Runbook: ${RUNBOOK}`)
  try {
    if (phase === 'inventory') await phaseInventory()
    else if (phase === 'users') await phaseUsers()
    else if (phase === 'rows') await phaseRows()
    else if (phase === 'files') await phaseFiles()
    else if (phase === 'verify') await phaseVerify()
  } catch (error) {
    fail(error?.message ?? String(error))
  }
}

log(failures ? `\n✖ ${failures} Befund(e).` : '\n✔ Sauber durchgelaufen.')
process.exit(failures ? 1 : 0)
