import type { BrandStepDetailResponse } from '../../../../../../shared/types/brand'
import {
  loadBrandStepContext,
  parseGenerations,
  parseSlotRecords,
  toSlotViews,
} from '../../../../../utils/brandStore'

/**
 * EINEN BAUSTEIN ÖFFNEN — Slots, Zustand, Fortschritt.
 *
 * ── GENERATIONEN: METADATEN, KEINE INHALTE ────────────────────────────────
 * `generations` trägt je Eintrag `generationId`, Schema-/Prompt-Version,
 * Modell, Anbieter, Sprache, `inputHash` und Zeitpunkt — nie den erzeugten
 * Text (Log-Regel Plan §6, Schema-Anhang §2). Der TEXT lebt in den Slots
 * (`firstDraft`/`latestDraft`) und in `brand_messages`; die Generations-Liste
 * beantwortet „wie kam das zustande?", nicht „was steht da?".
 *
 * ── `missingRequired` KOMMT AUS DER JOURNEY ───────────────────────────────
 * Also aus derselben Rechnung, die auch der Abschluss benutzt. Ein eigener
 * Durchlauf hier wäre die zweite Wahrheit, an der Lesen und Schreiben
 * auseinanderlaufen: der Baustein zeigte „nichts fehlt" und `complete`
 * antwortete `required_slots_missing`.
 *
 * ── LESEN IST NACHSICHTIG ─────────────────────────────────────────────────
 * Ein neu hinzugekommener Pflicht-Slot taucht in `missingRequired` auf, wirft
 * einen abgeschlossenen Baustein aber nicht zurück (Migrationsvertrag §3e).
 * Streng ist erst der Schreibweg.
 */
export default defineEventHandler(async (event): Promise<BrandStepDetailResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { stepKey, stepRow, journey } = await loadBrandStepContext(event, userId)

  const step = journey.find(entry => entry.stepKey === stepKey)!

  return {
    profileId: stepRow.profileId,
    stepKey,
    storedState: stepRow.state,
    revision: stepRow.revision ?? 0,
    confidence: stepRow.confidence ?? null,
    inputHash: stepRow.inputHash ?? '',
    startedAt: stepRow.startedAt ?? null,
    completedAt: stepRow.completedAt ?? null,
    activeSeconds: stepRow.activeSeconds ?? 0,
    slots: toSlotViews(parseSlotRecords(stepRow.slots)),
    generations: parseGenerations(stepRow.generations),
    progress: step.progress,
    missingRequired: [...step.missingRequired],
  }
})
