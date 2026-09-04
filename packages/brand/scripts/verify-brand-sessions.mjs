/**
 * Beweis für BW2 Paket 3a — „Gespräch je Session" gegen einen echten Server.
 *
 * Geprüft werden die sieben Zusagen, die keine pure Funktion belegen kann,
 * weil sie an Route, Schema und Ablage hängen:
 *
 *  1. ERÖFFNUNGSZUG: der erste Aufruf einer Session bekommt einen Strom,
 *     der zweite `{ conversed: false, skipped: true }` — die Idempotenz, ohne
 *     die jedes Öffnen einer Session einen neuen ersten Satz kostete.
 *  2. FREMDE SESSION: ein Schlüssel aus einem anderen Kapitel wird mit 400
 *     `session_foreign` abgewiesen — VOR jeder Wirkung.
 *  3. GESPERRTE SESSION: eine Session, deren Eingaben unbestätigt sind, wird
 *     mit 409 `session_locked` abgewiesen.
 *  4. VERLAUF JE SESSION: `?session=` liefert genau den Faden dieser Session.
 *  5. BESTANDS-REGEL: eine Zeile mit LEEREM `sessionKey` (der Kapitel-Verlauf
 *     von vor BW2) zählt zum Fenster der ERSTEN Session des Kapitels — und zu
 *     keinem anderen. Mit GEGENPROBE.
 *  6. SAMMEL-SESSION: `a.facts` sammelt drei Teile nacheinander; der Wert
 *     entsteht erst nach dem dritten und trägt die Form seines Schemas.
 *  7. STEP-DETAIL: `sessions` trägt Zustand, Umfang, Vertraulichkeit und die
 *     Frage „wohin fliesst das später".
 *
 * ── WAS DIESER BEWEIS NICHT BEWEIST ──────────────────────────────────────
 * Den Anbieter. Ohne `NUXT_AI_KEY` wirft `aiCompleteStream` (503), die Route
 * schickt `generation.failed` mit `provider_error` — und genau das ist hier
 * unwichtig: geprüft wird, was VOR und NEBEN dem Modell passiert (Sperren,
 * Schlüssel, Ablage). Wo ein Zug des Beraters gebraucht wird (Zusage 1 und 4),
 * legt das Skript ihn selbst an, statt ihn zu erwürfeln.
 *
 * ── VORBEDINGUNGEN ───────────────────────────────────────────────────────
 * Lokale Dev-Appwrite mit den `brand_*`-Tabellen (Migration bis brand-011)
 * und ein Dev-Server der branding-App AUS DEM WORKTREE. Einen Seed für den
 * brand-Layer gibt es nicht — dieses Skript legt Konto, Beta-Zugang und
 * Branding selbst an und räumt am Ende alles weg (auch `app_config`, falls es
 * das KI-Flag umstellen musste).
 *
 *   pnpm --filter branding exec nuxi dev --port 3016
 *   BRANDING_PORT=3016 node --env-file=apps/branding/.env \
 *     packages/brand/scripts/verify-brand-sessions.mjs
 */
import { request } from 'node:http'
import { Client, ID, Query, TablesDB, Users } from 'node-appwrite'

const PORT = Number(process.env.BRANDING_PORT || 3016)
const HOST = process.env.BRANDING_HOST || 'localhost'

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID
const apiKey = process.env.NUXT_APPWRITE_MIGRATIONS_KEY || process.env.NUXT_APPWRITE_KEY

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('✗ Env unvollständig — Aufruf mit --env-file=apps/branding/.env')
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const tablesDB = new TablesDB(client)
const users = new Users(client)

let pass = 0
let fail = 0
const cleanup = { users: [], profiles: [], access: [], messages: [], aiFlag: null }

