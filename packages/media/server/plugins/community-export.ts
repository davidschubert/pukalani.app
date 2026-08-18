/**
 * Registriert den Community-Export des media-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'media',
    exportCommunityData: mediaCommunityExport,
  })
})
