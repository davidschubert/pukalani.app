import { createBrandStepCompleteSchema } from '../../../../../../../schemas/brandStep'
import {
  type BrandStepFacts,
  resolveBrandJourney,
  transitionBrandStep,
} from '../../../../../../../shared/brandJourney'
import type { BrandStepCompleteResponse } from '../../../../../../../shared/types/brand'
import {
  BRAND_STEPS_TABLE,
  brandDb,
  loadBrandStepContext,
  parseSlotRecords,
  profileFacts,
  resolveProfileProgress,
  toSlotFacts,
  toStepFacts,
  touchProfile,
} from '../../../../../../utils/brandStore'
import { recordBrandEvent } from '../../../../../../utils/brandEvents'

/**
 * EINEN BAUSTEIN ABSCHLIESSEN — der STRENGE Weg der Zustandsmaschine.
 *
 * ── LESEN IST NACHSICHTIG, SCHREIBEN IST STRENG ───────────────────────────
 * `resolveBrandJourney` stuft ein gespeichertes `done` nie zurück, auch wenn
 * der Katalog inzwischen einen Pflicht-Slot mehr kennt (Migrationsvertrag
 * §3e). HIER dagegen wird jeder Pflicht-Slot BESTÄTIGT verlangt und eine
 * gesetzte Konfidenz — sonst wäre der Abschluss billiger als das, was er
 * behauptet. Die Umkehrung (streng beim Lesen) nähme Bestandskunden mit jedem
 * Katalog-Update ihren fertigen Baustein weg.
 *
 * ── DIE REGEL STEHT NICHT HIER ────────────────────────────────────────────
 * `transitionBrandStep(step, { kind: 'complete' })` entscheidet; diese Route
 * führt aus. Deshalb kommt aus der Ablehnung auch eine LISTE (`missing`) — die
 * Oberfläche kann genau die fehlenden Slots markieren, statt „irgendwas fehlt"
 * zu sagen.
 *
 * ── DER NACHFOLGER GEHT VON SELBST AUF ────────────────────────────────────
 * Es wird keine zweite Zeile geschrieben, um den nächsten Baustein zu öffnen:
 * `open` ist kein gespeicherter Zustand, sondern das Ergebnis von „Vorgänger
 * ist `done`". Die Antwort trägt die neu gerechnete Journey — die Leiste
 * springt daraufhin weiter, ohne dass irgendwo ein zweiter Zustand entstünde,
 * der später widersprechen könnte.
 */
export default defineEventHandler(async (event): Promise<BrandStepCompleteResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow, stepRows } = await loadBrandStepContext(event, userId)
  const body = await readValidatedBody(event, createBrandStepCompleteSchema().parse)

  let facts: BrandStepFacts = {
    stepKey,
    state: stepRow.state,
    confidence: stepRow.confidence ?? null,
    slots: toSlotFacts(parseSlotRecords(stepRow.slots)),
  }

  // Ein Baustein, dessen Slots über den Generierungs-Weg gefüllt wurden, kann
  // noch `open` stehen. Abschliessen heisst dann: betreten und abschliessen —
  // die Reihenfolge der Regel bleibt gewahrt, der Mensch braucht dafür keinen
  // zusätzlichen Klick.
  if (facts.state === 'open') {
    const started = transitionBrandStep(facts, { kind: 'start' })
    if (!started.ok) throw createError({ status: 400, statusText: 'Step transition rejected', data: { code: started.code } })
    facts = started.step
  }

  if (body.confidence !== undefined) {
    const set = transitionBrandStep(facts, { kind: 'setConfidence', confidence: body.confidence })
    if (!set.ok) throw createError({ status: 400, statusText: 'Step transition rejected', data: { code: set.code } })
    facts = set.step
  }

  const done = transitionBrandStep(facts, { kind: 'complete' })
  if (!done.ok) {
    throw createError({
      status: 400,
      statusText: 'Brand step cannot be completed yet',
      // `missing` steht NEBEN `code`: den Grund hebt der zentrale Handler als
      // `reason` heraus, die Liste bleibt für die Oberfläche in `data`.
      data: { code: done.code, missing: done.missing ?? [] },
    })
  }
  facts = done.step

  const now = new Date().toISOString()
  const { tablesDB, databaseId } = brandDb(event)
  try {
    await tablesDB.updateRow({
      databaseId,
      tableId: BRAND_STEPS_TABLE,
      rowId: stepRow.$id,
      data: {
        state: 'done',
        confidence: facts.confidence,
        completedAt: now,
        revision: (stepRow.revision ?? 0) + 1,
        ...(stepRow.startedAt ? {} : { startedAt: now }),
      },
    })
  }
  catch (error) {
    throw toH3Error(error, 'Brand step could not be completed')
  }

  const mergedRows = stepRows.map(row => (row.$id === stepRow.$id
    ? { ...row, state: 'done' as const, confidence: facts.confidence ?? null }
    : row))
  const journey = resolveBrandJourney(profileFacts(profile), toStepFacts(mergedRows))
  const progress = resolveProfileProgress(journey)
  await touchProfile(event, profile.$id, {
    progressPct: progress.progressPct,
    currentStepKey: progress.currentStepKey,
  })

  await recordBrandEvent(event, {
    type: 'step.completed',
    profileId: profile.$id,
    userId,
    // Kennzahlen: welcher Baustein, wie sicher, wie lange, wie weit insgesamt.
    // Kein Slot-Text, kein Titel.
    payload: {
      stepKey,
      confidence: facts.confidence ?? '',
      activeSeconds: stepRow.activeSeconds ?? 0,
      progressPct: progress.progressPct,
    },
  })

  return {
    stepKey,
    storedState: 'done',
    journey: [...journey],
    progressPct: progress.progressPct,
    currentStepKey: progress.currentStepKey,
  }
})
