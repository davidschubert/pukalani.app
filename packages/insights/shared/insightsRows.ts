import type { Models } from 'node-appwrite'
import type {
  InsightsBrand,
  InsightsBrandRef,
  InsightsDuelFact,
  InsightsFormat,
  InsightsLocale,
  InsightsPost,
  InsightsRanking,
  InsightsSource,
  InsightsTopicKey,
} from './insightsPost'
import {
  INSIGHTS_FORMATS,
  INSIGHTS_LOCALES,
  INSIGHTS_STATES,
  INSIGHTS_TOPIC_KEYS,
} from './insightsPost'
import type {
  InsightsCorrection,
  InsightsCorrectionKind,
  InsightsCorrectionStatus,
  InsightsCorrectionTargetKind,
} from './insightsCorrection'
import {
  INSIGHTS_CORRECTION_KINDS,
  INSIGHTS_CORRECTION_STATUSES,
  INSIGHTS_CORRECTION_TARGET_KINDS,
} from './insightsCorrection'

/**
 * DER ABLAGE-VERTRAG VON BRAND INSIGHTS (Migrationen insights-001…003,
 * Plan §9.3) — wie ein Beitrag, ein Markenprofil und ein Korrekturvorschlag
 * als Appwrite-ZEILE liegen, und die reine Abbildung in beide Richtungen.
 *
 * ── ZWEI EBENEN, ZWEI DATEIEN (Muster: market) ───────────────────────────
 * `insightsPost.ts` und `insightsCorrection.ts` sind der PRODUKT-Vertrag: was
 * ein Beitrag IST, was eine Quelle mitbringen muss, was vor der Freigabe
 * gilt. Diese Datei ist der ABLAGE-Vertrag. Sie hängt von jenen ab, nie
 * umgekehrt — sonst wanderte die Datenbank in den Produktbegriff (wörtlich
 * derselbe Zuschnitt wie `market/shared/marketProfile.ts` ↔
 * `market/shared/types/market.ts`).
 *
 * ── WARUM SIE IN `shared/` LIEGT UND NICHT IN `server/utils/` ────────────
 * Weil sie PUR ist: kein `H3Event`, kein Appwrite-Client, kein Auto-Import.
 * Nur so lässt sie sich in einem Vitest-Lauf ohne Nitro prüfen — und geprüft
 * werden muss sie, weil hier die Rundreise Zeile ⇄ Vertrag stattfindet und
 * ein stiller Verlust in einer JSON-Spalte sonst erst auf einer öffentlichen
 * Seite auffällt. `server/utils/insightsStore.ts` daneben hält, was einen
 * Request braucht (Client, Database-Id, Tabellennamen).
 *
 * ── DIE JSON-SPALTEN WERDEN FAIL-SOFT GELESEN ───────────────────────────
 * `sources`, `brandRefs`, `facts`, `slugHistory`, `marks`, `history`,
 * `relations` und `topics` sind Zeichenketten in der Datenbank. Was darin
 * steht, hat teils ein MODELL geschrieben (Entwurf, Übersetzung), teils eine
 * ältere Prompt- oder Schema-Fassung. Ein `JSON.parse` ohne Netz liesse eine
 * einzige kaputte Zeile die ganze Redaktionsliste mit einem 500 beenden —
 * und zwar genau die Zeile, die jemand reparieren wollte. Ungültiges JSON
 * ergibt deshalb eine LEERE Liste, nie einen Absturz. Die inhaltliche Prüfung
 * bleibt Sache der Schemas im Produkt-Vertrag; sie läuft dort, wo eine
 * Ablehnung einem Menschen gezeigt werden kann.
 *
 * ── UNBEKANNTE AUFZÄHLUNGSWERTE FALLEN IN DIE SICHERE RICHTUNG ──────────
 * `format`, `state`, `baseLocale`, `targetKind`, `kind` und `status` sind
 * varchars (Begründung in den Migrationsköpfen: die Wahrheit über die
 * erlaubten Werte steht im Code, ein siebter Wert soll keine Migration auf
 * einer laufenden Instanz kosten). Liest ein Leser hier trotzdem etwas
 * Unbekanntes, ist das ein FEHLER — und die Abbildung muss trotzdem eine
 * Antwort geben, sonst kann die Redaktion die kaputte Zeile nicht öffnen, um
 * sie zu reparieren. Der Ersatzwert ist deshalb immer der ENGSTE: `state`
 * fällt auf `draft` (nicht öffentlich), `status` auf `open` (nicht
 * entschieden), `format` auf `article` (das Format ohne Faktenpflicht). Ein
 * Fallback in die andere Richtung würde eine unfertige Zeile veröffentlichen.
 */

