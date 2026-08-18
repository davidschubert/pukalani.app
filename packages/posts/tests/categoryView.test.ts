import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CATEGORY_VIEW,
  normalizeCategoryView,
  sortCategoriesForView,
} from '../shared/categoryView'

const rows = [
  { name: 'Vorstellungsrunde', topicCount: 3 },
  { name: 'Allgemein', topicCount: 1 },
  { name: 'Ärger', topicCount: 1 },
  { name: 'Zusammenarbeit', topicCount: 0 },
]
const nameOf = (r: { name: string }) => r.name
const namen = (list: { name: string }[]) => list.map(r => r.name)

describe('sortCategoriesForView', () => {
  it('lässt „Empfohlen" die Reihenfolge des Owners unangetastet', () => {
    expect(namen(sortCategoriesForView(rows, 'recommended', nameOf, 'de'))).toEqual(namen(rows))
  })

  it('sortiert A–Z nach dem ANGEZEIGTEN Namen, mit der Sprache der Seite', () => {
    // „Ärger" gehört unter A und nicht hinter Z — genau dafür localeCompare.
    expect(namen(sortCategoriesForView(rows, 'az', nameOf, 'de')))
      .toEqual(['Allgemein', 'Ärger', 'Vorstellungsrunde', 'Zusammenarbeit'])
  })

  it('sortiert nach Betrieb, bei Gleichstand alphabetisch', () => {
    expect(namen(sortCategoriesForView(rows, 'active', nameOf, 'de')))
      .toEqual(['Vorstellungsrunde', 'Allgemein', 'Ärger', 'Zusammenarbeit'])
  })

  it('„Aktivste" sieht in einer JUNGEN Community anders aus als „Empfohlen"', () => {
    // Der Grund für den alphabetischen Gleichstand: sonst wirkt der Umschalter
    // kaputt, solange alle Zähler 0 sind.
    const leer = [{ name: 'Zebra', topicCount: 0 }, { name: 'Apfel', topicCount: 0 }]
    expect(namen(sortCategoriesForView(leer, 'active', nameOf, 'de'))).toEqual(['Apfel', 'Zebra'])
    expect(namen(sortCategoriesForView(leer, 'recommended', nameOf, 'de'))).toEqual(['Zebra', 'Apfel'])
  })

  it('fasst die Eingabe nicht an', () => {
    const eingabe = [...rows]
    sortCategoriesForView(eingabe, 'az', nameOf, 'de')
    expect(namen(eingabe)).toEqual(namen(rows))
  })
})

describe('normalizeCategoryView', () => {
  it('nimmt bekannte Werte', () => {
    expect(normalizeCategoryView('az')).toBe('az')
  })

  it('fällt bei allem anderen auf die Voreinstellung zurück', () => {
    // Ein alter oder manipulierter Cookie darf die Seite nicht leer machen.
    for (const wert of ['', 'quatsch', null, undefined, 42, {}]) {
      expect(normalizeCategoryView(wert)).toBe(DEFAULT_CATEGORY_VIEW)
    }
  })
})
