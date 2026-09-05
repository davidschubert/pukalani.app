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
    /**
     * „Nochmal von vorn" auf einem ABGESCHLOSSENEN Baustein (C5): öffnet ihn
     * wieder (`done → active`, pure Transition `reopen` — Slots und Konfidenz
     * bleiben stehen, nichts propagiert). Auf jedem anderen Zustand lehnt die
     * Transition mit `not_done` ab.
     */
    reopen: z.boolean().optional(),
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

/**
 * ABNEHMEN UND VERTAGEN (Plan §5a) — zwei eigene Rümpfe, nicht zwei Felder im
 * Autosave.
 *
 * ── WARUM EIGENE ROUTEN UND KEINE PATCH-FELDER ────────────────────────────
 * Der Autosave-PATCH ist ein SPEICHER-Rumpf: „hier ist Text, hier ist eine
 * Bestätigung". Abnehmen und Vertagen sind HANDLUNGEN auf einer anderen Seite,
 * mit anderer Ablehnung (`not_confirmed`, `defer_not_allowed`) und ohne einen
 * einzigen Buchstaben Inhalt. Als Felder im Autosave-Rumpf reisten sie bei
 * jedem Tastendruck mit — und die No-op-Regel („Speichern ohne Änderung
 * erhöht keine `revision`") müsste plötzlich zwei Arten von Änderung
 * auseinanderhalten. Die Routen liegen unter `sessions/<slotId>/`, dieselbe
 * Form, die der Plan für `impact` und `close` vorsieht (§7/§9).
 *
 * `revision` ist auch hier PFLICHT: die Abnahme-Seite liest denselben Stand
 * wie die Werkstatt, und ein zweiter Tab darf ihn nicht still überholen.
 */
export function createBrandSessionAcceptSchema() {
  return z.object({
    revision: z.number().int().min(0),
  }).strict()
}

export function createBrandSessionDeferSchema() {
  return z.object({
    revision: z.number().int().min(0),
    /** `false` nimmt das Vertagen zurück. Fehlt es, ist „vertagen" gemeint. */
    deferred: z.boolean().default(true),
  }).strict()
}

/**
 * „NOCHMAL VON VORN" (§5a) — der einzige löschende Rumpf des Wizards.
 *
 * Der SERVER prüft nicht das getippte Wort („bestätigen"): das ist Reibung
 * gegen den Fehlklick und gehört der Oberfläche. Er prüft `acknowledge` UND
 * den `impactAck` — den Hash über genau die Hülle, die dem Menschen gezeigt
 * wurde. Passt er nicht, hat sich seither etwas bewegt, und der Layer muss
 * neu zeigen, bevor jemand löscht.
 */
export function createBrandStepRestartSchema() {
  return z.object({
    revision: z.number().int().min(0),
    acknowledge: z.boolean(),
    impactAck: z.string().min(1).max(128),
  }).strict()
}
