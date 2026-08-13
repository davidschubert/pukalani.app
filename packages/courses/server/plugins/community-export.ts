/**
 * Registriert den Community-Export des courses-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'courses',
    exportCommunityData: coursesCommunityExport,
  })
})
