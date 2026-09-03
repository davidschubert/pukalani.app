import { describe, expect, it } from 'vitest'
import {
  BRAND_CONFIDENCE_VALUES,
  type BrandConfidence,
  type BrandJourneyStep,
  type BrandProfileFacts,
  type BrandStepFacts,
  applyJunctionChange,
  brandNamingIncluded,
  brandStepCompletion,
  canEnterBrandStep,
  includedBrandSteps,
  resolveBrandJourney,
  resolveNextQuestion,
  transitionBrandStep,
} from '../shared/brandJourney'
import {
  BRAND_STEP_KEYS,
  type BrandSlotStateFacts,
  type BrandStepKey,
  requiredSlotsForStep,
  slotsForStep,
} from '../shared/slotRegistry'

/**
 * Die Zustandsmaschine. Geprüft wird nicht nur, dass der Weg funktioniert,
 * sondern vor allem, dass er sich NICHT abkürzen lässt: jede Verweigerung hat
 * hier ihren eigenen Fall, und der Happy-Path wird einmal ganz durchgespielt.
 */

/** Der Basispfad der Interaktionsbilanz: neue Marke, solo, ohne B2, ohne F. */
const BASE_PROFILE: BrandProfileFacts = {
  pathKind: 'new',
  hasName: true,
  team: 'solo',
  subBrands: 'no',
}

/** Der Vollpfad: Relaunch/Neuschnitt, Team, mit B2 und mit F. */
const FULL_PROFILE: BrandProfileFacts = {
  pathKind: 'relaunch',
  relaunchScope: 'recut',
  hasName: true,
  namingOpted: true,
  team: 'team',
  subBrands: 'yes',
}

function stateOf(journey: readonly BrandJourneyStep[], stepKey: BrandStepKey) {
  return journey.find(step => step.stepKey === stepKey)!
}

/** Ein Baustein mit ALLEN Pflicht-Slots bestätigt. */
function completedStep(stepKey: BrandStepKey, confidence: BrandConfidence = 'fits'): BrandStepFacts {
  return {
    stepKey,
    state: 'done',
    confidence,
    slots: Object.fromEntries(requiredSlotsForStep(stepKey).map(slot => [slot.id, { hasValue: true, confirmed: true }])),
  }
}

function filledActiveStep(stepKey: BrandStepKey): BrandStepFacts {
  return { ...completedStep(stepKey), state: 'active', confidence: null }
}

describe('includedBrandSteps — die Weichen', () => {
  it('Basispfad: sieben Bausteine, ohne architecture und naming', () => {
    expect(includedBrandSteps(BASE_PROFILE))
      .toEqual(['context', 'pvm', 'values', 'archetype', 'manifesto', 'verbal', 'result'])
  })

  it('Vollpfad: alle neun', () => {
    expect(includedBrandSteps(FULL_PROFILE)).toEqual([...BRAND_STEP_KEYS])
  })

  it('W4 unbeantwortet zählt NICHT als abgewählt, hält den Weg aber auch nicht auf', () => {
    const stand = [completedStep('context'), completedStep('pvm')]
    const undecided = resolveBrandJourney({ ...BASE_PROFILE, subBrands: 'unknown' }, stand)
    expect(stateOf(undecided, 'architecture')).toMatchObject({ state: 'skipped', reason: 'junction_undecided' })
    // Und genau so weit wie bei einem klaren „nein": der unbeantwortete
    // Baustein ist keine zusätzliche Sperre.
    expect(stateOf(undecided, 'values').state)
      .toBe(stateOf(resolveBrandJourney(BASE_PROFILE, stand), 'values').state)
    expect(stateOf(undecided, 'values').state).toBe('open')
  })

  it('W4 „nein" ist abgewählt und heisst auch so', () => {
    expect(stateOf(resolveBrandJourney(BASE_PROFILE), 'architecture').reason).toBe('junction_off')
  })
})

