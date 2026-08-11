/**
 * Registriert den Aktivitäts-Contributor des posts-Layers beim core-Vertrag
 * (AccountActivityContributor, AH-3) — läuft einmal beim Serverstart.
 */
export default defineNitroPlugin(() => {
  registerAccountActivityContributor({
    id: 'posts',
    listAccountActivity: postsListAccountActivity,
  })
})
