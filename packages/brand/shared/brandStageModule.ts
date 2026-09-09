import type { BrandSlotType } from './slotRegistry'

/**
 * WELCHES MODUL ZEIGT DIE BÜHNE — UND ZU WELCHEM FELD? (Kailua-Befund 5,
 * Davids Entscheidung „Weg B", 2026-09-08).
 *
 * ── DER BEFUND, IN EINEM ABSATZ ───────────────────────────────────────────
 * Vier Sessions des Kapitels `context` (`a.pitch`, `a.category`,
 * `a.competitors`, `a.audienceSketch`) sind `derivation`/`stage-edit` — für
 * sie gibt es KEINE Katalog-Frage, `resolveNextSession` filtert sie über die
 * fragbaren Arbeitsformen heraus. Sie stehen aber ganz vorn in der Registry,
 * und `resolveActiveSession` nimmt beim Betreten des Kapitels die erste OFFENE
 * Session — also `a.pitch`. Die Bühne rechnete ihr Modul dagegen aus
 * `nextSlot`, und das war die erste offene FRAGE des Kapitels (`a.origin`).
 * Ergebnis: die Session hiess `a.pitch`, die Bühne fragte nach `a.origin`, und
 * der Entwurfs-Knopf des Feldes, auf dem der Mensch sass, war nirgends.
 *
 * ── DIE REGEL: DIE AKTIVE SESSION BEANSPRUCHT IHRE EIGENE BÜHNE ───────────
 * Bühnen-Frage = Session-Slot, nie ein fremder. Wer eine Session angesteuert
 * hat (oder von der Rangfolge dorthin gesetzt wurde), sieht das Modul GENAU
 * DIESES Feldes — die Katalog-Frage eines anderen Feldes ist dort ein
 * Themenwechsel, den niemand ausgelöst hat.
 *
 * ── WARUM DAS EINE PURE FUNKTION IST ──────────────────────────────────────
 * Dieselbe Begründung wie bei `brandSlotControls`: die Frage „welches Modul
 * gehört zu diesem Zustand" wird EINMAL beantwortet und ist danach prüfbar.
 * Als `v-if`-Kette im Markup war sie über `activeAwaitsConfirm`, `nextSlot`
 * und `stageModule` verteilt, und genau in der Naht dazwischen sass der
 * Befund. Pur heisst hier: kein Vue, kein i18n, keine Registry-Abfrage — die
 * Aufrufstelle reicht die fünf Tatsachen herein, die sie ohnehin schon hat.
 */

/**
 * GENAU EIN MODUL IST DRAN — die Bühne fragt nie zwei Dinge gleichzeitig.
 *
 * 'answer'  offene Menschenfrage → Beispiel-Link, geantwortet wird im Prompt
 * 'options' offene Auswahl       → volle Zeilen, „Übermitteln" unten rechts
 * 'draft'   George entwirft/hat entworfen → Nochmal · Korrigieren · Übernehmen
 * 'confirm' es steht ein Text, der nur noch bestätigt werden muss
 * 'gate'    alle Pflicht-Slots bestätigt → die Konfidenz-Weiche
 * 'none'    nichts offen und nichts zu bestätigen
 */
export type BrandStageModule = 'answer' | 'options' | 'draft' | 'confirm' | 'gate' | 'none'

/** Was die Bühne über die AKTIVE Session weiss — mehr braucht die Regel nicht. */
export interface BrandStageActiveSession {
  id: string
  /** `slot.type` aus der Registry: 'question'/'choice' sind Katalog-Fragen. */
  type: BrandSlotType
  /** `slotIsConfirmable(slot)` — der Paarvergleich (`special`) kennt keine Zustimmung. */
  confirmable: boolean
  /** `slot.generator !== 'none'` — es gibt einen Knopf, der dieses Feld füllen kann. */
  generatable: boolean
  /** `controls.showGenerate` — entwerfbar UND genug Material (Bereitschafts-Gate). */
  canGenerate: boolean
  /** Steht ein Text im Feld (lokal oder vom Server)? */
  hasValue: boolean
  confirmed: boolean
}

