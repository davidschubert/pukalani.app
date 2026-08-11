import { FAILSAFE_ONBOARDING_GATE, type OnboardingGateState } from '../../../core/shared/onboardingGate'

/**
 * Steht das Tor vor dem GRÜNDEN offen? — für alle Flächen des Kundenbereichs,
 * die ihre Ansage danach richten (U2): das Code-Tor auf /start, der Zurück-Weg
 * im Wizard und der Ehrlichkeits-Hinweis über dem Register-Formular.
 *
 * NUR EIN LESER, KEIN ABRUF. Gefüllt wird der Zustand EINMAL pro Seitenaufbau
 * vom Plugin `plugins/onboarding-gate.server.ts` und reist im SSR-Payload
 * mit — dasselbe Muster wie useTenantOpenRegistration.
 *
 * WARUM NICHT `useAsyncData` in den Komponenten: der Zustand entscheidet, WAS
 * gerendert wird. Ein Abruf im Browser hieße, dass nach der Hydration ein
 * anderes Markup dasteht als im ausgelieferten HTML. Und ein `await` in einer
 * KOMPONENTE (der Hinweis über dem Register-Formular ist eine) macht sie
 * asynchron und hängt sie an die nächste Suspense-Grenze — der Payload-Weg
 * kostet nichts davon.
 *
 * Der Startwert ist der Fail-safe: kommt gar nichts an (Plugin nicht gelaufen,
 * Mandanten-Host, Payload-Schaden), gilt „Einladung nötig".
 */
export function useOnboardingGate() {
  return useState<OnboardingGateState>('pukalani-onboarding-gate', () => ({ ...FAILSAFE_ONBOARDING_GATE }))
}
