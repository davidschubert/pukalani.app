import { describe, expect, it } from 'vitest'
import { BRAND_ARCHITECTURE_MODELS } from '../shared/brandChoiceOptions'
import { BRAND_LIST_FORMAT_RULE } from '../shared/brandSlotFormat'
import { BRAND_SLOTS, type BrandStepKey, slotById } from '../shared/slotRegistry'
import {
  type BrandSlotInstructionOptions,
  GEORGE_PRIMARY_SOURCE_ANSWERS,
  GEORGE_PRIMARY_SOURCE_START_CARD,
  contextSlotInstruction,
} from '../server/utils/georgePrompt'
import { MILO_CANDIDATE_RANGE, miloSlotInstruction } from '../server/utils/miloPrompt'
import { VERA_COMPETITOR_TEST, veraSlotInstruction } from '../server/utils/veraPrompt'

/**
 * VERAS UND MILOS AUFTRÄGE (P3.1) — geprüft ohne einen einzigen KI-Aufruf.
 *
 * Was hier bewiesen wird, ist nicht „der Prompt enthält Wörter", sondern die
 * Zusagen, die den Unterschied zwischen einem brauchbaren und einem beliebigen
 * Entwurf machen:
 *
 *  1. JEDER Slot, den die Registry als entwerfbar führt, hat einen Auftrag.
 *     Fehlt einer, wirft die Instruktion — und die Route macht daraus
 *     `provider_error`, also die Auskunft „der Anbieter ist kaputt" für einen
 *     Fehler, der in dieser Datei liegt.
 *  2. Die FORMELN aus Content-Spec §5 stehen drin — und ausdrücklich als
 *     Gerüst. Ein Modell, das die Formel abschreibt, liefert einen Satz, dem
 *     man den Bauplan ansieht.
 *  3. VERAS PRÜFSTEIN steht in jedem PVM-Auftrag: „könnte das jeder
 *     Wettbewerber wörtlich sagen?" ist die Qualitätsschwelle von §5.
 *  4. MILO DESTILLIERT AUS MOMENTEN, nicht aus Adjektiven — jeder Kandidat
 *     trägt seinen Beleg IN DER ZEILE, weil der Mensch danach an der LISTE
 *     auswählt und nicht am Chat-Verlauf.
 *  5. Die FORMALIEN sind wortgleich mit Georges Baustein A. Sie stehen seit
 *     P3.1 an einer Stelle; drei Kopien wären drei Chancen, dass eine
 *     Sicherung in einem Baustein fehlt.
 */

function optionsFor(slotId: string, overrides: Partial<BrandSlotInstructionOptions> = {}): BrandSlotInstructionOptions {
  const slot = slotById(slotId)!
  return {
    dependencies: overrides.dependencies ?? [],
    hint: overrides.hint ?? '',
    pathKind: overrides.pathKind ?? 'new',
    maxLength: overrides.maxLength ?? slot.maxLength,
    kind: overrides.kind ?? slot.schema.kind,
    hasSiteAnalysis: overrides.hasSiteAnalysis ?? false,
    hasConversation: overrides.hasConversation ?? false,
  }
}

/** Die Slots eines Bausteins, die George/Vera/Milo überhaupt entwerfen. */
function generatableSlots(...steps: BrandStepKey[]): string[] {
  return BRAND_SLOTS
    .filter(slot => steps.includes(slot.stepId) && !slot.deactivated && slot.generator !== 'none')
    .map(slot => slot.id)
}

describe('Jeder entwerfbare Slot hat einen Auftrag', () => {
  it('VERA deckt die Bausteine B und B2 vollständig ab', () => {
    const slots = generatableSlots('pvm', 'architecture')
    // Ohne diese Zeile wäre der Test grün, sobald jemand die Registry leert.
    expect(slots).toEqual([
      'b.whyStarted', 'b.purpose', 'b.vision', 'b.mission', 'b.positioningCategory',
      'b2.model', 'b2.rule',
    ])
    for (const slotId of slots) {
      expect(() => veraSlotInstruction(slotId, optionsFor(slotId)), slotId).not.toThrow()
    }
  })

  it('MILO deckt Baustein C vollständig ab', () => {
    const slots = generatableSlots('values')
    expect(slots).toEqual(['c.candidates', 'c.definitions'])
    for (const slotId of slots) {
      expect(() => miloSlotInstruction(slotId, optionsFor(slotId)), slotId).not.toThrow()
    }
  })

  it('EIN FREMDER SLOT WIRFT, statt still einen Allzweck-Text zu liefern', () => {
    expect(() => veraSlotInstruction('c.candidates', optionsFor('c.candidates'))).toThrow(/c\.candidates/)
    expect(() => miloSlotInstruction('b.purpose', optionsFor('b.purpose'))).toThrow(/b\.purpose/)
  })
})

