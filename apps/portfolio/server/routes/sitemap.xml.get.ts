import { CASES } from '../../app/data/cases'
import { escapeXmlText, siteRequestOrigin } from '../utils/siteRequestOrigin'

/**
 * sitemap.xml — bewusst als schlanke Server-Route statt per Extra-Modul
 * (Muster `apps/marketing`): eine handgeführte Liste plus zwanzig Zeilen XML
 * ist hier ehrlicher als ein Generator, der bei einer neuen Seite still das
 * Falsche ausliefert.
 *
 * Die Cases kommen aus derselben typisierten Liste wie die Seiten
 * (`app/data/cases.ts`) — ein neuer Case erscheint damit automatisch, ohne
 * dass jemand daran denken muss. Für die festen Seiten gilt die Regel:
 * neue Seite ⇒ hier eintragen.
 *
 * Sprachstruktur: Englisch ohne Präfix (Default), Deutsch unter `/de/*`.
 * `lastmod` bleibt bewusst weg — ein erfundenes Datum ist schlechter als keins.
 * `/en/**` steht NICHT drin: das sind 301-Weiterleitungen aus der alten
 * Struktur, und eine Sitemap darf nur Zieladressen anbieten.
 */

interface SitemapRoute {
  /** Pfad in der EN-Default-Locale (ohne Präfix). */
  path: string
  priority: number
}

const ROUTES: SitemapRoute[] = [
  { path: '/', priority: 1.0 },
  { path: '/ux-audit', priority: 0.9 },
  { path: '/nuxt-entwickler-freelancer', priority: 0.8 },
  { path: '/wissen/was-kostet-ux-design', priority: 0.8 },
  { path: '/wissen/freelancer-oder-agentur', priority: 0.8 },
  ...CASES.map(entry => ({ path: `/cases/${entry.slug}`, priority: 0.6 })),
]

export default defineEventHandler((event) => {
  // NICHT `getRequestURL(event).origin` roh: der Host-Header ist Client-
  // Eingabe, und diese Antwort wird eine Stunde lang öffentlich gecacht
  // (siehe `siteRequestOrigin`). Escapen kommt trotzdem obendrauf — `&` ist
  // ein gültiges Host-Zeichen und in XML ohne Entity ein Syntaxfehler.
  const base = escapeXmlText(siteRequestOrigin(event))

  const urls = ROUTES.flatMap((route) => {
    const enUrl = `${base}${route.path}`
    const deUrl = `${base}/de${route.path === '/' ? '' : route.path}`
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>`,
      `    <xhtml:link rel="alternate" hreflang="de" href="${deUrl}"/>`,
    ].join('\n')

    return [enUrl, deUrl].map(loc => [
      '  <url>',
      `    <loc>${loc}</loc>`,
      alternates,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
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
