/**
 * PROTOTYP (I0) — Komponenten-Vorlage für I2/I3.
 *
 * Anzeige-Formate der Redaktion. Sie stehen HIER und nicht in `shared/`, weil
 * sie die Oberflächen-Sprache brauchen: ein Beitrag reist mit ISO-Datum
 * (maschinenlesbar, sortierbar) und wird erst beim Anzeigen zu „8. Sept.
 * 2026" bzw. „Sep 8, 2026". Ein im Server formatiertes Datum wäre in der
 * zweiten Sprache falsch.
 */

/**
 * EIN KALENDERTAG (`YYYY-MM-DD`) — mit `timeZone: 'UTC'`, und das ist keine
 * Pedanterie.
 *
 * `new Date('2026-09-08')` ist UTC-Mitternacht; ein Formatierer ohne
 * `timeZone` schiebt das in jeder westlichen Zeitzone auf den 7. September —
 * auf dem SERVER (Zeitzone des Hosts) womöglich anders als im BROWSER, und
 * genau daraus wird ein Hydrations-Fehler. Dieselbe Falle wie in
 * `market/app/utils/marketFormat.ts`; sie wird hier nicht neu gelernt.
 */
export function insightsDay(isoDate: string, locale: string): string {
  if (!isoDate) return ''
  const parsed = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(parsed)
}

/** Die Adresse, wie ein Mensch sie liest — ohne Schema, ohne Schrägstrich am Ende. */
export function insightsHost(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/** Grosse Zahlen des Radars. `Intl.NumberFormat` ist auf beiden Seiten gleich. */
export function insightsNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** Tage zwischen zwei Kalendertagen — für „Alter" im Radar (§9.6). */
export function insightsDaysBetween(isoDate: string, todayIso: string): number {
  const from = new Date(`${isoDate}T00:00:00.000Z`).getTime()
  const to = new Date(`${todayIso}T00:00:00.000Z`).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
  return Math.max(0, Math.round((to - from) / 86_400_000))
}
