import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { BwRailStep } from '../components/BwProgressRail.vue'
import type { BrandStepKey } from '../../shared/slotRegistry'

/**
 * DER EINSTIEG IN DIE BRAND FOUNDATION IN DER WERKSTATT-LEISTE (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.6 und Entscheidung §6 d,
 * Paket G2).
 *
 * ── AUS „ERGEBNIS" WIRD „BRAND FOUNDATION" ───────────────────────────────
 * Der letzte Kapitel-Eintrag der Leiste (`result`) war eine gesperrte Kachel,
 * die auf ein Kapitel zeigte, das niemand betreten konnte — die Ergebnis-
 * Ansicht gab es nie. Ab jetzt IST sie diese Seite: derselbe Platz, derselbe
 * Funke, aber mit Ziel und ohne Sperre. Die Werkstatt-Seite `result` bleibt
 * bestehen (dort wohnt `result.direction`, Paket G4) — sie ist nur nicht mehr
 * der Endpunkt der Leiste.
 *
 * ── IMMER KLICKBAR, UND DAS IST DER PUNKT ────────────────────────────────
 * Die Leseansicht zeigt auch ZWISCHENSTÄNDE (§2.6: nicht abgenommene Kapitel
 * tragen ihren Vermerk). Ein Einstieg, der erst am Ende aufginge, verschwiege
 * genau das Dokument, dessen Wachsen den Fortschritt beweist — dieselbe
 * Begründung wie beim Eintrag „Euer Branding". `BwWorkspaceSidebar` gibt einen
 * `result`-Punkt frei, sobald er ein eigenes Ziel (`to`) trägt; der Zustand
 * bleibt deshalb EHRLICH (`open`, bzw. `active` auf der Seite selbst) statt
 * ein `done` zu behaupten, das die Abnahme meint.
 *
 * ── WARUM EIN COMPOSABLE ─────────────────────────────────────────────────
 * Drei Seiten bauen dieselbe Leiste (Werkstatt, Dokument, Foundation) und
 * jede mappt `store.railSteps` selbst, weil sie über die KAPITEL
 * Verschiedenes weiss. Über DIESEN Eintrag weiss keine etwas Eigenes — genau
 * das Muster von `useBrandWorkspaceNavExtras`: drei Kopien wären drei Orte,
 * an denen der Einstieg beim nächsten Umbau nur zweimal mitwandert.
 */

/** Das Kapitel, dessen Leisten-Eintrag zur Leseansicht wird. */
export const BRAND_FOUNDATION_RAIL_STEP: BrandStepKey = 'result'

export interface BrandFoundationRailStepInput {
  profileId: MaybeRefOrGetter<string>
  /** Steht der Mensch GERADE auf der Leseansicht? */
  active?: MaybeRefOrGetter<boolean>
}

export function useBrandFoundationRailStep(
  input: BrandFoundationRailStepInput,
): ComputedRef<BwRailStep> {
  const { t } = useI18n()
  const localePath = useLocalePath()

  return computed<BwRailStep>(() => ({
    id: BRAND_FOUNDATION_RAIL_STEP,
    label: t('brand.nav.foundation'),
    icon: '',
    state: toValue(input.active) === true ? 'active' : 'open',
    kind: 'result',
    to: localePath(`/brand/${toValue(input.profileId)}/foundation`),
  }))
}
