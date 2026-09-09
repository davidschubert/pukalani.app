/**
 * DER BEWEIS DER FREISCHALTUNG „ABLEITUNG" (Konzept
 * docs/plans/BRAND-BOOK-KIT.md §2.8/§2.9, Paket K1) — EIN Lauf von der
 * gesperrten Schicht 3 über die Betreiber-Handlung bis zur Rücknahme, und
 * derselbe Weg noch einmal für ein Beta-Konto.
 *
 * ── WARUM ER NEBEN `verify-brand-design.mjs` STEHT ───────────────────────
 * Jener prüft SCHICHT 2 als Produkt (sechs Kapitel, Preset, Board, Abbild).
 * Dieser prüft die SCHRANKE davor — und zwar die von Schicht 3, die anders
 * gebaut ist als die von Schicht 2: EIN Feld mit DREI Schreibern (Beta-Konto,
 * Betreiber, ab BS1 Z1 der Stripe-Webhook), und dieses eine Feld öffnet
 * zugleich den Marktvergleich. Beides zusammen ist genau das, was ein
 * Unit-Test nicht zeigen kann: dass Regel, Routen, Journey, Werkstatt und
 * Marktvergleich DIESELBE Antwort geben.
 *
 * ── DIE ACHT ZUSAGEN ─────────────────────────────────────────────────────
 *  1. OHNE FREISCHALTUNG IST SCHICHT 3 NICHT AUF DEM WEG: die drei Kapitel
 *     stehen in der Journey auf `skipped` mit Grund `derivation_locked`
 *     (NICHT `locked` — sonst zählten sie im Fortschritt mit, D0-Lehre), jede
 *     Kapitel-Route antwortet 403 mit genau diesem Grund, die Werkstatt zeigt
 *     den Sperrsatz „Teil der Ableitung" mit dem Erstgespräch-Knopf (KEIN
 *     Preis), und der Marktvergleich steht hinter derselben Schranke.
 *  2. FREISCHALTEN IST EINE BETREIBER-HANDLUNG: ohne Anmeldung 401, mit einem
 *     fremden Konto 403, für den EIGENTÜMER 403 — und OHNE fertige Foundation
 *     409 `foundation_incomplete`.
 *  3. SIE GREIFT: die drei Spalten stehen (Datum, `via: 'operator'`,
 *     Betreiber-Id), die drei `brand_steps`-Zeilen sind da, die Kapitel sind
 *     erreichbar, und die Handlung steht als Ereignis im Funnel.
 *  4. EIN ZWEITER KLICK ÄNDERT NICHTS: kein neues Datum, kein zweites Ereignis.
 *  5. DIE RÜCKNAHME LÖSCHT NICHTS: Spalten leer, Kapitel wieder zu, Zeilen und
 *     Slots liegen unverändert da, Ereignis `derivation.locked` geschrieben.
 *  6. EIN BETA-KONTO IST OHNE FELD FREI (BS1 §9 Entscheidung 6): dieselbe
 *     Marke, dieselben Routen — offen, und die Betreiber-Liste sagt „beta"
 *     ohne Datum.
 *  7. DIE BETREIBER-LISTE IST EINE BETREIBER-LISTE: ohne Anmeldung 401, fremd
 *     403, und sie trägt BEIDE Spalten je Marke.
 *  8. DER MARKTVERGLEICH LIEST DIESELBE REGEL: gesperrt ohne beides, offen mit
 *     Feld (`grant: 'derivation'`), offen mit Beta (`grant: 'beta'`).
 *
 * ── DIE GEGENPROBE IST EINGEBAUT ─────────────────────────────────────────
 * Jede „offen"-Zusage hat hier ihre „zu"-Hälfte an DERSELBEN Route, und beide
 * laufen im selben Durchgang. Der Grund steht in CLAUDE.md: eine Prüfung, die
 * nur den offenen Fall kennt, ist auch dann grün, wenn die Schranke gar nicht
 * existiert. Das TRÄGERKONTO der gesperrten Fälle hat deshalb bewusst KEINE
 * `brand_access`-Zeile — sonst wäre es ein Beta-Konto und alles offen.
 *
 * ── DER AUFNAHME-MODUS WIRD KURZ AUF 'open' GESTELLT ─────────────────────
 * Ein Konto ohne `brand_access`-Zeile kommt sonst gar nicht erst durch das
 * Zugangs-Gate (404, Datentür) — und genau so ein Konto braucht dieser Beweis
 * für die gesperrte Seite. `app_config.brandAdmissionMode` wird deshalb für
 * die Dauer des Laufs auf 'open' gesetzt und am Ende auf den Vorwert
 * zurückgestellt (dasselbe Muster wie `brandAiEnabled` in
 * `verify-brand-design.mjs`).
 *
 * ── VORBEDINGUNGEN ───────────────────────────────────────────────────────
 * Eine Appwrite-Instanz mit den `brand_*`-Tabellen BIS brand-025 (die drei
 * Ableitungs-Spalten!) und ein Dev-Server der branding-App AUS DEM WORKTREE
 * (CLAUDE.md „Tests"). Konten, Beta-Zugang und Marken legt das Skript selbst
 * an und räumt am Ende alles weg.
 *
 *   pnpm --filter branding exec nuxi dev --port 3016
 *   BRANDING_PORT=3016 pnpm --filter @pukalani/brand verify:kit
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
  console.error('✗ Env unvollständig — Aufruf über `pnpm --filter @pukalani/brand verify:kit`')
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const tablesDB = new TablesDB(client)
const users = new Users(client)

let pass = 0
let fail = 0
const cleanup = { users: [], profiles: [], access: [], admission: null }

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
        catch { /* HTML */ }
        resolve({ status: res.statusCode, headers: res.headers, json, text })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** Die drei Kapitel der Schicht 3, in ihrer Reihenfolge (Registry K0). */
