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
 * Seit Paket 3b (BW2 §5a) kommen die vier Zusagen der FINALEN ABNAHME dazu:
 *
 *  8. ABNAHME-FLUSS: bestätigen ⇒ abnehmen ⇒ `acceptance.ready` ⇒ `complete`.
 *     Und die Gegenprobe davor: ohne Abnahme weist `complete` mit
 *     `acceptance_incomplete` ab.
 *  9. RESTART-HÜLLE: ohne bestätigte spätere Kapitel `count: 0`; sobald in
 *     einem späteren Kapitel etwas bestätigt ist, > 0.
 * 10. RESTART-SCHUTZ: ohne Ack 409 `restart_unacknowledged`.
 * 11. RESTART: mit Ack ⇒ Schnappschuss-Ereignis, leere Slots, `restartedAt`,
 *     abgeschnittener Verlauf — und die abhängige Session eines SPÄTEREN
 *     Kapitels steht danach auf `stale`, ohne dass ihre Zeile angefasst wurde.
 *
 * ── WAS DIESER BEWEIS NICHT BEWEIST ──────────────────────────────────────
 * Den Anbieter. Ohne `NUXT_AI_KEY` wirft `aiCompleteStream` (503), die Route
 * schickt `generation.failed` mit `provider_error` — und genau das ist hier
 * unwichtig: geprüft wird, was VOR und NEBEN dem Modell passiert (Sperren,
 * Schlüssel, Ablage). Wo ein Zug des Beraters gebraucht wird (Zusage 1 und 4),
 * legt das Skript ihn selbst an, statt ihn zu erwürfeln.
 *
 * ── VORBEDINGUNGEN ───────────────────────────────────────────────────────
 * Lokale Dev-Appwrite mit den `brand_*`-Tabellen (Migration bis brand-013)
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

  // ── 8 · Die Finale Abnahme (BW2 §5a, Paket 3b) ────────────────────────
  //
  // Gearbeitet wird im Kapitel `values`: es hat neun Sessions, davon acht
  // Pflicht und eine optionale — genug, damit „Pflicht zählt, optional ohne
  // Wert nicht" auch wirklich etwas beweist.
  console.log('\n8 · Abnehmen: bestätigen, abnehmen, abschliessen')
  for (const stepKey of ['context', 'pvm', 'architecture']) {
    await setStepState(profileId, stepKey, 'done')
  }
  const valuesRequired = [
    'c.discovery1', 'c.discovery2', 'c.discovery3', 'c.candidates',
    'c.final', 'c.definitions', 'c.livedExamples', 'c.conflictRule',
  ]
  await setSlots(profileId, 'values', Object.fromEntries(
    valuesRequired.map(id => [id, { firstDraft: 'steht', latestDraft: 'steht', confirmed: 'steht' }]),
  ))
  await setStepState(profileId, 'values', 'active')

  const valuesBase = `${base}/steps/values`
  let page = await call(`${valuesBase}/acceptance`, { cookie: account.cookie })
  check('die Abnahme-Seite listet jede Session des Kapitels',
    page.status === 200 && (page.json?.sessions ?? []).length === 9,
    `${page.status} ${(page.json?.sessions ?? []).length}`)
  check('… mit Beispiel in BEIDEN Sprachen und der Frage „wohin fliesst das"',
    (page.json?.sessions ?? []).every(entry => Array.isArray(entry.example?.de)
      && Array.isArray(entry.example?.en)
      && typeof entry.affects?.count === 'number'),
    JSON.stringify((page.json?.sessions ?? [])[0] ?? null))
  check('… und sagt: bestätigt ist NICHT abgenommen',
    page.json?.acceptance?.ready === false
    && page.json?.acceptance?.accepted === 0
    && page.json?.acceptance?.total === 8
    && (page.json?.acceptance?.blockers ?? []).every(b => b.reason === 'unaccepted'),
    JSON.stringify(page.json?.acceptance ?? null))

  const tooEarly = await call(`${valuesBase}/complete`, {
    method: 'POST', cookie: account.cookie, body: { confidence: 'fits' },
  })
  check('GEGENPROBE: `complete` weist ohne Abnahme mit `acceptance_incomplete` ab',
    tooEarly.status === 400 && tooEarly.json?.reason === 'acceptance_incomplete',
    `${tooEarly.status} ${tooEarly.text.slice(0, 160)}`)

  let revision = page.json?.revision ?? 0
  for (const slotId of valuesRequired) {
    const taken = await call(`${valuesBase}/sessions/${slotId}/accept`, {
      method: 'POST', cookie: account.cookie, body: { revision },
    })
    if (taken.status !== 200) {
      check(`Abnahme ${slotId}`, false, `${taken.status} ${taken.text.slice(0, 160)}`)
      break
    }
    revision = taken.json?.revision ?? revision
  }
  check('alle acht Pflicht-Sessions abgenommen ⇒ ready', await (async () => {
    page = await call(`${valuesBase}/acceptance`, { cookie: account.cookie })
    return page.json?.acceptance?.ready === true && page.json?.acceptance?.accepted === 8
  })(), JSON.stringify(page.json?.acceptance ?? null))

  const unknownSession = await call(`${valuesBase}/sessions/a.pitch/accept`, {
    method: 'POST', cookie: account.cookie, body: { revision },
  })
  check('GEGENPROBE: eine fremde Session gibt es an dieser Adresse nicht (404)',
    unknownSession.status === 404, String(unknownSession.status))

  const deferNotAllowed = await call(`${valuesBase}/sessions/c.final/defer`, {
    method: 'POST', cookie: account.cookie, body: { revision },
  })
  check('GEGENPROBE: vertagen nur, wo die Session es erlaubt',
    deferNotAllowed.status === 400 && deferNotAllowed.json?.reason === 'defer_not_allowed',
    `${deferNotAllowed.status} ${deferNotAllowed.text.slice(0, 160)}`)

  const completed = await call(`${valuesBase}/complete`, {
    method: 'POST', cookie: account.cookie, body: { confidence: 'fits' },
  })
  check('… und JETZT schliesst das Kapitel ab',
    completed.status === 200 && completed.json?.storedState === 'done',
    `${completed.status} ${completed.text.slice(0, 160)}`)

  // ── 9 · Was „Nochmal von vorn" kostet ────────────────────────────────
  console.log('\n9 · Die Restart-Hülle wächst mit den späteren Kapiteln')
  let impact = await call(`${valuesBase}/restart-impact`, { cookie: account.cookie })
  check('ohne bestätigte spätere Kapitel berührt der Restart nichts',
    impact.status === 200 && impact.json?.downstream?.count === 0,
    `${impact.status} ${JSON.stringify(impact.json?.downstream ?? null)}`)
  check('… zählt aber, was IM Kapitel verloren geht',
    impact.json?.chapter?.values === 8 && impact.json?.chapter?.accepted === 8,
    JSON.stringify(impact.json?.chapter ?? null))

  // `d.voiceSamples` schöpft aus `c.final` — bestätigt MIT dem Quellen-Hash,
  // den der Autosave stempelt (sonst wäre der `stale`-Beweis unten wertlos).
  await setStepState(profileId, 'archetype', 'active')
  const voiceValue = 'Ein Satz, wie die Marke klingt.'
  const voicePatch = await call(`${base}/steps/archetype`, {
    method: 'PATCH',
    cookie: account.cookie,
    body: { revision: 0, slots: { 'd.voiceSamples': { value: voiceValue, confirmed: true } } },
  })
  check('eine Session des SPÄTEREN Kapitels ist bestätigt', voicePatch.status === 200,
    `${voicePatch.status} ${voicePatch.text.slice(0, 160)}`)
  // Das spätere Kapitel wird ABGESCHLOSSEN gesetzt: ein gespeichertes `done`
  // bleibt betretbar, auch wenn sein Vorgänger nach dem Restart wieder offen
  // ist („zurück ist immer erlaubt", brandJourney.ts) — nur so ist der
  // `stale`-Nachweis unten überhaupt lesbar.
  await setStepState(profileId, 'archetype', 'done')

  const archetypeBefore = await call(`${base}/steps/archetype`, { cookie: account.cookie })
  check('… und steht auf `done` (ihr Quellen-Hash passt zum Stand)',
    archetypeBefore.json?.sessions?.['d.voiceSamples']?.state === 'done',
    JSON.stringify(archetypeBefore.json?.sessions?.['d.voiceSamples'] ?? null))

  impact = await call(`${valuesBase}/restart-impact`, { cookie: account.cookie })
  check('jetzt meldet die Hülle das spätere Feld',
    impact.json?.downstream?.count > 0
    && (impact.json?.downstream?.byStep?.archetype ?? []).includes('d.voiceSamples'),
    JSON.stringify(impact.json?.downstream ?? null))

  // ── 10/11 · Der Schutz und der Neubeginn ─────────────────────────────
  console.log('\n10 · „Nochmal von vorn" braucht eine Bestätigung')
  await seedMessage(profileId, 'values', 'c.discovery1', 'george', 'Wovon erzählst du?')
  const before = await call(`${base}/messages?stepKey=values&session=c.discovery1`, {
    cookie: account.cookie,
  })
  check('der Verlauf des Kapitels ist da', (before.json?.messages ?? []).length === 1,
    String((before.json?.messages ?? []).length))

  const restartRevision = impact.json?.revision ?? 0
  const noAck = await call(`${valuesBase}/restart`, {
    method: 'POST',
    cookie: account.cookie,
    body: { revision: restartRevision, acknowledge: false, impactAck: impact.json?.ack ?? '' },
  })
  check('ohne `acknowledge` ⇒ 409 restart_unacknowledged',
    noAck.status === 409 && noAck.json?.reason === 'restart_unacknowledged',
    `${noAck.status} ${noAck.text.slice(0, 160)}`)

  const staleAck = await call(`${valuesBase}/restart`, {
    method: 'POST',
    cookie: account.cookie,
    body: { revision: restartRevision, acknowledge: true, impactAck: 'stand-von-gestern' },
  })
  check('mit falschem Ack dieselbe Abweisung',
    staleAck.status === 409 && staleAck.json?.reason === 'restart_unacknowledged',
    `${staleAck.status}`)

  console.log('\n11 · Der Neubeginn: leer, geschnitten, veraltet')
  const restarted = await call(`${valuesBase}/restart`, {
    method: 'POST',
    cookie: account.cookie,
    body: {
      revision: restartRevision,
      acknowledge: true,
      impactAck: impact.json?.ack ?? '',
    },
  })
  check('mit Ack ⇒ 200 und ein Zeitstempel',
    restarted.status === 200 && Boolean(restarted.json?.restartedAt),
    `${restarted.status} ${restarted.text.slice(0, 200)}`)
  check('… und der Wegweiser zeigt auf die erste Session',
    restarted.json?.next?.sessionKey === 'c.discovery1',
    JSON.stringify(restarted.json?.next ?? null))

  const afterDetail = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('die Slots des Kapitels sind leer',
    Object.keys(afterDetail.json?.slots ?? {}).length === 0,
    JSON.stringify(Object.keys(afterDetail.json?.slots ?? {})))
  check('… der Zustand ist wieder `active`, ohne Konfidenz',
    afterDetail.json?.storedState === 'active' && afterDetail.json?.confidence === null,
    `${afterDetail.json?.storedState} / ${afterDetail.json?.confidence}`)
  // Appwrite normalisiert den Zeitstempel beim Speichern (`+00:00` statt `Z`)
  // — verglichen wird deshalb der ZEITPUNKT, nicht die Schreibweise.
  check('… und `restartedAt` steht in der Antwort',
    new Date(afterDetail.json?.restartedAt ?? 0).getTime()
    === new Date(restarted.json?.restartedAt ?? 1).getTime(),
    `${afterDetail.json?.restartedAt} vs ${restarted.json?.restartedAt}`)

  const afterMessages = await call(`${base}/messages?stepKey=values&session=c.discovery1`, {
    cookie: account.cookie,
  })
  check('der Verlauf des Kapitels ist abgeschnitten',
    (afterMessages.json?.messages ?? []).length === 0,
    String((afterMessages.json?.messages ?? []).length))
  const otherChapter = await call(`${base}/messages?stepKey=context`, { cookie: account.cookie })
  check('GEGENPROBE: ein ANDERES Kapitel behält seinen Verlauf',
    (otherChapter.json?.messages ?? []).length > 0,
    String((otherChapter.json?.messages ?? []).length))

  const events = await tablesDB.listRows({
    databaseId,
    tableId: 'brand_events',
    queries: [Query.equal('profileId', profileId), Query.equal('type', 'step.restarted'), Query.limit(5)],
  })
  check('der Schnappschuss liegt als Ereignis vor', events.rows.length === 1,
    String(events.rows.length))
  const payload = events.rows[0] ? JSON.parse(events.rows[0].payload || '{}') : {}
  check('… und trägt den Stand VOR dem Löschen',
    payload.stepKey === 'values' && payload.values === 8 && payload.accepted === 8,
    JSON.stringify(payload).slice(0, 200))

  const archetypeAfter = await call(`${base}/steps/archetype`, { cookie: account.cookie })
  check('die abhängige Session des SPÄTEREN Kapitels ist jetzt `stale`',
    archetypeAfter.json?.sessions?.['d.voiceSamples']?.state === 'stale',
    JSON.stringify(archetypeAfter.json?.sessions?.['d.voiceSamples'] ?? null))
  check('… und ihr Wert steht unangetastet da (nichts wurde gelöscht)',
    archetypeAfter.json?.slots?.['d.voiceSamples']?.confirmed === voiceValue,
    JSON.stringify(archetypeAfter.json?.slots?.['d.voiceSamples'] ?? null))
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
  for (const id of cleanup.profiles) {
    const events = await tablesDB.listRows({
      databaseId,
      tableId: 'brand_events',
      queries: [Query.equal('profileId', id), Query.limit(200)],
    }).catch(() => ({ rows: [] }))
    for (const row of events.rows) {
      await tablesDB.deleteRow({ databaseId, tableId: 'brand_events', rowId: row.$id }).catch(() => {})
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