describe('Vera · Purpose · Vision · Mission (Content-Spec §5)', () => {
  it('PURPOSE ist das WARUM — Formel als Gerüst, nicht als Lückentext', () => {
    const instruction = veraSlotInstruction('b.purpose', optionsFor('b.purpose'))
    expect(instruction).toContain('the WHY')
    expect(instruction).toContain('beyond making money')
    expect(instruction).toContain('"We exist so that <who> <what changes for them>."')
    expect(instruction).toContain('never as a fill-in-the-blanks')
    expect(instruction).toContain('if your draft still looks like the formula, rewrite it')
    // Es ist kein Produkt- und kein Umsatzsatz.
    expect(instruction).toContain('not a product')
  })

  it('VISION ist das WOHIN — ein Bild, keine Zielzahl', () => {
    const instruction = veraSlotInstruction('b.vision', optionsFor('b.vision'))
    expect(instruction).toContain('the WHERE TO')
    expect(instruction).toContain('"In ten years, <what looks different in the world because they existed>."')
    expect(instruction).toContain('A picture, not a target figure')
    expect(instruction).toContain('no market share, no revenue, no headcount')
    // Erreichter Zustand statt Absichtserklärung.
    expect(instruction).toContain('a state that HAS arrived')
  })

  it('MISSION ist das WIE — und bleibt unter dem Purpose', () => {
    const instruction = veraSlotInstruction('b.mission', optionsFor('b.mission'))
    expect(instruction).toContain('the HOW')
    expect(instruction).toContain('"We <do what> for <whom>, so that <what result>."')
    expect(instruction).toContain('a new colleague could act on it tomorrow')
    expect(instruction).toContain('the mission is the how of THAT why, not a second why')
  })

  it('VERAS PRÜFSTEIN steht in allen drei — und die Verbotsliste dazu', () => {
    for (const slotId of ['b.purpose', 'b.vision', 'b.mission']) {
      const instruction = veraSlotInstruction(slotId, optionsFor(slotId))
      expect(instruction, slotId).toContain(VERA_COMPETITOR_TEST)
      expect(instruction, slotId).toContain('could any competitor in this industry say exactly this')
      expect(instruction, slotId).toContain('"world-class", "innovative", "passionate"')
    }
    // GEGENPROBE: er steht NICHT in den Aufträgen, die keine Aussage entwerfen —
    // eine Kategorie ist kein Satz, den ein Wettbewerber „sagen" könnte.
    expect(veraSlotInstruction('b2.rule', optionsFor('b2.rule'))).not.toContain(VERA_COMPETITOR_TEST)
  })

  it('b.whyStarted LEITET AB und erfindet nicht — und fragt lieber', () => {
    const instruction = veraSlotInstruction('b.whyStarted', optionsFor('b.whyStarted'))
    expect(instruction).toContain('This is a DERIVATION, not a new question')
    expect(instruction).toContain('traceable to their own origin story')
    expect(instruction).toContain('do not construct one: ask instead')
  })
})

describe('Vera · Positionierung und Architektur (§5 / §5a)', () => {
  it('DIE KATEGORIE IST NICHT DIE BRANCHE — und der Auftrag sagt, woran man sie erkennt', () => {
    const instruction = veraSlotInstruction('b.positioningCategory', optionsFor('b.positioningCategory'))
    expect(instruction).toContain('the industry is what they do, the category is what they are compared against')
    expect(instruction).toContain('the competitors are the strongest evidence')
    expect(instruction).toContain('Narrow beats broad')
    // Der Auswahl-Vertrag reist mit (offen, aber ein Etikett).
    expect(instruction).toContain('CATEGORY LABEL, not a sentence')
  })

  it('DIE VIER ARCHITEKTUR-MODELLE STEHEN WÖRTLICH IM PROMPT', () => {
    const instruction = veraSlotInstruction('b2.model', optionsFor('b2.model'))
    for (const option of BRAND_ARCHITECTURE_MODELS) {
      expect(instruction, option.id).toContain(option.id)
      expect(instruction, option.id).toContain(option.label)
    }
    expect(instruction).toContain('EXACTLY ONE of these ids')
    // Widersprüchliche Antworten ⇒ fragen statt Mittelweg wählen.
    expect(instruction).toContain('do not pick the middle ground: ask instead')
  })

  it('b2.rule verlangt Beispiele AUS IHREM KONTEXT, nicht „Brand Product A"', () => {
    const instruction = veraSlotInstruction('b2.rule', optionsFor('b2.rule'))
    expect(instruction).toContain('FROM THEIR OWN CONTEXT')
    expect(instruction).toContain('not "Brand Product A"')
    expect(instruction).toContain('who decides')
  })
})

