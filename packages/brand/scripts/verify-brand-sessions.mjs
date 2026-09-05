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
 * Seit Paket 4 (BW2 §7/§8) kommen die drei Zusagen des SPEZIALISTEN dazu:
 *
 * 12. SCHLIESSEN: `POST …/sessions/:id/close` schreibt Urteil und Notizen
 *     (`reviewed: true`) und antwortet mit dem ADAPTIVEN Wegweiser — der
 *     Ersatz nennt die LETZTE offene Session, die Grundfassung wäre die
 *     erste. Ein zweiter Klick bewegt nichts (Idempotenz).
 * 13. KONFLIKT: ein Befund aus dem Schliess-Aufruf sperrt die Finale Abnahme
 *     (`ready: false`, Blocker `conflict`); das Ablehnen MIT Grund öffnet sie
 *     wieder und hängt den Grund als Notiz an die Quell-Session.
 * 14. KAPITEL-BLICK: `POST …/review` prüft dieselbe Fassung genau einmal —
 *     mit GEGENPROBE (nach einer neuen Fassung läuft er wieder).
 *
 * Seit Paket 6 (BW2 §9) kommen die drei Zusagen der KORREKTUR-REGEL dazu:
 *
 * 15. IMPACT UND ACK: `GET …/sessions/:id/impact` nennt die bestätigten
 *     Abhängigen; der PATCH, der die Bestätigung aufhebt, wird OHNE passendes
 *     `impactAck` mit 409 abgewiesen — mit GEGENPROBE (fremder Hash). Danach
 *     stehen die Abhängigen in der Warteschlange, und „Gilt weiter"
 *     (`restamp`) holt GENAU EINE davon zurück, ohne ihren Wert anzufassen.
 * 16. EINGRENZUNG: wird das Feld erneut bestätigt, läuft der Schliess-Aufruf
 *     im `correct`-Modus. Mit `?stub=affected` bleibt genau ein Feld veraltet
 *     und bekommt seinen Befund; der Rest wird neu gestempelt.
 * 17. INVARIANTEN: `c.final` mit zwei Einträgen ⇒ 409 `invariant_violated`,
 *     dieselben drei Werte in EINER Zeile ⇒ 200 (die Sache zählt, nicht die
 *     Schreibweise — Paket-1-Befund (a)).
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
 * Der Dev-Server braucht seit Paket 4 den ERSATZ-SPEZIALISTEN, sonst gäbe es
 * ohne KI-Schlüssel kein Urteil (fail-soft, §7) — `BRAND_DEV_STUB_REVIEW=1`
 * schaltet ihn ein und wirkt NUR dort (`server/utils/brandReview.ts`):
 *
 *   BRAND_DEV_STUB_REVIEW=1 pnpm --filter branding exec nuxi dev --port 3016
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

