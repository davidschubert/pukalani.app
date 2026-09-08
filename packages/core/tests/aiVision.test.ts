import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

/**
 * DER VISION-TRANSPORT (`server/utils/aiVision.ts`, Brand Design D2b) —
 * geprüft wird der tatsächlich ABGESCHICKTE Body, nicht der Aufruf.
 *
 * Vier Zusagen, die keine Typ-Deklaration halten kann:
 *
 *  1. NACHRICHTEN-FORM: eine Nachricht mit einer LISTE aus Text- und
 *     Bild-Teilen, `data:<mime>;base64,…` — die Form, die die API kennt.
 *  2. DIE ZDR-KLEMME: `provider.data_collection === 'deny'` steht IMMER da,
 *     auch ohne Option und auch dann, wenn der Aufrufer ausdrücklich etwas
 *     anderes übergibt. Das ist Davids Entscheidung vom 2026-09-08 und der
 *     einzige Grund, warum Kunden-Screenshots einen fremden Anbieter sehen
 *     dürfen. Mit GEGENPROBE (`dataCollection: 'allow'` wird überschrieben).
 *  3. GATE AUS ⇒ KEIN NETZ: ohne `pukalani.ai.visionModel` fliegt eine 503,
 *     BEVOR `fetch` überhaupt gerufen wird — eine leere Konfiguration darf
 *     keinen Anbieter kontaktieren.
 *  4. KLEMMUNG: `aiVisionJson` schneidet auf das äussere Objekt zu und wirft
 *     bei Nicht-JSON eine 502 statt Unsinn zurückzugeben.
 */
const appConfig: { pukalani: { ai: Record<string, unknown> } } = {
  pukalani: { ai: { enabled: false, visionModel: 'test/vision', baseUrl: 'https://openrouter.test/api/v1' } },
}
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('createError', (init: Record<string, unknown>) =>
  Object.assign(new Error(String(init.statusText)), init, { statusCode: init.status }))
vi.stubGlobal('readInstanceSecret', async () => '')
vi.stubGlobal('useRuntimeConfig', () => ({ aiKey: 'k-test', public: { appwriteDatabaseId: 'db' } }))
vi.stubGlobal('createAdminClient', () => ({
  tablesDB: { getRow: async () => { throw new Error('kein app_config in diesem Test') } },
}))

const { extractJsonObject } = await import('../server/utils/aiComplete')
vi.stubGlobal('extractJsonObject', extractJsonObject)
vi.stubGlobal('resolveAiKey', async () => 'k-test')

const {
  aiVision,
  aiVisionImageUrl,
  aiVisionJson,
  buildAiVisionRequestBody,
  getAiVisionConfig,
  isAiVisionConfigured,
} = await import('../server/utils/aiVision')

const event = {} as H3Event

const fetchMock = vi.fn(async () => ({
  ok: true,
  status: 200,
  text: async () => '',
  json: async () => ({ choices: [{ message: { content: '{"items":[{"verdict":"fits"}]}' } }] }),
}))
vi.stubGlobal('fetch', fetchMock)

const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47])

function sentBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1] as unknown as { body: string }
  return JSON.parse(init.body) as Record<string, unknown>
}

beforeEach(() => {
  fetchMock.mockClear()
  appConfig.pukalani.ai = {
    enabled: false,
    visionModel: 'test/vision',
    baseUrl: 'https://openrouter.test/api/v1',
  }
})