/**
 * DER ANSPRUCH DER AKTIVEN SESSION auf die Bühne. `null` heisst: sie erhebt
 * keinen — dann gilt unverändert die Grundfassung (nächste Katalog-Frage des
 * Kapitels, sonst das erste offene Pflicht-Feld).
 */
export interface BrandStageClaim {
  module: 'answer' | 'options' | 'draft' | 'confirm'
  /** Das Feld, dessen Frage/Karte die Bühne zeigt — immer die Session selbst. */
  slotId: string
}

/**
 * ── DIE VIER ZEILEN, UND WARUM JEDE SO HERUM STEHT ────────────────────────
 *
 * 1. EINE KATALOG-FRAGE MIT WERT GIBT DIE BÜHNE FREI. Sie ist beantwortet;
 *    danach ist die nächste offene Frage des Kapitels die ehrlichere Auskunft
 *    als eine Frage, die schon eine Antwort hat. (Unverändert das Verhalten
 *    von BW2 3c-i.)
 * 2. WER NICHTS BESTÄTIGEN KANN, BEANSPRUCHT NICHTS. `d.pairs` hat weder Feld
 *    noch Zustimmung — eine Karte mit „Übernehmen" wäre dort ein Knopf ohne
 *    Wirkung (Audit A4). Ebenso ein bereits bestätigtes Feld: dort ist
 *    „Korrigieren" die einzige Tür, und die hängt an der Karte, nicht an der
 *    Bühne.
 * 3. MIT WERT: das bisherige Verhalten (`activeAwaitsConfirm`) — Entwurfs-
 *    Modul, wo entworfen werden darf, sonst die reine Bestätigungs-Karte.
 * 4. LEER UND ENTWERFBAR: das NEUE (Weg B). Die Session hat einen Knopf, der
 *    sie füllen kann, also zeigt die Bühne ihn — mit Georges Frage zu diesem
 *    Feld und einem Eingabefeld, dessen Text als HINWEIS in den Entwurf geht.
 *    Der Deckel dagegen ist bewusst `generatable` und NICHT `canGenerate`:
 *    fehlt Material, gehört genau dieser Satz auf die Bühne
 *    (`showReadinessNote`) und nicht die Frage eines fremden Feldes.
 *
 * LEER UND NICHT ENTWERFBAR gibt die Bühne frei: die deterministisch
 * gerechneten Felder der Design-Kapitel (`h.ramp`, `i.scale`, `j.examples` …)
 * werden von den Panels DARÜBER gefüllt, und eine leere Karte mit einem
 * abgeschalteten Knopf hätte hier nichts anzubieten.
 */
export function brandStageClaim(active: BrandStageActiveSession | null): BrandStageClaim | null {
  if (!active) return null

  if (active.type === 'question' || active.type === 'choice') {
    if (active.hasValue) return null
    return { module: active.type === 'choice' ? 'options' : 'answer', slotId: active.id }
  }

  if (!active.confirmable || active.confirmed) return null
  if (active.hasValue) return { module: active.canGenerate ? 'draft' : 'confirm', slotId: active.id }
  return active.generatable ? { module: 'draft', slotId: active.id } : null
}

/**
 * ZEIGT DIE BÜHNE GERADE DAS ANTWORT-MODUL EINER ENTWURFS-SESSION? — der eine
 * Zustand, in dem der getippte Text NICHT in den Chat geht, sondern als
 * Hinweis in `generateSlot()`.
 *
 * Er hängt am LEEREN Feld und nicht am Modul allein: steht schon ein Entwurf
 * da, ist „Nochmal, mit Hinweis" der richtige Weg, und der hat sein eigenes
 * Ausklapp-Feld. Zwei gleichzeitig offene Hinweis-Zeilen wären zwei Felder für
 * dieselbe Eingabe.
 */
export function brandStageAwaitsDraftAnswer(claim: BrandStageClaim | null, hasValue: boolean): boolean {
  return claim?.module === 'draft' && !hasValue
}
