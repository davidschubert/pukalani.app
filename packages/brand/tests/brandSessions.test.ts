import { describe, expect, it } from 'vitest'
import {
  BRAND_SOURCES_HASH_SCOPE,
  BRAND_SUBSTANCE_MIN_WORDS,
  applyAffected,
  brandListEntries,
  computeSourcesHash,
  confirmedDependents,
  correctionNeedsAck,
  evaluateInvariants,
  affectsView,
  nextCollectPart,
  sessionsAffectedBy,
} from '../shared/brandSessions'
import {
  BRAND_DESIGN_STEP_KEYS,
  BRAND_FOUNDATION_STEP_KEYS,
  BRAND_SLOTS,
  type BrandSessionConfig,
  type BrandSlotStateFacts,
  isBrandDesignStep,
  slotById,
} from '../shared/slotRegistry'

/**
 * DIE DREI REINEN RECHNUNGEN ÜBER DEM SESSION-VERTRAG (BW2 Paket 1).
 *
 * ── DIE HÜLLEN-TABELLE IST DER KERN ───────────────────────────────────────
 * `sessionsAffectedBy` beantwortet die Frage, an der die ganze Korrektur-Regel
 * hängt: „wen trifft es, wenn ich das hier ändere?". Die Zahlen unten sind
 * Anhang A des Plans (BRAND-WIZARD-SESSIONS.md, Spalte „berührt") — sie wurden
 * am 2026-09-04 mit einem Wegwerf-Skript aus der Registry erzeugt und werden
 * hier festgenagelt. Ab jetzt gilt die Richtung umgekehrt: wer eine
 * Abhängigkeit in der Registry ändert, sieht hier, WEN das trifft, und muss
 * die Tabelle bewusst nachziehen.
 *
 * Mit GEGENPROBE — eine Rechnung, die nur die richtige Registry kennt, ist
 * immer grün und beweist nichts.
 *
 * ── SEIT BRAND DESIGN D0 WERDEN ZWEI HÜLLEN GEMESSEN ──────────────────────
 * Schicht 2 hängt an vier Foundation-Feldern (`c.final`, `d.primary`,
 * `d.toneWords`, `result.direction`), und damit reicht die Hülle fast jeder
 * A- und B-Session jetzt bis in die sechs Design-Kapitel. Die Zahlen des
 * Plan-Anhangs bleiben trotzdem GÜLTIG und werden weiter festgenagelt — sie
 * beschreiben die FOUNDATION-Hülle, und die hat sich um kein Feld bewegt. Das
 * ist die Aussage, die dieser Test halten soll: Schicht 2 hat der Foundation
 * nichts weggenommen.
 *
 * Die zweite Tabelle (`AFFECTED_DESIGN`) misst die volle Hülle der
 * Design-Sessions. Sie ist ebenfalls von Hand nachzuziehen, wer dort eine
 * Abhängigkeit ändert.
 */

/** id → [Felder in der FOUNDATION-Hülle, Kapitel darin]. Anhang A des Plans. */
const AFFECTED: Readonly<Record<string, readonly [number, number]>> = {
  'a.pitch': [27, 7],
  'a.category': [9, 4],
  'a.competitors': [9, 4],
  'a.audienceSketch': [14, 5],
  'a.toneAnalysis': [22, 5],
  'a.origin': [23, 7],
  'a.customerPraise': [29, 7],
  'a.complaints': [19, 6],
  'a.oneThing': [10, 4],
  'a.challenge': [0, 0],
  'a.facts': [0, 0],
  'b.whyStarted': [15, 5],
  'b.worldLoses': [15, 5],
  'b.conviction': [22, 7],
  'b.tenYears': [8, 4],
  'b.legacy': [8, 4],
  'b.purpose': [14, 5],
  'b.vision': [7, 3],
  'b.mission': [8, 3],
  'b.positioningCategory': [3, 2],
  'b.positioningFirstChoice': [1, 1],
  'b2.visibility': [2, 1],
  'b2.roleOfMaster': [2, 1],
  'b2.namingPattern': [2, 1],
  'b2.model': [1, 1],
  'b2.rule': [0, 0],
  'c.discovery1': [19, 6],
  'c.discovery2': [19, 6],
  'c.discovery3': [19, 6],
  'c.candidates': [18, 6],
  'c.final': [17, 6],
  'c.definitions': [6, 3],
  'c.livedExamples': [0, 0],
  'c.conflictRule': [0, 0],
  'c.teamFilter': [0, 0],
  'd.hypothesis': [21, 5],
  'd.pairs': [20, 5],
  'd.primary': [18, 5],
  'd.secondary': [2, 1],
  'd.gapReveal': [0, 0],
  'd.party': [1, 1],
  'd.never': [0, 0],
  'd.admired': [0, 0],
  'd.emotion': [17, 5],
  'd.voiceSamples': [0, 0],
  'd.toneWords': [10, 4],
  'd.vocabulary': [1, 1],
  'e.warmup1': [6, 3],
  'e.warmup2': [6, 3],
  'e.statements': [5, 3],
  'e.composition': [5, 3],
  'e.manifesto': [4, 3],
  'e.anchorLine': [3, 2],
  'ep.taglines': [0, 0],
  'ep.boilerplates': [0, 0],
  'ep.keyMessages': [0, 0],
  'ep.vocabulary': [0, 0],
  'ep.distinctiveAsset': [0, 0],
  'f.nameType': [5, 1],
  'f.taste': [5, 1],
  'f.noGos': [5, 1],
  'f.candidates': [4, 1],
  'f.shortlist': [3, 1],
  'f.checks': [2, 1],
  'f.criteria': [1, 1],
  'f.decision': [0, 0],
  'result.direction': [0, 0],
  'result.rating': [0, 0],
}

