import { stripBrandGenerationDrafts } from '../../../../../../shared/brandGeneration'
import { resolveSessionStates } from '../../../../../../shared/brandJourney'
import { sessionsAffectedBy } from '../../../../../../shared/brandSessions'
import { slotsForStep } from '../../../../../../shared/slotRegistry'
import type { BrandSessionView, BrandStepDetailResponse } from '../../../../../../shared/types/brand'
import {
  loadBrandStepContext,
  parseCollectedParts,
  parseGenerations,
  parseSlotRecords,
  profileFacts,
  toSlotViews,
  toStepFacts,
} from '../../../../../utils/brandStore'

/**
 * EINEN BAUSTEIN ÖFFNEN — Slots, Zustand, Fortschritt.
 *
 * ── GENERATIONEN: METADATEN, KEINE INHALTE ────────────────────────────────
 * `generations` trägt je Eintrag `generationId`, Slot-Id, Schema-/Prompt-
 * Version, Modell, Anbieter, Sprache, `inputHash` und Zeitpunkt — nie den
 * erzeugten Text. Der TEXT lebt in den Slots (`firstDraft`/`latestDraft`) und in
 * `brand_messages`; diese Liste beantwortet „wie kam das zustande?", nicht „was
 * steht da?".
 *
 * GESPEICHERT wird der Entwurf trotzdem mit (`BrandGenerationEntry.draft`, seit
 * der Generierungs-Route) — sonst könnte die Fassungs-Wiederherstellung keine
 * frühere Fassung zurückholen. Er wird hier ABGESTREIFT, damit jede Antwort
 * genau so viel trägt, wie ihre Seite braucht: die Werkstatt zeigt Herkunft, die
 * Fassungs-Liste zeigt Text und hat dafür ihre eigene Route.
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
 *
 * ── `sessions`: DER STAND JE FELD (BW2 §5, Paket 3a) ──────────────────────
 * `slots` sagt, WAS in einem Feld steht; `sessions` sagt, WIE es um die
 * Arbeitseinheit dahinter steht — gesperrt, offen, fertig, veraltet — plus
 * das, was die Oberfläche dem Menschen VORHER sagen soll: wie lange es dauert
 * (`effort`), wie vertraulich es ist (`sensitivity`), welche Arbeitsform es
 * hat (`kind`) und wohin es später fliesst (`affects`).
 *
 * `affects` ist eine reine RECHNUNG über der Registry (`sessionsAffectedBy`),
 * keine gepflegte Liste: „das fliesst später in vier Kapitel" wird damit nie
 * falsch, auch wenn morgen eine Abhängigkeit dazukommt. Die Zahl ist die
 * Länge der transitiven Hülle — dieselbe Spalte „berührt" wie in Anhang A des
 * Plans.
 *
 * Gerechnet wird über die Fakten ALLER Kapitel (`stepRows`), nicht nur des
 * eigenen: eine Session liest über Kapitelgrenzen (`b.purpose` ← `a.pitch`),
 * und mit nur einer Zeile stünde die halbe Registry für immer auf `locked`.
 */
export default defineEventHandler(async (event): Promise<BrandStepDetailResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow, stepRows, journey } = await loadBrandStepContext(event, userId)

  const step = journey.find(entry => entry.stepKey === stepKey)!
  const generations = parseGenerations(stepRow.generations)
  const records = parseSlotRecords(stepRow.slots)

  const states = resolveSessionStates(profileFacts(profile), toStepFacts(stepRows))
  const sessions: Record<string, BrandSessionView> = {}
  for (const session of slotsForStep(stepKey)) {
    const affected = sessionsAffectedBy(session.id)
    const collected = parseCollectedParts(records[session.id])
    sessions[session.id] = {
      state: states[session.id] ?? 'locked',
      kind: session.kind,
      effort: session.effort,
      sensitivity: session.sensitivity,
      affects: {
        count: affected.transitive.length,
        // Die Kapitel in Registry-Reihenfolge — `byStep` ist ein Objekt, seine
        // Schlüssel-Reihenfolge ist keine Zusage.
        steps: journey
          .map(entry => entry.stepKey)
          .filter(candidate => affected.byStep[candidate]?.length),
      },
      // NUR wo es welche gibt: ein leeres Objekt an 67 Sessions wäre Rauschen
      // in jeder Antwort. `accepted`/`deferred` fehlen in dieser Runde ganz —
      // sie kommen mit Paket 3b (s. `BrandSessionView`).
      ...(Object.keys(collected).length ? { collected } : {}),
    }
  }

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
    slots: toSlotViews(records),
    sessions,
    generations: { items: stripBrandGenerationDrafts(generations.items), count: generations.count },
    progress: step.progress,
    missingRequired: [...step.missingRequired],
  }
})
