import type { Lang, LocalizedFaq } from '../data/localized'

/**
 * Die wiederkehrenden Knoten des Structured Data — EINE Quelle für alle Seiten.
 *
 * WARUM ES DIESE DATEI GIBT: die Person „David Schubert" stand als Fakt in
 * FÜNF Seiten (Name, `jobTitle`, `@id`, `url`, `sameAs`), dazu vier Mal
 * dieselbe Brotkrumen-Rechnung und fünf Mal dasselbe FAQPage-Muster. Eine
 * Berufsbezeichnung, die man an fünf Stellen ändern muss, ändert man
 * irgendwann an vier — und Google liest dann zwei verschiedene Personen mit
 * derselben `@id`. Genau so sind schon die Fußzeilen-Beschriftungen von den
 * Leistungs-Titeln abgewandert (Befund B3).
 *
 * Die `@id`-Werte sind ABSICHTLICH aus dem Origin gerechnet und nicht fest
 * verdrahtet: die Site bedient nach der Domain-Freischaltung zwei Hosts, und
 * ein Knoten, dessen `@id` auf den falschen Host zeigt, hängt für eine
 * Suchmaschine an einer anderen Ressource als das canonical desselben
 * Dokuments (Begründung in `app/composables/useSiteOrigin.ts`).
 *
 * Bewusst PURE Funktionen ohne Nuxt-Bezug: sie sollen im Test und im Kopf
 * nachrechenbar sein. Den Origin besorgt `usePortfolioSeo()`.
 */

/** Name der Person — auch `author`-Meta und `articleAuthor`. */
export const PERSON_NAME = 'David Schubert'

/** Name der Marke — `og:site_name` und der Organization-Knoten. */
export const SITE_NAME = 'Pukalani Studio'

/**
 * Die Berufsbezeichnung. Steht hier, weil sie in vier Seiten identisch stand
 * und in keiner davon zu Hause war.
 */
export const PERSON_JOB_TITLE = 'Senior UI/UX Designer & Creative Technologist'

/** Ein Knoten des JSON-LD-Graphen. */
export type JsonLdNode = Record<string, unknown>

/** `@id` der Person — Ziel jeder `provider`/`author`/`about`-Referenz. */
export function personId(origin: string): string {
  return `${origin}/#david-schubert`
}

/** `@id` der Organisation (Marke). */
export function organizationId(origin: string): string {
  return `${origin}/#pukalani-studio`
}

/** `@id` der Website — `isPartOf` jeder Seite. */
export function websiteId(origin: string): string {
  return `${origin}/#website`
}

/**
 * Der Person-Knoten in der Fassung, die JEDE Seite trägt.
 *
 * `homeUrl` (nicht die Seite selbst) ist bewusst die `url`: der Knoten
 * beschreibt die Person, nicht das Dokument — und die Person „wohnt" auf der
 * Startseite in der Sprache, in der gerade gerendert wird.
 *
 * `extra` ergänzt die Fassung um das, was NUR eine Seite weiß: die Startseite
 * um Adresse, Ausbildung und Kontaktwege, die Nuxt-Seite um ihr eigenes
 * `knowsAbout`. Ergänzen statt zwei Fassungen zu pflegen — ein zweites
 * `personNodeFull()` wäre wieder eine Stelle, die man vergisst.
 */
export function personNode(origin: string, homeUrl: string, extra: JsonLdNode = {}): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': personId(origin),
    'name': PERSON_NAME,
    'jobTitle': PERSON_JOB_TITLE,
    'url': homeUrl,
    ...extra,
  }
}

/** Eine Station der Brotkrumen-Navigation (Position kommt aus der Reihenfolge). */
export interface BreadcrumbItem {
  name: string
  item: string
}

/**
 * BreadcrumbList für EINE Seite. Die `position` zählt die Funktion selbst —
 * handgezählte Positionen waren die zweite Sorte Kopie in diesen Seiten, und
 * eine übersprungene Zahl fällt in keinem Test auf.
 */
export function breadcrumbList(pageUrl: string, items: readonly BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.item,
    })),
  }
}

/**
 * FAQPage aus DEMSELBEN Array, das die sichtbaren Fragen rendert — die
 * Parität von sichtbarem FAQ und Structured Data ist eine Google-Anforderung
 * (Begründung in `app/data/localized.ts`). Deshalb nimmt die Funktion die
 * Roh-Daten und nicht bereits übersetzte Zeichenketten: wer hier etwas anderes
 * hineinreicht als in die Liste, muss es sichtbar tun.
 */
export function faqPage(pageUrl: string, faqs: readonly LocalizedFaq[], lang: Lang): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question[lang],
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer[lang] },
    })),
  }
}

/**
 * Die drei DACH-Länder als `areaServed` — stand in drei Seiten wortgleich.
 * Ein Land, das hier fehlt, fehlt sonst in genau einer von drei Antworten.
 */
export const DACH_AREA_SERVED: JsonLdNode[] = [
  { '@type': 'Country', 'name': 'Deutschland' },
  { '@type': 'Country', 'name': 'Österreich' },
  { '@type': 'Country', 'name': 'Schweiz' },
]

/** Die Postanschrift des Studios — Person- UND ProfessionalService-Knoten. */
export const STUDIO_ADDRESS: JsonLdNode = {
  '@type': 'PostalAddress',
  'addressLocality': 'Pukalani',
  'addressRegion': 'HI',
  'addressCountry': 'US',
}
