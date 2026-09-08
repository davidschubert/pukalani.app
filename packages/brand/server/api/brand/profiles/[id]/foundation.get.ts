import { brandStepAcceptance } from '../../../../../shared/brandJourney'
import { blockingFindingSlots } from '../../../../../shared/brandFindings'
import { BRAND_DIRECTIONS_VERSION, brandDirectionById } from '../../../../../shared/brandDirections'
import { buildBrandFoundation } from '../../../../../shared/brandFoundation'
import { type BrandStepKey, isBrandDesignStep, slotsForStep } from '../../../../../shared/slotRegistry'
import type {
  BrandFoundationResponse,
  BrandFoundationStepState,
} from '../../../../../shared/types/brand'
import { loadBrandDocumentContext } from '../../../../utils/brandAcceptance'
import { recordBrandEvent } from '../../../../utils/brandEvents'
import { confirmedSlotValues, toStoryView } from '../../../../utils/brandStore'

/**
 * „BRAND FOUNDATION" — DIE PRIVATE LESEANSICHT (Konzept
 * docs/archiv/BRAND-FOUNDATION-LESEANSICHT.md §2.1/§2.6, Paket G2).
 *
 * ── SIE BAUT EINEN SNAPSHOT, DEN NIEMAND SPEICHERT ───────────────────────
 * `buildBrandFoundation` nimmt wörtlich die Form des `BrandShareSnapshot`
 * (Kopf von `shared/brandFoundation.ts`). Diese Route legt deshalb die LIVE-
 * Werte in genau diese Form — dieselben `confirmedSlotValues` je Kapitel des
 * Weges, dieselbe Story — und reicht sie hinein. Der Unterschied zwischen der
 * privaten und der geteilten Ansicht ist damit ein Testfall und kein Zufall:
 * beide fahren dieselbe Regel, die eine auf dem Jetzt, die andere auf dem
 * eingefrorenen Damals.
 *
 * ── HIER WIRD NICHT VORGEFILTERT (§2.8, das Doppelnetz) ──────────────────
 * Bewusst KEIN `brandShareableSlotValues`: was in ein Handbuch gehört,
 * entscheidet der Renderer an der Registry, und zwar an EINER Stelle. Ein
 * zweiter Filter davor sähe wie eine zusätzliche Sicherung aus, wäre aber eine
 * zweite Antwort auf dieselbe Frage — und die eine, die man später ändert, ist
 * garantiert nicht die, die noch gelesen wird. Hineingegeben wird trotzdem nur
 * BESTÄTIGTES: `confirmedSlotValues` liest `confirmed`, nie `latestDraft`.
 *
 * ── LESEN IST IMMER ERLAUBT, FREMDES IST 404 ─────────────────────────────
 * Wie beim Dokument: kein `canEnterBrandStep` (gezeigt wird nur, was der
 * Mensch selbst bestätigt hat), aber `assertBrandOwnerAccess` in
 * `loadOwnedProfile` — ein fremdes oder erfundenes Branding antwortet 404 wie
 * überall in diesem Silo-Layer (DECISION-LOG 2026-09-05). Die Seite wirft
 * daraufhin ihre Fehlerseite, keine halbe Werkstatt.
 *
 * ── SIE RUFT NICHTS AN UND ÄNDERT NICHTS ─────────────────────────────────
 * Null KI-Aufrufe (§2.9): die Story steht am Profil, der Prüfblick bleibt im
 * Dokument. Der Zähler und die Abnahme-Zustände sind Rechnung über dem, was
 * `loadBrandDocumentContext` ohnehin geladen hat — zwei Abfragen, wie beim
 * Dokument. Am BRANDING ändert sie nichts; die einzige Zeile, die sie
 * schreibt, ist `foundation.viewed` im Funnel (Paket G3) — fail-soft, und sie
 * beantwortet die Frage aus §2.10: arbeitet jemand am nächsten Tag mit dem
 * Ergebnis? Sie steht am ENDE, nach jeder Prüfung: ein fremdes Branding darf
 * nicht einmal einen Zähler bewegen.
 */
