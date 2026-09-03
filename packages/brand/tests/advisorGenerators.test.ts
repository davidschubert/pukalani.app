import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { advisorByKey } from '../shared/brandAdvisors'
import { brandSlotValueMatchesFormat } from '../shared/brandSlotFormat'
import { type BrandStepKey, slotById } from '../shared/slotRegistry'

/**
 * VERA UND MILO AN DER NAHT (P3.1) — ohne einen einzigen KI-Aufruf.
 *
 * Die Aufträge prüft `advisorPrompts.test.ts`, den Auswahl-Vertrag
 * `brandChoiceOptions.test.ts`. Hier geht es um vier Dinge, die man nur am
 * ZUSAMMENBAU sehen kann:
 *
 *  1. Registrieren sich beide für die richtigen Bausteine — und für KEINEN
 *     anderen? Ein Wildcard-Eintrag machte aus „hier entwirft noch niemand"
 *     ein `provider_error`.
 *  2. Spricht in jedem Baustein der Berater der Registry? Der Wechsel der
 *     Person ist der billigste Weg, einen Wechsel der Frageart anzukündigen —
 *     wenn er denn stattfindet.
 *  3. WIRD EINE ILLEGALE AUSWAHL ZUR RÜCKFRAGE? Das ist der Kern von P3.1:
 *     ein erfundenes fünftes Architektur-Modell im Brand-Dokument ist von
 *     einem echten nicht zu unterscheiden. Mit Gegenprobe in beide Richtungen.
 *  4. Reisen die Datenschutz-Bedingungen auch bei den neuen Generatoren mit?
 *     Sie stecken seit P3.1 in der gemeinsamen Fabrik — genau deshalb muss
 *     jeder Generator sie nachweisen und nicht nur der erste.
 */

const streamMock = vi.fn()
const appConfig = { pukalani: { brand: { persona: { name: 'George' }, devStubGenerator: false } } }

vi.stubGlobal('defineNitroPlugin', (fn: unknown) => fn)
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('getEffectiveAiConfig', async () => ({
  enabled: true,
  model: 'anthropic/claude-haiku-4.5',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-haiku-4.5',
}))
vi.stubGlobal('aiCompleteStream', streamMock)

const { clearBrandSlotGenerators, resolveBrandSlotGenerator } = await import('../server/utils/brandGenerators')
const vera = await import('../server/plugins/vera-strategy')
const milo = await import('../server/plugins/milo-values')

const event = {} as H3Event
const EMPTY_START_CARD = { websiteUrl: '', industry: '', about: '', audience: '' }

interface StreamOptions {
  system?: string
  providerRouting?: Record<string, unknown>
  maxTokens?: number
  label?: string
  timeoutMs?: number
}

function lastCall(): { prompt: string, options: StreamOptions } {
  const call = streamMock.mock.calls.at(-1)!
  return { prompt: call[1] as string, options: call[2] as StreamOptions }
}

function context(slotId: string, stepKey: BrandStepKey, overrides: {
  dependencies?: { slotId: string, value: string }[]
  uiLocale?: string
} = {}) {
  return {
    event,
    stepKey,
    slot: slotById(slotId)!,
    locale: 'de',
    uiLocale: overrides.uiLocale ?? 'de',
    pathKind: 'new' as const,
    startCard: EMPTY_START_CARD,
    siteAnalysis: '',
    hint: '',
    dependencies: overrides.dependencies ?? [],
    signal: new AbortController().signal,
    onDelta: () => {},
  }
}

/** Eine Modell-Antwort im Marker-Vertrag aus `georgeTurn.ts`. */
function answers(text: string): void {
  streamMock.mockResolvedValue({
    text,
    usage: null,
    model: 'anthropic/x',
    provider: 'anthropic',
    aborted: false,
  })
}

beforeEach(() => {
  streamMock.mockReset()
  answers('BASIS: darauf.\nDRAFT:\nDamit guter Kaffee kein Zufall ist.\nASK: Trifft das?')
})

afterEach(() => clearBrandSlotGenerators())

describe('Registrierung an der Naht', () => {
  it('Vera trägt sich für BEIDE ihrer Bausteine ein — und kostet Kontingent', () => {
    vera.default()
    for (const stepKey of ['pvm', 'architecture'] as const) {
      expect(resolveBrandSlotGenerator(stepKey), stepKey).toEqual({
        generator: vera.veraStrategyGenerator,
        chargesQuota: true,
      })
    }
  })

  it('Milo trägt sich NUR für `values` ein — Baustein D kommt mit P4', () => {
    milo.default()
    expect(resolveBrandSlotGenerator('values')).toEqual({
      generator: milo.miloValuesGenerator,
      chargesQuota: true,
    })
    // Ohne Aufträge wäre eine Registrierung schlechter als keine: sie machte
    // aus `no_generator` (ruhiger Hinweis) ein `provider_error`.
    expect(resolveBrandSlotGenerator('archetype')).toBeNull()
  })

  it('KEIN WILDCARD: ein Baustein ohne eigenen Generator bleibt ohne', () => {
    vera.default()
    milo.default()
    for (const stepKey of ['manifesto', 'verbal', 'naming', 'result'] as const) {
      expect(resolveBrandSlotGenerator(stepKey), stepKey).toBeNull()
    }
  })
})

