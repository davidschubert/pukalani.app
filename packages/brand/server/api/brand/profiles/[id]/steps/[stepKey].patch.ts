import { createBrandStepSaveSchema } from '../../../../../../schemas/brandStep'
import {
  type BrandStepFacts,
  resolveBrandJourney,
  transitionBrandStep,
} from '../../../../../../shared/brandJourney'
import type { BrandStepSaveResponse } from '../../../../../../shared/types/brand'
import {
  BRAND_STEPS_TABLE,
  type BrandSlotRecord,
  brandDb,
  brandSlotRecordConfirmed,
  loadBrandStepContext,
  parseSlotRecords,
  profileFacts,
  resolveProfileProgress,
  serializeSlotRecords,
  toSlotFacts,
  toSlotViews,
  toStepFacts,
  touchProfile,
} from '../../../../../utils/brandStore'

/**
 * DER AUTOSAVE (§3e „Autosave-Client-Regel") — die meistgerufene Route des
 * Wizards. Sie speichert GEÄNDERTE Slots, nichts weiter.
 *
 * ── DREI DINGE, DIE MAN NICHT VEREINFACHEN DARF ───────────────────────────
 *
 * 1. **`revision` VOR ALLEM ANDEREN.** Der Client sendet die Fassung, die er
 *    gelesen hat. Passt sie nicht, antwortet die Route 409 UND legt die
 *    aktuelle Serverfassung bei — die UI bietet dann „Serverfassung laden"
 *    oder „Meine Fassung kopieren" an und überschreibt NIE automatisch. Das
 *    ist der Mehr-Tab- und der Stream-gegen-Editor-Konflikt: er wird
 *    abgewiesen, nicht still gewonnen.
 *
 * 2. **NO-OP SCHREIBT NICHT** (bodyToSave-Prinzip). Öffnen und Speichern ohne
 *    Tastendruck darf weder `revision` erhöhen noch `updatedAt` bewegen —
 *    sonst meldete jeder Autosave-Tick eine Bearbeitung, die niemand gemacht
 *    hat, und die 409-Erkennung würde zum Zufallsgenerator (jeder zweite Tab
 *    hätte immer eine veraltete Fassung).
 *
 * 3. **DER VERSIONS-VERTRAG WIRD GEPFLEGT, NICHT ÜBERSCHRIEBEN.** Der ERSTE
 *    Wert eines Slots bleibt für immer `firstDraft`, jede weitere Eingabe wird
 *    `latestDraft`, und `confirmed` ist der Wert, dem der Mensch zugestimmt
 *    hat. Aus dem Verhältnis dieser drei entstehen die beiden beschlossenen
 *    Übernahmequoten (Audit 2) — wer `firstDraft` beim Speichern mitzieht,
 *    macht beide unberechenbar.
 *
 * ── EIN BESTÄTIGTER SLOT IST ZU (Davids Entscheidung, 2026-09-02) ─────────
 * „Wenn confirmed müsste es unmöglich sein zu korrigieren, außer wir klicken
 * auf einen Button Korrigieren." Der Server ist die Durchsetzung davon: eine
 * WERT-Änderung an einem bestätigten Slot wird mit 409 `slot_confirmed`
 * abgewiesen. Vorher schrieb sie still einen neuen `latestDraft` NEBEN die
 * bestätigte Fassung — der Mensch sah einen Text, das Dokument
 * (`confirmedSlotValues`, die Grundlage jeder Veröffentlichung) trug einen
 * anderen, und niemand wurde je darauf hingewiesen.
 *
 * DAS AUFHEBEN IST DIE EINZIGE TÜR ZURÜCK und war schon immer da
 * (`confirmed: false` ⇒ `confirmed = null`); es fehlte nur der Knopf. Ein
 * Patch, der GLEICHZEITIG aufhebt und schreibt, bleibt deshalb erlaubt: er
 * geht durch dieselbe Tür, nur in einem Zug.
 *
 * ES IST KEIN NEUES FELD DARAUS GEWORDEN. `confirmed` trägt den bestätigten
 * TEXT (Versions-Vertrag, Schema-Anhang §2) und ist damit bereits die
 * vollständige Auskunft „bestätigt · und zwar dieser Wortlaut". Ein zusätzliches
 * `confirmedAt` wäre ein zweiter Ort für dieselbe Tatsache — und der erste, der
 * bei einer Migration danebenläuft.
 *
 * ── WAS DER SERVER HIER ERZWINGT ──────────────────────────────────────────
 * Eintritt (`canEnterBrandStep`, in `loadBrandStepContext`) · Zugehörigkeit
 * und Länge jedes Slots (Registry, im Schema) · die Bestätigungs-Sperre (s. o.)
 * · den Zustandsübergang `open → active` und die Konfidenz
 * (`transitionBrandStep`). Der Client schickt Text, keine Zustände.
 */

