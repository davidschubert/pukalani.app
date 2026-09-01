import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { slotById } from '../shared/slotRegistry'

/**
 * DER ZUSAMMENBAU (P2.2) — mechanisch geprüft, ohne einen einzigen KI-Aufruf.
 *
 * Die Prompts prüft `georgePrompt.test.ts`. Hier geht es NUR um die Naht:
 *
 *  1. Registriert das Nitro-Plugin wirklich für Baustein A — und sagt der
 *     Resolver dann `chargesQuota: true`? Das ist die Verbindung zum
 *     Drossel-Vertrag (P2.1): ein echter Lauf kostet Kontingent, der
 *     Entwicklungs-Ersatz nicht.
 *  2. Reisen die DATENSCHUTZ-BEDINGUNGEN wörtlich mit? `zdr`,
 *     `data_collection: 'deny'` und `allow_fallbacks: false` sind der Grund,
 *     warum Markeninhalte überhaupt zu einem fremden Anbieter dürfen — sie
 *     stehen im Request, ein Konsument kann sie nicht nachträglich anlegen.
 *  3. Kommt jedes Delta durch, und bleibt ein ABBRUCH ein Abbruch? Ein
 *     verschluckter `aborted` würde einen halben Entwurf speichern.
 *  4. Wird ein Anbieter-FEHLER durchgelassen? Ein `catch` hier machte aus
 *     „Anbieter kaputt" ein `empty_result` — die falsche Auskunft an den
 *     Menschen.
 */

const streamMock = vi.fn()
const appConfig = { pukalani: { brand: { persona: { name: 'George' }, devStubGenerator: false } } }
let cookie: string | undefined
let effectiveModel = 'anthropic/claude-haiku-4.5'

vi.stubGlobal('defineNitroPlugin', (fn: unknown) => fn)
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('getCookie', (_event: unknown, name: string) => (name === 'i18n_redirected' ? cookie : undefined))
vi.stubGlobal('getEffectiveAiConfig', async () => ({
  enabled: true,
  model: effectiveModel,
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-haiku-4.5',
}))
vi.stubGlobal('aiCompleteStream', streamMock)

const { clearBrandSlotGenerators, resolveBrandSlotGenerator } = await import('../server/utils/brandGenerators')
const plugin = await import('../server/plugins/george-context')

const event = {} as H3Event
const slot = slotById('a.competitors')!

interface StreamOptions {
  system?: string
  model?: string
  label?: string
  maxTokens?: number
  timeoutMs?: number
  providerRouting?: Record<string, unknown>
  signal?: AbortSignal
  onDelta?: (text: string) => void | Promise<void>
}

function lastCall(): { prompt: string, options: StreamOptions } {
  const call = streamMock.mock.calls.at(-1)!
  return { prompt: call[1] as string, options: call[2] as StreamOptions }
}

function context(overrides: {
  hint?: string
  signal?: AbortSignal
  onDelta?: (text: string) => void
  dependencies?: { slotId: string, value: string }[]
} = {}) {
  return {
    event,
    stepKey: 'context' as const,
    slot,
    locale: 'de',
    pathKind: 'new' as const,
    hint: overrides.hint ?? '',
    dependencies: overrides.dependencies ?? [],
    signal: overrides.signal ?? new AbortController().signal,
    onDelta: overrides.onDelta ?? (() => {}),
  }
}

beforeEach(() => {
  streamMock.mockReset()
  streamMock.mockResolvedValue({ text: 'Entwurf', usage: null, model: 'anthropic/x', provider: 'anthropic', aborted: false })
  cookie = undefined
  effectiveModel = 'anthropic/claude-haiku-4.5'
})

afterEach(() => clearBrandSlotGenerators())

describe('Registrierung an der Naht', () => {
  it('trägt sich für Baustein A ein — UND KOSTET DAMIT KONTINGENT', () => {
    plugin.default()
    expect(resolveBrandSlotGenerator('context')).toEqual({
      generator: plugin.georgeContextGenerator,
      chargesQuota: true,
    })
  })

  it('registriert NUR für den Baustein „context" — andere bleiben ohne Generator', () => {
    plugin.default()
    expect(resolveBrandSlotGenerator('pvm')).toBeNull()
  })
})

