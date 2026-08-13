import type { H3Event } from 'h3'
import { PAGES_TABLE, type PageRow } from '../../shared/types/page'

/**
 * Community-Export des pages-Layers (Vertrag: core/server/utils/communityExport.ts).
 *
 * Die Inhaltsseiten dieser Community, je Sprachversion eine Zeile — Regeln,
 * Rechtstexte, der About-Text, alles, was der Owner im Dashboard geschrieben
 * hat. `updatedAt` kommt aus `$updatedAt`: bei einer redaktionellen Seite gibt
 * es keine zweite Wahrheit darüber, wann zuletzt jemand daran war.
 *
 * Personenbezug gibt es hier von Haus aus keinen — eine Seite hat keinen Autor
 * in der Zeile. Entsprechend steht auch nichts drin, was hier ausgelassen
 * werden müsste.
 */
export async function pagesCommunityExport(event: H3Event) {
  /**
   * Warum der Admin-Client: ENTWÜRFE (`status: 'draft'`) sind für ein
   * gewöhnliches Mitglied nicht lesbar — genau sie will der Owner in seinem
   * Archiv aber haben, denn an ihnen hat er gearbeitet. Mit der
   * Mitglieder-Klinke wären sie lautlos verschwunden, und ein Bündel, das
   * vollständig aussieht, aber die halbe Redaktion unterschlägt, ist schlimmer
   * als ein Fehlschlag. Die Datentür bleibt dabei der Mandanten-Filter: sie
   * hängt ihn an jede Abfrage, und mit dem Admin-Client ist sie bewusst die
   * EINZIGE Grenze — dieselbe Abwägung wie in der Moderation (Präzedenz:
   * `packages/posts/server/utils/seedWelcomePost.ts`).
   *
   * `actor: 'member'` benennt den Handelnden richtig: der Owner ist ein
   * Mitglied dieser Community. Geschrieben wird nichts, die M13-Inhalts-Sperre
   * greift also nie — die ehrliche Angabe hält die C1c-Regel trotzdem intakt
   * (`as` ist die Technik, `actor` die Fachlichkeit).
   */
  const db = tenantDb(event, { as: 'operator', actor: 'member' })

  // Die einzige Tabelle dieses Layers ist zugleich sein Inhalt — hier wird
  // NICHT abgefangen: ein Lesefehler muss den Export scheitern lassen.
  const pages = await collectTenantRows<PageRow>(db, PAGES_TABLE)

  return {
    pages: pages.map(p => ({
      id: p.$id,
      createdAt: p.$createdAt,
      updatedAt: p.$updatedAt,
      slug: p.slug,
      locale: p.locale,
      title: p.title,
      body: p.body,
      status: p.status,
      sortOrder: p.sortOrder,
    })),
    counts: {
      pages: pages.length,
    },
  }
}