function check(label, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✔ ${label}`)
  }
  else {
    fail++
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/**
 * Nitro hört auf `[::1]`; Node's `fetch` verwirft einen eigenen Host-Header
 * (CLAUDE.md, „Beweise"). Deshalb node:http über ::1 mit gesetztem Host.
 */
function call(path, { method = 'GET', body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const req = request({
      host: '::1',
      port: PORT,
      path,
      method,
      headers: {
        host: HOST,
        ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { cookie } : {}),
      },
    }, (res) => {
      let text = ''
      res.on('data', chunk => text += chunk)
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(text) }
        catch { /* SSE oder HTML */ }
        resolve({
          status: res.statusCode,
          contentType: String(res.headers['content-type'] ?? ''),
          json,
          text,
        })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const stamp = Date.now()

async function makeAccount() {
  const user = await users.create({
    userId: ID.unique(),
    email: `bw2-sessions-${stamp}@example.test`,
    password: `Pw-${ID.unique()}`,
    name: 'BW2-Sessions-Beweis',
  })
  cleanup.users.push(user.$id)
  // Der Zugang hängt an einer verifizierten Adresse (`decideBrandAccess`).
  await users.updateEmailVerification({ userId: user.$id, emailVerification: true })
  const access = await tablesDB.createRow({
    databaseId,
    tableId: 'brand_access',
    rowId: ID.unique(),
    data: { userId: user.$id, grantedVia: 'operator', inviteId: '', revokedAt: null },
  })
  cleanup.access.push(access.$id)
  const session = await users.createSession({ userId: user.$id })
  return { id: user.$id, cookie: `a_session_${projectId}=${encodeURIComponent(session.secret)}` }
}

/** Die KI muss AN sein, sonst antwortet die Route `{ conversed: false }`. */
async function ensureAiEnabled() {
  let row = null
  try {
    row = await tablesDB.getRow({ databaseId, tableId: 'app_config', rowId: 'global' })
  }
  catch { /* keine Zeile */ }
  if (row?.brandAiEnabled === true) return
  cleanup.aiFlag = row ? { existed: true, before: row.brandAiEnabled ?? null } : { existed: false }
  if (row) {
    await tablesDB.updateRow({
      databaseId, tableId: 'app_config', rowId: 'global', data: { brandAiEnabled: true },
    })
  }
  else {
    await tablesDB.createRow({
      databaseId, tableId: 'app_config', rowId: 'global', data: { brandAiEnabled: true },
    })
  }
}

/** Eine Verlaufs-Zeile von Hand — der Beweis darf kein Modell brauchen. */
async function seedMessage(profileId, stepKey, sessionKey, role, body) {
  const row = await tablesDB.createRow({
    databaseId,
    tableId: 'brand_messages',
    rowId: ID.unique(),
    data: { profileId, stepKey, sessionKey, role, body, parts: '', generationId: '' },
  })
  cleanup.messages.push(row.$id)
  return row.$id
}

/** Slots einer Kapitel-Zeile setzen — ohne die Route, damit nichts verdeckt wird. */
async function setSlots(profileId, stepKey, slots) {
  await tablesDB.updateRow({
    databaseId,
    tableId: 'brand_steps',
    rowId: `${profileId}_${stepKey}`,
    data: { slots: JSON.stringify(slots) },
  })
}

async function setStepState(profileId, stepKey, state) {
  await tablesDB.updateRow({
    databaseId, tableId: 'brand_steps', rowId: `${profileId}_${stepKey}`, data: { state },
  })
}

try {
  await ensureAiEnabled()
  const account = await makeAccount()

  const created = await call('/api/brand/profiles', {
    method: 'POST',
    cookie: account.cookie,
    body: {
      title: 'Kailua Coffee',
      contentLocale: 'de',
      pathKind: 'new',
      hasName: true,
      team: 'solo',
      industry: 'Kaffeerösterei',
      about: 'Wir rösten Kaffee in kleinen Mengen.',
      audience: 'Cafés auf Maui.',
    },
  })
  if (created.status !== 201 && created.status !== 200) {
    console.error(`✗ Branding konnte nicht angelegt werden (${created.status}): ${created.text.slice(0, 300)}`)
    process.exit(1)
  }
  const profileId = created.json?.profile?.id ?? created.json?.id
  if (!profileId) {
    console.error(`✗ Keine Profil-Id in der Antwort: ${created.text.slice(0, 300)}`)
    process.exit(1)
  }
  cleanup.profiles.push(profileId)
  const base = `/api/brand/profiles/${profileId}`

  console.log('\n1 · Der Eröffnungszug ist idempotent')
  const opening = await call(`${base}/steps/context/converse`, {
    method: 'POST',
    cookie: account.cookie,
    body: { opening: true, sessionKey: 'a.origin' },
  })
  check('erster Eröffnungszug ⇒ 200 mit Strom', opening.status === 200
    && opening.contentType.includes('text/event-stream'),
  `${opening.status} ${opening.contentType}`)

  // Ohne Anbieter-Schlüssel schreibt die Route keine Berater-Zeile (der Zug
  // endet als `provider_error`). Für die Idempotenz zählt genau diese Zeile —
  // also legt der Beweis sie an, statt sie zu erwürfeln.
  await seedMessage(profileId, 'context', 'a.origin', 'george', 'Womit fangen wir an?')

  const again = await call(`${base}/steps/context/converse`, {
    method: 'POST',
    cookie: account.cookie,
    body: { opening: true, sessionKey: 'a.origin' },
  })
  check('zweiter Eröffnungszug ⇒ skipped statt zweitem Zug',
    again.status === 200 && again.json?.skipped === true && again.json?.conversed === false,
    `${again.status} ${again.text.slice(0, 120)}`)
  check('… und ohne Strom', !again.contentType.includes('text/event-stream'), again.contentType)

  console.log('\n2 · Eine Session gehört ihrem Kapitel')
  const foreign = await call(`${base}/steps/context/converse`, {
    method: 'POST',
    cookie: account.cookie,
    body: { text: 'Wir haben 2019 angefangen.', sessionKey: 'b.purpose' },
  })
  check('fremde Session ⇒ 400 session_foreign',
    foreign.status === 400 && foreign.json?.reason === 'session_foreign',
    `${foreign.status} ${foreign.text.slice(0, 160)}`)

  const unknown = await call(`${base}/steps/context/converse`, {
    method: 'POST',
    cookie: account.cookie,
    body: { text: 'Wir haben 2019 angefangen.', sessionKey: 'a.erfunden' },
  })
  check('unbekannte Session ⇒ dieselbe Antwort',
    unknown.status === 400 && unknown.json?.reason === 'session_foreign',
    `${unknown.status}`)

  console.log('\n3 · Eine gesperrte Session ist nicht besprechbar')
  // Damit der BAUSTEIN erreichbar ist (sonst käme 403 aus der Journey), sind
  // seine Vorgänger abgeschlossen; `c.candidates` liest sieben bestätigte
  // Felder, von denen keines steht.
  for (const stepKey of ['context', 'pvm', 'architecture']) {
    await setStepState(profileId, stepKey, 'done')
  }
  const locked = await call(`${base}/steps/values/converse`, {
    method: 'POST',
    cookie: account.cookie,
    body: { text: 'Verlässlichkeit, glaube ich.', sessionKey: 'c.candidates' },
  })
  check('gesperrte Session ⇒ 409 session_locked',
    locked.status === 409 && locked.json?.reason === 'session_locked',
    `${locked.status} ${locked.text.slice(0, 160)}`)
  for (const stepKey of ['context', 'pvm', 'architecture']) {
    await setStepState(profileId, stepKey, 'open')
  }

  console.log('\n4 · Der Verlauf hängt an der Session')
  await seedMessage(profileId, 'context', 'a.customerPraise', 'user', 'Sie loben die Röstung.')
  await seedMessage(profileId, 'context', '', 'user', 'Alter Kapitel-Zug ohne Session.')

  const ownThread = await call(`${base}/messages?stepKey=context&session=a.customerPraise`, {
    cookie: account.cookie,
  })
  const ownBodies = (ownThread.json?.messages ?? []).map(entry => entry.body)
  check('`?session=` liefert genau diesen Faden',
    ownThread.status === 200 && ownBodies.length === 1 && ownBodies[0] === 'Sie loben die Röstung.',
    `${ownThread.status} ${JSON.stringify(ownBodies)}`)
  check('jede Zeile trägt ihren Schlüssel',
    (ownThread.json?.messages ?? []).every(entry => typeof entry.sessionKey === 'string'),
    JSON.stringify(ownThread.json?.messages?.[0] ?? null))

  const wholeChapter = await call(`${base}/messages?stepKey=context`, { cookie: account.cookie })
  check('ohne `?session=` kommt das ganze Kapitel',
    (wholeChapter.json?.messages ?? []).length === 3,
    String((wholeChapter.json?.messages ?? []).length))

  console.log('\n5 · Bestand: der leere Schlüssel gehört der ERSTEN Session')
  // `a.pitch` ist die erste Session des Kapitels — ihr Prompt-Fenster nimmt
  // die Alt-Zeile mit. Nachweisbar an der Leseroute ist die REGEL nicht (die
  // filtert exakt), also wird sie an der Ablage geprüft: die Alt-Zeile trägt
  // wirklich '' und keine erfundene Id.
  const legacy = (wholeChapter.json?.messages ?? [])
    .find(entry => entry.body === 'Alter Kapitel-Zug ohne Session.')
  check('die Alt-Zeile trägt den LEEREN Schlüssel', legacy?.sessionKey === '',
    JSON.stringify(legacy ?? null))
  const firstThread = await call(`${base}/messages?stepKey=context&session=a.pitch`, {
    cookie: account.cookie,
  })
  check('GEGENPROBE: die Leseroute filtert EXAKT (kein Alt-Zug bei a.pitch)',
    (firstThread.json?.messages ?? []).length === 0,
    String((firstThread.json?.messages ?? []).length))

  console.log('\n6 · Die Sammel-Session schreibt EINEN Wert aus drei Teilen')
  const parts = ['3 fest, 2 auf Saison', '2021', 'Landkreis und Wochenmarkt']
  for (const [index, text] of parts.entries()) {
    const turn = await call(`${base}/steps/context/converse`, {
      method: 'POST',
      cookie: account.cookie,
      body: { text, sessionKey: 'a.facts' },
    })
    check(`Teil ${index + 1} angenommen`, turn.status === 200, String(turn.status))
    const detail = await call(`${base}/steps/context`, { cookie: account.cookie })
    const collected = detail.json?.sessions?.['a.facts']?.collected ?? {}
    check(`… ${index + 1} Teil(e) gesammelt`, Object.keys(collected).length === index + 1,
      JSON.stringify(collected))
    const value = detail.json?.slots?.['a.facts']?.latestDraft ?? null
    if (index < parts.length - 1) {
      check('… und noch KEIN Wert', value === null, String(value))
    }
    else {
      check('… nach dem letzten Teil steht der Wert', value === [
        '## Team', '3 fest, 2 auf Saison', '',
        '## Seit', '2021', '',
        '## Märkte', 'Landkreis und Wochenmarkt',
      ].join('\n'), JSON.stringify(value))
      check('… als unbestätigter Entwurf',
        detail.json?.slots?.['a.facts']?.confirmed === null,
        JSON.stringify(detail.json?.slots?.['a.facts'] ?? null))
    }
  }

  console.log('\n7 · Der Baustein liefert den Stand JE Session')
  await setSlots(profileId, 'context', {})
  const detail = await call(`${base}/steps/context`, { cookie: account.cookie })
  const sessions = detail.json?.sessions ?? {}
  check('jede Session des Kapitels steht drin',
    Object.keys(sessions).length === 11, String(Object.keys(sessions).length))
  check('a.origin ist offen (keine Slot-Eingaben)', sessions['a.origin']?.state === 'open',
    JSON.stringify(sessions['a.origin'] ?? null))
  check('Umfang, Vertraulichkeit und Arbeitsform reisen mit',
    sessions['a.facts']?.kind === 'collect'
    && sessions['a.facts']?.sensitivity === 'internal'
    && typeof sessions['a.facts']?.effort?.minutes === 'number',
    JSON.stringify(sessions['a.facts'] ?? null))
  check('„wohin fliesst das später" ist gerechnet, nicht gepflegt',
    sessions['a.customerPraise']?.affects?.count === 29
    && (sessions['a.customerPraise']?.affects?.steps ?? []).length === 7,
    JSON.stringify(sessions['a.customerPraise']?.affects ?? null))
  check('GEGENPROBE: ein Feld ganz unten berührt nichts',
    sessions['a.challenge']?.affects?.count === 0,
    JSON.stringify(sessions['a.challenge']?.affects ?? null))
}
catch (error) {
  fail++
  console.error('\n✗ Abbruch:', error instanceof Error ? error.message : error)
}
finally {
  for (const id of cleanup.messages) {
    await tablesDB.deleteRow({ databaseId, tableId: 'brand_messages', rowId: id }).catch(() => {})
  }
  for (const id of cleanup.profiles) {
    await call(`/api/brand/profiles/${id}`, { method: 'DELETE' }).catch(() => {})
    await tablesDB.deleteRow({ databaseId, tableId: 'brand_profiles', rowId: id }).catch(() => {})
    for (const stepKey of [
      'context', 'pvm', 'architecture', 'values', 'archetype', 'manifesto', 'verbal', 'naming', 'result',
    ]) {
      await tablesDB.deleteRow({ databaseId, tableId: 'brand_steps', rowId: `${id}_${stepKey}` })
        .catch(() => {})
    }
    const rest = await tablesDB.listRows({
      databaseId,
      tableId: 'brand_messages',
      queries: [Query.equal('profileId', id), Query.limit(200)],
    }).catch(() => ({ rows: [] }))
    for (const row of rest.rows) {
      await tablesDB.deleteRow({ databaseId, tableId: 'brand_messages', rowId: row.$id }).catch(() => {})
    }
  }
  for (const id of cleanup.access) {
    await tablesDB.deleteRow({ databaseId, tableId: 'brand_access', rowId: id }).catch(() => {})
  }
  for (const id of cleanup.users) {
    await users.delete({ userId: id }).catch(() => {})
  }
  if (cleanup.aiFlag) {
    if (cleanup.aiFlag.existed) {
      await tablesDB.updateRow({
        databaseId,
        tableId: 'app_config',
        rowId: 'global',
        data: { brandAiEnabled: cleanup.aiFlag.before },
      }).catch(() => {})
    }
    else {
      await tablesDB.deleteRow({ databaseId, tableId: 'app_config', rowId: 'global' }).catch(() => {})
    }
  }

  console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass}/${pass + fail} Prüfungen bestanden`)
  process.exit(fail === 0 ? 0 : 1)
}
