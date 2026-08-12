/**
 * F3 / AH-6 — das comments-Silo zieht in den Pool.
 *
 *   node --experimental-strip-types scripts/ops/f3-comments-to-pool.mjs \
 *     --phase inventory \
 *     --source-env  ~/.appwrite-secrets/migrations/comments.env \
 *     --target-env  ~/.appwrite-secrets/migrations/account.env \
 *     --control-env ~/.appwrite-secrets/migrations/control.env
 *
 * Plan: docs/plans/F3-COMMENTS-POOL.md · Abnahme: DECISION-LOG 2026-08-12 ·
 * Ablauf mit Kästchen: docs/runbooks/F3-CUTOVER.md.
 *
 * PHASEN — die Reihenfolge ist NICHT die Reihenfolge der Flag-Liste:
 *
 *     inventory → community → users → rows → verify
 *
 * `community` VOR `users`, weil erst die Row die zwei Schlüssel liefert;
 * `users` VOR `rows`, weil Row-Permissions Strings mit User-Ids darin sind —
 * wer Rows zuerst kopiert, erzeugt unsichtbare Zeilen, und „unsichtbar" sieht
 * aus wie „verloren" (Plan § 10.2).
 *
 * SCHREIBT NICHTS, solange `--execute` fehlt. `--dry-run` ist der Default und
 * wird auch gedruckt, damit niemand einen Trockenlauf für einen echten hält.
 *
 * WAS DIESES WERKZEUG BEWUSST NICHT TUT:
 *   · Buckets und DATEIEN (Plan § 4.5) — eigener Handgriff, `getFileDownload`
 *     des Server-SDK liefert keinen Buffer-tauglichen Typ (AH-1-Lektion), die
 *     Kopie läuft per REST. `media_items` (das REGISTER) wandert mit, die
 *     Dateien dahinter nicht.
 *   · Labels vergeben. `community_members` schreibt die Wahrheit (A5), das
 *     Site-Label vergibt `06.community-label.ts` beim ersten Besuch selbst.
 *   · Die alte Instanz anfassen. Es wird dort NUR gelesen — der Rückweg ist,
 *     dass sie unverändert weiterlebt.
 *   · Irgendetwas löschen. F3-Grundsatz: nie destruktiv.
 *
 * Exit 0 = Lauf sauber · Exit 1 = mindestens ein Schritt gescheitert.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  TABLE_PLAN,
  assertCommunityKeys,
  communityRowData,
  decideUserMigration,
  hashPlanFor,
  memberLabelFor,
  ownerMembershipData,
  rewriteRowPermissions,
  roleFromInstanceLabels,
  rowStampFor,
  tablePlanFor,
  tablesToCopy,
  unplannedTables,
} from './f3-lib/rules.mts'

const PHASES = ['inventory', 'users', 'rows', 'community', 'verify']
const DEFAULT_HOST = 'comments.pukalani.app'
const COMMUNITIES_TABLE = 'communities'
const MEMBERS_TABLE = 'community_members'
const PAGE = 100

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
const HOST = args.values.host ?? DEFAULT_HOST
const REPORT_DIR = args.values['report-dir'] ?? join(homedir(), '.appwrite-secrets', 'f3')
const MAPPING_PATH = args.values.mapping ?? join(REPORT_DIR, 'user-map.json')
const COLLISION_PATH = args.values.report ?? join(REPORT_DIR, 'collisions.json')

let failures = 0
const log = (...parts) => console.log(...parts)
const fail = (message) => { failures++; console.log(`✖  ${message}`) }

function usage() {
  log(`
F3 / AH-6 — comments-Silo → Pool-Community

  --phase <${PHASES.join('|')}>   Pflicht (Reihenfolge: inventory → community → users → rows → verify)
  --source-env <pfad>              Env der comments-Instanz (nur LESEN)
  --target-env <pfad>              Env des account-Projekts
  --control-env <pfad>             Env des control-Projekts (nur Phase community/verify)
  --owner-user <userId>            runtimeUserId des Owners im account-Projekt (Phase community)
  --owner-email <adresse>          E-Mail für die Owner-Mitgliedschaft (Phase community)
  --host <name>                    Default ${DEFAULT_HOST}
  --tenant-id <t-…>                tenantId beim Anlegen erzwingen (sonst frisch)
  --theme/--variant/--neutral <x>  Branding der neuen Community (Default: leer = Instanz-Vorgabe)
  --trial-until <ISO>              Default: +10 Jahre (F49-Sweep, Entscheidung 3)
  --tables a,b                     nur diese Tabellen (überstimmt auch 'skip' im Plan)
  --mapping <pfad>                 Default ${MAPPING_PATH}
  --report <pfad>                  Default ${COLLISION_PATH}
  --execute                        SCHREIBEN. Ohne dieses Flag: Trockenlauf.
  --self-test                      Pure Regeln gegen Fixtures prüfen, ohne Netz.

Env-Dateien im Format der Migrations-Envs:
  NUXT_PUBLIC_APPWRITE_ENDPOINT / _PROJECT_ID / _DATABASE_ID,
  NUXT_APPWRITE_MIGRATIONS_KEY (sonst NUXT_APPWRITE_KEY).
`)
}

// ── Env + Clients ────────────────────────────────────────────────────────────

/** Gleicher Parser wie in verify-schema-parity.mjs — bewusst dieselbe Form,
 *  damit dieselben Dateien passen. */
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
 * Entscheidung wie in `scripts/control-jobs.mjs` und
 * `scripts/ops/verify-schema-parity.mjs`: die Wurzel-`scripts/` liegen in
 * keinem Workspace-Paket, `node scripts/…` löst dort kein `node-appwrite` auf
 * (ERR_MODULE_NOT_FOUND), und ein Betriebswerkzeug soll ohne `pnpm exec`
 * laufen. Der Preis ist, dass Query-Objekte hier von Hand entstehen — dafür
 * hängt das Werkzeug an keiner SDK-Version.
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
  cfg.api = async (path, method = 'GET', body) => {
    const res = await fetch(`${cfg.endpoint}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': cfg.project, 'X-Appwrite-Key': cfg.key },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(`${cfg.label} ${method} ${path} → ${res.status} ${json.message ?? ''}`.trim())
      error.status = res.status
      throw error
    }
    return json
  }
  return cfg
}

function requireInstance(flag, label) {
  return loadInstance(label, args.values[flag])
}

// Query-Bausteine (das SDK würde sie genauso als JSON serialisieren).
const qLimit = value => ({ method: 'limit', values: [value] })
const qEqual = (attribute, value) => ({ method: 'equal', attribute, values: [value] })
const qCursorAfter = value => ({ method: 'cursorAfter', values: [value] })
const queryString = queries => queries.map(query => `queries[]=${encodeURIComponent(JSON.stringify(query))}`).join('&')
const rowsPath = (instance, tableId, queries = []) =>
  `/tablesdb/${instance.databaseId}/tables/${tableId}/rows${queries.length ? `?${queryString(queries)}` : ''}`
const rowPath = (instance, tableId, rowId) => `/tablesdb/${instance.databaseId}/tables/${tableId}/rows/${rowId}`

// ── kleine Helfer ────────────────────────────────────────────────────────────

function writeJson(path, data) {
  if (DRY_RUN) { log(`   (Trockenlauf) würde schreiben: ${path}`); return }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  log(`   geschrieben: ${path}`)
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Frische Id für einen SPALTENWERT (`tenantId`). Für rowIds reicht das
 *  serverseitige `unique()`; ein Spaltenwert muss der Client selbst bilden.
 *  Erlaubte Zeichen laut Appwrite: a-z A-Z 0-9 . - _ und kein Sonderzeichen
 *  am Anfang; hier bewusst nur Kleinbuchstaben und Ziffern. */
function uniqueId() {
  const stamp = Date.now().toString(36)
  const noise = Math.random().toString(36).slice(2, 12)
  return `${stamp}${noise}`
}

const isConflict = error => error?.status === 409
const isMissing = error => error?.status === 404
/** 404 zu `null` machen — sonst müsste jede Existenzprüfung ein try/catch tragen. */
const orNull = error => (isMissing(error) ? null : Promise.reject(error))

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

async function countRows(instance, tableId, queries = []) {
  const page = await instance.api(rowsPath(instance, tableId, [...queries, qLimit(1)]))
  return page.total
}

async function listUsers(instance, queries) {
  return instance.api(`/users?${queryString(queries)}`)
}

/** Alle Konten der Instanz, seitenweise. */
async function allUsers(instance) {
  const users = []
  let cursor = null
  for (;;) {
    const page = await listUsers(instance, [qLimit(PAGE), ...(cursor ? [qCursorAfter(cursor)] : [])])
    users.push(...page.users)
    if (page.users.length < PAGE) return users
    cursor = page.users[page.users.length - 1].$id
  }
}

/** Was das Ziel über dieses Konto schon weiß — nach Id UND nach Adresse. */
async function targetTwins(target, user) {
  const byId = await target.api(`/users/${user.$id}`).catch(orNull)
  const byEmail = user.email
    ? (await listUsers(target, [qEqual('email', user.email), qLimit(2)])).users[0] ?? null
    : null
  return { byId, byEmail }
}

/** HashPlan-Methode → REST-Endpunkt der Users-API. */
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

/** Nutzdaten einer Zeile — die `$`-Metafelder gehören dem Ziel, nicht der Kopie. */
function payloadOf(row) {
  const data = {}
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('$')) continue
    data[key] = value
  }
  return data
}

/** Die Community aus dem Control Plane holen — die EINE Quelle der zwei
 *  Schlüssel. Sie wird NIE aus Flags zusammengesetzt (Plan § 10.1). */
async function loadCommunity(control, host) {
  const page = await control.api(rowsPath(control, COMMUNITIES_TABLE, [qEqual('host', host), qLimit(2)]))
  if (page.total === 0) return null
  if (page.total > 1) throw new Error(`Mehr als eine communities-Row für ${host} — das darf uq_host nicht zulassen.`)
  const row = page.rows[0]
  const keys = { rowId: row.$id, tenantId: row.tenantId }
  assertCommunityKeys(keys)
  return { row, keys }
}

// ── Phase: inventory ─────────────────────────────────────────────────────────

async function phaseInventory() {
  const source = requireInstance('source-env', 'source')
  const target = requireInstance('target-env', 'target')

  log(`\n▸ Inventar — Quelle ${source.project} → Ziel ${target.project}\n`)

  const tables = await source.api(`/tablesdb/${source.databaseId}/tables?${queryString([qLimit(500)])}`)
  const tableIds = tables.tables.map(table => table.$id)

  const counts = []
  for (const tableId of tableIds.sort()) {
    const total = await countRows(source, tableId)
    const plan = tablePlanFor(tableId)
    counts.push({ tableId, total, action: plan?.action ?? '—', reason: plan?.reason ?? 'NICHT IM PLAN' })
  }

  log('  Tabelle                        Zeilen  Plan')
  for (const entry of counts) {
    const mark = entry.action === 'copy' || entry.action === 'copy-if-handle-free' ? '→' : entry.action === 'skip' ? '·' : '?'
    log(`  ${mark} ${entry.tableId.padEnd(28)} ${String(entry.total).padStart(6)}  ${entry.action}`)
  }

  const unplanned = unplannedTables(tableIds)
  if (unplanned.length) {
    fail(`Tabellen OHNE Plan-Zeile (ein neuer Layer? TABLE_PLAN in scripts/ops/f3-lib/rules.mts ergänzen): ${unplanned.join(', ')}`)
  }
  const withRowsButSkipped = counts.filter(entry => entry.action === 'skip' && entry.total > 0)
  if (withRowsButSkipped.length) {
    log(`\n  Bewusst zurückgelassen, aber NICHT leer — vor Phase 4 mit David ansehen:`)
    for (const entry of withRowsButSkipped) log(`    · ${entry.tableId} (${entry.total}) — ${entry.reason}`)
  }

  // Konten
  log('\n  Konten:')
  const sourceUsers = await allUsers(source)
  const withPassword = sourceUsers.filter(user => Boolean(user.password))
  const hashes = new Map()
  for (const user of withPassword) hashes.set(user.hash ?? '(leer)', (hashes.get(user.hash ?? '(leer)') ?? 0) + 1)
  const unsupported = withPassword.filter(user => hashPlanFor(user).method === 'unsupported')

  log(`    gesamt ${sourceUsers.length} · OTP-only ${sourceUsers.length - withPassword.length} · mit Passwort ${withPassword.length}`)
  log(`    Hash-Verfahren: ${hashes.size ? [...hashes].map(([hash, n]) => `${hash}=${n}`).join(' · ') : '—'}`)
  if (unsupported.length) fail(`${unsupported.length} Konto/Konten mit Hash-Verfahren, das die Users-API nicht übernimmt — sie landen im Kollisions-Report`)
  log(`    unbestätigte Adressen: ${sourceUsers.filter(user => !user.emailVerification).length}`)
  log(`    Instanz-Labels: admin=${sourceUsers.filter(u => u.labels.includes('admin')).length} · moderator=${sourceUsers.filter(u => u.labels.includes('moderator')).length}`)

  // Schnittmengen gegen das Ziel — Zahlen, keine Adressen.
  let idClash = 0
  let emailBothVerified = 0
  let emailNeedsDavid = 0
  for (const user of sourceUsers) {
    const { byId, byEmail } = await targetTwins(target, user)
    const decision = decideUserMigration({ source: user, targetById: byId, targetByEmail: byEmail })
    if (decision.action === 'merge') emailBothVerified++
    if (decision.action === 'collision' && decision.reason === 'email_unverified') emailNeedsDavid++
    if (decision.action === 'collision' && decision.reason === 'id_taken_by_other') idClash++
  }
  log(`    Id-Kollisionen: ${idClash} · automatisch zusammenführbar: ${emailBothVerified} · Einzelfall für David: ${emailNeedsDavid}`)

  // Handles gegen das globale Register
  let handleClashes = 0
  try {
    for await (const row of eachRow(source, 'account_handles')) {
      const page = await target.api(rowsPath(target, 'account_handles', [qEqual('handleLower', row.handleLower), qLimit(1)]))
      if (page.total > 0) handleClashes++
    }
    log(`    Handle-Kollisionen gegen account_handles im Ziel: ${handleClashes}`)
  } catch (error) {
    log(`    account_handles nicht lesbar (${error?.message ?? error}) — Handle-Schnitt offen`)
  }

  // Einbetter — die Liste gehört ins Runbook und ist die Empfänger-Liste der
  // Wartungs-Mail (Plan § 5.1). Hosts sind keine Personendaten.
  log('\n  embed_sites (Empfänger der Wartungs-Mail):')
  try {
    for await (const row of eachRow(source, 'embed_sites')) {
      log(`    · ${row.host} — ${row.active ? 'aktiv' : 'inaktiv'}`)
    }
  } catch (error) {
    log(`    nicht lesbar: ${error?.message ?? error}`)
  }

  writeJson(join(REPORT_DIR, 'inventory.json'), {
    at: new Date().toISOString(),
    source: source.project,
    target: target.project,
    tables: counts,
    unplanned,
    users: {
      total: sourceUsers.length,
      withPassword: withPassword.length,
      hashes: Object.fromEntries(hashes),
      idClash,
      mergeable: emailBothVerified,
      needsDavid: emailNeedsDavid,
      handleClashes,
    },
  })
  log('\n  Nächster Schritt: --phase community')
}

// ── Phase: community ─────────────────────────────────────────────────────────

async function phaseCommunity() {
  const control = requireInstance('control-env', 'control')
  const target = requireInstance('target-env', 'target')
  const ownerUser = args.values['owner-user']
  if (!ownerUser) throw new Error('--owner-user fehlt (die runtimeUserId des Owners IM account-Projekt)')

  log(`\n▸ Community anlegen — Host ${HOST} im Control Plane ${control.project}\n`)

  const existing = await loadCommunity(control, HOST)
  if (existing) {
    log(`  Es gibt sie schon: $id=${existing.keys.rowId} · tenantId=${existing.keys.tenantId} · plan=${existing.row.plan}`)
    log('  Nichts zu tun (der Schritt ist einmalig und idempotent über uq_host).')
    return
  }

  const trialUntil = args.values['trial-until']
    ?? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
  // Wie `tenants/index.post.ts`: `t-${ID.unique()}`. `unique()` als rowId lässt
  // der Server expandieren, für den SPALTENWERT braucht es eine echte Id —
  // deshalb hier dieselbe Form, die das SDK erzeugt (Zeit + Zufall).
  const tenantId = args.values['tenant-id'] ?? `t-${uniqueId()}`
  const data = communityRowData({
    name: args.values.name ?? 'Comments',
    host: HOST,
    projectId: target.project,
    tenantId,
    plan: 'pro',
    trialEndsAt: trialUntil,
    theme: args.values.theme ?? '',
    variant: args.values.variant ?? '',
    neutral: args.values.neutral ?? '',
  })

  log(`  plan=pro · audience=public · openRegistration=true · kein Abo · trialEndsAt=${trialUntil}`)
  log(`  projectId=${data.projectId} · tenantId=${tenantId}`)

  if (DRY_RUN) {
    log('\n  (Trockenlauf) communities-Row NICHT angelegt. Felder:')
    log(`    ${Object.keys(data).join(', ')}`)
    log('  (Trockenlauf) Owner-Mitgliedschaft NICHT angelegt.')
    return
  }

  const row = await control.api(rowsPath(control, COMMUNITIES_TABLE), 'POST', { rowId: 'unique()', data })
  const keys = { rowId: row.$id, tenantId: row.tenantId }
  assertCommunityKeys(keys)
  log(`  angelegt: $id=${keys.rowId} · tenantId=${keys.tenantId}`)

  try {
    await control.api(rowsPath(control, MEMBERS_TABLE), 'POST', {
      rowId: 'unique()',
      data: ownerMembershipData({
        keys,
        runtimeProjectId: target.project,
        runtimeUserId: ownerUser,
        email: args.values['owner-email'] ?? '',
      }),
    })
    log('  Owner-Mitgliedschaft angelegt.')
  } catch (error) {
    // Dieselbe Kompensation wie in onboardingProvision.ts: eine Community ohne
    // Owner ist schlimmer als keine Community.
    await control.api(rowPath(control, COMMUNITIES_TABLE, row.$id), 'DELETE')
    throw new Error(`Owner-Mitgliedschaft gescheitert (${error?.message ?? error}) — communities-Row zurückgerollt.`, { cause: error })
  }
  log('\n  Nächster Schritt: --phase users')
}

// ── Phase: users ─────────────────────────────────────────────────────────────

async function phaseUsers() {
  const source = requireInstance('source-env', 'source')
  const target = requireInstance('target-env', 'target')

  log(`\n▸ Nutzer — ${source.project} → ${target.project}\n`)

  const mapping = readJson(MAPPING_PATH, {})
  const collisions = readJson(COLLISION_PATH, { at: null, entries: [] })
  collisions.entries = collisions.entries ?? []

  let created = 0
  let merged = 0
  let known = 0
  let blocked = 0

  const sourceUsers = await allUsers(source)
  for (const user of sourceUsers) {
    if (mapping[user.$id]) { known++; continue }

    const { byId, byEmail } = await targetTwins(target, user)
    const decision = decideUserMigration({ source: user, targetById: byId, targetByEmail: byEmail })

    if (decision.action === 'collision') {
      blocked++
      collisions.entries.push({
        sourceUserId: user.$id,
        email: user.email,
        reason: decision.reason,
        sourceVerified: user.emailVerification,
        targetVerified: byEmail?.emailVerification ?? null,
        note: 'NICHT migriert. Seine Zeilen werden trotzdem kopiert — die user:-Permissions zeigen dann auf die alte Id ins Leere (bewusst, bis David entscheidet).',
      })
      log(`  ✖ ${user.$id} — Einzelfall (${decision.reason})`)
      continue
    }

    if (decision.action === 'exists') { mapping[user.$id] = decision.targetUserId; known++; continue }
    if (decision.action === 'merge') {
      mapping[user.$id] = decision.targetUserId
      merged++
      log(`  ⇄ ${user.$id} → ${decision.targetUserId} (beidseitig bestätigte Adresse)`)
      continue
    }

    const plan = hashPlanFor(user)
    if (plan.method === 'unsupported') {
      blocked++
      collisions.entries.push({
        sourceUserId: user.$id,
        email: user.email,
        reason: 'unsupported_hash',
        hash: plan.hash,
        note: 'Die Users-API des Ziels kennt dieses Verfahren nicht — Konto NICHT angelegt.',
      })
      log(`  ✖ ${user.$id} — Hash-Verfahren ${plan.hash} nicht übernehmbar`)
      continue
    }

    if (DRY_RUN) {
      mapping[user.$id] = user.$id
      created++
      log(`  + ${user.$id} (Trockenlauf, ${plan.method})`)
      continue
    }

    // Id BEHALTEN — dann ist das Remapping die Ausnahme statt die Regel (§ 3.2).
    const body = { userId: user.$id, email: user.email, name: user.name }
    if (plan.needs.includes('password')) body.password = user.password
    if (plan.method === 'createSHAUser') body.passwordVersion = plan.passwordVersion
    if (plan.method === 'createScryptUser' || plan.method === 'createScryptModifiedUser') Object.assign(body, plan.options)
    await target.api(CREATE_PATHS[plan.method], 'POST', body)

    // prefs + emailVerification mitnehmen — ohne das Flag müsste sich jeder
    // Mensch seine Adresse ein zweites Mal bestätigen lassen.
    if (user.prefs && Object.keys(user.prefs).length) {
      await target.api(`/users/${user.$id}/prefs`, 'PATCH', { prefs: user.prefs })
    }
    if (user.emailVerification) {
      await target.api(`/users/${user.$id}/verification`, 'PATCH', { emailVerification: true })
    }
    // Instanz-Labels wandern BEWUSST NICHT mit (Plan § 3.6): `label:admin`
    // wäre im Pool eine offene Tür zu jeder fremden Community.
    mapping[user.$id] = user.$id
    created++
    log(`  + ${user.$id} (${plan.method})`)
  }

  log(`\n  angelegt ${created} · zusammengeführt ${merged} · schon bekannt ${known} · Einzelfälle ${blocked}`)
  writeJson(MAPPING_PATH, mapping)
  if (blocked) {
    collisions.at = new Date().toISOString()
    writeJson(COLLISION_PATH, collisions)
    log(`\n  ${blocked} Einzelfall/Einzelfälle — Report an David, BEVOR Phase rows läuft.`)
  }

  // ── Mitgliedschaft (A5, Plan § 3.6) ────────────────────────────────────────
  // Die Instanz-LABELS wandern nicht mit — im Pool wäre `label:admin` eine
  // offene Tür zu jeder fremden Community (`grantCommunityLabel` verweigert
  // solche Labels ausdrücklich). Was mitwandert, ist ihre BEDEUTUNG: als
  // Rolle in `community_members`, der Wahrheit seit A5. Das SITE-Label vergibt
  // `06.community-label.ts` daraufhin beim ersten Besuch selbst.
  if (!args.values['control-env']) {
    log('\n  ⚠ Ohne --control-env keine community_members-Zeilen — die Menschen wären')
    log('    im Pool keine Mitglieder. Diesen Lauf mit --control-env wiederholen.')
    return
  }
  const control = requireInstance('control-env', 'control')
  const community = await loadCommunity(control, HOST)
  if (!community) throw new Error(`Keine communities-Row für ${HOST} — erst --phase community fahren.`)

  let joined = 0
  let already = 0
  for (const user of sourceUsers) {
    const runtimeUserId = mapping[user.$id]
    if (!runtimeUserId) continue // Einzelfall — nicht migriert, also kein Mitglied
    const role = roleFromInstanceLabels(user.labels ?? [])
    if (DRY_RUN) { joined++; continue }
    try {
      await control.api(rowsPath(control, MEMBERS_TABLE), 'POST', {
        rowId: 'unique()',
        data: {
          communityId: community.keys.rowId, // $id, NICHT der t-Stempel
          runtimeProjectId: target.project,
          runtimeUserId,
          role,
          status: 'active',
          email: user.email ?? '',
        },
      })
      joined++
    } catch (error) {
      // uq_member (communityId+runtimeProjectId+runtimeUserId) macht den
      // Wiederanlauf idempotent — auch der Owner aus Phase `community`.
      if (isConflict(error)) already++
      else throw error
    }
  }
  log(`  Mitgliedschaften: neu ${joined} · schon vorhanden ${already}`)
  log('\n  Nächster Schritt: --phase rows')
}

// ── Phase: rows ──────────────────────────────────────────────────────────────

async function phaseRows() {
  const source = requireInstance('source-env', 'source')
  const target = requireInstance('target-env', 'target')
  const control = requireInstance('control-env', 'control')

  const community = await loadCommunity(control, HOST)
  if (!community) throw new Error(`Keine communities-Row für ${HOST} — erst --phase community fahren.`)
  const { keys, row: communityRow } = community
  const audiencePublic = communityRow.audience === 'public'

  const mapping = readJson(MAPPING_PATH, null)
  if (!mapping) throw new Error(`Mapping-Datei ${MAPPING_PATH} fehlt — erst --phase users fahren.`)

  log(`\n▸ Rows — Stempel communityId=${keys.tenantId} (t-Id!) · Label ${memberLabelFor(keys)} ($id!)`)
  log(`  audience=${communityRow.audience} · Mapping-Einträge: ${Object.keys(mapping).length}\n`)

  const only = args.values.tables?.split(',').map(part => part.trim()).filter(Boolean) ?? null
  const plan = only
    ? only.map(tableId => tablePlanFor(tableId) ?? { tableId, layer: '?', action: 'copy', reason: 'per --tables erzwungen' })
    : tablesToCopy()
  if (only) log(`  --tables überstimmt den Plan: ${only.join(', ')}\n`)

  const summary = []
  const unmappedAll = new Set()

  for (const entry of plan) {
    let seen = 0; let wrote = 0; let updated = 0; let skipped = 0; let conflicted = 0
    try {
      for await (const row of eachRow(source, entry.tableId)) {
        seen++
        const data = { ...payloadOf(row), ...rowStampFor(keys) }
        const rewritten = rewriteRowPermissions(row.$permissions ?? [], { keys, mapping, audiencePublic })
        for (const id of rewritten.unmapped) unmappedAll.add(id)

        if (entry.action === 'copy-if-handle-free') {
          const taken = await target.api(rowsPath(target, entry.tableId, [qEqual('handleLower', row.handleLower), qLimit(1)]))
          if (taken.total > 0 && taken.rows[0].$id !== row.$id) { skipped++; continue }
          // Publikum neu bauen: eine Lese-Rolle je Mitgliedschaft (AH-7).
          // Hier gibt es genau eine — die neue Community.
          rewritten.permissions = [
            `read("${memberLabelFor(keys)}")`,
            ...rewritten.permissions.filter(permission => !permission.startsWith('read(')),
          ]
        }

        if (DRY_RUN) { wrote++; continue }

        try {
          await target.api(rowsPath(target, entry.tableId), 'POST', {
            rowId: row.$id, // Id BEHALTEN
            data,
            permissions: rewritten.permissions,
          })
          wrote++
        } catch (error) {
          if (!isConflict(error)) throw error
          // 409 heißt ZWEIERLEI: die Row-Id gibt es schon (Delta-Lauf → update)
          // ODER ein UNIQUE-Index schlägt zu (FREMDE Row, gleicher Schlüssel).
          // Blind zu aktualisieren wäre im zweiten Fall ein 404 — oder schlimmer,
          // bei einer anderen Id ein stiller Datenverlust.
          const exists = await target.api(rowPath(target, entry.tableId, row.$id)).catch(orNull)
          if (!exists) { conflicted++; continue }
          await target.api(rowPath(target, entry.tableId, row.$id), 'PATCH', {
            data,
            permissions: rewritten.permissions,
          })
          updated++
        }
      }
    } catch (error) {
      // Fehlt die Tabelle in der QUELLE, trägt diese Instanz den Layer nicht —
      // kein Befund (s. Phase verify).
      if (isMissing(error)) { log(`  ·  ${entry.tableId.padEnd(24)} gibt es in der Quelle nicht`); continue }
      fail(`${entry.tableId}: ${error?.message ?? error}`)
      continue
    }
    if (conflicted) fail(`${entry.tableId}: ${conflicted} Zeile(n) mit UNIQUE-Konflikt — von Hand ansehen`)
    summary.push({ tableId: entry.tableId, seen, wrote, updated, skipped, conflicted })
    log(`  ${entry.tableId.padEnd(24)} gelesen ${String(seen).padStart(5)} · neu ${String(wrote).padStart(5)} · aktualisiert ${String(updated).padStart(5)}${skipped ? ` · übersprungen ${skipped}` : ''}`)
  }

  if (unmappedAll.size) {
    log(`\n  ${unmappedAll.size} User-Id(s) ohne Mapping-Eintrag — ihre user:-Permissions zeigen ins Leere.`)
    log('  Das ist die bewusste Folge der fail-closed-Regel (Entscheidung b); die Zeilen selbst sind da.')
  }
  writeJson(join(REPORT_DIR, 'rows.json'), { at: new Date().toISOString(), dryRun: DRY_RUN, keys, summary, unmapped: [...unmappedAll] })
  log('\n  Nächster Schritt: --phase verify')
}

// ── Phase: verify ────────────────────────────────────────────────────────────

async function phaseVerify() {
  const source = requireInstance('source-env', 'source')
  const target = requireInstance('target-env', 'target')
  const control = requireInstance('control-env', 'control')

  const community = await loadCommunity(control, HOST)
  if (!community) { fail(`Keine communities-Row für ${HOST}`); return }
  const { keys, row: communityRow } = community

  log(`\n▸ Verifikation — NUR Zähler, keine Inhalte.\n`)
  log(`  Community: $id=${keys.rowId} · tenantId=${keys.tenantId} · plan=${communityRow.plan} · audience=${communityRow.audience} · suspension="${communityRow.suspension}"`)
  if (communityRow.suspension) fail('Die Community ist GESPERRT — M13 macht sie nur-lesend (trialEndsAt prüfen, F49-Sweep).')

  // Gefiltert wird mit dem SPALTEN-Schlüssel — genau wie `scopeQueriesFor()`.
  const scope = [qEqual('communityId', keys.tenantId)]
  for (const entry of tablesToCopy()) {
    // Eine Tabelle, die es in der QUELLE nicht gibt, ist kein Befund — der
    // Plan deckt mehr Layer ab, als eine einzelne Instanz tragen muss. Fehlt
    // sie im ZIEL, ist es eine Schema-Lücke und sehr wohl einer.
    const here = await countRows(source, entry.tableId).catch(orNull)
    if (here === null) { log(`  ·  ${entry.tableId.padEnd(24)} gibt es in der Quelle nicht`); continue }
    const there = entry.tableId === 'account_handles'
      ? await countRows(target, entry.tableId).catch(orNull)
      : await countRows(target, entry.tableId, scope).catch(orNull)
    if (there === null) { fail(`${entry.tableId}: fehlt im ZIEL — Schema-Lücke (pnpm ops:schema-parity)`); continue }
    const mark = there >= here ? '✔' : '✖'
    if (there < here) failures++
    const note = entry.tableId === 'account_handles' ? '  (global, Kollisionen bleiben zurück)' : ''
    log(`  ${mark} ${entry.tableId.padEnd(24)} Quelle ${String(here).padStart(5)} · Ziel ${String(there).padStart(5)}${note}`)
  }

  // Stichprobe: tragen die Zeilen den richtigen Stempel und ein Publikum?
  log('\n  Stichproben (Stempel + Permissions, ohne Inhalte):')
  for (const tableId of ['comments', 'community_posts']) {
    const page = await target.api(rowsPath(target, tableId, [...scope, qLimit(5)])).catch(() => null)
    if (!page || page.rows.length === 0) { log(`    · ${tableId}: keine Zeile im Scope`); continue }
    const wrongStamp = page.rows.filter(row => row.communityId !== keys.tenantId).length
    const noRead = page.rows.filter(row => !(row.$permissions ?? []).some(permission => permission.startsWith('read('))).length
    const staleLabel = page.rows.filter(row => (row.$permissions ?? []).some(permission => permission.includes('label:admin') || permission.includes('label:moderator'))).length
    log(`    · ${tableId}: ${page.rows.length} geprüft · falscher Stempel ${wrongStamp} · ohne Leserecht ${noRead} · Silo-Label übrig ${staleLabel}`)
    if (wrongStamp || noRead || staleLabel) failures++
  }

  const collisions = readJson(COLLISION_PATH, { entries: [] })
  const byReason = new Map()
  for (const entry of collisions.entries ?? []) byReason.set(entry.reason, (byReason.get(entry.reason) ?? 0) + 1)
  log(`\n  Kollisions-Report: ${collisions.entries?.length ?? 0} Eintrag/Einträge${byReason.size ? ` (${[...byReason].map(([reason, n]) => `${reason}=${n}`).join(' · ')})` : ''}`)
  log(`  Datei: ${COLLISION_PATH} — enthält Personenbezug, gehört NICHT ins Repo und wird nach der Beobachtungszeit gelöscht.`)
}

// ── Selbsttest: die puren Regeln gegen erfundene Fixtures ────────────────────

function selfTest() {
  log('\n▸ Selbsttest der puren Regeln (kein Netz, erfundene Fixtures)\n')
  const keys = { rowId: 'c0ffee1234', tenantId: 't-abc123' }
  const checks = []
  const check = (name, condition) => { checks.push({ name, ok: Boolean(condition) }) }

  // 1 · Stempel-Wahl
  check('Stempel nimmt die t-Id', rowStampFor(keys).communityId === 't-abc123')
  check('Label nimmt die $id', memberLabelFor(keys) === 'label:c0ffee1234')
  let swapped = false
  try { rowStampFor({ rowId: 't-abc123', tenantId: 'c0ffee1234' }) } catch { swapped = true }
  check('vertauschte Schlüssel fliegen auf', swapped)

  // 2 · Merge-Entscheidung
  const verified = { $id: 'u1', email: 'a@b.de', emailVerification: true }
  const unverified = { $id: 'u2', email: 'a@b.de', emailVerification: false }
  check('beidseitig bestätigt ⇒ merge',
    decideUserMigration({ source: verified, targetById: null, targetByEmail: { $id: 'acc1', email: 'a@b.de', emailVerification: true } }).action === 'merge')
  check('einseitig unbestätigt ⇒ collision',
    decideUserMigration({ source: unverified, targetById: null, targetByEmail: { $id: 'acc1', email: 'a@b.de', emailVerification: true } }).action === 'collision')
  check('frische Adresse ⇒ create',
    decideUserMigration({ source: verified, targetById: null, targetByEmail: null }).action === 'create')

  // 3 · Permissions
  const rewritten = rewriteRowPermissions(
    ['read("any")', 'read("users")', 'read("label:moderator")', 'update("user:alt")', 'delete("user:ohne")'],
    { keys, mapping: { alt: 'neu' }, audiencePublic: true },
  )
  check('read(any) bleibt', rewritten.permissions.includes('read("any")'))
  check('read(users) wird zum Label', rewritten.permissions.includes('read("label:c0ffee1234")'))
  check('Silo-Moderator wird mod<$id>', rewritten.permissions.includes('read("label:modc0ffee1234")'))
  check('gemappte Id ersetzt', rewritten.permissions.includes('update("user:neu")'))
  check('ungemappte Id gemeldet', rewritten.unmapped.includes('ohne'))

  // 4 · Sonstiges
  check('TABLE_PLAN kennt guest_authors als skip', tablePlanFor('guest_authors')?.action === 'skip')
  check('unbekannte Tabelle fällt auf', unplannedTables(['comments', 'brandneu']).join() === 'brandneu')
  check('Instanz-Label wird zur Rolle', roleFromInstanceLabels(['moderator']) === 'moderator')
  check('OTP-only braucht kein Passwort', hashPlanFor({}).needs.length === 0)
  check('bcrypt bekommt seinen Endpunkt', hashPlanFor({ password: 'x', hash: 'bcrypt' }).method === 'createBcryptUser')
  check('unbekannter Hash ⇒ unsupported', hashPlanFor({ password: 'x', hash: 'quantum' }).method === 'unsupported')
  const communityRow = communityRowData({
    name: 'C', host: HOST, projectId: 'account', tenantId: 't-x', plan: 'pro', trialEndsAt: '2036-01-01T00:00:00.000Z', theme: '', variant: '', neutral: '',
  })
  check('communities-Row ist pool/aktiv/öffentlich/offen',
    communityRow.mode === 'pool' && communityRow.status === 'active'
    && communityRow.audience === 'public' && communityRow.openRegistration === true)
  check('communities-Row ohne Abo und ohne Sperre',
    communityRow.stripeSubscriptionId === '' && communityRow.suspension === '')
  check('Owner-Mitgliedschaft nimmt die $id',
    ownerMembershipData({ keys, runtimeProjectId: 'account', runtimeUserId: 'u1', email: '' }).communityId === keys.rowId)

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
    ? '\n⚠  TROCKENLAUF — es wird NICHTS geschrieben. Für den echten Lauf: --execute'
    : '\n‼  ECHTLAUF — es wird GESCHRIEBEN.')
  log(`   TABLE_PLAN: ${TABLE_PLAN.length} Tabellen (${tablesToCopy().length} wandern)`)
  try {
    if (phase === 'inventory') await phaseInventory()
    else if (phase === 'community') await phaseCommunity()
    else if (phase === 'users') await phaseUsers()
    else if (phase === 'rows') await phaseRows()
    else if (phase === 'verify') await phaseVerify()
  } catch (error) {
    fail(error?.message ?? String(error))
  }
}

log(failures ? `\n✖ ${failures} Befund(e).` : '\n✔ Sauber durchgelaufen.')
process.exit(failures ? 1 : 0)
