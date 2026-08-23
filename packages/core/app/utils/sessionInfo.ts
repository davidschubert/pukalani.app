import type { SessionRow } from '../../shared/types/session'

/**
 * Beschriftungen einer Session-Zeile — reine Funktionen, geteilt von
 * SessionsTable (Kurzform) und SessionDetailsModal (Langform).
 *
 * Sie standen bis 2026-08-23 im `<script setup>` der Tabelle. Mit dem Dialog
 * gibt es einen ZWEITEN Leser derselben Daten, und zwei Kopien derselben
 * Zusammensetzung driften — „Chrome 126" in der Zeile und „Chrome126" im
 * Dialog wäre kein Fehler, den jemand meldet, aber einer, den jeder sieht.
 * Verhalten ist unverändert; hierher verschoben, nicht neu erfunden.
 *
 * Icons zu denselben Feldern liegen nebenan in `utils/clientInfo`.
 */

/** „Chrome 126" */
export function browserLabel(s: SessionRow): string {
  return [s.clientName, s.clientVersion].filter(Boolean).join(' ').trim()
}

/** „macOS 10.15" */
export function osLabel(s: SessionRow): string {
  return [s.osName, s.osVersion].filter(Boolean).join(' ').trim()
}

/** „Blink 126.0" */
export function engineLabel(s: SessionRow): string {
  return [s.clientEngine, s.clientEngineVersion].filter(Boolean).join(' ').trim()
}

/** „smartphone · Apple iPhone" — Duplikate (brand im model) vermeiden */
export function deviceLabel(s: SessionRow): string {
  const brandModel = [s.deviceBrand, s.deviceModel].filter(Boolean).join(' ').trim()
  return [s.deviceName, brandModel].filter(Boolean).join(' · ').trim()
}

/** Datum + Uhrzeit in der Sprache des Betrachters (kurz, wie in der Tabelle). */
export function sessionDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Koordinaten als eine Zeile — vier Nachkommastellen (~11 m) sind für eine
 * IP-Auflösung ohnehin mehr Genauigkeit, als die Datenlage hergibt.
 * `null` bei einem der beiden Werte heißt: keine Koordinaten, also '' .
 */
export function coordinatesLabel(latitude: number | null, longitude: number | null): string {
  if (latitude === null || longitude === null) return ''
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}
