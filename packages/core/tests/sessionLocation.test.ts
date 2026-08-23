import { describe, expect, it } from 'vitest'
import { formatSessionLocation } from '../shared/sessionLocation'

/**
 * Alle acht Kombinationen aus Stadt/Region/Land — die Regel entscheidet, was
 * eine Sitzungszeile zeigt, und sie muss in JEDEM Fall etwas Sinnvolles oder
 * bewusst gar nichts liefern (dann setzt die UI ihr „Unbekannt" ein).
 * Wichtigster Fall: OHNE MMDB (city/region leer) muss exakt das Land
 * herauskommen, sonst wäre die Anzeige für jedes Deployment ohne Datei eine
 * andere als vorher.
 */
describe('formatSessionLocation', () => {
  it('alles vorhanden: fein zuerst, Land hinter dem Punkt', () => {
    expect(formatSessionLocation({ city: 'Hamburg', region: 'Hamburg', countryName: 'Deutschland' }))
      .toBe('Hamburg, Hamburg · Deutschland')
  })

  it('nur Stadt + Land', () => {
    expect(formatSessionLocation({ city: 'Wien', region: '', countryName: 'Österreich' }))
      .toBe('Wien · Österreich')
  })

  it('nur Region + Land', () => {
    expect(formatSessionLocation({ city: '', region: 'Bayern', countryName: 'Deutschland' }))
      .toBe('Bayern · Deutschland')
  })

  it('OHNE MMDB: genau das Land, unverändert zum Stand vor der Anreicherung', () => {
    expect(formatSessionLocation({ city: '', region: '', countryName: 'Deutschland' }))
      .toBe('Deutschland')
  })

  it('Stadt + Region ohne Land: kein führender oder hängender Trenner', () => {
    expect(formatSessionLocation({ city: 'Honolulu', region: 'Hawaii', countryName: '' }))
      .toBe('Honolulu, Hawaii')
  })

  it('nur Stadt', () => {
    expect(formatSessionLocation({ city: 'Honolulu', region: '', countryName: '' }))
      .toBe('Honolulu')
  })

  it('nur Region', () => {
    expect(formatSessionLocation({ city: '', region: 'Hawaii', countryName: '' }))
      .toBe('Hawaii')
  })

  it('nichts bekannt: leer — die UI setzt hier ihr „Unbekannt" ein', () => {
    expect(formatSessionLocation({ city: '', region: '', countryName: '' })).toBe('')
  })

  it('Leerzeichen-Felder zählen als leer (sonst stünde ein nackter Trenner da)', () => {
    expect(formatSessionLocation({ city: '  ', region: '', countryName: 'Deutschland' }))
      .toBe('Deutschland')
    expect(formatSessionLocation({ city: 'Hamburg', region: '  ', countryName: '  ' }))
      .toBe('Hamburg')
  })

  it('Stadtstaat: die Doppelung bleibt stehen — sie ist die Wahrheit der Daten', () => {
    expect(formatSessionLocation({ city: 'Berlin', region: 'Berlin', countryName: '' }))
      .toBe('Berlin, Berlin')
  })
})
