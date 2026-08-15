import type { ContentNavigationItem } from '@nuxt/content'

/**
 * Domänen-Typen der Hilfe-Site. Sie liegen in `shared/types/` (Projektregel:
 * NIE `app/types/`) — die Utility, die sie benutzt, bleibt in `app/utils/`,
 * weil sie nur im Browser/SSR-Rendering gebraucht wird.
 *
 * Die zwei Abschnitte sind die zwei LESERSCHAFTEN, nicht die Sammlungen:
 *  - `anleitung`  — Betreiber einer Community (keine Technik-Vorkenntnisse)
 *  - `entwickler` — wer das Widget einbindet oder die API anspricht
 *
 * Sammlungen gibt es seit der Zweisprachigkeit doppelt so viele (je Sprache
 * eine, content.config.ts). Abschnitt und Sammlung auseinanderzuhalten ist
 * Absicht: die Kopfzeile, die Seitenleiste und die Suche denken in
 * Abschnitten, nur die Abfrage denkt in Sammlungen.
 */
export type DocsSectionKey = 'anleitung' | 'entwickler'

/** Die tatsächlichen Sammlungsnamen aus content.config.ts. */
export type DocsCollectionKey
  = | 'anleitung' | 'entwickler'
    | 'anleitungEn' | 'entwicklerEn'

/** Navigation je Abschnitt — in der Sprache der aktuellen Seite. */
export type DocsNavigation = Record<DocsSectionKey, ContentNavigationItem[]>

/** Ein Eintrag der Abschnitts-Leiste (Kopfzeile) — siehe app/utils/docsSections.ts. */
export interface DocsSection {
  key: DocsSectionKey
  /**
   * Pfad-Prefix OHNE Sprache. Die Kopfzeile schickt ihn durch `localePath()`,
   * die Sammlungen tragen ihn (`/anleitung`, `/en/anleitung`) — so bleiben
   * Route und Content-Pfad deckungsgleich.
   */
  prefix: string
  labelKey: string
  icon: string
}
