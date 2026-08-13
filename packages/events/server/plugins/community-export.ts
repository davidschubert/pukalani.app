/**
 * Registriert den Community-Export des events-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'events',
    exportCommunityData: eventsCommunityExport,
  })
})