export default defineEventHandler(async (event): Promise<BrandFoundationResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile, stepRows, journey, allFacts, sessionStates, findings }
    = await loadBrandDocumentContext(event, userId)

  const byStepKey = new Map(stepRows.map(row => [row.stepKey, row]))

  const chapters: BrandFoundationStepState[] = []
  const values: { stepKey: BrandStepKey, slots: { slotId: string, value: string }[] }[] = []

  for (const entry of journey) {
    // Übersprungene Kapitel sind nicht das, was diese Marke IST (§2.2) — sie
    // fehlen hier wie im Dokument und wie im Snapshot.
    if (entry.state === 'skipped') continue
    // Und Brand Design ist (noch) nicht Teil der Leseansicht: Kapitel 10 zeigt
    // bis **D8** die Schranke, nicht sechs leere Abschnitte. Stünden sie hier,
    // zählte die Kopfzeile „x von 12 abgenommen" plötzlich Kapitel mit, die
    // niemand öffnen kann.
    if (isBrandDesignStep(entry.stepKey)) continue
    const row = byStepKey.get(entry.stepKey)
    const openConflicts = blockingFindingSlots(
      findings,
      slotsForStep(entry.stepKey).map(session => session.id),
    )
    const acceptance = brandStepAcceptance(entry.stepKey, allFacts, sessionStates, openConflicts)
    chapters.push({
      stepKey: entry.stepKey,
      // Fehlt die Zeile (Datenfehler), gilt das Kapitel als offen — eine
      // Leseansicht darf daran nicht scheitern.
      storedState: row?.state ?? 'open',
      acceptance: { accepted: acceptance.accepted, total: acceptance.total },
    })
    values.push({ stepKey: entry.stepKey, slots: row ? confirmedSlotValues(row) : [] })
  }

  /**
   * DIE GEWÄHLTE RICHTUNG — DIE EINE WAHRHEIT IST DER BESTÄTIGTE SLOT-WERT
   * (Paket G4, Konzept §11 d).
   *
   * `brand_profiles.designPresetId/designPresetVersion` gibt es als Spalten
   * seit Migration 001, geschrieben hat sie NIE jemand. Sie zu spiegeln hiesse,
   * zwei Stellen zu haben, die dieselbe Frage beantworten — und die eine, die
   * jemand später ändert, ist garantiert nicht die, die noch gelesen wird
   * (dieselbe Regel wie beim Doppelnetz oben: EINE Wahrheit, mehrere Netze,
   * nie zwei Quellen). Gelesen wird deshalb hier wie beim Veröffentlichen der
   * bestätigte Wert der Session `result.direction`; die zwei Spalten bleiben
   * unbeschrieben, bis die Themes-Engine-Presets sie wirklich brauchen.
   *
   * NUR EINE BEKANNTE ID REIST WEITER: `result.direction` ist
   * `audience: 'internal'` und wird vom Renderer gesondert gerendert (s.
   * `BrandFoundationInput.direction`) — stünde hier ein beliebiger Text, ginge
   * er als roher Wert durch die Antwort, an genau dem Tor vorbei, das die
   * Leseansicht ausmacht.
   */
  const chosenDirection = values
    .find(chapter => chapter.stepKey === 'result')?.slots
    .find(slot => slot.slotId === 'result.direction')?.value ?? ''
  const direction = brandDirectionById(chosenDirection.trim())

  await recordBrandEvent(event, {
    type: 'foundation.viewed',
    profileId: profile.$id,
    userId,
    // Umfang, nicht Inhalt (Regel 1 des Ereignis-Kopfs).
    payload: {
      chapters: chapters.length,
      accepted: chapters.filter(chapter => chapter.storedState === 'done').length,
    },
  })

  return {
    profileId: profile.$id,
    title: profile.title ?? '',
    contentLocale: profile.contentLocale,
    view: buildBrandFoundation({
      title: profile.title ?? '',
      contentLocale: profile.contentLocale,
      story: toStoryView(profile).body,
      chapters: values,
      pathKind: profile.pathKind === 'relaunch' ? 'relaunch' : 'new',
      team: profile.team === 'team' ? 'team' : 'solo',
      ...(direction
        ? { direction: { id: direction.id, version: String(BRAND_DIRECTIONS_VERSION) } }
        : {}),
    }),
    chapters,
    accepted: {
      chapters: chapters.filter(chapter => chapter.storedState === 'done').length,
      total: chapters.length,
    },
  }
})
