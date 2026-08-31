import { z } from 'zod'
import { BRAND_CONFIDENCE_VALUES } from '../shared/brandJourney'
import { type BrandStepKey, slotById } from '../shared/slotRegistry'

/**
 * DER AUTOSAVE-RUMPF EINES BAUSTEINS (§3e „Autosave-Client-Regel").
 *
 * ── DIE REGISTRY IST DIE VALIDIERUNG ──────────────────────────────────────
 * `createBrandStepSaveSchema(stepKey)` ist eine FACTORY, weil die erlaubten
 * Schlüssel und ihre Längen vom Baustein abhängen: welche Slot-Ids es gibt,
 * welche davon zu DIESEM Baustein gehören und wie lang ihr Text sein darf,
 * steht in `shared/slotRegistry.ts` und nirgends sonst. Eine zweite Liste hier
 * wäre das „fünfte getrennte Regelwerk", das §3e ausdrücklich vermeidet.
 *
 * Drei Ablehnungen, drei Gründe (die Route hebt sie als `data.code` heraus):
 *   `unknown_slot`  — Id steht nicht im Katalog ODER ist deaktiviert
 *   `slot_foreign`  — Id gehört zu einem ANDEREN Baustein
 *   `slot_too_long` — Text über `slot.maxLength`
 *
 * Ein DEAKTIVIERTER Slot ist bewusst nicht schreibbar, aber weiterhin LESBAR
 * (`slotById` findet ihn): Bestandsdaten müssen angezeigt werden können, neue
 * dürfen nicht mehr entstehen (Migrationsvertrag).
 *
 * ── ZWEI FELDER JE SLOT, NICHT EIN NACKTER STRING ─────────────────────────
 * `{ value?, confirmed? }` statt `string`. Der Grund ist der Versions-Vertrag
 * (Schema-Anhang §2): ein Slot hat `firstDraft`, `latestDraft` UND `confirmed`
 * — „schreiben" und „bestätigen" sind zwei verschiedene Handlungen, und aus
 * ihrem Unterschied entstehen die beiden Übernahmequoten. Ein nackter String
 * könnte nur eine davon ausdrücken.
 *
 * ── `revision` IST PFLICHT ────────────────────────────────────────────────
 * Optimistische Nebenläufigkeit: der Client sendet die GELESENE Fassung, der
 * Server vergleicht und antwortet bei einer veralteten mit 409 (§3e: „bei 409
 * NIE automatisch überschreiben"). Optional wäre sie wertlos — wer sie
 * weglässt, bekäme die stille Überschreibung zurück, gegen die sie erfunden
 * wurde.
 */

export const brandSlotPatchSchema = z.object({
  /** Der neue Entwurfs-Text. `''` ist erlaubt (leeren). */
  value: z.string().optional(),
  /**
   * `true` bestätigt den aktuellen Stand (Wert aus `value`, sonst der zuletzt
   * gespeicherte Entwurf). `false` nimmt die Bestätigung zurück.
   */
  confirmed: z.boolean().optional(),
}).strict().refine(
  patch => patch.value !== undefined || patch.confirmed !== undefined,
  { message: 'brand.validation.emptySlotPatch' },
)

export function createBrandStepSaveSchema(stepKey: BrandStepKey) {
  return z.object({
    revision: z.number().int().min(0),
    slots: z.record(z.string(), brandSlotPatchSchema).default({}),
    /** Die Konfidenz-Weiche des BAUSTEINS (nicht die eines Slots). */
    confidence: z.enum(BRAND_CONFIDENCE_VALUES).optional(),
  }).strict().superRefine((body, ctx) => {
    for (const [slotId, patch] of Object.entries(body.slots)) {
      const slot = slotById(slotId)
      if (!slot || slot.deactivated) {
        ctx.addIssue({ code: 'custom', path: ['slots', slotId], message: 'unknown_slot' })
        continue
      }
      if (slot.stepId !== stepKey) {
        ctx.addIssue({ code: 'custom', path: ['slots', slotId], message: 'slot_foreign' })
        continue
      }
      if (patch.value !== undefined && patch.value.length > slot.maxLength) {
        ctx.addIssue({ code: 'custom', path: ['slots', slotId], message: 'slot_too_long' })
      }
    }
  })
}

/** Abschluss eines Bausteins — der Rumpf trägt nur die Konfidenz, falls sie fehlt. */
export function createBrandStepCompleteSchema() {
  return z.object({
    confidence: z.enum(BRAND_CONFIDENCE_VALUES).optional(),
  }).strict()
}
