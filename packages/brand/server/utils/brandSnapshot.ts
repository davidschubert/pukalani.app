import { BRAND_DIRECTIONS_VERSION, brandDirectionById } from '../../shared/brandDirections'
import { resolveBrandJourney } from '../../shared/brandJourney'
import { brandShareableSlotValues } from '../../shared/brandSharing'
import type { BrandShareSnapshot } from '../../shared/types/brand'
import {
  type BrandProfileRow,
  type BrandStepRow,
  confirmedSlotValues,
  profileFacts,
  toStepFacts,
  toStoryView,
} from './brandStore'

/**
 * DAS EINGEFRORENE ABBILD EINER MARKE — EINE Stelle, zwei Aufrufer.
 *
 * ── WARUM ES DIESE DATEI GIBT (Discover D1) ───────────────────────────────
 * Der Share-Link (`share.post.ts`) und die Veröffentlichung
 * (`publication.post.ts`) frieren DENSELBEN Stand ein: Brand Story plus die
 * bestätigten Kapitel, gefiltert nach `sensitivity`. Zwei Kopien dieser
 * Rechnung wären genau die Sorte Doppelung, die man erst bemerkt, wenn eine
 * davon einen neuen Filter bekommt und die andere nicht — und die andere ist
 * hier die ÖFFENTLICHE, dauerhaft indexierbare. Der Preis für ein Versehen
 * wäre also nicht ein Anzeigefehler, sondern eine Wettbewerber-Notiz auf einer
 * Seite, die Google liest.
 *
 * Die vollständige Begründung, WAS hineindarf und was nicht, steht weiterhin
 * im Kopf von `share.post.ts` (Audit 3, MV1 M5, Paket G1/G4). Hier steht die
 * Rechnung.
 *
 * ── ES WIRD NICHTS GELESEN, WAS DER AUFRUFER NICHT SCHON HAT ─────────────
 * Profil und Baustein-Zeilen kommen als Argumente herein: beide Aufrufer haben
 * sie ohnehin geladen (Besitz-Prüfung bzw. Voraussetzungs-Prüfung), und ein
 * eigener Ladeweg hier wäre eine zweite Wahrheit über dieselben Zeilen.
 */

/**
 * Fassung der Snapshot-FORM — steigt, wenn sich der Aufbau ändert. Ein alter
 * Link muss danach weiter lesbar bleiben; deshalb steht die Zahl IM Snapshot
 * und nicht in einer Spalte, die man beim Lesen erst nachschlagen müsste.
 */
export const BRAND_SNAPSHOT_SCHEMA_VERSION = 1

/** Zod-Zusage aus Schema-Anhang §4 — dieselbe Grenze für beide Aufrufer. */
export const BRAND_SNAPSHOT_MAX = 400_000

/**
 * DIE GEWÄHLTE RICHTUNG (Paket G4). DIE EINE WAHRHEIT IST DER BESTÄTIGTE
 * SLOT-WERT `result.direction` — nicht `brand_profiles.designPresetId` (die
 * zwei Spalten stehen seit Migration 001 in der Tabelle und werden bewusst
 * nicht geschrieben). Eingefroren wird nur eine Id, die der Katalog KENNT: ein
 * durchgereichter Freitext aus einem von Hand korrigierten Feld hätte in einem
 * öffentlich abrufbaren Abbild nichts verloren.
 */
function directionPreset(resultRow: BrandStepRow | undefined): { presetId: string, presetVersion: string } {
  const chosen = resultRow
    ? confirmedSlotValues(resultRow).find(slot => slot.slotId === 'result.direction')?.value ?? ''
    : ''
  const direction = brandDirectionById(chosen.trim())
  return direction
    ? { presetId: direction.id, presetVersion: String(BRAND_DIRECTIONS_VERSION) }
    : { presetId: '', presetVersion: '' }
}

export interface BrandSnapshotResult {
  snapshot: BrandShareSnapshot
  /** Die serialisierte Form — genau das, was in die Spalte geht. */
  payload: string
}

/**
 * Baut das Abbild und WIRFT bei Überlänge (413 `snapshot_too_large`).
 *
 * Der Deckel gehört hierher und nicht in die Routen: er ist eine Eigenschaft
 * der Spalte, nicht der Handlung, und zwei Routen mit zwei Zahlen wären eine
 * Grenze, die je nach Knopf woanders liegt.
 */
export function buildBrandSnapshot(
  profile: BrandProfileRow,
  stepRows: readonly BrandStepRow[],
): BrandSnapshotResult {
  const journey = resolveBrandJourney(profileFacts(profile), toStepFacts(stepRows))
  const byStepKey = new Map(stepRows.map(row => [row.stepKey, row]))

  const snapshot: BrandShareSnapshot = {
    schemaVersion: BRAND_SNAPSHOT_SCHEMA_VERSION,
    title: profile.title ?? '',
    contentLocale: profile.contentLocale,
    story: toStoryView(profile).body,
    chapters: journey
      .filter(step => step.state !== 'skipped')
      .map((step) => {
        const row = byStepKey.get(step.stepKey)
        return {
          stepKey: step.stepKey,
          slots: row ? brandShareableSlotValues(confirmedSlotValues(row)) : [],
        }
      })
      // Ein Kapitel ohne bestätigten Inhalt hat nichts zu zeigen — es fehlt,
      // statt als leere Überschrift dazustehen.
      .filter(chapter => chapter.slots.length > 0),
    ...directionPreset(byStepKey.get('result')),
  }

  const payload = JSON.stringify(snapshot)
  if (payload.length > BRAND_SNAPSHOT_MAX) {
    throw createError({
      status: 413,
      statusText: 'Snapshot too large',
      data: { code: 'snapshot_too_large' },
    })
  }

  return { snapshot, payload }
}
