/**
 * Registriert den Aktivitäts-Contributor des events-Layers beim core-Vertrag
 * (AccountActivityContributor, AH-3) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerAccountActivityContributor({
    id: 'events',
    listAccountActivity: eventsListAccountActivity,
  })
})
