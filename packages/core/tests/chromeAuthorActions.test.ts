import { describe, expect, it } from 'vitest'
import { resolveAuthorActions } from '../shared/chromeAuthorActions'

const allOpen = { productOn: () => true, planAllows: () => true }

describe('resolveAuthorActions (F56)', () => {
  it('gibt ohne Registry eine leere Liste — nicht undefined', () => {
    expect(resolveAuthorActions(undefined, allOpen)).toEqual([])
    expect(resolveAuthorActions({}, allOpen)).toEqual([])
  })

  it('lässt einen Eintrag durch und hängt seine Id an', () => {
    const actions = resolveAuthorActions({ messages: { component: 'MessageWriteAuthorAction' } }, allOpen)
    expect(actions).toHaveLength(1)
    expect(actions[0]!.id).toBe('messages')
    expect(actions[0]!.component).toBe('MessageWriteAuthorAction')
  })

  it('ein `false` schaltet einen geerbten Eintrag ab (Objekt-Map-Grund, Audit S9)', () => {
    expect(resolveAuthorActions({ messages: false }, allOpen)).toEqual([])
  })

  it('verwirft kaputte Einträge, statt <component :is=undefined> zu rendern', () => {
    const config = { a: { component: '' }, b: null, c: undefined } as never
    expect(resolveAuthorActions(config, allOpen)).toEqual([])
  })

  it('das Laufzeit-Produkt-Gate (F2) blendet aus', () => {
    const config = { messages: { component: 'X', productKey: 'messages' } }
    expect(resolveAuthorActions(config, { ...allOpen, productOn: key => key !== 'messages' })).toEqual([])
  })

  it('das Plan-Gate (P4) blendet aus', () => {
    const config = { messages: { component: 'X', planProduct: 'messages' } }
    expect(resolveAuthorActions(config, { ...allOpen, planAllows: key => key !== 'messages' })).toEqual([])
  })

  it('ein Eintrag OHNE Tore passiert auch geschlossene Tore', () => {
    const config = { plain: { component: 'X' } }
    const shut = { productOn: () => false, planAllows: () => false }
    // Die Prädikate bekommen `undefined` und antworten in der Komponente mit
    // „kein Schlüssel ⇒ kein Tor"; hier wird nur belegt, dass die Regel sie
    // wirklich fragt und nicht selbst entscheidet.
    expect(resolveAuthorActions(config, {
      productOn: key => key === undefined || shut.productOn(),
      planAllows: key => key === undefined || shut.planAllows(),
    })).toHaveLength(1)
  })

  it('sortiert nach order, bei Gleichstand alphabetisch nach Id', () => {
    const config = {
      zulu: { component: 'Z', order: 10 },
      alpha: { component: 'A', order: 10 },
      spaet: { component: 'S', order: 99 },
      // ohne order ⇒ Default 50, also zwischen 10 und 99
      mitte: { component: 'M' },
    }
    expect(resolveAuthorActions(config, allOpen).map(a => a.id))
      .toEqual(['alpha', 'zulu', 'mitte', 'spaet'])
  })
})
