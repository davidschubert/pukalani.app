/**
 * Beweis: der Orts-Picker im Profil — Suche, Länder-Filter und der Standort
 * am KONTO (Mitglieder-Karte, Etappe 1).
 *
 * 1. Suche liefert Pukalani mit Label, Flaggen-Code und Koordinaten
 * 2. Einwohner-Ranking: „berl" ⇒ Berlin/DE, nicht Berlin/Wisconsin
 * 3. Diakritika: „zurich" findet Zürich
 * 4. Länder-Filter: „berlin" + country=us ⇒ Berlin in den USA
 * 5. Länderliste enthält 'us' und 'de'
 * 6. Ohne Sitzung: 401 (kein anonymer Suchindex)
 * 7. PUT /api/auth/profile mit location ⇒ die drei prefs stehen in /me
 * 8. location: null ⇒ die drei Schlüssel sind WEG (nicht '')
 *
 * ── WOHER DIE ERWARTUNGSWERTE KOMMEN ──────────────────────────────────────
 * Aus einem ZWEITEN, unabhängigen Zugriff auf dieselbe TSV (direkter Read hier
 * im Skript) — NIE aus der Antwort, die geprüft wird: eine Prüfung, die ihren
 * Maßstab aus dem Prüfling zieht, ist eine Tautologie und immer grün. Geprüft
 * wird UNSERE KETTE (Route, Ranking, prefs), nicht die Qualität der
 * GeoNames-Daten.
 *
 * VORAUSSETZUNGEN:
 *  - lokale Appwrite (Signup muss durchgehen)
 *  - Dev-Server der platform-App, MIT gesetztem Pfad:
 *      pnpm --filter platform exec nuxi dev --port 3036
 *    (`NUXT_GEO_CITIES_PATH` steht in apps/platform/.env; ohne den Pfad
 *    antwortet die Route mit leerer Liste und die Prüfungen 1–5 fallen —
 *    das ist dann die Testumgebung, nicht der Code.)
 *  - GEO_CITIES (Pfad zur TSV) für den unabhängigen Direkt-Read; ohne ihn
 *    werden 1–5 übersprungen, 6–8 laufen weiter.
 *
 *   PLATFORM_PORT=3036 GEO_CITIES=~/Developer/geodb/geonames-cities.tsv \
 *     node packages/core/scripts/verify-geo-cities.mjs
 *
 * node:http über ::1 (Nitro hört auf [::1], Vite-HMR auf 0.0.0.0 — 127.0.0.1
 * liefert 426), Host-Header app.localhost (Kontroll-Host der Dev-Config; dort
 * MUSS die Route erreichbar sein, sie steht dafür in controlApiPrefixes).
 */
import { request } from 'node:http'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const PORT = Number(process.env.PLATFORM_PORT || 3036)
const HOST = 'app.localhost'
let pass = 0
let fail = 0

