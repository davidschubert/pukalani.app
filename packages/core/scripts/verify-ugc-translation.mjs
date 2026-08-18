#!/usr/bin/env node
/**
 * Beweis: KI-Übersetzung für User-Content (Davids Entscheidungen 2026-08-17 —
 * Beiträge + Kommentare · Knopf statt Automatik · Inhalts-Produkt als Gate ·
 * nur Eingeloggte, gedrosselt · EIN Übersetzungs-Cache je Zeile, posts-023 /
 * comments-020).
 *
 * DIE FRAGE, DIE DIESER BEWEIS BEANTWORTET: übersetzt EINER für ALLE — und
 * bleibt der Cache ehrlich? Konkret, über die ECHTEN Routen (Datentür, Gates,
 * Drossel, KI-Anbieter — nichts nachgebaut):
 *   1. Ein eingeloggter Nutzer übersetzt einen englischen Beitrag nach Deutsch
 *      → 200, `cached: false`, Text vorhanden und vom Original verschieden.
 *   2. Der ZWEITE Abruf derselben Sprache kommt aus der SPALTE → `cached: true`
 *      und ZEICHENGLEICH zum ersten — kein zweiter KI-Aufruf (der Beweis liest
 *      die Zeile zusätzlich direkt und sieht die Fassung dort liegen).
 *   3. Dasselbe für einen Kommentar (`content`, ohne Titel).
 *   4. BEARBEITEN LEERT DEN CACHE: nach `PATCH` mit neuem Text steht die
 *      `translations`-Spalte der Zeile auf '' — die alte Fassung wäre eine
 *      stille Lüge gewesen.
 *   5. GEGENPROBEN: ohne Session 401 (Gäste kosten kein Geld) · unbrauchbare
 *      Sprachcodes 400 · `PATCH` OHNE Textänderung lässt den Cache stehen
 *      (zweimal „Speichern" wirft keine bezahlte Übersetzung weg).
 *
 * VORAUSSETZUNGEN (alle lokal, nichts zeigt auf Produktion):
 *   - Appwrite lokal, Migrationen gelaufen (`pnpm migrate --app comments`).
 *   - comments-Dev-Server aus DIESEM Arbeitsstand, z. B.
 *       pnpm --filter comments exec nuxi dev --port 3021
 *   - `NUXT_AI_KEY` gesetzt (der Beweis bezahlt zwei kleine, echte
 *     KI-Aufrufe — genau das ist der Punkt).
 *
 * Aufruf aus dem Repo-Wurzelverzeichnis:
 *   COMMENTS_PORT=3021 node --env-file=apps/comments/.env \
 *     packages/core/scripts/verify-ugc-translation.mjs
 *
 * Selbst-aufräumend: Nutzer, Beitrag und Kommentar werden am Ende gelöscht
 * (auch im Fehlerfall).
 */
import { request as httpRequest } from 'node:http'
import { Client, TablesDB, Users } from 'node-appwrite'

const PORT = Number(process.env.COMMENTS_PORT || 3021)
const ORIGIN = `http://localhost:${PORT}`

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID
const apiKey = process.env.NUXT_APPWRITE_KEY
if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('Fehlende Appwrite-Env — mit --env-file=apps/comments/.env aufrufen.')
  process.exit(1)
}
if (!process.env.NUXT_AI_KEY) {
  console.error('NUXT_AI_KEY fehlt — ohne Schlüssel antwortet die Route 503 und der Beweis misst nichts.')
  process.exit(1)
}

const admin = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const tablesDB = new TablesDB(admin)
const users = new Users(admin)

