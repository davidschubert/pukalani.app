import { z } from 'zod'

/**
 * DER REDAKTIONS-VERTRAG VON BRAND INSIGHTS (Plan §9.3,
 * docs/plans/BRAND-INSIGHTS.md).
 *
 * ── WAS DIESE DATEI IST UND WAS SIE NICHT IST ────────────────────────────
 * Sie ist der PRODUKT-Vertrag: was ein Beitrag IST (vier Formate, eine Zeile),
 * was eine Quelle mindestens mitbringen muss, wie ein Duell-Fakt und ein
 * Ranking-Platz aussehen, und welche Regeln VOR der Redaktions-Freigabe
 * greifen. Sie ist NICHT der Ablage-Vertrag: `insights_posts` & Co. entstehen
 * mit I1, und ihre Zeilen-Typen (`Models.Row & …`) gehören dann in eine
 * eigene Datei daneben — so wie im market-Layer `shared/marketProfile.ts` und
 * `shared/types/market.ts` getrennt sind. Wer das hier mit der Datenbank
 * mischt, holt die Datenbank in den Produktbegriff.
 *
 * ── KEIN IMPORT AUS `brand`, OBWOHL DER LAYER IHN VORAUSSETZT ────────────
 * `requires: ['brand']` steht im Manifest, und I1 baut GENAU EINEN Vertrag
 * dorthin (`server/contracts/`). Diese Datei bleibt trotzdem frei davon: sie
 * wird auch dort gelesen, wo es keinen brand-Layer gibt (Komponenten, Tests,
 * später der Prompt-Bau) — dasselbe Zuschnitt-Argument wie im Kopf von
 * `market/shared/marketProfile.ts`. Score, Band, Farbwelt und Archetyp kommen
 * deshalb als ANSICHT herein (`InsightsBrandScore`), nie als eigene Spalte:
 * „eine Zahl je Marke, dieselbe wie im Produkt" (Entscheidung 7).
 *
 * ── WARUM HIER ZOD UND NICHT NUR TYPEN ──────────────────────────────────
 * Ein Beitrag entsteht zu Teilen aus einem MODELL (Entwurf, Übersetzung) und
 * zu Teilen aus einem Formular. Ein Wert, den ein Modell erzeugt hat und den
 * niemand geprüft hat, ist eine Behauptung — erst das Schema macht Daten
 * daraus. Die Zitatschranke (§ 51 UrhG) und die Belegpflicht stehen deshalb
 * IM SCHEMA und nicht nur im Formular: „eine Regel, die nur im Formular
 * steht, ist keine" (§9.4).
 */

// ── 1. Kataloge ────────────────────────────────────────────────────────────

/** Die vier Formate (§2). Eine Zeile trägt alle vier — `format` unterscheidet. */
export const INSIGHTS_FORMATS = ['profile', 'duel', 'article', 'ranking'] as const
export type InsightsFormat = (typeof INSIGHTS_FORMATS)[number]

/**
 * DIE VIER ZUSTÄNDE (§9.3) — und `übersetzt` ist bewusst KEINER davon.
 *
 * §3.2 nannte fünf (`entwurf → redaktion → freigegeben → übersetzt →
 * aktualisieren`). Das trägt nicht: ein Beitrag kann auf Deutsch freigegeben
 * sein, während die englische Fassung noch redigiert wird — „halb
 * veröffentlicht" kann eine lineare Kette nicht ausdrücken, sie müsste den
 * Beitrag zurücknehmen oder eine unredigierte Übersetzung öffentlich machen.
 * Deshalb ist `übersetzt` eine EIGENSCHAFT der zweiten Fassung
 * (`translationReviewed`), s. `insightsPublicFassung()`.
 */
export const INSIGHTS_STATES = ['draft', 'review', 'published', 'updated'] as const
export type InsightsState = (typeof INSIGHTS_STATES)[number]

/** Die Zustände, die eine ÖFFENTLICHE Route lesen darf — mehr nie (§3.2). */
export const INSIGHTS_PUBLIC_STATES = ['published', 'updated'] as const

/** Die zwei Sprachen der Plattform; `baseLocale` ist die REDIGIERTE (Entscheidung 3). */
export const INSIGHTS_LOCALES = ['de', 'en'] as const
export type InsightsLocale = (typeof INSIGHTS_LOCALES)[number]

/**
 * DIE FÜNF QUELLEN-ARTEN (Entscheidung 6, §4.1).
 *
 * `brand-site` ist die EIGENAUSSAGE einer Marke, alles andere ist FREMDQUELLE
 * — und genau diese Unterscheidung muss die Oberfläche zeigen (§4.1 a: „nie
 * als Eigenaussage der Marke"). `own-data` sind unsere eigenen Zahlen
 * (Brand-Check, Bibliothek, Marktvergleich); sie brauchen keinen fremden
 * Herausgeber, weil der Herausgeber wir sind.
 */
export const INSIGHTS_SOURCE_KINDS = ['brand-site', 'press', 'wikipedia', 'youtube', 'own-data'] as const
export type InsightsSourceKind = (typeof INSIGHTS_SOURCE_KINDS)[number]