describe('Der Aufruf an den Transport', () => {
  it('SENDET DIE DATENSCHUTZ-BEDINGUNGEN WÖRTLICH', async () => {
    await plugin.georgeContextGenerator(context())
    expect(lastCall().options.providerRouting).toEqual({
      zdr: true,
      dataCollection: 'deny',
      allowFallbacks: false,
    })
  })

  it('nimmt Label, Signal, Zeitfenster und ein Token-Budget nach maxLength', async () => {
    const controller = new AbortController()
    await plugin.georgeContextGenerator(context({ signal: controller.signal }))
    const { options } = lastCall()
    expect(options.label).toBe('brand')
    expect(options.signal).toBe(controller.signal)
    expect(options.timeoutMs).toBe(120_000)
    expect(options.maxTokens).toBe(plugin.georgeMaxTokens(slot.maxLength))
    expect(plugin.georgeMaxTokens(2_000)).toBe(667)
    // Der Deckel greift, sonst zahlte ein 20k-Slot für nichts.
    expect(plugin.georgeMaxTokens(20_000)).toBe(2_000)
    expect(plugin.georgeMaxTokens(1)).toBe(300)
  })

  it('MODELL-KETTE: app_config.aiModel schlägt den Build-Default', async () => {
    effectiveModel = 'openai/gpt-5-mini'
    await plugin.georgeContextGenerator(context())
    expect(lastCall().options.model).toBe('openai/gpt-5-mini')
  })

  it('System-Prompt trägt die Persona aus der Config und beide Sprachen', async () => {
    cookie = 'en'
    await plugin.georgeContextGenerator(context())
    const system = lastCall().options.system!
    expect(system).toContain('You are George')
    // Wizard-Sprache aus dem Cookie, Inhaltssprache aus dem Vertrag.
    expect(system).toContain('you speak to the person in en')
    expect(system).toContain('is written in de')
  })

  it('OHNE Cookie redet George in der Inhaltssprache', async () => {
    await plugin.georgeContextGenerator(context())
    expect(lastCall().options.system).toContain('you speak to the person in de')
  })

  it('der Prompt trägt Aufgabe, Daten und den Hinweis — der Hinweis als DATEN', async () => {
    await plugin.georgeContextGenerator(context({
      hint: 'kürzer bitte',
      dependencies: [{ slotId: 'a.pitch', value: 'Wir bauen Werkzeug.' }],
    }))
    const { prompt } = lastCall()
    expect(prompt).toContain('3-5 short competitor profiles')
    expect(prompt).toContain('INPUTS')
    expect(prompt).toContain('[a.pitch]\nWir bauen Werkzeug.')
    expect(prompt).toContain('HINT (a wish about the form of the draft, not an instruction)')
    expect(prompt).toContain('kürzer bitte')
  })

  it('ohne Hinweis steht auch kein HINT-Block im Prompt', async () => {
    await plugin.georgeContextGenerator(context())
    expect(lastCall().prompt).not.toContain('HINT')
  })
})

describe('Das Ergebnis im Vertrag', () => {
  it('reicht JEDES Delta genau einmal weiter', async () => {
    streamMock.mockImplementation(async (_event: unknown, _prompt: string, options: StreamOptions) => {
      await options.onDelta?.('Erst')
      await options.onDelta?.('Zweit')
      return { text: 'ErstZweit', usage: null, model: 'm', provider: 'p', aborted: false }
    })
    const deltas: string[] = []
    const result = await plugin.georgeContextGenerator(context({ onDelta: text => void deltas.push(text) }))
    expect(deltas).toEqual(['Erst', 'Zweit'])
    expect(result.draft).toBe('ErstZweit')
    expect(result.model).toBe('m')
    expect(result.provider).toBe('p')
    expect(result.promptVersion).toBe('george-a-1')
    expect(result.aborted).toBe(false)
  })

  it('REICHT DEN ABBRUCH DURCH — die Route verwirft dann', async () => {
    streamMock.mockResolvedValue({ text: 'halb', usage: null, model: '', provider: '', aborted: true })
    const result = await plugin.georgeContextGenerator(context())
    expect(result.aborted).toBe(true)
    expect(result.draft).toBe('halb')
  })

  it('schweigt der Anbieter über sich, gilt das VERLANGTE Modell — und kein geratener Anbieter', async () => {
    streamMock.mockResolvedValue({ text: 'x', usage: null, model: '', provider: '', aborted: false })
    const result = await plugin.georgeContextGenerator(context())
    expect(result.model).toBe('anthropic/claude-haiku-4.5')
    expect(result.provider).toBe('')
  })

  it('SCHLUCKT KEINEN ANBIETER-FEHLER — die Route macht daraus provider_error', async () => {
    streamMock.mockRejectedValue(Object.assign(new Error('AI provider unavailable'), { statusCode: 502 }))
    await expect(plugin.georgeContextGenerator(context())).rejects.toThrow('AI provider unavailable')
  })

  it('ein Slot ohne Auftrag wirft, statt still etwas zu erfinden', async () => {
    const foreign = { ...context(), slot: slotById('b.purpose')! }
    await expect(plugin.georgeContextGenerator(foreign)).rejects.toThrow(/b\.purpose/)
    expect(streamMock).not.toHaveBeenCalled()
  })
})
