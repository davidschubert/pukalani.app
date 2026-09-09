import type { Models } from 'node-appwrite'

/**
 * Basis für Domain-Types in Produkt Layern und Apps:
 *   interface Comment extends AppwriteRow { text: string; … }
 * Liegt in shared/ — sichtbar für app/ UND server/.
 */
export type AppwriteRow = Models.Row

/**
 * User-Profildaten leben in den Account-prefs — keine profiles Table (A1).
 * Apps können den Typ per Declaration Merging um eigene prefs erweitern.
 */
export interface PukalaniUserPrefs extends Models.Preferences {
  bio?: string
  avatarUrl?: string
  /** IANA-Zone für die Datums-/Zeit-Anzeige; '' oder fehlend = automatisch */
  timezone?: string
  /**
   * Wann diesem Konto die AGB vorgelegt wurden und es zugestimmt hat (ISO) —
   * gesetzt bei der Anlage, nur in Apps mit `pukalani.auth.termsUrl`
   * (BS1 R1, Regel in shared/termsAcceptance.ts). Fehlt bei jedem Konto von
   * VOR dieser Änderung; die Nachfrage dafür kommt mit Fassung 2 (R3).
   */
  termsAcceptedAt?: string
  /** Die Fassung dazu (`pukalani.auth.termsVersion`); '' = keine benannt. */
  termsVersion?: string
  /**
   * Wann dieses Konto bestätigt hat, als Unternehmer/in oder Selbstständige/r
   * zu handeln (ISO) — gesetzt bei der Anlage, nur in Apps mit
   * `pukalani.auth.businessOnly` (BS1 R1c, Regel in
   * shared/businessConfirmation.ts). BEWUSST OHNE Fassungsfeld: hier wird
   * keinem Text zugestimmt, sondern eine Eigenschaft der Person erklärt.
   * Fehlt bei jedem Konto von VOR dieser Änderung.
   */
  businessConfirmedAt?: string
}

export type CurrentUser = Models.User<PukalaniUserPrefs>