/** Fremdquelle oder Eigenaussage? Die eine Frage, die §4.1 (a) stellt. */
export function insightsSourceIsThirdParty(kind: InsightsSourceKind): boolean {
  return kind !== 'brand-site' && kind !== 'own-data'
}

/**
 * DIE ZITATSCHRANKE (§4.1 b, § 51 UrhG). Sie steht im Schema, im
 * Redaktions-Formular und in der Prüfregel vor `review` — dieselbe Zahl, EINE
 * Stelle. 200 ist dieselbe Schranke wie im Marktvergleich
 * (`MARKET_EVIDENCE_MAX`); zwei verschiedene Zahlen für dieselbe Rechtsfrage
 * wären eine Einladung, die kleinere zu vergessen.
 */
export const INSIGHTS_QUOTE_MAX = 200

/** Alte Slugs je Zeile (§9.2) — ≤ 5, damit die 301-Suche eine Grenze hat. */
export const INSIGHTS_SLUG_HISTORY_MAX = 5

/** Ein Ranking hat zehn Plätze — eingefroren, mit Stand (§11 Frage 7). */
export const INSIGHTS_RANKING_PLACES = 10

/** Lesezeit: Wörter ÷ 200, aufgerundet; berechnet beim SPEICHERN (§9.3). */
export const INSIGHTS_WORDS_PER_MINUTE = 200
export const INSIGHTS_READING_MINUTES_MAX = 120

/**
 * DIE ACHT THEMENCLUSTER (§2) — ein kuratierter Katalog IM CODE, keine
 * Tabelle: sie ändern sich seltener als ein Deploy (§9.2).
 *
 * ── WARUM DIE LABELS NICHT ÜBER i18n LAUFEN ──────────────────────────────
 * Sie sind Eigennamen und heissen in beiden Sprachen gleich — dieselbe Regel
 * wie bei den Theme-Namen (CLAUDE.md) und wie bei den Hauptpunkten der
 * branding.supply-Navigation (Davids Design: „Discover Brands", „Brand
 * Insights"). Ein übersetztes „Markenpsychologie" neben einem englischen
 * „Brand Psychology" wäre zwei Namen für dieselbe Rubrik — und die
 * `/topics/<slug>`-Adresse hat ohnehin nur einen.
 */
export const INSIGHTS_TOPICS = [
  { key: 'rebranding', label: 'Rebranding' },
  { key: 'brand-psychology', label: 'Brand Psychology' },
  { key: 'brand-analysis', label: 'Brand Analysis' },
  { key: 'brand-strategy', label: 'Brand Strategy' },
  { key: 'brand-language', label: 'Brand Language' },
  { key: 'seo-geo', label: 'SEO & GEO' },
  { key: 'brand-experience', label: 'Brand Experience' },
  { key: 'visual-identity', label: 'Visual Identity' },
] as const

export type InsightsTopicKey = (typeof INSIGHTS_TOPICS)[number]['key']
export const INSIGHTS_TOPIC_KEYS = INSIGHTS_TOPICS.map(topic => topic.key) as readonly InsightsTopicKey[]

export function insightsTopicLabel(key: string): string {
  return INSIGHTS_TOPICS.find(topic => topic.key === key)?.label ?? key
}

// ── 2. Quellen ─────────────────────────────────────────────────────────────

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

/**
 * EINE QUELLE (§9.3, „`sources` (JSON, Zitatschranke im Schema)").
 *
 * Drei Pflichten, die das Schema durchsetzt statt sie zu erwähnen:
 *  1. `kind !== 'own-data'` ⇒ `publisher` UND `date`. Ein Beleg ohne Datum ist
 *     kein Beleg — eine Website von 2019 sagt etwas anderes als dieselbe
 *     Adresse heute.
 *  2. `kind === 'wikipedia'` ⇒ `license` (CC-BY-SA-Link, §4.1 c). Ohne
 *     Namensnennung ist die Übernahme eine Lizenzverletzung, und die fällt
 *     nicht auf, solange niemand fragt.
 *  3. `quote` ≤ 200 Zeichen (§4.1 b).
 *
 * WAS DAS SCHEMA NICHT KANN: prüfen, ob das Zitat WÖRTLICH in der Quelle
 * steht. Das ist deterministisch möglich, braucht aber den abgerufenen Text —
 * die Prüfung sitzt deshalb in `insightsReviewIssues()` als hereingereichte
 * Funktion (s. dort, samt der offenen Frage, wem sie gehört).
 */
export const insightsSourceSchema = z.object({
  url: z.url().max(512),
  publisher: z.string().max(160).default(''),
  date: z.union([dateSchema, z.literal('')]).default(''),
  kind: z.enum(INSIGHTS_SOURCE_KINDS),
  quote: z.string().max(INSIGHTS_QUOTE_MAX).default(''),
  /** CC-BY-SA-Link — Pflicht genau bei `wikipedia`. */
  license: z.string().max(200).default(''),
}).superRefine((source, ctx) => {
  if (source.kind !== 'own-data') {
    if (!source.publisher) ctx.addIssue({ code: 'custom', path: ['publisher'], message: 'Fremdquelle ohne Herausgeber' })
    if (!source.date) ctx.addIssue({ code: 'custom', path: ['date'], message: 'Fremdquelle ohne Datum' })
  }
  if (source.kind === 'wikipedia' && !source.license) {
    ctx.addIssue({ code: 'custom', path: ['license'], message: 'Wikipedia-Quelle ohne Lizenz-Link (CC-BY-SA)' })
  }
})

