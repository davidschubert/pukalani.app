/**
 * Verdrahtet den core-Vertrag `registerDependencyTicketCreator`
 * (core/server/utils/dependencyTicket.ts, CONCEPT A14) — läuft einmal beim
 * Serverstart. Erst dadurch zeigt die Systemseite ihren Knopf: der admin-Layer
 * kennt tickets nicht und fragt nur, ob IRGENDWER den Vertrag bedient.
 */
export default defineNitroPlugin(() => {
  registerDependencyTicketCreator(async (event, input) => {
    const row = await createTicketFromDependency(event, input)

    /**
     * KI-Triage als BEIGABE, nicht als Bedingung. Das Ticket steht schon; ein
     * KI-Ausfall (kein Schlüssel, Modell überlastet, Netz weg) darf den Knopf
     * nicht rot machen. Deshalb: nur wenn KI überhaupt konfiguriert ist, NICHT
     * awaiten (der Aufrufer soll nicht Sekunden auf ein Modell warten) und
     * jeden Fehler ausschließlich ins Server-Log. Wer die Einschätzung
     * vermisst, drückt auf der Karte den Triage-Knopf.
     */
    try {
      const ai = await getEffectiveTicketsAiConfig(event)
      if (ai.enabled) {
        triageTicket(event, row.$id).catch((error: unknown) => {
          console.warn('[tickets] KI-Triage des Update-Tickets fehlgeschlagen:', error)
        })
      }
    }
    catch (error) {
      console.warn('[tickets] KI-Konfiguration für die Triage nicht lesbar:', error)
    }

    return { ticketId: row.$id }
  })
})