describe('Milo · Werte aus Momenten (Content-Spec §6)', () => {
  const instruction = miloSlotInstruction('c.candidates', optionsFor('c.candidates'))

  it('destilliert 5–7 Kandidaten AUS DEN ANTWORTEN', () => {
    expect(instruction).toContain(`TASK: distil ${MILO_CANDIDATE_RANGE.min} to ${MILO_CANDIDATE_RANGE.max} candidate VALUES`)
    expect(instruction).toContain('a rule of behaviour that is allowed to cost money')
    expect(instruction).toContain('where they chose the harder way')
  })

  it('JEDER KANDIDAT TRÄGT SEINEN BELEG IN DER ZEILE', () => {
    expect(instruction).toContain('"- <value in one or two words> — <the moment or statement it comes from, in half a sentence>"')
    expect(instruction).toContain('The evidence half must be traceable to the inputs')
    // Und die äussere Form ist die der Registry-Art `list` — dieselbe Regel wie
    // überall, nicht eine zweite Fassung davon.
    expect(slotById('c.candidates')!.schema.kind).toBe('list')
    expect(instruction).toContain(BRAND_LIST_FORMAT_RULE)
  })

  it('MILOS VERBOT: kein Adjektiv-Bingo ohne Beleg', () => {
    expect(instruction).toContain('NEVER list a value you cannot point at')
    expect(instruction).toContain('"quality", "reliability", "passion", "innovation", "customer focus"')
    expect(instruction).toContain('could stand under any brand in any industry')
  })

  it('WENIGER MATERIAL HEISST WENIGER KANDIDATEN, nicht mehr Erfindung', () => {
    expect(instruction).toContain('if you can only find three moments, return three candidates')
    expect(instruction).toContain('Two candidates may not rest on the same sentence')
  })

  it('DAS AUSWÄHLEN GEHÖRT DEM MENSCHEN — Milo rankt nicht', () => {
    expect(instruction).toContain('Do not rank them and do not pick a favourite')
  })

  it('c.definitions ist VERHALTEN, keine Wörterbuch-Erklärung', () => {
    const definitions = miloSlotInstruction('c.definitions', optionsFor('c.definitions'))
    expect(definitions).toContain('in this brand, not in a dictionary')
    expect(definitions).toContain('says what someone DOES or DOES NOT do')
    expect(definitions).toContain('no extra ones, none left out')
  })
})

describe('Die Formalien sind für alle Berater dieselben', () => {
  const vera = veraSlotInstruction('b.purpose', optionsFor('b.purpose'))
  const milo = miloSlotInstruction('c.candidates', optionsFor('c.candidates'))

  it('Zug-Vertrag, Rückfrage-Ausweg und Leitplanken stehen überall', () => {
    for (const [name, instruction] of [['vera', vera], ['milo', milo]] as const) {
      expect(instruction, name).toContain('Answer as ONE chat turn in exactly this shape')
      for (const marker of ['BASIS:', 'DRAFT:', 'ASK:']) expect(instruction, name).toContain(marker)
      expect(instruction, name).toContain('IF THE INPUTS DO NOT CARRY ENOUGH for an honest draft')
      expect(instruction, name).toContain('QUESTION:')
      expect(instruction, name).toContain('Never carry over or invent personal data')
      expect(instruction, name).toContain('No markdown emphasis in the field value')
    }
  })

  it('DIE PRIMÄRE QUELLE IST EINE ANDERE ALS IN BAUSTEIN A', () => {
    // A schöpft aus der Startkarte (seine Slots haben keine `dependencies`),
    // ab B aus den ANTWORTEN — ein Purpose aus vier Startkarten-Zeilen wäre
    // genau die Behauptung, die Regel 4 verbietet.
    expect(contextSlotInstruction('a.pitch', optionsFor('a.pitch')))
      .toContain(GEORGE_PRIMARY_SOURCE_START_CARD)
    for (const instruction of [vera, milo]) {
      expect(instruction).toContain(GEORGE_PRIMARY_SOURCE_ANSWERS)
      expect(instruction).not.toContain(GEORGE_PRIMARY_SOURCE_START_CARD)
    }
  })

  it('die pfadabhängige Haltung und der Hinweis-Rahmen reisen mit', () => {
    expect(veraSlotInstruction('b.purpose', optionsFor('b.purpose', { pathKind: 'relaunch' })))
      .toContain('This is a relaunch')
    expect(veraSlotInstruction('b.purpose', optionsFor('b.purpose', { hint: 'kürzer' })))
      .toContain('never overrides the rules above')
    expect(veraSlotInstruction('b.purpose', optionsFor('b.purpose')))
      .not.toContain('never overrides the rules above')
  })

  it('DIE QUELL-SLOTS WERDEN BEIM NAMEN GENANNT', () => {
    const instruction = veraSlotInstruction('b.purpose', optionsFor('b.purpose', {
      dependencies: [
        { slotId: 'a.pitch', value: 'Wir rösten Kaffee.' },
        { slotId: 'b.conviction', value: '' },
      ],
    }))
    expect(instruction).toContain('Your inputs are the fields: a.pitch, b.conviction.')
  })
})