describe('brandNamingIncluded — W2 und der Neuschnitt-Chip', () => {
  it('ohne Namen immer', () => {
    expect(brandNamingIncluded({ ...BASE_PROFILE, hasName: false })).toBe(true)
    expect(brandNamingIncluded({ ...FULL_PROFILE, hasName: false, namingOpted: false })).toBe(true)
  })

  it('mit Namen auf dem Gründer-Pfad nie', () => {
    expect(brandNamingIncluded(BASE_PROFILE)).toBe(false)
  })

  it('Feinschliff öffnet Naming NICHT — auch nicht mit gesetztem Chip', () => {
    expect(brandNamingIncluded({
      pathKind: 'relaunch', relaunchScope: 'refine', hasName: true, team: 'solo', subBrands: 'no', namingOpted: true,
    })).toBe(false)
  })

  it('Neuschnitt öffnet nur MIT bewusstem Chip (Default nein)', () => {
    const recut: BrandProfileFacts = {
      pathKind: 'relaunch', relaunchScope: 'recut', hasName: true, team: 'solo', subBrands: 'no',
    }
    expect(brandNamingIncluded(recut)).toBe(false)
    expect(brandNamingIncluded({ ...recut, namingOpted: false })).toBe(false)
    expect(brandNamingIncluded({ ...recut, namingOpted: true })).toBe(true)
  })

  it('ignoriert einen relaunchScope auf dem Gründer-Pfad (widersprüchliche Tatsachen)', () => {
    expect(brandNamingIncluded({
      pathKind: 'new', relaunchScope: 'recut', hasName: true, team: 'solo', subBrands: 'no', namingOpted: true,
    })).toBe(false)
  })
})

describe('resolveBrandJourney — Reihenfolge und Freischaltung', () => {
  it('gibt IMMER alle neun Bausteine zurück, in Plan-Reihenfolge', () => {
    expect(resolveBrandJourney(BASE_PROFILE).map(step => step.stepKey)).toEqual([...BRAND_STEP_KEYS])
  })

  it('öffnet ohne jeden Stand genau den ersten und sperrt den Rest', () => {
    const journey = resolveBrandJourney(BASE_PROFILE)
    expect(stateOf(journey, 'context')).toMatchObject({ state: 'open', reason: 'entry' })
    expect(stateOf(journey, 'pvm')).toMatchObject({ state: 'locked', reason: 'awaiting_previous' })
    expect(journey.filter(step => step.state === 'open')).toHaveLength(1)
  })

  it('schaltet den nächsten erst frei, wenn der Vorgänger done ist', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [completedStep('context')])
    expect(stateOf(journey, 'context').state).toBe('done')
    expect(stateOf(journey, 'pvm')).toMatchObject({ state: 'open', reason: 'unlocked' })
    expect(stateOf(journey, 'values').state).toBe('locked')
  })

  it('reicht einen ÜBERSPRUNGENEN Baustein durch — er ist kein Hindernis', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [completedStep('context'), completedStep('pvm')])
    expect(stateOf(journey, 'architecture').state).toBe('skipped')
    expect(stateOf(journey, 'values')).toMatchObject({ state: 'open', reason: 'unlocked' })
  })

  it('zeigt einen begonnenen Baustein als active', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [{ stepKey: 'context', state: 'active' }])
    expect(stateOf(journey, 'context')).toMatchObject({ state: 'active', reason: 'in_progress' })
    expect(stateOf(journey, 'pvm').state).toBe('locked')
  })

  it('markiert nur architecture und naming als weichen-abhängig', () => {
    const optional = resolveBrandJourney(FULL_PROFILE).filter(step => step.optional).map(step => step.stepKey)
    expect(optional).toEqual(['architecture', 'naming'])
  })

  it('trägt Fortschritt und offene Pflicht-Slots je Baustein', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [
      { stepKey: 'context', state: 'active', slots: { 'a.pitch': { hasValue: true } } },
    ])
    const context = stateOf(journey, 'context')
    expect(context.progress).toMatchObject({ requiredTotal: 10, requiredFilled: 1 })
    // Entwurf zählt für den Fortschritt, NICHT für „bestätigt".
    expect(context.missingRequired).toContain('a.pitch')
  })

  it('stuft ein gespeichertes done NICHT herab, auch wenn Pflicht-Slots fehlen (Migrationsvertrag §3e)', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [{ stepKey: 'context', state: 'done', confidence: 'fits' }])
    expect(stateOf(journey, 'context').state).toBe('done')
    expect(stateOf(journey, 'context').missingRequired.length).toBeGreaterThan(0)
    expect(stateOf(journey, 'pvm').state).toBe('open')
  })

  it('lässt einen späteren done stehen, wenn ein früherer wieder offen ist (reopen propagiert nicht)', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [
      { ...completedStep('context'), state: 'active' },
      completedStep('pvm'),
    ])
    expect(stateOf(journey, 'context').state).toBe('active')
    expect(stateOf(journey, 'pvm').state).toBe('done')
    // Und der Weg geht dahinter normal weiter.
    expect(stateOf(journey, 'values').state).toBe('open')
  })

  it('behält den Stand eines übersprungenen Bausteins (Daten bleiben inaktiv)', () => {
    const journey = resolveBrandJourney(BASE_PROFILE, [completedStep('architecture')])
    const architecture = stateOf(journey, 'architecture')
    expect(architecture.state).toBe('skipped')
    expect(architecture.progress.pct).toBe(100)
    expect(architecture.confidence).toBe('fits')
  })
})

