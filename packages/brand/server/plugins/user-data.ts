import { BRAND_USER_DATA_ID, brandDeleteUserData, brandExportUserData } from '../utils/brandUserData'

/**
 * Registriert den GDPR-Contributor des brand-Layers beim core-Vertrag
 * (`UserDataContributor`, CONCEPT A14) — läuft einmal beim Serverstart.
 *
 * PFLICHT für jeden Layer mit User-Daten (CLAUDE.md). Die Registry ist
 * automatisch richtig besetzt: eine App ohne `brand` im `extends` lädt dieses
 * Plugin nicht, und dann gibt es auch keine brand-Daten zu exportieren.
 */
export default defineNitroPlugin(() => {
  registerUserDataContributor({
    id: BRAND_USER_DATA_ID,
    exportUserData: brandExportUserData,
    deleteUserData: brandDeleteUserData,
  })
})
