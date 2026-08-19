/**
 * Hochgeladenes Favicon → Client (Community-Favicon-Upload): der Wert lebt in
 * `event.context` (gesetzt von server/middleware/10.community-favicon.ts, also
 * nur beim Seiten-SSR). Dieser Plugin spiegelt ihn einmalig in einen `useState`,
 * der über den Nuxt-Payload zum Client reist.
 *
 * WARUM EIGENER STATE UND NICHT MIT `community-seo.server.ts` GEBÜNDELT: es ist
 * ein anderer Wert aus einer anderen Ablage (Storage-Bucket `favicons`,
 * system-037) und wird von einer anderen Middleware aufgelöst. Ihn dazuzulegen
 * hieße, zwei Herkünfte zu vermischen — dieselbe Begründung wie dort für die
 * Trennung vom „Spiegel-Inventar".
 *
 * KEIN GEHEIMNIS: der Wert ist ein Datei-Zeitstempel, aus dem der Kopf eine
 * öffentliche Icon-URL baut — er steht ohnehin als `<link>` im HTML jeder Seite.
 *
 * `undefined` (API-Pfad, kein Mandant) und `null` (kein eigenes Favicon) werden
 * beide zu `null` — für den Kopf bedeuten sie dasselbe (generiertes Icon gilt).
 */
export default defineNuxtPlugin(() => {
  const event = useRequestEvent()
  useState<{ updatedAt: string } | null>('pukalani-community-favicon', () => event?.context.communityFavicon ?? null)
})