export type InsightsSource = z.infer<typeof insightsSourceSchema>

// ── 3. Fakten: Duell-Zeile und Ranking-Platz ───────────────────────────────

/**
 * EINE DUELL-ZEILE (§9.3). `sourceIndex` zeigt in `sources` — eine Faktenzeile
 * OHNE Beleg lässt sich nicht speichern. Damit ist §8 Frage 5
 * („Agentur-Beziehung") beantwortet, ohne die Zeile zu streichen: sie ist von
 * Hand gepflegt MIT Belegpflicht, und wo kein Beleg zu finden ist, fehlt die
 * Zeile — nicht das Format.
 *
 * Die Beschriftung steht ZWEISPRACHIG in den Daten und nicht in einem
 * i18n-Schlüssel: „Agentur-Beziehung" ist redaktioneller Inhalt, den die
 * Redaktion je Duell neu wählt — ein Katalog fester Zeilen wäre eine
 * Behauptung darüber, welche Fakten es gibt.
 */
export const insightsDuelFactSchema = z.object({
  key: z.string().min(1).max(40),
  labelDe: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(80),
  left: z.string().max(200),
  right: z.string().max(200),
  winner: z.enum(['left', 'right', 'tie']),
  sourceIndex: z.number().int().min(0),
})

export type InsightsDuelFact = z.infer<typeof insightsDuelFactSchema>

/**
 * EIN RANKING-PLATZ (§11 Frage 7).
 *
 * `removed: true` ist die LÜCKE: ein Entfernen-Wunsch nimmt den Platz heraus
 * und rechnet die Liste NICHT neu — Platz 4 bleibt Platz 4 und trägt „auf
 * Wunsch entfernt". Das ist ehrlicher als eine stille Neunummerierung, und es
 * ist der Grund, warum die Marken-Felder hier optional sind statt eine zweite
 * Zeilen-Form zu bekommen.
 */
export const insightsRankingEntrySchema = z.object({
  rank: z.number().int().min(1).max(INSIGHTS_RANKING_PLACES),
  brandId: z.string().max(64).default(''),
  checkId: z.string().max(64).default(''),
  score: z.number().int().min(0).max(100).default(0),
  reasonDe: z.string().max(300).default(''),
  reasonEn: z.string().max(300).default(''),
  removed: z.boolean().default(false),
}).superRefine((entry, ctx) => {
  if (entry.removed) return
  if (!entry.brandId) ctx.addIssue({ code: 'custom', path: ['brandId'], message: 'Platz ohne Marken-Zeile' })
  if (!entry.reasonDe || !entry.reasonEn) ctx.addIssue({ code: 'custom', path: ['reasonDe'], message: 'Platz ohne Begründung in beiden Sprachen' })
})

export type InsightsRankingEntry = z.infer<typeof insightsRankingEntrySchema>

/**
 * DAS EINGEFRORENE RANKING (§11 Frage 7): zehn Plätze, sichtbarer Stand,
 * nummerierte Ausgabe. Eine Auffrischung ist eine NEUE Ausgabe mit neuem
 * Slug; die alte bleibt mit Hinweis und Link stehen — deshalb trägt die Liste
 * ihren Stand IN den Daten und rechnet ihn nicht aus `$updatedAt`.
 */
export const insightsRankingSchema = z.object({
  issue: z.number().int().min(1),
  asOf: dateSchema,
  entries: z.array(insightsRankingEntrySchema).max(INSIGHTS_RANKING_PLACES),
}).superRefine((ranking, ctx) => {
  const ranks = ranking.entries.map(entry => entry.rank)
  if (new Set(ranks).size !== ranks.length) {
    ctx.addIssue({ code: 'custom', path: ['entries'], message: 'doppelter Platz' })
  }
})

export type InsightsRanking = z.infer<typeof insightsRankingSchema>

/** Der Verweis eines Beitrags auf eine Marken-Zeile (§9.3, `brandRefs`). */
export const insightsBrandRefSchema = z.object({
  brandId: z.string().min(1).max(64),
  checkId: z.string().max(64).default(''),
  libraryKey: z.string().max(64).default(''),
  publicationId: z.string().max(64).default(''),
})

export type InsightsBrandRef = z.infer<typeof insightsBrandRefSchema>

// ── 4. Der Beitrag ─────────────────────────────────────────────────────────

/**
 * EIN BEITRAG — alle vier Formate, eine Form (§9.3 `insights_posts`).
 *
 * Die Zeile trägt beide Sprachfassungen nebeneinander (`titleDe`/`titleEn`
 * …). Das ist NICHT das UGC-Muster: dort ist die Übersetzung ein CACHE für
 * Leser, hier ist sie eine redigierte FASSUNG (§11 Frage 4). Deshalb gibt es
 * `baseLocale` (welche Fassung ist die redigierte?) und
 * `translationReviewed` (ist die zweite es auch?) — ein Cache bräuchte
 * beides nicht.
 */
