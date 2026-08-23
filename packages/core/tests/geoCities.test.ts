import { describe, expect, it } from 'vitest'
import {
  cityLabel,
  collectCountryCodes,
  normalizeCityQuery,
  normalizeCountryCode,
  parseCityLine,
  parseCityTable,
  rankCities,
} from '../shared/geoCities'
import { readProfileLocation, sameProfileLocation } from '../shared/profileLocation'

/**
 * Die Rangfolge der Orts-Suche ist die einzige Stelle, an der man sich in
 * dieser Kette irren kann — und sie ist pur, also prüfbar ohne Datei,
 * Dev-Server und Appwrite.
 *
 * Die Zeilen unten sind ECHTE Zeilen aus `geonames-cities.tsv`, in der
 * DATEI-Reihenfolge (Einwohner absteigend). Genau die trägt hier die Aussage:
 * dass Berlin/DE gegen Berlin/Wisconsin gewinnt, ist keine Rechnung im Code,
 * sondern die Sortierung der Quelle.
 */
const TSV = [
  'Berlin\tBerlin\tState of Berlin\tDE\t52.52437\t13.41053\t3426354',
  'Zürich\tZuerich\tZurich\tCH\t47.36667\t8.55\t415367',
  'Pukalani\tPukalani\tHawaii\tUS\t20.83667\t-156.33667\t7574',
  'Berlin\tBerlin\tWisconsin\tUS\t43.96805\t-88.94344\t5486',
  'Puerto Berlín\tPuerto Berlin\tCaquetá\tCO\t1.0\t-75.0\t2000',
  'Singapore\tSingapore\t\tSG\t1.28967\t103.85007\t3547809',
].join('\n')

const ENTRIES = parseCityTable(TSV)

describe('normalizeCityQuery', () => {
  it('macht klein, trimmt und wirft Diakritika weg', () => {
    expect(normalizeCityQuery('  Zürich ')).toBe('zurich')
    expect(normalizeCityQuery('CAQUETÁ')).toBe('caqueta')
  })
})

describe('parseCityLine', () => {
  it('liest die sieben Felder und schreibt den Ländercode klein', () => {
    const entry = parseCityLine('Pukalani\tPukalani\tHawaii\tUS\t20.83667\t-156.33667\t7574')
    expect(entry).toMatchObject({ name: 'Pukalani', region: 'Hawaii', countryCode: 'us', lat: 20.83667, lon: -156.33667 })
  })

  it('verwirft, was nicht verwertbar ist — statt die ganze Datei zu verlieren', () => {
    expect(parseCityLine('')).toBeNull()
    expect(parseCityLine('Nur\tdrei\tFelder')).toBeNull()
    // Ohne Koordinaten wäre der Ort auf der Karte nicht zeigbar.
    expect(parseCityLine('Nirgendwo\tNirgendwo\t\tDE\t\t\t100')).toBeNull()
  })

  it('hält für ASCII-gleiche Namen nur EINE Zeichenkette', () => {
    const entry = parseCityLine('Pukalani\tPukalani\tHawaii\tUS\t20.83667\t-156.33667\t7574')!
    expect(entry.searchAscii).toBe(entry.search)
    // Bei Zürich sind es zwei verschiedene Wege zum selben Ort.
    const zurich = parseCityLine('Zürich\tZuerich\tZurich\tCH\t47.36667\t8.55\t415367')!
    expect(zurich.search).toBe('zurich')
    expect(zurich.searchAscii).toBe('zuerich')
  })
})

describe('cityLabel', () => {
  it('lässt die Region weg, wenn es keine gibt', () => {
    expect(cityLabel('Pukalani', 'Hawaii')).toBe('Pukalani, Hawaii')
    expect(cityLabel('Singapore', '')).toBe('Singapore')
  })
})