describe('resolveBrandJourney — Happy-Path über den ganzen Vollpfad', () => {
  it('läuft Baustein für Baustein bis zum Ergebnis', () => {
    const done: BrandStepFacts[] = []
    for (const stepKey of includedBrandSteps(FULL_PROFILE)) {
      const journey = resolveBrandJourney(FULL_PROFILE, done)
      // Der nächste Baustein ist offen und betretbar …
      expect(stateOf(journey, stepKey).state).toBe('open')
      expect(canEnterBrandStep(journey, stepKey).allowed).toBe(true)

      // … starten, alle Pflicht-Slots bestätigen, Konfidenz setzen, abschliessen.
      let step: BrandStepFacts = { stepKey, state: 'open' }
      const started = transitionBrandStep(step, { kind: 'start' })
      expect(started.ok).toBe(true)
      step = started.ok ? started.step : step

      for (const slot of requiredSlotsForStep(stepKey)) {
        const result = transitionBrandStep(step, { kind: 'confirmSlot', slotId: slot.id })
        expect(result.ok).toBe(true)
        step = result.ok ? result.step : step
      }
      const confidence = transitionBrandStep(step, { kind: 'setConfidence', confidence: 'fits' })
      step = confidence.ok ? confidence.step : step

      const completed = transitionBrandStep(step, { kind: 'complete' })
      expect(completed.ok).toBe(true)
      step = completed.ok ? completed.step : step
      expect(step.state).toBe('done')
      done.push(step)
    }

    const final = resolveBrandJourney(FULL_PROFILE, done)
    expect(final.filter(step => step.state === 'done')).toHaveLength(9)
    expect(final.every(step => step.progress.pct === 100)).toBe(true)
  })

  it('endet auf dem Basispfad mit sieben done und zwei skipped', () => {
    const done = includedBrandSteps(BASE_PROFILE).map(stepKey => completedStep(stepKey))
    const journey = resolveBrandJourney(BASE_PROFILE, done)
    expect(journey.filter(step => step.state === 'done')).toHaveLength(7)
    expect(journey.filter(step => step.state === 'skipped').map(step => step.stepKey))
      .toEqual(['architecture', 'naming'])
  })
})

describe('canEnterBrandStep', () => {
  const journey = resolveBrandJourney(BASE_PROFILE, [completedStep('context')])

  it('lässt in einen abgeschlossenen Baustein zurück (§3b.2)', () => {
    expect(canEnterBrandStep(journey, 'context')).toEqual({ allowed: true, reason: null })
  })

  it('lässt in den offenen', () => {
    expect(canEnterBrandStep(journey, 'pvm')).toEqual({ allowed: true, reason: null })
  })

  it('verweigert das Springen in einen gesperrten', () => {
    expect(canEnterBrandStep(journey, 'values')).toEqual({ allowed: false, reason: 'locked' })
    expect(canEnterBrandStep(journey, 'result')).toEqual({ allowed: false, reason: 'locked' })
  })

  it('verweigert einen übersprungenen — der geht über die Weiche auf, nicht über die Adresszeile', () => {
    expect(canEnterBrandStep(journey, 'architecture')).toEqual({ allowed: false, reason: 'skipped' })
  })

  it('verweigert einen unbekannten Schlüssel', () => {
    expect(canEnterBrandStep(journey, 'kontext')).toEqual({ allowed: false, reason: 'unknown_step' })
  })
})

