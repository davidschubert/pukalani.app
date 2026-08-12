import type { Models } from 'node-appwrite'

/**
 * Die Tabelle gehört dem `system`-Layer (Migration system-029), der Zugriff
 * liegt in core/server/utils/handles.ts. Das ist DASSELBE Muster wie bei den
 * Benachrichtigungen: `notify()` lebt in core, die Tabelle `notifications`
 * bringt system-003 mit. Core besitzt weiterhin KEINE Tabelle (A14) — es
 * benutzt eine, die auf jeder Instanz vorhanden ist.
 *
 * WARUM system UND NICHT posts: ein Handle ist keine Eigenschaft von
 * Beiträgen. Kommentare, Beiträge und später jede andere Schreibfläche
 * brauchen dieselben Namen, und ein `comments`, das dafür von `posts`
 * abhängen müsste, wäre genau die Kreuz-Abhängigkeit, die A14 verbietet.
 * WARUM NICHT das Control Plane, wo `community_members` liegt: der Handle
 * muss zur LAUFZEIT beim Rendern eines Beitrags lesbar sein, und dort hat das
 * Runtime-Projekt keinen Schlüssel — dieselbe Grenze wie bei
 * `revokeCommunityLabel` (A5).
 */
export const HANDLES_TABLE = 'community_handles'

/**
 * DAS KONTO-WEITE REGISTER (AH-7, Migration system-031) — seit 2026-08-11 die
 * WAHRHEIT über Namen. Eine Pukalani-ID hat EINEN @namen, überall (Davids
 * Entscheidung, DECISION-LOG 2026-08-11 Punkt 11).
 *
 * `community_handles` daneben ist ab jetzt ALT-BESTAND: es werden dort keine
 * Namen mehr vergeben, die Zeilen bleiben aber stehen und lösen alte
 * Erwähnungen weiter auf (Lese-Fallback, zweite Stufe der Kette in
 * core/server/utils/handles.ts). Löschen würde Erwähnungen in Bestands-
 * Beiträgen ins Leere laufen lassen — und zwar unbemerkt, weil eine
 * ausbleibende Hervorhebung niemandem auffällt.
 */
export const ACCOUNT_HANDLES_TABLE = 'account_handles'

export type HandleStatus
  = /** Der aktuelle Name dieser Person in dieser Community. */
  | 'active'
  /**
   * Ein FRÜHERER Name derselben Person. Er bleibt stehen und belegt weiterhin
   * den eindeutigen Index — das ist die Umsetzung von „der alte Handle bleibt
   * gesperrt" (Davids Entscheidung 3), und zwar als HISTORIE statt als
   * Sperrliste: eine Erwähnung in einem alten Beitrag löst dadurch weiterhin
   * auf DIESELBE Person auf, statt ins Leere zu laufen.
   */
  | 'former'

/**
 * Eine Zeile des KONTO-weiten Registers. Dieselben Felder wie die
 * Community-Zeile — MINUS `communityId`, und genau das ist die ganze
 * Änderung von AH-7: der eindeutige Index trägt nur noch `handleLower`,
 * also gilt ein Name in der ganzen Instanz.
 *
 * Das Lese-Publikum steht deshalb nicht mehr in einer Spalte, sondern in den
 * Row-Permissions (eine `read("label:<communityId>")` je Mitgliedschaft) —
 * Regeln und Begründung: core/shared/accountHandleAudience.ts.
 */
export interface AccountHandleRow extends Models.Row {
  userId: string
  /** Die vom Menschen gewählte Schreibweise — so wird sie angezeigt. */
  handle: string
  /** Vergleichsform (klein). Trägt den GLOBALEN eindeutigen Index. */
  handleLower: string
  status: HandleStatus
  /** Wann diese Zeile zur AKTIVEN wurde; '' = automatisch vergeben. */
  changedAt: string
}

export interface CommunityHandleRow extends Models.Row {
  /** Pool-Mandant; im Silo ''. Erste Spalte JEDES Index (Pool-Regel). */
  communityId: string
  userId: string
  /** Die vom Menschen gewählte Schreibweise — so wird sie angezeigt. */
  handle: string
  /** Vergleichsform (klein). Trägt den eindeutigen Index. */
  handleLower: string
  status: HandleStatus
  /**
   * Wann diese Zeile zur AKTIVEN wurde. Basis der 30-Tage-Sperrfrist; bei der
   * ersten, automatisch vergebenen Zeile bewusst LEER, damit die erste
   * Änderung nicht durch die Vergabe verbraucht ist.
   */
  changedAt: string
}
