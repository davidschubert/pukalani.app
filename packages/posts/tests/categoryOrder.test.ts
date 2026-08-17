import { describe, it, expect } from 'vitest'
import { planCategoryOrder, type CategoryOrderRow } from '../shared/categoryOrder'

const rows = (...pairs: Array<[string, number]>): CategoryOrderRow[] =>
  pairs.map(([$id, sortOrder]) => ({ $id, sortOrder }))

describe('planCategoryOrder — die Reihenfolge der Kategorien', () => {
  it('vergibt die Positionen neu: 0, 1, 2 …', () => {
    const plan = planCategoryOrder(rows(['a', 0], ['b', 1], ['c', 2]), ['c', 'a', 'b'])
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.order).toEqual([
      { id: 'c', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ])
  })

  it('schreibt NUR, was sich ändert', () => {
    // Der letzte Eintrag wandert nach vorn: a und b rutschen mit, c ist neu 0.
    const plan = planCategoryOrder(rows(['a', 0], ['b', 1], ['c', 2]), ['c', 'a', 'b'])
    if (!plan.ok) throw new Error('unerwartet')
    expect(plan.writes.map(w => w.id)).toEqual(['c', 'a', 'b'])

    // Unveränderte Reihenfolge ⇒ gar kein Schreibvorgang.
    const same = planCategoryOrder(rows(['a', 0], ['b', 1], ['c', 2]), ['a', 'b', 'c'])
    if (!same.ok) throw new Error('unerwartet')
    expect(same.writes).toEqual([])
  })

  it('räumt Lücken und Doppelungen aus der Zeit des Zahlenfeldes auf', () => {
    const plan = planCategoryOrder(rows(['a', 0], ['b', 0], ['c', 40]), ['a', 'b', 'c'])
    if (!plan.ok) throw new Error('unerwartet')
    expect(plan.order.map(e => e.sortOrder)).toEqual([0, 1, 2])
    // 'a' stand schon auf 0 und wird nicht angefasst.
    expect(plan.writes.map(w => w.id)).toEqual(['b', 'c'])
  })

  it('weist eine UNVOLLSTÄNDIGE Liste zurück', () => {
    // Der Fall, für den die Prüfung da ist: die Oberfläche schickt nur, was sie
    // gerade zeigt. Der Rest hätte dann keine Position.
    expect(planCategoryOrder(rows(['a', 0], ['b', 1], ['c', 2]), ['a', 'b']))
      .toEqual({ ok: false, reason: 'order_stale' })
  })

  it('weist eine UNBEKANNTE Id zurück', () => {
    // Auch die Schutzwirkung gegen eine fremde Kategorie: der Ist-Stand kommt
    // aus der Datentür, was nicht darin steht, kommt hier nicht durch.
    expect(planCategoryOrder(rows(['a', 0], ['b', 1]), ['a', 'fremd']))
      .toEqual({ ok: false, reason: 'order_stale' })
  })

  it('weist DOPPELTE Ids zurück', () => {
    expect(planCategoryOrder(rows(['a', 0], ['b', 1]), ['a', 'a']))
      .toEqual({ ok: false, reason: 'order_stale' })
  })

  it('kommt mit einer einzelnen Kategorie zurecht', () => {
    const plan = planCategoryOrder(rows(['a', 7]), ['a'])
    if (!plan.ok) throw new Error('unerwartet')
    expect(plan.writes).toEqual([{ id: 'a', sortOrder: 0 }])
  })
})
