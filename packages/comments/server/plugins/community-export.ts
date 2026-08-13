/**
 * Registriert den Community-Export des comments-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'comments',
    exportCommunityData: commentsCommunityExport,
  })
})
