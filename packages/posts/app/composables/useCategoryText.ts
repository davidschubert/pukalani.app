import {
  categoryTextFor,
  localizedNameFrom,
  type CategoryTextSource,
} from '../../shared/categoryI18n'
import type { DiscussionTopic } from '../../shared/types/post'

/**
 * Der Kategorie-Name IN DER SPRACHE DIESER SEITE.
 *
 * WARUM IM BROWSER UND NICHT AUF DEM SERVER (die Entscheidung von 2026-08-17):
 *
 *  - Die Sprache steht in der ADRESSE (`prefix_except_default`). Der Client
 *    kennt sie in SSR wie im Browser — der Server kennt an einer API-Route nur
 *    ein Cookie, und das FEHLT genau dort, wo es am meisten wehtut: bei einem
 *    Suchmaschinen-Besuch auf `/de/discussions/…`. Dann stünde eine deutsche
 *    Seite mit englischen Kategorie-Namen im Index.
 *  - Ein Sprachwechsel wirkt SOFORT. Läge die Auflösung serverseitig, hinge an
 *    jedem Umschalten ein zweiter Abruf.
 *  - Ein `?locale=`-Parameter wäre eine Angabe, die eine künftige Aufrufstelle
 *    VERGESSEN kann — und ihr Fehlen sieht man nicht: die Seite lädt, sie zeigt
 *    nur die falsche Sprache. Hier ist die Sprache nicht optional, sie steckt
 *    im Aufruf.
 *
 * Der Preis ist die Antwortgröße (beide Fassungen reisen mit). Bei einer
 * Handvoll Kategorien sind das ein paar hundert Bytes; die Themen-Liste trägt
 * nur die NAMEN und auch die nur, wo wirklich übersetzt wurde.
 */
export function useCategoryText() {
  const { locale } = useI18n()

  return {
    /** Der anzuzeigende Name (Grundfassung, wenn nichts übersetzt ist). */
    categoryName: (category: CategoryTextSource): string =>
      categoryTextFor(category, locale.value).name,

    /** Die anzuzeigende Beschreibung — Feld für Feld, nicht als Paket. */
    categoryDescription: (category: CategoryTextSource): string =>
      categoryTextFor(category, locale.value).description,

    /** Dasselbe für eine Themen-Zeile, die nur die Namens-Karte mitbringt. */
    topicCategoryName: (topic: Pick<DiscussionTopic, 'categoryName' | 'categoryNames'>): string =>
      localizedNameFrom(topic.categoryNames, topic.categoryName, locale.value),
  }
}
