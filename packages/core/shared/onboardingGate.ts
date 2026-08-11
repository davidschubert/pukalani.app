/**
 * Das Tor vor dem GRÜNDEN einer Community — als EINE pure Regel (U2,
 * 2026-08-10, Davids Entscheidung 1 der UX-Planungsrunde).
 *
 * Die Einladungscode-Pflicht bleibt, bekommt aber einen Schalter im
 * Betreiber-Dashboard: abschalten soll kein Deploy sein. Der Zustand reist
 * damit über drei Prozessgrenzen (Control Plane → Platform → Marketing), und
 * an jeder davon kann er ausbleiben — Netz weg, Dienst neu gestartet, Spalte
 * noch nicht migriert.
 *
 * DESHALB IST DIE REGEL NEGATIV FORMULIERT: geöffnet wird das Tor nur durch
 * ein AUSDRÜCKLICHES `false`. Alles andere — fehlend, `null`, `undefined`, ein
 * Text, ein kaputter Umschlag, ein Zeitüberlauf — heißt „Einladung nötig".
 * Ein Fehlschlag darf die Selbstbedienung öffnen, ohne dass es jemand
 * bemerkt; umgekehrt fällt es sofort auf (der Kunde steht wieder vor dem
 * Code-Feld) und kostet nichts als eine Wiederholung.
 *
 * KEIN Import, keine Laufzeit-Abhängigkeit: dieselbe Datei rechnet im Control
 * Plane (aus der app_config-Spalte), in der Platform-App (aus der Antwort der
 * Service-Naht) und im Marketing-Server (aus der Antwort des öffentlichen
 * GET). Drei Leser, eine Regel — sonst läuft die Landing irgendwann anders als
 * das Anlegen.
 */

export interface OnboardingGateState {
  /** true = für eine EIGENE Community braucht es einen Einladungs-Code. */
  inviteRequired: boolean
}

/** Der Zustand, der bei jeder Unklarheit gilt. */
export const FAILSAFE_ONBOARDING_GATE: OnboardingGateState = { inviteRequired: true }

/**
 * Die Regel selbst — für Leser, die den Rohwert schon in der Hand haben
 * (app_config-Spalte, Query-Ergebnis).
 */
export function onboardingInviteRequired(flag: unknown): boolean {
  return flag !== false
}

/**
 * Dieselbe Regel für einen ganzen Umschlag von irgendwoher (JSON aus einem
 * fremden Dienst). Was nicht wie `{ inviteRequired: false }` aussieht, ist
 * das Tor MIT Einladung.
 */
export function resolveOnboardingGate(raw: unknown): OnboardingGateState {
  if (typeof raw !== 'object' || raw === null) return { ...FAILSAFE_ONBOARDING_GATE }
  return { inviteRequired: onboardingInviteRequired((raw as { inviteRequired?: unknown }).inviteRequired) }
}
