import { describe, it, expect } from 'vitest'
import {
  AUTOMATIC_TIMEZONE,
  groupTimezonesByRegion,
  isSupportedTimezone,
  normalizeTimezonePref,
  supportedTimezones,
  timezoneRegion,
} from '../shared/timezone'

describe('supportedTimezones', () => {
  it('liefert die Zonenliste der Laufzeit', () => {
    const zones = supportedTimezones()
    expect(zones.length).toBeGreaterThan(100)
    expect(zones).toContain('Europe/Berlin')
  })

  it('ist über Aufrufe hinweg dieselbe Liste (gecacht)', () => {
    expect(supportedTimezones()).toBe(supportedTimezones())
  })
})

describe('isSupportedTimezone', () => {
  it('erkennt echte IANA-Zonen', () => {
    expect(isSupportedTimezone('Europe/Berlin')).toBe(true)
    expect(isSupportedTimezone('Pacific/Honolulu')).toBe(true)
    expect(isSupportedTimezone('America/New_York')).toBe(true)
  })

  it('kennt NUR die kanonische Liste — „UTC" gehört nicht dazu', () => {
    // `Intl.supportedValuesOf('timeZone')` liefert ausschließlich geografische
    // Zonen (Africa/… bis Pacific/…), keine Aliasse und kein `UTC`/`Etc/*`.
    // Die Auswahlliste bietet UTC deshalb nicht an, und die Route lehnt es ab.
    // Festgenagelt, damit das eine BEKANNTE Folge der Erlaubnisliste bleibt und
    // nicht später als Fehler „repariert" wird.
    expect(isSupportedTimezone('UTC')).toBe(false)
    expect(isSupportedTimezone('Etc/UTC')).toBe(false)
    expect(supportedTimezones().every(zone => zone.includes('/'))).toBe(true)
  })

  it('weist Erfundenes ab (fail-closed — sonst wirft Intl später bei JEDER Anzeige)', () => {
    expect(isSupportedTimezone('Mars/Olympus')).toBe(false)
    expect(isSupportedTimezone('Europe/Berlin ')).toBe(false)
    expect(isSupportedTimezone('europe/berlin')).toBe(false)
  })

  it('ist für den Leerstring falsch — „automatisch" ist keine Zone', () => {
    expect(isSupportedTimezone(AUTOMATIC_TIMEZONE)).toBe(false)
  })
})

describe('normalizeTimezonePref', () => {
  it('reicht bekannte Zonen durch', () => {
    expect(normalizeTimezonePref('Asia/Tokyo')).toBe('Asia/Tokyo')
  })

  it('macht aus Unbekanntem „automatisch" (fail-soft beim LESEN)', () => {
    expect(normalizeTimezonePref('Mars/Olympus')).toBe(AUTOMATIC_TIMEZONE)
  })

  it('verträgt fehlende und fremde Werte', () => {
    expect(normalizeTimezonePref(undefined)).toBe(AUTOMATIC_TIMEZONE)
    expect(normalizeTimezonePref(null)).toBe(AUTOMATIC_TIMEZONE)
    expect(normalizeTimezonePref(42)).toBe(AUTOMATIC_TIMEZONE)
    expect(normalizeTimezonePref('')).toBe(AUTOMATIC_TIMEZONE)
  })
})

describe('timezoneRegion', () => {
  it('nimmt den Teil vor dem Schrägstrich', () => {
    expect(timezoneRegion('Europe/Berlin')).toBe('Europe')
    expect(timezoneRegion('America/Argentina/Salta')).toBe('America')
  })

  it('lässt Zonen ohne Region ganz', () => {
    expect(timezoneRegion('UTC')).toBe('UTC')
  })
})

describe('groupTimezonesByRegion', () => {
  it('gruppiert und behält die Eingabe-Reihenfolge', () => {
    expect(groupTimezonesByRegion(['Africa/Cairo', 'Europe/Berlin', 'Europe/Paris', 'UTC'])).toEqual([
      { region: 'Africa', zones: ['Africa/Cairo'] },
      { region: 'Europe', zones: ['Europe/Berlin', 'Europe/Paris'] },
      { region: 'UTC', zones: ['UTC'] },
    ])
  })

  it('führt verstreute Einträge derselben Region zusammen', () => {
    expect(groupTimezonesByRegion(['Europe/Berlin', 'Asia/Tokyo', 'Europe/Paris'])).toEqual([
      { region: 'Europe', zones: ['Europe/Berlin', 'Europe/Paris'] },
      { region: 'Asia', zones: ['Asia/Tokyo'] },
    ])
  })

  it('verträgt eine leere Liste', () => {
    expect(groupTimezonesByRegion([])).toEqual([])
  })

  it('verliert keine Zone der echten Liste', () => {
    const zones = supportedTimezones()
    const grouped = groupTimezonesByRegion(zones).flatMap(group => group.zones)
    expect(grouped).toHaveLength(zones.length)
  })
})
