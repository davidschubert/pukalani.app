import type { H3Event } from 'h3'
import type { PublicPageNavItem } from '../../shared/types/page'

/**
 * Microcache der ÖFFENTLICHEN Seiten-Liste (`/api/pages/public`).
 *
 * WARUM: die Route läuft bei JEDEM SSR-Seitenaufbau — das blueprint-Layout
 * holt daraus seine Navigation, die Fußzeile von apps/portfolio ihre
 * Rechtslinks. Jede dieser Anfragen ist eine Appwrite-Abfrage über bis zu 50
 * Rows, für eine Antwort, die sich zwischen zwei Redaktionsvorgängen nicht
 * ändert.
 *
 * USER-AGNOSTISCH, und das ist die Bedingung (CLAUDE.md „Microcache"): die
 * Antwort enthält ausschließlich VERÖFFENTLICHTE Seiten und keine
 * Session-Daten. Die Autorisierung (`assertCommunityContentReadable`) bleibt
 * deshalb VOR dem Cache — gecacht wird das Ergebnis, nicht die Erlaubnis.
 *
 * SCHLÜSSEL = MANDANT, WERT = ALLE SPRACHEN. Der Mandanten-Scope ist Pflicht
 * (im Pool teilen sich alle Communities einen Prozess — ein ungescopter
 * Schlüssel gäbe Kunde A die Navigation von Kunde B). Die Sprache steckt
 * bewusst IM Wert statt im Schlüssel: so verwirft ein Redaktionsvorgang mit
 * EINEM `delete` alle Sprachfassungen dieses Mandanten. Ein `clear()` wäre
 * hier falsch, es nähme die Einträge aller anderen Mandanten mit
 * (Begründung an `Microcache.delete`).
 */
const TTL_MS = 30_000

const cache = createMicrocache<Record<string, PublicPageNavItem[]>>(TTL_MS)

/** Der Cache-Eintrag dieses Mandanten in dieser Sprache, wenn er noch gilt. */
export function cachedPublicPages(event: H3Event, locale: string): PublicPageNavItem[] | undefined {
  return cache.get(tenantCacheScope(event))?.[locale]
}

/** Ergebnis merken — die anderen Sprachen desselben Mandanten bleiben stehen. */
export function rememberPublicPages(event: H3Event, locale: string, items: PublicPageNavItem[]): void {
  const scope = tenantCacheScope(event)
  cache.set(scope, { ...cache.get(scope), [locale]: items })
}

/**
 * Nach jedem Schreibvorgang an den Seiten: der neue Stand ist sofort sichtbar,
 * ohne dass jemand 30 Sekunden auf die Ablaufzeit wartet. Die TTL bleibt als
 * Netz für Schreibwege, die nicht durch die Dashboard-Routen gehen (Seeds bei
 * der Provisionierung, Nachrüst-Skripte).
 */
export function forgetPublicPages(event: H3Event): void {
  cache.delete(tenantCacheScope(event))
}
