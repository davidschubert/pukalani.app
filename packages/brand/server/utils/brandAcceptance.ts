import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import {
  type BrandSessionState,
  type BrandStepAcceptance,
  type BrandStepFacts,
  brandStepAcceptance,
  mergeBrandSlotFacts,
} from '../../shared/brandJourney'
import { blockingFindingSlots } from '../../shared/brandFindings'
import { type BrandRestartImpact, brandRestartImpact } from '../../shared/brandSessions'
import {
  type BrandSlot,
  type BrandSlotStateFacts,
  type BrandStepKey,
  slotById,
  slotsForStep,
} from '../../shared/slotRegistry'
import type { BrandFindingView } from '../../shared/types/brand'
import { listBrandFindings, toBrandFindingView } from './brandFindingsStore'
import {
  type BrandProfileRow,
  type BrandSlotRecord,
  type BrandStepContext,
  loadBrandStepContext,
  parseSlotRecords,
  profileFacts,
  resolveBrandSessionStates,
  toSlotFacts,
  toStepFacts,
} from './brandStore'

/**
 * DER GEMEINSAME UNTERBAU DER ABNAHME-ROUTEN (Plan §5a) — abnehmen, vertagen,
 * die Seite lesen, „Nochmal von vorn" ankündigen und ausführen.
 *
 * ── WARUM DIE FÜNF DENSELBEN EINSTIEG BRAUCHEN ────────────────────────────
 * Jede von ihnen stellt dieselben vier Fragen in derselben Reihenfolge: wem
 * gehört das Profil, welches Kapitel, wie steht JEDE Session (das ist eine
 * Rechnung über ALLE Kapitel, nicht über die eine Zeile) und was steht der
 * Abnahme im Weg. Stünde die Kette in jeder Route, wäre sie fünfmal da und
 * irgendwann dreimal richtig — genau die Begründung, aus der auch
 * `loadBrandStepContext` entstanden ist. Diese Datei legt nur die
 * Session-Ebene darüber.
 *
 * ── DIE KONFLIKTE SIND SEIT PAKET 4 ECHT ──────────────────────────────────
 * Bis Paket 3b war `openConflicts` immer leer und der Parameter ein Haken für
 * später. Jetzt kommt er aus `brand_findings`: jeder OFFENE `conflict`, an dem
 * ein Feld dieses Kapitels beteiligt ist, sperrt die Finale Abnahme (§5a
 * Schritt 3). Die Rechnung dahinter ist pur (`blockingFindingSlots`), das
 * Laden ist FAIL-SOFT (`listBrandFindings`) — eine Abnahme-Seite, die wegen
 * einer klemmenden Nebentabelle nicht mehr lädt, hätte einen Menschen für eine
 * Zugabe ausgesperrt.
 *
 * Gefiltert wird über die SLOTS und nicht über `brand_findings.stepKey`: der
 * Stempel sagt, wo ein Befund ENTSTANDEN ist, gesperrt wird aber jedes
 * Kapitel, dessen Feld daran hängt. Ein Konflikt zwischen B und C sperrt beide.
 */
export const BRAND_OPEN_CONFLICTS_NONE: readonly string[] = []

export interface BrandAcceptanceDerivation {
  /** Die Slot-Fakten ALLER Kapitel — die Grundlage jeder Session-Rechnung. */
  allFacts: Record<string, BrandSlotStateFacts | undefined>
  sessionStates: Readonly<Record<string, BrandSessionState>>
  acceptance: BrandStepAcceptance
}

export interface BrandAcceptanceContext extends BrandStepContext, BrandAcceptanceDerivation {
  /** Die gelesenen Slot-Datensätze DIESES Kapitels. */
  records: Record<string, BrandSlotRecord>
  stepFacts: BrandStepFacts[]
  /** ALLE offenen Befunde des Brandings — kapitelübergreifend, wie die Tabelle. */
  findings: BrandFindingView[]
  /** Die davon, die ein Feld DIESES Kapitels sperren (§5a Schritt 3). */
  openConflicts: string[]
}

export async function loadBrandAcceptanceContext(
  event: H3Event,
  userId: string,
): Promise<BrandAcceptanceContext> {
  const context = await loadBrandStepContext(event, userId)
  const records = parseSlotRecords(context.stepRow.slots)
  const stepFacts = toStepFacts(context.stepRows)
  const findings = (await listBrandFindings(event, context.profile.$id, 'open')).map(toBrandFindingView)
  const openConflicts = blockingFindingSlots(
    findings,
    slotsForStep(context.stepKey).map(session => session.id),
  )
  return {
    ...context,
    records,
    stepFacts,
    findings,
    openConflicts,
    ...deriveBrandAcceptance(context.profile, context.stepKey, stepFacts, openConflicts),
  }
}

/**
 * DIE RECHNUNG SELBST, ohne Laden — damit eine Route sie NACH ihrem Schreiben
 * mit den neuen Fakten wiederholen kann, ohne die Zeile erneut zu lesen. Ein
 * zweiter Lesevorgang wäre eine zweite Wahrheit über denselben Augenblick.
 */
