/**
 * Registriert den Aktivitäts-Contributor des courses-Layers beim core-Vertrag
 * (AccountActivityContributor, AH-3) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerAccountActivityContributor({
    id: 'courses',
    listAccountActivity: coursesListAccountActivity,
  })
})
