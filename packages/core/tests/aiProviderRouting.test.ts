import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

/**
 * PROVIDER-ROUTING — der Nachweis, dass die Datenschutz-Bedingungen wirklich im
 * REQUEST landen und nicht nur in einem Typ stehen.
 *
 * Das ist die Voraussetzung für den ZDR-Betrieb des Brand-Wizards
 * (BRAND-WIZARD-PHASE-1 §9b.4): `zdr: true`, `data_collection: "deny"`,
 * Anbieter-Allowlist, `allow_fallbacks: false`. Eine Option, die unterwegs
 * verloren geht, sähe im Code korrekt aus und schickte den Prompt trotzdem an
 * einen beliebigen Anbieter — deshalb wird hier der tatsächlich abgeschickte
 * Body gelesen, nicht der Aufruf.
 *
 * Der zweite geprüfte Satz ist der Gegenpol: OHNE Option ändert sich der
 * Request um kein Byte (der Transport bleibt policy-frei).
 */
const appConfig = { pukalani: { ai: { enabled: true, model: 'test/model', baseUrl: 'https://openrouter.test/api/v1' } } }
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('createError', (init: Record<string, unknown>) => Object.assign(new Error(String(init.statusText)), init))
vi.stubGlobal('readInstanceSecret', async () => '')
vi.stubGlobal('useRuntimeConfig', () => ({ aiKey: '' }))

const { aiComplete, aiCompleteJson, buildAiRequestBody } = await import('../server/utils/aiComplete')

const event = {} as H3Event

const fetchMock = vi.fn(async () => ({
  ok: true,
  status: 200,
  text: async () => '',
  json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }),
}))
vi.stubGlobal('fetch', fetchMock)

function sentBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1] as unknown as { body: string }
  return JSON.parse(init.body) as Record<string, unknown>
}

beforeEach(() => {
  fetchMock.mockClear()
})

describe('buildAiRequestBody', () => {
  it('sendet OHNE Option KEIN provider-Feld', () => {
    const body = buildAiRequestBody({ model: 'm', prompt: 'p' })
    expect('provider' in body).toBe(false)
    expect(body).toEqual({
      model: 'm',
      messages: [{ role: 'user', content: 'p' }],
      temperature: 0.2,
      max_tokens: 700,
    })
  })

  it('übersetzt alle vier Felder in OpenRouters Schreibweise', () => {
    const body = buildAiRequestBody({
      model: 'm',
      prompt: 'p',
      providerRouting: { zdr: true, dataCollection: 'deny', only: ['anthropic'], allowFallbacks: false },
    })
    expect(body.provider).toEqual({
      zdr: true,
      data_collection: 'deny',
      only: ['anthropic'],
      allow_fallbacks: false,
    })
  })

  it('nimmt nur gesetzte Felder auf', () => {
    const body = buildAiRequestBody({ model: 'm', prompt: 'p', providerRouting: { zdr: true } })
    expect(body.provider).toEqual({ zdr: true })
  })

  it('sendet für ein LEERES Routing-Objekt kein provider-Feld', () => {
    expect('provider' in buildAiRequestBody({ model: 'm', prompt: 'p', providerRouting: {} })).toBe(false)
  })

  it('lässt eine leere Allowlist NICHT still verschwinden', () => {
    // Ein weggelassenes `only` wäre fail-open — welche Anbieter zulässig sind,
    // entscheidet der Aufrufer, nicht der Transport.
    const body = buildAiRequestBody({ model: 'm', prompt: 'p', providerRouting: { only: [] } })
    expect(body.provider).toEqual({ only: [] })
  })

  it('kopiert die Allowlist, statt die Aufrufer-Liste zu verlinken', () => {
    const only = ['anthropic']
    const body = buildAiRequestBody({ model: 'm', prompt: 'p', providerRouting: { only } })
    only.push('someone-else')
    expect((body.provider as { only: string[] }).only).toEqual(['anthropic'])
  })

  it('trägt `stream` nur, wenn wahr — der Non-Streaming-Body bleibt unverändert', () => {
    expect('stream' in buildAiRequestBody({ model: 'm', prompt: 'p' })).toBe(false)
    expect('stream' in buildAiRequestBody({ model: 'm', prompt: 'p', stream: false })).toBe(false)
    expect(buildAiRequestBody({ model: 'm', prompt: 'p', stream: true }).stream).toBe(true)
  })

  it('behält System-Prompt, Temperatur und Token-Deckel', () => {
    const body = buildAiRequestBody({ model: 'm', prompt: 'p', system: 's', temperature: 0, maxTokens: 42 })
    expect(body.messages).toEqual([{ role: 'system', content: 's' }, { role: 'user', content: 'p' }])
    expect(body.temperature).toBe(0)
    expect(body.max_tokens).toBe(42)
  })
})

describe('aiComplete', () => {
  it('schickt zdr/data_collection/only/allow_fallbacks WIRKLICH mit', async () => {
    await aiComplete(event, 'p', {
      apiKey: 'k',
      providerRouting: { zdr: true, dataCollection: 'deny', only: ['anthropic'], allowFallbacks: false },
    })
    expect(sentBody().provider).toEqual({
      zdr: true,
      data_collection: 'deny',
      only: ['anthropic'],
      allow_fallbacks: false,
    })
  })

  it('sendet ohne die Option keinerlei provider-Feld', async () => {
    await aiComplete(event, 'p', { apiKey: 'k' })
    expect('provider' in sentBody()).toBe(false)
  })

  it('reicht das Routing auch über aiCompleteJson durch', async () => {
    // Die JSON-Variante ist der Pfad, den strukturierte KI-Produkte nehmen —
    // sie darf die Bedingungen nicht unterwegs verlieren.
    await aiCompleteJson(event, 'p', { apiKey: 'k', providerRouting: { zdr: true, allowFallbacks: false } })
    expect(sentBody().provider).toEqual({ zdr: true, allow_fallbacks: false })
  })
})
