import { describe, expect, it } from 'vitest'
import {
  BRAND_ARCHITECTURE_MODELS,
  brandChoiceContract,
  brandChoiceFallbackQuestion,
  brandChoicePromptRule,
  checkBrandChoiceDraft,
} from '../shared/brandChoiceOptions'
import { slotById } from '../shared/slotRegistry'

/**
 * DIE LEGALE MENGE EINER AUSWAHL (P3.1).
 *
 * Bewiesen wird hier nicht die Mechanik einer Zeichenketten-Prüfung, sondern
 * die vier Zusagen, an denen der Wert im Brand-Dokument hängt:
 *  1. Die vier Architektur-Modelle sind GESCHLOSSEN — ein fünftes gibt es
 *     nicht, und ein „Hybrid" ist kein Kompromiss, sondern ein Verstoss.
 *  2. Gelesen wird NACHSICHTIG (Id oder Name), gespeichert wird STRENG (die
 *     Id): jede unnötige Rückfrage kostet einen Zug und einen Anbieter-Lauf,
 *     ohne dass die Entscheidung des Modells falsch gewesen wäre.
 *  3. Die Kategorie ist OFFEN und trotzdem nicht beliebig: ein Etikett, kein
 *     Absatz — sonst stünde in einem Chips-Feld irgendwann ein Aufsatz.
 *  4. Die Prompt-Regel NENNT die Menge wörtlich. „Choose one of the common
 *     models" ist genau die Formulierung, die „Hybrid" zurückbringt.
 */

describe('Welche Slots einen Auswahl-Vertrag haben', () => {
  it('b2.model ist geschlossen, b.positioningCategory ist offen', () => {
    expect(brandChoiceContract('b2.model')?.kind).toBe('closed')
    expect(brandChoiceContract('b.positioningCategory')?.kind).toBe('open')
  })

  it('beide sind in der Registry wirklich `choice` — der Vertrag erfindet keinen Slot', () => {
    for (const slotId of ['b2.model', 'b.positioningCategory']) {
      expect(slotById(slotId)?.schema.kind, slotId).toBe('choice')
      expect(slotById(slotId)?.type, slotId).toBe('choice')
    }
  })

  it('ein Slot ohne Vertrag bekommt keinen erfunden', () => {
    // `c.final` ist eine Auswahl AUS den Kandidaten — die Menge entsteht zur
    // Laufzeit und kann hier gar nicht stehen.
    expect(brandChoiceContract('c.final')).toBeNull()
    expect(brandChoiceContract('a.pitch')).toBeNull()
  })
})

describe('Die vier Architektur-Modelle (Content-Spec §5a)', () => {
  const contract = brandChoiceContract('b2.model')!

  it('sind genau vier, mit stabilen Ids', () => {
    expect(BRAND_ARCHITECTURE_MODELS.map(option => option.id)).toEqual([
      'branded-house', 'sub-brands', 'endorsed', 'house-of-brands',
    ])
  })

  it('DIE PROMPT-REGEL NENNT JEDE OPTION WÖRTLICH — Id, Name und Wirkung', () => {
    const rule = brandChoicePromptRule(contract).join('\n')
    for (const option of BRAND_ARCHITECTURE_MODELS) {
      expect(rule, option.id).toContain(option.id)
      expect(rule, option.id).toContain(option.label)
      expect(rule, option.id).toContain(option.hint)
    }
    expect(rule).toContain('EXACTLY ONE of these ids')
    // Die drei plausiblen Ausweichmanöver stehen ausdrücklich zu.
    expect(rule).toContain('Do not invent a fifth model, do not combine two, do not write a "hybrid"')
    // Die Begründung gehört in den ZUG, nicht ins Feld.
    expect(rule).toContain('belongs in the BASIS line of your turn, never in the field')
  })

  it('NIMMT DIE ID UND NIMMT DEN NAMEN — gespeichert wird immer die Id', () => {
    expect(checkBrandChoiceDraft(contract, 'house-of-brands')).toEqual({ ok: true, value: 'house-of-brands' })
    expect(checkBrandChoiceDraft(contract, 'House of Brands')).toEqual({ ok: true, value: 'house-of-brands' })
    // Und durch den üblichen Modell-Beifang hindurch.
    expect(checkBrandChoiceDraft(contract, '  "Branded House."  ')).toEqual({ ok: true, value: 'branded-house' })
    expect(checkBrandChoiceDraft(contract, '- endorsed')).toEqual({ ok: true, value: 'endorsed' })
  })

  it('WEIST AB, was nicht in der Menge steht', () => {
    for (const draft of ['hybrid', 'Branded House of Brands', 'Es kommt darauf an.', '']) {
      expect(checkBrandChoiceDraft(contract, draft), draft)
        .toEqual({ ok: false, violation: 'not_an_option' })
    }
  })

  it('ZWEI MODELLE SIND KEINE ENTSCHEIDUNG', () => {
    expect(checkBrandChoiceDraft(contract, 'branded-house\nsub-brands'))
      .toEqual({ ok: false, violation: 'not_an_option' })
  })

  it('EIN ABSATZ IM AUSWAHL-FELD IST EIN VERSTOSS, kein langer Wert', () => {
    expect(checkBrandChoiceDraft(contract, 'Sub-Brands\nDenn eure Produkte tragen eigene Namen.'))
      .toEqual({ ok: false, violation: 'not_an_option' })
  })
})

