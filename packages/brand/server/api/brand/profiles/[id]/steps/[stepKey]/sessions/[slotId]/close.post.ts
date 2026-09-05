import { createBrandSessionCloseSchema } from '../../../../../../../../../schemas/brandReview'
import type { BrandReviewStage } from '../../../../../../../../../shared/brandFindings'
import { pickNextSession } from '../../../../../../../../../shared/brandJourney'
import { slotsForStep } from '../../../../../../../../../shared/slotRegistry'
import type {
  BrandFindingView,
  BrandSessionCloseResponse,
  BrandSessionReview,
} from '../../../../../../../../../shared/types/brand'
import {
  loadBrandAcceptanceContext,
  requireSessionParam,
  withStepSlotFacts,
} from '../../../../../../../../utils/brandAcceptance'
import {
  listBrandFindings,
  toBrandFindingView,
  writeBrandFindings,
} from '../../../../../../../../utils/brandFindingsStore'
import { loadBrandConversationHistory } from '../../../../../../../../utils/brandConversationHistory'
import { BRAND_REVIEW_EMPTY, runBrandSessionReview } from '../../../../../../../../utils/brandReview'
import {
  brandReviewChapter,
  brandReviewDocument,
  brandReviewNotes,
  brandReviewOpenSessions,
  brandReviewSessionInfo,
} from '../../../../../../../../utils/brandReviewInputs'
import {
  BRAND_STEPS_TABLE,
  type BrandSlotRecord,
  brandDb,
  brandSlotRecordConfirmed,
  mergeStepSlotRecords,
  profileFacts,
  resolveBrandSessionStates,
  serializeSlotRecords,
} from '../../../../../../../../utils/brandStore'

/**
 * DER SPEZIALIST BEIM SCHLIESSEN (BW2 Paket 4, Plan §7) — EIN Aufruf je
 * bestätigter Session.
 *
 * ── ER IST DIE ZWEITE HÄLFTE DES BESTÄTIGENS, NICHT SEIN TÜRSTEHER ────────
 * Bestätigt wird im Autosave-PATCH; diese Route läuft DANACH und ändert an der
 * Bestätigung nichts. `goalReached: false` sperrt nichts, ein Konflikt sperrt
 * nichts, ein Ausfall des Anbieters sperrt nichts (§7). Was sie hinterlässt,
 * sind vier Dinge: das Urteil und die Notizen an der Session, die Befunde in
 * ihrer eigenen Tabelle, die Marke `reviewed` für den Prüfblick — und den
 * Wegweiser, der den Auto-Weiter beweglich macht.
 *
 * Ein Spezialist, der Bestätigungen abweisen könnte, wäre ein zweiter
 * Schreibweg neben `transitionBrandStep`; genau das ist er nicht.
 *
 * ── IDEMPOTENT, UND ZWAR AUS KOSTENGRÜNDEN ───────────────────────────────
 * Der Client ruft die Route im Hintergrund nach jedem Bestätigen. Ein Retry,
 * ein zweiter Tab oder ein „Korrigieren-und-wieder-Bestätigen" ohne Änderung
 * dürfen nicht ein zweites Mal bezahlt werden: ist die Session schon geprüft
 * (`slots[id].reviewed`), antwortet die Route mit dem GESPEICHERTEN Urteil und
 * ohne einen einzigen Anbieter-Aufruf. `force` ist der ausdrückliche Gegenweg
 * und wird vom Client nie geschickt.
 *
 * ── 409 `not_confirmed`, NICHT 400 ───────────────────────────────────────
 * Was hier geprüft wird, ist ein BESTÄTIGTER Wert. Fehlt er, ist das kein
 * kaputter Rumpf, sondern ein Konflikt mit dem Serverstand — dieselbe Familie
 * wie `revision_conflict` und dieselbe Antwort wie beim Abnehmen: die
 * Oberfläche lädt neu, statt einen Eingabefehler zu melden, den niemand
 * gemacht hat.
 *
 * ── FAIL-SOFT SCHREIBT GAR NICHTS ────────────────────────────────────────
 * Kein Urteil heisst: keine Zeile bewegt, keine `revision` erhöht, `reviewed:
 * false` in der Antwort. Ein gespeichertes `reviewed: false` wäre die dritte
 * Auskunft neben „nicht da" und „true" — und der Prüfblick (§10) sucht genau
 * die Sessions OHNE Marke.
 */