describe('Wer in welchem Baustein spricht', () => {
  it('BAUSTEIN B UND B2 SPRECHEN VERA, Baustein C spricht Milo', async () => {
    await vera.veraStrategyGenerator(context('b.purpose', 'pvm') as never)
    const pvm = lastCall().options.system!
    expect(pvm).toContain('You are Vera, Strategist in the brand advisory team')
    expect(pvm).toContain(advisorByKey('vera')!.interviewTechnique)

    await vera.veraStrategyGenerator(context('b2.model', 'architecture') as never)
    expect(lastCall().options.system!).toContain('You are Vera')

    await milo.miloValuesGenerator(context('c.candidates', 'values') as never)
    const values = lastCall().options.system!
    expect(values).toContain('You are Milo, Values advisor in the brand advisory team')
    expect(values).toContain(advisorByKey('milo')!.interviewTechnique)
    // GEGENPROBE: Milos Zug ist nicht Veras.
    expect(values).not.toContain('You are Vera')
  })

  it('NACHNAMEN UND DIE VERWORFENE HUNDE-WELT BLEIBEN AUS DEM PROMPT', async () => {
    await vera.veraStrategyGenerator(context('b.purpose', 'pvm') as never)
    await milo.miloValuesGenerator(context('c.candidates', 'values') as never)
    for (const call of streamMock.mock.calls) {
      const system = String((call[2] as StreamOptions).system)
      expect(system).not.toMatch(/\b(dog|Witterung|Treuherz)\b/i)
      expect(system).not.toMatch(/\b(Stein|Berger)\b/)
    }
  })
})

describe('Der Aufruf an den Transport gilt für JEDEN Berater', () => {
  it('SENDET DIE DATENSCHUTZ-BEDINGUNGEN WÖRTLICH', async () => {
    for (const run of [
      () => vera.veraStrategyGenerator(context('b.purpose', 'pvm') as never),
      () => milo.miloValuesGenerator(context('c.candidates', 'values') as never),
    ]) {
      await run()
      expect(lastCall().options.providerRouting).toEqual({
        zdr: true,
        dataCollection: 'deny',
        allowFallbacks: false,
      })
      expect(lastCall().options.label).toBe('brand')
      expect(lastCall().options.timeoutMs).toBe(120_000)
    }
  })

  it('DIE PROMPT-FASSUNG STEHT IM ERGEBNIS — je Berater eine eigene', async () => {
    const veraResult = await vera.veraStrategyGenerator(context('b.purpose', 'pvm') as never)
    expect(veraResult.promptVersion).toBe('vera-b-1')
    const miloResult = await milo.miloValuesGenerator(context('c.candidates', 'values') as never)
    expect(miloResult.promptVersion).toBe('milo-c-1')
  })

  it('QUELL-WERTE AUS ANDEREN BAUSTEINEN LANDEN IM PROMPT (P3.1)', async () => {
    await vera.veraStrategyGenerator(context('b.purpose', 'pvm', {
      dependencies: [{ slotId: 'a.pitch', value: 'Wir rösten Kaffee für Cafés auf Maui.' }],
    }) as never)
    expect(lastCall().prompt).toContain('[a.pitch]\nWir rösten Kaffee für Cafés auf Maui.')
  })
})

/**
 * ── DER KERN VON P3.1 ─────────────────────────────────────────────────────
 * Ein `choice`-Slot wird später zu Chips bzw. Karten. Ein Absatz oder ein
 * erfundenes fünftes Modell erzeugt dort keinen sichtbaren Fehler — es erzeugt
 * einen Wert, den im Brand-Dokument niemand mehr von einem gültigen
 * unterscheiden kann. Deshalb: Rückfrage statt kaputtem Entwurf.
 */