export const insightsPostSchema = z.object({
  format: z.enum(INSIGHTS_FORMATS),
  slug: z.string().min(1).max(160),
  slugHistory: z.array(z.string().max(160)).max(INSIGHTS_SLUG_HISTORY_MAX).default([]),
  state: z.enum(INSIGHTS_STATES),
  baseLocale: z.enum(INSIGHTS_LOCALES),
  titleDe: z.string().max(200).default(''),
  titleEn: z.string().max(200).default(''),
  dekDe: z.string().max(400).default(''),
  dekEn: z.string().max(400).default(''),
  bodyDe: z.string().default(''),
  bodyEn: z.string().default(''),
  translatedAt: z.string().max(32).default(''),
  translationModel: z.string().max(120).default(''),
  translationPromptVersion: z.string().max(64).default(''),
  translationReviewed: z.boolean().default(false),
  topics: z.array(z.enum(INSIGHTS_TOPIC_KEYS as [InsightsTopicKey, ...InsightsTopicKey[]])).max(4).default([]),
  sources: z.array(insightsSourceSchema).max(40).default([]),
  brandRefs: z.array(insightsBrandRefSchema).max(20).default([]),
  facts: z.array(insightsDuelFactSchema).max(12).default([]),
  ranking: insightsRankingSchema.nullable().default(null),
  readingMinutes: z.number().int().min(0).max(INSIGHTS_READING_MINUTES_MAX).default(0),
  publishedAt: z.string().max(32).default(''),
  reviewedAt: z.string().max(32).default(''),
  reviewedBy: z.string().max(64).default(''),
  noteInternal: z.string().max(500).default(''),
  draftModel: z.string().max(120).default(''),
  draftPromptVersion: z.string().max(64).default(''),
}).superRefine((post, ctx) => {
  // Die Grundfassung MUSS da sein — sie ist die redigierte (Entscheidung 3).
  if (!insightsTitleOf(post, post.baseLocale)) {
    ctx.addIssue({ code: 'custom', path: ['baseLocale'], message: 'Grundfassung ohne Titel' })
  }
  // Zwei Faktenformen, zwei Formate. Ein Duell OHNE Zeilen ist kein Duell,
  // ein Artikel MIT ihnen ist ein Zeichen, dass jemand das Format gewechselt
  // und die alten Daten stehen gelassen hat.
  if (post.format === 'duel' && post.facts.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['facts'], message: 'Duell ohne Faktenzeilen' })
  }
  if (post.format !== 'duel' && post.facts.length > 0) {
    ctx.addIssue({ code: 'custom', path: ['facts'], message: 'Faktenzeilen nur im Duell' })
  }
  if (post.format === 'ranking' && !post.ranking) {
    ctx.addIssue({ code: 'custom', path: ['ranking'], message: 'Ranking ohne Liste' })
  }
  if (post.format !== 'ranking' && post.ranking) {
    ctx.addIssue({ code: 'custom', path: ['ranking'], message: 'Liste nur im Ranking' })
  }
  // Jeder Beleg-Zeiger muss auf eine Quelle zeigen, die es gibt. Ein Zeiger
  // ins Leere sieht in der Tabelle aus wie ein Beleg.
  for (const [index, fact] of post.facts.entries()) {
    if (fact.sourceIndex >= post.sources.length) {
      ctx.addIssue({ code: 'custom', path: ['facts', index, 'sourceIndex'], message: 'Beleg zeigt auf keine Quelle' })
    }
  }
})

export type InsightsPost = z.infer<typeof insightsPostSchema>

export function insightsTitleOf(post: Pick<InsightsPost, 'titleDe' | 'titleEn'>, locale: InsightsLocale): string {
  return locale === 'de' ? post.titleDe : post.titleEn
}

export function insightsDekOf(post: Pick<InsightsPost, 'dekDe' | 'dekEn'>, locale: InsightsLocale): string {
  return locale === 'de' ? post.dekDe : post.dekEn
}

export function insightsBodyOf(post: Pick<InsightsPost, 'bodyDe' | 'bodyEn'>, locale: InsightsLocale): string {
  return locale === 'de' ? post.bodyDe : post.bodyEn
}

/**
 * WELCHE FASSUNG SIEHT DER LESER? (§9.3, §11 Frage 4)
 *
 * Die Regel in EINER Funktion, damit Route, Seite und `hreflang` dieselbe
 * Antwort geben: die Nicht-Grundsprache erscheint NUR mit
 * `translationReviewed === true`; sonst steht die Grundfassung da, und die
 * Seite sagt, dass diese Sprache noch fehlt. „Eine maschinell erzeugte,
 * unredigierte Fassung ist NIE öffentlich" (§3.2) ist damit wörtlich erfüllt
 * und prüfbar statt vorgenommen.
 *
 * `fallback: true` ist ausserdem das Signal für `hreflang`: eine Adresse, die
 * nur die Grundfassung zeigt, darf sich nicht als eigene Sprachfassung melden.
 */
export interface InsightsPublicFassung {
  locale: InsightsLocale
  title: string
  dek: string
  body: string
  /** Der Leser wollte die andere Sprache und bekommt die Grundfassung. */
  fallback: boolean
}