function facts(values: Record<string, string>): Record<string, BrandSlotStateFacts> {
  return Object.fromEntries(
    Object.entries(values).map(([id, value]) => [id, { hasValue: true, confirmed: true, value }]),
  )
}

/**
 * id → [Felder in der VOLLEN Hülle, Kapitel darin] für die Sessions von
 * Schicht 2 (Brand Design D0). Sie berühren nur einander — die Foundation
 * liegt vor ihnen und kann von ihnen nicht getroffen werden.
 */
const AFFECTED_DESIGN: Readonly<Record<string, readonly [number, number]>> = {
  'g.source': [28, 6],
  'g.inspiration': [27, 6],
  'g.reading': [26, 6],
  'g.dna': [25, 6],
  'g.boards': [24, 6],
  'g.board': [23, 6],
  'g.mix': [22, 5],
  'h.base': [9, 2],
  'h.ramp': [4, 2],
  'h.neutral': [4, 2],
  'h.accent': [4, 2],
  'h.roles': [3, 2],
  'h.contrast': [0, 0],
  'i.pair': [8, 3],
  'i.scale': [1, 1],
  'i.rules': [0, 0],
  'j.kind': [6, 2],
  'j.brief': [1, 1],
  'j.examples': [1, 1],
  'j.pick': [0, 0],
  'j.drafts': [0, 0],
  'k.photo': [1, 1],
  'k.illustration': [1, 1],
  'k.icons': [1, 1],
  'k.dodont': [0, 0],
  'l.tempo': [3, 1],
  'l.transitions': [1, 1],
  'l.logo': [1, 1],
  'l.rules': [0, 0],
}

/** Die Hülle, auf die FOUNDATION eingeschränkt (s. Kopf). */
function foundationHull(sessionId: string): { fields: string[], steps: Set<string> } {
  const affected = sessionsAffectedBy(sessionId)
  const fields = affected.transitive.filter(id => !isBrandDesignStep(slotById(id)!.stepId))
  return { fields, steps: new Set(fields.map(id => slotById(id)!.stepId)) }
}