describe('rankCities', () => {
  it('findet Pukalani mit Label, Ländercode und Koordinaten', () => {
    const [first] = rankCities(ENTRIES, 'puka', { limit: 8 })
    expect(first).toEqual({ label: 'Pukalani, Hawaii', countryCode: 'us', lat: 20.83667, lon: -156.33667 })
  })

  it('gibt der Datei-Reihenfolge recht: Berlin/DE vor Berlin/Wisconsin', () => {
    const hits = rankCities(ENTRIES, 'berl', { limit: 8 })
    expect(hits[0]?.label).toBe('Berlin, State of Berlin')
    expect(hits[0]?.countryCode).toBe('de')
  })

  it('stellt Anfangs-Treffer vor Enthalten-Treffer', () => {
    const labels = rankCities(ENTRIES, 'berl', { limit: 8 }).map(hit => hit.label)
    // „Puerto Berlín" ENTHÄLT den Begriff, beginnt aber nicht damit — es steht
    // deshalb hinter beiden Berlins, obwohl es in der Datei dazwischenläge.
    expect(labels.indexOf('Puerto Berlín, Caquetá')).toBe(labels.length - 1)
  })

  it('findet Zürich über beide Wege — „zurich" und „zuerich"', () => {
    expect(rankCities(ENTRIES, 'zurich', { limit: 8 })[0]?.label).toBe('Zürich, Zurich')
    expect(rankCities(ENTRIES, 'zue', { limit: 8 })[0]?.label).toBe('Zürich, Zurich')
    // Gegenprobe: ohne das Entfernen der Diakritika fände „zurich" nichts.
    expect(rankCities(ENTRIES, 'zürich', { limit: 8 })[0]?.label).toBe('Zürich, Zurich')
  })

  it('hält sich an das Limit und schweigt bei leerem Begriff', () => {
    expect(rankCities(ENTRIES, 'berl', { limit: 1 })).toHaveLength(1)
    expect(rankCities(ENTRIES, '   ', { limit: 8 })).toEqual([])
    expect(rankCities(ENTRIES, 'berl', { limit: 0 })).toEqual([])
  })

  it('grenzt auf ein Land ein — und lässt einen unsinnigen Code fallen', () => {
    const us = rankCities(ENTRIES, 'berlin', { limit: 8, country: 'US' })
    expect(us).toHaveLength(1)
    expect(us[0]).toMatchObject({ label: 'Berlin, Wisconsin', countryCode: 'us' })
    // Ein kaputter Filter WEITET die Suche, er würgt sie nicht ab.
    expect(rankCities(ENTRIES, 'berlin', { limit: 8, country: 'deutschland' })).toHaveLength(3)
  })
})

describe('normalizeCountryCode', () => {
  it('nimmt nur zwei Buchstaben — alles andere heißt „kein Filter"', () => {
    expect(normalizeCountryCode('DE')).toBe('de')
    expect(normalizeCountryCode(' ch ')).toBe('ch')
    expect(normalizeCountryCode('')).toBe('')
    expect(normalizeCountryCode('deu')).toBe('')
    expect(normalizeCountryCode('4')).toBe('')
  })
})

describe('collectCountryCodes', () => {
  it('sammelt jedes Land genau einmal, alphabetisch', () => {
    expect(collectCountryCodes(ENTRIES)).toEqual(['ch', 'co', 'de', 'sg', 'us'])
  })
})

describe('readProfileLocation', () => {
  it('liest die drei prefs-Schlüssel', () => {
    expect(readProfileLocation({ locationLabel: 'Pukalani, Hawaii', locationLat: 20.83667, locationLon: -156.33667 }))
      .toEqual({ label: 'Pukalani, Hawaii', lat: 20.83667, lon: -156.33667 })
  })

  it('ist ALLES ODER NICHTS — ein halber Standort ist keiner', () => {
    expect(readProfileLocation(undefined)).toBeNull()
    expect(readProfileLocation({})).toBeNull()
    expect(readProfileLocation({ locationLabel: 'Pukalani', locationLat: 20.8 })).toBeNull()
    expect(readProfileLocation({ locationLabel: '', locationLat: 20.8, locationLon: -156.3 })).toBeNull()
    // Aus prefs kommt ungeprüfter JSON — ein String ist keine Koordinate.
    expect(readProfileLocation({ locationLabel: 'Pukalani', locationLat: '20.8', locationLon: -156.3 })).toBeNull()
  })

  it('nimmt den Nullmeridian und den Äquator ernst', () => {
    expect(readProfileLocation({ locationLabel: 'Null Island', locationLat: 0, locationLon: 0 }))
      .toEqual({ label: 'Null Island', lat: 0, lon: 0 })
  })
})

describe('sameProfileLocation', () => {
  it('erkennt „nichts geändert" — sonst meldet das Protokoll eine Änderung, die keine war', () => {
    const one = { label: 'Pukalani, Hawaii', lat: 20.83667, lon: -156.33667 }
    expect(sameProfileLocation(one, { ...one })).toBe(true)
    expect(sameProfileLocation(null, null)).toBe(true)
    expect(sameProfileLocation(one, null)).toBe(false)
    expect(sameProfileLocation(one, { ...one, lat: 20.9 })).toBe(false)
  })
})