// ── Tabellennamen ──────────────────────────────────────────────────────────
// EINMAL, weil eine Zeichenkette in vier Dateien ein Tippfehler in vier
// Dateien ist — und ein falscher Tabellenname in Appwrite ein 404, das wie
// „keine Daten" aussieht. Sie stehen HIER und nicht in `server/utils`, damit
// die Migrationen (die kein Nitro haben) dieselben Namen lesen können.
export const INSIGHTS_POSTS_TABLE = 'insights_posts'
export const INSIGHTS_BRANDS_TABLE = 'insights_brands'
export const INSIGHTS_CORRECTIONS_TABLE = 'insights_corrections'

// ── Zeilen (insights-001 … insights-003) ───────────────────────────────────

/** Ein Beitrag (insights-001). Alle Listen-Spalten sind JSON (s. Kopf). */
export type InsightsPostRow = Models.Row & {
  format: string
  slug: string
  /** JSON `string[]` — alte Slugs, jüngster zuerst. */
  slugHistory?: string
  state: string
  baseLocale: string
  titleDe?: string
  titleEn?: string
  dekDe?: string
  dekEn?: string
  /** MEDIUMTEXT ⇒ kein Spalten-Default, deshalb `null` möglich. */
  bodyDe?: string | null
  bodyEn?: string | null
  translatedAt?: string | null
  translationModel?: string
  translationPromptVersion?: string
  translationReviewed?: boolean
  /** JSON `string[]` — Schlüssel aus dem Cluster-Katalog. */
  topics?: string
  /** MEDIUMTEXT, JSON `InsightsSource[]`. */
  sources?: string | null
  /** JSON `InsightsBrandRef[]`. */
  brandRefs?: string
  /**
   * MEDIUMTEXT, ZWEI Formen (§9.3): eine LISTE ⇒ Duell-Zeilen, ein OBJEKT ⇒
   * das eingefrorene Ranking. Die Form entscheidet, nicht `format` — so
   * überlebt eine Zeile, deren Format jemand umgestellt und deren Daten er
   * stehen gelassen hat, wenigstens lesbar.
   */
  facts?: string | null
  readingMinutes?: number
  publishedAt?: string | null
  reviewedAt?: string | null
  reviewedBy?: string
  noteInternal?: string
  draftModel?: string
  draftPromptVersion?: string
}

/** Ein Markenprofil einer FREMDEN Marke (insights-002). */
export type InsightsBrandRow = Models.Row & {
  slug: string
  /** JSON `string[]`. */
  slugHistory?: string
  name: string
  homepage?: string
  libraryKey?: string
  checkId?: string
  publicationId?: string
  industry?: string
  country?: string
  /** 0 = unbekannt (die Spalte hat keinen NULL-Zustand). */
  foundedYear?: number
  archetype?: string
  archetypeSecondary?: string
  paletteId?: string
  /** JSON `InsightsMark[]`. */
  marks?: string
  /** JSON `InsightsHistoryEntry[]`. */
  history?: string
  /** JSON `string[]` — Zeilen-Ids der Wettbewerber. */
  relations?: string
  /** MEDIUMTEXT, JSON `InsightsSource[]`. */
  sources?: string | null
  state: string
  removedAt?: string | null
  removalReason?: string
  claimedBy?: string
}

/** Ein Korrekturvorschlag oder Entfernungs-Wunsch (insights-003). */
export type InsightsCorrectionRow = Models.Row & {
  targetKind: string
  targetId: string
  kind: string
  field?: string
  proposed?: string
  reason?: string
  /** Kleingeschrieben gespeichert — der Lesepfad des GDPR-Contributors. */
  contactEmail?: string
  status: string
  decisionNote?: string
  decidedAt?: string | null
  /** sha256 mit Tages-Salz, nie die rohe IP. */
  ipHash?: string
  /** Ab hier werden `contactEmail` und `ipHash` geleert (§9.3). */
  retentionAt?: string | null
}

// ── Die puren Helfer ───────────────────────────────────────────────────────

/**
 * JSON aus einer Spalte lesen — `null` statt eines Wurfs (s. Kopf).
 *
 * Bewusst OHNE Schema-Prüfung: die inhaltliche Wahrheit steht in den Zod-
 * Schemas des Produkt-Vertrags, und die gehören an die Stelle, an der eine
 * Ablehnung jemandem gezeigt werden kann. Hier geht es nur darum, dass eine
 * kaputte Zeile die Liste nicht mitreisst.
 */
function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