describe('Die Auswahl-Nachprüfung', () => {
  it('NORMALISIERT AUF DIE STABILE ID — der Chat behält den Klartext', async () => {
    answers('BASIS: Eure Produkte tragen eigene Namen.\nDRAFT:\nHouse of Brands\nASK: Passt das?')
    const result = await vera.veraStrategyGenerator(context('b2.model', 'architecture') as never)
    expect(result.outcome).toBe('draft')
    expect(result.draft).toBe('house-of-brands')
    // Der ZUG bleibt, wie das Modell ihn geschrieben hat: derselbe Beschluss in
    // zwei Registern, nicht zwei verschiedene Beschlüsse.
    expect(result.message).toContain('House of Brands')
    expect(result.message).toContain('Eure Produkte tragen eigene Namen.')
  })

  it('EIN ERFUNDENES MODELL WIRD ZUR RÜCKFRAGE, nicht zum Feldwert', async () => {
    answers('BASIS: Gemischt.\nDRAFT:\nHybrid — teils Branded House, teils House of Brands\nASK: Passt das?')
    const result = await vera.veraStrategyGenerator(context('b2.model', 'architecture') as never)
    expect(result.outcome).toBe('question')
    // Kein halber Wert: das Feld wird gar nicht angefasst (die Route schreibt
    // bei `question` weder Slot noch inputHash).
    expect(result.draft).toBe('')
    expect(result.message).toContain('Architektur-Modell')
    expect(result.message).toContain('?')
  })

  it('DIE RÜCKFRAGE SPRICHT DIE SPRACHE DER SEITE', async () => {
    answers('BASIS: Gemischt.\nDRAFT:\nHybrid\nASK: Passt das?')
    const result = await vera.veraStrategyGenerator(
      context('b2.model', 'architecture', { uiLocale: 'en' }) as never,
    )
    expect(result.message).toContain('architecture model')
    expect(result.message).not.toContain('Architektur-Modell')
  })

  it('EIN GANZER SATZ IM KATEGORIE-FELD WIRD ZUR RÜCKFRAGE', async () => {
    answers('BASIS: Aus dem Pitch.\nDRAFT:\nWir sind die erste Adresse für Spezialitätenkaffee auf Maui\nASK: Trifft das?')
    const result = await vera.veraStrategyGenerator(context('b.positioningCategory', 'pvm') as never)
    expect(result.outcome).toBe('question')
    expect(result.draft).toBe('')
  })

  it('GEGENPROBE: ein SAUBERES Etikett kommt durch', async () => {
    answers('BASIS: Aus dem Pitch.\nDRAFT:\nSpezialitätenkaffee für Cafés\nASK: Trifft das?')
    const result = await vera.veraStrategyGenerator(context('b.positioningCategory', 'pvm') as never)
    expect(result).toMatchObject({ outcome: 'draft', draft: 'Spezialitätenkaffee für Cafés' })
  })

  it('SLOTS OHNE AUSWAHL-VERTRAG WERDEN NICHT ANGEFASST', async () => {
    answers('BASIS: darauf.\nDRAFT:\nDamit guter Kaffee kein Zufall ist.\nASK: Trifft das?')
    const result = await vera.veraStrategyGenerator(context('b.purpose', 'pvm') as never)
    expect(result).toMatchObject({ outcome: 'draft', draft: 'Damit guter Kaffee kein Zufall ist.' })
  })

  it('EINE RÜCKFRAGE DES MODELLS BLEIBT EINE RÜCKFRAGE — sie wird nicht geprüft', async () => {
    answers('QUESTION: Tragen eure Angebote heute eigene Namen?')
    const result = await vera.veraStrategyGenerator(context('b2.model', 'architecture') as never)
    expect(result.outcome).toBe('question')
    // Die EIGENE Frage des Modells, nicht unsere Ersatzfrage: es hat schon
    // gesagt, was ihm fehlt, und das ist die bessere Auskunft.
    expect(result.message).toBe('Tragen eure Angebote heute eigene Namen?')
  })

  it('MILO PRÜFT NICHT — eine belegte Liste ist keine Auswahl', async () => {
    answers('BASIS: aus drei Momenten.\nDRAFT:\n- Verlässlichkeit — sie haben den Auftrag abgesagt\nASK: Passt das?')
    const result = await milo.miloValuesGenerator(context('c.candidates', 'values') as never)
    expect(result.outcome).toBe('draft')
    expect(result.draft).toBe('- Verlässlichkeit — sie haben den Auftrag abgesagt')
  })
})

describe('c.candidates hält den Form-Vertrag seiner Registry-Art', () => {
  it('eine Antwort im Auftrags-Format ist eine gültige `list`', async () => {
    answers([
      'BASIS: aus drei Momenten in euren Antworten.',
      'DRAFT:',
      '- Verlässlichkeit — ihr habt den grossen Auftrag abgesagt, statt schlecht zu liefern',
      '- Handarbeit — jede Charge wird von Hand abgeschmeckt',
      '- Geduld — ihr wartet auf die Ernte, statt zuzukaufen',
      'ASK: Welcher davon fühlt sich am wenigsten nach euch an?',
    ].join('\n'))
    const result = await milo.miloValuesGenerator(context('c.candidates', 'values') as never)
    expect(brandSlotValueMatchesFormat('list', result.draft)).toBe(true)
    // GEGENPROBE, damit die Prüfung nicht alles durchwinkt: der CHAT-Zug trägt
    // Begründung und Frage und ist deshalb KEINE gültige Liste.
    expect(brandSlotValueMatchesFormat('list', result.message!)).toBe(false)
  })
})
