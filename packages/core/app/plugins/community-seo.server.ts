/**
 * Sucheinstellung → Client (U15 Teil 2): der Wert lebt in `event.context`
 * (gesetzt von server/middleware/09.community-seo.ts, also nur beim
 * Seiten-SSR). Dieser Plugin spiegelt ihn einmalig in einen `useState`, der
 * über den Nuxt-Payload zum Client reist.
 *
 * WARUM NICHT IM `tenant-brand.server.ts` NEBENAN, wo das „Spiegel-Inventar"
 * steht: die Werte dort kommen ALLE aus `event.context.tenant`, also aus dem
 * Control Plane. Dieser hier kommt aus dem RUNTIME-Projekt (Table
 * `community_seo`, system-034) und wird von einer anderen Middleware
 * aufgelöst. Ihn dort einzuhängen hiesse, ein Inventar mit einer zweiten
 * Herkunft zu vermischen — und beim nächsten Lesen zu glauben, auch dieser
 * Wert käme mit dem Mandanten mit.
 *
 * Es gilt trotzdem dieselbe Regel wie für dieses Inventar: gespiegelt wird
 * GENAU, was clientseitig gelesen wird, und nur, was ohnehin öffentlich im
 * HTML steht (Begründung + die zwei Leser: `useCommunitySeo.ts`).
 *
 * `undefined` (API-Pfad, kein Mandant) und `null` (keine eigene Wahl) werden
 * beide zu `null` — für den Kopf bedeuten sie dasselbe.
 */
import type { CommunitySeoSettings } from '../../shared/communitySeo'

export default defineNuxtPlugin(() => {
  const event = useRequestEvent()
  useState<CommunitySeoSettings | null>('pukalani-community-seo', () => event?.context.communitySeo ?? null)
})