const KIT_STEPS = ['nomenclature', 'aiguide', 'presskit']

const stamp = Date.now()

/**
 * EIN KONTO. `beta: true` legt die `brand_access`-Zeile an — DAS ist die
 * Beta-Zulassung, an der die dauerhafte Freistellung hängt (BS1 §9
 * Entscheidung 6). Ohne sie kommt das Konto nur durch, weil der Aufnahme-Modus
 * für diesen Lauf auf 'open' steht (s. Kopf) — und genau dieses Konto ist die
 * Gegenprobe.
 *
 * `labels: ['admin']` macht daraus einen BETREIBER (`users.manage` liegt im
 * Wildcard der admin-Rolle).
 */
async function makeAccount(tag, { labels, beta = false } = {}) {
  const user = await users.create({
    userId: ID.unique(),
    email: `k1-kit-${stamp}-${tag}@example.test`,
    password: `Pw-${ID.unique()}`,
    name: 'K1-Kit-Beweis',
  })
  cleanup.users.push(user.$id)
  await users.updateEmailVerification({ userId: user.$id, emailVerification: true })
  if (labels) await users.updateLabels({ userId: user.$id, labels })
  if (beta) {
    const access = await tablesDB.createRow({
      databaseId,
      tableId: 'brand_access',
      rowId: ID.unique(),
      data: { userId: user.$id, grantedVia: 'operator', inviteId: '', revokedAt: null },
    })
    cleanup.access.push(access.$id)
  }
  const session = await users.createSession({ userId: user.$id })
  return { id: user.$id, cookie: `a_session_${projectId}=${encodeURIComponent(session.secret)}` }
}

/** Der Aufnahme-Modus für die Dauer des Laufs (s. Kopf) — mit Rückstellung. */
async function openAdmission() {
  let row = null
  try {
    row = await tablesDB.getRow({ databaseId, tableId: 'app_config', rowId: 'global' })
  }
  catch { /* keine Zeile */ }
  cleanup.admission = row
    ? { existed: true, before: row.brandAdmissionMode ?? null }
    : { existed: false }
  if (row) {
    await tablesDB.updateRow({
      databaseId, tableId: 'app_config', rowId: 'global', data: { brandAdmissionMode: 'open' },
    })
  }
  else {
    await tablesDB.createRow({
      databaseId, tableId: 'app_config', rowId: 'global', data: { brandAdmissionMode: 'open' },
    })
  }
}