describe('sessionsAffectedBy — die Umkehrung der Abhängigkeiten (§9)', () => {
  it('kennt jede Session der Registry und keine mehr', () => {
    expect([...Object.keys(AFFECTED), ...Object.keys(AFFECTED_DESIGN)])
      .toEqual(BRAND_SLOTS.map(session => session.id))
  })

  it.each(Object.entries(AFFECTED))('%s berührt die zugesagte Foundation-Menge', (sessionId, [fields, chapters]) => {
    const hull = foundationHull(sessionId)
    expect(hull.fields.length, 'Felder').toBe(fields)
    expect(hull.steps.size, 'Kapitel').toBe(chapters)
  })

  it.each(Object.entries(AFFECTED_DESIGN))('%s berührt die zugesagte Menge', (sessionId, [fields, chapters]) => {
    const affected = sessionsAffectedBy(sessionId)
    expect(affected.transitive.length, 'Felder').toBe(fields)
    expect(Object.keys(affected.byStep).length, 'Kapitel').toBe(chapters)
  })

  it('SCHICHT 2 HÄNGT AN GENAU VIER FOUNDATION-FELDERN', () => {
    // `g.dna` ist die einzige Design-Session, die überhaupt in die Foundation
    // greift — alles Weitere hängt an ihr. Ohne diese Zeile wäre der
    // Foundation-Filter oben nicht zu prüfen: er könnte auch dann grün sein,
    // wenn Schicht 2 gar nicht angeschlossen wäre.
    const design = BRAND_SLOTS.filter(session => isBrandDesignStep(session.stepId))
    const intoFoundation = design.flatMap(session => session.dependencies
      .filter(id => !isBrandDesignStep(slotById(id)!.stepId)))
    expect([...new Set(intoFoundation)].sort())
      .toEqual(['c.final', 'd.primary', 'd.toneWords', 'result.direction'])
    // Und umgekehrt: `c.final` reicht wirklich bis in die Design-Kapitel.
    expect(sessionsAffectedBy('c.final').transitive).toContain('g.dna')
  })

  /**
   * DER HINWEIS NENNT NUR ERREICHBARE KAPITEL (D0, Prüf-Befund): für eine
   * nicht freigeschaltete Marke stand unter jedem Foundation-Feld „… in 53
   * weitere Felder — … Moodboard · Farbwelt …". `affectsView` klemmt die
   * Anzeige an der Journey, `sessionsAffectedBy` bleibt die volle Wahrheit.
   */
  it('affectsView: gesperrtes Brand Design fällt aus dem Hinweis, freigeschaltet zählt es mit', () => {
    const locked = [
      ...BRAND_FOUNDATION_STEP_KEYS.map(stepKey => ({ stepKey, reason: 'completed' })),
      ...BRAND_DESIGN_STEP_KEYS.map(stepKey => ({ stepKey, reason: 'design_locked' })),
    ]
    const unlocked = locked.map(entry => ({ ...entry, reason: 'unlocked' }))
    const full = sessionsAffectedBy('a.customerPraise')

    const view = affectsView('a.customerPraise', locked)
    expect(view.steps.some(stepKey => isBrandDesignStep(stepKey))).toBe(false)
    // Die Zahlen des Plan-Anhangs (Spalte „berührt"), wie vor D0 — und der
    // Beweis-Zähler in verify-brand-sessions.mjs.
    expect(view).toEqual({ count: 29, steps: view.steps })
    expect(view.steps).toHaveLength(7)

    const open = affectsView('a.customerPraise', unlocked)
    expect(open.count).toBe(full.transitive.length)
    expect(open.count).toBe(55)
    expect(open.steps).toHaveLength(13)
    expect(open.steps.filter(stepKey => isBrandDesignStep(stepKey))).toEqual([...BRAND_DESIGN_STEP_KEYS])
  })

  it('trennt direkt von der vollen Hülle — und `direct` ist deren Teilmenge', () => {
    const affected = sessionsAffectedBy('a.pitch')
    // b.purpose, b.mission und b.positioningCategory lesen a.pitch direkt;
    // ep.boilerplates ebenso. b.vision NICHT — es kommt über b.mission dazu.
    expect(affected.direct).toContain('b.purpose')
    expect(affected.direct).not.toContain('e.statements')
    expect(affected.transitive).toContain('e.statements')
    for (const id of affected.direct) expect(affected.transitive).toContain(id)
  })

  it('gibt die Hülle in Registry-Reihenfolge zurück', () => {
    const order = BRAND_SLOTS.map(session => session.id)
    const affected = sessionsAffectedBy('a.origin')
    const positions = affected.transitive.map(id => order.indexOf(id))
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
  })

  it('gruppiert je Kapitel, ohne leere Kapitel zu erfinden', () => {
    const affected = sessionsAffectedBy('c.final')
    expect(Object.keys(affected.byStep).filter(key => !isBrandDesignStep(key)).sort()).toEqual(
      ['archetype', 'manifesto', 'naming', 'result', 'values', 'verbal'],
    )
    const grouped = Object.values(affected.byStep).flatMap(ids => ids ?? [])
    expect(grouped.sort()).toEqual([...affected.transitive].sort())
  })

  /** GEGENPROBE 1: eine erfundene Abhängigkeit MUSS die Hülle vergrössern. */
  it('eine zusätzlich eingehängte Abhängigkeit vergrössert die Hülle', () => {
    const before = sessionsAffectedBy('f.decision')
    expect(before.transitive).toEqual([])

    const mutated = BRAND_SLOTS.map(session => (session.id === 'result.direction'
      ? { ...session, inputs: { ...session.inputs, slots: [...session.inputs.slots, 'f.decision'] } }
      : session))
    const after = sessionsAffectedBy('f.decision', mutated)
    expect(after.direct).toEqual(['result.direction'])
    // `result.direction` zieht seit Brand Design D0 die ganze Schicht 2 mit —
    // geprüft wird deshalb, dass sie VORHER leer war und danach genau diese
    // eine Session DIREKT dranhängt.
    expect(after.transitive[0]).toBe('result.direction')
    expect(after.transitive.filter(id => !isBrandDesignStep(slotById(id)!.stepId)))
      .toEqual(['result.direction'])
    expect(after.byStep.result).toEqual(['result.direction'])
  })

  /** GEGENPROBE 2: eine gelöschte Abhängigkeit MUSS aus der Hülle verschwinden. */
  it('eine entfernte Abhängigkeit verschwindet aus der Hülle', () => {
    const mutated = BRAND_SLOTS.map(session => (session.id === 'c.livedExamples'
      ? { ...session, inputs: { ...session.inputs, slots: [] } }
      : session))
    expect(sessionsAffectedBy('c.final').transitive).toContain('c.livedExamples')
    expect(sessionsAffectedBy('c.final', mutated).transitive).not.toContain('c.livedExamples')
  })

  it('zählt deaktivierte Sessions NIE mit — sie werden nicht mehr gefragt', () => {
    const mutated = BRAND_SLOTS.map(session => (session.id === 'c.livedExamples'
      ? { ...session, deactivated: true as const }
      : session))
    expect(sessionsAffectedBy('c.final', mutated).transitive).not.toContain('c.livedExamples')
  })

  it('terminiert auch bei einem versehentlichen Zyklus', () => {
    const mutated = BRAND_SLOTS.map((session) => {
      if (session.id === 'a.pitch') {
        return { ...session, inputs: { ...session.inputs, slots: ['b.purpose'] } }
      }
      return session
    })
    expect(sessionsAffectedBy('b.purpose', mutated).transitive).toContain('a.pitch')
  })
})

