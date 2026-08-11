import {
  FAILSAFE_ONBOARDING_GATE,
  resolveOnboardingGate,
  type OnboardingGateState,
} from '../../../../core/shared/onboardingGate'
import { callControlPlane } from '../../utils/controlPlane'

/**
 * Braucht eine eigene Community einen Einladungs-Code? — öffentlich (U2).
 *
 * DIE EINZIGE AUSKUNFT DIESER ART OHNE SESSION, und das ist Absicht: die
 * Marketing-Landing sagt jedem Besucher, was ihn erwartet (Davids Entscheidung
 * 8 vom 2026-08-10), und die Register-Seite tut dasselbe für Ausgeloggte. Es
 * gibt hier nichts zu schützen — die Antwort ist ein einzelnes Ja/Nein, das
 * ohnehin auf der Startseite steht.
 *
 * ERREICHBAR AUF DEM KONTROLL-HOST ohne Änderung an
 * `pukalani.tenancy.controlApiPrefixes`: die Route liegt bewusst unter dem
 * bereits freigegebenen Präfix `/api/onboarding/` (01.control-center.ts). Wer
 * hier einen Endpunkt AUSSERHALB dieses Präfixes anlegt, muss ihn dort
 * eintragen — sonst antwortet er auf my./start. mit 404.
 *
 * MICROCACHE STATT DURCHREICHEN: user-agnostisch, also genau der Fall, für den
 * createMicrocache gebaut ist. 60 s ist die Obergrenze aus dem Auftrag und
 * gleichzeitig die Zeit, die ein Betreiber nach dem Umlegen des Schalters
 * höchstens wartet. GECACHT WIRD NUR EIN ERFOLG: ein Fehlschlag würde sonst
 * eine Minute lang die Einladungs-Variante festhalten, obwohl das Control
 * Plane längst wieder antwortet.
 */
const GATE_TTL_MS = 60_000
const CACHE_KEY = 'onboarding-gate'
const cache = createMicrocache<OnboardingGateState>(GATE_TTL_MS)

export default defineEventHandler(async (event): Promise<OnboardingGateState> => {
  const hit = cache.get(CACHE_KEY)
  if (hit) return hit

  try {
    const raw = await callControlPlane<unknown>(event, '/api/control/onboarding/gate', {})
    const state = resolveOnboardingGate(raw)
    cache.set(CACHE_KEY, state)
    return state
  }
  catch (error) {
    // Kein 503 nach außen: der Aufrufer will eine Landing rendern, keine
    // Fehlerseite. Was er bekommt, ist der ehrliche Rückfall — „Einladung
    // nötig" — und der Grund steht im Log.
    logEvent('warn', 'onboarding.gate_unavailable', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { ...FAILSAFE_ONBOARDING_GATE }
  }
})
