/**
 * Die Reihenfolge der Kategorien per Ziehen/Pfeiltasten — was dabei
 * tatsächlich geschrieben wird.
 *
 * PURE und unit-getestet, aus demselben Grund wie `categoryPatch.ts`: die
 * Regel ist klein, aber jede ihrer drei Zusagen ist eine, die man beim
 * Nachbauen leicht anders trifft.
 *
 * (1) DIE LISTE MUSS VOLLSTÄNDIG SEIN. Eine Reihenfolge ist eine Aussage über
 *     ALLE Kategorien; eine Teilliste („die drei, die ich gerade sehe") ließe
 *     offen, wohin der Rest gehört. Fehlt eine Id oder kommt eine unbekannte
 *     mit, ist das kein Tippfehler, sondern ein veralteter Stand — jemand hat
 *     nebenan angelegt oder gelöscht, seit die Seite geladen wurde. Antwort
 *     darauf ist `order_stale`, damit die Oberfläche neu laden kann, statt
 *     eine halbe Ordnung festzuschreiben.
 *
 * (2) GESCHRIEBEN WIRD NUR, WAS SICH ÄNDERT. Jeder Schreibvorgang bewegt
 *     `$updatedAt` und veröffentlicht ein Realtime-Ereignis; ein Zug, der drei
 *     Zeilen verschiebt, darf nicht alle hundert anfassen.
 *
 * (3) DIE ZAHLEN WERDEN NEU VERGEBEN (0, 1, 2, …), nicht fortgeschrieben.
 *     Lücken und Doppelungen aus der Zeit des Zahlenfeldes verschwinden damit
 *     beim ersten Zug von selbst; `sortOrder` bleibt in seinem Wertebereich
 *     (0–9999), weil es nie mehr Kategorien als MAX_CATEGORIES gibt.
 */

export interface CategoryOrderRow {
  $id: string
  sortOrder: number
}

/** Eine geschriebene Zeile: Id und ihre neue Position. */
export interface CategoryOrderEntry {
  id: string
  sortOrder: number
}

export type CategoryOrderPlan =
  | { ok: true, writes: CategoryOrderEntry[], order: CategoryOrderEntry[] }
  | { ok: false, reason: 'order_stale' }

/**
 * Aus „so sollen sie stehen" wird „das muss geschrieben werden".
 *
 * `order` ist die vollständige neue Ordnung (auch die unveränderten Zeilen) —
 * die Antwort der Route, damit die Oberfläche ihren Stand übernehmen kann,
 * statt ihn sich zusammenzureimen.
 */
export function planCategoryOrder(rows: CategoryOrderRow[], ids: string[]): CategoryOrderPlan {
  const known = new Set(rows.map(row => row.$id))
  const wanted = new Set(ids)

  // Doppelungen fallen hier mit heraus: ein doppelter Eintrag macht die Menge
  // kleiner als die Liste.
  if (wanted.size !== ids.length) return { ok: false, reason: 'order_stale' }
  if (wanted.size !== known.size) return { ok: false, reason: 'order_stale' }
  for (const id of ids) {
    if (!known.has(id)) return { ok: false, reason: 'order_stale' }
  }

  const current = new Map(rows.map(row => [row.$id, row.sortOrder]))
  const order: CategoryOrderEntry[] = ids.map((id, index) => ({ id, sortOrder: index }))
  const writes = order.filter(entry => current.get(entry.id) !== entry.sortOrder)
  return { ok: true, writes, order }
}
