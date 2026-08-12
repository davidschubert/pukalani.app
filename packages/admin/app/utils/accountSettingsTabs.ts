/**
 * DIE FÜNF KONTO-REITER — an EINER Stelle (U7/E8, 2026-08-11).
 *
 * Sie gehören dem admin-Layer selbst: er bringt die Hülle
 * (`packages/admin/app/pages/dashboard/settings.vue`) mit, und ein
 * Registry-Umweg zu sich selbst brächte nichts (settings-tab.ts). Bis hierher
 * standen sie deshalb direkt in der Hülle — was richtig war, solange NUR die
 * Hülle sie brauchte.
 *
 * Seit die Suche (⌘K) auch Reiter findet, gibt es einen zweiten Leser: das
 * Dashboard-Layout. Zwei Listen für dieselben fünf Reiter wären genau die
 * Doppelpflege, aus der ein „Reiter, den die Suche nicht kennt" entsteht —
 * also liegt die Liste hier, und beide lesen sie.
 *
 * Nur ANZEIGE: die Autorität bleibt `requiredCapability` in der Page-Meta
 * jedes Kindes. Diese fünf tragen keine — jeder Angemeldete darf sein eigenes
 * Konto verwalten, das ist die Bedeutung von `scope: 'account'`.
 */
export interface AccountSettingsTab {
  /** i18n-Key des Reiter-Labels */
  labelKey: string
  /** Icon (i-ph-…) */
  icon: string
  /** Ziel-Pfad OHNE Locale-Prefix — der Leser wendet localePath() an */
  to: string
  /** Nur der Index: ohne `exact` bliebe er auf jedem Geschwister mit aktiv */
  exact?: boolean
}

export const ACCOUNT_SETTINGS_TABS: readonly AccountSettingsTab[] = [
  { labelKey: 'dashboard.settings.general', icon: 'i-ph-user', to: '/dashboard/settings', exact: true },
  { labelKey: 'dashboard.settings.notifications', icon: 'i-ph-bell', to: '/dashboard/settings/notifications' },
  { labelKey: 'dashboard.settings.sessions', icon: 'i-ph-devices', to: '/dashboard/settings/sessions' },
  { labelKey: 'dashboard.settings.security', icon: 'i-ph-shield', to: '/dashboard/settings/security' },
  // „Daten" ist seit AH-2 (2026-08-11) der fünfte: Datenexport und
  // Konto-Löschung lagen unter „Sicherheit" (Audit-Befund M10). Dieselbe
  // Aufteilung trägt die Konto-Hülle auf account.pukalani.app — die Reiter
  // sind an beiden Orten dieselbe Antwort auf dieselbe Frage.
  { labelKey: 'dashboard.settings.data', icon: 'i-ph-database', to: '/dashboard/settings/data' },
]
