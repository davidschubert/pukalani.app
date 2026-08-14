import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, formatRelativeTime, formatTime } from '../app/utils/format'

/** Intl setzt vor dem Währungssymbol ein geschütztes Leerzeichen (U+00A0) */
function normalize(value: string): string {
  return value.replace(/\u00A0/g, ' ')
}

describe('formatDate', () => {
  it('formatiert Date-only-Strings als dd.MM.yyyy', () => {
    expect(formatDate('2026-01-01')).toBe('01.01.2026')
  })

  it('kippt am Monatswechsel nicht auf den Vortag (Timezone-sicher)', () => {
    expect(formatDate('2026-03-01')).toBe('01.03.2026')
    expect(formatDate('2025-12-31')).toBe('31.12.2025')
  })

  it('formatiert Date-Objekte', () => {
    expect(formatDate(new Date(2026, 5, 10))).toBe('10.06.2026')
  })

  it('formatiert Timestamps', () => {
    expect(formatDate(new Date(2026, 0, 31).getTime())).toBe('31.01.2026')
  })

  it('unterstützt andere Locales', () => {
    expect(formatDate('2026-01-01', 'en-US')).toBe('01/01/2026')
  })
})

describe('formatDate (Zeitzone des Kontos — U15 Teil 5)', () => {
  // Ein Zeitpunkt kurz vor Mitternacht UTC: der KALENDERTAG hängt hier
  // tatsächlich an der Zone, nur so beweist der Test etwas.
  const instant = '2026-06-11T22:30:00Z'

  it('rechnet in der gewählten Zone (Sydney ist schon am nächsten Tag)', () => {
    expect(formatDate(instant, 'de-DE', 'Australia/Sydney')).toBe('12.06.2026')
  })

  it('rechnet in der gewählten Zone (Los Angeles ist noch am Vortag)', () => {
    expect(formatDate(instant, 'de-DE', 'America/Los_Angeles')).toBe('11.06.2026')
  })

  it('ist mit gesetzter Zone maschinen-unabhängig — Server und Browser rechnen dasselbe', () => {
    expect(formatDate(instant, 'de-DE', 'UTC')).toBe('11.06.2026')
    expect(formatDate(instant, 'en-US', 'UTC')).toBe('06/11/2026')
  })

  it('ohne Zone exakt wie bisher: die Laufzeit-Zone entscheidet', () => {
    const local = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .format(new Date(instant))
    expect(formatDate(instant, 'de-DE')).toBe(local)
    expect(formatDate(instant, 'de-DE', undefined)).toBe(local)
  })

  it('lässt Date-only-Strings von JEDER Zone unberührt (ein Kalendertag hat keine)', () => {
    // Kiritimati (UTC+14) und Niue (UTC−11) liegen 25 Stunden auseinander —
    // ein zonen-behafteter Kalendertag müsste hier auseinanderfallen.
    expect(formatDate('2026-01-01', 'de-DE', 'Pacific/Kiritimati')).toBe('01.01.2026')
    expect(formatDate('2026-01-01', 'de-DE', 'Pacific/Niue')).toBe('01.01.2026')
    expect(formatDate('2025-12-31', 'de-DE', 'Asia/Tokyo')).toBe('31.12.2025')
  })
})

describe('formatTime (U15 Teil 5)', () => {
  const instant = '2026-06-11T12:32:00Z'

  it('zeigt die Uhrzeit in der gewählten Zone', () => {
    expect(formatTime(instant, 'de-DE', 'Europe/Berlin')).toBe('14:32')
    expect(formatTime(instant, 'de-DE', 'Asia/Tokyo')).toBe('21:32')
  })

  it('folgt der Locale (en-US mit AM/PM)', () => {
    expect(formatTime(instant, 'en-US', 'Europe/Berlin')).toBe('02:32 PM')
  })

  it('ohne Zone: Laufzeit-Zone', () => {
    const local = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
      .format(new Date(instant))
    expect(formatTime(instant, 'de-DE')).toBe(local)
  })
})

describe('formatCurrency', () => {
  it('formatiert Beträge als 1.234,56 €', () => {
    expect(normalize(formatCurrency(1234.56))).toBe('1.234,56 €')
  })

  it('formatiert 0-Beträge', () => {
    expect(normalize(formatCurrency(0))).toBe('0,00 €')
  })

  it('formatiert negative Beträge', () => {
    expect(normalize(formatCurrency(-1234.56))).toBe('-1.234,56 €')
  })

  it('rundet auf zwei Nachkommastellen', () => {
    expect(normalize(formatCurrency(9.999))).toBe('10,00 €')
  })

  it('unterstützt andere Währungen', () => {
    expect(normalize(formatCurrency(1234.56, { currency: 'USD' }))).toContain('$')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-11T12:00:00Z')

  it('formatiert Minuten relativ', () => {
    expect(formatRelativeTime(new Date('2026-06-11T11:55:00Z'), { now })).toBe('vor 5 Minuten')
  })

  it('nutzt sprachliche Formen wie "gestern"', () => {
    expect(formatRelativeTime(new Date('2026-06-10T12:00:00Z'), { now })).toBe('gestern')
  })

  it('unterstützt andere Locales', () => {
    expect(formatRelativeTime(new Date('2026-06-11T11:00:00Z'), { now, locale: 'en-US' })).toBe('1 hour ago')
  })

  it('klemmt kleinen Zukunfts-Drift auf „jetzt" (Client-Uhr geht nach)', () => {
    expect(formatRelativeTime(new Date('2026-06-11T12:00:13Z'), { now })).toBe('jetzt')
  })

  it('lässt echte Zukunftsdaten unangetastet', () => {
    expect(formatRelativeTime(new Date('2026-06-14T12:00:00Z'), { now })).toBe('in 3 Tagen')
  })

  it('fällt auf Sekunden zurück', () => {
    expect(formatRelativeTime(new Date('2026-06-11T11:59:30Z'), { now })).toBe('vor 30 Sekunden')
  })
})

describe('formatCurrency (Locale-Bindung)', () => {
  // useFormatCurrency ist wie useFormatDate an die i18n-Sprache gebunden
  // (braucht Nuxt-Context, kein Composable-Unit-Test); die Locale-Weichen
  // deckt der Util-Test mit explizitem locale-Argument ab.
  it('formatiert deutsch (Default)', () => {
    expect(normalize(formatCurrency(1234.56))).toBe('1.234,56 €')
  })

  it('folgt der übergebenen Locale (en-US)', () => {
    expect(normalize(formatCurrency(1234.56, { locale: 'en-US' }))).toBe('€1,234.56')
  })

  it('unterstützt andere Währungen', () => {
    expect(normalize(formatCurrency(99, { locale: 'en-US', currency: 'USD' }))).toBe('$99.00')
  })
})
