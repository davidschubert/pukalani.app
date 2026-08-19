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
 * Content-Pfad deckungsgleich (`/anleitung/...`, `/de/anleitung/...`), weshalb
 * die Seiten-Abfrage weiterhin schlicht `queryCollection(x).path(route.path)`
 * lautet — auch nach dem Sprach-Tausch vom 2026-08-18.
 *
 * SPRACHROLLEN seit 2026-08-18 (Davids Entscheidung, Begründung in
 * nuxt.config.ts): ENGLISCH ist die Vorgabe und liegt an der Content-Wurzel,
 * DEUTSCH liegt unter `de/`. Vorher war es umgekehrt.
 *
 * WARUM JE SPRACHE EINE EIGENE SAMMLUNG und nicht ein `locale`-Feld im
 * Frontmatter: Navigation und Suchindex werden PRO Sammlung gebaut. Mit einem
 * Feld müsste jede Abfragestelle filtern, und die eine vergessene Stelle
 * mischt dem Leser die andere Sprache in Seitenleiste oder Suchtreffer. Die
 * Sammlungsgrenze macht das unmöglich statt unwahrscheinlich.
 *
 * Die englischen Sammlungen greifen bewusst NICHT nach `de/**` (ihr `include`
 * beginnt bei `anleitung/`), die deutschen nur dort — es gibt keine
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
    // aus dem Dateinamen ergibt — und der lautet hier bereits `/de`. Mit
    // `prefix: '/de'` landete die Startseite auf `/de/de` (beim Bau gemessen,
    // damals mit vertauschten Sprachen und `en/index.md`).
    // Bei den Abschnitts-Sammlungen ist der Prefix dagegen nötig, weil ihr
    // `include` mit `**` endet und der Pfad dort RELATIV zum Ordner entsteht.
    landingDe: defineCollection({
      type: 'page',
      source: { include: 'de/index.md' },
    }),
    anleitungDe: defineCollection({
      type: 'page',
      source: { include: 'de/anleitung/**', prefix: '/de/anleitung' },
      schema: seitenSchema,
    }),
    entwicklerDe: defineCollection({
      type: 'page',
      source: { include: 'de/entwickler/**', prefix: '/de/entwickler' },
      schema: seitenSchema,
    }),
  },
})
