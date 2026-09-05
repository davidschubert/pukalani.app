import { describe, expect, it } from 'vitest'
import { BRAND_CHECK_CATEGORIES } from '../shared/brandCheck'
import {
  brandCheckCompareLeader,
  compareBrandChecks,
  type BrandCheckComparable,
} from '../shared/brandCheckCompare'

/**
 * DER QUARTETT-VERGLEICH (docs/plans/BRAND-CHECK-SEITE.md §4, Paket P4).
 *
 * Geprüft wird die Regel, nicht die Zeichnung: wer eine Kategorie gewinnt, was
 * ein `null` bedeutet und dass das Vertauschen der Seiten niemanden bevorzugt.
 * Die Seite verlässt sich auf genau diese drei Zusagen.
 */

/**
 * Eine Kategorie so bauen, wie sie in einer gespeicherten Zeile steht: `raw`
 * ist die Rohsumme der BEWERTBAREN Kriterien, `assessable` deren Zahl.
 * `brandCheckCategoryScores` rechnet daraus `raw / (assessable * 2) * 100` —
 * mit `assessable: 5` ist `raw` also glatt die halbe Prozentzahl durch zehn.
 */
function category(key: string, percent: number | null) {
  if (percent === null) return { key, raw: 0, assessable: 0, locked: true }
  return { key, raw: (percent / 100) * 10, assessable: 5, locked: false }
}

/** Acht Werte in Katalog-Reihenfolge zu einem vergleichbaren Check machen. */
function check(values: (number | null)[]): BrandCheckComparable {
  return {
    categories: BRAND_CHECK_CATEGORIES.map((entry, index) => category(entry.key, values[index] ?? null)),
  }
}

const EIGHT = BRAND_CHECK_CATEGORIES.length

describe('compareBrandChecks', () => {
  it('gibt immer genau die acht Kategorien des Katalogs zurück, in seiner Reihenfolge', () => {
    const result = compareBrandChecks(check([]), check([]))
    expect(result.rows).toHaveLength(EIGHT)
    expect(result.rows.map(row => row.id)).toEqual(BRAND_CHECK_CATEGORIES.map(entry => entry.key))
  })

  it('kürt je Kategorie den höheren Wert', () => {
    const a = check([100, 20, 60, 60, 80, 40, 100, 0])
    const b = check([60, 80, 60, 40, 100, 20, 0, 20])
    const { rows, summary } = compareBrandChecks(a, b)

    expect(rows.map(row => row.winner)).toEqual(['a', 'b', 'tie', 'a', 'b', 'a', 'a', 'b'])
    expect(summary).toEqual({ aWins: 4, bWins: 3, ties: 1, notAssessable: 0 })
  })

  it('gleiche Werte sind ein Gleichstand, kein Sieg des Ersten', () => {
    const same = [50, 50, 50, 50, 50, 50, 50, 50]
    const { summary } = compareBrandChecks(check(same), check(same))
    expect(summary).toEqual({ aWins: 0, bWins: 0, ties: EIGHT, notAssessable: 0 })
  })

  it('ein `null` macht die Zeile zu `na` — die andere Seite gewinnt sie NICHT', () => {
    // Die Kernregel: „nicht bewertbar" ist keine schwache Kategorie. Wer 100
    // gegen eine Messlücke hält, hat nichts gewonnen.
    const { rows, summary } = compareBrandChecks(
      check([100, null, 40, 40, 40, 40, 40, 40]),
      check([null, 100, 20, 20, 20, 20, 20, 20]),
    )
    expect(rows[0]!.winner).toBe('na')
    expect(rows[1]!.winner).toBe('na')
    expect(rows[0]!.a).toBe(100)
    expect(rows[0]!.b).toBeNull()
    expect(summary).toEqual({ aWins: 6, bWins: 0, ties: 0, notAssessable: 2 })
  })

  it('`null` auf BEIDEN Seiten ist ebenfalls `na` und kein Gleichstand', () => {
    const { rows, summary } = compareBrandChecks(check([null]), check([null]))
    expect(rows[0]!.winner).toBe('na')
    expect(summary.ties).toBe(0)
    // Alles Übrige fehlt in beiden Checks — auch das ist „nicht bewertbar".
    expect(summary.notAssessable).toBe(EIGHT)
  })

  it('eine fehlende Kategorie (alter Katalog) liest sich als `null`, nicht als 0', () => {
    const partial: BrandCheckComparable = { categories: [category('distinctiveness', 80)] }
    const { rows } = compareBrandChecks(partial, check([40, 40, 40, 40, 40, 40, 40, 40]))
    expect(rows[0]!.winner).toBe('a')
    expect(rows[1]!.a).toBeNull()
    expect(rows[1]!.winner).toBe('na')
  })

  it('die vier Zähler decken zusammen immer alle acht Kategorien ab', () => {
    const { summary } = compareBrandChecks(
      check([100, 10, 50, null, 70, 70, 30, 90]),
      check([20, 90, 50, 60, null, 70, 80, 10]),
    )
    expect(summary.aWins + summary.bWins + summary.ties + summary.notAssessable).toBe(EIGHT)
  })

  it('nichts vergleichbares ⇒ acht Zeilen `na` statt eines Absturzes', () => {
    const { rows, summary } = compareBrandChecks(null, undefined)
    expect(rows).toHaveLength(EIGHT)
    expect(summary).toEqual({ aWins: 0, bWins: 0, ties: 0, notAssessable: EIGHT })
  })

  it('SYMMETRIE: das Vertauschen der Seiten spiegelt exakt — niemand gewinnt dadurch', () => {
    // Daran hängt der „Tauschen"-Knopf der Vergleichs-Seite.
    const a = check([100, 20, 60, null, 80, 40, 100, 0])
    const b = check([60, 80, 60, 40, null, 20, 0, 20])
    const forward = compareBrandChecks(a, b)
    const backward = compareBrandChecks(b, a)

    expect(backward.summary).toEqual({
      aWins: forward.summary.bWins,
      bWins: forward.summary.aWins,
      ties: forward.summary.ties,
      notAssessable: forward.summary.notAssessable,
    })
    expect(backward.rows.map(row => row.id)).toEqual(forward.rows.map(row => row.id))
    expect(backward.rows.map(row => row.a)).toEqual(forward.rows.map(row => row.b))
    expect(backward.rows.map(row => row.b)).toEqual(forward.rows.map(row => row.a))
    // Und die Seiten-Etiketten drehen wirklich mit:
    expect(backward.rows.map(row => row.winner)).toEqual(
      forward.rows.map(row => (row.winner === 'a' ? 'b' : row.winner === 'b' ? 'a' : row.winner)),
    )
  })
})

describe('brandCheckCompareLeader', () => {
  it('zählt gewonnene Kategorien, nicht den Gesamtwert', () => {
    expect(brandCheckCompareLeader({ aWins: 5, bWins: 2, ties: 1, notAssessable: 0 })).toBe('a')
    expect(brandCheckCompareLeader({ aWins: 2, bWins: 5, ties: 1, notAssessable: 0 })).toBe('b')
  })

  it('gleich viele Siege ⇒ Gleichstand, auch wenn es gar keine gab', () => {
    expect(brandCheckCompareLeader({ aWins: 3, bWins: 3, ties: 2, notAssessable: 0 })).toBe('tie')
    expect(brandCheckCompareLeader({ aWins: 0, bWins: 0, ties: 0, notAssessable: 8 })).toBe('tie')
  })
})
