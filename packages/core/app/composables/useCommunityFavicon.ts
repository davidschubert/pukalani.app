/**
 * Hochgeladenes Favicon DIESER Community (Community-Favicon-Upload) —
 * SSR-gespiegelt vom `community-favicon.server.ts`-Plugin, reist im Payload.
 *
 * Drei Zustände, und der dritte ist wieder der wichtige (Muster
 * useCommunitySeoSettings):
 *   { updatedAt } = Mandanten-Host MIT eigenem Favicon
 *   null          = Mandanten-Host OHNE eigenes Favicon (der Normalfall)
 *   null          = KEIN Mandanten-Host (Silo, Kontroll-Host, Playground)
 * Die letzten beiden sehen für den Kopf gleich aus: ohne eigenes Favicon gilt
 * das generierte Icon, und ohne Community gibt es keins zu setzen.
 *
 * LESER ist das theme-Plugin (packages/themes): ist ein Favicon da, verlinkt es
 * `uploadedBrandIconKey(updatedAt)` als App-Icon und unterdrückt das generierte
 * `/favicon.svg`. Er braucht ihn SSR-fest — ein Client-Nachtrag käme für das
 * Kopf-Markup zu spät.
 */
export function useCommunityFavicon() {
  return useState<{ updatedAt: string } | null>('pukalani-community-favicon', () => null)
}
