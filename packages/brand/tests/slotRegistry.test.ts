import { describe, expect, it } from 'vitest'
import {
  BRAND_SLOTS,
  BRAND_SLOT_MAX_LENGTH,
  BRAND_STEP_KEYS,
  BRAND_STEP_SLOTS_MAX_LENGTH,
  type BrandSlot,
  type BrandStepKey,
  REGISTRY_VERSION,
  confirmableRequiredSlotsForStep,
  dependencyClosure,
  exampleKeyFor,
  questionKeyFor,
  requiredSlotsForStep,
  slotById,
  slotIsConfirmable,
  slotIsFilled,
  slotsForStep,
  stepProgress,
  validateSlotRegistry,
} from '../shared/slotRegistry'

/**
 * Die Registry ist eine TABELLE — Fehler darin sind Tippfehler, keine
 * Logikfehler, und genau deshalb fällt niemandem einer auf. Diese Datei prüft
 * die Invarianten, die der Katalog-Kopf zusagt, und legt zu jeder eine
 * MUTIERTE Fassung vor: eine Prüfung, die nur die richtige Liste kennt, wäre
 * immer grün.
 */

/** Bequemer Baukasten für die Gegenproben — kopiert einen echten Slot. */
function mutate(id: string, patch: Partial<BrandSlot>): readonly BrandSlot[] {
  return BRAND_SLOTS.map(slot => (slot.id === id ? { ...slot, ...patch } : slot))
}

