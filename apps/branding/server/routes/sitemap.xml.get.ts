import type { H3Event } from 'h3'
import {
  BRANDING_DISCOVER_PRIORITY,
  BRANDING_ROUTES,
  type BrandingSitemapEntry,
  brandingBaseUrl,
  brandingSitemapXml,
} from '../utils/brandingSitemap'

/**
 * sitemap.xml — bewusst als schlanke Server-Route statt per Extra-Modul
 * (Muster `apps/marketing`, `apps/portfolio`): eine geführte Liste plus zwanzig
 * Zeilen XML ist ehrlicher als ein Generator, der bei einer neuen Seite still
 * das Falsche ausliefert. Die Liste und das XML wohnen in
 * `server/utils/brandingSitemap.ts` — hier stehen nur Daten, Origin und Header.
 *
 * ── DIE ANATOMIEN KOMMEN AUTOMATISCH DAZU (Discover D4) ──────────────────
 * Jede öffentliche Marke ist eine Seite mit echtem Inhalt — das IST die Ebene
 * „Discover" (Plan §1). Gelesen wird über `listPublishedBrandPublications()`,
 * also über dieselbe Regel wie die Galerie selbst (`status`-Filter UND
 * `brandPublicationIsVisible`): eine zurückgezogene oder ausgeblendete Marke
 * antwortet 404, und eine Sitemap darf nur Adressen anbieten, die es gibt.
 *
 * `lastmod` steht NUR an den Anatomien, und es ist ein ECHTES Datum aus der
 * Zeile (`updatedAt`, sonst `publishedAt`). Die festen Seiten tragen keins:
 * ein erfundenes ist schlechter als keins.
 *
 * ── FAIL-SOFT: DIE FESTEN SEITEN KOMMEN IMMER ────────────────────────────
 * Fällt der Read aus (Instanz weg, Tabelle fehlt vor brand-020), bleibt die
 * Sitemap bei den festen Routen. Eine kürzere Sitemap ist besser als ein 500
 * auf einer Crawler-URL — dieselbe Entscheidung wie in `apps/platform` und
 * `apps/portfolio`. Gemeldet wird es trotzdem, sonst verschwindet die halbe
 * Site still aus dem Index.
 */
export default defineEventHandler(async (event) => {
  const base = brandingBaseUrl(event)

  const entries: BrandingSitemapEntry[] = [
    ...BRANDING_ROUTES,
    ...(await discoverEntries(event)),
  ]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  // Öffentlich + user-agnostisch → darf ruhig am Edge/Proxy liegen.
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return brandingSitemapXml(base, entries)
})

/**
 * Die sichtbaren Anatomien als Sitemap-Einträge, alphabetisch nach Slug.
 *
 * Sortiert wird bewusst nach dem SLUG und nicht nach dem Datum: die Sitemap
 * ist ein Verzeichnis, keine Zeitleiste, und eine stabile Reihenfolge macht
 * ein Diff zweier Abrufe lesbar. Die Zeilen selbst kommen aus dem Fenster der
 * Galerie (500) — mehr Anatomien gibt es dort auch nicht zu sehen.
 */
async function discoverEntries(event: H3Event): Promise<BrandingSitemapEntry[]> {
  try {
    const rows = await listPublishedBrandPublications(event)
    return rows
      .filter(row => typeof row.slug === 'string' && row.slug.length > 0)
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map(row => ({
        path: `/discover/${row.slug}`,
        priority: BRANDING_DISCOVER_PRIORITY,
        // Das jüngere der beiden echten Daten. `$updatedAt` bleibt draußen: es
        // wandert auch, wenn nur ein Meldungs-Zähler hochgezählt wurde, und
        // das ist keine Änderung am INHALT der Seite.
        lastmod: row.updatedAt || row.publishedAt || '',
      }))
  }
  catch (error) {
    logEvent('warn', 'branding.sitemap_discover_unavailable', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}
