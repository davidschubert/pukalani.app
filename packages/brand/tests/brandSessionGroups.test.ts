import { describe, expect, it } from 'vitest'
import {
  ASKABLE_SESSION_KINDS,
  brandChapterIsSplit,
  brandDerivedDividerSlot,
  brandSessionGroups,
  brandSessionIsAskable,
  brandSessionIsDerived,
  validateSessionOrder,
} from '../shared/brandSessionGroups'
import { resolveNextSession } from '../shared/brandJourney'
import { resolveActiveSession } from '../shared/brandWorkspaceNav'
import {
  BRAND_SLOTS,
  BRAND_STEP_KEYS,
  type BrandSlot,
  type BrandStepKey,
  slotById,
  slotsForStep,
} from '../shared/slotRegistry'

/**
 * FRAGEN VOR ABLEITUNGEN (Davids Entscheidung 2026-09-09, aus dem Klick-Test).
 *
 * Im Kapitel `context` standen die Ableitungen VOR den Fragen; George sprang
 * an ihnen vorbei zur ersten echten Frage, und für den Menschen davor sah das
 * aus, als überspränge die Werkstatt die halbe Leiste. Die Registry ist
 * umgestellt, und dieser Beweis hält beides fest: die neue Reihenfolge UND die
 * Regel, an der jeder künftige Eintrag gemessen wird.
 */

/** Die Kapitel, in denen eine Frage aus einer Ableitung DESSELBEN Kapitels schöpft. */
const MIXED_CHAPTERS: readonly BrandStepKey[] = [
  'values', 'archetype', 'manifesto', 'naming', 'dna', 'color', 'mark',
]

describe('Der Wächter: Fragen stehen vor den Ableitungen', () => {
  it('findet an der echten Registry nichts zu beanstanden', () => {
    expect(validateSessionOrder()).toEqual([])
  })

  it('GEGENPROBE: eine Ableitung vor einer unabhängigen Frage fällt auf', () => {
    // `a.pitch` (Ableitung) vor `a.origin` (Frage ohne Eingaben) — genau der
    // Stand von vor dem 2026-09-09. Ohne diese Zeile prüfte der Test oben nur,
    // dass eine Funktion ein leeres Array zurückgibt.
    const before = BRAND_SLOTS.filter(slot => slot.id !== 'a.pitch')
    const index = before.findIndex(slot => slot.id === 'a.origin')
    const mutated: BrandSlot[] = [
      ...before.slice(0, index),
      slotById('a.pitch')!,
      ...before.slice(index),
    ]
    const problems = validateSessionOrder(mutated)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('context')
    expect(problems[0]).toContain('a.origin')
  })

  it('lässt ein gemischtes Kapitel zu, das seine Abhängigkeit nachweist', () => {
    // `c.final` WÄHLT aus `c.candidates` — die Frage kann dort nicht vor die
    // Ableitung, ohne dass die Rückwärts-Regel bricht. Genau diese sieben
    // Kapitel sind heute gemischt, und alle sieben führen den Nachweis.
    for (const stepKey of MIXED_CHAPTERS) {
      expect(brandChapterIsSplit(stepKey), stepKey).toBe(false)
    }
    expect(validateSessionOrder()).toEqual([])
  })

  it('GEGENPROBE: fällt die Abhängigkeit weg, verlangt der Wächter die Teilung', () => {
    // `c.final` ohne seine Quelle — dann gäbe es keinen Grund mehr, warum die
    // Wahl hinter dem Kandidaten-Entwurf steht, und der Wächter sagt es.
    const mutated = BRAND_SLOTS.map(slot => (slot.id === 'c.final'
      ? { ...slot, dependencies: [], inputs: { ...slot.inputs, slots: [] } }
      : slot))
    const problems = validateSessionOrder(mutated)
    expect(problems.some(line => line.includes('values') && line.includes('c.final'))).toBe(true)
  })
})