describe('computeSourcesHash — „veraltet" für ALLE Feldarten (§9)', () => {
  const session = slotById('b.purpose')!
  /** Das Trennzeichen der kanonischen Zeichenkette (U+0000, s. brandGeneration.ts). */
  const SEP = String.fromCharCode(0)

  it('trägt Session-Id, den Sonder-Bereich und jeden Quell-Wert', () => {
    const hash = computeSourcesHash(session, facts({ 'a.pitch': 'P', 'b.whyStarted': 'W' }))
    expect(hash.split(SEP)).toEqual([
      'v1', 'b.purpose', BRAND_SOURCES_HASH_SCOPE,
      'a.pitch', 'P',
      'b.whyStarted', 'W',
      'b.worldLoses', '',
      'b.conviction', '',
    ])
  })

  it('ist stabil über wiederholte Aufrufe', () => {
    const input = facts({ 'a.pitch': 'P' })
    expect(computeSourcesHash(session, input)).toBe(computeSourcesHash(session, input))
  })

  it('hängt NICHT an der Reihenfolge der Fakten, sondern an der Registry', () => {
    const forward = computeSourcesHash(session, facts({ 'a.pitch': 'P', 'b.conviction': 'C' }))
    const backward = computeSourcesHash(session, facts({ 'b.conviction': 'C', 'a.pitch': 'P' }))
    expect(forward).toBe(backward)
  })

  it('bewegt sich, sobald sich ein Quell-Wert ändert', () => {
    const before = computeSourcesHash(session, facts({ 'a.pitch': 'P' }))
    expect(computeSourcesHash(session, facts({ 'a.pitch': 'P!' }))).not.toBe(before)
  })

  it('unterscheidet „Quelle fehlt" nicht von „Quelle ist leer" — aber vom Wert', () => {
    // Fehlend und leer sind bewusst dasselbe (beide gehen als '' ein); der
    // Unterschied, auf den es ankommt, ist der zu einem GEFÜLLTEN Wert.
    expect(computeSourcesHash(session, {})).toBe(computeSourcesHash(session, facts({ 'a.pitch': '' })))
    expect(computeSourcesHash(session, {})).not.toBe(computeSourcesHash(session, facts({ 'a.pitch': 'P' })))
  })

  it('trennt sich vom Generations-inputHash über den Bereich', () => {
    expect(computeSourcesHash(session, {})).toContain(`${SEP}${BRAND_SOURCES_HASH_SCOPE}${SEP}`)
  })

  it('ist für eine Session ohne Quellen trotzdem eindeutig je Session', () => {
    expect(computeSourcesHash(slotById('a.pitch')!, {}))
      .not.toBe(computeSourcesHash(slotById('a.origin')!, {}))
  })
})

