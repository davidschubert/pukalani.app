/**
 * AUF WELCHEN KALENDERTAG FÄLLT EIN ZEITPUNKT? — pure Regel, beide Seiten.
 *
 * Ein Termin ist ein absoluter Zeitpunkt (UTC in `startAt`), ein Kalendertag
 * ist es nicht: 2026-08-25T06:30Z ist in Hamburg der 25., in Honolulu noch der
 * 24. Überall dort, wo aus einem Zeitpunkt ein TAG wird — Datums-Spanne,
 * „Mehrtägig"-Badge, Kalender-Pille, „heute" —, muss dieselbe Zone gelten wie
 * in der angezeigten Uhrzeit. Vorher lief das über `Date.toDateString()` bzw.
 * `getDate()`, und die rechnen IMMER in der Zone der Laufzeit; die Konto-
 * Einstellung (`prefs.timezone`, U15 Teil 5) war damit auf genau den Seiten
 * wirkungslos, auf denen die Uhrzeit die Information ist.
 *
 * `en-CA` ist kein Geschmack, sondern der Trick: dieses Locale formatiert
 * `YYYY-MM-DD`, also sortier- UND vergleichbar. Damit ist „Tag A vor Tag B"
 * ein simpler String-Vergleich, ohne ein zweites Datums-Objekt zu bauen.
 */

/** `''` = keine Wahl ⇒ Zone der Laufzeit (Verhalten wie vor der Einstellung). */
export type DisplayTimezone = string

/**
 * `undefined` statt `''` an `Intl` weiterreichen — eine LEERE `timeZone`-Option
 * quittiert `Intl` mit einem RangeError, eine fehlende bedeutet „Laufzeit-Zone".
 */
export function intlTimezone(timezone: DisplayTimezone): string | undefined {
  return timezone || undefined
}

/** Kalendertag eines Zeitpunkts als `YYYY-MM-DD`, gerechnet in `timezone`. */
export function calendarDayIn(iso: string, timezone: DisplayTimezone): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: intlTimezone(timezone),
  }).format(new Date(iso))
}

/** Gleicher Kalendertag in dieser Zone? (Ende nur als Uhrzeit anzeigen) */
export function sameDayIn(a: string, b: string, timezone: DisplayTimezone): boolean {
  return calendarDayIn(a, timezone) === calendarDayIn(b, timezone)
}

/**
 * Mehrtägig in dieser Zone? — `endAt` fehlt ⇒ nie.
 *
 * BEWUSST über den Kalendertag und nicht über die Dauer: ein Termin von 23:00
 * bis 00:30 dauert 90 Minuten und ist trotzdem zweitägig; einer von 08:00 bis
 * 22:00 dauert länger und ist eintägig. Das Badge sagt „geht über mehrere
 * Tage", nicht „dauert lange".
 */
export function isMultiDayIn(startAt: string, endAt: string | null, timezone: DisplayTimezone): boolean {
  return !!endAt && !sameDayIn(startAt, endAt, timezone)
}