describe('transitionBrandStep — start / reopen', () => {
  it('start macht aus open ein active', () => {
    const result = transitionBrandStep({ stepKey: 'context', state: 'open' }, { kind: 'start' })
    expect(result).toMatchObject({ ok: true, changed: true })
    expect(result.ok && result.step.state).toBe('active')
  })

  it('start auf active ist ein No-op (schreibt nichts, erhöht keine revision)', () => {
    const result = transitionBrandStep({ stepKey: 'context', state: 'active' }, { kind: 'start' })
    expect(result).toMatchObject({ ok: true, changed: false })
  })

  it('start verweigert einen gesperrten Baustein', () => {
    expect(transitionBrandStep({ stepKey: 'values', state: 'locked' }, { kind: 'start' }))
      .toEqual({ ok: false, code: 'step_locked' })
  })

  it('start auf done verweist auf reopen', () => {
    expect(transitionBrandStep(completedStep('context'), { kind: 'start' }))
      .toEqual({ ok: false, code: 'already_done' })
  })

  it('reopen macht aus done wieder active und lässt Slots UND Konfidenz stehen', () => {
    const result = transitionBrandStep(completedStep('context'), { kind: 'reopen' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.step.state).toBe('active')
    expect(result.step.confidence).toBe('fits')
    expect(result.step.slots?.['a.pitch']?.confirmed).toBe(true)
  })

  it('reopen verweigert alles, was nicht done ist', () => {
    for (const state of ['open', 'active', 'locked'] as const) {
      expect(transitionBrandStep({ stepKey: 'context', state }, { kind: 'reopen' }))
        .toEqual({ ok: false, code: 'not_done' })
    }
  })

  it('mutiert den übergebenen Stand nie', () => {
    const step: BrandStepFacts = { stepKey: 'context', state: 'open' }
    transitionBrandStep(step, { kind: 'start' })
    expect(step.state).toBe('open')
  })
})

describe('transitionBrandStep — confirmSlot', () => {
  const active: BrandStepFacts = { stepKey: 'context', state: 'active' }

  it('bestätigt einen Slot des Bausteins und setzt hasValue mit', () => {
    const result = transitionBrandStep(active, { kind: 'confirmSlot', slotId: 'a.pitch' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.step.slots?.['a.pitch']).toEqual({ hasValue: true, confirmed: true })
  })

  it('ist beim zweiten Mal ein No-op', () => {
    const first = transitionBrandStep(active, { kind: 'confirmSlot', slotId: 'a.pitch' })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(transitionBrandStep(first.step, { kind: 'confirmSlot', slotId: 'a.pitch' }))
      .toMatchObject({ ok: true, changed: false })
  })

  it('verweigert einen Slot, der zu einem ANDEREN Baustein gehört', () => {
    expect(transitionBrandStep(active, { kind: 'confirmSlot', slotId: 'b.purpose' }))
      .toEqual({ ok: false, code: 'slot_foreign' })
  })

  it('verweigert eine erfundene Slot-Id', () => {
    expect(transitionBrandStep(active, { kind: 'confirmSlot', slotId: 'a.erfunden' }))
      .toEqual({ ok: false, code: 'unknown_slot' })
  })

  it('verweigert das Bestätigen in einem noch nicht gestarteten Baustein', () => {
    expect(transitionBrandStep({ stepKey: 'context', state: 'open' }, { kind: 'confirmSlot', slotId: 'a.pitch' }))
      .toEqual({ ok: false, code: 'not_started' })
  })

  it('verweigert das Bestätigen in einem gesperrten Baustein', () => {
    expect(transitionBrandStep({ stepKey: 'context', state: 'locked' }, { kind: 'confirmSlot', slotId: 'a.pitch' }))
      .toEqual({ ok: false, code: 'step_locked' })
  })

  it('verweigert das Bestätigen in einem abgeschlossenen Baustein (erst reopen)', () => {
    expect(transitionBrandStep(completedStep('context'), { kind: 'confirmSlot', slotId: 'a.origin' }))
      .toEqual({ ok: false, code: 'already_done' })
  })
})

describe('transitionBrandStep — Konfidenz lässt sich nicht manipulieren', () => {
  const active: BrandStepFacts = { stepKey: 'values', state: 'active' }

  it('nimmt genau die drei Chips', () => {
    for (const confidence of BRAND_CONFIDENCE_VALUES) {
      expect(transitionBrandStep(active, { kind: 'setConfidence', confidence })).toMatchObject({ ok: true })
    }
  })

  it('weist einen erfundenen Wert ab, statt ihn zu speichern', () => {
    expect(transitionBrandStep(active, { kind: 'setConfidence', confidence: 'perfekt' as BrandConfidence }))
      .toEqual({ ok: false, code: 'invalid_confidence' })
    expect(transitionBrandStep(active, { kind: 'setConfidence', confidence: '' as BrandConfidence }))
      .toEqual({ ok: false, code: 'invalid_confidence' })
  })

  it('lässt die Konfidenz nicht am Baustein vorbei setzen (nicht gestartet / gesperrt / fertig)', () => {
    expect(transitionBrandStep({ stepKey: 'values', state: 'open' }, { kind: 'setConfidence', confidence: 'fits' }))
      .toEqual({ ok: false, code: 'not_started' })
    expect(transitionBrandStep({ stepKey: 'values', state: 'locked' }, { kind: 'setConfidence', confidence: 'fits' }))
      .toEqual({ ok: false, code: 'step_locked' })
    expect(transitionBrandStep(completedStep('values'), { kind: 'setConfidence', confidence: 'restart' }))
      .toEqual({ ok: false, code: 'already_done' })
  })

  it('ist ein No-op, wenn derselbe Chip noch einmal kommt', () => {
    const first = transitionBrandStep(active, { kind: 'setConfidence', confidence: 'almost' })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(transitionBrandStep(first.step, { kind: 'setConfidence', confidence: 'almost' }))
      .toMatchObject({ ok: true, changed: false })
  })
})

describe('transitionBrandStep — complete verlangt Vollständigkeit', () => {
  it('schliesst ab, wenn alle Pflicht-Slots bestätigt sind und eine Konfidenz steht', () => {
    const result = transitionBrandStep({ ...filledActiveStep('values'), confidence: 'fits' }, { kind: 'complete' })
    expect(result).toMatchObject({ ok: true, changed: true })
    expect(result.ok && result.step.state).toBe('done')
  })

  it('verweigert den Abschluss bei EINEM fehlenden Pflicht-Slot und nennt ihn', () => {
    const step = filledActiveStep('values')
    const slots = { ...step.slots }
    delete slots['c.conflictRule']
    const result = transitionBrandStep({ ...step, slots, confidence: 'fits' }, { kind: 'complete' })
    expect(result).toMatchObject({ ok: false, code: 'required_slots_missing' })
    expect(!result.ok && result.missing).toEqual(['c.conflictRule'])
  })

  it('lässt ein blosses hasValue NICHT als Bestätigung durchgehen', () => {
    const slots = Object.fromEntries(requiredSlotsForStep('result').map(slot => [slot.id, { hasValue: true }]))
    const result = transitionBrandStep(
      { stepKey: 'result', state: 'active', confidence: 'fits', slots },
      { kind: 'complete' },
    )
    expect(result).toMatchObject({ ok: false, code: 'required_slots_missing' })
  })

  it('verlangt zusätzlich die Konfidenz-Weiche', () => {
    expect(transitionBrandStep(filledActiveStep('values'), { kind: 'complete' }))
      .toEqual({ ok: false, code: 'confidence_missing' })
  })

  it('braucht KEINEN optionalen Slot (Solo darf „Werte" abschliessen)', () => {
    const result = transitionBrandStep({ ...filledActiveStep('values'), confidence: 'fits' }, { kind: 'complete' })
    expect(result.ok).toBe(true)
    expect(result.ok && result.step.slots?.['c.teamFilter']).toBeUndefined()
  })

  it('verweigert den Abschluss eines nicht gestarteten Bausteins', () => {
    expect(transitionBrandStep({ ...filledActiveStep('values'), state: 'open', confidence: 'fits' }, { kind: 'complete' }))
      .toEqual({ ok: false, code: 'not_started' })
  })

  it('verweigert den Abschluss eines gesperrten Bausteins', () => {
    expect(transitionBrandStep({ stepKey: 'naming', state: 'locked' }, { kind: 'complete' }))
      .toEqual({ ok: false, code: 'step_locked' })
  })
})

describe('brandStepCompletion — EINE Vorbedingung, zwei Leser', () => {
  /**
   * DER KERN VON DAVIDS BEFUND (Live-Durchlauf 2026-09-02): der Browser zeigte
   * die Konfidenz-Weiche, wenn `resolveNextQuestion` nichts mehr fand — die
   * Route verlangt aber BESTÄTIGTE Pflicht-Slots. Diese beiden Fragen dürfen
   * nie wieder auseinanderlaufen, und genau das nagelt dieser Block fest:
   * geprüft wird nicht, dass die Funktion „irgendwas Vernünftiges" sagt,
   * sondern dass ihr Ja/Nein IDENTISCH ist mit dem der Abschluss-Regel.
   */
  it('sagt für jeden Baustein exakt das, was `complete` entscheidet', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      const required = requiredSlotsForStep(stepKey)
      // Alle Teilmengen wären 2^n — der ehrliche Querschnitt: gar nichts,
      // lauter Entwürfe ohne Bestätigung, jeweils genau EINER offen, alles
      // bestätigt.
      const cases: Record<string, BrandSlotStateFacts>[] = [
        {},
        Object.fromEntries(required.map(slot => [slot.id, { hasValue: true }])),
        ...required.map(open => Object.fromEntries(
          required.map(slot => [slot.id, { hasValue: true, confirmed: slot.id !== open.id }]),
        )),
        Object.fromEntries(required.map(slot => [slot.id, { hasValue: true, confirmed: true }])),
      ]

      for (const slots of cases) {
        const completion = brandStepCompletion(stepKey, slots)
        const result = transitionBrandStep(
          // Konfidenz gesetzt und `active`: sonst schiede der Abschluss aus
          // einem ANDEREN Grund aus, und der Vergleich bewiese nichts.
          { stepKey, state: 'active', confidence: 'fits', slots },
          { kind: 'complete' },
        )
        expect(result.ok).toBe(completion.slotsReady)
        if (!result.ok) {
          expect(result.code).toBe('required_slots_missing')
          expect(result.missing).toEqual(completion.missingRequired)
        }
      }
    }
  })

  it('zählt Bestätigtes von Pflicht — der Zähler des ruhigen Hinweises', () => {
    const required = requiredSlotsForStep('values')
    const slots = Object.fromEntries(
      required.map((slot, index) => [slot.id, { hasValue: true, confirmed: index > 0 }]),
    )
    const completion = brandStepCompletion('values', slots)
    expect(completion.total).toBe(required.length)
    expect(completion.confirmed).toBe(required.length - 1)
    expect(completion.missingRequired).toEqual([required[0]!.id])
  })

  it('DER BEFUND: ein unbestätigter Entwurfs-Slot hält die Weiche zu', () => {
    // `pvm` wie bei David: alle Fragen beantwortet, „Mission" liegt als
    // Entwurf da. `resolveNextQuestion` sieht deshalb nichts mehr — und genau
    // deswegen stand die Weiche vorher zu früh auf der Bühne.
    const slots = Object.fromEntries(
      requiredSlotsForStep('pvm').map(slot => [slot.id, {
        hasValue: true,
        confirmed: slot.id !== 'b.mission',
      }]),
    )
    expect(resolveNextQuestion('pvm', slots)).toBeNull()

    const completion = brandStepCompletion('pvm', slots)
    expect(completion.slotsReady).toBe(false)
    expect(completion.missingRequired).toEqual(['b.mission'])
    expect(completion.confirmed).toBe(completion.total - 1)
  })

  it('ist ohne jede Slot-Kenntnis nicht bereit (fail-closed)', () => {
    const completion = brandStepCompletion('pvm')
    expect(completion.slotsReady).toBe(false)
    expect(completion.missingRequired).toEqual(requiredSlotsForStep('pvm').map(slot => slot.id))
  })

  it('gibt die offenen Slots in Registry-Reihenfolge zurück', () => {
    const ordered = requiredSlotsForStep('context').map(slot => slot.id)
    expect(brandStepCompletion('context').missingRequired).toEqual(ordered)
  })
})