describe('evaluateInvariants — was ein Test prüfen kann (§3a Nr. 6)', () => {
  const withInvariants = (id: string, invariants: BrandSessionConfig['invariants']): BrandSessionConfig => ({
    ...slotById(id)!,
    invariants,
  })

  it('registriert in der echten Registry genau die sicheren neun', () => {
    // `f.decision` kam mit Paket 2 dazu, nachdem die WERT-FORM entschieden war
    // („top three, in order" = eine Liste, jede Zeile ein Name aus der
    // Shortlist — Paket-1-Befund (b)). Paket 2b hat vier weitere gesetzt
    // (Audit Teil 3 Nr. 4). ZWEI der sechs aus dem Audit sind BEWUSST NICHT
    // dabei:
    //  · `f.shortlist subsetOf f.candidates` — eine Kandidaten-Zeile trägt laut
    //    Content-Spec §10 den Namenstyp mit, die Zeilen können also nie gleich
    //    sein; die Invariante hätte jedes Bestätigen mit 409 abgewiesen.
    //  · `ep.distinctiveAsset` — die Regel ist ein ODER über zwei Quellen
    //    (Ankerzeile ODER Tagline), und der Invarianten-Vertrag kennt kein
    //    ODER: `memberOf e.anchorLine` allein wiese die legitime Tagline ab.
    const registered = BRAND_SLOTS
      .filter(session => session.invariants.length > 0)
      .map(session => [session.id, session.invariants] as const)
    expect(registered).toEqual([
      ['c.final', [{ kind: 'count', min: 3, max: 5 }]],
      ['c.definitions', [{ kind: 'mentionsFrom', of: 'c.final' }]],
      ['c.livedExamples', [{ kind: 'mentionsFrom', of: 'c.final' }]],
      ['c.conflictRule', [{ kind: 'mentionsFrom', of: 'c.final', min: 2 }]],
      ['d.secondary', [{ kind: 'mentionsNone', of: 'd.primary' }]],
      ['e.anchorLine', [{ kind: 'sentenceOf', of: 'e.manifesto' }]],
      ['f.decision', [{ kind: 'subsetOf', of: 'f.shortlist' }]],
      // Brand Design D3: die zwei Farb-Felder. Sie sind die einzigen
      // Invarianten OHNE Quell-Slot — geprüft wird die FORM eines Wertes
      // (`#rrggbb`), nicht sein Verhältnis zu einem anderen Feld.
      ['h.base', [{ kind: 'hex' }]],
      ['h.accent', [{ kind: 'hex' }]],
      // Brand Design D4: die zwei Typografie-Wahlen. Auch sie haben keinen
      // Quell-Slot — ihre Menge steht in einem KATALOG des Layers, nicht im
      // Wert eines anderen Feldes (`memberOf` könnte das nicht).
      ['i.pair', [{
        kind: 'oneOf',
        terms: ['editorial', 'humanist', 'inter', 'geometric', 'classic', 'contrast'],
      }]],
      ['i.scale', [{ kind: 'oneOf', terms: ['calm', 'dense', 'loud'] }]],
    ])
  })

  it('i.pair: eine Katalog-Id geht durch, ein Satz nicht (D4)', () => {
    const session = slotById('i.pair')!
    expect(evaluateInvariants(session, 'editorial').ok).toBe(true)
    expect(evaluateInvariants(session, '  Editorial  ').ok).toBe(true)
    const broken = evaluateInvariants(session, 'Eine warme Serif mit humanistischer Grotesk')
    expect(broken.ok).toBe(false)
    expect(broken.ok === false && broken.code).toBe('invariant_violated')
    expect(evaluateInvariants(slotById('i.scale')!, 'gigantisch').ok).toBe(false)
  })

  it('h.base: eine Farbe geht durch, ein Satz nicht (D3)', () => {
    const session = slotById('h.base')!
    expect(evaluateInvariants(session, '#4a3123').ok).toBe(true)
    expect(evaluateInvariants(session, '  #4A3123  ').ok).toBe(true)
    const broken = evaluateInvariants(session, 'Das warme Braun unserer Röstung')
    expect(broken.ok).toBe(false)
    expect(broken.ok === false && broken.code).toBe('invariant_violated')
    // Halbe Eingaben und Drei-Zeichen-Kurzformen zählen nicht: das Preset
    // rechnet mit sechs Zeichen (`BRAND_HEX_RE`).
    expect(evaluateInvariants(session, '#4a3').ok).toBe(false)
    // Ein LEERER Wert bleibt offen — dafür gibt es `slot_empty`, nicht die
    // Invariante (`evaluateInvariants` steigt vorher aus).
    expect(evaluateInvariants(session, '').ok).toBe(true)
  })

  it('c.definitions: jeder gewählte Wert kommt vor, keiner fehlt', () => {
    const session = slotById('c.definitions')!
    const facts = { 'c.final': { value: '- Geduld\n- Klarheit\n- Sorgfalt' } }
    expect(evaluateInvariants(
      session,
      '- Geduld — wir wiederholen.\n- Klarheit — wir sagen es.\n- Sorgfalt — wir prüfen zweimal.',
      facts,
    )).toEqual({ ok: true })
    // GEGENPROBE: ein fehlender Wert fällt durch.
    expect(evaluateInvariants(session, '- Geduld — wir wiederholen.\n- Klarheit — wir sagen es.', facts))
      .toEqual({
        ok: false,
        code: 'invariant_violated',
        invariant: { kind: 'mentionsFrom', of: 'c.final' },
      })
    // FAIL-OPEN: ohne Quelle prüft sie nichts.
    expect(evaluateInvariants(session, '- Geduld — wir wiederholen.')).toEqual({ ok: true })
  })

  it('c.conflictRule: zwei der eigenen Werte müssen beim Namen genannt sein', () => {
    const session = slotById('c.conflictRule')!
    const facts = { 'c.final': { value: '- Geduld\n- Klarheit\n- Sorgfalt' } }
    expect(evaluateInvariants(session, 'Geduld gegen Klarheit: Klarheit gewinnt.', facts))
      .toEqual({ ok: true })
    // EINER reicht nicht — und ein Konflikt zwischen Wert und Zeit erst recht nicht.
    expect(evaluateInvariants(session, 'Geduld gegen den Zeitplan: der Zeitplan gewinnt.', facts))
      .toEqual({
        ok: false,
        code: 'invariant_violated',
        invariant: { kind: 'mentionsFrom', of: 'c.final', min: 2 },
      })
  })

  it('d.secondary: der zweite Archetyp ist nicht der erste', () => {
    const session = slotById('d.secondary')!
    const facts = { 'd.primary': { value: 'creator' } }
    expect(evaluateInvariants(session, 'sage', facts)).toEqual({ ok: true })
    expect(evaluateInvariants(session, 'creator', facts)).toEqual({
      ok: false,
      code: 'invariant_violated',
      invariant: { kind: 'mentionsNone', of: 'd.primary' },
    })
    // FAIL-OPEN ohne primären Wert — sonst hinge der zweite an einem Feld,
    // das die Aufrufstelle vielleicht gar nicht mitgibt.
    expect(evaluateInvariants(session, 'creator')).toEqual({ ok: true })
  })

  it('f.decision: die Rangfolge darf nur Namen der Shortlist tragen', () => {
    const session = slotById('f.decision')!
    const facts = { 'f.shortlist': { value: '- Kolben\n- Nabe\n- Sattelfest' } }
    expect(evaluateInvariants(session, '- Kolben\n- Sattelfest\n- Nabe', facts)).toEqual({ ok: true })
    expect(evaluateInvariants(session, '- Kolben\n- Speiche', facts)).toEqual({
      ok: false,
      code: 'invariant_violated',
      invariant: { kind: 'subsetOf', of: 'f.shortlist' },
    })
  })

  it('c.final: drei bis fünf Werte sind in Ordnung', () => {
    const session = slotById('c.final')!
    expect(evaluateInvariants(session, '- Mut\n- Klarheit\n- Geduld')).toEqual({ ok: true })
    expect(evaluateInvariants(session, '- A\n- B\n- C\n- D\n- E')).toEqual({ ok: true })
  })

  it('c.final: zwei sind zu wenig, sechs zu viel', () => {
    const session = slotById('c.final')!
    expect(evaluateInvariants(session, '- Mut\n- Klarheit')).toEqual({
      ok: false,
      code: 'invariant_violated',
      invariant: { kind: 'count', min: 3, max: 5 },
    })
    expect(evaluateInvariants(session, '- A\n- B\n- C\n- D\n- E\n- F').ok).toBe(false)
  })

  it('e.anchorLine: ein Satz AUS dem Manifest gilt, ein erfundener nicht', () => {
    const session = slotById('e.anchorLine')!
    const source = facts({ 'e.manifesto': 'Wir bauen langsam.\nWir bleiben.\nUnd wir sagen nein.' })
    expect(evaluateInvariants(session, 'Wir bleiben.', source)).toEqual({ ok: true })
    // Nur Satzzeichen und Grossschreibung unterscheiden — das ist derselbe Satz.
    expect(evaluateInvariants(session, 'wir bleiben', source)).toEqual({ ok: true })
    expect(evaluateInvariants(session, 'Wir wachsen schnell.', source).ok).toBe(false)
  })

  it('e.anchorLine: OHNE Manifest wird nichts geprüft (fail-open)', () => {
    const session = slotById('e.anchorLine')!
    expect(evaluateInvariants(session, 'Irgendeine Zeile.', {})).toEqual({ ok: true })
    expect(evaluateInvariants(session, 'Irgendeine Zeile.', facts({ 'e.manifesto': '' }))).toEqual({ ok: true })
  })

  it('ein leerer Wert ist immer in Ordnung — leere Felder sperrt die Route', () => {
    expect(evaluateInvariants(slotById('c.final')!, '')).toEqual({ ok: true })
    expect(evaluateInvariants(slotById('c.final')!, undefined)).toEqual({ ok: true })
  })

  it('memberOf: der Wert muss ein Eintrag der Quelle sein', () => {
    const session = withInvariants('f.decision', [{ kind: 'memberOf', of: 'f.shortlist' }])
    const source = facts({ 'f.shortlist': '- Nordlicht\n- Kompass' })
    expect(evaluateInvariants(session, 'Kompass', source)).toEqual({ ok: true })
    expect(evaluateInvariants(session, 'Leuchtturm', source).ok).toBe(false)
  })

  it('subsetOf: jeder Eintrag muss in der Quelle vorkommen', () => {
    const session = withInvariants('f.shortlist', [{ kind: 'subsetOf', of: 'f.candidates' }])
    const source = facts({ 'f.candidates': '- Nordlicht\n- Kompass\n- Anker' })
    expect(evaluateInvariants(session, '- Anker\n- Kompass', source)).toEqual({ ok: true })
    expect(evaluateInvariants(session, '- Anker\n- Leuchtturm', source).ok).toBe(false)
  })

  it('mentionsNone: verbotene Begriffe schlagen zu, egal wie geschrieben', () => {
    const session = withInvariants('a.pitch', [{ kind: 'mentionsNone', terms: ['world-class'] }])
    expect(evaluateInvariants(session, 'Wir bauen Öfen.')).toEqual({ ok: true })
    expect(evaluateInvariants(session, 'Wir sind WORLD-CLASS.').ok).toBe(false)
  })

  it('der ERSTE Verstoss gewinnt — der Mensch repariert eine Sache, keine Liste', () => {
    const session = withInvariants('c.final', [
      { kind: 'count', min: 9 },
      { kind: 'mentionsNone', terms: ['Mut'] },
    ])
    expect(evaluateInvariants(session, '- Mut')).toMatchObject({ invariant: { kind: 'count', min: 9 } })
  })
})