export default defineEventHandler(async (event): Promise<BrandSessionCloseResponse> => {
  const { userId } = await requireBrandAccess(event)
  const context = await loadBrandAcceptanceContext(event, userId)
  const { profile, stepKey, stepRow, stepRows, records, stepFacts } = context
  const body = await readValidatedBody(event, createBrandSessionCloseSchema().parse)

  const session = requireSessionParam(event, stepKey)

  const revision = stepRow.revision ?? 0
  if (body.revision !== revision) {
    throw createError({
      status: 409,
      statusText: 'Brand step was changed elsewhere',
      data: { code: 'revision_conflict', revision },
    })
  }

  const record = records[session.id]
  if (!brandSlotRecordConfirmed(record)) {
    throw createError({
      status: 409,
      statusText: 'Session is not confirmed',
      data: { code: 'not_confirmed' },
    })
  }

  const contentLocale = profile.contentLocale
  const pathKind = profileFacts(profile).pathKind
  const stepSlotIds = slotsForStep(stepKey).map(entry => entry.id)

  /** Die offenen Befunde, an denen ein Feld DIESES Kapitels beteiligt ist. */
  async function chapterFindings(): Promise<BrandFindingView[]> {
    const rows = await listBrandFindings(event, profile.$id, 'open')
    const views = rows.map(toBrandFindingView)
    const own = new Set(stepSlotIds)
    return views.filter(view => view.slots.some(slotId => own.has(slotId)))
  }

  /** Der Wegweiser — der geprüfte Vorschlag, sonst die Grundfassung (§6). */
  function nextStop(
    nextRecords: Record<string, BrandSlotRecord>,
    suggestion: string | null,
  ) {
    const afterFacts = withStepSlotFacts(stepFacts, stepKey, nextRecords)
    return pickNextSession(
      stepKey,
      {
        slots: afterFacts.find(entry => entry.stepKey === stepKey)?.slots ?? {},
        sessions: resolveBrandSessionStates(profileFacts(profile), afterFacts),
      },
      suggestion,
    )
  }

  // ── Schon geprüft? Dann kostet dieser Aufruf nichts (s. Kopf). ───────────
  if (record?.reviewed && !body.force) {
    const stored: BrandSessionReview = {
      goalReached: record.review?.goalReached ?? true,
      missing: [...(record.review?.missing ?? [])],
      notes: record.notes ? record.notes.split('\n').filter(Boolean) : [],
      // Die BEFUNDE stehen in ihrer eigenen Tabelle und werden dort gelesen —
      // sie im Slot-Datensatz zu spiegeln wären zwei Wahrheiten über einen
      // Zustand, den ein Mensch inzwischen geändert haben kann.
      findings: [],
      nextSession: record.nextSession ?? null,
    }
    return {
      stepKey,
      sessionKey: session.id,
      review: stored,
      findings: await chapterFindings(),
      next: nextStop(records, stored.nextSession),
      revision,
      reviewed: true,
      reviewedBy: (record.review?.reviewedBy === 'stage2' ? 'stage2' : 'stage1') satisfies BrandReviewStage,
    }
  }

  // ── Die Eingaben (§7): Config, Wert, Verlauf, Dokument, Notizen ─────────
  const allRecords = mergeStepSlotRecords(stepRows)
  const outcome = await runBrandSessionReview({
    event,
    userId,
    profileId: profile.$id,
    mode: 'session',
    stepKey,
    session: brandReviewSessionInfo(session, contentLocale, pathKind),
    value: record?.confirmed ?? '',
    history: await loadBrandConversationHistory(
      event, profile.$id, stepKey, session.id, stepRow.restartedAt,
    ),
    document: brandReviewDocument(allRecords, contentLocale, pathKind),
    chapter: brandReviewChapter(allRecords, stepKey, contentLocale, pathKind),
    notes: brandReviewNotes(records, stepKey, contentLocale, pathKind),
    openSessions: brandReviewOpenSessions(stepKey, context.sessionStates, contentLocale, pathKind),
    // Nur wirksam, solange der Ersatz-Spezialist läuft (Beweis-Schalter).
    stubFinding: String(getQuery(event).stub ?? '') === 'conflict',
  })

  if (!outcome.reviewed) {
    // FAIL-SOFT: nichts geschrieben, nichts erhöht (s. Kopf).
    return {
      stepKey,
      sessionKey: session.id,
      review: BRAND_REVIEW_EMPTY,
      findings: await chapterFindings(),
      next: nextStop(records, null),
      revision,
      reviewed: false,
      reviewedBy: null,
    }
  }

  const review = outcome.review
  const nextRecords: Record<string, BrandSlotRecord> = {
    ...records,
    [session.id]: {
      ...record,
      reviewed: true,
      review: {
        goalReached: review.goalReached,
        missing: [...review.missing],
        reviewedBy: outcome.reviewedBy ?? 'stage1',
        at: new Date().toISOString(),
      },
      // Die NOTIZEN ersetzen die vorigen, sie wachsen nicht an: derselbe
      // Aufruf über denselben Wert soll denselben Stand hinterlassen, sonst
      // sammelte ein „Korrigieren und wieder bestätigen" drei Fassungen
      // desselben Satzes in einer gedeckelten Spalte.
      ...(review.notes.length ? { notes: review.notes.join('\n') } : {}),
      // Ein NEUES Urteil heisst: George darf es einmal aussprechen (§7).
      ...(review.goalReached ? {} : { briefDelivered: false }),
      ...(review.nextSession ? { nextSession: review.nextSession } : {}),
    },
  }
  // Das Briefing-Flag wird GELÖSCHT statt auf `true` gesetzt, wenn es nichts
  // zu sagen gibt — „fehlt" heisst hier überall dasselbe wie „nein".
  if (review.goalReached) delete nextRecords[session.id]!.briefDelivered

  const nextRevision = revision + 1
  const { tablesDB, databaseId } = brandDb(event)
  try {
    await tablesDB.updateRow({
      databaseId,
      tableId: BRAND_STEPS_TABLE,
      rowId: stepRow.$id,
      data: { slots: serializeSlotRecords(nextRecords), revision: nextRevision },
    })
  }
  catch (error) {
    throw toH3Error(error, 'Brand session could not be closed')
  }

  // Die Befunde in ihre eigene Tabelle — fail-soft und dedupliziert (s. dort).
  await writeBrandFindings(event, {
    profileId: profile.$id,
    stepKey,
    sourceSession: session.id,
    findings: review.findings,
  })

  return {
    stepKey,
    sessionKey: session.id,
    review,
    findings: await chapterFindings(),
    next: nextStop(nextRecords, review.nextSession),
    revision: nextRevision,
    reviewed: true,
    reviewedBy: outcome.reviewedBy,
  }
})
