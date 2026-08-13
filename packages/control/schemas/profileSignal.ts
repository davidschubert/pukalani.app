import { z } from 'zod'
import { SITE_MEMBER_RANGES, SITE_PURPOSES, SITE_GOAL_IDS, type SiteGoal } from '../shared/onboarding'

/**
 * `SITE_GOAL_IDS` ist ein `readonly SiteGoal[]`, `z.enum` verlangt ein Tupel.
 * Dieselbe Umdeutung wie in `schemas/onboarding.ts` — und aus demselben Grund
 * mit `SiteGoal` statt `string`: ein `as readonly [string, ...]` würde den Typ
 * verlieren, und das Ergebnis passte danach nicht mehr in `SiteProfile`.
 */
const GOAL_IDS = SITE_GOAL_IDS as unknown as [SiteGoal, ...SiteGoal[]]

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/**
 * DIE DREI MARKT-FRAGEN (U19): Größe · Zweck · Ziel.
 *
 * EINE Definition für drei Stellen — die Karte im Dashboard, die
 * onboarding-Route und die Route des Control Plane. Dasselbe Muster und
 * dieselbe Begründung wie beim Nachbarn `communityProfile.ts`: getrennte
 * Kopien liessen den Kunden ein grünes Formular abschicken und ein rotes 400
 * zurückbekommen.
 *
 * ── DIE KATALOGE WERDEN NICHT NEU ERFUNDEN ──────────────────────────────────
 * `SITE_PURPOSES`, `SITE_MEMBER_RANGES` und `SITE_GOALS` stehen seit dem
 * ersten Wizard in `shared/onboarding.ts` und werden von `parseSiteProfile`
 * gelesen. U12 hat nur aufgehört, sie zu FRAGEN — der Antwort-Vorrat blieb
 * bewusst stehen. Ein zweiter Katalog hier hiesse: Bestands-Antworten und neue
 * Antworten wären nicht mehr vergleichbar, und genau die Vergleichbarkeit ist
 * der Zweck der ganzen Übung.
 *
 * ── ALLE DREI SIND OPTIONAL, ABER NICHT ALLE DREI LEER ──────────────────────
 * Teilantworten sind ausdrücklich erlaubt (die Karte ist freiwillig, und eine
 * halbe Antwort ist mehr Signal als keine). Ein komplett leerer Aufruf ist
 * dagegen kein Beitrag, sondern nur ein Weg, die Karte über den Speichern-Knopf
 * loszuwerden — dafür gibt es „Später" und „Nicht mehr fragen". Er wird
 * abgewiesen, damit nicht eine Zeile „beantwortet" heisst, in der nichts steht.
 */
export function createCommunityProfileSignalSchema(t: TranslateFn = identity) {
  return z.object({
    purpose: z.enum(SITE_PURPOSES).optional(),
    memberRange: z.enum(SITE_MEMBER_RANGES).optional(),
    goal: z.enum(GOAL_IDS).optional(),
  }).strict().refine(
    value => Boolean(value.purpose || value.memberRange || value.goal),
    { message: t('onboarding.profileSignal.validation.empty') },
  )
}

export const communityProfileSignalSchema = createCommunityProfileSignalSchema()
export type CommunityProfileSignalInput = z.infer<typeof communityProfileSignalSchema>

/** Was beide Routen zurückgeben — der Client übernimmt aus der ANTWORT. */
export interface CommunityProfileSignalResult {
  communityId: string
  purpose: string
  memberRange: string
  goal: string
}