describe('resolveNextQuestion', () => {
  it('fragt den ersten offenen Pflicht-Slot in Registry-Reihenfolge', () => {
    // a.pitch/a.category/a.competitors/a.audienceSketch sind Ableitungen —
    // die erste FRAGE des Bausteins ist a.origin.
    expect(resolveNextQuestion('context')).toMatchObject({ slotId: 'a.origin', type: 'question' })
  })

  it('überspringt, was schon gefüllt ist', () => {
    expect(resolveNextQuestion('context', { 'a.origin': { hasValue: true } }))
      .toMatchObject({ slotId: 'a.customerPraise' })
  })

  it('fragt niemals nach Ableitungen oder Bühnen-Entwürfen', () => {
    for (const stepKey of BRAND_STEP_KEYS) {
      const next = resolveNextQuestion(stepKey)
      if (!next) continue
      expect(['question', 'choice']).toContain(next.type)
    }
  })

  it('fragt keinen optionalen Slot', () => {
    const filled = Object.fromEntries(requiredSlotsForStep('values').map(slot => [slot.id, { hasValue: true }]))
    expect(resolveNextQuestion('values', filled)).toBeNull()
  })

  it('liefert die i18n-Schlüssel gleich mit', () => {
    expect(resolveNextQuestion('naming')).toEqual({
      slotId: 'f.nameType',
      questionKey: 'brand.q.f.nameType',
      helpKey: 'brand.help.f.nameType',
      type: 'choice',
      editor: 'chips',
    })
  })

  it('gibt null, wenn alle Pflicht-Fragen beantwortet sind', () => {
    const filled = Object.fromEntries(slotsForStep('archetype').map(slot => [slot.id, { confirmed: true }]))
    expect(resolveNextQuestion('archetype', filled)).toBeNull()
  })
})

