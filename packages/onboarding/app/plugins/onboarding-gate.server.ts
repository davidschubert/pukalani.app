import { resolveOnboardingGate } from '../../../core/shared/onboardingGate'

/**
 * Den Zustand des Early-Access-Tors EINMAL pro Seitenaufbau in den Payload
 * legen (U2). Leser: useOnboardingGate().
 *
 * NUR AUF KONTROLL-HOSTS. Auf `kunde-a.pukalani.app` gibt es nichts zu
 * gründen — dort heißt „registrieren" schlicht „dieser Community beitreten",
 * und die Route läge ohnehin hinter dem Mandanten-Kontext. Ohne diese Klammer
 * fragte JEDE Seite JEDES Mandanten bei jedem Aufruf nach einem Zustand, den
 * dort niemand liest.
 *
 * SERVER-ONLY: im Browser kommt der Wert aus dem Payload. Ein zweiter Abruf
 * nach der Hydration könnte nur eines — die Seite gegen ihr eigenes HTML
 * kippen.
 *
 * FAIL-SOFT: bleibt der Abruf aus, steht der Startwert aus useOnboardingGate()
 * (Einladung nötig). Die Route dahinter hat denselben Rückfall; hier liegt
 * lediglich das letzte Netz für den Fall, dass gar nichts antwortet.
 */
export default defineNuxtPlugin(async () => {
  if (useIsTenantHost()) return

  const gate = useOnboardingGate()
  try {
    gate.value = resolveOnboardingGate(await $fetch('/api/onboarding/gate'))
  }
  catch {
    // Der Fail-safe steht bereits im Startwert — eine unerreichbare Auskunft
    // darf keine Seite mitreißen.
  }
})