export function insightsPublicFassung(post: InsightsPost, wanted: InsightsLocale): InsightsPublicFassung {
  const useBase = wanted !== post.baseLocale && !post.translationReviewed
  const locale = useBase ? post.baseLocale : wanted
  return {
    locale,
    title: insightsTitleOf(post, locale),
    dek: insightsDekOf(post, locale),
    body: insightsBodyOf(post, locale),
    fallback: useBase,
  }
}

/** Ist der Beitrag überhaupt öffentlich? Zwei Zustände, nie mehr (§3.2). */
export function insightsIsPublic(post: Pick<InsightsPost, 'state'>): boolean {
  return (INSIGHTS_PUBLIC_STATES as readonly string[]).includes(post.state)
}

/**
 * DIE LESEZEIT (§9.3): Wörter ÷ 200, aufgerundet, gerechnet beim SPEICHERN.
 * Nicht beim Lesen — sonst rechnet jede Seitenansicht dieselbe Zahl neu, und
 * die Sortierung „Kürzeste Lesezeit" müsste den ganzen Text laden.
 */
export function insightsReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 0
  return Math.min(INSIGHTS_READING_MINUTES_MAX, Math.max(1, Math.ceil(words / INSIGHTS_WORDS_PER_MINUTE)))
}

/**
 * DER DUELL-SLUG (§11 Frage 2): die zwei Marken-Slugs in ALPHABETISCHER
 * Reihenfolge, damit `nike-vs-adidas` und `adidas-vs-nike` nicht zwei Seiten
 * mit demselben Inhalt werden; die andere Richtung antwortet 301.
 *
 * Die Funktion nimmt FERTIGE Slugs entgegen und macht selbst keine: die
 * Slug-Regel (Umlaute, Diakritika, Deckel 80) gehört dem brand-Layer
 * (`brandPublicationSlug`) und wird über den Vertrag geteilt — eine zweite
 * Slug-Funktion wäre eine zweite Wahrheit über dieselbe Adresse.
 */
export function insightsDuelSlug(a: string, b: string): string {
  return [a, b].sort((x, y) => x.localeCompare(y, 'en')).join('-vs-')
}

// ── 5. Die Prüfregeln vor `review` ─────────────────────────────────────────

export type InsightsReviewCode =
  | 'quote_too_long'
  | 'quote_not_grounded'
  | 'source_missing_publisher'
  | 'source_missing_date'
  | 'source_missing_license'
  | 'fact_without_source'
  | 'disparagement'
  | 'score_without_methodology'
  | 'brand_without_entity'

export interface InsightsReviewIssue {
  code: InsightsReviewCode
  /** Woran es liegt — Quelle Nr. n, Faktenzeile Nr. n, Marken-Verweis Nr. n. */
  at?: { kind: 'source' | 'fact' | 'brandRef' | 'text', index: number }
  /** Die Stelle im Text bzw. der fehlende Schlüssel — nie eine ganze Fassung. */
  detail?: string
}

/**
 * WAS VON AUSSEN HEREINKOMMT — und warum es nicht hier drin steht.
 *
 * `quoteGrounded` ist die DETERMINISTISCHE Beleg-Prüfung (§9.4: „der prüft
 * deterministisch, nicht mit KI"). Sie existiert bereits als
 * `evidenceIsGrounded` in `market/shared/marketExtractRules.ts` — und genau
 * dort liegt das Problem: `market` und `insights` sind ZWEI Produkt-Layer, und
 * ein Produkt-Layer importiert keinen anderen (CONCEPT A14, ESLint-Backstop).
 * Der Riegel wird deshalb HEREINGEREICHT statt abgeschrieben; wohin die
 * Funktion gehört (core? brand-Vertrag?), ist eine Entscheidung für I1/I2 und
 * steht als offene Frage im Prototyp-Bericht. Abschreiben wäre der teurere
 * Fehler: zwei Riegel driften, und der schwächere gewinnt.
 *
 * `flagText` ist derselbe Fall für den Namens- und Herabsetzungsfilter
 * (`createMarketDisparagementGuard` / `checkMarketTexts`).
 *
 * FEHLT eine der beiden Funktionen, prüft diese Regel sie NICHT — und das ist
 * kein stiller Durchlass, sondern der Grund, warum der Aufrufer sie stellt:
 * eine Prüfung, die ohne Text „grün" sagt, wäre eine Lüge; eine, die sie gar
 * nicht erst behauptet, ist eine Lücke, die man sieht.
 */
export interface InsightsReviewContext {
  quoteGrounded?: (source: InsightsSource, index: number) => boolean
  flagText?: (text: string) => readonly string[]
  /** Die `insights_brands`-Zeilen, die es wirklich gibt (Regel 6). */
  knownBrandIds?: readonly string[]
  /** Verlinkt der Beitrag die Methodik-Seite? (Regel 5, Entscheidung 7/11.) */
  methodologyLinked?: boolean
}

/**
 * DIE SECHS PRÜFREGELN VOR DEM ÜBERGANG NACH `review` (§9.4) — alle
 * blockierend, alle pur, alle mit Gegenprobe im Test.
 *
 * Sie geben eine LISTE zurück und nicht `true`/`false`: der Redakteur muss
 * sehen, WELCHE Stelle klemmt („ein Treffer blockiert nicht stumm, sondern
 * zeigt die Stelle", §9.4 Nr. 4).
 */