describe('Registry-Invarianten (die echte Liste)', () => {
  it('ist in jeder Hinsicht gültig', () => {
    expect(validateSlotRegistry()).toEqual([])
  })

  it('startet bei Version 1 (Migrationsvertrag §3e)', () => {
    expect(REGISTRY_VERSION).toBe(1)
  })

  it('hat einzigartige Slot-Ids', () => {
    const ids = BRAND_SLOTS.map(slot => slot.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('kennt nur die neun stepKeys des Schema-Anhangs §2', () => {
    expect([...BRAND_STEP_KEYS]).toEqual([
      'context', 'pvm', 'architecture', 'values',
      'archetype', 'manifesto', 'verbal', 'naming', 'result',
    ])
    for (const slot of BRAND_SLOTS) {
      expect(BRAND_STEP_KEYS).toContain(slot.stepId)
    }
  })

  it('lässt jede Abhängigkeit auf einen existierenden Slot zeigen', () => {
    const ids = new Set(BRAND_SLOTS.map(slot => slot.id))
    for (const slot of BRAND_SLOTS) {
      for (const dependencyId of slot.dependencies) expect(ids).toContain(dependencyId)
    }
  })

  it('lässt Abhängigkeiten IMMER rückwärts zeigen — damit sind Zyklen strukturell aus', () => {
    const position = new Map(BRAND_SLOTS.map((slot, index) => [slot.id, index]))
    BRAND_SLOTS.forEach((slot, index) => {
      for (const dependencyId of slot.dependencies) {
        expect(position.get(dependencyId)!).toBeLessThan(index)
      }
    })
  })

  it('gibt jedem Baustein mindestens einen Slot', () => {
    for (const stepKey of BRAND_STEP_KEYS) expect(slotsForStep(stepKey).length).toBeGreaterThan(0)
  })

  it('hält jeden Slot unter dem Schema-Anhang-Limit von 20k', () => {
    for (const slot of BRAND_SLOTS) {
      expect(slot.maxLength).toBeLessThanOrEqual(BRAND_SLOT_MAX_LENGTH)
      expect(slot.schema.maxLength).toBe(slot.maxLength)
    }
  })

  it('hält die Summe je Baustein unter dem 200k-Deckel der slots-Spalte', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      const sum = slotsForStep(stepKey).reduce((total, slot) => total + slot.maxLength, 0)
      expect(sum).toBeLessThanOrEqual(BRAND_STEP_SLOTS_MAX_LENGTH)
    }
  })

  it('baut alle i18n-Schlüssel mechanisch aus der Id', () => {
    for (const slot of BRAND_SLOTS) {
      expect(slot.questionKey).toBe(`brand.q.${slot.id}`)
      expect(slot.helpKey === null || slot.helpKey === `brand.help.${slot.id}`).toBe(true)
    }
  })

  it('kennt genau EIN eigenes Instrument (d.pairs) — die Konfidenz ist kein Slot', () => {
    expect(BRAND_SLOTS.filter(slot => slot.type === 'special').map(slot => slot.id)).toEqual(['d.pairs'])
    expect(BRAND_SLOTS.some(slot => slot.id.includes('confidence'))).toBe(false)
  })

  it('erlaubt Markdown nur dort, wo Plan §3e es erlaubt', () => {
    expect(BRAND_SLOTS.filter(slot => slot.schema.kind === 'richtext').map(slot => slot.id))
      .toEqual(['e.manifesto'])
  })

  it('hat keinen deaktivierten Slot — Version 1 ist der erste Katalog', () => {
    expect(BRAND_SLOTS.filter(slot => slot.deactivated)).toEqual([])
  })
})

describe('Registry-Invarianten — Gegenproben (jede Regel fällt einzeln)', () => {
  it('erkennt eine doppelte Id', () => {
    const broken = [...BRAND_SLOTS, BRAND_SLOTS[0]!]
    expect(validateSlotRegistry(broken).some(line => line.includes('doppelte Slot-Id'))).toBe(true)
  })

  it('erkennt einen unbekannten stepId', () => {
    const broken = mutate('a.pitch', { stepId: 'kontext' as unknown as BrandStepKey })
    expect(validateSlotRegistry(broken).some(line => line.includes('unbekannter stepId'))).toBe(true)
  })

  it('erkennt eine Abhängigkeit ins Leere', () => {
    const broken = mutate('b.purpose', { dependencies: ['a.gibtEsNicht'] })
    expect(validateSlotRegistry(broken).some(line => line.includes('existiert nicht'))).toBe(true)
  })

  it('erkennt eine VORWÄRTS zeigende Abhängigkeit (der Zyklus-Fall)', () => {
    const broken = mutate('a.pitch', { dependencies: ['e.manifesto'] })
    expect(validateSlotRegistry(broken).some(line => line.includes('steht nicht VOR dem Slot'))).toBe(true)
  })

  it('erkennt einen Selbstbezug', () => {
    const broken = mutate('c.final', { dependencies: ['c.final'] })
    expect(validateSlotRegistry(broken).some(line => line.includes('steht nicht VOR dem Slot'))).toBe(true)
  })

  it('erkennt einen Baustein ohne Slot', () => {
    const broken = BRAND_SLOTS.filter(slot => slot.stepId !== 'result')
    expect(validateSlotRegistry(broken).some(line => line.includes('hat keinen aktiven Slot'))).toBe(true)
  })

  it('erkennt eine Überschreitung des 20k-Limits', () => {
    const broken = mutate('e.manifesto', { maxLength: 100_000, schema: { kind: 'richtext', maxLength: 100_000 } })
    expect(validateSlotRegistry(broken).some(line => line.includes('Schema-Anhang §2'))).toBe(true)
  })

  it('erkennt auseinanderlaufende maxLength-Angaben', () => {
    const broken = mutate('a.pitch', { maxLength: 500 })
    expect(validateSlotRegistry(broken).some(line => line.includes('laufen auseinander'))).toBe(true)
  })

  it('erkennt einen von Hand geschriebenen i18n-Schlüssel', () => {
    const broken = mutate('a.origin', { questionKey: 'brand.q.origin' })
    expect(validateSlotRegistry(broken).some(line => line.includes('brand.q.<id>'))).toBe(true)
  })

  it('erkennt einen Baustein, dessen Slots zusammen die 200k sprengen', () => {
    const inflated = BRAND_SLOTS.map(slot => (slot.stepId === 'archetype'
      ? { ...slot, maxLength: BRAND_SLOT_MAX_LENGTH, schema: { ...slot.schema, maxLength: BRAND_SLOT_MAX_LENGTH } }
      : slot))
    // 12 × 20k = 240k > 200k.
    expect(validateSlotRegistry(inflated).some(line => line.includes('Summe maxLength'))).toBe(true)
  })
})

describe('Slot-Zählung je Baustein (der Katalog ist die Quelle)', () => {
  const expected: Record<BrandStepKey, number> = {
    // A 11 · B 10 (purpose/vision/mission sind drei Ids) · B2 5 ·
    // C 9 (discovery1–3 sind drei Ids) · D 12 (primary/secondary sind zwei) ·
    // E 6 (composition ist EIN strukturierter Slot) · E+ 5 · F 8 · Ergebnis 2.
    context: 11,
    pvm: 10,
    architecture: 5,
    values: 9,
    archetype: 12,
    manifesto: 6,
    verbal: 5,
    naming: 8,
    result: 2,
  }

  for (const stepKey of BRAND_STEP_KEYS) {
    it(`${stepKey}: ${expected[stepKey]} Slots`, () => {
      expect(slotsForStep(stepKey).length).toBe(expected[stepKey])
    })
  }

  it('sind zusammen 68 Slots', () => {
    expect(BRAND_SLOTS.length).toBe(68)
    expect(Object.values(expected).reduce((a, b) => a + b, 0)).toBe(68)
  })

  it('trägt die Ids des Katalogs wörtlich', () => {
    for (const id of ['a.pitch', 'b.purpose', 'c.conflictRule', 'd.pairs', 'e.statements', 'ep.taglines', 'f.checks']) {
      expect(slotById(id)?.id).toBe(id)
    }
  })

  it('kennt genau drei nicht-pflichtige Slots, jeder mit Grund', () => {
    expect(BRAND_SLOTS.filter(slot => !slot.required).map(slot => slot.id))
      .toEqual(['a.toneAnalysis', 'c.teamFilter', 'result.rating'])
  })
})

describe('slotsForStep / requiredSlotsForStep / slotById', () => {
  it('liefert nur Slots des Bausteins, in Katalog-Reihenfolge', () => {
    const values = slotsForStep('values').map(slot => slot.id)
    expect(values[0]).toBe('c.discovery1')
    expect(values.at(-1)).toBe('c.teamFilter')
    expect(values.every(id => id.startsWith('c.'))).toBe(true)
  })

  it('lässt den optionalen Team-Slot aus den Pflicht-Slots heraus', () => {
    const required = requiredSlotsForStep('values').map(slot => slot.id)
    expect(required).not.toContain('c.teamFilter')
    expect(required).toHaveLength(8)
  })

  it('findet einen unbekannten Slot nicht', () => {
    expect(slotById('z.nope')).toBeUndefined()
  })
})

/**
 * DIE BEDIENBARE PFLICHT-MENGE (Audit-Befund A4, 2026-09-02).
 *
 * Der Katalog darf mehr verlangen, als heute gebaut ist; das GATE darf es
 * nicht. Genau ein Slot fällt auseinander — der Paarvergleich `d.pairs`, dessen
 * Instrument mit P4 kommt. Solange er in der Pflicht-Menge stand, konnte
 * `archetype` nie abgeschlossen werden (Bühne wie Route lesen dieselbe
 * Rechnung). Die Gegenprobe unten ist der Wächter: taucht ein ZWEITER
 * bedienungsloser Pflicht-Slot auf, ist das keine stille Sackgasse mehr.
 */
describe('slotIsConfirmable / confirmableRequiredSlotsForStep', () => {
  it('nennt genau den Paarvergleich unbestätigbar', () => {
    const unconfirmable = BRAND_SLOTS.filter(slot => !slot.deactivated && !slotIsConfirmable(slot))
    expect(unconfirmable.map(slot => slot.id)).toEqual(['d.pairs'])
  })

  it('nimmt d.pairs aus der Pflicht-Menge von archetype, sonst nichts', () => {
    const all = requiredSlotsForStep('archetype').map(slot => slot.id)
    const gate = confirmableRequiredSlotsForStep('archetype').map(slot => slot.id)
    expect(all).toContain('d.pairs')
    expect(gate).not.toContain('d.pairs')
    expect(gate).toEqual(all.filter(id => id !== 'd.pairs'))
    // Die vier Ableitungen BLEIBEN drin: sie haben kein Feld, aber sehr wohl
    // eine Zustimmung (`brandSlotControls`) — sie sind Pflicht und bedienbar.
    expect(gate).toEqual(expect.arrayContaining(['d.hypothesis', 'd.primary', 'd.secondary', 'd.gapReveal']))
  })

  it('lässt jeden anderen Baustein unverändert', () => {
    for (const stepKey of BRAND_STEP_KEYS.filter(key => key !== 'archetype')) {
      expect(confirmableRequiredSlotsForStep(stepKey)).toEqual(requiredSlotsForStep(stepKey))
    }
  })
})

describe('dependencyClosure', () => {
  it('liefert die transitive Quellmenge, ohne den Slot selbst', () => {
    const closure = dependencyClosure('b.mission')
    expect(closure).toContain('b.purpose')
    // über b.purpose mitgezogen:
    expect(closure).toContain('b.whyStarted')
    expect(closure).toContain('a.origin')
    expect(closure).not.toContain('b.mission')
  })

  it('ist bei einer reinen Menschenfrage leer', () => {
    expect(dependencyClosure('d.party')).toEqual([])
    expect(dependencyClosure('a.complaints')).toEqual([])
  })

  it('liefert stabile Katalog-Reihenfolge (nicht Besuchsreihenfolge)', () => {
    const closure = dependencyClosure('e.manifesto')
    const position = new Map(BRAND_SLOTS.map((slot, index) => [slot.id, index]))
    const positions = closure.map(id => position.get(id)!)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('zieht die ganze Kette bis in den Kontext', () => {
    // ep.taglines ← e.anchorLine ← e.manifesto ← e.statements ← b.purpose ← a.pitch
    expect(dependencyClosure('ep.taglines')).toContain('a.pitch')
  })

  it('gibt für einen unbekannten Slot nichts zurück, statt zu werfen', () => {
    expect(dependencyClosure('z.nope')).toEqual([])
  })

  it('TERMINIERT auch bei einem künstlichen Zyklus (Gegenprobe)', () => {
    const cyclic: BrandSlot[] = [
      { ...BRAND_SLOTS[0]!, id: 'x.a', dependencies: ['x.b'] },
      { ...BRAND_SLOTS[0]!, id: 'x.b', dependencies: ['x.a'] },
    ]
    expect(dependencyClosure('x.a', cyclic)).toEqual(['x.a', 'x.b'])
    // …und der Wächter meldet ihn, statt ihn durchzulassen.
    expect(validateSlotRegistry(cyclic).some(line => line.includes('steht nicht VOR dem Slot'))).toBe(true)
  })
})

describe('stepProgress — die ehrliche Formel', () => {
  it('ist ohne einen einzigen Wert bei 0 %', () => {
    expect(stepProgress('pvm', {})).toEqual({ requiredTotal: 10, requiredFilled: 0, pct: 0 })
  })

  it('zählt schon Georges ENTWURF, nicht erst die Bestätigung', () => {
    expect(stepProgress('pvm', { 'b.purpose': { hasValue: true } }).requiredFilled).toBe(1)
    expect(stepProgress('pvm', { 'b.purpose': { confirmed: true } }).requiredFilled).toBe(1)
  })

  it('rundet auf ganze Prozent (die Form von progressPct)', () => {
    const state = Object.fromEntries(
      requiredSlotsForStep('pvm').slice(0, 3).map(slot => [slot.id, { hasValue: true }]),
    )
    expect(stepProgress('pvm', state).pct).toBe(30)
  })

  it('erreicht 100 %, wenn alle Pflicht-Slots gefüllt sind', () => {
    const state = Object.fromEntries(requiredSlotsForStep('values').map(slot => [slot.id, { confirmed: true }]))
    expect(stepProgress('values', state)).toEqual({ requiredTotal: 8, requiredFilled: 8, pct: 100 })
  })

  it('zählt optionale Slots WEDER oben NOCH unten', () => {
    const state = Object.fromEntries(requiredSlotsForStep('values').map(slot => [slot.id, { confirmed: true }]))
    const withOptional = { ...state, 'c.teamFilter': { confirmed: true } }
    expect(stepProgress('values', withOptional)).toEqual(stepProgress('values', state))
  })

  it('lässt fremde Slot-Ids im Zustand kalt', () => {
    expect(stepProgress('result', { 'b.purpose': { confirmed: true } }).requiredFilled).toBe(0)
  })

  it('behandelt leere Zustände als ungefüllt', () => {
    expect(slotIsFilled(undefined)).toBe(false)
    expect(slotIsFilled({})).toBe(false)
    expect(slotIsFilled({ hasValue: false, confirmed: false })).toBe(false)
    expect(slotIsFilled({ hasValue: true })).toBe(true)
  })
})

describe('exampleKeyFor — dieselbe Pfad-Konvention unter brand.example', () => {
  it('hängt den Pfad nur an, wo die Frage eine eigene Fassung hat', () => {
    const origin = slotById('a.origin')!
    expect(exampleKeyFor(origin, 'new')).toBe('brand.example.a.origin.new')
    expect(exampleKeyFor(origin, 'relaunch')).toBe('brand.example.a.origin.relaunch')
    const praise = slotById('a.customerPraise')!
    expect(exampleKeyFor(praise, 'new')).toBe('brand.example.a.customerPraise')
    expect(exampleKeyFor(praise, 'relaunch')).toBe('brand.example.a.customerPraise')
  })
})

describe('questionKeyFor — die Pfad-Konvention', () => {
  it('hängt den Pfad nur an, wo es eine eigene Fassung gibt', () => {
    const origin = slotById('a.origin')!
    expect(questionKeyFor(origin, 'new')).toBe('brand.q.a.origin.new')
    expect(questionKeyFor(origin, 'relaunch')).toBe('brand.q.a.origin.relaunch')
  })

  it('lässt einen Pfad ohne Variante auf dem Basis-Schlüssel', () => {
    const gap = slotById('d.gapReveal')!
    expect(questionKeyFor(gap, 'relaunch')).toBe('brand.q.d.gapReveal.relaunch')
    expect(questionKeyFor(gap, 'new')).toBe('brand.q.d.gapReveal')
  })

  it('gibt bei Slots ohne Varianten immer den Basis-Schlüssel', () => {
    const praise = slotById('a.customerPraise')!
    expect(questionKeyFor(praise, 'new')).toBe('brand.q.a.customerPraise')
    expect(questionKeyFor(praise, 'relaunch')).toBe('brand.q.a.customerPraise')
  })

  it('kennt genau die drei pfad-abhängigen Slots des Katalogs', () => {
    expect(BRAND_SLOTS.filter(slot => slot.pathVariants).map(slot => slot.id))
      .toEqual(['a.origin', 'b.whyStarted', 'd.gapReveal'])
  })
})
