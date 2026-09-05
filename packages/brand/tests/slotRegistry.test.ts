import { describe, expect, it } from 'vitest'
import { techniqueForStep } from '../shared/brandAdvisors'
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
  partKeyFor,
  questionKeyFor,
  requiredSlotsForStep,
  sessionKindFor,
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
/**
 * DIE ANNAHME DER ÜBERSICHTS-KACHEL (Audit-Befund C4).
 *
 * `/dashboard/brands` schaltet den „Euer Branding"-Einstieg frei, sobald
 * `currentStepKey === 'result'` — und das heisst nur deshalb „alles davor ist
 * fertig", weil `result` der LETZTE Baustein des Weges ist
 * (`resolveProfileProgress` nimmt den ersten offenen, sonst den letzten).
 * Rutschte ein neuer Baustein dahinter, ginge das Schloss lautlos auf.
 */
describe('BRAND_STEP_KEYS — das Ergebnis steht am Ende', () => {
  it('hat `result` als letzten Eintrag', () => {
    expect(BRAND_STEP_KEYS.at(-1)).toBe('result')
  })
})

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

describe('exampleKeyFor — dieselben Konventionen unter brand.example', () => {
  it('hängt den Pfad nur an, wo die Frage eine eigene Fassung hat', () => {
    const origin = slotById('a.origin')!
    expect(exampleKeyFor(origin, 'new')).toBe('brand.example.a.origin.new')
    expect(exampleKeyFor(origin, 'relaunch')).toBe('brand.example.a.origin.relaunch')
    const praise = slotById('a.customerPraise')!
    expect(exampleKeyFor(praise, 'new')).toBe('brand.example.a.customerPraise')
    expect(exampleKeyFor(praise, 'relaunch')).toBe('brand.example.a.customerPraise')
  })

  /**
   * DIE TEAM-WEICHE GILT AUCH FÜRS BEISPIEL (Paket 8): sonst stünde unter
   * der Team-Frage von `c.discovery3` die Musterantwort zur Solo-Frage.
   * Wie bei `questionKeyFor` trägt der Schlüssel IMMER ein Suffix — ein
   * JSON-Katalog kann unter einem Schlüssel nicht Text UND Kinder halten.
   */
  it('hängt bei der Team-Variante immer solo/team an', () => {
    const discovery = slotById('c.discovery3')!
    expect(exampleKeyFor(discovery, 'new')).toBe('brand.example.c.discovery3.solo')
    expect(exampleKeyFor(discovery, 'new', 'solo')).toBe('brand.example.c.discovery3.solo')
    expect(exampleKeyFor(discovery, 'relaunch', 'team')).toBe('brand.example.c.discovery3.team')
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

/**
 * DER SESSION-VERTRAG (BW2 Paket 1, Plan BRAND-WIZARD-SESSIONS.md §3/§3a).
 *
 * Die Registry ist damit nicht mehr nur eine Feld-Tabelle, sondern die
 * Beschreibung von 68 Arbeitseinheiten. Was hier geprüft wird, ist genau das,
 * was der Plan zusagt — jeweils mit einer MUTIERTEN Fassung als Gegenprobe:
 * eine Prüfung, die nur die richtige Liste kennt, wäre immer grün.
 */
describe('Session-Vertrag', () => {
  it('gibt jeder Session ein nicht-leeres Ziel', () => {
    for (const session of BRAND_SLOTS) expect(session.goal.trim(), session.id).not.toBe('')
  })

  it('meldet ein fehlendes Ziel als Registry-Fehler', () => {
    expect(validateSlotRegistry(mutate('b.purpose', { goal: '' })))
      .toContain('b.purpose: leeres goal — jede Session braucht ein Ziel')
  })

  it('leitet `kind` mechanisch aus dem Füllweg ab — mit der einen Ausnahme', () => {
    const byKind = (kind: string) => BRAND_SLOTS.filter(session => session.kind === kind).map(s => s.id)
    for (const session of BRAND_SLOTS) {
      if (session.id === 'a.facts') continue
      expect(sessionKindFor(session), session.id).toBe(session.kind)
      expect({
        question: 'ask',
        choice: 'choose',
        derivation: 'derive',
        'stage-edit': 'draft',
        special: 'instrument',
      }[session.type], session.id).toBe(session.kind)
    }
    // `a.facts` steht als `choice` im Katalog und ist trotzdem eine SAMMLUNG.
    expect(byKind('collect')).toEqual(['a.facts'])
    expect(slotById('a.facts')!.type).toBe('choice')
    expect(byKind('instrument')).toEqual(['d.pairs'])
  })

  it('meldet ein `kind`, das nicht zum Füllweg passt', () => {
    expect(validateSlotRegistry(mutate('b.purpose', { kind: 'ask' })))
      .toContain('b.purpose: kind "ask" passt nicht zum type "stage-edit"')
  })

  it('gibt Teile NUR der Sammel-Session', () => {
    expect(slotById('a.facts')!.parts).toEqual(['teamSize', 'age', 'markets'])
    for (const session of BRAND_SLOTS) {
      if (session.kind === 'collect') continue
      expect(session.parts, session.id).toEqual([])
    }
    expect(validateSlotRegistry(mutate('b.purpose', { parts: ['x'] })))
      .toContain('b.purpose: parts sind nur bei kind "collect" erlaubt')
    expect(validateSlotRegistry(mutate('a.facts', { parts: [] })))
      .toContain('a.facts: kind "collect" ohne parts')
  })

  it('führt `inputs.slots` und `dependencies` als DIESELBE Liste', () => {
    for (const session of BRAND_SLOTS) {
      expect(session.inputs.slots, session.id).toBe(session.dependencies)
    }
    expect(validateSlotRegistry(mutate('b.purpose', { inputs: { ...slotById('b.purpose')!.inputs, slots: [] } })))
      .toContain('b.purpose: inputs.slots und dependencies sind nicht dieselbe Liste')
  })

  it('spiegelt Schema, Editor und Generator im Output-Vertrag', () => {
    for (const session of BRAND_SLOTS) {
      expect(session.output.schema, session.id).toEqual(session.schema)
      expect(session.output.editor, session.id).toBe(session.editor)
      expect(session.output.generator, session.id).toBe(session.generator)
    }
    const purpose = slotById('b.purpose')!
    expect(validateSlotRegistry(mutate('b.purpose', {
      output: { ...purpose.output, editor: 'chips' },
    }))).toContain('b.purpose: output.editor/generator laufen auseinander')
  })

  it('gibt jeder Session genau EINE Technik — die ihres Kapitels', () => {
    for (const session of BRAND_SLOTS) {
      expect(session.processing.technique, session.id).toBe(techniqueForStep(session.stepId).key)
    }
    // Und sie ist nicht überall dieselbe — sonst prüfte die Zeile oben nichts.
    expect(new Set(BRAND_SLOTS.map(session => session.processing.technique)).size).toBeGreaterThan(1)
  })

  it('setzt Vertraulichkeit und Umfang für jede Session', () => {
    for (const session of BRAND_SLOTS) {
      expect(['public', 'internal', 'private'], session.id).toContain(session.sensitivity)
      expect([1, 2, 3, 5, 10], session.id).toContain(session.effort.minutes)
      expect(session.effort.turns, session.id).toBeGreaterThan(0)
    }
  })

  it('hält genau die vier heiklen Sessions zurück (Plan §3a Nr. 7)', () => {
    // Drei nennt der Plan (Beschwerden, Herausforderung, Zahlen); die vierte ist
    // Davids Entscheidung vom 2026-09-04 (Audit Punkt 8): `a.competitors` nennt
    // NAMENTLICH Dritte und zu jedem eine Schwäche — das Erste, was ein Kunde
    // nicht teilen will. Umgekehrt ist `b2.roleOfMaster` zurück auf `public`:
    // die Architektur-Aussage wird im geteilten Dokument gebraucht, sobald
    // `b2.rule` darauf verweist.
    expect(BRAND_SLOTS.filter(session => session.sensitivity !== 'public').map(session => session.id))
      .toEqual(['a.competitors', 'a.complaints', 'a.challenge', 'a.facts'])
  })

  it('lässt Invarianten nur auf Sessions zeigen, die VOR ihnen stehen', () => {
    const position = new Map(BRAND_SLOTS.map((session, index) => [session.id, index]))
    BRAND_SLOTS.forEach((session, index) => {
      for (const invariant of session.invariants) {
        if (invariant.of === undefined) continue
        expect(position.get(invariant.of), `${session.id} → ${invariant.of}`).toBeLessThan(index)
      }
    })
  })

  it('meldet eine Invariante, die nach vorne zeigt', () => {
    expect(validateSlotRegistry(mutate('c.final', { invariants: [{ kind: 'memberOf', of: 'f.shortlist' }] })))
      .toContain('c.final: Invariante zeigt auf "f.shortlist", der nicht VOR dem Slot steht')
    expect(validateSlotRegistry(mutate('c.final', { invariants: [{ kind: 'memberOf', of: 'gibtsnicht' }] })))
      .toContain('c.final: Invariante zeigt auf unbekannten Slot "gibtsnicht"')
  })

  it('gibt jeder Session 3 bis 5 prüfbare Qualitätsmerkmale', () => {
    for (const session of BRAND_SLOTS) {
      expect(session.quality.length, session.id).toBeGreaterThanOrEqual(3)
      expect(session.quality.length, session.id).toBeLessThanOrEqual(5)
    }
    expect(validateSlotRegistry(mutate('b.purpose', { quality: ['nur eines'] })))
      .toContain('b.purpose: 1 Qualitätsmerkmale — verlangt sind 3 bis 5')
  })

  it('gibt jeder Session mindestens zwei Anti-Muster', () => {
    for (const session of BRAND_SLOTS) {
      expect(session.antiPatterns.length, session.id).toBeGreaterThanOrEqual(2)
    }
    expect(validateSlotRegistry(mutate('b.purpose', { antiPatterns: ['eines'] })))
      .toContain('b.purpose: weniger als zwei Anti-Muster')
  })

  it('gibt eine Leiter NUR den Sessions, in denen jemand gefragt wird', () => {
    const asks = (session: BrandSlot) =>
      session.kind === 'ask' || session.kind === 'collect' || session.kind === 'choose'
    for (const session of BRAND_SLOTS) {
      if (asks(session)) expect(session.ladder.opening.trim(), session.id).not.toBe('')
      else expect(session.ladder.opening, session.id).toBe('')
    }
    // 29 Fragen + 1 Sammlung (a.facts) + 15 Auswahlen = 45. Die Registry führt
    // 16 `choice`-Slots, aber `a.facts` ist davon die Sammlung (Plan, Anhang A).
    expect(BRAND_SLOTS.filter(asks)).toHaveLength(45)

    expect(validateSlotRegistry(mutate('a.origin', {
      ladder: { opening: '', probes: [], reframes: [] },
    }))).toContain('a.origin: kind "ask" ohne Eröffnung in der Leiter')
    expect(validateSlotRegistry(mutate('b.purpose', {
      ladder: { opening: 'etwas', probes: [], reframes: [] },
    }))).toContain('b.purpose: kind "draft" braucht keine Leiter — hier fragt niemand')
  })

  it('gibt jeder Entwurfs-Session ein Beispiel je Pfad UND je Sprache', () => {
    const drafts = BRAND_SLOTS.filter(session =>
      session.kind === 'derive' || session.kind === 'draft' || session.generator === 'candidates')
    // 11 Ableitungen + 11 Entwürfe + `ep.taglines` (Auswahl mit Kandidaten-Generator).
    expect(drafts).toHaveLength(23)
    for (const session of drafts) {
      for (const pathKind of ['new', 'relaunch'] as const) {
        expect(session.examples[pathKind].de.length, `${session.id}/${pathKind}/de`).toBeGreaterThan(0)
        expect(session.examples[pathKind].en.length, `${session.id}/${pathKind}/en`).toBeGreaterThan(0)
      }
    }

    const purpose = slotById('b.purpose')!
    expect(validateSlotRegistry(mutate('b.purpose', {
      examples: { ...purpose.examples, relaunch: { de: [], en: [] } },
    }))).toContain('b.purpose: kein Beispiel für Pfad "relaunch" in "de"')
  })

  it('lässt genau zwei Sessions bewusst ohne Beispiel', () => {
    // `d.pairs` ist ein Instrument (der Wert entsteht Karte gegen Karte) und
    // `result.rating` eine freiwillige Zahl — beides sind Fälle, in denen ein
    // Beispiel keine Form zeigte, sondern nur ein Ergebnis vorwegnähme.
    const withoutExamples = BRAND_SLOTS
      .filter(session => session.examples.new.de.length === 0 && session.examples.relaunch.de.length === 0)
      .map(session => session.id)
    expect(withoutExamples).toEqual(['d.pairs', 'result.rating'])
  })

  it('meldet einen unbrauchbaren Umfang', () => {
    expect(validateSlotRegistry(mutate('b.purpose', { effort: { minutes: 3, turns: 0 } })))
      .toContain('b.purpose: unbrauchbarer Umfang (3 min, 0 Züge)')
  })

  it('hält spitze Klammern aus allem heraus, was ein MENSCH liest', () => {
    // Die Verarbeitungsregeln dürfen sie tragen (die Formeln brauchen ihre
    // Platzhalter) — Ziel, Qualität, Anti-Muster, Leiter und Beispiele nicht:
    // die stehen im Info-Modal und auf der Abnahme-Seite.
    expect(BRAND_SLOTS.some(session => session.processing.rules.some(rule => /[<>]/.test(rule)))).toBe(true)
    expect(validateSlotRegistry(mutate('a.origin', { goal: 'capture <what>' })))
      .toContain('a.origin: spitze Klammern in goal')
    expect(validateSlotRegistry(mutate('a.origin', {
      examples: { new: { de: ['<name>'], en: [] }, relaunch: { de: [], en: [] } },
    }))).toContain('a.origin: spitze Klammern in examples')
  })

  it('hält den Basispfad bei 70 bis 80 Minuten (Davids Entscheidung 2026-09-04)', () => {
    // Die alte Summe war 154 Min im Basispfad — gegen die Kommunikationslinie
    // „~45 Minuten" (Content-Spec §16). Entschieden ist „halbieren und in
    // Kapitel-Etappen kommunizieren". Die SPANNE steht hier und nicht die
    // genaue Zahl: eine einzelne Session darf sich bewegen, die Zusage nicht.
    const OPTIONAL: readonly string[] = ['architecture', 'naming']
    const active = BRAND_SLOTS.filter(session => !session.deactivated)
    const minutes = (sessions: readonly BrandSlot[]) =>
      sessions.reduce((sum, session) => sum + session.effort.minutes, 0)
    const base = minutes(active.filter(session => !OPTIONAL.includes(session.stepId)))
    const full = minutes(active)

    expect(base, `Basispfad ${base} Min`).toBeGreaterThanOrEqual(70)
    expect(base, `Basispfad ${base} Min`).toBeLessThanOrEqual(80)
    // Der Vollpfad ist der Basispfad plus zwei Kapitel hinter einer Weiche —
    // er muss grösser sein, sonst rechnet die Zeile oben über die falsche Menge.
    expect(full).toBeGreaterThan(base)
    expect(full).toBeLessThanOrEqual(100)
  })

  it('schreibt keine Nachfrage auf, die der Deckel verbietet (Audit Teil 3 Nr. 1)', () => {
    const contradicting = BRAND_SLOTS
      .filter(session => session.answers.maxProbes < session.ladder.probes.length)
      .map(session => `${session.id}: ${session.ladder.probes.length} > ${session.answers.maxProbes}`)
    expect(contradicting).toEqual([])
    // Ohne diese Zeile wäre der Test grün, sobald keine Leiter mehr Nachfragen
    // trägt — 14 Auswahl-Sessions standen genau deshalb im Audit.
    expect(BRAND_SLOTS.filter(session => session.ladder.probes.length > 0).length).toBeGreaterThan(20)

    expect(validateSlotRegistry(mutate('c.final', {
      answers: { ...slotById('c.final')!.answers, maxProbes: 0 },
    }))).toContain('c.final: 1 Nachfragen in der Leiter, aber maxProbes 0')
  })

  it('gibt Frage- und Auswahl-Sessions genug Züge für ihre Leiter', () => {
    for (const session of BRAND_SLOTS) {
      if (session.kind !== 'ask' && session.kind !== 'choose') continue
      expect(session.effort.turns, session.id).toBeGreaterThanOrEqual(1 + session.answers.maxProbes)
    }
    expect(validateSlotRegistry(mutate('a.origin', { effort: { minutes: 2, turns: 2 } })))
      .toContain('a.origin: 2 Züge tragen keine Eröffnung plus 2 Nachfragen')
  })

  it('lässt in Beispielen, in denen die MARKE spricht, keine Anrede zu', () => {
    // Davids Entscheidung 2026-09-04 (Audit Punkt 5): wessen Kundschaft geduzt
    // oder gesiezt wird, entscheidet diese Marke — nicht unser Beispiel. Der
    // Bruch stand in `ep.keyMessages`: „Sie müssen nicht ausziehen" auf dem
    // einen Pfad, „dass ihr wiederkommt" auf dem anderen.
    //
    // GEPRÜFT WIRD DIE LISTE, IN DER DIE MARKE SPRICHT — nicht alle Beispiele:
    // wo George oder der Kunde spricht (`d.hypothesis`, `d.gapReveal`,
    // `a.customerPraise` …), IST „ihr/euch" der richtige Ton.
    const BRAND_SPEAKS = [
      'a.pitch', 'b.whyStarted', 'b.purpose', 'b.vision', 'b.mission', 'b2.rule',
      'c.definitions', 'd.voiceSamples',
      'e.statements', 'e.manifesto', 'e.anchorLine',
      'ep.taglines', 'ep.boilerplates', 'ep.keyMessages', 'ep.distinctiveAsset',
    ]
    const GERMAN = /\b(du|dich|dir|dein\w*|euch|euer|eure\w*|ihr)\b/i
    const FORMAL = /\b(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer)\b/
    const ENGLISH = /\b(you|your|yours)\b/i

    const hits: string[] = []
    for (const id of BRAND_SPEAKS) {
      const session = slotById(id)!
      for (const pathKind of ['new', 'relaunch'] as const) {
        for (const text of session.examples[pathKind].de) {
          if (GERMAN.test(text) || FORMAL.test(text)) hits.push(`${id}/${pathKind}/de`)
        }
        for (const text of session.examples[pathKind].en) {
          if (ENGLISH.test(text)) hits.push(`${id}/${pathKind}/en`)
        }
      }
    }
    expect(hits).toEqual([])
    // GEGENPROBE: die Muster greifen überhaupt.
    expect(GERMAN.test('Sie müssen nicht ausziehen, damit ihr wiederkommt')).toBe(true)
    expect(FORMAL.test('Sie müssen nicht ausziehen')).toBe(true)
    expect(ENGLISH.test('You do not have to move out')).toBe(true)
    // Und die Liste ist nicht leer geworden.
    expect(BRAND_SPEAKS.every(id => slotById(id) !== undefined)).toBe(true)
  })

  it('gibt c.discovery3 eine Team-Fassung und sonst keiner Session', () => {
    expect(BRAND_SLOTS.filter(session => session.teamVariant).map(session => session.id))
      .toEqual(['c.discovery3'])
    const discovery3 = slotById('c.discovery3')!
    expect(questionKeyFor(discovery3, 'new', 'solo')).toBe('brand.q.c.discovery3.solo')
    expect(questionKeyFor(discovery3, 'relaunch', 'team')).toBe('brand.q.c.discovery3.team')
    // Ohne Angabe gilt die persönliche Fassung — sie passt immer.
    expect(questionKeyFor(discovery3, 'new')).toBe('brand.q.c.discovery3.solo')
    // Eine Session OHNE Team-Fassung bleibt unberührt.
    expect(questionKeyFor(slotById('c.discovery1')!, 'new', 'team')).toBe('brand.q.c.discovery1')
    // Pfad- und Team-Variante zugleich wären vier Fassungen je Frage.
    expect(validateSlotRegistry(mutate('c.discovery3', { pathVariants: { new: true } })))
      .toContain('c.discovery3: teamVariant und pathVariants zugleich')
  })

  it('trägt die beiden Invarianten-Entscheidungen aus Paket 2', () => {
    // `f.decision` ist „top three, in order" — eine LISTE, deren Zeilen alle
    // aus der Shortlist stammen müssen (Paket-1-Befund (b), jetzt entschieden).
    expect(slotById('f.decision')!.invariants).toEqual([{ kind: 'subsetOf', of: 'f.shortlist' }])
    // `f.shortlist` bekommt BEWUSST keine: eine Kandidaten-Zeile trägt laut
    // Content-Spec §10 den Namenstyp mit, `subsetOf` verglich also Zeilen, die
    // nie gleich sein können.
    expect(slotById('f.shortlist')!.invariants).toEqual([])
    expect(slotById('c.final')!.invariants).toEqual([{ kind: 'count', min: 3, max: 5 }])
    expect(slotById('e.anchorLine')!.invariants).toEqual([{ kind: 'sentenceOf', of: 'e.manifesto' }])
  })

  it('lässt vertagen, wo jemand fehlt, der nicht am Tisch sitzt', () => {
    // Zahlen (a.facts), Team-Fragen (Konfliktregel, Einstellungsfilter) und das
    // ganze Kapitel Markenarchitektur — überall dort ist die Alternative zum
    // Vertagen eine erfundene Antwort.
    //
    // PAKET 2b hat die Liste mit sich selbst in Einklang gebracht (Audit Punkt
    // 7): `b2.model` und `b2.rule` sind dazugekommen (wer die drei VORFRAGEN
    // vertagen darf, kann die ENTSCHEIDUNG daraus erst recht nicht allein
    // treffen), ebenso `c.livedExamples` („ein echtes Beispiel je Wert, mit
    // Datum, Ort oder Person"). RAUS ist `f.noGos` — die persönlichste
    // Geschmacksfrage des Bausteins braucht niemanden, der gerade fehlt.
    expect(BRAND_SLOTS.filter(session => session.answers.allowDefer).map(session => session.id))
      .toEqual([
        'a.facts',
        'b2.visibility', 'b2.roleOfMaster', 'b2.namingPattern', 'b2.model', 'b2.rule',
        'c.livedExamples', 'c.conflictRule', 'c.teamFilter',
      ])
  })

  it('nennt die Teile der Sammel-Session so, wie der Locale-Katalog sie führt', () => {
    const facts = slotById('a.facts')!
    expect(facts.parts.map(part => partKeyFor(facts, part))).toEqual([
      'brand.part.a.facts.teamSize',
      'brand.part.a.facts.age',
      'brand.part.a.facts.markets',
    ])
  })

  it('kennt zu jedem Inhalts-Eintrag eine Session', () => {
    // Die Gegenprobe läuft über die echte Registry: ein verwaister Eintrag
    // wäre ein Tippfehler in einer Id und ein Ziel, das niemand liest.
    expect(validateSlotRegistry()).toEqual([])
  })
})
