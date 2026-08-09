import type { H3Event } from 'h3'
// core/shared/*.ts wird im server-Verzeichnis NICHT auto-importiert
// (nur shared/utils + shared/types) — deshalb explizit, wie in
// apps/platform/server/utils/tenantRequestOrigin.ts.
import { resolveSeoOrigin } from '../../../../packages/core/shared/seoOrigin'

/**
 * Die Origin, unter der DIESER Request beantwortet wird — Server-Gegenstück zu
 * `useLocaleSeoHead()` (Gate `pukalani.seo.originFromRequest`, in dieser App
 * AN). Muster: apps/platform/server/utils/tenantRequestOrigin.ts.
 *
 * Warum nicht `getRequestURL(event).origin` roh: der Host-Header ist
 * CLIENT-EINGABE. Die sitemap.xml wird `public, max-age=3600` ausgeliefert —
 * ein Zwischenspeicher könnte damit eine Sitemap voller fremder Adressen für
 * eine Stunde festhalten und an echte Besucher/Crawler weiterreichen. Deshalb
 * dieselbe Regel wie im Kopf der Seiten: HOST+PORT aus dem Request (die Site
 * bedient nach der Domain-Freischaltung zwei Hosts), das SCHEMA aus der
 * konfigurierten Basis-URL (`NUXT_PUBLIC_I18N_BASE_URL`) — hinter nginx
 * spricht der Node-Prozess http, und ob der Proxy `X-Forwarded-Proto` setzt,
 * ist eine Server-Einstellung, auf die sich SEO sich nicht verlassen darf.
 * Ohne konfigurierte Basis (lokale Entwicklung) gilt das Schema des Requests.
 *
 * `getRequestURL` liegt bewusst im try: ein Host-Header mit für URLs
 * verbotenen Zeichen (`"`, `<`, Leerzeichen) lässt `new URL()` werfen, und
 * eine Crawler-Adresse soll dann eine kürzere Antwort geben statt 500. Der
 * Rückfall ist die konfigurierte Basis.
 */
export function siteRequestOrigin(event: H3Event): string {
  const publicConfig = useRuntimeConfig(event).public as { i18n?: { baseUrl?: unknown } }
  const configured = typeof publicConfig.i18n?.baseUrl === 'string' ? publicConfig.i18n.baseUrl : ''

  let requestOrigin: string
  try {
    requestOrigin = getRequestURL(event).origin
  }
  catch {
    requestOrigin = ''
  }

  return resolveSeoOrigin(requestOrigin, configured) || configured.replace(/\/+$/, '')
}

/**
 * XML-Textescape für Werte, die in `<loc>` oder in ein `href`-Attribut laufen.
 *
 * Verteidigung in der Tiefe: `siteRequestOrigin()` liefert bereits nur, was
 * `new URL()` als Origin durchgelassen hat, und nginx routet fremde Hosts gar
 * nicht erst hierher. Aber `&` ist ein gültiges URL-Zeichen und in XML ohne
 * Escape ein Syntaxfehler, und `"` beendet ein Attribut — ein Dokument, das
 * an EINER Stelle ungeprüft Fremdtext einbaut, ist nur so lange harmlos, wie
 * die Prüfung davor lückenlos bleibt. Die fünf XML-Entities reichen; `'`
 * bleibt weg, weil hier keine einfachen Anführungszeichen als Begrenzer
 * vorkommen — dafür ist `&apos;` in XML 1.0 auch nicht überall vordefiniert.
 */
export function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
