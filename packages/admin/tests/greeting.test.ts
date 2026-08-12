import { describe, expect, it } from 'vitest'
import { ARRIVAL_WINDOW_MS, isArrivalGreeting } from '../shared/greeting'

const NOW = Date.parse('2026-08-12T12:00:00.000Z')

describe('isArrivalGreeting', () => {
  it('der Trichter-Fall: Konto vor Minuten angelegt ⇒ keine „zurück"-Begrüßung', () => {
    expect(isArrivalGreeting('2026-08-12T11:52:00.000Z', NOW)).toBe(true)
  })
  it('Bestandskonto ⇒ „Willkommen zurück"', () => {
    expect(isArrivalGreeting('2026-06-01T09:00:00.000Z', NOW)).toBe(false)
  })
  it('genau an der Fenstergrenze zählt als Wiederkehrer', () => {
    expect(isArrivalGreeting(new Date(NOW - ARRIVAL_WINDOW_MS).toISOString(), NOW)).toBe(false)
    expect(isArrivalGreeting(new Date(NOW - ARRIVAL_WINDOW_MS + 1000).toISOString(), NOW)).toBe(true)
  })
  it('Datum in der Zukunft (Uhr-Versatz) gilt als eben angelegt', () => {
    expect(isArrivalGreeting('2026-08-12T12:05:00.000Z', NOW)).toBe(true)
  })
  it('unbekannt oder unlesbar ⇒ Bestandsfall, nie geraten', () => {
    for (const value of [undefined, null, '', 'irgendwann']) {
      expect(isArrivalGreeting(value, NOW)).toBe(false)
    }
  })
})