/** Eine JSON-Liste aus einer Spalte — leer, wenn dort nichts Lesbares steht. */
function parseJsonArray<T>(raw: string | null | undefined): T[] {
  const value = parseJson(raw)
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Ein Aufzählungswert aus einem varchar — mit Ersatzwert in die sichere
 * Richtung (s. Kopf).
 */
function oneOf<T extends string>(allowed: readonly T[], value: string | undefined, fallback: T): T {
  return (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback
}

/** JSON schreiben. Leere Listen werden zu `[]`, nie zu `''` — eine leere
 *  Zeichenkette liest sich beim nächsten Mal als „kaputt" statt als „leer". */
function toJson(value: unknown): string {
  return JSON.stringify(value)
}

// ── Beitrag: Zeile ⇄ Vertrag ───────────────────────────────────────────────

/**
 * ZEILE → VERTRAG. Fail-soft in jeder JSON-Spalte, engster Ersatzwert in
 * jeder Aufzählung (s. Kopf). Das Ergebnis ist NICHT geprüft — wer eine
 * geprüfte Zusage braucht (Freigabe, öffentliche Route), schickt es durch
 * `insightsPostSchema`.
 */
export function toInsightsPost(row: InsightsPostRow): InsightsPost {
  const facts = parseJson(row.facts)
  const isRanking = !!facts && !Array.isArray(facts) && typeof facts === 'object'
  return {
    format: oneOf<InsightsFormat>(INSIGHTS_FORMATS, row.format, 'article'),
    slug: row.slug,
    slugHistory: parseJsonArray<string>(row.slugHistory),
    state: oneOf(INSIGHTS_STATES, row.state, 'draft'),
    baseLocale: oneOf<InsightsLocale>(INSIGHTS_LOCALES, row.baseLocale, 'en'),
    titleDe: row.titleDe ?? '',
    titleEn: row.titleEn ?? '',
    dekDe: row.dekDe ?? '',
    dekEn: row.dekEn ?? '',
    bodyDe: row.bodyDe ?? '',
    bodyEn: row.bodyEn ?? '',
    translatedAt: row.translatedAt ?? '',
    translationModel: row.translationModel ?? '',
    translationPromptVersion: row.translationPromptVersion ?? '',
    translationReviewed: row.translationReviewed === true,
    // Unbekannte Cluster-Schlüssel fallen heraus statt den Typ zu brechen:
    // ein umbenanntes Thema soll keine ganze Zeile unlesbar machen.
    topics: parseJsonArray<string>(row.topics)
      .filter((key): key is InsightsTopicKey => (INSIGHTS_TOPIC_KEYS as readonly string[]).includes(key)),
    sources: parseJsonArray<InsightsSource>(row.sources),
    brandRefs: parseJsonArray<InsightsBrandRef>(row.brandRefs),
    facts: isRanking ? [] : parseJsonArray<InsightsDuelFact>(row.facts),
    ranking: isRanking ? (facts as InsightsRanking) : null,
    readingMinutes: row.readingMinutes ?? 0,
    publishedAt: row.publishedAt ?? '',
    reviewedAt: row.reviewedAt ?? '',
    reviewedBy: row.reviewedBy ?? '',
    noteInternal: row.noteInternal ?? '',
    draftModel: row.draftModel ?? '',
    draftPromptVersion: row.draftPromptVersion ?? '',
  }
}

/** Die schreibbaren Felder einer Beitrags-Zeile — ohne die `$`-Attribute. */
export type InsightsPostRowData = Omit<InsightsPostRow, keyof Models.Row>

/**
 * VERTRAG → ZEILE. Die Datums-Spalten sind `datetime` und vertragen KEINE
 * leere Zeichenkette (Appwrite lehnt sie ab) — leer heisst hier `null`.
 */
export function fromInsightsPost(post: InsightsPost): InsightsPostRowData {
  return {
    format: post.format,
    slug: post.slug,
    slugHistory: toJson(post.slugHistory),
    state: post.state,
    baseLocale: post.baseLocale,
    titleDe: post.titleDe,
    titleEn: post.titleEn,
    dekDe: post.dekDe,
    dekEn: post.dekEn,
    bodyDe: post.bodyDe,
    bodyEn: post.bodyEn,
    translatedAt: post.translatedAt || null,
    translationModel: post.translationModel,
    translationPromptVersion: post.translationPromptVersion,
    translationReviewed: post.translationReviewed,
    topics: toJson(post.topics),
    sources: toJson(post.sources),
    brandRefs: toJson(post.brandRefs),
    // Die zwei Formen aus §9.3 in EINER Spalte: das Ranking gewinnt, wenn es
    // da ist — ein Beitrag kann nie beides sein (das Schema verbietet es).
    facts: post.ranking ? toJson(post.ranking) : toJson(post.facts),
    readingMinutes: post.readingMinutes,
    publishedAt: post.publishedAt || null,
    reviewedAt: post.reviewedAt || null,
    reviewedBy: post.reviewedBy,
    noteInternal: post.noteInternal,
    draftModel: post.draftModel,
    draftPromptVersion: post.draftPromptVersion,
  }
}

// ── Markenprofil: Zeile ⇄ Vertrag ──────────────────────────────────────────

const BRAND_STATES = ['draft', 'published', 'removed'] as const

/** ZEILE → VERTRAG (s. Kopf: fail-soft, engster Ersatzwert). */
export function toInsightsBrand(row: InsightsBrandRow): InsightsBrand {
  return {
    slug: row.slug,
    slugHistory: parseJsonArray<string>(row.slugHistory),
    name: row.name,
    homepage: row.homepage ?? '',
    libraryKey: row.libraryKey ?? '',
    checkId: row.checkId ?? '',
    publicationId: row.publicationId ?? '',
    industry: row.industry ?? '',
    country: row.country ?? '',
    // 0 in der Spalte heisst „unbekannt" — im Vertrag ist das `null` (dort
    // gibt es keinen Jahrgang 0, und `null` sagt es ehrlicher als eine Zahl).
    foundedYear: row.foundedYear ? row.foundedYear : null,
    archetype: row.archetype ?? '',
    archetypeSecondary: row.archetypeSecondary ?? '',
    paletteId: row.paletteId ?? '',
    marks: parseJsonArray<InsightsBrand['marks'][number]>(row.marks),
    history: parseJsonArray<InsightsBrand['history'][number]>(row.history),
    relations: parseJsonArray<string>(row.relations),
    sources: parseJsonArray<InsightsSource>(row.sources),
    state: oneOf(BRAND_STATES, row.state, 'draft'),
    removedAt: row.removedAt ?? '',
    removalReason: row.removalReason ?? '',
    claimedBy: row.claimedBy ?? '',
  }
}

/** Die schreibbaren Felder einer Marken-Zeile. */
export type InsightsBrandRowData = Omit<InsightsBrandRow, keyof Models.Row>

/** VERTRAG → ZEILE. */
export function fromInsightsBrand(brand: InsightsBrand): InsightsBrandRowData {
  return {
    slug: brand.slug,
    slugHistory: toJson(brand.slugHistory),
    name: brand.name,
    homepage: brand.homepage,
    libraryKey: brand.libraryKey,
    checkId: brand.checkId,
    publicationId: brand.publicationId,
    industry: brand.industry,
    country: brand.country,
    foundedYear: brand.foundedYear ?? 0,
    archetype: brand.archetype,
    archetypeSecondary: brand.archetypeSecondary,
    paletteId: brand.paletteId,
    marks: toJson(brand.marks),
    history: toJson(brand.history),
    relations: toJson(brand.relations),
    sources: toJson(brand.sources),
    state: brand.state,
    removedAt: brand.removedAt || null,
    removalReason: brand.removalReason,
    claimedBy: brand.claimedBy,
  }
}

// ── Korrekturvorschlag: Zeile ⇄ Vertrag ────────────────────────────────────

/**
 * ZEILE → VERTRAG. `ipHash`, `decidedAt` und `retentionAt` reisen NICHT mit:
 * der Vertrag beschreibt, was ein Mensch eingereicht und was die Redaktion
 * entschieden hat — die drei sind Betriebsdaten der Zeile und haben in einer
 * Antwort nichts verloren (der `ipHash` erst recht nicht).
 */
export function toInsightsCorrection(row: InsightsCorrectionRow): InsightsCorrection {
  return {
    targetKind: oneOf<InsightsCorrectionTargetKind>(INSIGHTS_CORRECTION_TARGET_KINDS, row.targetKind, 'brand'),
    targetId: row.targetId,
    kind: oneOf<InsightsCorrectionKind>(INSIGHTS_CORRECTION_KINDS, row.kind, 'correction'),
    field: row.field ?? '',
    proposed: row.proposed ?? '',
    reason: row.reason ?? '',
    contactEmail: row.contactEmail ?? '',
    status: oneOf<InsightsCorrectionStatus>(INSIGHTS_CORRECTION_STATUSES, row.status, 'open'),
    decisionNote: row.decisionNote ?? '',
  }
}

/** Die schreibbaren Felder einer Korrektur-Zeile. */
export type InsightsCorrectionRowData = Omit<InsightsCorrectionRow, keyof Models.Row>

/**
 * VERTRAG → ZEILE. `ipHash`, `decidedAt` und `retentionAt` setzt die ROUTE
 * (I3) — sie stammen nicht aus dem Vertrag, und sie hier mit Vorgabewerten zu
 * füllen hiesse, eine Aufbewahrungsfrist zu erfinden, die niemand gerechnet
 * hat.
 */
export function fromInsightsCorrection(
  correction: InsightsCorrection,
): Omit<InsightsCorrectionRowData, 'ipHash' | 'decidedAt' | 'retentionAt'> {
  return {
    targetKind: correction.targetKind,
    targetId: correction.targetId,
    kind: correction.kind,
    field: correction.field,
    proposed: correction.proposed,
    reason: correction.reason,
    contactEmail: correction.contactEmail,
    status: correction.status,
    decisionNote: correction.decisionNote,
  }
}
