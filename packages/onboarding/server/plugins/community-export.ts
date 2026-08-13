import { communityTeamExportData } from '../utils/communityTeamExport'

/**
 * Registriert den U20-Contributor des onboarding-Layers beim core-Vertrag
 * (CommunityExportContributor, CONCEPT A14) — läuft einmal beim Serverstart.
 *
 * Der Layer besitzt keine eigene Tabelle: das Team liegt im Control Plane und
 * wird über die Naht dieses Layers gelesen. Dieselbe Bauart wie der
 * GDPR-Contributor nebenan (server/plugins/user-data.ts); WAS genau ins Bündel
 * geht und was ausdrücklich nicht, steht in server/utils/communityTeamExport.ts.
 *
 * Die Id lautet `community` und nicht `onboarding`: sie wird zum
 * SCHLÜSSEL im Bündel (`data.community`), und dort liest ein Mensch mit, der
 * unsere Layer-Namen nicht kennt.
 */
export default defineNitroPlugin(() => {
  registerCommunityExportContributor({
    id: 'community',
    exportCommunityData: communityTeamExportData,
  })
})
