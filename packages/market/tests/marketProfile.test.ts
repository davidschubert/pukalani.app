import { describe, expect, it } from 'vitest'
import {
  MARKET_COMPETITORS_MAX,
  MARKET_EVIDENCE_MAX,
  MARKET_FIELDS,
  MARKET_FIELD_IDS,
  marketField,
  type MarketProfileField,
} from '../shared/marketProfile'

/**
 * DER VERTRAG DES MARKTPROFILS (Plan §2.2) — was der Prototyp (M0) schon
 * festnageln kann, ohne dass es eine Tabelle, eine Route oder ein Modell gibt.
 *
 * WAS HIER BEWUSST NOCH FEHLT und mit M1 kommt: die Prüfung jeder Abbildung
 * GEGEN die brand-Registry (`slotById(id) !== undefined`, Slot nicht
 * deaktiviert). Sie braucht den expliziten Vertrag zum brand-Layer, den der
 * Prototyp noch nicht zieht (CONCEPT A14) — bis dahin sichert dieser Test
 * wenigstens die FORM der Ids ab, damit ein Tippfehler nicht als leere
 * Tabellenzeile durchrutscht.
 */
describe('MARKET_FIELDS', () => {
  it('deckt genau die zehn Felder aus §2.2 ab, ohne Doppelung', () => {
    expect(MARKET_FIELDS).toHaveLength(MARKET_FIELD_IDS.length)
    expect(MARKET_FIELDS.map(field => field.id)).toEqual([...MARKET_FIELD_IDS])
    expect(new Set(MARKET_FIELDS.map(field => field.id)).size).toBe(MARKET_FIELDS.length)
  })

  it('bildet jedes Feld auf mindestens eine Slot-Id der brand-Registry ab', () => {
    for (const field of MARKET_FIELDS) {
      expect(field.slotIds.length).toBeGreaterThan(0)
      for (const slotId of field.slotIds) {
        // Registry-Ids sind `<kapitel>.<name>` — die Form ist das, was hier
        // ohne den brand-Vertrag prüfbar ist.
        expect(slotId).toMatch(/^[a-z]+\.[A-Za-z0-9]+$/)
      }
    }
  })

  it('gibt jedem Listen-Feld einen Deckel und keinem anderen', () => {
    for (const field of MARKET_FIELDS) {
      if (field.form === 'list') expect(field.maxItems).toBeGreaterThan(0)
      else expect(field.maxItems).toBeUndefined()
    }
  })

  it('keine Slot-Id wird von zwei Feldern beansprucht', () => {
    const all = MARKET_FIELDS.flatMap(field => field.slotIds)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('Deckel', () => {
  it('hält die Zahlen aus dem Plan fest', () => {
    // Zitatschranke §1.7 Nr. 4, Wettbewerber-Deckel §2.9 Nr. 8.
    expect(MARKET_EVIDENCE_MAX).toBe(200)
    expect(MARKET_COMPETITORS_MAX).toBe(5)
  })
})

describe('marketField', () => {
  const fields: MarketProfileField[] = [
    { fieldId: 'pitch', value: 'We roast in small batches.' },
    { fieldId: 'purpose', value: '' },
  ]

  it('findet ein vorhandenes Feld', () => {
    expect(marketField(fields, 'pitch')?.value).toBe('We roast in small batches.')
  })

  it('unterscheidet „leer gesagt" von „gar nicht da"', () => {
    // Ein LEERES Feld ist eine Aussage über die Kategorie (§1.10) und bleibt
    // deshalb in der Liste — `undefined` heisst „nicht ausgewertet".
    expect(marketField(fields, 'purpose')?.value).toBe('')
    expect(marketField(fields, 'tagline')).toBeUndefined()
  })
})