describe('applyJunctionChange — Weichen umlegen, ohne zu löschen', () => {
  it('W4 auf ja schaltet architecture frei', () => {
    const effect = applyJunctionChange(BASE_PROFILE, { junction: 'subBrands', value: 'yes' })
    expect(effect.activated).toEqual(['architecture'])
    expect(effect.deactivated).toEqual([])
    expect(effect.profile.subBrands).toBe('yes')
    expect(effect.changed).toBe(true)
  })

  it('W4 zurück auf nein nimmt architecture wieder vom Weg — die Daten bleiben Sache der Route', () => {
    const effect = applyJunctionChange({ ...BASE_PROFILE, subBrands: 'yes' }, { junction: 'subBrands', value: 'no' })
    expect(effect.deactivated).toEqual(['architecture'])
    expect(effect.activated).toEqual([])
  })

  it('W2 „doch kein Name" schaltet naming frei', () => {
    const effect = applyJunctionChange(BASE_PROFILE, { junction: 'hasName', value: false })
    expect(effect.activated).toEqual(['naming'])
  })

  it('der Neuschnitt-Chip schaltet naming frei, der Feinschliff nicht', () => {
    const recut: BrandProfileFacts = {
      pathKind: 'relaunch', relaunchScope: 'recut', hasName: true, team: 'solo', subBrands: 'no',
    }
    expect(applyJunctionChange(recut, { junction: 'namingOpted', value: true }).activated).toEqual(['naming'])
    const refine: BrandProfileFacts = { ...recut, relaunchScope: 'refine' }
    expect(applyJunctionChange(refine, { junction: 'namingOpted', value: true }).activated).toEqual([])
  })

  it('vom Neuschnitt auf Feinschliff zurück nimmt naming wieder vom Weg', () => {
    const recut: BrandProfileFacts = {
      pathKind: 'relaunch', relaunchScope: 'recut', hasName: true, team: 'solo', subBrands: 'no', namingOpted: true,
    }
    expect(applyJunctionChange(recut, { junction: 'relaunchScope', value: 'refine' }).deactivated).toEqual(['naming'])
  })

  it('W3 bewegt keinen Baustein — sie tauscht Fassungen', () => {
    const effect = applyJunctionChange(BASE_PROFILE, { junction: 'team', value: 'team' })
    expect(effect).toMatchObject({ activated: [], deactivated: [], changed: true })
    expect(effect.profile.team).toBe('team')
  })

  it('meldet changed:false, wenn derselbe Wert noch einmal kommt', () => {
    expect(applyJunctionChange(BASE_PROFILE, { junction: 'subBrands', value: 'no' }).changed).toBe(false)
  })

  it('mutiert das übergebene Profil nicht', () => {
    const profile = { ...BASE_PROFILE }
    applyJunctionChange(profile, { junction: 'subBrands', value: 'yes' })
    expect(profile.subBrands).toBe('no')
  })

  it('findet den Stand wieder, wenn eine Weiche zurückgedreht wird (§3e)', () => {
    const stand = [completedStep('context'), completedStep('pvm'), completedStep('architecture')]
    const off = applyJunctionChange(FULL_PROFILE, { junction: 'subBrands', value: 'no' })
    expect(stateOf(resolveBrandJourney(off.profile, stand), 'architecture').state).toBe('skipped')
    const on = applyJunctionChange(off.profile, { junction: 'subBrands', value: 'yes' })
    expect(stateOf(resolveBrandJourney(on.profile, stand), 'architecture'))
      .toMatchObject({ state: 'done', progress: { pct: 100 } })
  })
})
