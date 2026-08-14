/**
 * Reine Formatierungs-Funktionen (kein Browser, kein Nuxt-Context) —
 * direkt unit-testbar, DACH-Defaults.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * dd.MM.yyyy — z.B. 01.01.2026
 *
 * `timeZone` ist die Zeitzone des KONTOS (`prefs.timezone`, U15 Teil 5).
 * Ohne Angabe rechnet `Intl` in der Zone der Laufzeit — exakt das Verhalten von
 * vor der Einstellung. MIT Angabe rechnen Server und Browser dieselbe Zeile
 * aus, was die Anzeige nebenbei hydrations-fest macht.
 */
export function formatDate(value: Date | string | number, locale = 'de-DE', timeZone?: string): string {
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    // Ein Date-only-String ist ein KALENDERTAG OHNE Zeitzone: der 31.12.2025
    // ist in Tokio derselbe Tag wie in Denver. Deshalb wird er als
    // UTC-Mitternacht gebaut UND in UTC formatiert — die beiden heben sich
    // auf, und weder die Laufzeit-Zone noch die Konto-Zone kann ihn auf den
    // Vortag kippen. (Früher: lokale Mitternacht + lokale Formatierung, mit
    // demselben Ergebnis; sobald `timeZone` mitkommt, wäre dieses Paar aber
    // gemischt und der Tag verschöbe sich.)
    const [, year, month, day] = DATE_ONLY.exec(value)!
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
  }

  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

/**
 * HH:mm — die Uhrzeit eines Zeitpunkts in einer bestimmten Zone.
 *
 * Gebaut für die Wirkungs-Anzeige der Zeitzonen-Einstellung („Jetzt: 14:32 in
 * Europe/Berlin"): eine Einstellung, deren Wirkung man erst morgen bemerkt,
 * kann man nicht prüfen. Ohne `timeZone` wieder die Zone der Laufzeit.
 */
export function formatTime(value: Date | string | number, locale = 'de-DE', timeZone?: string): string {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

// Uhren-Drift-Klemme: Server-Zeitstempel können der Client-Uhr um Sekunden
// vorauseilen — „in 13 Sekunden" für einen frischen Kommentar ist absurd.
// Kleine Zukunft wird zu „jetzt"; ECHTE Zukunftsdaten (Events) bleiben.
const CLOCK_DRIFT_CLAMP_SECONDS = 90

/** "vor 5 Minuten" / "gestern" — now ist injizierbar (Testbarkeit) */
export function formatRelativeTime(
  value: Date | string | number,
  options: { locale?: string, now?: Date } = {},
): string {
  const date = value instanceof Date ? value : new Date(value)
  const now = options.now ?? new Date()
  let diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  if (diffSeconds > 0 && diffSeconds < CLOCK_DRIFT_CLAMP_SECONDS) diffSeconds = 0
  const formatter = new Intl.RelativeTimeFormat(options.locale ?? 'de-DE', { numeric: 'auto' })

  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.trunc(diffSeconds / seconds), unit)
    }
  }
  return formatter.format(diffSeconds, 'second')
}

/** 1.234,56 € — Intl nutzt ein geschütztes Leerzeichen vor dem Symbol */
export function formatCurrency(
  value: number,
  options: { locale?: string, currency?: string } = {},
): string {
  return new Intl.NumberFormat(options.locale ?? 'de-DE', {
    style: 'currency',
    currency: options.currency ?? 'EUR',
  }).format(value)
}
