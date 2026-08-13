/**
 * Registriert den Community-Export des pages-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'pages',
    exportCommunityData: pagesCommunityExport,
  })
})
