import {
  BRAND_CHECK_CATEGORIES,
  brandCheckCategoryScores,
  type BrandCheckCategoryLike,
} from './brandCheck'

/**
 * DER VERGLEICH ZWEIER CHECKS — „das Quartett"
 * (docs/plans/BRAND-CHECK-SEITE.md §4, Paket P4). Pur: ohne h3, ohne Appwrite,
 * ohne Vue.
 *
 * ── ES WIRD NICHT NEU GERECHNET, NUR GEGENÜBERGESTELLT ────────────────────
 * Die acht Kategorie-Werte kommen aus `brandCheckCategoryScores()` — derselben
 * Umrechnung, aus der auch das Ranking und der Verlauf lesen. Zwei Zahlen
 * dürfen nur nebeneinander stehen, wenn sie dieselbe Normalisierung hinter
 * sich haben; `points` wäre die falsche Grundlage, weil dort das GEWICHT
 * mitreist (Eigenständigkeit geht bis 15, Handwerk bis 10) und eine 9 neben
 * einer 9 zweierlei hiesse.
 *
 * ── `null` GEWINNT NICHT UND VERLIERT NICHT ───────────────────────────────
 * „Nicht bewertbar" ist keine schwache Kategorie (dieselbe Regel wie im
 * ganzen Check). Fehlt der Wert auf EINER Seite, ist die Zeile `'na'` — die
 * andere Seite bekommt dafür KEINEN Punkt. Sonst gewänne ein Auftritt
 * Kategorien dadurch, dass beim Gegner etwas nicht messbar war, und das Fazit
 * („A gewinnt 5 von 8") wäre eine Aussage über unsere Messlücken statt über
 * zwei Marken.
 *
 * ── DIE REIHENFOLGE IST DER KATALOG, NICHT DIE ANTWORT ────────────────────
 * Iteriert wird über `BRAND_CHECK_CATEGORIES`, nicht über die Kategorien der
 * übergebenen Checks: beide Seiten sollen in derselben Ordnung untereinander
 * stehen, und eine Zeile aus der Zeit vor einer Katalog-Erweiterung fehlt dann
 * als `null`, statt die Zeilen gegeneinander zu verschieben.
 *
 * ── SYMMETRIE IST EINE ZUGESICHERTE EIGENSCHAFT ───────────────────────────
 * `compareBrandChecks(a, b)` und `compareBrandChecks(b, a)` sind exakte
 * Spiegelbilder (Test). Daran hängt der „Tauschen"-Knopf der Seite: er
 * vertauscht nur die Adresszeile und verlässt sich darauf, dass niemand
 * dadurch gewinnt.
 */

/** Wer diese Kategorie für sich entscheidet — `'na'` heisst „nicht bewertbar". */
export type BrandCheckCompareWinner = 'a' | 'b' | 'tie' | 'na'

export interface BrandCheckCompareRow {
  /** Der Kategorie-Schlüssel aus dem Katalog (`distinctiveness`, …). */
  id: string
  /** 0–100 oder `null` = nicht bewertbar. */
  a: number | null
  b: number | null
  winner: BrandCheckCompareWinner
}

/**
 * Die vier Zahlen des Fazits. `aWins + bWins + ties + notAssessable` ist immer
 * die Zahl der Kategorien im Katalog — das ist die Test-Invariante, an der man
 * merkt, wenn ein Fall irgendwo doppelt oder gar nicht gezählt wird.
 */
export interface BrandCheckCompareSummary {
  aWins: number
  bWins: number
  ties: number
  notAssessable: number
}

export interface BrandCheckCompareResult {
  rows: BrandCheckCompareRow[]
  summary: BrandCheckCompareSummary
}

/**
 * Was der Vergleich von einem Check braucht: seine Kategorien. Absichtlich
 * strukturell und nicht `BrandCheckResult` — so passt sowohl die Antwort der
 * Route als auch eine Testzeile hinein, ohne dass ein Test vierzig Kriterien
 * erfinden muss, die er nicht ansieht.
 */
export interface BrandCheckComparable {
  categories: readonly Partial<BrandCheckCategoryLike>[]
}

function scoreMap(check: BrandCheckComparable | null | undefined): Map<string, number | null> {
  const map = new Map<string, number | null>()
  for (const entry of brandCheckCategoryScores(check?.categories ?? [])) {
    map.set(entry.id, entry.score)
  }
  return map
}

export function compareBrandChecks(
  a: BrandCheckComparable | null | undefined,
  b: BrandCheckComparable | null | undefined,
): BrandCheckCompareResult {
  const left = scoreMap(a)
  const right = scoreMap(b)

  const rows: BrandCheckCompareRow[] = BRAND_CHECK_CATEGORIES.map((category) => {
    const valueA = left.get(category.key) ?? null
    const valueB = right.get(category.key) ?? null
    return {
      id: category.key,
      a: valueA,
      b: valueB,
      winner: compareValues(valueA, valueB),
    }
  })

  const summary: BrandCheckCompareSummary = {
    aWins: rows.filter(row => row.winner === 'a').length,
    bWins: rows.filter(row => row.winner === 'b').length,
    ties: rows.filter(row => row.winner === 'tie').length,
    notAssessable: rows.filter(row => row.winner === 'na').length,
  }

  return { rows, summary }
}

function compareValues(a: number | null, b: number | null): BrandCheckCompareWinner {
  if (a === null || b === null) return 'na'
  if (a > b) return 'a'
  if (b > a) return 'b'
  return 'tie'
}

/**
 * WER VORNE LIEGT — gemessen an gewonnenen Kategorien, nicht am Gesamtwert.
 *
 * Der Gesamtwert steht schon im Kopf der Seite; das Fazit unter den acht Zeilen
 * beantwortet die ANDERE Frage („wer gewinnt öfter"). Beide können
 * auseinanderfallen — ein Auftritt mit einem Ausreisser nach oben kann den
 * höheren Score haben und trotzdem sechs von acht Kategorien verlieren. Genau
 * das soll die Seite zeigen dürfen, statt es glattzubügeln.
 */
export function brandCheckCompareLeader(summary: BrandCheckCompareSummary): 'a' | 'b' | 'tie' {
  if (summary.aWins > summary.bWins) return 'a'
  if (summary.bWins > summary.aWins) return 'b'
  return 'tie'
}