/** Eine Marke mit Konto anlegen. */
async function makeBrand(cookie, title) {
  const created = await call('/api/brand/profiles', {
    method: 'POST',
    cookie,
    body: {
      title,
      contentLocale: 'de',
      pathKind: 'new',
      hasName: true,
      team: 'solo',
      industry: 'Kaffeerösterei',
      about: 'Wir rösten Kaffee in kleinen Mengen.',
      audience: 'Cafés auf Maui.',
    },
  })
  const id = created.json?.profile?.id ?? created.json?.id
  if (!id) {
    console.error(`✗ Branding „${title}" konnte nicht angelegt werden (${created.status}): `
      + created.text.slice(0, 300))
    process.exit(1)
  }
  cleanup.profiles.push(id)
  return id
}

/** Slot-Werte einer Kapitel-Zeile BESTÄTIGEN — ohne Route, damit nichts verdeckt wird. */
async function seedConfirmed(profileId, stepKey, values) {
  const rowId = `${profileId}_${stepKey}`
  const row = await tablesDB.getRow({ databaseId, tableId: 'brand_steps', rowId })
  const slots = JSON.parse(row.slots || '{}')
  for (const [slotId, value] of Object.entries(values)) {
    slots[slotId] = { ...slots[slotId], latestDraft: value, confirmed: value }
  }
  await tablesDB.updateRow({
    databaseId, tableId: 'brand_steps', rowId,
    data: { slots: JSON.stringify(slots), revision: (row.revision ?? 0) + 1 },
  })
}

/**
 * DIE FOUNDATION AUF FERTIG — server-seitig, ohne die neun Kapitel zu spielen.
 * Der Weg dorthin ist der Gegenstand von `verify-brand-sessions.mjs`; hier ist
 * er die VORBEDINGUNG beider Schranken.
 */
async function completeFoundation(profileId) {
  await seedConfirmed(profileId, 'values', { 'c.final': '- Klartext\n- Handwerk\n- Nähe' })
  await seedConfirmed(profileId, 'archetype', {
    'd.primary': 'sage',
    'd.toneWords': '- ruhig\n- fundiert\n- warm',
  })
  await seedConfirmed(profileId, 'result', { 'result.direction': 'warm-editorial' })
  await tablesDB.updateRow({
    databaseId, tableId: 'brand_steps', rowId: `${profileId}_result`, data: { state: 'done' },
  })
}

/** Die Journey-Zeile eines Kapitels aus der Detail-Antwort. */
function journeyEntry(detail, stepKey) {
  return (detail.json?.journey ?? []).find(entry => entry.stepKey === stepKey) ?? null
}

async function eventTypes(profileId) {
  const res = await tablesDB.listRows({
    databaseId,
    tableId: 'brand_events',
    queries: [Query.equal('profileId', profileId), Query.limit(200)],
  }).catch(() => ({ rows: [] }))
  return res.rows
}

