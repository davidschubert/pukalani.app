import type { H3Event } from 'h3'
import { MEDIA_TABLE, type MediaItem } from '../../shared/types/media'

/**
 * Community-Export des media-Layers (Vertrag: core/server/utils/communityExport.ts).
 *
 * Die Medien-Galerie dieser Community als METADATEN: Titel, Kontextzeile,
 * Alt-Text, Layout-Hinweis, Reihenfolge und die `fileId` als VERWEIS auf die
 * Datei im Bucket. Damit trägt ein Beitrag, der ein Bild referenziert, im
 * Bündel den Kontext, den er meint — und ein späterer Re-Import kann die
 * Zuordnung über die `fileId` wiederfinden.
 *
 * NICHT DRIN: die BINÄRDATEIEN selbst (Davids Entscheidung 2026-08-16). Ein
 * JSON-Export soll Inhalt und Struktur tragen, nicht Megabytes — das Bündel
 * bliebe sonst weder handhabbar noch schnell. Wer die Bilder braucht, holt sie
 * über die `fileId` aus dem Bucket. Konten-Daten fallen ohnehin nicht an:
 * `media_items` trägt seit F29 keine `userId` (und nie eine getragen).
 */
export async function mediaCommunityExport(event: H3Event) {
  /**
   * Betreiber-Klinke wie im events/courses-Export (Präzedenz
   * `eventsCommunityExport`): unveröffentlichte Medien (`published: false`)
   * tragen kein öffentliches Leserecht, ein Session-Client bekäme sie nicht,
   * und im Bündel fehlte lautlos genau der Teil, den der Owner vorbereitet hat.
   * Die Datentür scopet trotzdem jede Abfrage auf diese Community; mit dem
   * Admin-Client ist sie die einzige Grenze. `actor: 'member'`, weil der Owner
   * handelt (der Export schreibt nichts, die M13-Sperre kann nie zuschlagen —
   * den Handelnden dennoch beim Namen nennen ist die C1c-Trennung).
   */
  const db = tenantDb(event, { as: 'operator', actor: 'member' })

  // Haupt-Tabelle, bewusst OHNE `.catch`: sind die Medien nicht lesbar, muss
  // der Export scheitern statt ein leeres Kapitel zu behaupten.
  const items = await collectTenantRows<MediaItem>(db, MEDIA_TABLE)

  return {
    media: items.map(m => ({
      id: m.$id,
      createdAt: m.$createdAt,
      title: m.title,
      subtitle: m.subtitle,
      alt: m.alt,
      fileId: m.fileId,
      featured: m.featured,
      published: m.published,
      sortOrder: m.sortOrder,
    })),
    counts: {
      media: items.length,
    },
  }
}