/**
 * DIE SAMMEL-SESSION (BW2 Paket 3a) — welcher Teil ist dran?
 *
 * Die Rechnung ist der Grund, warum hier keine KI einordnen muss: die
 * Reihenfolge steht in der Registry, der Zwischenstand in der Zeile, und der
 * Text des Menschen gehört dem Teil, der GERADE gefragt wurde.
 */
describe('nextCollectPart', () => {
  const facts = slotById('a.facts')!

  it('geht die Teile in Registry-Reihenfolge durch', () => {
    expect(nextCollectPart(facts)).toBe('teamSize')
    expect(nextCollectPart(facts, { teamSize: '3 fest' })).toBe('age')
    expect(nextCollectPart(facts, { teamSize: '3 fest', age: '2021' })).toBe('markets')
  })

  it('`null` heisst „alle beantwortet" — dann entsteht der Wert', () => {
    expect(nextCollectPart(facts, { teamSize: '3 fest', age: '2021', markets: 'Landkreis' })).toBeNull()
  })

  it('LEERRAUM ist keine Antwort — sonst schöbe ein leerer Zug den Fortschritt vor', () => {
    expect(nextCollectPart(facts, { teamSize: '   ' })).toBe('teamSize')
  })

  it('eine Session OHNE Teile hat nie einen offenen — jede andere Arbeitsform', () => {
    expect(nextCollectPart(slotById('a.origin')!)).toBeNull()
  })

  it('unbekannte Schlüssel im Zwischenstand ändern nichts', () => {
    // Eine gelöschte Teil-Id in Bestandsdaten darf die Session nicht
    // fertigmelden — gelaufen wird über die REGISTRY, nicht über das Objekt.
    expect(nextCollectPart(facts, { erfunden: 'x' })).toBe('teamSize')
  })
})

describe('BRAND_SUBSTANCE_MIN_WORDS', () => {
  it('übersetzt die drei Stufen in Wortzahlen, aufsteigend', () => {
    expect(BRAND_SUBSTANCE_MIN_WORDS.short).toBe(12)
    expect(BRAND_SUBSTANCE_MIN_WORDS.medium).toBe(40)
    expect(BRAND_SUBSTANCE_MIN_WORDS.long).toBe(100)
  })

  it('JEDE Session der Registry findet ihre Zahl', () => {
    // Ohne diese Zeile fiele eine neue Stufe erst im Prompt auf — als `NaN`
    // mitten im Satz „shorter than roughly NaN words".
    for (const session of BRAND_SLOTS) {
      expect(BRAND_SUBSTANCE_MIN_WORDS[session.answers.minSubstance]).toBeGreaterThan(0)
    }
  })
})

