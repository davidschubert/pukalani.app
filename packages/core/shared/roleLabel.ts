import { COMMUNITY_ROLES, type CommunityRole } from './communityAuthz'
import { ROLES } from './authz'

/**
 * WELCHE ROLLE WIRD IM KONTO-MENÜ GENANNT? (Davids Frage 2026-08-17)
 *
 * PUR, damit die Regel geprüft werden kann statt nur beobachtet: die zwei
 * Konto-Menüs (öffentliche Kopfzeile in core, Dashboard-Seitenleiste in admin)
 * sollen dieselbe Antwort geben, und „sieht auf beiden Seiten gleich aus" ist
 * kein Beweis. Die Hülle darum ist `useRoleLabel()`; sie übersetzt nur noch.
 *
 * DIE REIHENFOLGE IST DIE AUSSAGE:
 *  1. COMMUNITY-Rolle, wenn es eine gibt — auf einem Mandanten-Host hängt jede
 *     Sichtbarkeit an ihr. Ein Betreiber MIT Community-Rolle sieht deshalb
 *     diese und nicht sein Label: der Break-Glass ist die Ausnahme, nicht sein
 *     Alltag, und zwei Rollen nebeneinander wären zwei Antworten auf eine Frage.
 *  2. Sonst das globale Operator-Label — auf einem Kontroll-Host, im Silo und
 *     im Playground ist es die einzige Rolle, die es überhaupt gibt.
 *     `admin` schlägt `moderator`, weil `admin` das umfassendere Label ist
 *     (ROLE_CAPABILITIES: admin = ALL_CAPABILITIES); wer beide trägt, ist Admin.
 *  3. Sonst `null` — die Menüs lassen die Zeile dann WEG. „Mitglied" zu
 *     behaupten wäre geraten: ein Konto ohne Rolle auf diesem Host ist kein
 *     Mitglied dieser Community, sondern jemand, der hier nur liest.
 *
 * Unbekannte Werte fallen durch (fail-closed wie überall in dieser Ecke): eine
 * Rolle, die die Matrix nicht kennt, wird nicht genannt — sonst stünde am Ende
 * ein roher i18n-Schlüssel im Menü.
 */
export function roleLabelKey(
  role: CommunityRole | null | undefined,
  labels: readonly string[] | null | undefined,
): string | null {
  if (role && (COMMUNITY_ROLES as readonly string[]).includes(role)) {
    return `community.roles.${role}`
  }
  const held = labels ?? []
  // Reihenfolge aus ROLES (authz.ts: admin vor moderator) statt einer zweiten
  // Liste hier — sonst liefe die Rangfolge auseinander, sobald dort eine
  // Operator-Rolle dazukommt.
  for (const operatorRole of ROLES) {
    if (held.includes(operatorRole)) return `community.operatorRoles.${operatorRole}`
  }
  return null
}