describe('Die Positionierungs-Kategorie ist offen — aber ein Etikett', () => {
  const contract = brandChoiceContract('b.positioningCategory')!

  it('DIE PROMPT-REGEL VERLANGT EIN ETIKETT, keinen Satz', () => {
    const rule = brandChoicePromptRule(contract).join('\n')
    expect(rule).toContain('CATEGORY LABEL, not a sentence')
    expect(rule).toContain('at most 6 words')
    expect(rule).toContain('no full stop')
    // Es gibt bewusst KEINE Liste: die Kategorie gehört dieser Marke.
    expect(rule).not.toContain('EXACTLY ONE of these ids')
  })

  it('nimmt eine Kategorie und lässt den Schlusspunkt fallen', () => {
    expect(checkBrandChoiceDraft(contract, 'Spezialitätenkaffee für Cafés.'))
      .toEqual({ ok: true, value: 'Spezialitätenkaffee für Cafés' })
  })

  it('WEIST EINEN SATZ AB — sechs Wörter sind die Grenze', () => {
    expect(checkBrandChoiceDraft(contract, 'Wir sind die erste Adresse für Spezialitätenkaffee auf Maui'))
      .toEqual({ ok: false, violation: 'not_a_label' })
    expect(checkBrandChoiceDraft(contract, '')).toEqual({ ok: false, violation: 'not_a_label' })
  })

  it('sechs Wörter gehen noch, sieben nicht — die Grenze liegt, wo sie steht', () => {
    expect(checkBrandChoiceDraft(contract, 'eins zwei drei vier fünf sechs').ok).toBe(true)
    expect(checkBrandChoiceDraft(contract, 'eins zwei drei vier fünf sechs sieben').ok).toBe(false)
  })
})

describe('Die Rückfrage bei einem Verstoss', () => {
  it('spricht die Sprache der OBERFLÄCHE, nicht die der Marke', () => {
    const contract = brandChoiceContract('b2.model')!
    expect(brandChoiceFallbackQuestion(contract, 'de')).toContain('Architektur-Modell')
    expect(brandChoiceFallbackQuestion(contract, 'en')).toContain('architecture model')
    // Alles, was nicht mit `de` beginnt, bekommt Englisch (Konvention wie
    // `advisorOpenersFor`).
    expect(brandChoiceFallbackQuestion(contract, 'fr')).toBe(brandChoiceFallbackQuestion(contract, 'en'))
  })

  it('IST EINE FRAGE, keine Fehlermeldung', () => {
    for (const slotId of ['b2.model', 'b.positioningCategory']) {
      const contract = brandChoiceContract(slotId)!
      for (const locale of ['de', 'en']) {
        expect(brandChoiceFallbackQuestion(contract, locale), `${slotId}/${locale}`).toContain('?')
      }
    }
  })
})
