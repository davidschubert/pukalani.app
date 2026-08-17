import { calendarDayIn, intlTimezone, isMultiDayIn, sameDayIn } from '../../shared/eventDay'

/**
 * Datums-/Zeitformatierung für Events, gebunden an die aktive i18n-Sprache
 * (Muster useFormatDate im Core — der braucht aber nur date-only, Events
 * brauchen Datum+Uhrzeit und reine Uhrzeit für Zeitfenster am selben Tag).
 *
 * ZEITZONE (2026-08-17): dieselbe Quelle wie im Core — `prefs.timezone` über
 * `useAccountTimezone()`, `''` heißt „automatisch" (Zone der Laufzeit).
 *
 * WARUM DAS EIN FEHLER WAR UND KEINE LÜCKE: die Einstellung gibt es seit U15
 * Teil 5, `useFormatDate` im Core respektiert sie — dieses Composable nicht.
 * Damit war die Konto-Zeitzone ausgerechnet auf den Seiten wirkungslos, auf
 * denen eine Uhrzeit die eigentliche Information IST. Ein Betreiber in
 * Honolulu, der für eine Hamburger Community plant, las auf jeder Karte seine
 * eigene Zeit, während seine Mitglieder eine andere sahen; die Einstellung, die
 * das behoben hätte, tat hier nichts (live gesehen auf freelancer.supply).
 *
 * DER KALENDERTAG MUSS MITWANDERN, nicht nur die Uhrzeit: `sameDay` entschied
 * über `Date.toDateString()`, und das rechnet IMMER in der Laufzeit-Zone. Ein
 * Termin von 23:00 bis 00:30 ist je nach Zone ein- oder zweitägig — daran
 * hängen die Datums-Spanne und das „Mehrtägig"-Badge. Verglichen wird deshalb
 * `en-CA` (liefert `YYYY-MM-DD`, sortier- und vergleichbar) IN der Anzeigezone.
 */
export function useEventDateFormat() {
  const { locale, locales } = useI18n()
  const { timezone } = useAccountTimezone()

  const language = computed(() => {
    const entries = locales.value as Array<{ code: string, language?: string }>
    return entries.find(entry => entry.code === locale.value)?.language ?? locale.value
  })

  /**
   * `undefined` statt `''` — eine leere `timeZone`-Option würde `Intl` mit
   * einem RangeError quittieren; weggelassen rechnet es wie eh und je in der
   * Zone der Laufzeit. Genau die Unterscheidung macht `useFormatDate` im Core.
   */
  const zone = computed(() => intlTimezone(timezone.value))

  const options = (extra: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions =>
    ({ ...extra, timeZone: zone.value })

  const formatDateTime = (iso: string) => new Intl.DateTimeFormat(language.value, options({
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })).format(new Date(iso))

  const formatTime = (iso: string) => new Intl.DateTimeFormat(language.value, options({
    hour: '2-digit', minute: '2-digit',
  })).format(new Date(iso))

  /** Kurz-Monat für Datum-Blöcke (AUG/MÄR) — locale-stabil, kein Hydration-Drift */
  const formatMonthShort = (iso: string) => new Intl.DateTimeFormat(language.value, options({
    month: 'short',
  })).format(new Date(iso))

  /** Kalendertag IN der Anzeigezone als `YYYY-MM-DD` (pure Regel in shared/eventDay). */
  const calendarDay = (iso: string) => calendarDayIn(iso, timezone.value)

  /** gleicher Kalendertag? → Ende nur als Uhrzeit anzeigen */
  const sameDay = (a: string, b: string) => sameDayIn(a, b, timezone.value)

  /**
   * Datums-Zeile für Cards: eintägig „Fr., 15.08.2026, 18:00" —
   * MEHRTÄGIG als Spanne „Do., 20.08. – Sa., 22.08.2026" (die Reihe muss
   * als Reihe erkennbar sein, nicht nur der erste Tag).
   */
  const formatDateSpan = (startAt: string, endAt: string | null) => {
    if (!endAt || sameDay(startAt, endAt)) return formatDateTime(startAt)
    const startFmt = new Intl.DateTimeFormat(language.value, options({ weekday: 'short', day: '2-digit', month: '2-digit' }))
    const endFmt = new Intl.DateTimeFormat(language.value, options({ weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))
    return `${startFmt.format(new Date(startAt))} – ${endFmt.format(new Date(endAt))}`
  }

  /** mehrtägig? (Card-/Detail-Badge „Mehrtägig") */
  const isMultiDay = (startAt: string, endAt: string | null) => isMultiDayIn(startAt, endAt, timezone.value)

  /** Tages-ZAHL in der Anzeigezone (Datums-Blöcke neben `formatMonthShort`). */
  const formatDayNumber = (iso: string) => new Intl.DateTimeFormat('en-US', options({ day: 'numeric' }))
    .format(new Date(iso))

  return { formatDateTime, formatTime, formatMonthShort, formatDayNumber, formatDateSpan, isMultiDay, sameDay, calendarDay }
}
