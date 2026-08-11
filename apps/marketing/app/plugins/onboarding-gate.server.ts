import { resolveOnboardingGate } from '../../../../packages/core/shared/onboardingGate'

/**
 * Den Zustand des Early-Access-Tors einmal pro Seitenaufbau in den Payload
 * legen (U2). Leser: useOnboardingGate() — Hero und Kopfleiste.
 *
 * SERVER-ONLY: im Browser kommt der Wert aus dem Payload. Der Abruf geht an
 * die EIGENE Route `/api/gate` (Nuxt ruft den Handler direkt, ohne Netz), und
 * die cacht 60 s über alle Besucher hinweg — die Startseite tippt also nicht
 * pro Aufruf einen fremden Dienst an.
 *
 * FAIL-SOFT auf jeder Stufe: wirft der Abruf, bleibt der Startwert
 * „Einladung nötig" stehen. Eine Landing, die wegen einer Auskunft nicht
 * rendert, wäre der teuerste denkbare Fehler an dieser Stelle.
 */
export default defineNuxtPlugin(async () => {
  const gate = useOnboardingGate()
  try {
    gate.value = resolveOnboardingGate(await $fetch('/api/gate'))
  }
  catch {
    // Fail-safe steht schon im Startwert.
  }
})
