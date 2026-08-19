/**
 * Hochgeladenes Favicon der Community fürs Seiten-SSR (Community-Favicon-Upload)
 * — läuft nach Dateiname NACH 09.community-seo.ts. Die Zahl-Präfixe sind seit
 * E8-4 Pflicht: Nitro sortiert die Middleware lexikografisch.
 *
 * Warum diese Middleware existiert: das theme-Plugin (packages/themes) muss beim
 * Kopf-Aufbau wissen, ob die Community ein eigenes Favicon hat — dann verlinkt
 * es dessen Icon-Key (`uploadedBrandIconKey`) statt des generierten und
 * unterdrückt das `/favicon.svg`. Der Kopf entsteht beim SSR jeder Seite; der
 * Wert muss also VORHER in `event.context` stehen. Der App-Plugin
 * `community-favicon.server.ts` spiegelt von hier in den Payload, das Composable
 * `useCommunityFavicon()` liest ihn im Plugin.
 *
 * BEWUSST NUR Seiten-SSR (dieselbe Grenze wie 09.community-seo.ts):
 * /api/*-Routen bauen keinen Kopf, interne Pfade (/_nuxt, /_i18n, …) erst recht
 * nicht. Der Auslieferungspfad `/icon/<key>.png` liest die Datei ohnehin
 * SELBST (readCommunityFavicon in der Route) — er braucht diesen Spiegel nicht,
 * also gehört er hier nicht mitgeschleppt.
 *
 * KOSTEN: ein Appwrite-Lesezugriff je Community und 30 Sekunden
 * (`readCommunityFavicon` cacht mandanten-gescopt, auch das leere Ergebnis).
 * Dieselbe Größenordnung wie die SEO-Auflösung eine Datei darüber.
 *
 * Fail-soft: `readCommunityFavicon` wirft nicht (s. dort). Ohne Mandant — Silo,
 * Kontroll-Host, Playground — passiert hier gar nichts, und der Kopf bleibt
 * exakt der von vor diesem Feature.
 */
export default defineEventHandler(async (event) => {
  const communityId = event.context.tenant?.communityId
  if (!communityId) return

  const path = event.path.split('?')[0] ?? ''
  if (path.startsWith('/api/') || path.startsWith('/_')) return

  event.context.communityFavicon = await readCommunityFavicon(event, communityId)
})
