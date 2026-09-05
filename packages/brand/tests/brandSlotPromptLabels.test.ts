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
    expect(brandSlotPromptLabel('a.pitch', 'de', 'new', 'solo')).toBe('Elevator-Pitch')
    expect(brandSlotPromptLabel('a.customerPraise', 'de', 'new', 'solo')).toContain('glücklichsten Kunden')
    expect(brandSlotPromptLabel('a.customerPraise', 'en', 'new', 'solo')).toContain('happiest customers')
  })

  it('löst Pfad-Varianten über pathKind auf', () => {
    const neu = brandSlotPromptLabel('a.origin', 'de', 'new', 'solo')
    const relaunch = brandSlotPromptLabel('a.origin', 'de', 'relaunch', 'solo')
    expect(neu).not.toBe(relaunch)
    expect(neu.length).toBeGreaterThan(10)
    expect(relaunch.length).toBeGreaterThan(10)
  })

  it('JEDER aktive Slot hat ein Label, das keine interne Id ist', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      for (const slot of slotsForStep(stepKey)) {
        const label = brandSlotPromptLabel(slot.id, 'de', 'new', 'solo')
        expect(label, slot.id).not.toBe(slot.id)
        expect(label).not.toMatch(/^[a-z0-9]+\./i)
      }
    }
  })

  it('unbekannte Ids fallen ehrlich auf die Id zurück', () => {
    expect(brandSlotPromptLabel('x.gibtEsNicht', 'de', 'new', 'solo')).toBe('x.gibtEsNicht')
  })

  /**
   * DIE TEAM-WEICHE W3 (Paket 8): `c.discovery3` fragt solo und im Team etwas
   * anderes. Vorher gewann hier immer `Object.values(node)[0]`, also die
   * Solo-Fassung — im Prompt eines Team-Brandings stand das Etikett der
   * falschen Frage über dem richtigen Wert.
   */
  it('löst die Team-Variante über team auf — und lässt Pfad-Slots kalt', () => {
    const solo = brandSlotPromptLabel('c.discovery3', 'de', 'new', 'solo')
    const team = brandSlotPromptLabel('c.discovery3', 'de', 'new', 'team')
    expect(solo).toContain('nie dulden')
    expect(team).toContain('Team')
    expect(solo).not.toBe(team)
    expect(brandSlotPromptLabel('c.discovery3', 'en', 'new', 'team')).toContain('team')

    // GEGENPROBE: ein Slot mit PFAD-Varianten darf sich von `team` nicht
    // umstimmen lassen — sonst griffe `node[team]` in die falsche Weiche.
    expect(brandSlotPromptLabel('a.origin', 'de', 'relaunch', 'team'))
      .toBe(brandSlotPromptLabel('a.origin', 'de', 'relaunch', 'solo'))
  })
})

describe('Formatter drucken Labels, nie Ids', () => {
  it('formatDependencies nutzt das Label', () => {
    const block = formatDependencies(labelSlotDependencies(
      [{ slotId: 'a.customerPraise', value: 'Bestes Brot der Stadt' }],
      'de',
      'new',
      'solo',
    ))
    expect(block).not.toContain('a.customerPraise')
    expect(block).toContain('glücklichsten Kunden')
  })

  it('formatBrandConverseInputs nutzt das Label — mit Id-Rückfall ohne', () => {
    const inputs = formatBrandConverseInputs({
      startCard: { pitch: '', category: '', audience: '', website: '' },
      slots: [
        { slotId: 'a.oneThing', value: '', label: brandSlotPromptLabel('a.oneThing', 'de', 'new', 'solo') },
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