describe('buildAiVisionRequestBody', () => {
  it('baut EINE Nachricht aus Prompt, Beschriftung und Bild-URI', () => {
    const body = buildAiVisionRequestBody({
      model: 'm',
      prompt: 'Lies die Bilder.',
      images: [{ mime: 'image/png', bytes: png, label: 'Bild 1 · Farbwelt' }],
    })
    const messages = body.messages as { role: string, content: unknown }[]
    expect(messages).toHaveLength(1)
    expect(messages[0]!.role).toBe('user')
    expect(messages[0]!.content).toEqual([
      { type: 'text', text: 'Lies die Bilder.' },
      { type: 'text', text: 'Bild 1 · Farbwelt' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${Buffer.from(png).toString('base64')}` } },
    ])
  })

  it('stellt ein System-Prompt VOR den Zug und lässt ihn sonst weg', () => {
    const withSystem = buildAiVisionRequestBody({
      model: 'm', prompt: 'p', images: [{ mime: 'image/png', bytes: png }], system: 'S',
    })
    expect((withSystem.messages as { role: string }[])[0]!.role).toBe('system')
    const without = buildAiVisionRequestBody({ model: 'm', prompt: 'p', images: [{ mime: 'image/png', bytes: png }] })
    expect((without.messages as { role: string }[])).toHaveLength(1)
  })

  it('ohne Beschriftung steht nur das Bild im Zug', () => {
    const body = buildAiVisionRequestBody({
      model: 'm', prompt: 'p', images: [{ mime: 'image/webp', bytes: png }],
    })
    const content = (body.messages as { content: { type: string }[] }[])[0]!.content
    expect(content.map(part => part.type)).toEqual(['text', 'image_url'])
  })

  it('ZDR: `data_collection: "deny"` steht auch OHNE providerRouting da', () => {
    const body = buildAiVisionRequestBody({
      model: 'm', prompt: 'p', images: [{ mime: 'image/png', bytes: png }],
    })
    expect(body.provider).toEqual({ data_collection: 'deny' })
  })

  it('GEGENPROBE: ein übergebenes `dataCollection: "allow"` wird überschrieben', () => {
    const body = buildAiVisionRequestBody({
      model: 'm',
      prompt: 'p',
      images: [{ mime: 'image/png', bytes: png }],
      providerRouting: { dataCollection: 'allow', zdr: true, allowFallbacks: false, only: ['a'] },
    })
    expect(body.provider).toEqual({
      zdr: true,
      only: ['a'],
      allow_fallbacks: false,
      data_collection: 'deny',
    })
  })

  it('temperature 0 und ein eigener Token-Deckel — eine Lesung ist keine Prosa', () => {
    const body = buildAiVisionRequestBody({
      model: 'm', prompt: 'p', images: [{ mime: 'image/png', bytes: png }],
    })
    expect(body.temperature).toBe(0)
    expect(body.max_tokens).toBe(1500)
  })
})

describe('aiVisionImageUrl', () => {
  it('trägt den MIME-Typ des Aufrufers, nicht einen geratenen', () => {
    expect(aiVisionImageUrl({ mime: 'image/webp', bytes: png }))
      .toBe(`data:image/webp;base64,${Buffer.from(png).toString('base64')}`)
  })
})

describe('getAiVisionConfig', () => {
  it('leeres Modell = aus (Core-Default)', () => {
    appConfig.pukalani.ai = { visionModel: '' }
    expect(getAiVisionConfig().enabled).toBe(false)
  })

  it('gesetztes Modell = an, unabhängig von `pukalani.ai.enabled`', () => {
    appConfig.pukalani.ai = { enabled: false, visionModel: 'x/y' }
    expect(getAiVisionConfig()).toMatchObject({ enabled: true, model: 'x/y' })
  })

  it('schneidet den trailing Slash der Basis-URL ab', () => {
    appConfig.pukalani.ai = { visionModel: 'x/y', baseUrl: 'https://h.test/api/v1/' }
    expect(getAiVisionConfig().baseUrl).toBe('https://h.test/api/v1')
  })
})

describe('isAiVisionConfigured', () => {
  it('ohne Modell: false — und der Anbieter wird nicht gefragt', async () => {
    appConfig.pukalani.ai = { visionModel: '' }
    expect(await isAiVisionConfigured(event)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mit Modell und Schlüssel: true', async () => {
    expect(await isAiVisionConfigured(event)).toBe(true)
  })
})

describe('aiVision', () => {
  it('schickt Modell, Schlüssel und den geklemmten Body an /chat/completions', async () => {
    const text = await aiVision(event, [{ mime: 'image/png', bytes: png }], 'p', { label: 'brand-reading' })
    expect(text).toBe('{"items":[{"verdict":"fits"}]}')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url).toBe('https://openrouter.test/api/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer k-test')
    expect(sentBody().provider).toEqual({ data_collection: 'deny' })
  })

  it('GATE AUS: ohne Modell 503 — und KEIN Netzaufruf', async () => {
    appConfig.pukalani.ai = { visionModel: '' }
    await expect(aiVision(event, [{ mime: 'image/png', bytes: png }], 'p'))
      .rejects.toMatchObject({ statusCode: 503 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ohne Bild: 400, ebenfalls ohne Netzaufruf', async () => {
    await expect(aiVision(event, [], 'p')).rejects.toMatchObject({ statusCode: 400 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('aiVisionJson', () => {
  it('schneidet auf das äussere Objekt zu (Zaun-Markierungen fallen weg)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => ({ choices: [{ message: { content: '```json\n{"a":{"b":1}}\n```' } }] }),
    } as never)
    expect(await aiVisionJson(event, [{ mime: 'image/png', bytes: png }], 'p'))
      .toEqual({ a: { b: 1 } })
  })

  it('kein JSON ⇒ 502 statt Unsinn', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => ({ choices: [{ message: { content: 'ich sehe ein schönes Bild' } }] }),
    } as never)
    await expect(aiVisionJson(event, [{ mime: 'image/png', bytes: png }], 'p'))
      .rejects.toMatchObject({ statusCode: 502 })
  })
})