export function insightsReviewIssues(post: InsightsPost, context: InsightsReviewContext = {}): InsightsReviewIssue[] {
  const issues: InsightsReviewIssue[] = []

  // 1 — Zitatschranke und Beleg-Riegel.
  for (const [index, source] of post.sources.entries()) {
    if (source.quote.length > INSIGHTS_QUOTE_MAX) {
      issues.push({ code: 'quote_too_long', at: { kind: 'source', index } })
    }
    if (source.quote && context.quoteGrounded && !context.quoteGrounded(source, index)) {
      issues.push({ code: 'quote_not_grounded', at: { kind: 'source', index } })
    }
    // 2 — Herausgeber, Datum, Lizenz.
    if (source.kind !== 'own-data') {
      if (!source.publisher) issues.push({ code: 'source_missing_publisher', at: { kind: 'source', index } })
      if (!source.date) issues.push({ code: 'source_missing_date', at: { kind: 'source', index } })
    }
    if (source.kind === 'wikipedia' && !source.license) {
      issues.push({ code: 'source_missing_license', at: { kind: 'source', index } })
    }
  }

  // 3 — jede Faktenzeile zeigt auf eine Quelle.
  for (const [index, fact] of post.facts.entries()) {
    if (fact.sourceIndex < 0 || fact.sourceIndex >= post.sources.length) {
      issues.push({ code: 'fact_without_source', at: { kind: 'fact', index } })
    }
  }

  // 4 — Namens- und Herabsetzungsfilter auf Titel, Vorspann und Fliesstext.
  if (context.flagText) {
    const texts = [post.titleDe, post.titleEn, post.dekDe, post.dekEn, post.bodyDe, post.bodyEn]
    for (const [index, text] of texts.entries()) {
      if (!text) continue
      for (const hit of context.flagText(text)) {
        issues.push({ code: 'disparagement', at: { kind: 'text', index }, detail: hit })
      }
    }
  }

  // 5 — jeder gezeigte Score verlinkt die Methodik (Entscheidung 7/11).
  const showsScore = post.format === 'ranking' || post.brandRefs.some(ref => ref.checkId)
  if (showsScore && context.methodologyLinked === false) {
    issues.push({ code: 'score_without_methodology' })
  }

  // 6 — jede genannte Marke hat eine Zeile. Ohne sie gäbe es keinen Ort, an
  //     dem ein Korrekturvorschlag ankommen könnte.
  if (context.knownBrandIds) {
    const known = new Set(context.knownBrandIds)
    for (const [index, ref] of post.brandRefs.entries()) {
      if (!known.has(ref.brandId)) issues.push({ code: 'brand_without_entity', at: { kind: 'brandRef', index }, detail: ref.brandId })
    }
    for (const [index, entry] of (post.ranking?.entries ?? []).entries()) {
      if (!entry.removed && !known.has(entry.brandId)) {
        issues.push({ code: 'brand_without_entity', at: { kind: 'fact', index }, detail: entry.brandId })
      }
    }
  }

  return issues
}

// ── 6. Die Marken-Entität ──────────────────────────────────────────────────

/** Ein eigenständiges Markenzeichen mit Beleg (§2.1, §9.3 `marks`). */
export const insightsMarkSchema = z.object({
  kind: z.enum(['symbol', 'claim', 'type', 'color']),
  text: z.string().min(1).max(300),
  sourceIndex: z.number().int().min(0),
})

/** Ein Jahr und ein Satz (§9.3 `history`). */
export const insightsHistoryEntrySchema = z.object({
  year: z.number().int().min(1000).max(2999),
  text: z.string().min(1).max(300),
  sourceIndex: z.number().int().min(0),
})

/**
 * DIE MARKEN-ENTITÄT (§9.3 `insights_brands`) — eine FREMDE Marke.
 *
 * Sie ist bewusst NICHT dieselbe Zeile wie eine Discover-Publikation (§9.3,
 * drei Gründe): entgegengesetzte Rechtsgrundlage (Opt-in gegen Zitatrecht),
 * entgegengesetzter Notausgang (Knopf gegen protokollierten Vorgang),
 * entgegengesetzter Inhalt (Purpose/Werte/Stimme gegen Zeichen/Historie/
 * Beziehungen). Dieselben Kapitel in einer Tabelle zu führen hiesse, die eine
 * Hälfte dauerhaft leer zu lassen.
 *
 * `state: 'removed'` IST der Notausgang aus Entscheidung 11 („ohne Diskussion
 * gewährt") — mit Datum und Grund, weil genau danach Anwaltsfrage 3 fragt.
 */
