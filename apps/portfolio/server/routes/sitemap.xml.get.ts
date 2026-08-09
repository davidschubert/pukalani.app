import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { PAGES_TABLE, type PageRow } from '../../../../packages/pages/shared/types/page'
import { escapeXmlText, siteRequestOrigin } from '../utils/siteRequestOrigin'
import { dePathFor, SITE_ROUTES } from '../utils/siteRoutes'

/**
 * sitemap.xml — bewusst als schlanke Server-Route statt per Extra-Modul
 * (Muster `apps/marketing`): eine geführte Liste plus zwanzig Zeilen XML ist
 * hier ehrlicher als ein Generator, der bei einer neuen Seite still das
 * Falsche ausliefert.
 *
 * Die feste Liste (inkl. Cases) wohnt in `server/utils/siteRoutes.ts` — sie
 * speist auch llms.txt, damit eine neue Seite nicht in einer der beiden
 * Dateien fehlen kann. Regel beim Erweitern: neue Seite ⇒ dort eintragen.
 *
 * DIE CMS-SEITEN KOMMEN AUTOMATISCH DAZU (Impressum, Datenschutz, was der
 * pages-Layer sonst noch veröffentlicht) — vorher fehlten sie: die Fußzeile
 * verlinkte sie, die Sitemap kannte sie nicht. Gelesen wird wie in
 * `apps/platform/server/routes/sitemap.xml.get.ts`: über die Datentür, mit
 * `status='published'`, also genau das Lese-Muster der öffentlichen
 * pages-Route — Entwürfe verlassen den Server nie.
 *
 * Sprachstruktur: Englisch ohne Präfix (Default), Deutsch unter `/de/*`.
 * `lastmod` bleibt bewusst weg — ein erfundenes Datum ist schlechter als keins.
 * `/en/**` steht NICHT drin: das sind 301-Weiterleitungen aus der alten
 * Struktur, und eine Sitemap darf nur Zieladressen anbieten.
 */

interface SitemapEntry {
  path: string
  priority: number
}

/**
 * Slugs, die in eine Sitemap dürfen. Dieselbe Fail-safe-Wache wie in
 * `apps/platform/server/utils/tenantSitemap.ts`, und aus demselben Grund keine
 * Wiederverwendung der pages-Validierung: käme aus der Tabelle je ein Wert
 * dieser Form NICHT entsprechend (Altbestand, Direkt-Schreiber), wäre die
 * Alternative XML-Escaping — und ein Sitemap-Eintrag, der escaped werden muss,
 * ist ohnehin keine gültige URL.
 */
const SAFE_SLUG = /^[a-z][a-z0-9-]*$/

/**
 * Slugs, die diese Site NICHT als eigene Adresse ausliefert. `home` ist im
 * pages-Layer die Startseite eines Mandanten — hier rendert `/` die
 * handgebaute Landing, eine `/home`-Zeile zeigte also ins Leere.
 */
const CMS_SKIP_SLUGS = new Set(['home'])

/**
 * Slugs der veröffentlichten CMS-Seiten. FAIL-SOFT: fällt der Read aus, bleibt
 * die Sitemap bei den festen Routen — eine kürzere Sitemap ist besser als ein
 * 500 auf einer Crawler-URL (dieselbe Entscheidung wie in platform).
 */
async function publishedCmsPaths(event: H3Event): Promise<string[]> {
  try {
    const res = await tenantDb(event, { as: 'operator' }).list<PageRow>(PAGES_TABLE, [
      Query.equal('status', 'published'),
      // NUR die Slug-Spalte: `body` ist MEDIUMTEXT (bis ~16 MB je Row) und
      // hätte in dieser Abfrage nichts zu suchen.
      Query.select(['slug']),
      // Explizites Limit (Projektregel). 200 Rows = ~100 Slugs in zwei
      // Sprachen — je Sprache eine Row, deshalb wird dedupliziert.
      Query.limit(200),
    ])
    return [...new Set(res.rows.map(row => row.slug))]
      .filter(slug => !CMS_SKIP_SLUGS.has(slug) && SAFE_SLUG.test(slug))
      .sort()
      .map(slug => `/${slug}`)
  }
  catch {
    return []
  }
}

export default defineEventHandler(async (event) => {
  // NICHT `getRequestURL(event).origin` roh: der Host-Header ist Client-
  // Eingabe, und diese Antwort wird eine Stunde lang öffentlich gecacht
  // (siehe `siteRequestOrigin`). Escapen kommt trotzdem obendrauf — `&` ist
  // ein gültiges Host-Zeichen und in XML ohne Entity ein Syntaxfehler.
  const base = escapeXmlText(siteRequestOrigin(event))

  const entries: SitemapEntry[] = [
    ...SITE_ROUTES.map(route => ({ path: route.path, priority: route.priority })),
    // Rechtstexte und andere CMS-Seiten stehen hinten und niedrig gewichtet:
    // sie sind Pflichtseiten, keine Einstiegspunkte.
    ...(await publishedCmsPaths(event)).map(path => ({ path, priority: 0.3 })),
  ]

  const urls = entries.flatMap((entry) => {
    const enUrl = `${base}${entry.path === '/' ? '' : entry.path}`
    const deUrl = `${base}${dePathFor(entry.path)}`
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>`,
      `    <xhtml:link rel="alternate" hreflang="de" href="${deUrl}"/>`,
    ].join('\n')

    return [enUrl, deUrl].map(loc => [
      '  <url>',
      `    <loc>${loc}</loc>`,
      alternates,
      `    <priority>${entry.priority.toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n'))
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  // Öffentlich + user-agnostisch → darf am Edge/Proxy liegen.
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return xml
})
