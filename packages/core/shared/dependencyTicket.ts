/**
 * „Prüfen, ob wir updaten können" — der pure Vertrag zwischen der Systemseite
 * (admin) und dem Ticket-Board (tickets).
 *
 * Nur die GESTALT der Frage steht hier: welches Paket, von welcher Version auf
 * welche. Der TEXT des Tickets (Titel, Fragenkatalog, bekannte Fallen) gehört
 * dem tickets-Layer — er kennt sein eigenes Format; die Registry daneben
 * (server/utils/dependencyTicket.ts) verbindet beide, ohne dass admin je
 * tickets kennen müsste (CONCEPT.md A14).
 *
 * Der Typ liegt in `shared/`, weil beide Seiten ihn brauchen und keine von
 * beiden dafür in ein `server/`-Verzeichnis der anderen greifen soll — dasselbe
 * Muster wie bei communityJoin (pure Gestalt in shared, Registry in
 * server/utils).
 */

export type DependencyTicketKind =
  /** Ein npm-Paket aus dem pnpm-Catalog. */
  | 'package'
  /** Die Appwrite-Serverversion der Instanz — kein npm-Paket. */
  | 'appwrite'

export interface DependencyTicketInput {
  kind: DependencyTicketKind
  /**
   * Paketname wie im Catalog (`nuxt`, `@nuxt/ui`, …). Bei `kind: 'appwrite'`
   * fest `appwrite-server` — gesetzt vom AUFRUFER, damit der Dedup-Schlüssel
   * dieselbe Gestalt hat wie bei einem Paket und nicht mit dem npm-Paket
   * `appwrite` (Web-SDK) kollidiert, das es wirklich gibt.
   */
  name: string
  /** Installierte/laufende Version. */
  from: string
  /** Zielversion (npm `latest` bzw. neuestes Appwrite-Release). */
  to: string
}