/** node:http über ::1 — Nitro hört dort, und fetch verwürfe den Host-Header. */
function call(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = httpRequest({
      host: '::1', port: PORT, method, path,
      headers: {
        'Origin': ORIGIN,
        'Host': `localhost:${PORT}`,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(data) } catch { /* Text bleibt Text */ }
        resolve({ status: res.statusCode, json, text: data, headers: res.headers })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

let passed = 0
let failed = 0
function check(label, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✔ ${label}`) }
  else { failed++; console.error(`  ✘ ${label}${detail ? ` — ${detail}` : ''}`) }
}

const stamp = Date.now().toString(36)
const email = `verify-ugc-${stamp}@pukalani.test`
let userId = null
let postId = null
let commentId = null

const POST_TITLE = 'A quiet morning on the mountain'
const POST_BODY = 'We watched the **sunrise** from the summit. Bring warm clothes — the wind up there is `cold` and relentless.'
const COMMENT_BODY = 'Thanks for sharing this! I visited last year and the trail was much harder than expected.'

try {
  console.log(`\nBeweis UGC-Übersetzung gegen ${ORIGIN} (Projekt ${projectId})\n`)

  // ── Konto + Session (echter Signup-Weg) ──────────────────────────────────
  const signup = await call('POST', '/api/auth/signup', {
    body: { email, password: `Vv-${stamp}-2026!x`, name: 'Verify UGC' },
  })
  const setCookies = signup.headers['set-cookie'] ?? []
  const cookie = setCookies.map(c => c.split(';')[0]).join('; ')
  check('Signup liefert Session', signup.status === 200 && cookie.includes('a_session'), `Status ${signup.status}`)
  const me = await call('GET', '/api/auth/me', { cookie })
  userId = me.json?.$id ?? me.json?.user?.$id ?? null
  check('Session trägt (GET /api/auth/me)', Boolean(userId), JSON.stringify(me.json)?.slice(0, 120))

  // ── Beitrag: übersetzen · Cache · Zeile ──────────────────────────────────
  const created = await call('POST', '/api/posts', {
    cookie, body: { type: 'post', title: POST_TITLE, body: POST_BODY },
  })
  postId = created.json?.post?.$id ?? created.json?.$id ?? null
  check('Beitrag angelegt', created.status === 201 && Boolean(postId), `Status ${created.status}: ${created.text?.slice(0, 160)}`)

  const t1 = await call('POST', `/api/posts/${postId}/translate`, { cookie, body: { locale: 'de' } })
  check('1. Übersetzung: 200 + cached:false', t1.status === 200 && t1.json?.cached === false, `Status ${t1.status}: ${t1.text?.slice(0, 200)}`)
  check('1. Übersetzung: Text vorhanden und ≠ Original', Boolean(t1.json?.body) && t1.json.body !== POST_BODY)
  check('1. Übersetzung: Titel übersetzt', Boolean(t1.json?.title) && t1.json.title !== POST_TITLE)

  const t2 = await call('POST', `/api/posts/${postId}/translate`, { cookie, body: { locale: 'de' } })
  check('2. Abruf: cached:true', t2.status === 200 && t2.json?.cached === true, `Status ${t2.status}`)
  check('2. Abruf: zeichengleich (EINER übersetzt für ALLE)', t2.json?.body === t1.json?.body && t2.json?.title === t1.json?.title)

  const rowAfter = await tablesDB.getRow({ databaseId, tableId: 'community_posts', rowId: postId })
  const stored = JSON.parse(rowAfter.translations || '{}')
  check('Fassung liegt in der Zeile (translations.de)', stored?.de?.body === t1.json?.body)

  // ── Bearbeiten: echter Edit leert, No-op-Edit lässt stehen ───────────────
  const noop = await call('PATCH', `/api/posts/${postId}`, { cookie, body: { title: POST_TITLE, body: POST_BODY } })
  const rowNoop = await tablesDB.getRow({ databaseId, tableId: 'community_posts', rowId: postId })
  check('PATCH ohne Textänderung lässt den Cache stehen', noop.status === 200 && Boolean(rowNoop.translations), `Status ${noop.status}`)

  const edit = await call('PATCH', `/api/posts/${postId}`, { cookie, body: { title: POST_TITLE, body: `${POST_BODY} Edited.` } })
  const rowEdited = await tablesDB.getRow({ databaseId, tableId: 'community_posts', rowId: postId })
  check('PATCH mit Textänderung LEERT den Cache', edit.status === 200 && !rowEdited.translations, `Status ${edit.status}, translations=${JSON.stringify(rowEdited.translations)?.slice(0, 80)}`)

  // ── Kommentar: derselbe Mechanismus ohne Titel ───────────────────────────
  const commented = await call('POST', '/api/comments', {
    cookie, body: { targetId: `verify-ugc-${stamp}`, targetType: 'blog', content: COMMENT_BODY },
  })
  commentId = commented.json?.comment?.$id ?? commented.json?.$id ?? null
  check('Kommentar angelegt', commented.status === 201 && Boolean(commentId), `Status ${commented.status}: ${commented.text?.slice(0, 160)}`)

  const c1 = await call('POST', `/api/comments/${commentId}/translate`, { cookie, body: { locale: 'de' } })
  check('Kommentar 1. Übersetzung: 200 + cached:false + Text ≠ Original', c1.status === 200 && c1.json?.cached === false && Boolean(c1.json?.body) && c1.json.body !== COMMENT_BODY, `Status ${c1.status}: ${c1.text?.slice(0, 200)}`)
  const c2 = await call('POST', `/api/comments/${commentId}/translate`, { cookie, body: { locale: 'de' } })
  check('Kommentar 2. Abruf: cached:true + zeichengleich', c2.status === 200 && c2.json?.cached === true && c2.json?.body === c1.json?.body)

  // ── Gegenproben ──────────────────────────────────────────────────────────
  const guest = await call('POST', `/api/posts/${postId}/translate`, { body: { locale: 'de' } })
  check('Ohne Session: 401 (kein Gast kostet Geld)', guest.status === 401, `Status ${guest.status}`)
  const badLocale = await call('POST', `/api/posts/${postId}/translate`, { cookie, body: { locale: 'not a locale!' } })
  check('Unbrauchbarer Sprachcode: 400', badLocale.status === 400, `Status ${badLocale.status}`)
}
catch (error) {
  failed++
  console.error('\nAbbruch:', error)
}
finally {
  // Aufräumen — auch im Fehlerfall; ein halber Beweis darf keine Reste lassen.
  if (postId) await tablesDB.deleteRow({ databaseId, tableId: 'community_posts', rowId: postId }).catch(() => {})
  if (commentId) await tablesDB.deleteRow({ databaseId, tableId: 'comments', rowId: commentId }).catch(() => {})
  if (userId) await users.delete({ userId }).catch(() => {})
}

console.log(`\n${passed} grün · ${failed} rot`)
process.exit(failed === 0 ? 0 : 1)
