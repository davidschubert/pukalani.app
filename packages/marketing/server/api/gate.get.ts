import {
  FAILSAFE_ONBOARDING_GATE,
  resolveOnboardingGate,
  type OnboardingGateState,
} from '../../../core/shared/onboardingGate'

/**
 * Braucht eine eigene Community gerade einen Einladungs-Code? (U2, Davids
 * Entscheidung 8 vom 2026-08-10.)
 *
 * DAS LETZTE GLIED DER KETTE: Control Plane (Wahrheit, app_config) →
 * Platform-Kontroll-Host (`/api/onboarding/gate`, öffentlich, 60 s) → HIER →
 * Landing. Ohne Geheimnis in Richtung Browser: dieser Server spricht mit einem
 * ÖFFENTLICHEN Endpunkt, das Service-Secret bleibt eine Etage weiter oben.
 *
 * WARUM ÜBERHAUPT EINE EIGENE ROUTE UND NICHT DIREKT AUS DER SEITE: ein
 * `useAsyncData` in der Komponente liefe pro Seitenaufbau einmal über die
 * Leitung. Hier liegt der Cache über ALLEN Besuchern (user-agnostisch, genau
 * der Fall für createMicrocache) — die Startseite ist die meistbesuchte Seite
 * des Systems, sie darf keinen fremden Dienst pro Aufruf antippen.
 *
 * KURZER TIMEOUT UND FAIL-SAFE: die Landing muss rendern, auch wenn account.* gerade
 * nicht antwortet. Was dann steht, ist die Einladungs-Variante — der Zustand,
 * der heute ohnehin gilt und der niemandem etwas verspricht, das er nicht
 * bekommt. Der Fehlschlag wird NICHT gecacht, damit die Seite sofort wieder
 * richtig steht, sobald die Gegenseite antwortet.
 */
const GATE_TTL_MS = 60_000
const GATE_TIMEOUT_MS = 2_000
const CACHE_KEY = 'marketing-onboarding-gate'
const cache = createMicrocache<OnboardingGateState>(GATE_TTL_MS)

export default defineEventHandler(async (event): Promise<OnboardingGateState> => {
  const hit = cache.get(CACHE_KEY)
  if (hit) return hit

  const url = useRuntimeConfig(event).public.marketingGateUrl
  if (!url) return { ...FAILSAFE_ONBOARDING_GATE }

  try {
    const raw = await $fetch<unknown>(url, { timeout: GATE_TIMEOUT_MS })
    const state = resolveOnboardingGate(raw)
    cache.set(CACHE_KEY, state)
    return state
  }
  catch (error) {
    logEvent('warn', 'marketing.gate_unavailable', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { ...FAILSAFE_ONBOARDING_GATE }
  }
})
