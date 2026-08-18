/**
 * VORFAHRT „sichtbar schlägt away (fremder Mandant)" — seit 2026-08-18.
 *
 * DER VORFALL (live gemessen): die Plattform führt EINE Presence pro User
 * (presenceId = userId). Hat jemand die Dashboards ZWEIER Communities
 * gleichzeitig offen, sind das zwei Origins ohne jede Koordinationsmöglichkeit
 * im Browser — und beide Tabs schreiben dieselbe Zeile. Der versteckte Tab
 * (metadata.away = true, von der Browser-Drossel auf ~1×/Minute gebremst) stahl
 * dem sichtbaren Tab (20-s-Takt) regelmäßig den metadata.tenantId-Stempel; da
 * beide Leser fail-closed auf genau diesen Stempel filtern
 * (presenceFilter.ts / usePresence.ts), flackerte der Online-Zähler BEIDER
 * Communities zwischen 0 und 1.
 *
 * DIE REGEL: der Server ist der EINE Schiedsrichter — ein away-Schreiber weicht
 * einer FRISCHEN, SICHTBAREN Presence eines ANDEREN Mandanten. Sonst gilt
 * unverändert „letzter Schreiber gewinnt".
 *
 * Warum genau diese vier Bedingungen (jede einzeln begründet):
 *  - `existing.away === false` — away über away bleibt bewusst
 *    Letzter-gewinnt. Zwei versteckte Tabs, die sich gegenseitig blockieren,
 *    hießen im Grenzfall: die Presence stirbt (niemand verlängert die Expiry).
 *    Der Preis ist gering, weil BEIDE Seiten ohnehin denselben away-Badge
 *    zeigen — nur der Stempel wandert.
 *  - VERSCHIEDENER Mandant — beim GLEICHEN Mandanten kann es das Problem gar
 *    nicht geben: der Stempel ist derselbe, es flackerte höchstens der Badge
 *    zweier Tabs derselben Community (Kosmetik). Wichtiger: hat der User NUR
 *    EINEN Tab, trägt seine eigene letzte non-away-Presence denselben Stempel —
 *    eine Sperre hier würde seine away-Meldung dauerhaft verschlucken.
 *  - FRISCH (< PRESENCE_VISIBLE_FRESH_MS) — ist der sichtbare Tab abgestürzt,
 *    darf sein Stempel nicht ewig gelten; nach dem Fenster übernimmt der
 *    away-Tab und hält den User wenigstens in SEINER Community sichtbar.
 *  - `updatedAt` vorhanden — ohne Zeitstempel ist „frisch" nicht entscheidbar,
 *    also kein Vorrang (fail-open zum Alt-Verhalten).
 *
 * DIE KONSTANTEN-KETTE (jede Stufe muss echt größer sein als die davor):
 *   PRESENCE_VISIBLE_FRESH_MS (60 s, hier)
 *     < FRESH_MS (180 s, app/composables/usePresence.ts — „online jetzt")
 *     < PRESENCE_TTL_MS (240 s, server/api/presence/heartbeat.post.ts — Expiry).
 * 60 s = drei verpasste 20-s-Heartbeats des sichtbaren Tabs: wer so lange
 * schweigt, ist weg (Absturz), nicht bloß langsam. Der Vorrang endet also
 * DEUTLICH bevor ein Leser die Presence überhaupt als veraltet ausblenden würde.
 */
export const PRESENCE_VISIBLE_FRESH_MS = 60_000

export interface PresencePrioritySnapshot {
  /** ISO-Zeitpunkt der letzten Aktualisierung ($updatedAt der Presence). */
  updatedAt?: string
  /** Trug der letzte Schreiber `metadata.away === true`? */
  away: boolean
  /** `metadata.tenantId` — '' = tenantloser Kontroll-Host / Silo. */
  tenantId: string
}

/**
 * Weicht ein away-Schreiber der bestehenden Presence?
 *
 * `existing` = der aktuell gespeicherte Zustand (null = es gibt keinen),
 * `writerTenantId` = der Mandanten-Stempel DES SCHREIBERS ('' = tenantlos),
 * `now` = Date.now() (Argument, damit die Regel pur und testbar bleibt).
 *
 * true heißt: NICHT schreiben. Der sichtbare Tab des anderen Mandanten
 * verlängert die Expiry alle 20 s selbst — es geht nichts verloren.
 */
export function yieldsToForeignVisiblePresence(
  existing: PresencePrioritySnapshot | null,
  writerTenantId: string,
  now: number,
): boolean {
  if (!existing) return false
  if (existing.away) return false
  // ''-Normalisierung auf BEIDEN Seiten: ein tenantloser Kontroll-Host und ein
  // Mandant sind verschieden, zwei tenantlose Hosts sind gleich.
  if ((existing.tenantId || '') === (writerTenantId || '')) return false
  if (!existing.updatedAt) return false
  const age = now - Date.parse(existing.updatedAt)
  // NaN (unlesbarer Zeitstempel) fällt hier durch beide Vergleiche → false,
  // also Alt-Verhalten. Genau an der Grenze gilt „stale" (>= ist abgelaufen).
  return age < PRESENCE_VISIBLE_FRESH_MS
}
