import { FAILSAFE_ONBOARDING_GATE, type OnboardingGateState } from '../../../core/shared/onboardingGate'

/**
 * Steht das Early-Access-Tor offen? — für die CTAs der Landing (U2, Davids
 * Entscheidung 8 vom 2026-08-10).
 *
 * NUR EIN LESER. Gefüllt wird der Zustand einmal pro Seitenaufbau von
 * `plugins/onboarding-gate.server.ts` und reist im SSR-Payload mit; die Kette
 * dahinter (Marketing-Server → Kontroll-Host → Control Plane) ist an beiden
 * Enden gecacht.
 *
 * KEIN CLIENT-ZWEIG, und das ist hier keine Feinheit: der Zustand entscheidet
 * über BESCHRIFTUNG UND ZIEL des wichtigsten Knopfes der Seite. Käme er erst
 * im Browser, stünde nach der Hydration ein anderer Knopf da als im
 * ausgelieferten HTML — und ohne JavaScript wäre er dauerhaft falsch
 * beschriftet.
 *
 * Startwert = Fail-safe: ohne Auskunft gilt die Einladungs-Variante.
 */
export function useOnboardingGate() {
  return useState<OnboardingGateState>('marketing-onboarding-gate', () => ({ ...FAILSAFE_ONBOARDING_GATE }))
}
