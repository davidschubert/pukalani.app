import type {
  InsightsBrand,
  InsightsBrandState,
  InsightsFormat,
  InsightsLocale,
  InsightsPost,
  InsightsReviewIssue,
  InsightsState,
} from '../insightsPost'
import type {
  InsightsCorrection,
  InsightsCorrectionStatus,
} from '../insightsCorrection'

/**
 * DIE ANTWORT-TYPEN DER REDAKTIONS-ROUTEN (BI1 I2).
 *
 * ── WARUM SIE ÜBERHAUPT EXISTIEREN ───────────────────────────────────────
 * Nitros Routen-Typisierung ist im Repo AUS (Davids Entscheidung 2026-08-14,
 * TS2589-Strukturfix): `$fetch('/api/x')` liefert `unknown`, und jeder
 * gebundene Aufruf nennt seinen Antworttyp SELBST. Diese Datei ist die
 * gemeinsame Wahrheit dafür — verlangt an BEIDEN Enden (Handler-Annotation
 * `Promise<XyzResponse>` und `$fetch<XyzResponse>` in der Seite). Ein Typ, den
 * nur eine Seite kennt, ist eine Vermutung.
 *
 * ── DIE LISTE TRÄGT KEINEN FLIESSTEXT ────────────────────────────────────
 * `InsightsPostListItem` ist bewusst KEIN `InsightsPost`: die Liste zeigt
 * zwanzig Zeilen, und jede trüge sonst zwei vollständige Artikel-Fassungen
 * über die Leitung. Was sie zeigt, steht hier — mehr holt der Editor.
 */

/** Eine Zeile der Redaktionsliste (`GET /api/insights/posts`). */
export interface InsightsPostListItem {
  id: string
  format: InsightsFormat
  state: InsightsState
  baseLocale: InsightsLocale
  titleDe: string
  titleEn: string
  slug: string
  translationReviewed: boolean
  /** Leer, solange die zweite Fassung nie maschinell erzeugt wurde. */
  translatedAt: string
  publishedAt: string
  readingMinutes: number
  /** `$updatedAt` der Zeile — die Sortierung der Liste. */
  updatedAt: string
}

export interface InsightsPostsListResponse {
  posts: InsightsPostListItem[]
}

/**
 * Eine Marken-Zeile, so wie der Editor sie zur Auswahl und die Marken-SEITE
 * sie als Tabellenzeile braucht.
 *
 * `country` und `updatedAt` kamen mit der Marken-Seite (BI1 I2-Rest) dazu —
 * sie sind zwei Spalten dort und kosten in der Editor-Auswahl nichts. Eine
 * zweite, breitere Listen-Form daneben wäre ein zweiter Mapper über dieselbe
 * Zeile; die Antwort ist ohnehin auf 200 Zeilen gedeckelt und trägt keinen
 * Fliesstext.
 */
export interface InsightsBrandListItem {
  id: string
  name: string
  slug: string
  homepage: string
  industry: string
  country: string
  state: InsightsBrandState
  /** `$updatedAt` der Zeile — die Spalte „Zuletzt". */
  updatedAt: string
}

export interface InsightsBrandsListResponse {
  brands: InsightsBrandListItem[]
}

export interface InsightsBrandCreatedResponse {
  brand: InsightsBrandListItem
  id: string
}

/**
 * EINE MARKE ZUM BEARBEITEN (`GET /api/insights/brands/<id>`).
 *
 * Anders als das Listen-Item trägt sie den GANZEN Vertrag — Zeichen,
 * Historie, Beziehungen, Belege. Genau deshalb ist sie eine eigene Antwort
 * und reist nicht in der Liste mit: zweihundert Zeilen mit je vierzig Quellen
 * wären ein Megabyte für eine Tabelle mit sechs Spalten.
 */
export interface InsightsBrandDetailResponse {
  brand: InsightsBrand
  id: string
}

/**
 * Das Speichern gibt BEIDES zurück: die Zeile für das Formular und das
 * Listen-Item für die Tabelle dahinter.
 *
 * Ohne das `listItem` müsste die Seite nach jedem Speichern die ganze Liste
 * neu holen, nur um einen geänderten Namen anzuzeigen — für Daten, die diese
 * Antwort schon trägt (dasselbe Argument wie am Beitrags-Editor).
 */
export interface InsightsBrandSavedResponse {
  brand: InsightsBrand
  id: string
  listItem: InsightsBrandListItem
}

/**
 * Der Editor-Kontext (`GET /api/insights/posts/<id>`).
 *
 * `issues` kommt hier OHNE Beleg-Abruf: die Seite soll sofort zeigen, was
 * FORMAL fehlt (Herausgeber, Datum, Lizenz, Beleg-Zeiger, Marken-Zeile). Ob
 * ein Zitat wörtlich in seiner Quelle steht, kostet einen Abruf je Quelle und
 * passiert auf Knopfdruck bzw. im Zustands-Gate — nicht bei jedem Öffnen.
 */
export interface InsightsPostDetailResponse {
  post: InsightsPost
  id: string
  knownBrandIds: string[]
  brands: InsightsBrandListItem[]
  issues: InsightsReviewIssue[]
}

export interface InsightsPostCreatedResponse {
  post: InsightsPost
  id: string
}

/**
 * Das Löschen (`DELETE /api/insights/posts/<id>`) — die Id zurück, damit die
 * Liste die Zeile herausnehmen kann, ohne zu raten, welche gemeint war.
 *
 * `deleted: true` ist ein LITERAL und keine Höflichkeit: eine Antwort, die
 * `deleted: false` sagen könnte, hätte einen zweiten Ausgang, den niemand
 * behandelt. Was NICHT gelöscht werden darf, ist eine 409 — kein `false`.
 */