function check(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✔ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`) }
}

function call(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const req = request({
      host: '::1', port: PORT, path, method,
      headers: {
        host: HOST,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
        ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { cookie } : {}),
      },
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function json(res) {
  try { return JSON.parse(res.body) }
  catch { return null }
}

function sessionCookie(res) {
  const raw = res.headers['set-cookie'] || []
  const hit = raw.find(c => c.startsWith('a_session_'))
  return hit ? hit.split(';')[0] : null
}

const email = `geo-cities-${Date.now()}@example.com`
const password = 'Beweis-Passwort-1234!'

console.log(`\nOrts-Picker-Beweis gegen ::1:${PORT} (Host ${HOST})\n`)

console.log('0. Wegwerf-Konto anlegen')
const signup = await call('POST', '/api/auth/signup', { body: { name: 'Geo Beweis', email, password } })
check('Signup → 2xx', signup.status >= 200 && signup.status < 300, `Status ${signup.status}: ${signup.body.slice(0, 200)}`)
const cookie = sessionCookie(signup)
check('Session-Cookie gesetzt', Boolean(cookie))

console.log('\n1.–5. Suche, Ranking, Diakritika, Länder-Filter, Länderliste')
const tsvPath = (process.env.GEO_CITIES || '').replace(/^~(?=\/)/, homedir())
if (!tsvPath) {
  console.log('  — übersprungen: GEO_CITIES nicht gesetzt (Pfad zur geonames-cities.tsv).')
  console.log('    Der Dev-Server braucht denselben Pfad in NUXT_GEO_CITIES_PATH.')
}
else {
  /**
   * UNABHÄNGIGER Pfad: eigener Read, eigenes Parsen — bewusst NICHT über
   * shared/geoCities.ts. Ein Beweis, der die Funktion benutzt, die er prüft,
   * bestätigt nur sich selbst.
   */
  const rows = readFileSync(tsvPath, 'utf8').split('\n').filter(Boolean).map((line) => {
    const [name, ascii, region, cc, lat, lon] = line.split('\t')
    return { name, ascii, region, cc: (cc || '').toLowerCase(), lat: Number(lat), lon: Number(lon) }
  })
  const strip = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  /** Erster Datei-Treffer (= einwohnerstärkster), der mit dem Begriff beginnt. */
  const firstPrefix = (needle, cc = '') => rows.find(r =>
    (!cc || r.cc === cc) && (strip(r.name).startsWith(needle) || strip(r.ascii).startsWith(needle)))
  const label = r => (r.region ? `${r.name}, ${r.region}` : r.name)

  const search = async (q, country) => {
    const query = `q=${encodeURIComponent(q)}${country ? `&country=${country}` : ''}`
    const res = await call('GET', `/api/geo/cities?${query}`, { cookie })
    return { status: res.status, cities: json(res)?.cities ?? [] }
  }

  // 1. Pukalani — Label, Ländercode, Koordinaten, alles gegen den Direkt-Read.
  const wantPukalani = firstPrefix('puka')
  check('Direkt-Read: „puka" findet in der Datei überhaupt einen Ort', Boolean(wantPukalani), `${wantPukalani?.name}`)
  check('Direkt-Read: es ist Pukalani, Hawaii', wantPukalani && label(wantPukalani) === 'Pukalani, Hawaii', `datei=${wantPukalani && label(wantPukalani)}`)
  const puka = await search('puka')
  check('Route → 200', puka.status === 200, `Status ${puka.status}`)
  check('Route: erster Treffer = Direkt-Read (Label)', puka.cities[0]?.label === (wantPukalani && label(wantPukalani)),
    `route=${puka.cities[0]?.label}, datei=${wantPukalani && label(wantPukalani)}`)
  check('Route: countryCode klein („us", für das Flaggen-Symbol)', puka.cities[0]?.countryCode === wantPukalani?.cc,
    `route=${puka.cities[0]?.countryCode}, datei=${wantPukalani?.cc}`)
  check('Route: lat/lon sind ZAHLEN', typeof puka.cities[0]?.lat === 'number' && typeof puka.cities[0]?.lon === 'number',
    `lat=${puka.cities[0]?.lat} (${typeof puka.cities[0]?.lat})`)
  check('Route: lat = Direkt-Read', puka.cities[0]?.lat === wantPukalani?.lat, `route=${puka.cities[0]?.lat}, datei=${wantPukalani?.lat}`)
  check('Route: lon = Direkt-Read', puka.cities[0]?.lon === wantPukalani?.lon, `route=${puka.cities[0]?.lon}, datei=${wantPukalani?.lon}`)
  check('Route: höchstens acht Vorschläge', puka.cities.length > 0 && puka.cities.length <= 8, `${puka.cities.length}`)

  // 2. Einwohner-Ranking.
  const wantBerlin = firstPrefix('berl')
  check('Direkt-Read: „berl" führt auf Berlin/DE (Datei ist nach Einwohnern sortiert)',
    wantBerlin?.cc === 'de', `datei=${wantBerlin && label(wantBerlin)} (${wantBerlin?.cc})`)
  const berl = await search('berl')
  check('Route: erster Treffer = Direkt-Read', berl.cities[0]?.label === (wantBerlin && label(wantBerlin)),
    `route=${berl.cities[0]?.label}, datei=${wantBerlin && label(wantBerlin)}`)
  check('Route: das ist Berlin in DE', berl.cities[0]?.countryCode === 'de', `cc=${berl.cities[0]?.countryCode}`)

  // 3. Diakritika — „zurich" muss „Zürich" finden.
  const wantZurich = firstPrefix('zurich')
  check('Direkt-Read: „zurich" findet einen Ort mit Umlaut', wantZurich?.name?.includes('ü') === true, `datei=${wantZurich?.name}`)
  const zurich = await search('zurich')
  check('Route: erster Treffer = Direkt-Read (Zürich)', zurich.cities[0]?.label === (wantZurich && label(wantZurich)),
    `route=${zurich.cities[0]?.label}, datei=${wantZurich && label(wantZurich)}`)

  // 4. Länder-Filter — dieselbe Eingabe, anderes Land.
  const wantBerlinUs = firstPrefix('berlin', 'us')
  check('Direkt-Read: es gibt ein Berlin in den USA', Boolean(wantBerlinUs), `datei=${wantBerlinUs && label(wantBerlinUs)}`)
  const berlinUs = await search('berlin', 'us')
  check('Route mit country=us: erster Treffer = Direkt-Read', berlinUs.cities[0]?.label === (wantBerlinUs && label(wantBerlinUs)),
    `route=${berlinUs.cities[0]?.label}, datei=${wantBerlinUs && label(wantBerlinUs)}`)
  check('Route mit country=us: JEDER Treffer liegt in den USA',
    berlinUs.cities.length > 0 && berlinUs.cities.every(c => c.countryCode === 'us'),
    `codes=${berlinUs.cities.map(c => c.countryCode).join(',')}`)
  check('Gegenprobe: der Filter ändert wirklich etwas (nicht dasselbe wie ohne)',
    berlinUs.cities[0]?.label !== (await search('berlin')).cities[0]?.label,
    `mit=${berlinUs.cities[0]?.label}`)

  // 5. Länderliste.
  const countriesRes = await call('GET', '/api/geo/countries', { cookie })
  const countries = json(countriesRes)?.countries ?? []
  check('Länderliste → 200', countriesRes.status === 200, `Status ${countriesRes.status}`)
  check('Länderliste enthält „us" und „de"', countries.includes('us') && countries.includes('de'), `${countries.length} Codes`)
  check('Länderliste ist klein geschrieben und alphabetisch',
    countries.every(c => c === c.toLowerCase()) && [...countries].sort().join() === countries.join())
}

console.log('\n6. Gegenprobe: ohne Sitzung')
const anonymous = await call('GET', '/api/geo/cities?q=puka')
check('Suche ohne Cookie → 401', anonymous.status === 401, `Status ${anonymous.status}`)
const anonymousCountries = await call('GET', '/api/geo/countries')
check('Länderliste ohne Cookie → 401', anonymousCountries.status === 401, `Status ${anonymousCountries.status}`)

console.log('\n7. Standort speichern')
const saved = await call('PUT', '/api/auth/profile', {
  cookie,
  body: {
    name: 'Geo Beweis',
    location: { label: 'Pukalani, Hawaii', lat: 20.83667, lon: -156.33667 },
  },
})
check('PUT /api/auth/profile → 2xx', saved.status >= 200 && saved.status < 300, `Status ${saved.status}: ${saved.body.slice(0, 200)}`)
const afterSave = json(await call('GET', '/api/auth/me', { cookie }))
// `/api/auth/me` liefert den User-Datensatz SELBST, nicht `{ user }`.
const prefsAfterSave = afterSave?.prefs ?? {}
check('prefs.locationLabel steht in /me', prefsAfterSave.locationLabel === 'Pukalani, Hawaii', `${prefsAfterSave.locationLabel}`)
check('prefs.locationLat ist eine Zahl', prefsAfterSave.locationLat === 20.83667, `${prefsAfterSave.locationLat} (${typeof prefsAfterSave.locationLat})`)
check('prefs.locationLon ist eine Zahl', prefsAfterSave.locationLon === -156.33667, `${prefsAfterSave.locationLon} (${typeof prefsAfterSave.locationLon})`)

console.log('\n8. Standort löschen')
const cleared = await call('PUT', '/api/auth/profile', { cookie, body: { name: 'Geo Beweis', location: null } })
check('PUT mit location: null → 2xx', cleared.status >= 200 && cleared.status < 300, `Status ${cleared.status}: ${cleared.body.slice(0, 200)}`)
const afterClear = json(await call('GET', '/api/auth/me', { cookie }))
const prefsAfterClear = afterClear?.prefs ?? {}
// WEG heißt weg — nicht '' und nicht 0: „nicht angegeben" ist die ABWESENHEIT
// des Schlüssels, danach fragt readProfileLocation.
check('locationLabel ist WEG (nicht leer)', !('locationLabel' in prefsAfterClear), `${JSON.stringify(prefsAfterClear.locationLabel)}`)
check('locationLat ist WEG', !('locationLat' in prefsAfterClear), `${JSON.stringify(prefsAfterClear.locationLat)}`)
check('locationLon ist WEG', !('locationLon' in prefsAfterClear), `${JSON.stringify(prefsAfterClear.locationLon)}`)
// Gegenprobe: das Löschen darf nicht die ÜBRIGEN prefs mitnehmen.
check('Gegenprobe: bio hat das Löschen überlebt (prefs-Spread hält)', 'bio' in prefsAfterClear, `${JSON.stringify(Object.keys(prefsAfterClear))}`)

console.log(`\n${pass} ✔ / ${fail} ✗\n`)
process.exit(fail ? 1 : 0)
