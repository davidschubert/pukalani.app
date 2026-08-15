import { defineContentConfig, defineCollection, z } from '@nuxt/content'

/**
 * ZWEI Leserschaften × ZWEI Sprachen = vier Abschnitts-Sammlungen (plus zwei
 * Startseiten):
 *  - `anleitung`  — Betreiber einer Community (keine Technik-Vorkenntnisse)
 *  - `entwickler` — wer das Widget einbindet oder die API anspricht
 *
 * Getrennte Sammlungen statt einer mit Ordner-Konvention: so hat jeder
 * Abschnitt seine eigene Navigation UND seinen eigenen Suchindex — die
 * Kopfzeile schaltet zwischen beiden um. Der `prefix` hält Route und
 * Content-Pfad deckungsgleich (`/anleitung/...`, `/en/anleitung/...`), weshalb
 * die Seiten-Abfrage weiterhin schlicht `queryCollection(x).path(route.path)`
 * lautet — auch nach der Umstellung auf Locale-Prefixe.
 *
 * WARUM JE SPRACHE EINE EIGENE SAMMLUNG und nicht ein `locale`-Feld im
 * Frontmatter: Navigation und Suchindex werden PRO Sammlung gebaut. Mit einem
 * Feld müsste jede Abfragestelle filtern, und die eine vergessene Stelle
 * mischt dem Leser die andere Sprache in Seitenleiste oder Suchtreffer. Die
 * Sammlungsgrenze macht das unmöglich statt unwahrscheinlich.
 *
 * Die deutschen Sammlungen greifen bewusst NICHT nach `en/**` (ihr `include`
 * beginnt bei `anleitung/`), die englischen nur dort — es gibt keine
 * Überschneidung.
 */

/** Optionale Knöpfe im Seitenkopf (UPageHeader #links) — in beiden Sprachen gleich. */
const seitenSchema = z.object({
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional(),
  })).optional(),
})

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: 'index.md',
    }),
    anleitung: defineCollection({
      type: 'page',
      source: { include: 'anleitung/**', prefix: '/anleitung' },
      schema: seitenSchema,
    }),
    entwickler: defineCollection({
      type: 'page',
      source: { include: 'entwickler/**', prefix: '/entwickler' },
      schema: seitenSchema,
    }),

    // BEWUSST OHNE `prefix`: der Prefix wird auf den Pfad ADDIERT, der sich
    // aus dem Dateinamen ergibt — und der lautet hier bereits `/en`. Mit
    // `prefix: '/en'` landete die Startseite auf `/en/en` (beim Bau gemessen).
    // Bei den Abschnitts-Sammlungen ist der Prefix dagegen nötig, weil ihr
    // `include` mit `**` endet und der Pfad dort RELATIV zum Ordner entsteht.
    landingEn: defineCollection({
      type: 'page',
      source: { include: 'en/index.md' },
    }),
    anleitungEn: defineCollection({
      type: 'page',
      source: { include: 'en/anleitung/**', prefix: '/en/anleitung' },
      schema: seitenSchema,
    }),
    entwicklerEn: defineCollection({
      type: 'page',
      source: { include: 'en/entwickler/**', prefix: '/en/entwickler' },
      schema: seitenSchema,
    }),
  },
})
