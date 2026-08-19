import { describe, expect, it } from 'vitest'
import { isSupportedTimezone } from '../../core/shared/timezone'
import { COUNTRY_ZONES, normalizeForAddressMatch, suggestTimezoneForAddress } from '../shared/addressTimezone'

/**
 * F59 — die Adresse SCHLÄGT eine Zone VOR, mehr nicht. Die Fälle hier sind
 * zweigeteilt und das ist der Punkt: die Treffer belegen, dass der Vorschlag
 * überhaupt kommt, die Gegenproben belegen die eigentliche Zusage — im Zweifel
 * kein Vorschlag. Eine Regel, die nur ihre Treffer prüft, ist hier wertlos:
 * teuer wird nicht der fehlende, sondern der falsche Vorschlag.
 */
describe('suggestTimezoneForAddress — Treffer', () => {
  it('erkennt Japan am Ende einer Adresse', () => {
    expect(suggestTimezoneForAddress('Shibuya 2-1, Tokio, Japan')?.zone).toBe('Asia/Tokyo')
  })

  it('erkennt Österreich', () => {
    expect(suggestTimezoneForAddress('1010 Wien, Österreich')?.zone).toBe('Europe/Vienna')
  })

  it('matcht auch ohne Umlaut — getippt wird selten sauber', () => {
    expect(suggestTimezoneForAddress('1010 Wien, Osterreich')?.zone).toBe('Europe/Vienna')
  })

  it('erkennt Mehrwort-Namen', () => {
    expect(suggestTimezoneForAddress('123 Queen St, Auckland, New Zealand')?.zone).toBe('Pacific/Auckland')
  })

  it('liefert den Ländernamen in beiden Sprachen — die Regel kennt keine i18n-Schlüssel', () => {
    expect(suggestTimezoneForAddress('Genfergasse 1, Bern, Schweiz')?.country)
      .toEqual({ de: 'Schweiz', en: 'Switzerland' })
  })

  it('englischer und deutscher Name führen auf dieselbe Zone', () => {
    expect(suggestTimezoneForAddress('Bahnhofstrasse 1, Zürich, Switzerland')?.zone)
      .toBe(suggestTimezoneForAddress('Bahnhofstraße 1, Zürich, Schweiz')?.zone)
  })

  it('ß in der Adresse stört nicht (Großbritannien = Grossbritannien)', () => {
    expect(suggestTimezoneForAddress('221B Baker Street, London, Großbritannien')?.zone).toBe('Europe/London')
    expect(suggestTimezoneForAddress('221B Baker Street, London, Grossbritannien')?.zone).toBe('Europe/London')
  })
})