export const insightsBrandSchema = z.object({
  slug: z.string().min(1).max(160),
  slugHistory: z.array(z.string().max(160)).max(INSIGHTS_SLUG_HISTORY_MAX).default([]),
  name: z.string().min(1).max(200),
  homepage: z.string().max(512).default(''),
  libraryKey: z.string().max(64).default(''),
  checkId: z.string().max(64).default(''),
  publicationId: z.string().max(64).default(''),
  industry: z.string().max(40).default(''),
  country: z.string().max(2).default(''),
  foundedYear: z.number().int().min(1000).max(2999).nullable().default(null),
  archetype: z.string().max(40).default(''),
  archetypeSecondary: z.string().max(40).default(''),
  paletteId: z.string().max(40).default(''),
  marks: z.array(insightsMarkSchema).max(8).default([]),
  history: z.array(insightsHistoryEntrySchema).max(12).default([]),
  relations: z.array(z.string().max(64)).max(12).default([]),
  sources: z.array(insightsSourceSchema).max(40).default([]),
  state: z.enum(['draft', 'published', 'removed']),
  removedAt: z.string().max(32).default(''),
  removalReason: z.string().max(300).default(''),
  claimedBy: z.string().max(64).default(''),
}).superRefine((brand, ctx) => {
  if (brand.state === 'removed' && !brand.removalReason) {
    ctx.addIssue({ code: 'custom', path: ['removalReason'], message: 'Entfernung ohne dokumentierten Grund' })
  }
  for (const [index, mark] of brand.marks.entries()) {
    if (mark.sourceIndex >= brand.sources.length) {
      ctx.addIssue({ code: 'custom', path: ['marks', index, 'sourceIndex'], message: 'Zeichen ohne Beleg' })
    }
  }
  for (const [index, entry] of brand.history.entries()) {
    if (entry.sourceIndex >= brand.sources.length) {
      ctx.addIssue({ code: 'custom', path: ['history', index, 'sourceIndex'], message: 'Historien-Zeile ohne Beleg' })
    }
  }
})

export type InsightsBrand = z.infer<typeof insightsBrandSchema>

/**
 * DER SCORE ALS ANSICHT, NICHT ALS SPALTE (Entscheidung 7, §9.0).
 *
 * Er kommt über den brand-Vertrag aus `brand_checks` — dieselbe Zahl wie im
 * Produkt, mit Band und den acht Kategorien. Eine eigene Spalte hier wäre die
 * zweite Wahrheit, die Entscheidung 7 ausdrücklich verbietet („keine zweite
 * Skala, kein Insights-Score").
 *
 * DIE ZWEITZEILE ENTFÄLLT: für eine FREMDE Marke gibt es nur den
 * Website-Score; die Fundament-Reife (DB1-Entscheidung 3) hat sie nicht, und
 * sie wird nicht erfunden.
 */
export interface InsightsBrandScore {
  score: number
  band: string
  checkId: string
  /** Die acht Kategorien des Brand-Checks, in der Reihenfolge der Methodik. */
  dimensions: readonly { key: string, label: string, value: number }[]
}

// ── 7. Themenradar (§9.6, Paket I4) ────────────────────────────────────────

/**
 * WAS VOM RADAR GESPEICHERT WERDEN DARF (§9.6 Leitplanke a).
 *
 * Je Video nur die öffentlichen Zahlen der API: Aufrufe, Likes,
 * Kommentar-ZAHL, Veröffentlichungsdatum, Kanal. KEINE Kommentar-Texte, KEINE
 * Nutzernamen (Leitplanke b), KEIN Verdichten über Kanäle hinweg (Policies
 * III.E.2). Aufbewahrung höchstens 30 Kalendertage (III.E.4) — oder täglich
 * neu geholt und überschrieben; welches von beiden, entscheidet I4 an der
 * Lauf-Frequenz.
 *
 * Die Kommentar-ZAHL ist keine Kommentar-Auswertung: sie ist eine öffentliche
 * Kennzahl des Videos.
 */
export const insightsRadarVideoSchema = z.object({
  videoId: z.string().min(1).max(32),
  channelId: z.string().min(1).max(64),
  channelTitle: z.string().min(1).max(160),
  channelSubscribers: z.number().int().min(0),
  title: z.string().min(1).max(300),
  views: z.number().int().min(0),
  likes: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  publishedAt: dateSchema,
  fetchedAt: dateSchema,
  topic: z.enum(INSIGHTS_TOPIC_KEYS as [InsightsTopicKey, ...InsightsTopicKey[]]),
})

export type InsightsRadarVideo = z.infer<typeof insightsRadarVideoSchema>

/** Höchstens 30 Kalendertage (YouTube API Services Developer Policies III.E.4). */
export const INSIGHTS_RADAR_RETENTION_DAYS = 30

/** Je Signal 0–20 (§9.6). DREI davon, nicht fünf — s. `insightsOpportunity()`. */
export const INSIGHTS_OPPORTUNITY_SIGNALS = ['performance', 'age', 'relevance'] as const
export const INSIGHTS_OPPORTUNITY_MAX = INSIGHTS_OPPORTUNITY_SIGNALS.length * 20

/** Halbwertszeit des Alters-Signals in Tagen (§9.6). */
export const INSIGHTS_OPPORTUNITY_HALF_LIFE_DAYS = 90

/**
 * POPULARITÄT = Aufrufe ÷ Abonnenten (§9.6). Ein Video mit 50k Aufrufen auf
 * einem Kanal mit 20k Abonnenten schlägt eines mit 200k auf einem Kanal mit
 * 5 Mio — das ist der ganze Punkt der Normalisierung.
 */
export function insightsPopularity(views: number, subscribers: number): number {
  if (subscribers <= 0) return 0
  return views / subscribers
}

