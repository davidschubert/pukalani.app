import type {
  InsightsFormat,
  InsightsLocale,
  InsightsPost,
  InsightsReviewIssue,
  InsightsState,
} from '../insightsPost'
import type { InsightsRadarStoredVideo } from '../insightsRadar'

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

/** Eine Marken-Zeile, so wie der Editor sie zur Auswahl braucht. */
export interface InsightsBrandListItem {
  id: string
  name: string
  slug: string
  homepage: string
  industry: string
  state: string
}

export interface InsightsBrandsListResponse {
  brands: InsightsBrandListItem[]
}

export interface InsightsBrandCreatedResponse {
  brand: InsightsBrandListItem
  id: string
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

// ── Themenradar (BI1 I4, §9.6) ─────────────────────────────────────────────

/**
 * EIN VIDEO IN DER BETREIBER-ANSICHT — die API-Zahlen PLUS unsere drei.
 *
 * Der Typ ist ein Re-Export und keine zweite Aufzählung derselben Felder:
 * `InsightsRadarStoredVideo` beschreibt, was in der Zeile LIEGT, und die
 * Antwort gibt genau das weiter. Zwei Listen derselben Felder liefen
 * auseinander, sobald eine Spalte dazukäme.
 */
export type InsightsRadarVideoItem = InsightsRadarStoredVideo

/**
 * `GET /api/insights/radar` — der Zustand des Radars UND seine Zeilen.
 *
 * ── WARUM DER ZUSTAND MITKOMMT UND NICHT AUS EINER ZWEITEN ROUTE ────────
 * „Gibt es einen Schlüssel?", „wie viele Kanäle?", „was kostet ein Lauf?" und
 * „wann lief er zuletzt?" sind die vier Fragen, die die Seite beantworten
 * MUSS, bevor ihr Knopf überhaupt Sinn ergibt. Eine leere Tabelle heisst je
 * nach Antwort „noch nie gelaufen", „kein Schlüssel" oder „keine Kanäle" —
 * drei sehr verschiedene Arbeiten für den Betreiber, und eine zweite Route
 * dafür wäre ein zweiter Ladezustand für dieselbe Seite.
 */
export interface InsightsRadarResponse {
  /** Liegt ein API-Schlüssel vor? (`NUXT_INSIGHTS_YOUTUBE_KEY`) */
  configured: boolean
  /** Wie viele GÜLTIGE Kanäle in der Konfiguration stehen. */
  channels: number
  /** Was ein Lauf nach der Formel aus §9.6 kostet (von 10.000 am Tag). */
  quotaEstimate: number
  /**
   * Der jüngste `fetchedAt` aller Zeilen — `null`, wenn es keine gibt.
   * KEIN zweiter Zustand irgendwo: ein Stempel, der von den Zeilen abweichen
   * kann, wäre ein Datum, dem niemand mehr glaubt.
   */
  lastRunAt: string | null
  /** Der Stichtag der SERVER-Uhr (`YYYY-MM-DD`) — gegen ihn rechnet das Alter. */
  today: string
  videos: InsightsRadarVideoItem[]
}

/**
 * `POST /api/insights/radar/run` — das Ergebnis EINES Laufs, in Zahlen.
 *
 * Es ist das Sweep-Ergebnis unverändert. `skipped` sagt, wenn gar nichts
 * passiert ist, und WARUM — ein Lauf, der „0 Videos" meldet, weil kein
 * Schlüssel da ist, sieht sonst aus wie einer, der nichts gefunden hat.
 */
export interface InsightsRadarRunResponse {
  channels: number
  videos: number
  upserted: number
  deleted: number
  errors: number
  quotaUnits: number
  skipped?: 'not_configured' | 'no_channels' | 'quota_estimate' | 'running'
}