describe('suggestTimezoneForAddress — fail-closed', () => {
  it('leere Adresse ⇒ kein Vorschlag', () => {
    expect(suggestTimezoneForAddress('')).toBeNull()
    expect(suggestTimezoneForAddress('   ')).toBeNull()
  })

  it('Adresse ohne Land ⇒ kein Vorschlag (die Stadt wird bewusst nicht geraten)', () => {
    expect(suggestTimezoneForAddress('Hauptstraße 5, 20095 Hamburg')).toBeNull()
  })

  it('Mehr-Zonen-Land ⇒ kein Vorschlag', () => {
    // Aus „USA" folgt keine Zone — genau deshalb steht das Land nicht in der
    // Tabelle. Die Zeile hier ist die Zusage, nicht eine Lücke.
    expect(suggestTimezoneForAddress('350 5th Ave, New York, USA')).toBeNull()
    expect(suggestTimezoneForAddress('Bourke St, Melbourne, Australien')).toBeNull()
    expect(suggestTimezoneForAddress('Av. Paulista, São Paulo, Brasilien')).toBeNull()
  })

  it('zwei verschiedene Länder in einer Zeile ⇒ kein Vorschlag', () => {
    expect(suggestTimezoneForAddress('Deutsche Botschaft, Tokio, Japan, Deutschland')).toBeNull()
  })

  it('derselbe Treffer zweimal bleibt EIN Land', () => {
    // „Schweiz" und „Switzerland" zeigen auf dieselbe Zeile der Tabelle —
    // mehrdeutig ist erst ein ZWEITES Land.
    expect(suggestTimezoneForAddress('Bern, Schweiz (Switzerland)')?.zone).toBe('Europe/Zurich')
  })

  it('ein Ländername MITTEN in einem Wort zählt nicht', () => {
    // „Chinatown" enthält „China" — ohne Wortgrenzen-Prüfung stünde in einem
    // Berliner Restaurant plötzlich die Uhrzeit von Shanghai.
    expect(suggestTimezoneForAddress('Chinatown Bistro, 10115 Berlin')).toBeNull()
    // Umgekehrte Richtung: Name als ENDE eines längeren Wortes.
    expect(suggestTimezoneForAddress('Nordirland-Weg 3')).toBeNull()
  })

  it('mehrdeutige Namen stehen bewusst nicht in der Tabelle', () => {
    expect(suggestTimezoneForAddress('Atlanta, Georgia')).toBeNull()
    expect(suggestTimezoneForAddress('Long Island, New York')).toBeNull()
    expect(suggestTimezoneForAddress('Concord, New England')).toBeNull()
  })

  it('Zwei-Buchstaben-Codes sind keine Länder', () => {
    expect(suggestTimezoneForAddress('Wien, AT')).toBeNull()
  })

  it('Länder mit wanderndem Zonen-Namen fehlen bewusst', () => {
    // Node kennt nur `Europe/Kiev`/`Asia/Calcutta`, der Browser nur
    // `Europe/Kyiv`/`Asia/Kolkata` — beide Enden validieren gegen
    // `isSupportedTimezone`, also wäre jeder Vorschlag auf einer Seite ein 400.
    // Begründung ausführlich im Kopf von shared/addressTimezone.ts.
    expect(suggestTimezoneForAddress('Khreschatyk 1, Kyiv, Ukraine')).toBeNull()
    expect(suggestTimezoneForAddress('MG Road, Bengaluru, India')).toBeNull()
  })
})

describe('COUNTRY_ZONES — Invarianten der Tabelle', () => {
  it('jede Zone kennt die Laufzeit (sonst wirft Intl bei der Anzeige)', () => {
    // Dieselbe Härte wie im Event-Schema: eine Zone, die `isSupportedTimezone`
    // nicht kennt, würde beim Speichern mit 400 abgelehnt — ein Vorschlag, den
    // man nicht übernehmen kann, wäre schlimmer als keiner. Dieser Fall ist
    // nicht theoretisch: er hat beim Bau vier Länder aus der Tabelle geworfen
    // (Alias-Falle Kyiv/Kiev — s. Kopf der Regel).
    const unknown = COUNTRY_ZONES.filter(entry => !isSupportedTimezone(entry.zone)).map(entry => entry.zone)
    expect(unknown).toEqual([])
  })

  it('kein Name zeigt auf zwei verschiedene Zonen', () => {
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const entry of COUNTRY_ZONES) {
      for (const name of entry.names) {
        const key = normalizeForAddressMatch(name)
        const other = seen.get(key)
        if (other && other !== entry.zone) clashes.push(`${key}: ${other} vs ${entry.zone}`)
        seen.set(key, entry.zone)
      }
    }
    expect(clashes).toEqual([])
  })

  it('kein Name ist kürzer als vier Zeichen', () => {
    const tooShort = COUNTRY_ZONES
      .flatMap(entry => entry.names)
      .filter(name => normalizeForAddressMatch(name).length < 4)
    expect(tooShort).toEqual([])
  })

  it('jeder Eintrag trägt beide Anzeigenamen', () => {
    const incomplete = COUNTRY_ZONES.filter(entry => !entry.country.de || !entry.country.en).map(entry => entry.zone)
    expect(incomplete).toEqual([])
  })

  it('jeder Eintrag findet sich über JEDEN seiner Namen selbst wieder', () => {
    // Gegenprobe zur Wortgrenzen-Logik: sie darf keinen Tabellen-Namen
    // aussperren (Bindestriche, Mehrwort-Namen, Diakritika).
    const missed: string[] = []
    for (const entry of COUNTRY_ZONES) {
      for (const name of entry.names) {
        if (suggestTimezoneForAddress(`Musterweg 1, Musterstadt, ${name}`)?.zone !== entry.zone) {
          missed.push(`${name} (${entry.zone})`)
        }
      }
    }
    expect(missed).toEqual([])
  })
})
