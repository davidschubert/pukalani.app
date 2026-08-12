import type { H3Event } from 'h3'
import { ANALYTICS_RANGE, ANALYTICS_STATS_RANGES } from '../../shared/analyticsStats'
import type { AnalyticsStatsRange } from '../../shared/analyticsStats'
import type { AnalyticsConfigResponse, AnalyticsStatsResponse } from '../../shared/types/analytics'

/**
 * Microcache der öffentlichen Config-Antwort (60 s).
 *
 * Sie ist user-agnostisch (eine Script-Id, keine Session-Daten) und wird bei
 * JEDEM Seitenaufbau gelesen — das Head-Plugin fragt sie im SSR. Ohne Cache
 * wäre das eine Appwrite-Abfrage pro Seitenaufruf für einen Wert, der sich
 * einmal im Jahr ändert.
 *
 * DER SCHLÜSSEL TRÄGT DEN MANDANTEN (Cross-Tenant-Cache-Regel, H3): sonst
 * bekäme Kunde B die Script-Id von Kunde A in seine Seiten gestempelt — und
 * das ist nicht nur falsch gemessen, es verrät auch fremde Konfiguration.
 *
 * Liegt in server/utils, weil ZWEI Routen ihn brauchen: die Leseroute füllt
 * ihn, die Schreibroute setzt ihn nach dem Speichern direkt neu (statt bis zu
 * 60 s zu warten oder den Cache für alle Mandanten zu leeren).
 */
const analyticsConfigCache = createMicrocache<AnalyticsConfigResponse>(60_000)

export function analyticsConfigCacheKey(event: H3Event): string {
  return `analytics:${tenantCacheScope(event)}`
}

export function readAnalyticsConfigCache(event: H3Event): AnalyticsConfigResponse | undefined {
  return analyticsConfigCache.get(analyticsConfigCacheKey(event))
}

export function writeAnalyticsConfigCache(event: H3Event, value: AnalyticsConfigResponse): void {
  analyticsConfigCache.set(analyticsConfigCacheKey(event), value)
}

/**
 * ZWEITER Cache für die ZAHLEN (120 s) — bewusst neben dem oberen und nicht in
 * ihm.
 *
 * Es sind zwei verschiedene Dinge mit zwei verschiedenen Kosten: die Config ist
 * ein Feld aus Appwrite und wird bei JEDEM Seitenaufbau gelesen; die Statistik
 * sind EIN DUTZEND Abfragen gegen eine fremde Instanz und wird nur beim Öffnen
 * einer Dashboard-Seite gebraucht. Ein gemeinsamer Eintrag hieße, dass jeder Gast
 * einer Community die Zahlen ihres Owners mit im Speicher hätte.
 *
 * DER SCHLÜSSEL TRÄGT MANDANT UND ZWECK: derselbe Grund wie oben, plus der
 * eigene Namensraum — sonst überschriebe eines der beiden das andere, sobald
 * ein dritter Cache dazukommt.
 *
 * BENUTZERUNABHÄNGIG, wie es der Microcache verlangt: in der Antwort stehen
 * Besuchszahlen einer Community, keine Sitzungsdaten. Wer sie SEHEN darf,
 * entscheidet vorher `requireCommunityPermission` in der Route — der Cache
 * liegt hinter dieser Prüfung, nicht vor ihr.
 *
 * 120 s, weil Plausible selbst in Minuten denkt: eine Ansicht, die 2 Minuten
 * alt ist, sieht niemand — ein Dutzend Abfragen bei jedem F5 dagegen schon.
 * Die Kachel „letzte 30 Minuten" lebt mit denselben 120 s: sie ist eine
 * grobe Anwesenheits-Anzeige, keine Uhr — und sie heißt deshalb auch nicht
 * „live".
 */
const analyticsStatsCache = createMicrocache<AnalyticsStatsResponse>(120_000)

/**
 * DER SCHLÜSSEL TRÄGT AUCH DEN ZEITRAUM (Statistik-Seite): 7, 30 und 90 Tage
 * sind drei verschiedene Antworten. Ohne diesen Teil bekäme der Owner beim
 * Umschalten zwei Minuten lang die Zahlen des vorigen Zeitraums mit der neuen
 * Beschriftung — falsch, und zwar unsichtbar falsch.
 */
export function analyticsStatsCacheKey(event: H3Event, range: AnalyticsStatsRange = ANALYTICS_RANGE): string {
  return `analytics:stats:${tenantCacheScope(event)}:${range}`
}

export function readAnalyticsStatsCache(
  event: H3Event,
  range: AnalyticsStatsRange = ANALYTICS_RANGE,
): AnalyticsStatsResponse | undefined {
  return analyticsStatsCache.get(analyticsStatsCacheKey(event, range))
}

export function writeAnalyticsStatsCache(
  event: H3Event,
  value: AnalyticsStatsResponse,
  range: AnalyticsStatsRange = ANALYTICS_RANGE,
): void {
  analyticsStatsCache.set(analyticsStatsCacheKey(event, range), value)
}

/**
 * Nach dem Umschalten: die Einträge GENAU dieses Mandanten wegwerfen — alle
 * Zeiträume, denn die Messung hat sich für jeden von ihnen geändert. Neu setzen
 * geht hier nicht: die neuen Zahlen kommen aus einer anderen Plausible-Site und
 * müssen erst geholt werden; ein `clear()` wiederum träfe alle anderen
 * Communities ohne Not.
 *
 * Die Schleife über die weiße Liste ist der Grund, warum es sie als Konstante
 * gibt: ein vierter Zeitraum wird hier sonst vergessen, und dann bliebe genau
 * er nach dem Abschalten mit alten Zahlen stehen.
 */
export function clearAnalyticsStatsCache(event: H3Event): void {
  for (const range of ANALYTICS_STATS_RANGES) {
    analyticsStatsCache.delete(analyticsStatsCacheKey(event, range))
  }
}
