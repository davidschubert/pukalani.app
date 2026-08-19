import { readOnboardingGate } from '../../../utils/onboardingGate'
import { requireOnboardingCaller } from '../../../utils/onboardingService'

/**
 * Der Tor-Zustand für die Platform-App (U2).
 *
 * POST, obwohl hier nur gelesen wird: die Service-Naht hat GENAU eine Form
 * (`callControlService` → POST mit Secret-Header). Ein zweiter, GET-förmiger
 * Transport neben ihr wäre eine zweite Vertrauensnaht mit eigener
 * Fehlerbehandlung — für kosmetische HTTP-Semantik.
 *
 * KEIN JWT und keine Identität: der Zustand ist nicht geheim. Die Landing
 * zeigt ihn jedem Besucher, genau darum geht es (Davids Entscheidung 8). Das
 * Service-Secret bleibt trotzdem davor — nicht als Geheimnisschutz, sondern
 * damit das Control Plane weiterhin nur mit unseren eigenen Deployments
 * spricht.
 */
export default defineEventHandler(async (event) => {
  await requireOnboardingCaller(event)
  return await readOnboardingGate(event)
})