/**
 * UNSERE ZAHL — und sie heisst, was sie rechnet (§9.6, §11.1 Nr. 2).
 *
 * Drei Signale zu je 0–20, Summe 0–60. Der Plan nennt fünf (zusätzlich
 * Suchnachfrage und Konkurrenz); für die zwei gibt es heute keine Datenquelle
 * — kein Ahrefs, keine Search Console auf branding.supply. Ein Score, der
 * fünf behauptet und drei rechnet, ist die teurere Variante: er sähe aus wie
 * ein schlechtes Ergebnis, wo in Wahrheit zwei Summanden fehlen. Deshalb
 * zeigt die Oberfläche „44 von 60 · 3 Signale" und nicht „44 von 100".
 *
 * Die Zahl ist UNSERE (Leitplanke a): sie wird aus API-Werten gerechnet, ist
 * ein eigenes Ergebnis und fällt nicht unter das Aggregations-Verbot für
 * API-Daten. Sie darf bleiben, auch wenn die Zahlen darunter ablaufen — dann
 * steht sie mit ihrem Stand da, wie jede andere Messung.
 */
export interface InsightsOpportunity {
  performance: number
  age: number
  relevance: number
  score: number
}

export function insightsOpportunity(input: {
  popularity: number
  ageDays: number
  /** Nähe zu unseren acht Clustern, 0–1 (Schlagwortliste, §9.6). */
  relevance: number
}): InsightsOpportunity {
  const clamp = (value: number) => Math.max(0, Math.min(20, Math.round(value)))
  // Popularität 1.0 (so viele Aufrufe wie Abonnenten) = volle 20 Punkte.
  const performance = clamp(Math.min(1, input.popularity) * 20)
  // Halbwertszeit 90 Tage: heute 20, nach 90 Tagen 10, nach 180 Tagen 5.
  const age = clamp(20 * 0.5 ** (Math.max(0, input.ageDays) / INSIGHTS_OPPORTUNITY_HALF_LIFE_DAYS))
  const relevance = clamp(Math.max(0, Math.min(1, input.relevance)) * 20)
  return { performance, age, relevance, score: performance + age + relevance }
}

// ── 8. Liste: filtern und sortieren (§9.5) ─────────────────────────────────

/**
 * DIE DREI SORTIERUNGEN DER JOURNAL-LISTE (§9.5) — und die dritte ist heute
 * eine Absichtserklärung.
 *
 * „Meistgelesen" braucht eine Reichweiten-Zahl, und die gibt es auf
 * branding.supply erst mit Plausible (§11 Frage 3, Paket BS1 R2c: „erst Text,
 * dann Schalter"). Die Option steht trotzdem im Vertrag, weil sie in die
 * Werkzeugleiste gehört — sie ist dort SICHTBAR GESPERRT mit dem Grund
 * daneben. Eine unsichtbare Sperre erklärt sich nie, und eine stille
 * Ersatz-Sortierung („dann eben nach Datum") wäre eine Zahl, die niemand
 * gemessen hat.
 */
export const INSIGHTS_SORTS = ['newest', 'shortest', 'mostRead'] as const
export type InsightsSort = (typeof INSIGHTS_SORTS)[number]

/** Die Sortierungen, die HEUTE rechnen können. */
export const INSIGHTS_SORTS_AVAILABLE: readonly InsightsSort[] = ['newest', 'shortest']

export interface InsightsListFilter {
  format?: InsightsFormat | 'all'
  topic?: InsightsTopicKey | 'all'
  /** Sprache der REDIGIERTEN Fassung, nicht die Anzeigesprache des Lesers. */
  locale?: InsightsLocale | 'all'
}

export function insightsFilterPosts(posts: readonly InsightsPost[], filter: InsightsListFilter): InsightsPost[] {
  return posts.filter((post) => {
    if (filter.format && filter.format !== 'all' && post.format !== filter.format) return false
    if (filter.topic && filter.topic !== 'all' && !post.topics.includes(filter.topic)) return false
    if (filter.locale && filter.locale !== 'all') {
      // Eine Fassung zählt als vorhanden, wenn sie die Grundfassung IST oder
      // redigiert wurde — die maschinelle Rohfassung ist keine Fassung (§3.2).
      const available = post.baseLocale === filter.locale || post.translationReviewed
      if (!available) return false
    }
    return true
  })
}

/**
 * SORTIEREN OHNE DIE EINGABE ZU VERÄNDERN — `toSorted` gibt es erst ab Node 20
 * überall, `[...posts].sort()` überall. Eine an Ort und Stelle sortierte Liste
 * wäre in Vue eine Reihenfolge, die sich beim Rendern ändert.
 */
export function insightsSortPosts(posts: readonly InsightsPost[], sort: InsightsSort): InsightsPost[] {
  const list = [...posts]
  if (sort === 'shortest') return list.sort((a, b) => a.readingMinutes - b.readingMinutes)
  // `mostRead` fällt bewusst auf `newest` zurück — die Oberfläche lässt es gar
  // nicht erst wählen (INSIGHTS_SORTS_AVAILABLE), und ein stiller Ersatz wäre
  // die Lüge, die §9.5 vermeiden will.
  return list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