/** Die Fassung einer Kapitel-Zeile bewegen — ohne Route, für die Gegenprobe zu 14. */
async function bumpRevision(profileId, stepKey, revision) {
  await tablesDB.updateRow({
    databaseId, tableId: 'brand_steps', rowId: `${profileId}_${stepKey}`, data: { revision },
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

  // ── 12 · Der Spezialist beim Schliessen (BW2 Paket 4, §7) ────────────
  console.log('\n12 · Schliessen: Urteil, Notizen und der ADAPTIVE Wegweiser')
  // Nur EIN bestätigtes Feld ⇒ zwei offene Sessions. Nur so lassen sich der
  // Vorschlag des Spezialisten (letzte offene) und die Grundfassung (erste
  // offene) überhaupt auseinanderhalten.
  await setSlots(profileId, 'values', {
    'c.discovery1': { firstDraft: 'steht', latestDraft: 'steht', confirmed: 'steht' },
  })
  let valuesDetail = await call(`${base}/steps/values`, { cookie: account.cookie })
  const closeRevision = valuesDetail.json?.revision ?? 0

  const closed = await call(`${valuesBase}/sessions/c.discovery1/close`, {
    method: 'POST', cookie: account.cookie, body: { revision: closeRevision },
  })
  check('der Schliess-Aufruf läuft und meldet ein Urteil',
    closed.status === 200 && closed.json?.reviewed === true && closed.json?.reviewedBy === 'stage1',
    `${closed.status} ${closed.text.slice(0, 200)}`)
  check('… die Notiz landet an der Session',
    (closed.json?.review?.notes ?? []).length > 0,
    JSON.stringify(closed.json?.review ?? null))
  check('… und der Wegweiser folgt dem Vorschlag, NICHT der Grundfassung',
    closed.json?.next?.sessionKey === 'c.discovery3',
    JSON.stringify(closed.json?.next ?? null))
  check('… die Fassung ist gestiegen', closed.json?.revision === closeRevision + 1,
    `${closed.json?.revision} statt ${closeRevision + 1}`)

  valuesDetail = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('… und die Session trägt `reviewed` samt Notiz',
    valuesDetail.json?.sessions?.['c.discovery1']?.reviewed === true
    && typeof valuesDetail.json?.sessions?.['c.discovery1']?.notes === 'string',
    JSON.stringify(valuesDetail.json?.sessions?.['c.discovery1'] ?? null))

  const closedAgain = await call(`${valuesBase}/sessions/c.discovery1/close`, {
    method: 'POST', cookie: account.cookie, body: { revision: closed.json?.revision ?? 0 },
  })
  check('GEGENPROBE: der zweite Klick bewegt nichts (Idempotenz)',
    closedAgain.status === 200
    && closedAgain.json?.reviewed === true
    && closedAgain.json?.revision === closed.json?.revision,
    `${closedAgain.status} ${closedAgain.json?.revision}`)

  const unconfirmed = await call(`${valuesBase}/sessions/c.discovery2/close`, {
    method: 'POST', cookie: account.cookie, body: { revision: closedAgain.json?.revision ?? 0 },
  })
  check('GEGENPROBE: eine unbestätigte Session ⇒ 409 not_confirmed',
    unconfirmed.status === 409 && unconfirmed.json?.reason === 'not_confirmed',
    `${unconfirmed.status} ${unconfirmed.text.slice(0, 160)}`)

  // ── 13 · Ein offener Konflikt sperrt die Abnahme (§5a Schritt 3) ─────
  console.log('\n13 · Der Konflikt sperrt — und das Ablehnen mit Grund öffnet')
  await setSlots(profileId, 'values', Object.fromEntries(
    valuesRequired.map(id => [id, {
      firstDraft: 'steht', latestDraft: 'steht', confirmed: 'steht', accepted: true,
    }]),
  ))
  await setStepState(profileId, 'values', 'active')

  page = await call(`${valuesBase}/acceptance`, { cookie: account.cookie })
  check('vor dem Befund ist die Abnahme bereit', page.json?.acceptance?.ready === true,
    JSON.stringify(page.json?.acceptance ?? null))

  const withConflict = await call(
    `${valuesBase}/sessions/c.final/close?stub=conflict`,
    { method: 'POST', cookie: account.cookie, body: { revision: page.json?.revision ?? 0 } },
  )
  check('der Schliess-Aufruf legt den Befund an',
    withConflict.status === 200 && (withConflict.json?.findings ?? []).length === 1,
    `${withConflict.status} ${withConflict.text.slice(0, 200)}`)

  page = await call(`${valuesBase}/acceptance`, { cookie: account.cookie })
  check('… und die Abnahme ist gesperrt, mit dem Grund `conflict`',
    page.json?.acceptance?.ready === false
    && (page.json?.acceptance?.blockers ?? []).some(entry => entry.reason === 'conflict'),
    JSON.stringify(page.json?.acceptance ?? null))
  check('… der Chip-Datensatz hängt am Block (Paket 5 rendert ihn)',
    (page.json?.sessions ?? []).some(entry => (entry.findings ?? []).length > 0),
    JSON.stringify((page.json?.sessions ?? []).map(entry => (entry.findings ?? []).length)))

  const blockedComplete = await call(`${valuesBase}/complete`, {
    method: 'POST', cookie: account.cookie, body: { confidence: 'fits' },
  })
  check('… und `complete` weist ab',
    blockedComplete.status === 400 && blockedComplete.json?.reason === 'acceptance_incomplete',
    `${blockedComplete.status} ${blockedComplete.text.slice(0, 160)}`)

  const openFindings = await call(`${base}/findings?status=open`, { cookie: account.cookie })
  check('die Befund-Liste zeigt genau den einen offenen',
    openFindings.status === 200 && (openFindings.json?.findings ?? []).length === 1
    && openFindings.json.findings[0].kind === 'conflict'
    && openFindings.json.findings[0].slots.length === 2,
    `${openFindings.status} ${openFindings.text.slice(0, 200)}`)
  const findingId = openFindings.json?.findings?.[0]?.id
  const sourceSession = openFindings.json?.findings?.[0]?.sourceSession

  const noReason = await call(`${base}/findings/${findingId}`, {
    method: 'POST', cookie: account.cookie, body: { status: 'dismissed' },
  })
  check('GEGENPROBE: ablehnen OHNE Grund wird abgewiesen', noReason.status === 400,
    `${noReason.status} ${noReason.text.slice(0, 160)}`)

  const dismissed = await call(`${base}/findings/${findingId}`, {
    method: 'POST',
    cookie: account.cookie,
    body: { status: 'dismissed', dismissReason: 'Das ist bei uns Absicht.' },
  })
  check('mit Grund geht es — und der Befund ist entschieden',
    dismissed.status === 200 && dismissed.json?.finding?.status === 'dismissed',
    `${dismissed.status} ${dismissed.text.slice(0, 200)}`)

  valuesDetail = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('… der Grund hängt als Notiz an der QUELL-Session',
    (valuesDetail.json?.sessions?.[sourceSession]?.notes ?? '').includes('Das ist bei uns Absicht.'),
    JSON.stringify(valuesDetail.json?.sessions?.[sourceSession] ?? null))

  page = await call(`${valuesBase}/acceptance`, { cookie: account.cookie })
  check('… und die Abnahme ist wieder bereit', page.json?.acceptance?.ready === true,
    JSON.stringify(page.json?.acceptance ?? null))

  // ── 14 · Der Kapitel-Blick läuft einmal je Fassung (§5a) ─────────────
  console.log('\n14 · Der Kapitel-Blick: einmal je Fassung')
  const firstLook = await call(`${valuesBase}/review`, { method: 'POST', cookie: account.cookie })
  check('der erste Blick läuft',
    firstLook.status === 200 && firstLook.json?.reviewed === true,
    `${firstLook.status} ${firstLook.text.slice(0, 200)}`)
  const beforeSecond = (firstLook.json?.findings ?? []).length

  const secondLook = await call(`${valuesBase}/review?stub=conflict`, {
    method: 'POST', cookie: account.cookie,
  })
  check('derselbe Stand wird NICHT ein zweites Mal geprüft',
    secondLook.status === 200 && (secondLook.json?.findings ?? []).length === beforeSecond,
    `${secondLook.status} ${(secondLook.json?.findings ?? []).length} statt ${beforeSecond}`)

  await bumpRevision(profileId, 'values', (secondLook.json?.revision ?? 0) + 1)
  const thirdLook = await call(`${valuesBase}/review?stub=conflict`, {
    method: 'POST', cookie: account.cookie,
  })
  check('GEGENPROBE: eine NEUE Fassung wird wieder geprüft',
    thirdLook.status === 200 && (thirdLook.json?.findings ?? []).length > beforeSecond,
    `${thirdLook.status} ${(thirdLook.json?.findings ?? []).length} statt > ${beforeSecond}`)

  // ── 15 · Die Korrektur-Regel: Hülle, Ack, Warteschlange (Paket 6, §9) ──
  //
  // Der Aufbau ist die halbe Zusage: `a.customerPraise` (Kapitel A) ist die
  // Quelle von `b.mission` (Kapitel B) und `c.candidates` (Kapitel C). Beide
  // werden über die ROUTE bestätigt und nicht von Hand geschrieben — nur so
  // trägt ihre Zeile den `sourcesHash`, den der Server selbst gestempelt hat.
  // Ein von Hand gesetzter Hash bewiese nur, dass zwei Zeichenketten gleich
  // sind. Und zwei KAPITEL, weil das Stempeln über Kapitelgrenzen geht.
  console.log('\n15 · Korrektur: die Hülle, das Ack und die Warteschlange')
  const contextBase = `${base}/steps/context`
  await setStepState(profileId, 'values', 'active')
  // Der Block steht auf EIGENEN Füssen: was die Blöcke davor bestätigt haben,
  // gehörte zu ihren Zusagen und würde hier nur die Hülle vergrössern.
  for (const stepKey of ['context', 'pvm', 'values', 'archetype']) {
    await setSlots(profileId, stepKey, {})
  }

  async function stepRevision(stepKey) {
    const detail = await call(`${base}/steps/${stepKey}`, { cookie: account.cookie })
    return detail.json?.revision ?? 0
  }

  /** Ein Feld über die Route schreiben — mit dem Stempel, den der Server setzt. */
  async function saveVia(stepKey, slots, extra = {}) {
    return call(`${base}/steps/${stepKey}`, {
      method: 'PATCH',
      cookie: account.cookie,
      body: { revision: await stepRevision(stepKey), slots, ...extra },
    })
  }

  await setStepState(profileId, 'context', 'active')
  const praise = await saveVia('context', {
    'a.customerPraise': { value: 'Ihr habt uns nie hängen lassen.', confirmed: true },
  })
  check('die Quelle ist bestätigt und gestempelt', praise.status === 200
    && typeof praise.json?.slots?.['a.customerPraise']?.confirmed === 'string',
  `${praise.status} ${praise.text.slice(0, 160)}`)

  await setStepState(profileId, 'context', 'done')
  await setStepState(profileId, 'pvm', 'active')
  await saveVia('pvm', {
    'b.mission': { value: 'Wir bringen guten Kaffee auf jeden Tisch.', confirmed: true },
  })
  for (const stepKey of ['pvm', 'architecture']) await setStepState(profileId, stepKey, 'done')
  await saveVia('values', {
    'c.candidates': { value: '- Mut\n- Klarheit\n- Geduld\n- Ruhe', confirmed: true },
  })

  let pvmState = await call(`${base}/steps/pvm`, { cookie: account.cookie })
  let valuesState = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('zwei abhängige Felder in ZWEI Kapiteln stehen bestätigt und aktuell',
    pvmState.json?.sessions?.['b.mission']?.state === 'done'
    && valuesState.json?.sessions?.['c.candidates']?.state === 'done',
    JSON.stringify([
      pvmState.json?.sessions?.['b.mission']?.state,
      valuesState.json?.sessions?.['c.candidates']?.state,
    ]))

  const hull = await call(`${contextBase}/sessions/a.customerPraise/impact`, {
    cookie: account.cookie,
  })
  check('die Hülle nennt genau diese beiden',
    hull.status === 200 && hull.json?.count === 2
    && JSON.stringify(hull.json?.transitive) === JSON.stringify(['b.mission', 'c.candidates']),
    `${hull.status} ${hull.text.slice(0, 240)}`)
  check('… je Kapitel eines, und der Ack ist da',
    (hull.json?.byStep?.pvm ?? []).length === 1 && (hull.json?.byStep?.values ?? []).length === 1
    && typeof hull.json?.ack === 'string' && hull.json.ack.length === 64,
    JSON.stringify(hull.json?.byStep ?? null))

  const contextRevision = await stepRevision('context')
  const withoutAck = await call(`${contextBase}`, {
    method: 'PATCH',
    cookie: account.cookie,
    body: { revision: contextRevision, slots: { 'a.customerPraise': { confirmed: false } } },
  })
  check('OHNE Ack: 409 impact_unacknowledged',
    withoutAck.status === 409 && withoutAck.json?.reason === 'impact_unacknowledged',
    `${withoutAck.status} ${withoutAck.text.slice(0, 200)}`)

  const foreignAck = await call(`${contextBase}`, {
    method: 'PATCH',
    cookie: account.cookie,
    body: {
      revision: contextRevision,
      slots: { 'a.customerPraise': { confirmed: false } },
      impactAck: 'f'.repeat(64),
    },
  })
  check('GEGENPROBE: ein fremder Ack wird ebenso abgewiesen',
    foreignAck.status === 409 && foreignAck.json?.reason === 'impact_unacknowledged',
    `${foreignAck.status}`)

  const corrected = await call(`${contextBase}`, {
    method: 'PATCH',
    cookie: account.cookie,
    body: {
      revision: contextRevision,
      slots: { 'a.customerPraise': { confirmed: false } },
      impactAck: hull.json?.ack,
    },
  })
  check('MIT Ack geht die Korrektur durch',
    corrected.status === 200 && corrected.json?.slots?.['a.customerPraise']?.confirmed === null,
    `${corrected.status} ${corrected.text.slice(0, 200)}`)

  valuesState = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('das AUFHEBEN allein bewegt noch nichts — der Wortlaut ist ja derselbe',
    valuesState.json?.sessions?.['c.candidates']?.state === 'done',
    JSON.stringify(valuesState.json?.sessions?.['c.candidates'] ?? null))

  // ERST DER NEUE WORTLAUT macht die Abhängigen veraltet: „veraltet" ist eine
  // Aussage über die QUELLE, nicht über einen Knopfdruck.
  const rewritten = await saveVia('context', {
    'a.customerPraise': { value: 'Ihr habt uns nie im Stich gelassen.' },
  })
  check('der neue Wortlaut ist gespeichert', rewritten.status === 200,
    `${rewritten.status} ${rewritten.text.slice(0, 160)}`)

  pvmState = await call(`${base}/steps/pvm`, { cookie: account.cookie })
  valuesState = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('… und beide abhängigen Felder stehen jetzt in der Warteschlange',
    pvmState.json?.sessions?.['b.mission']?.state === 'stale'
    && valuesState.json?.sessions?.['c.candidates']?.state === 'stale',
    JSON.stringify([
      pvmState.json?.sessions?.['b.mission']?.state,
      valuesState.json?.sessions?.['c.candidates']?.state,
    ]))

  const keepValid = await call(`${valuesBase}/sessions/c.candidates/restamp`, {
    method: 'POST',
    cookie: account.cookie,
    body: { revision: valuesState.json?.revision ?? 0 },
  })
  check('„Gilt weiter" stempelt neu', keepValid.status === 200,
    `${keepValid.status} ${keepValid.text.slice(0, 200)}`)

  pvmState = await call(`${base}/steps/pvm`, { cookie: account.cookie })
  valuesState = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('… genau diese eine ist wieder aktuell, die andere bleibt bernstein',
    valuesState.json?.sessions?.['c.candidates']?.state === 'done'
    && pvmState.json?.sessions?.['b.mission']?.state === 'stale',
    JSON.stringify([
      valuesState.json?.sessions?.['c.candidates']?.state,
      pvmState.json?.sessions?.['b.mission']?.state,
    ]))
  check('… und der Wert steht dabei unangetastet da',
    valuesState.json?.slots?.['c.candidates']?.confirmed === '- Mut\n- Klarheit\n- Geduld\n- Ruhe',
    JSON.stringify(valuesState.json?.slots?.['c.candidates'] ?? null))

  // ── 16 · Die Eingrenzung durch den Spezialisten (§9, `correct`) ────────
  console.log('\n16 · Die Eingrenzung: nur das Getroffene bleibt veraltet')
  // Der neue Wortlaut UND die Bestätigung in einem Zug — so sieht das Ende
  // einer Korrektur aus. Beide Abhängigen sind damit wieder veraltet: der
  // eine, weil er nie gestempelt wurde, der andere, weil sich die Quelle ein
  // zweites Mal bewegt hat.
  const reconfirmed = await saveVia('context', {
    'a.customerPraise': { value: 'Ihr wart immer da, wenn es eng wurde.', confirmed: true },
  })
  check('das korrigierte Feld ist wieder bestätigt', reconfirmed.status === 200,
    `${reconfirmed.status} ${reconfirmed.text.slice(0, 160)}`)

  const closedCorrect = await call(
    `${contextBase}/sessions/a.customerPraise/close?stub=affected`,
    { method: 'POST', cookie: account.cookie, body: { revision: reconfirmed.json?.revision ?? 0 } },
  )
  check('der Schliess-Aufruf läuft im Korrektur-Modus und grenzt ein',
    closedCorrect.status === 200
    && JSON.stringify(closedCorrect.json?.correction?.affected) === JSON.stringify(['b.mission'])
    && JSON.stringify(closedCorrect.json?.correction?.restamped) === JSON.stringify(['c.candidates']),
    `${closedCorrect.status} ${JSON.stringify(closedCorrect.json?.correction ?? null)}`)

  pvmState = await call(`${base}/steps/pvm`, { cookie: account.cookie })
  valuesState = await call(`${base}/steps/values`, { cookie: account.cookie })
  check('… genau eine bleibt veraltet, die andere ist wieder fertig',
    pvmState.json?.sessions?.['b.mission']?.state === 'stale'
    && valuesState.json?.sessions?.['c.candidates']?.state === 'done',
    JSON.stringify([
      pvmState.json?.sessions?.['b.mission']?.state,
      valuesState.json?.sessions?.['c.candidates']?.state,
    ]))

  const affectedFindings = await call(`${base}/findings?status=open`, { cookie: account.cookie })
  const affectedFound = (affectedFindings.json?.findings ?? []).filter(entry => entry.kind === 'affected')
  check('… und das getroffene Feld trägt seinen Befund',
    affectedFound.length === 1 && JSON.stringify(affectedFound[0]?.slots) === JSON.stringify(['b.mission']),
    `${affectedFindings.status} ${JSON.stringify(affectedFound).slice(0, 200)}`)

  // ── 17 · Die Invarianten sind scharf (§3a Nr. 6) ──────────────────────
  console.log('\n17 · Die Invariante zählt — und lässt jede Schreibweise gelten')
  const three = await saveVia('values', {
    'c.final': { value: '- Mut\n- Klarheit\n- Geduld', confirmed: true },
  })
  check('drei Werte in `c.final` gehen durch', three.status === 200,
    `${three.status} ${three.text.slice(0, 200)}`)

  const freed = await saveVia('values', { 'c.final': { confirmed: false } })
  check('das Feld ist zum Korrigieren offen (leere Hülle ⇒ kein Ack)',
    freed.status === 200 && freed.json?.slots?.['c.final']?.confirmed === null,
    `${freed.status} ${freed.text.slice(0, 200)}`)

  const tooFew = await saveVia('values', {
    'c.final': { value: '- Mut\n- Klarheit', confirmed: true },
  })
  check('zwei Werte in `c.final` ⇒ 409 invariant_violated',
    tooFew.status === 409 && tooFew.json?.reason === 'invariant_violated',
    `${tooFew.status} ${tooFew.text.slice(0, 200)}`)

  const inline = await saveVia('values', {
    'c.final': { value: 'Mut, Klarheit und Geduld', confirmed: true },
  })
  check('drei Werte in EINER Zeile gelten ebenso — die Sache zählt, nicht die Form',
    inline.status === 200 && inline.json?.slots?.['c.final']?.confirmed === 'Mut, Klarheit und Geduld',
    `${inline.status} ${inline.text.slice(0, 200)}`)
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
    const findings = await tablesDB.listRows({
      databaseId,
      tableId: 'brand_findings',
      queries: [Query.equal('profileId', id), Query.limit(200)],
    }).catch(() => ({ rows: [] }))
    for (const row of findings.rows) {
      await tablesDB.deleteRow({ databaseId, tableId: 'brand_findings', rowId: row.$id }).catch(() => {})
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
