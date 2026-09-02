import {
  brandChoiceContract,
  brandChoiceFallbackQuestion,
  checkBrandChoiceDraft,
} from '../../shared/brandChoiceOptions'
import { type AdvisorSlotVerdict, createAdvisorSlotGenerator } from '../utils/advisorGenerator'
import type { BrandSlotGenerator } from '../utils/brandGenerators'
import { registerBrandSlotGenerator } from '../utils/brandGenerators'
import { VERA_PROMPT_VERSION, veraSlotInstruction } from '../utils/veraPrompt'

/**
 * VERA WITTERUNG (P3.1) — Bausteine B (Purpose · Vision · Mission +
 * Positionierung) und B2 (Markenarchitektur).
 *
 * ── EIN GENERATOR, ZWEI BAUSTEINE, EIN BERATER ────────────────────────────
 * `advisorForStep()` ordnet Vera in `brandAdvisors.ts` beide Bausteine zu, und
 * die Fabrik fragt genau diese Registry — die Registrierung hier muss also
 * nichts über Personen sagen, nur über Zuständigkeit. Zwei Aufrufe statt eines
 * Wildcard-Eintrags, weil `'*'` auch jeden künftigen Baustein einfinge und dort
 * mit einem „Kein Vera-Auftrag für Slot …" scheiterte, statt ihn dem Dev-Stub
 * bzw. `no_generator` zu überlassen.
 *
 * ── DIE AUSWAHL-NACHPRÜFUNG IST DER GRUND FÜR `verify` ────────────────────
 * `b.positioningCategory` und `b2.model` sind `choice`-Slots: ihr Feldwert wird
 * später zu Chips bzw. Karten. Ein Modell, das dort einen Absatz oder ein
 * fünftes, erfundenes Architektur-Modell hinschreibt, erzeugt keinen sichtbaren
 * Fehler — es erzeugt einen Wert, den man im Brand-Dokument nicht mehr von
 * einem gültigen unterscheiden kann. Deshalb prüft der Generator ihn gegen den
 * geteilten Vertrag (`brandChoiceOptions.ts`), normalisiert ihn auf die stabile
 * Id und macht aus einem Verstoss eine RÜCKFRAGE — nie einen kaputten Entwurf.
 *
 * Die Rückfrage ist die richtige Antwort und nicht bloss die sichere: ein
 * Modell, das die legale Menge verfehlt, hat in aller Regel zu wenig Material
 * gehabt, nicht zu wenig Willen. Genau dafür gibt es `outcome: 'question'`.
 */

export function verifyVeraChoice(input: {
  slot: { id: string }
  draft: string
  uiLocale: string
}): AdvisorSlotVerdict {
  const contract = brandChoiceContract(input.slot.id)
  if (!contract) return { draft: input.draft }

  const check = checkBrandChoiceDraft(contract, input.draft)
  return check.ok
    ? { draft: check.value }
    : { question: brandChoiceFallbackQuestion(contract, input.uiLocale) }
}

/** Veras Generator für die Bausteine B und B2. */
export const veraStrategyGenerator: BrandSlotGenerator = createAdvisorSlotGenerator({
  promptVersion: VERA_PROMPT_VERSION,
  instruction: veraSlotInstruction,
  verify: verifyVeraChoice,
})

export default defineNitroPlugin(() => {
  registerBrandSlotGenerator('pvm', veraStrategyGenerator)
  registerBrandSlotGenerator('architecture', veraStrategyGenerator)
})
