import type { EventRecurrence } from './types/event'

/**
 * WANN IST DER NÄCHSTE TERMIN EINER SERIE? — pure Regel, in ORTSZEIT gerechnet.
 *
 * ── DER FEHLER, DEN DAS BEHEBT (gemessen 2026-08-17) ────────────────────────
 * Vorher addierte `nextOccurrence` schlicht `7 * 86_400_000` Millisekunden.
 * Eine Woche hat aber nicht immer 168 Stunden: an der Zeitumstellung sind es
 * 167 oder 169. Eine wöchentliche Serie „dienstags 08:30 Hamburg" lief deshalb
 * ab dem 25.10.2026 still auf 07:30 weiter:
 *
 *     Woche  9  2026-10-20T06:30Z → 20.10. 08:30 Hamburg
 *     Woche 10  2026-10-27T06:30Z → 27.10. 07:30 Hamburg   ← Umstellung
 *
 * Niemand bekommt davon eine Meldung; der Termin steht einfach eine Stunde
 * früher da. Genau deshalb speichert der iCalendar-Standard (RFC 5545) bei
 * Wiederholungen NICHT UTC-Abstände, sondern Ortszeit + Zonen-Id.
 *
 * ── DIE REGEL ───────────────────────────────────────────────────────────────
 * Gerechnet wird auf der WANDUHR der Zone: Ortszeit lesen, Kalenderfeld
 * erhöhen (Tag bzw. Monat), Ortszeit zurück in einen Zeitpunkt übersetzen. Die
 * Uhrzeit bleibt damit über die Umstellung hinweg dieselbe — 08:30 bleibt
 * 08:30, und der UTC-Abstand ändert sich stattdessen, so wie es sein soll.
 *
 * Ohne Zone (`''`, Bestandsserien vor der Spalte `events.timezone`) fällt alles
 * auf UTC zurück. Das ist BEWUSST kein Rückfall auf das alte Verhalten mit
 * lokaler Server-Zeit: UTC kennt keine Umstellung, die Serie läuft also stabil
 * weiter — nur eben auf UTC-Wandzeit statt auf der des Veranstalters.
 */

/** Kalender-Felder eines Zeitpunkts IN einer Zone. */
interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const zoneOrUtc = (timezone: string): string => timezone || 'UTC'

/** Zeitpunkt → Wanduhr-Felder in `timezone`. */
export function wallClockIn(iso: string, timezone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneOrUtc(timezone),
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => Number(parts.find(p => p.type === type)!.value)
  // `hour12: false` liefert in manchen Laufzeiten 24 statt 0 für Mitternacht.
  const hour = get('hour') % 24
  return { year: get('year'), month: get('month'), day: get('day'), hour, minute: get('minute'), second: get('second') }
}

/**
 * Wanduhr-Felder → Zeitpunkt (ISO). Umgekehrte Richtung, und die ist der harte
 * Teil: aus „08:30 in Europe/Berlin" wird je nach Datum 06:30Z oder 07:30Z.
 *
 * Verfahren (Standard-Trick, ohne Zeitzonen-Bibliothek): den Wandzeit-Wert
 * zunächst als UTC lesen, das Ergebnis in der Zielzone formatieren, die
 * Abweichung messen und abziehen. Der zweite Durchgang fängt die Fälle ab, in
 * denen die erste Korrektur über eine Umstellungsgrenze springt.
 */
export function isoFromWallClock(wall: WallClock, timezone: string): string {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  let guess = asUtc
  for (let i = 0; i < 2; i++) {
    const seen = wallClockIn(new Date(guess).toISOString(), timezone)
    const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second)
    const drift = seenAsUtc - asUtc
    if (drift === 0) break
    guess -= drift
  }
  return new Date(guess).toISOString()
}

/**
 * Nächster Termin nach `startIso` gemäß `rule`, gerechnet in `timezone`.
 *
 * `monthly` behält den Monatstag und fällt in kürzeren Monaten auf den letzten
 * (31.01. → 28.02.) — unverändertes Verhalten, nur eben auf der Wanduhr.
 */
export function nextOccurrenceIn(startIso: string, rule: EventRecurrence, timezone: string): string {
  const wall = wallClockIn(startIso, timezone)

  if (rule === 'weekly' || rule === 'biweekly') {
    // Tagesarithmetik über UTC-Kalenderfelder: hier geht es nur um „welcher
    // Kalendertag", die Uhrzeit bleibt unangetastet und wird unten neu gesetzt.
    const shifted = new Date(Date.UTC(wall.year, wall.month - 1, wall.day + (rule === 'weekly' ? 7 : 14)))
    return isoFromWallClock({
      ...wall,
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    }, timezone)
  }

  const nextMonth = wall.month === 12 ? 1 : wall.month + 1
  const nextYear = wall.month === 12 ? wall.year + 1 : wall.year
  const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
  return isoFromWallClock({
    ...wall,
    year: nextYear,
    month: nextMonth,
    day: Math.min(wall.day, daysInNextMonth),
  }, timezone)
}