/**
 * DIE KORREKTUR-REGEL (BW2 Paket 6, Plan §9) — die drei puren Rechnungen, an
 * denen der Impact-Hinweis, das 409 und die Eingrenzung hängen.
 *
 * ── WARUM DIE GEGENPROBEN HIER PFLICHT SIND ───────────────────────────────
 * Alle drei liefern im Normalfall „nichts zu tun": leere Hülle, kein Ack
 * nötig, alles wieder gestempelt. Ein Test, der nur den Normalfall prüft, ist
 * damit auch dann grün, wenn die Funktion GAR NICHTS tut — deshalb steht
 * neben jeder Zusage ihr Gegenteil.
 */
describe('confirmedDependents — was kostet diese Korrektur? (§9)', () => {
  const confirmed = (...ids: string[]): Record<string, BrandSlotStateFacts> =>
    Object.fromEntries(ids.map(id => [id, { hasValue: true, confirmed: true }]))

  it('zählt NUR bestätigte Abhängige — ohne Bestätigungen ist die Hülle leer', () => {
    // `a.customerPraise` berührt strukturell 55 Felder — 29 in der Foundation
    // (Anhang A) und seit Brand Design D0 die 26 dahinter. Am zweiten Tag
    // eines Brandings ist davon nichts bestätigt, und genau das soll der
    // Hinweis sagen: hier hängt (noch) nichts dran.
    expect(sessionsAffectedBy('a.customerPraise').transitive.length).toBe(55)
    expect(foundationHull('a.customerPraise').fields.length).toBe(29)
    expect(confirmedDependents('a.customerPraise', {}).count).toBe(0)
  })

  it('nimmt die bestätigten auf, in Registry-Reihenfolge und je Kapitel', () => {
    const impact = confirmedDependents('c.final', confirmed('c.definitions', 'e.statements'))
    expect(impact.transitive).toEqual(['c.definitions', 'e.statements'])
    expect(impact.count).toBe(2)
    expect(impact.byStep).toEqual({ values: ['c.definitions'], manifesto: ['e.statements'] })
  })

  it('trennt direkt und indirekt — `direct` ist die Teilmenge', () => {
    // `e.anchorLine` schöpft aus `e.manifesto`, das aus `e.statements`, das aus
    // `c.final`: über drei Ecken erreichbar, also INDIREKT. `c.definitions` und
    // `e.statements` nennen `c.final` dagegen selbst in ihren Eingaben.
    const impact = confirmedDependents('c.final', confirmed('c.definitions', 'e.statements', 'e.anchorLine'))
    expect(impact.direct).toEqual(['c.definitions', 'e.statements'])
    expect(impact.transitive).toContain('e.anchorLine')
    expect(impact.direct).not.toContain('e.anchorLine')
    expect(impact.direct.every(id => impact.transitive.includes(id))).toBe(true)
  })

  it('GEGENPROBE: eine erfundene Abhängigkeit vergrössert die Hülle', () => {
    const sessions = BRAND_SLOTS.map(session => (session.id === 'a.challenge'
      ? { ...session, inputs: { ...session.inputs, slots: ['c.final'] } }
      : session))
    const facts = confirmed('c.definitions', 'a.challenge')
    expect(confirmedDependents('c.final', facts).transitive).not.toContain('a.challenge')
    expect(confirmedDependents('c.final', facts, sessions).transitive).toContain('a.challenge')
  })

  it('ein Feld ganz unten berührt nichts — auch mit vollem Dokument', () => {
    const all = confirmed(...BRAND_SLOTS.map(session => session.id))
    expect(confirmedDependents('f.decision', all).count).toBe(0)
    expect(confirmedDependents('a.challenge', all).count).toBe(0)
  })
})

describe('correctionNeedsAck — braucht diese Korrektur eine Zustimmung?', () => {
  it('leere Hülle ⇒ kein Ack, sonst ⇒ Ack', () => {
    expect(correctionNeedsAck({ count: 0 })).toBe(false)
    expect(correctionNeedsAck({ count: 1 })).toBe(true)
    expect(correctionNeedsAck({ count: 14 })).toBe(true)
  })
})

describe('applyAffected — die Eingrenzung durch den Spezialisten (§9)', () => {
  const hull = ['c.definitions', 'c.livedExamples', 'e.statements']

  it('teilt die Hülle: getroffen bleibt veraltet, der Rest wird neu gestempelt', () => {
    expect(applyAffected(hull, ['c.livedExamples'])).toEqual({
      restamp: ['c.definitions', 'e.statements'],
      stale: ['c.livedExamples'],
    })
  })

  it('eine LEERE Liste ist eine Antwort — dann wird alles wieder grün', () => {
    expect(applyAffected(hull, [])).toEqual({ restamp: hull, stale: [] })
  })

  it('FAIL-CLOSED: ohne Antwort bleibt ALLES veraltet', () => {
    // Der Unterschied zur leeren Liste ist der ganze Punkt: „nachgesehen, es
    // trifft nichts" gegen „es hat niemand nachgesehen".
    expect(applyAffected(hull, undefined)).toEqual({ restamp: [], stale: hull })
  })

  it('Felder AUSSERHALB der Hülle werden verworfen — ein Modell darf sie nicht vergrössern', () => {
    expect(applyAffected(hull, ['c.livedExamples', 'a.pitch', 'erfunden'])).toEqual({
      restamp: ['c.definitions', 'e.statements'],
      stale: ['c.livedExamples'],
    })
  })
})

