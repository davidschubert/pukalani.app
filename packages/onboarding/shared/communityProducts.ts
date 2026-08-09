import type { ManifestText } from '../../core/shared/types/manifest'

/**
 * DER REITER „PRODUKTE" — sein Vertrag zwischen Route und Seite (F51 Paket 2).
 *
 * Hier steht NUR die Form der Antwort von `GET /api/community/products`; die
 * Auswahl (welche Produkte überhaupt genannt werden und warum) begründet die
 * Route selbst.
 *
 * WARUM IN `shared/` UND NICHT NEBEN DER ROUTE (Session-Audit 2026-08-09): der
 * Typ hat ZWEI Leser — die Route im Server und `products.vue` im Browser. Bis
 * heute importierte die Seite ihn per Pfad aus `server/api/…`, und damit hing
 * eine Client-Datei an einem Server-Modul: `shared/` ist genau der Ort, den die
 * Regel „Domain-Types in shared/, nie app/types/" dafür vorsieht (§6). Es ist
 * ein reiner Typ, also fällt zur Laufzeit nichts an — die Regel schützt hier
 * die Richtung des Imports, nicht das Bundle.
 */
export interface CommunityProductEntry {
  key: string
  title: ManifestText
  description: ManifestText
  icon?: string
  /** Mindest-Plan aus `pukalani.tenancy.products`; '' = in jedem Tarif dabei. */
  minPlan: string
}

export interface CommunityProductsResponse {
  products: CommunityProductEntry[]
}
