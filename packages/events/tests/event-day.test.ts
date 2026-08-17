import { describe, expect, it } from 'vitest'
import { calendarDayIn, intlTimezone, isMultiDayIn, sameDayIn } from '../shared/eventDay'

/**
 * Der Kalendertag eines Termins hängt an der ANZEIGEZONE, nicht an der Zone der
 * Maschine. Gegen genau diesen Fehler laufen die Fälle hier: vorher rechneten
 * `toDateString()`/`getDate()` immer in der Laufzeit-Zone, und die Konto-
 * Einstellung war auf den Event-Seiten wirkungslos.
 */
describe('calendarDayIn — derselbe Zeitpunkt, zwei Tage', () => {
  // 25.08.2026 08:30 Hamburg = 24.08.2026 20:30 Honolulu
  const instant = '2026-08-25T06:30:00.000Z'

  it('Hamburg sieht den 25.', () => {
    expect(calendarDayIn(instant, 'Europe/Berlin')).toBe('2026-08-25')
  })

  it('Honolulu sieht denselben Zeitpunkt am 24.', () => {
    expect(calendarDayIn(instant, 'Pacific/Honolulu')).toBe('2026-08-24')
  })

  it('liefert immer sortierbares YYYY-MM-DD', () => {
    expect(calendarDayIn(instant, 'Europe/Berlin')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // Sortierbarkeit ist kein Zufall, sondern der Grund für en-CA: der Kalender
    // vergleicht Tage per String (`key >= endKey`).
    expect(calendarDayIn('2026-01-02T12:00:00.000Z', 'UTC') < calendarDayIn('2026-01-10T12:00:00.000Z', 'UTC')).toBe(true)
  })
})

describe('sameDayIn / isMultiDayIn', () => {
  it('ein Termin über Mitternacht ist zweitägig — auch wenn er kurz ist', () => {
    // 23:00–00:30 Hamburger Zeit: 90 Minuten, aber zwei Kalendertage
    const start = '2026-08-25T21:00:00.000Z' // 23:00 Berlin
    const end = '2026-08-25T22:30:00.000Z' //  00:30 Berlin (26.)
    expect(isMultiDayIn(start, end, 'Europe/Berlin')).toBe(true)
    expect(sameDayIn(start, end, 'Europe/Berlin')).toBe(false)
  })

  it('ein LANGER Termin innerhalb eines Tages ist NICHT mehrtägig', () => {
    // 08:00–22:00 Hamburger Zeit: 14 Stunden, ein Kalendertag
    const start = '2026-08-25T06:00:00.000Z'
    const end = '2026-08-25T20:00:00.000Z'
    expect(isMultiDayIn(start, end, 'Europe/Berlin')).toBe(false)
  })

  it('dieselben zwei Zeitpunkte fallen je nach Zone anders aus', () => {
    const start = '2026-08-25T21:00:00.000Z'
    const end = '2026-08-25T22:30:00.000Z'
    // Berlin: über Mitternacht (s. o.) — Honolulu: beide am selben Nachmittag
    expect(isMultiDayIn(start, end, 'Europe/Berlin')).toBe(true)
    expect(isMultiDayIn(start, end, 'Pacific/Honolulu')).toBe(false)
  })

  it('ohne Ende nie mehrtägig', () => {
    expect(isMultiDayIn('2026-08-25T06:30:00.000Z', null, 'Europe/Berlin')).toBe(false)
  })
})

describe('intlTimezone — die leere Wahl', () => {
  it('`` heißt „Laufzeit-Zone" und wird zu undefined', () => {
    expect(intlTimezone('')).toBeUndefined()
  })

  it('eine gewählte Zone kommt unverändert durch', () => {
    expect(intlTimezone('Europe/Berlin')).toBe('Europe/Berlin')
  })

  it('undefined ist für Intl gültig, ein Leerstring wäre ein RangeError', () => {
    // Die Gegenprobe ist der eigentliche Grund für diese Funktion.
    expect(() => new Intl.DateTimeFormat('de-DE', { timeZone: intlTimezone('') }).format(new Date())).not.toThrow()
    expect(() => new Intl.DateTimeFormat('de-DE', { timeZone: '' }).format(new Date())).toThrow()
  })
})
