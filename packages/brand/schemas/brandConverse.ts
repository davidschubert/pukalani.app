import { z } from 'zod'
import { BRAND_UI_LOCALES } from '../shared/brandUiLocale'

/**
 * DER RUMPF EINES GESPRÄCHS-ZUGES (P3.2).
 *
 * ── WARUM DIE FRAGEN-WORTLAUTE AUS DEM CLIENT KOMMEN ──────────────────────
 * Die Fragen des Katalogs leben als i18n-Schlüssel (`brand.q.a.pitch`), und
 * i18n gibt es nur im Browser. Der Server kennt die REIHENFOLGE (Registry,
 * `resolveNextQuestion`), aber nicht den SATZ. Also schickt die Oberfläche
 * beides mit: die Frage, die gerade beantwortet wurde, und die, die sie als
 * nächste zeigt.
 *
 * DAS IST KEINE ÜBERGABE DER KONTROLLE. `nextSlotId` reist daneben, und die
 * Route prüft ihn gegen ihr EIGENES `resolveNextQuestion`: stimmt er nicht
 * überein, wird der Wortlaut verworfen und der Berater bekommt gesagt, dass er
 * keine Frage erfinden darf. Ein Client kann damit die REIHENFOLGE nicht
 * verbiegen — er kann nur den Satz beisteuern, den er ohnehin gerade anzeigt.
 *
 * ── `skipped` IST LOKALER ZUSTAND, UND ER MUSS MITREISEN ──────────────────
 * „Weiß ich nicht" überspringt eine Frage, ohne etwas zu speichern (Werkstatt:
 * `skipped`). Der Server sähe diesen Slot deshalb weiter als offen und käme auf
 * eine andere „nächste Frage" als die Oberfläche — nach jedem Überspringen
 * fiele der Berater in den Zweig „Wortlaut liegt nicht vor". Die Liste sagt nur
 * ab, sie ordnet nichts um.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * Kein `model`, keine `revision`, kein Slot-WERT. Ein Gesprächszug schreibt
 * nichts in einen Slot — die Antwort steht dort längst, über den normalen
 * Autosave, bevor dieser Aufruf überhaupt losgeht.
 */
export function createBrandConverseSchema() {
  return z.object({
    // Getrimmt VOR der Längenprüfung: ein Zug aus lauter Leerzeichen ist keiner.
    text: z.string().transform(value => value.trim()).pipe(z.string().min(1).max(2_000)),
    /** Der Frage-Slot, dessen Antwort das war. Eine FREIE Frage hat keinen. */
    slotId: z.string().min(1).max(64).optional(),
    /** Wortlaut dieser Frage, wie die Oberfläche ihn gezeigt hat. */
    question: z.string().max(400).optional(),
    /** Der Slot, dessen Frage die Oberfläche als nächste zeigt (wird geprüft). */
    nextSlotId: z.string().min(1).max(64).optional(),
    nextQuestion: z.string().max(400).optional(),
    /** Lokal übersprungene Slots dieses Bausteins (s. Kopf). */
    skipped: z.array(z.string().min(1).max(64)).max(40).optional(),
    // Wie bei der Generierung: nur BEKANNTE Sprachen, sonst fällt der Server
    // auf die Inhaltssprache zurück (`resolveBrandUiLocale`).
    uiLocale: z.enum(BRAND_UI_LOCALES).optional(),
    idempotencyKey: z.string().min(1).max(128).optional(),
  }).strict()
}

export type BrandConverseBody = z.infer<ReturnType<typeof createBrandConverseSchema>>
