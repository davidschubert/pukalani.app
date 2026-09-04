import { describe, expect, it } from 'vitest'
import {
  BRAND_SOURCES_HASH_SCOPE,
  BRAND_SUBSTANCE_MIN_WORDS,
  computeSourcesHash,
  evaluateInvariants,
  nextCollectPart,
  sessionsAffectedBy,
} from '../shared/brandSessions'
import {
  BRAND_SLOTS,
  type BrandSessionConfig,
  type BrandSlotStateFacts,
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
 */

/** id → [Felder in der Hülle, Kapitel darin]. Anhang A des Plans. */
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

describe('sessionsAffectedBy — die Umkehrung der Abhängigkeiten (§9)', () => {
  it('kennt jede Session der Registry und keine mehr', () => {
    expect(Object.keys(AFFECTED)).toEqual(BRAND_SLOTS.map(session => session.id))
  })

  it.each(Object.entries(AFFECTED))('%s berührt die zugesagte Menge', (sessionId, [fields, chapters]) => {
    const affected = sessionsAffectedBy(sessionId)
    expect(affected.transitive.length, 'Felder').toBe(fields)
    expect(Object.keys(affected.byStep).length, 'Kapitel').toBe(chapters)
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
    expect(Object.keys(affected.byStep).sort()).toEqual(
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
    expect(after.transitive).toEqual(['result.direction'])
    expect(after.byStep).toEqual({ result: ['result.direction'] })
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

  it('registriert in der echten Registry genau die sicheren drei', () => {
    // `f.decision` kam mit Paket 2 dazu, nachdem die WERT-FORM entschieden war
    // („top three, in order" = eine Liste, jede Zeile ein Name aus der
    // Shortlist — Paket-1-Befund (b)). `f.shortlist subsetOf f.candidates`
    // wurde BEWUSST nicht registriert: eine Kandidaten-Zeile trägt laut
    // Content-Spec §10 den Namenstyp mit, die Zeilen können also nie gleich
    // sein — die Invariante hätte jedes Bestätigen mit 409 abgewiesen.
    const registered = BRAND_SLOTS
      .filter(session => session.invariants.length > 0)
      .map(session => [session.id, session.invariants] as const)
    expect(registered).toEqual([
      ['c.final', [{ kind: 'count', min: 3, max: 5 }]],
      ['e.anchorLine', [{ kind: 'sentenceOf', of: 'e.manifesto' }]],
      ['f.decision', [{ kind: 'subsetOf', of: 'f.shortlist' }]],
    ])
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