/**
 * DIE TOLERANTE LISTEN-LESUNG (Paket-6-Vorabklärung zum Paket-1-Befund (a)).
 *
 * Nachgemessen am 2026-09-05: `c.final` und `f.shortlist` haben den Editor
 * `chips`, den es in der Werkstatt nicht gibt — ihre Antwort läuft durch
 * `answerFromGeorge()` und landet als getippter Fliesstext im Slot. Im lokalen
 * Test-Branding steht wörtlich „Wir servieren nur Bohnen von Farmen, die wir
 * kennen." — ein Satz, eine Zeile, kein Strich. Eine Invariante, die daran
 * scheitert, hielte einen Menschen von seinem eigenen Feld fern.
 */
describe('brandListEntries — jede Schreibweise derselben Aufzählung (§3a Nr. 6)', () => {
  const three = ['Geduld', 'Unbestechlichkeit', 'Klarheit']

  it('Strich-Liste (die Form des Generators)', () => {
    expect(brandListEntries('- Geduld\n- Unbestechlichkeit\n- Klarheit')).toEqual(three)
  })

  it('Aufzählungszeichen und Nummern', () => {
    expect(brandListEntries('• Geduld\n• Unbestechlichkeit\n• Klarheit')).toEqual(three)
    expect(brandListEntries('1. Geduld\n2. Unbestechlichkeit\n3. Klarheit')).toEqual(three)
    expect(brandListEntries('1) Geduld\n2) Unbestechlichkeit\n3) Klarheit')).toEqual(three)
    expect(brandListEntries('* Geduld\n* Unbestechlichkeit\n* Klarheit')).toEqual(three)
  })

  it('blosse Zeilen, mit Leerzeilen dazwischen', () => {
    expect(brandListEntries('Geduld\n\nUnbestechlichkeit\n\nKlarheit')).toEqual(three)
    expect(brandListEntries('Geduld\r\nUnbestechlichkeit\r\nKlarheit')).toEqual(three)
  })

  it('EINE Zeile: Komma, Semikolon und „und" trennen ebenfalls', () => {
    expect(brandListEntries('Geduld, Unbestechlichkeit und Klarheit')).toEqual(three)
    expect(brandListEntries('Geduld; Unbestechlichkeit; Klarheit')).toEqual(three)
    expect(brandListEntries('Patience, incorruptibility and clarity'))
      .toEqual(['Patience', 'incorruptibility', 'clarity'])
  })

  it('eine Zeile OHNE Trenner bleibt EIN Eintrag', () => {
    expect(brandListEntries('Klarheit')).toEqual(['Klarheit'])
    expect(brandListEntries('Wir schliessen lieber früher als schlechten Kaffee auszuschenken'))
      .toEqual(['Wir schliessen lieber früher als schlechten Kaffee auszuschenken'])
    expect(brandListEntries('')).toEqual([])
  })

  it('ein EINZEILIGER Satz MIT Komma wird geschnitten — und das ist gewollt', () => {
    // Die Kehrseite der Toleranz, bewusst so: nur AUFZÄHLENDE Felder tragen
    // die Invarianten, die hier lesen (`c.final` zählt, `f.decision` prüft
    // Zugehörigkeit). Für ein Prosa-Feld läuft diese Rechnung nie — und wo
    // sie liefe, wäre „drei Werte in eine Zeile getippt" der häufigere Fall
    // als „ein Satz mit Komma".
    expect(brandListEntries('Wir servieren nur Bohnen von Farmen, die wir kennen.'))
      .toEqual(['Wir servieren nur Bohnen von Farmen', 'die wir kennen.'])
  })

  it('MEHRERE Zeilen werden NICHT noch einmal an Kommas geschnitten', () => {
    // Wer Zeilen schreibt, hat seine Einträge schon getrennt — ein Komma darin
    // gehört zum Eintrag. Sonst würden aus drei Werten sechs.
    expect(brandListEntries('- Klarheit, auch wenn es weh tut\n- Geduld, immer\n- Sorgfalt'))
      .toEqual(['Klarheit, auch wenn es weh tut', 'Geduld, immer', 'Sorgfalt'])
  })

  it('c.final `count 3–5` gilt in JEDER dieser Formen — die Sache zählt, nicht die Form', () => {
    const session = slotById('c.final')!
    for (const value of [
      '- Geduld\n- Unbestechlichkeit\n- Klarheit',
      '1. Geduld\n2. Unbestechlichkeit\n3. Klarheit',
      'Geduld, Unbestechlichkeit und Klarheit',
      'Geduld; Unbestechlichkeit; Klarheit',
    ]) {
      expect(evaluateInvariants(session, value)).toEqual({ ok: true })
    }
    // GEGENPROBE: zwei sind zwei, in jeder Schreibweise.
    for (const value of ['- Geduld\n- Klarheit', 'Geduld und Klarheit']) {
      expect(evaluateInvariants(session, value)).toEqual({
        ok: false,
        code: 'invariant_violated',
        invariant: { kind: 'count', min: 3, max: 5 },
      })
    }
  })
})