export interface InsightsPostDeletedResponse {
  id: string
  deleted: true
}

/** Das Speichern gibt die Zeile und die formalen Prüfpunkte zurück. */
export interface InsightsPostSavedResponse {
  post: InsightsPost
  issues: InsightsReviewIssue[]
}

/**
 * DIE ANTWORT DES ZUSTANDS-GATES — und warum sie ein `changed` trägt statt
 * eines 409.
 *
 * Ein blockierter Übergang ist kein Client-FEHLER, sondern eine ANTWORT: „nein,
 * und hier sind die neun Stellen". Genau diese Liste kann ein Fehler-Körper
 * aber nicht transportieren — der zentrale Handler (`core/server/error.ts`)
 * hebt aus `error.data` AUSSCHLIESSLICH einen kurzen Schlüssel als `reason`
 * ins Envelope und lässt den Rest bewusst draussen (keine Appwrite-Details).
 * Eine 409 mit `issues` im Körper wäre also eine 409 OHNE `issues` beim
 * Empfänger, und die Oberfläche müsste den ganzen teuren Gate-Lauf (bis zu
 * zwanzig fremde Websites) ein zweites Mal auslösen, nur um zu erfahren, was
 * der Server gerade gerechnet hat.
 *
 * `changed: false` mit gefüllter `issues`-Liste sagt beides in einer Antwort.
 * Der ZUSTAND ist trotzdem serverseitig gesichert: geschrieben wird nichts,
 * `post` ist unverändert. Was ein echter Client-Fehler ist, bleibt einer — ein
 * Übergang, den die Tabelle gar nicht kennt, antwortet weiter 409
 * (`transition_not_allowed`).
 */
export interface InsightsPostStateResponse {
  post: InsightsPost
  issues: InsightsReviewIssue[]
  changed: boolean
}

/**
 * WARUM DIE BELEG-AMPEL EINEN GRUND TRÄGT UND NICHT NUR EIN JA/NEIN.
 *
 * „Nicht gefunden" und „wir durften die Seite nicht lesen" sind für die
 * Redaktion zwei verschiedene Arbeiten: das eine heisst Zitat prüfen, das
 * andere Quelle wechseln. Ein einzelnes `false` liesse beide gleich aussehen.
 */
export type InsightsEvidenceReason =
  | 'ok'
  | 'not_found'
  | 'fetch_failed'
  | 'robots_denied'
  | 'tdm_reserved'
  | 'no_url'

export interface InsightsEvidenceResponse {
  grounded: boolean
  reason: InsightsEvidenceReason
  /** ISO-Zeitpunkt der Prüfung. Nichts davon wird gespeichert. */
  checkedAt: string
}

export interface InsightsTranslateResponse {
  post: InsightsPost
}

export interface InsightsDraftResponse {
  post: InsightsPost
}

// ── Korrekturvorschläge (BI1 I2-Rest, §9.3) ────────────────────────────────

/**
 * EINE ZEILE DER KORREKTUR-ARBEITSLISTE.
 *
 * ── DIE ADRESSE REIST NICHT MIT, NUR IHR VORHANDENSEIN ───────────────────
 * `contactEmail` ist das EINZIGE personenbezogene Feld dieses Layers (§9.3).
 * Die Arbeitsliste braucht es nicht: entschieden wird über Feld, Vorschlag
 * und Grund — die Adresse braucht erst, wer ANTWORTET, und das ist ein
 * eigener Vorgang. Eine Liste, die zwanzig fremde Adressen in den Browser
 * schiebt (und in jedes Protokoll dazwischen), damit eine Spalte ein Häkchen
 * zeigen kann, ist die teuerste Art, eine Auskunftspflicht zu verfehlen.
 * `hasContact` sagt dasselbe, was die Spalte zeigen soll.
 *
 * ── `targetLabel` IST LEER, WENN DAS ZIEL FEHLT ──────────────────────────
 * Der Vorschlag zeigt auf eine Zeilen-Id; ob es die Zeile noch gibt, ist eine
 * zweite Frage (ein gelöschter Beitrag, eine entfernte Marke). Leer heisst
 * „nicht auflösbar" — die Seite zeigt dann die Id, statt eine Leerstelle zu
 * zeigen, mit der niemand etwas anfangen kann.
 */
export type InsightsCorrectionListItem = Omit<InsightsCorrection, 'contactEmail'> & {
  id: string
  /** Titel des Beitrags bzw. Name der Marke — leer, wenn das Ziel fehlt. */
  targetLabel: string
  /** Ob eine Kontakt-Adresse hinterlegt ist — NIE die Adresse selbst. */
  hasContact: boolean
  createdAt: string
  /** Leer, solange die Zeile `open` ist. */
  decidedAt: string
}

/**
 * DIE ZÄHLER SIND UNABHÄNGIG VOM FILTER (wörtlich wie bei
 * `brand_check_corrections`): sonst wäre die Kopfzeile eine Funktion der
 * gerade gewählten Ansicht („0 offen", weil man die abgelehnten anschaut)
 * statt eine Aussage über die Liste.
 */
export interface InsightsCorrectionsListResponse {
  items: InsightsCorrectionListItem[]
  counts: Record<InsightsCorrectionStatus, number>
}

/** Die Entscheidung über einen Vorschlag — die Zeile, wie sie danach dasteht. */
export interface InsightsCorrectionDecisionResponse {
  item: InsightsCorrectionListItem
}
