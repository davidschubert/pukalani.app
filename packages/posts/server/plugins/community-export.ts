/**
 * Registriert den Community-Export des posts-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'posts',
    exportCommunityData: postsCommunityExport,
  })
})