export function deriveBrandAcceptance(
  profile: BrandProfileRow,
  stepKey: BrandStepKey,
  stepFacts: readonly BrandStepFacts[],
  openConflicts: readonly string[] = BRAND_OPEN_CONFLICTS_NONE,
): BrandAcceptanceDerivation {
  const allFacts = mergeBrandSlotFacts(stepFacts)
  const sessionStates = resolveBrandSessionStates(profileFacts(profile), stepFacts)
  const acceptance = brandStepAcceptance(stepKey, allFacts, sessionStates, openConflicts)
  return { allFacts, sessionStates, acceptance }
}

/**
 * Die Fakten der Kapitel-Zeile durch einen NEUEN Stand ersetzen — die Form, in
 * der eine Route ihre eigene Schreibung in die Gesamtrechnung einsetzt.
 */
export function withStepSlotFacts(
  stepFacts: readonly BrandStepFacts[],
  stepKey: BrandStepKey,
  records: Record<string, BrandSlotRecord>,
): BrandStepFacts[] {
  return stepFacts.map(facts => (facts.stepKey === stepKey
    ? { ...facts, slots: toSlotFacts(records) }
    : facts))
}

/**
 * DIE SESSION AUS DER ADRESSZEILE — geprüft gegen die Registry UND gegen das
 * Kapitel, bevor irgendetwas wirkt.
 *
 * 404 und nicht 400: eine Session, die es in diesem Kapitel nicht gibt, ist
 * für diese Adresse schlicht nicht da — dieselbe Antwort wie bei einem
 * unbekannten `stepKey` eine Ebene darüber.
 */
export function requireSessionParam(event: H3Event, stepKey: BrandStepKey): BrandSlot {
  const slotId = getRouterParam(event, 'slotId')
  const slot = slotId ? slotById(slotId) : undefined
  if (!slot || slot.deactivated || slot.stepId !== stepKey) {
    throw createError({ status: 404, statusText: 'Not Found' })
  }
  return slot
}

/** Derselbe Trenner wie im Generations-Hash — in keiner Slot-Id möglich. */
const SEPARATOR = '\u0000'

/**
 * DER ACK-HASH DER RESTART-HÜLLE (§5a Schritt 2).
 *
 * Er bindet DREI Dinge zusammen: das Kapitel, seine `revision` und die
 * sortierte Liste der bestätigten Felder, die daran hängen. Bewegt sich eines
 * davon zwischen dem Zeigen und dem Klick, passt der zurückgetragene Wert
 * nicht mehr — und der Mensch bekommt die neue Hülle zu sehen, statt etwas zu
 * löschen, das er so nie angekündigt bekam.
 *
 * SORTIERT und nicht in Registry-Reihenfolge: der Hash ist eine Aussage über
 * die MENGE, nicht über ihre Anzeige. Getrennt wird mit U+0000 wie im
 * Generations-Hash — ein Zeichen, das in keiner Slot-Id vorkommen kann.
 */
export function brandRestartAck(
  stepKey: BrandStepKey,
  revision: number,
  sessions: readonly string[],
): string {
  const canonical = [stepKey, String(revision), ...[...sessions].sort()].join(SEPARATOR)
  return createHash('sha256').update(canonical).digest('hex')
}

export interface BrandRestartImpactView {
  stepKey: BrandStepKey
  revision: number
  chapter: { values: number, notes: number, accepted: number }
  downstream: { byStep: Partial<Record<BrandStepKey, string[]>>, count: number }
  ack: string
}

/**
 * WAS DER SCHUTZ-LAYER ZEIGT — die Zahlen dieses Kapitels plus die Hülle der
 * späteren. Gezählt wird der bestätigte WERT und nicht der Entwurf: ein
 * Entwurf, dem niemand zugestimmt hat, ist kein Verlust, den man ankündigt.
 */
export function brandRestartImpactView(
  stepKey: BrandStepKey,
  revision: number,
  records: Record<string, BrandSlotRecord>,
  allFacts: Record<string, BrandSlotStateFacts | undefined>,
): BrandRestartImpactView {
  const own = Object.values(records)
  const impact: BrandRestartImpact = brandRestartImpact(stepKey, allFacts)
  const byStep: Partial<Record<BrandStepKey, string[]>> = {}
  for (const [key, ids] of Object.entries(impact.byStep)) {
    byStep[key as BrandStepKey] = [...(ids ?? [])]
  }
  return {
    stepKey,
    revision,
    chapter: {
      values: own.filter(record => (record.confirmed ?? '').length > 0).length,
      notes: own.filter(record => (record.notes ?? '').length > 0).length,
      accepted: own.filter(record => record.accepted === true).length,
    },
    downstream: { byStep, count: impact.count },
    ack: brandRestartAck(stepKey, revision, impact.sessions),
  }
}
