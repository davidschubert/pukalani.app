import { slotById } from './slotRegistry'

/**
 * WAS DAS KONTO VERLASSEN DARF — PUR (BF1 §3a Nr. 7; eingelöst in MV1 M5).
 *
 * ── DIE ZUSAGE STAND, DIE PRÜFUNG FEHLTE ──────────────────────────────────
 * `BrandSessionConfig.sensitivity` trägt seit BF1 wörtlich den Satz „Was per
 * Share-Link und Export standardmässig NICHT reist" — vier Sessions stehen auf
 * `internal` (`a.competitors`, `a.complaints`, `a.challenge`, `a.facts`), und
 * `tests/slotRegistry.test.ts` begründet die Auswahl sogar namentlich:
 * „`a.competitors` nennt NAMENTLICH Dritte und zu jedem eine Schwäche — das
 * Erste, was ein Kunde nicht teilen will."
 *
 * GELESEN wurde das Feld bis MV1 M5 an genau zwei Stellen: beim Setzen des
 * Defaults und als Etikett in der Leseansicht. Der Veröffentlichen-Pfad
 * (`share.post.ts` → `confirmedSlotValues`) lief über ALLE bestätigten Slots
 * und fror die vier internen Sessions mit ein — dreissig Tage lang lesbar für
 * jeden, der den Token hat.
 *
 * Aufgefallen ist das beim Marktvergleich, und zwar an dessen eigenem
 * Massstab: Plan BRAND-MARKTVERGLEICH §2.9 Nr. 7 sagt die Vertraulichkeit der
 * Markt-Daten mit den Worten „vertraulich wie `a.competitors`" zu. Der Satz
 * hätte nichts bedeutet, solange `a.competitors` selbst mitreist — und die
 * Wettbewerber-NAMEN, die der Marktvergleich nie in einen Vorschlag lässt
 * (§ 6 UWG-Riegel), standen über diesen Umweg trotzdem in einem öffentlich
 * abrufbaren Schnappschuss.
 *
 * ── WARUM EINE EIGENE FUNKTION UND NICHT EIN FILTER IN `confirmedSlotValues` ─
 * `confirmedSlotValues` beantwortet die Frage „was hat dieser Mensch in diesem
 * Kapitel BESTÄTIGT?" — und die richtige Antwort darauf schliesst die internen
 * Sessions ein: die Werkstatt, die Kapitel-Abnahme und das Dokument zeigen sie
 * dem Eigentümer, und der market-Layer baut daraus das eigene Marktprofil
 * (mit seinem eigenen `publicOnly`-Filter obendrauf). Ein Filter IN dieser
 * Funktion hätte all das stillschweigend mitverändert. Diese Datei stellt die
 * ANDERE Frage — „was darf das Konto verlassen?" — und deshalb steht sie
 * daneben und nicht darin.
 *
 * ── FAIL-CLOSED ───────────────────────────────────────────────────────────
 * Ein Slot, den die Registry nicht kennt, reist NICHT. Das ist die teure
 * Richtung des Zweifels und hier die richtige: eine unbekannte Id kann eine
 * alte, eine getippte oder eine künftige sein, und von allen dreien weiss
 * niemand, was darin steht. Ein `deactivated`-Slot reist ebenfalls nicht — er
 * gehört nicht mehr zum Bauplan der Marke, also auch nicht in ihr Abbild.
 */

/** Ein bestätigter Wert, wie ihn `confirmedSlotValues` liefert. */
export interface BrandShareableSlotValue {
  readonly slotId: string
  readonly value: string
}

/**
 * Darf dieser Slot das Konto verlassen? Nur `sensitivity: 'public'` und nur
 * aktive, bekannte Slots (s. Kopf, „Fail-closed").
 */
export function isBrandSlotShareable(slotId: string): boolean {
  const slot = slotById(slotId)
  if (!slot || slot.deactivated) return false
  return slot.sensitivity === 'public'
}

/**
 * Die teilbaren Werte eines Kapitels. Die Reihenfolge bleibt, wie sie kam —
 * `confirmedSlotValues` sortiert bereits nach Katalog-Reihenfolge, und ein
 * zweites Sortieren hier wäre eine zweite Wahrheit über die Reihenfolge.
 */
export function brandShareableSlotValues<T extends BrandShareableSlotValue>(
  values: readonly T[],
): T[] {
  return values.filter(entry => isBrandSlotShareable(entry.slotId))
}