describe('Die zwei Gruppen eines Kapitels', () => {
  it('teilt `context` in sechs Fragen und fünf Ableitungen', () => {
    const groups = brandSessionGroups('context')
    expect(groups.questions).toEqual([
      'a.origin', 'a.customerPraise', 'a.complaints', 'a.oneThing', 'a.challenge', 'a.facts',
    ])
    expect(groups.derived).toEqual([
      'a.pitch', 'a.category', 'a.competitors', 'a.audienceSketch', 'a.toneAnalysis',
    ])
  })

  it('liefert für ein Kapitel ohne Ableitung eine leere Gruppe', () => {
    // `result` ist zwei Auswahlen, mehr nicht — und damit auch ohne Trenner.
    expect(brandSessionGroups('result')).toEqual({
      questions: ['result.direction', 'result.rating'],
      derived: [],
    })
    expect(brandDerivedDividerSlot('result')).toBeNull()
  })

  it('deckt jedes Kapitel vollständig und überschneidungsfrei ab', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      const { questions, derived } = brandSessionGroups(stepKey)
      const all = slotsForStep(stepKey).map(session => session.id)
      expect([...questions, ...derived].sort(), stepKey).toEqual([...all].sort())
      expect(questions.filter(id => derived.includes(id)), stepKey).toEqual([])
    }
  })

  it('nennt fragbar genau das, was George auch stellt', () => {
    // Die Menge des Trenners und die Menge von `resolveNextSession` sind
    // DIESELBE — sonst stünde eine Session unter „Daraus abgeleitet", die
    // George gleich darauf fragt.
    expect([...ASKABLE_SESSION_KINDS]).toEqual(['ask', 'collect', 'choose'])
    for (const session of BRAND_SLOTS) {
      expect(brandSessionIsAskable(session), session.id)
        .toBe(session.type === 'question' || session.type === 'choice')
      expect(brandSessionIsDerived(session), session.id).toBe(!brandSessionIsAskable(session))
    }
  })
})

describe('Der Trenner „Daraus abgeleitet"', () => {
  it('steht vor der ersten Ableitung, wo das Kapitel sauber zerfällt', () => {
    expect(brandDerivedDividerSlot('context')).toBe('a.pitch')
    expect(brandDerivedDividerSlot('pvm')).toBe('b.purpose')
    expect(brandDerivedDividerSlot('architecture')).toBe('b2.rule')
    expect(brandDerivedDividerSlot('verbal')).toBe('ep.boilerplates')
    expect(brandDerivedDividerSlot('type')).toBe('i.scale')
    expect(brandDerivedDividerSlot('imagery')).toBe('k.photo')
    expect(brandDerivedDividerSlot('motion')).toBe('l.transitions')
  })

  it('bleibt weg, wo unter ihm wieder gefragt würde', () => {
    // Eine Überschrift, unter der eine Frage steht, wäre eine falsche Zusage.
    for (const stepKey of MIXED_CHAPTERS) {
      expect(brandDerivedDividerSlot(stepKey), stepKey).toBeNull()
    }
  })

  it('steht immer an einer Ableitung, nie an einer Frage', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      const divider = brandDerivedDividerSlot(stepKey)
      if (divider === null) continue
      expect(brandSessionIsDerived(slotById(divider)!), stepKey).toBe(true)
      // Und er ist die ERSTE Ableitung des Kapitels — nicht irgendeine.
      expect(brandSessionGroups(stepKey).derived[0], stepKey).toBe(divider)
    }
  })
})

describe('Die Folge für den Weg durch das Kapitel', () => {
  it('die erste offene Session in `context` ist jetzt eine echte Frage', () => {
    // Der Kern von Davids Entscheidung: der Auto-Weiter bleibt, wie er ist —
    // er landet nur nicht mehr mitten im Kapitel.
    expect(resolveNextSession('context', {})?.slotId).toBe('a.origin')
    expect(resolveActiveSession({
      stepKey: 'context',
      sessions: Object.fromEntries(
        slotsForStep('context').map(session => [session.id, { state: 'open' as const }]),
      ),
    })).toBe('a.origin')
  })

  it('jedes sauber geteilte Kapitel beginnt mit einer fragbaren Session', () => {
    // Sonst zeigte die Leiste ganz oben eine Zeile, die George stumm überspringt.
    for (const stepKey of BRAND_STEP_KEYS) {
      if (!brandChapterIsSplit(stepKey)) continue
      expect(brandSessionIsAskable(slotsForStep(stepKey)[0]!), stepKey).toBe(true)
    }
  })

  it('und die beiden Kapitel, die mit einer Ableitung beginnen, müssen es', () => {
    // `archetype` und `color` sind die zwei Ausnahmen — und sie sind keine
    // Nachlässigkeit: dort schöpft die erste Frage des Kapitels aus einer
    // Ableitung desselben Kapitels (`d.toneWords` aus `d.primary`,
    // `h.neutral` aus `h.base`). Ohne diese Zeile wäre die Ausnahme unbemerkt
    // erweiterbar.
    const startsDerived = BRAND_STEP_KEYS
      .filter(stepKey => brandSessionIsDerived(slotsForStep(stepKey)[0]!))
    expect(startsDerived).toEqual(['archetype', 'color'])
    for (const stepKey of startsDerived) {
      expect(brandChapterIsSplit(stepKey), stepKey).toBe(false)
    }
  })
})