/** Die Ablehnungsgründe, die aus dem Schema kommen — sie reisen als `data.code`. */
const SCHEMA_CODES = new Set(['unknown_slot', 'slot_foreign', 'slot_too_long'])

export default defineEventHandler(async (event): Promise<BrandStepSaveResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow, stepRows, journey: enteredJourney } = await loadBrandStepContext(event, userId)

  // Bewusst `safeParse` statt `readValidatedBody`: die drei Registry-Gründe
  // sollen als `data.code` beim Client ankommen (createError-Regel), und ein
  // durchgereichter ZodError trüge nur eine Pfadliste.
  const parsed = createBrandStepSaveSchema(stepKey).safeParse(await readBody(event))
  if (!parsed.success) {
    const code = parsed.error.issues.map(issue => issue.message).find(message => SCHEMA_CODES.has(message))
    throw createError({
      status: 400,
      statusText: 'Invalid step payload',
      data: { code: code ?? 'invalid_body' },
    })
  }
  const body = parsed.data

  const records = parseSlotRecords(stepRow.slots)

  if (body.revision !== (stepRow.revision ?? 0)) {
    throw createError({
      status: 409,
      statusText: 'Brand step was changed elsewhere',
      data: {
        code: 'revision_conflict',
        revision: stepRow.revision ?? 0,
        slots: toSlotViews(records),
      },
    })
  }

  const now = new Date().toISOString()
  const next: Record<string, BrandSlotRecord> = { ...records }
  let slotsChanged = false

  for (const [slotId, patch] of Object.entries(body.slots)) {
    const before = records[slotId]
    const candidate: BrandSlotRecord = { ...before }

    // DIE SPERRE (s. Kopf). Sie steht VOR jeder Zuweisung: ein bestätigter
    // Slot darf seinen Text nur verlieren, wenn derselbe Patch die
    // Bestätigung aufhebt — „Korrigieren" ist die einzige Tür.
    if (brandSlotRecordConfirmed(before) && patch.value !== undefined && patch.confirmed !== false) {
      throw createError({
        status: 409,
        statusText: 'Slot is confirmed',
        data: { code: 'slot_confirmed' },
      })
    }

    if (patch.value !== undefined) {
      // Der erste Wert bleibt stehen — auch wenn er von George kam.
      if (candidate.firstDraft === undefined || candidate.firstDraft === null) {
        candidate.firstDraft = patch.value
      }
      candidate.latestDraft = patch.value
    }

    if (patch.confirmed === true) {
      const value = patch.value ?? candidate.latestDraft ?? candidate.firstDraft ?? ''
      if (!value) {
        // Einen leeren Slot zu bestätigen wäre ein Abschluss ohne Inhalt: der
        // Baustein gälte als fertig, im Dokument stünde nichts.
        throw createError({
          status: 400,
          statusText: 'Cannot confirm an empty slot',
          data: { code: 'slot_empty' },
        })
      }
      candidate.confirmed = value
    }
    else if (patch.confirmed === false) {
      candidate.confirmed = null
    }

    // Vergleich OHNE `updatedAt` — sonst wäre jede Speicherung per Definition
    // eine Änderung und die No-op-Regel wirkungslos.
    if (sameSlot(before, candidate)) continue
    candidate.updatedAt = now
    next[slotId] = candidate
    slotsChanged = true
  }

  // ── Zustand und Konfidenz über die pure Regel ────────────────────────────
  //
  // DER GERECHNETE ZUSTAND, NICHT DER ROHE (Davids Durchspiel-Audit
  // 2026-09-03): `open` ist kein gespeicherter Zustand — eine Zeile, deren
  // Vorgänger fertig wird, bleibt roh `locked`, und die Journey rechnet sie
  // `open`. Mit dem ROHEN Zustand übersprang der Start-Zweig solche
  // Bausteine (Tippen speicherte transitionslos), und `setConfidence`/
  // `complete` prallten mit `step_locked` ab: ein Kapitel nach einem
  // Vorgänger-Abschluss liess sich NIE abschliessen (live an Krume & Gold
  // pvm erwischt, 10/10 bestätigt und trotzdem 400). `canEnterBrandStep`
  // hat den Eintritt oben schon geprüft — was hier ankommt, ist auf dem Weg.
  // `skipped` kann hier nie ankommen (canEnterBrandStep hat oben abgewiesen)
  // — der Rückfall auf den Zeilen-Zustand hält nur den Typ ehrlich.
  const journeyState = enteredJourney.find(entry => entry.stepKey === stepKey)?.state
  const resolvedState = journeyState && journeyState !== 'skipped' ? journeyState : stepRow.state
  let facts: BrandStepFacts = {
    stepKey,
    state: resolvedState,
    confidence: stepRow.confidence ?? null,
    slots: toSlotFacts(next),
  }
  let stateChanged = false
  let confidenceChanged = false

  // Wer schreibt, arbeitet — ein `open` wird dadurch `active`. Ein `done`
  // bleibt `done`: Nacharbeit an einem abgeschlossenen Baustein ist erlaubt
  // (Regel §3b.2 „jeder ABGESCHLOSSENE Baustein änderbar") und öffnet ihn
  // nicht wieder; dafür gibt es `reopen`.
  if (facts.state === 'open' && (slotsChanged || body.confidence !== undefined)) {
    const started = transitionBrandStep(facts, { kind: 'start' })
    if (!started.ok) throw createError({ status: 400, statusText: 'Step transition rejected', data: { code: started.code } })
    facts = started.step
    stateChanged = started.changed
  }

  // „Nochmal von vorn" (C5): VOR der Konfidenz, damit sie auf dem wieder
  // geöffneten (`active`) Baustein gesetzt wird — Reihenfolge der Maschine.
  if (body.reopen) {
    const reopened = transitionBrandStep(facts, { kind: 'reopen' })
    if (!reopened.ok) throw createError({ status: 400, statusText: 'Step transition rejected', data: { code: reopened.code } })
    facts = reopened.step
    stateChanged = reopened.changed || stateChanged
  }

  if (body.confidence !== undefined) {
    const set = transitionBrandStep(facts, { kind: 'setConfidence', confidence: body.confidence })
    if (!set.ok) throw createError({ status: 400, statusText: 'Step transition rejected', data: { code: set.code } })
    facts = set.step
    confidenceChanged = set.changed
  }

  if (!slotsChanged && !stateChanged && !confidenceChanged) {
    // Nichts zu tun — und genau deshalb wird auch nichts geschrieben.
    return { revision: stepRow.revision ?? 0, slots: toSlotViews(records) }
  }

  const revision = (stepRow.revision ?? 0) + 1
  const { tablesDB, databaseId } = brandDb(event)
  try {
    await tablesDB.updateRow({
      databaseId,
      tableId: BRAND_STEPS_TABLE,
      rowId: stepRow.$id,
      data: {
        slots: serializeSlotRecords(next),
        revision,
        ...(stateChanged ? { state: facts.state } : {}),
        ...(confidenceChanged ? { confidence: facts.confidence } : {}),
        // Die ehrliche Zeitmessung beginnt beim ersten Schreibvorgang, nicht
        // beim Anlegen des Profils (§9b: die Zeitangaben werden daran
        // kalibriert).
        ...(stateChanged && !stepRow.startedAt ? { startedAt: now } : {}),
      },
    })
  }
  catch (error) {
    throw toH3Error(error, 'Brand step could not be saved')
  }

  // Der Fortschritts-Cache am Profil zieht mit. Er ist nie Autorität, steht
  // aber auf jeder Karte — eine Zahl, die einen Tag alt ist, liest sich wie
  // verlorene Arbeit.
  const mergedRows = stepRows.map(row => (row.$id === stepRow.$id
    ? { ...row, state: facts.state, confidence: facts.confidence ?? null, slots: JSON.stringify(next) }
    : row))
  const journey = resolveBrandJourney(profileFacts(profile), toStepFacts(mergedRows))
  const progress = resolveProfileProgress(journey)
  await touchProfile(event, profile.$id, {
    progressPct: progress.progressPct,
    currentStepKey: progress.currentStepKey,
  })

  return { revision, slots: toSlotViews(next) }
})

/** Gleichheit OHNE `updatedAt` (s. No-op-Regel im Kopf). */
function sameSlot(before: BrandSlotRecord | undefined, after: BrandSlotRecord): boolean {
  const strip = (record: BrandSlotRecord | undefined) => JSON.stringify({
    firstDraft: record?.firstDraft ?? null,
    latestDraft: record?.latestDraft ?? null,
    confirmed: record?.confirmed ?? null,
    confidence: record?.confidence ?? null,
  })
  return strip(before) === strip(after)
}