try {
  const health = await call('/api/health')
  if (health.status !== 200) {
    console.error(`✗ Kein Dev-Server auf Port ${PORT} (Health ${health.status}). `
      + 'Erst starten: pnpm --filter branding exec nuxi dev --port 3016')
    process.exit(1)
  }

  await openAdmission()

  // ══ 0 · AUFBAU ═════════════════════════════════════════════════════════
  console.log('\n0 · Konten und Marken')

  // OHNE `brand_access`: das ist die Gegenprobe-Seite des ganzen Beweises.
  const owner = await makeAccount('owner')
  const stranger = await makeAccount('stranger')
  const betaOwner = await makeAccount('beta', { beta: true })
  const operator = await makeAccount('operator', { labels: ['admin'] })

  const brandA = await makeBrand(owner.cookie, 'Kailua Coffee Co.')
  const brandB = await makeBrand(owner.cookie, 'Lani Studio')
  const brandBeta = await makeBrand(betaOwner.cookie, 'Hafenkontor')
  await completeFoundation(brandA)
  await completeFoundation(brandBeta)
  // brandB bleibt bewusst OHNE fertige Foundation — die 409-Gegenprobe.
  check('drei Marken angelegt, zwei mit fertiger Foundation',
    Boolean(brandA && brandB && brandBeta), `${brandA} · ${brandB} · ${brandBeta}`)

  const a = `/api/brand/profiles/${brandA}`

  // ══ 1 · OHNE FREISCHALTUNG IST SCHICHT 3 NICHT AUF DEM WEG ═════════════
  console.log('\n1 · Ohne Freischaltung: nicht auf dem Weg, nicht gesperrt')

  const lockedDetail = await call(a, { cookie: owner.cookie })
  check('die drei Kapitel stehen auf `skipped` mit Grund `derivation_locked`',
    KIT_STEPS.every((stepKey) => {
      const entry = journeyEntry(lockedDetail, stepKey)
      return entry?.state === 'skipped' && entry?.reason === 'derivation_locked'
    }),
    JSON.stringify(KIT_STEPS.map(stepKey => journeyEntry(lockedDetail, stepKey))))
  check('… und NICHT auf `locked` (sonst zählten sie im Fortschritt mit — D0-Lehre)',
    KIT_STEPS.every(stepKey => journeyEntry(lockedDetail, stepKey)?.state !== 'locked'))
  check('die Marke selbst sagt „Ableitung zu"',
    lockedDetail.json?.profile?.derivationUnlocked === false,
    JSON.stringify(lockedDetail.json?.profile?.derivationUnlocked))

  for (const stepKey of KIT_STEPS) {
    const res = await call(`${a}/steps/${stepKey}`, { cookie: owner.cookie })
    check(`Kapitel-Route ${stepKey} ⇒ 403 \`derivation_locked\``,
      res.status === 403 && res.json?.reason === 'derivation_locked',
      `${res.status} ${JSON.stringify(res.json?.reason ?? null)}`)
  }

  const lockedPage = await call(`/de/brand/${brandA}/aiguide`, { cookie: owner.cookie })
  check('die Werkstatt zeigt den Sperrsatz „Teil der Ableitung" mit dem Erstgespräch-Knopf',
    lockedPage.status === 200
    && lockedPage.text.includes('Teil der Ableitung')
    && lockedPage.text.includes('data-derivation-cta'),
    `${lockedPage.status} ${lockedPage.text.length} Zeichen`)
  check('… und KEINEN Preis (§2.7: CTA, kein Preis)',
    !/\d\s?(?:€|EUR)/.test(lockedPage.text))

  const lockedMarket = await call(`/api/market/profiles/${brandA}`, { cookie: owner.cookie })
  check('GEGENPROBE Marktvergleich: dieselbe Schranke, ohne Beta und ohne Feld',
    lockedMarket.status === 200
    && lockedMarket.json?.paywall?.unlocked === false
    && lockedMarket.json?.paywall?.grant === 'none',
    `${lockedMarket.status} ${JSON.stringify(lockedMarket.json?.paywall ?? null)}`)

  // ══ 2 · DIE FREISCHALTUNG IST EINE BETREIBER-HANDLUNG ══════════════════
  console.log('\n2 · Wer sie darf, und was sie voraussetzt')

  const unlockA = `/api/brand/admin/profiles/${brandA}/derivation-unlock`

  const guest = await call(unlockA, { method: 'POST' })
  check('ohne Anmeldung: 401', guest.status === 401, String(guest.status))
  const byStranger = await call(unlockA, { method: 'POST', cookie: stranger.cookie })
  check('ein fremdes Konto: 403 (kein `users.manage`)', byStranger.status === 403,
    String(byStranger.status))
  const byOwner = await call(unlockA, { method: 'POST', cookie: owner.cookie })
  check('auch der EIGENTÜMER kann sich die Ableitung nicht selbst freischalten: 403',
    byOwner.status === 403, String(byOwner.status))

  const tooEarly = await call(`/api/brand/admin/profiles/${brandB}/derivation-unlock`, {
    method: 'POST', cookie: operator.cookie,
  })
  check('GEGENPROBE: ohne fertige Foundation ⇒ 409 `foundation_incomplete`',
    tooEarly.status === 409 && tooEarly.json?.reason === 'foundation_incomplete',
    `${tooEarly.status} ${JSON.stringify(tooEarly.json?.reason ?? null)}`)

  // ══ 3 · SIE GREIFT ═════════════════════════════════════════════════════
  console.log('\n3 · Die Freischaltung greift')

  const unlocked = await call(unlockA, { method: 'POST', cookie: operator.cookie })
  check('mit fertiger Foundation: Datum, Herkunft und Betreiber stehen',
    unlocked.status === 200
    && typeof unlocked.json?.item?.derivationUnlockedAt === 'string'
    && unlocked.json.item.derivationUnlockedAt.length > 0
    && unlocked.json?.item?.derivationUnlockedBy === operator.id
    && unlocked.json?.item?.derivationGrant === 'operator',
    `${unlocked.status} ${JSON.stringify(unlocked.json?.item ?? null)}`)

  const openDetail = await call(a, { cookie: owner.cookie })
  check('die drei Kapitel liegen jetzt auf dem Weg — das erste offen, die anderen warten',
    journeyEntry(openDetail, 'aiguide')?.state === 'open'
    && journeyEntry(openDetail, 'presskit')?.state === 'locked'
    && journeyEntry(openDetail, 'presskit')?.reason === 'awaiting_previous',
    JSON.stringify(KIT_STEPS.map(stepKey => journeyEntry(openDetail, stepKey))))
  check('… und `nomenclature` bleibt die Weiche der Markenarchitektur (§2.20 Nr. 4)',
    journeyEntry(openDetail, 'nomenclature')?.state === 'skipped'
    && journeyEntry(openDetail, 'nomenclature')?.reason === 'junction_off',
    JSON.stringify(journeyEntry(openDetail, 'nomenclature')))
  check('die Marke sagt „Ableitung offen"',
    openDetail.json?.profile?.derivationUnlocked === true)

  const chapter = await call(`${a}/steps/aiguide`, { cookie: owner.cookie })
  check('das Kapitel `aiguide` ist erreichbar', chapter.status === 200,
    `${chapter.status} ${chapter.text.slice(0, 120)}`)

  const kitRows = await tablesDB.listRows({
    databaseId,
    tableId: 'brand_steps',
    queries: [Query.equal('profileId', brandA), Query.equal('stepKey', KIT_STEPS), Query.limit(10)],
  }).catch(() => ({ rows: [] }))
  check('alle drei `brand_steps`-Zeilen sind da — auch die des optionalen Kapitels',
    kitRows.rows.length === 3, String(kitRows.rows.length))

  const afterUnlockEvents = await eventTypes(brandA)
  const unlockedEvents = afterUnlockEvents.filter(row => row.type === 'derivation.unlocked')
  check('die Handlung steht im Funnel — genau einmal, mit dem Betreiber und ohne Inhalt',
    unlockedEvents.length === 1
    && unlockedEvents[0]?.userId === operator.id
    && !String(unlockedEvents[0]?.payload ?? '').includes('Kailua'),
    JSON.stringify(unlockedEvents.map(row => row.userId)))
  check('… und ihr Rumpf nennt die Herkunft',
    String(unlockedEvents[0]?.payload ?? '').includes('operator'),
    String(unlockedEvents[0]?.payload ?? '').slice(0, 160))

  const openMarket = await call(`/api/market/profiles/${brandA}`, { cookie: owner.cookie })
  check('der Marktvergleich folgt derselben Regel — jetzt offen, Herkunft `derivation`',
    openMarket.json?.paywall?.unlocked === true
    && openMarket.json?.paywall?.grant === 'derivation',
    JSON.stringify(openMarket.json?.paywall ?? null))

  // ══ 4 · ZWEITER KLICK ══════════════════════════════════════════════════
  console.log('\n4 · Der zweite Klick ändert nichts')

  const again = await call(unlockA, { method: 'POST', cookie: operator.cookie })
  check('dasselbe Datum, kein zweites Ereignis',
    again.status === 200
    && again.json?.item?.derivationUnlockedAt === unlocked.json?.item?.derivationUnlockedAt
    && (await eventTypes(brandA)).filter(row => row.type === 'derivation.unlocked').length === 1,
    `${again.status} ${again.json?.item?.derivationUnlockedAt}`)

  // ══ 5 · DIE RÜCKNAHME LÖSCHT NICHTS ════════════════════════════════════
  console.log('\n5 · Die Rücknahme')

  const locked = await call(`/api/brand/admin/profiles/${brandA}/derivation-lock`, {
    method: 'POST', cookie: operator.cookie,
  })
  check('die drei Spalten sind leer, die Herkunft ist `none`',
    locked.status === 200
    && locked.json?.item?.derivationUnlockedAt === null
    && locked.json?.item?.derivationUnlockedBy === ''
    && locked.json?.item?.derivationGrant === 'none',
    `${locked.status} ${JSON.stringify(locked.json?.item ?? null)}`)

  const relocked = await call(`${a}/steps/aiguide`, { cookie: owner.cookie })
  check('das Kapitel ist wieder zu — mit demselben Grund wie vorher',
    relocked.status === 403 && relocked.json?.reason === 'derivation_locked',
    `${relocked.status} ${JSON.stringify(relocked.json?.reason ?? null)}`)

  const rowsAfterLock = await tablesDB.listRows({
    databaseId,
    tableId: 'brand_steps',
    queries: [Query.equal('profileId', brandA), Query.equal('stepKey', KIT_STEPS), Query.limit(10)],
  }).catch(() => ({ rows: [] }))
  check('… und die drei Zeilen liegen unangetastet da (§3e: inaktiv, nie gelöscht)',
    rowsAfterLock.rows.length === 3, String(rowsAfterLock.rows.length))

  const lockEvents = (await eventTypes(brandA)).filter(row => row.type === 'derivation.locked')
  check('die Rücknahme steht im Funnel — genau einmal',
    lockEvents.length === 1 && lockEvents[0]?.userId === operator.id,
    JSON.stringify(lockEvents.map(row => row.type)))

  const lockedMarketAgain = await call(`/api/market/profiles/${brandA}`, { cookie: owner.cookie })
  check('GEGENPROBE: der Marktvergleich steht sofort wieder hinter der Schranke',
    lockedMarketAgain.json?.paywall?.unlocked === false,
    JSON.stringify(lockedMarketAgain.json?.paywall ?? null))

  // ══ 6 · DAS BETA-KONTO ═════════════════════════════════════════════════
  console.log('\n6 · Ein Beta-Konto ist ohne Feld frei (BS1 §9 Entscheidung 6)')

  const betaDetail = await call(`/api/brand/profiles/${brandBeta}`, { cookie: betaOwner.cookie })
  check('dieselbe Lage, anderes Konto: die Ableitung ist offen — ohne ein einziges Feld',
    betaDetail.json?.profile?.derivationUnlocked === true
    && journeyEntry(betaDetail, 'aiguide')?.state === 'open',
    JSON.stringify(journeyEntry(betaDetail, 'aiguide')))

  const betaChapter = await call(`/api/brand/profiles/${brandBeta}/steps/aiguide`, {
    cookie: betaOwner.cookie,
  })
  check('… und das Kapitel ist erreichbar', betaChapter.status === 200, String(betaChapter.status))

  const betaMarket = await call(`/api/market/profiles/${brandBeta}`, { cookie: betaOwner.cookie })
  check('… der Marktvergleich ebenso, mit Herkunft `beta`',
    betaMarket.json?.paywall?.unlocked === true && betaMarket.json?.paywall?.grant === 'beta',
    JSON.stringify(betaMarket.json?.paywall ?? null))

  const betaRow = await tablesDB.getRow({
    databaseId, tableId: 'brand_profiles', rowId: brandBeta,
  })
  check('BEWEIS, dass es wirklich am KONTO hängt: die Spalte ist leer',
    !betaRow.derivationUnlockedAt, JSON.stringify(betaRow.derivationUnlockedAt ?? null))

  // ══ 7 · DIE BETREIBER-LISTE ════════════════════════════════════════════
  console.log('\n7 · Die Betreiber-Liste')

  const listPath = '/api/brand/admin/derivation-unlocks'
  const listGuest = await call(listPath)
  check('ohne Anmeldung: 401', listGuest.status === 401, String(listGuest.status))
  const listStranger = await call(listPath, { cookie: stranger.cookie })
  check('ein fremdes Konto: 403', listStranger.status === 403, String(listStranger.status))

  const list = await call(listPath, { cookie: operator.cookie })
  const rowOf = id => (list.json?.items ?? []).find(item => item.id === id) ?? null
  check('der Betreiber sieht beide Spalten je Marke',
    list.status === 200
    && rowOf(brandA)?.derivationGrant === 'none'
    && rowOf(brandA)?.designUnlockedAt === null,
    `${list.status} ${JSON.stringify(rowOf(brandA))}`)
  check('… und beim Beta-Konto steht „beta" OHNE Datum',
    rowOf(brandBeta)?.derivationGrant === 'beta'
    && rowOf(brandBeta)?.derivationUnlockedAt === null,
    JSON.stringify(rowOf(brandBeta)))
  check('… die Marke ohne fertige Foundation ist als solche erkennbar (der Knopf bleibt aus)',
    rowOf(brandB)?.foundationDone === false && rowOf(brandA)?.foundationDone === true,
    JSON.stringify([rowOf(brandB)?.foundationDone, rowOf(brandA)?.foundationDone]))

  // ══ 8 · DIE ALTE ADRESSE ═══════════════════════════════════════════════
  console.log('\n8 · Die alte Betreiber-Seite leitet weiter (§2.20 Nr. 5)')

  const oldPage = await call('/de/dashboard/brand-design')
  check('`/de/dashboard/brand-design` ⇒ 301 auf `/de/dashboard/brand-unlocks`',
    oldPage.status === 301 && oldPage.headers.location === '/de/dashboard/brand-unlocks',
    `${oldPage.status} ${oldPage.headers.location}`)
  const oldPageEn = await call('/dashboard/brand-design')
  check('… und dasselbe ohne Sprach-Präfix',
    oldPageEn.status === 301 && oldPageEn.headers.location === '/dashboard/brand-unlocks',
    `${oldPageEn.status} ${oldPageEn.headers.location}`)
}
catch (error) {
  fail++
  console.error('\n✗ Abbruch:', error instanceof Error ? error.message : error)
}
finally {
  for (const id of cleanup.profiles) {
    for (const table of ['brand_messages', 'brand_findings', 'brand_events', 'brand_shares']) {
      const rows = await tablesDB.listRows({
        databaseId, tableId: table, queries: [Query.equal('profileId', id), Query.limit(200)],
      }).catch(() => ({ rows: [] }))
      for (const row of rows.rows) {
        await tablesDB.deleteRow({ databaseId, tableId: table, rowId: row.$id }).catch(() => {})
      }
    }
    // Alle Kapitel-Zeilen aller drei Schichten — der Beweis legt die dritte an.
    const stepRows = await tablesDB.listRows({
      databaseId, tableId: 'brand_steps', queries: [Query.equal('profileId', id), Query.limit(100)],
    }).catch(() => ({ rows: [] }))
    for (const row of stepRows.rows) {
      await tablesDB.deleteRow({ databaseId, tableId: 'brand_steps', rowId: row.$id }).catch(() => {})
    }
    await tablesDB.deleteRow({ databaseId, tableId: 'brand_profiles', rowId: id }).catch(() => {})
  }
  for (const id of cleanup.access) {
    await tablesDB.deleteRow({ databaseId, tableId: 'brand_access', rowId: id }).catch(() => {})
  }
  for (const id of cleanup.users) {
    await users.delete({ userId: id }).catch(() => {})
  }
  if (cleanup.admission) {
    if (cleanup.admission.existed) {
      await tablesDB.updateRow({
        databaseId, tableId: 'app_config', rowId: 'global',
        data: { brandAdmissionMode: cleanup.admission.before },
      }).catch(() => {})
    }
    else {
      await tablesDB.deleteRow({ databaseId, tableId: 'app_config', rowId: 'global' }).catch(() => {})
    }
  }

  console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass}/${pass + fail} Prüfungen bestanden`)
  process.exit(fail === 0 ? 0 : 1)
}
