import { describe, expect, it } from 'vitest'
import { brandSlotPromptLabel, labelSlotDependencies } from '../server/utils/brandSlotPromptLabels'
import { formatDependencies } from '../server/utils/georgePrompt'
import { formatBrandConverseInputs } from '../server/utils/conversePrompt'
import { BRAND_STEP_KEYS, slotsForStep } from '../shared/slotRegistry'

/**
 * KEINE INTERNEN IDS ZUM MODELL (Davids Live-Fund 2026-09-03): die
 * Eingabe-Blöcke reisten als `[a.customerPraise]`, und George sprach die Ids
 * im Chat wortwörtlich nach. Die Blöcke tragen jetzt die Frage bzw. das
 * Label aus dem Locale-Katalog — in der Inhaltssprache des Profils.
 */
describe('brandSlotPromptLabel', () => {
  it('löst Fragen und Labels in beiden Sprachen auf', () => {
    expect(brandSlotPromptLabel('a.pitch', 'de', 'new')).toBe('Elevator-Pitch')
    expect(brandSlotPromptLabel('a.customerPraise', 'de', 'new')).toContain('glücklichsten Kunden')
    expect(brandSlotPromptLabel('a.customerPraise', 'en', 'new')).toContain('happiest customers')
  })

  it('löst Pfad-Varianten über pathKind auf', () => {
    const neu = brandSlotPromptLabel('a.origin', 'de', 'new')
    const relaunch = brandSlotPromptLabel('a.origin', 'de', 'relaunch')
    expect(neu).not.toBe(relaunch)
    expect(neu.length).toBeGreaterThan(10)
    expect(relaunch.length).toBeGreaterThan(10)
  })

  it('JEDER aktive Slot hat ein Label, das keine interne Id ist', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      for (const slot of slotsForStep(stepKey)) {
        const label = brandSlotPromptLabel(slot.id, 'de', 'new')
        expect(label, slot.id).not.toBe(slot.id)
        expect(label).not.toMatch(/^[a-z0-9]+\./i)
      }
    }
  })

  it('unbekannte Ids fallen ehrlich auf die Id zurück', () => {
    expect(brandSlotPromptLabel('x.gibtEsNicht', 'de', 'new')).toBe('x.gibtEsNicht')
  })
})

describe('Formatter drucken Labels, nie Ids', () => {
  it('formatDependencies nutzt das Label', () => {
    const block = formatDependencies(labelSlotDependencies(
      [{ slotId: 'a.customerPraise', value: 'Bestes Brot der Stadt' }],
      'de',
      'new',
    ))
    expect(block).not.toContain('a.customerPraise')
    expect(block).toContain('glücklichsten Kunden')
  })

  it('formatBrandConverseInputs nutzt das Label — mit Id-Rückfall ohne', () => {
    const inputs = formatBrandConverseInputs({
      startCard: { pitch: '', category: '', audience: '', website: '' },
      slots: [
        { slotId: 'a.oneThing', value: '', label: brandSlotPromptLabel('a.oneThing', 'de', 'new') },
        { slotId: 'ohne.label', value: 'x' },
      ],
      history: [],
      answeredQuestion: '',
      text: 'Hallo',
      nextQuestion: '',
    })
    expect(inputs).not.toContain('[a.oneThing]')
    expect(inputs).toContain('[ohne.label]')
  })
})
