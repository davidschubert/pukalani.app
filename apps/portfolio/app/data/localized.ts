/**
 * Zweisprachige Inhalte als typisierte Daten im App-Code — dasselbe Muster wie
 * `cases.ts` (kein CMS: die Texte dieser Site ändern sich selten, Deploy =
 * Contentpflege). Die Seiten wählen die Sprache über EINE Rechnung:
 *
 *   const lang = computed<Lang>(() => (locale.value.startsWith('de') ? 'de' : 'en'))
 *
 * Warum ein eigenes Objekt statt i18n-Keys: die Marketing-Texte sind lange
 * Fließtexte, die zusammen mit ihrer Struktur (Preis, Dauer, Schema-Text)
 * gepflegt werden — und dieselben Arrays speisen sichtbaren Inhalt UND das
 * JSON-LD. Die Parität von FAQ-Text und FAQPage-Structured-Data ist eine
 * Google-Anforderung und darf nicht an zwei Stellen auseinanderlaufen.
 * i18n-Keys bleiben den kleinen UI-Beschriftungen (Navigation, „Lesen →").
 */

export interface Localized<T = string> {
  de: T
  en: T
}

export type Lang = 'de' | 'en'

/** Ein Frage/Antwort-Paar — speist FAQ-Markup UND FAQPage-JSON-LD. */
export interface LocalizedFaq {
  question: Localized
  answer: Localized
}
