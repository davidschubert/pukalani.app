import { describe, expect, it } from 'vitest'
import { isoFromWallClock, nextOccurrenceIn, wallClockIn } from '../shared/eventRecurrence'

const inZone = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))

describe('nextOccurrenceIn — die Wanduhr bleibt stehen, der UTC-Abstand nicht', () => {
  it('weekly überlebt die Zeitumstellung (der gemessene Fehler)', () => {
    // Dienstags 08:30 Hamburg. Die Umstellung liegt am 25.10.2026.
    let iso = '2026-10-20T06:30:00.000Z' // 20.10. 08:30 Berlin (CEST)
    iso = nextOccurrenceIn(iso, 'weekly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('27.10.26, 08:30')
    // Die alte Rechnung (feste 7 × 86_400_000 ms) hätte hier 07:30 ergeben —
    // der UTC-Zeitpunkt MUSS sich also um eine Stunde verschoben haben.
    expect(iso).toBe('2026-10-27T07:30:00.000Z')
  })

  it('läuft nach der Umstellung stabil weiter', () => {
    let iso = '2026-10-27T07:30:00.000Z'
    for (let i = 0; i < 3; i++) iso = nextOccurrenceIn(iso, 'weekly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('17.11.26, 08:30')
  })

  it('auch über den Frühjahrs-Sprung (Stunde fällt weg)', () => {
    // Umstellung 29.03.2026: 02:00 → 03:00. Ein Termin um 08:30 ist unberührt.
    let iso = '2026-03-24T07:30:00.000Z' // 24.03. 08:30 Berlin (CET)
    iso = nextOccurrenceIn(iso, 'weekly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('31.03.26, 08:30')
    expect(iso).toBe('2026-03-31T06:30:00.000Z')
  })

  it('biweekly springt 14 Tage, ebenfalls auf der Wanduhr', () => {
    const iso = nextOccurrenceIn('2026-10-20T06:30:00.000Z', 'biweekly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('03.11.26, 08:30')
  })

  it('monthly behält den Monatstag', () => {
    const iso = nextOccurrenceIn('2026-09-15T16:00:00.000Z', 'monthly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('15.10.26, 18:00')
  })

  it('monthly fällt in kürzeren Monaten auf den letzten Tag', () => {
    // 31.01. → 28.02. (2027 ist kein Schaltjahr)
    const iso = nextOccurrenceIn('2027-01-31T17:00:00.000Z', 'monthly', 'Europe/Berlin')
    expect(inZone(iso, 'Europe/Berlin')).toBe('28.02.27, 18:00')
  })

  it('ohne Zone wird in UTC gerechnet — stabil, nur ohne Ortsbezug', () => {
    const iso = nextOccurrenceIn('2026-10-20T06:30:00.000Z', 'weekly', '')
    expect(iso).toBe('2026-10-27T06:30:00.000Z')
  })

  it('eine Zone OHNE Umstellung verhält sich wie vorher', () => {
    // Honolulu kennt keine Sommerzeit — hier darf sich nichts ändern.
    const iso = nextOccurrenceIn('2026-10-20T06:30:00.000Z', 'weekly', 'Pacific/Honolulu')
    expect(iso).toBe('2026-10-27T06:30:00.000Z')
  })
})

describe('wallClockIn / isoFromWallClock — Hin und zurück', () => {
  it('ist verlustfrei über die Umstellung hinweg', () => {
    for (const iso of ['2026-10-24T06:30:00.000Z', '2026-10-27T07:30:00.000Z', '2026-03-31T06:30:00.000Z']) {
      expect(isoFromWallClock(wallClockIn(iso, 'Europe/Berlin'), 'Europe/Berlin')).toBe(iso)
    }
  })

  it('liest Mitternacht als 0, nicht als 24', () => {
    const wall = wallClockIn('2026-08-24T22:00:00.000Z', 'Europe/Berlin') // 25.08. 00:00
    expect(wall.hour).toBe(0)
    expect(wall.day).toBe(25)
  })

  it('dieselbe Wanduhr ergibt je nach Jahreszeit einen anderen Zeitpunkt', () => {
    const sommer = isoFromWallClock({ year: 2026, month: 7, day: 1, hour: 8, minute: 30, second: 0 }, 'Europe/Berlin')
    const winter = isoFromWallClock({ year: 2026, month: 12, day: 1, hour: 8, minute: 30, second: 0 }, 'Europe/Berlin')
    expect(sommer).toBe('2026-07-01T06:30:00.000Z') // CEST = UTC+2
    expect(winter).toBe('2026-12-01T07:30:00.000Z') // CET  = UTC+1
  })
})
