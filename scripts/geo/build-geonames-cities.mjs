#!/usr/bin/env node
/**
 * Baut das kompakte Städteverzeichnis für den Standort-Picker
 * (Profil → „Standort", Mitglieder-Karte).
 *
 * QUELLE: GeoNames cities1000 (alle Orte ≥ 1000 Einwohner, ~130k Zeilen,
 * Lizenz CC BY 4.0 — die Attribution steht im Picker) plus
 * admin1CodesASCII (Regionsnamen: „Hawaii", „Bayern", …).
 *
 * AUSGABE: EINE Tab-getrennte Datei, eine Zeile je Ort, nach Einwohnerzahl
 * absteigend sortiert (die Suche nimmt die ersten Treffer — so gewinnt
 * „Berlin, Deutschland" gegen „Berlin, Wisconsin"):
 *
 *   name \t asciiName \t regionName \t countryCode \t lat \t lon \t population
 *
 * Die Datei wird NICHT committet (~10 MB, Ablage wie die DB-IP-MMDB unter
 * ~/Developer/geodb/ bzw. /home/ploi/geodb/, Env NUXT_GEO_CITIES_PATH).
 * GeoNames aktualisiert laufend, aber Städte ziehen nicht um — ein
 * gelegentlicher Neubau reicht, es braucht keinen Cron.
 *
 * Aufruf:  node scripts/geo/build-geonames-cities.mjs [zielpfad]
 *          (Default: ~/Developer/geodb/geonames-cities.tsv)
 */
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, dirname } from 'node:path'

const target = process.argv[2] || join(homedir(), 'Developer/geodb/geonames-cities.tsv')
const work = mkdtempSync(join(tmpdir(), 'geonames-'))

try {
  console.log('Lade cities1000.zip und admin1CodesASCII.txt von download.geonames.org …')
  execSync(`curl -sfL -o ${work}/cities1000.zip https://download.geonames.org/export/dump/cities1000.zip`, { stdio: 'inherit' })
  execSync(`curl -sfL -o ${work}/admin1.txt https://download.geonames.org/export/dump/admin1CodesASCII.txt`, { stdio: 'inherit' })
  execSync(`cd ${work} && unzip -oq cities1000.zip`)

  // admin1: "US.HI\tHawaii\tHawaii\t5855797" → Karte "US.HI" → "Hawaii"
  const admin1 = new Map()
  for (const line of readFileSync(join(work, 'admin1.txt'), 'utf8').split('\n')) {
    const [code, name] = line.split('\t')
    if (code && name) admin1.set(code, name)
  }

  // cities1000: GeoNames-Hauptformat, 19 Spalten. Wir brauchen:
  // 1 name · 2 asciiname · 4 lat · 5 lon · 8 countryCode · 10 admin1Code · 14 population
  const rows = []
  for (const line of readFileSync(join(work, 'cities1000.txt'), 'utf8').split('\n')) {
    const f = line.split('\t')
    if (f.length < 15) continue
    const [name, ascii, lat, lon] = [f[1], f[2], f[4], f[5]]
    const country = f[8]
    const region = admin1.get(`${country}.${f[10]}`) ?? ''
    const population = Number(f[14]) || 0
    if (!name || !lat || !lon || !country) continue
    rows.push({ name, ascii, region, country, lat, lon, population })
  }
  rows.sort((a, b) => b.population - a.population)

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, rows.map(r =>
    [r.name, r.ascii, r.region, r.country, r.lat, r.lon, r.population].join('\t'),
  ).join('\n'))
  console.log(`${rows.length} Orte → ${target}`)
}
finally {
  rmSync(work, { recursive: true, force: true })
}
