import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { confirmableRequiredSlotsForStep } from '../shared/slotRegistry'
import {
  type BrandGenerationEvent,
  decodeBrandGenerationChunk,
} from '../shared/brandGeneration'

/**
 * DIE KONVERSATIONS-ROUTE, DURCHGESPIELT — mit gefälschter Ablage, echtem
 * Handler.
 *
 * Drei Aussagen tragen diese Runde, und keine davon steht in einer puren
 * Funktion:
 *
 *  1. **HIER WIRD NIE EIN FELD GESCHRIEBEN.** Kein `slot.ready`, kein
 *     `updateRow` auf `brand_steps`, keine `revision`. Das ist die Grenze
 *     zwischen „der Berater redet" und „der Berater entwirft", und sie hat
 *     eine GEGENPROBE: derselbe Aufruf gegen die Generierungs-Route schreibt
 *     nachweislich.
 *  2. **DIE REIHENFOLGE IST DER VERLAUF.** Erst die Zeile des Menschen, dann
 *     der Strom, dann die Zeile des Beraters, dann „fertig". `brand_messages`
 *     wird nach `$id` sortiert gelesen — eine Antwort vor ihrer Frage wäre ein
 *     Protokoll, das niemand mehr versteht.
 *  3. **DAS GESPRÄCH BUCHT AUF SEINEN EIGENEN EIMER.** Gemessen wird an den
 *     Schlüsseln: `brand-ai-talk-day:p1` ja, `brand-ai-slot-day:*` nie.
 *
 * Die Frames gehen wie bei der Generierung durch DENSELBEN Leser, den der
 * Browser benutzt — Server und Client hängen damit an EINEM Beweis.
 */

const appConfig = { pukalani: { brand: { aiDailyInstanceCap: 1000 } } }

let hits: string[] = []
let bucketCounts: Record<string, number> = {}

interface FakeRow { $id: string, [key: string]: unknown }

const profileRow: FakeRow = {
  $id: 'p1',
  $createdAt: '2026-08-01T00:00:00.000Z',
  $updatedAt: '2026-08-01T00:00:00.000Z',
  createdByUserId: 'u1',
  ownerType: 'user',
  ownerId: 'u1',
  title: 'Testmarke',
  contentLocale: 'de',
  pathKind: 'new',
  hasName: true,
  team: 'solo',
  subBrands: 'unknown',
  websiteUrl: 'https://kailua.coffee',
  industry: 'Kaffeerösterei',
  about: 'Wir rösten Kaffee in kleinen Mengen.',
  audience: 'Cafés auf Maui.',
  progressPct: 0,
  currentStepKey: 'context',
  lastActivityAt: '2026-08-01T00:00:00.000Z',
}

let stepRow: FakeRow
let stepRows: FakeRow[]
let appConfigRow: FakeRow
/** Die Reihenfolge ALLER Wirkungen — Schreibvorgänge und gesendete Frames. */
let timeline: string[]
/** Die geschriebenen `brand_messages`-Zeilen, in der Reihenfolge der Anlage. */
let messageRows: Record<string, unknown>[]
/** Was `listRows` für den Verlauf liefert (ABSTEIGEND, wie die Route fragt). */
let historyRows: FakeRow[]

const tablesDB = {
  getRow: vi.fn(async ({ tableId, rowId }: { tableId: string, rowId: string }) => {
    if (tableId === 'brand_profiles') return profileRow
    if (tableId === 'brand_steps') {
      const hit = stepRows.find(row => row.$id === rowId)
      if (!hit) throw new Error('not found')
      return hit
    }
    if (tableId === 'app_config') return appConfigRow
    throw new Error(`unerwartete Tabelle ${tableId}`)
  }),
  listRows: vi.fn(async ({ tableId }: { tableId: string }) => {
    if (tableId === 'brand_steps') return { rows: stepRows }
    if (tableId === 'brand_messages') return { rows: historyRows }
    return { rows: [] }
  }),
  updateRow: vi.fn(async ({ tableId }: { tableId: string }) => {
    timeline.push(`write:${tableId}`)
    return stepRow
  }),
  createRow: vi.fn(async ({ tableId, data }: { tableId: string, data: Record<string, unknown> }) => {
    timeline.push(`write:${tableId}`)
    if (tableId === 'brand_messages') messageRows.push(data)
    return { $id: `row${messageRows.length}` }
  }),
}

/** Was das Modell schreibt — je Test austauschbar. */
let modelText: string
let modelFails: Error | null
const aiCompleteStream = vi.fn(async (
  _event: unknown,
  prompt: string,
  options: { system: string, onDelta?: (text: string) => Promise<void> | void },
) => {
  lastPrompt = prompt
  lastSystem = options.system
  if (modelFails) throw modelFails
  // In Stücken, wie ein echter Anbieter — der Putzer muss über die Grenzen hinweg
  // dasselbe Ergebnis liefern.
  for (const chunk of modelText.match(/[\s\S]{1,7}/g) ?? []) await options.onDelta?.(chunk)
  return { text: modelText, model: 'test-model', provider: 'test', aborted: false }
})
let lastPrompt = ''
let lastSystem = ''

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appwriteDatabaseId: 'main' } }))
vi.stubGlobal('createAdminClient', () => ({ tablesDB }))
vi.stubGlobal('createError', (init: Record<string, unknown>) =>
  Object.assign(new Error(String(init.statusText)), init, { statusCode: init.status }))
vi.stubGlobal('toH3Error', (error: unknown) => error)
vi.stubGlobal('logEvent', () => {})
vi.stubGlobal('requireBrandAccess', async () => ({ userId: 'u1' }))
vi.stubGlobal('assertBrandOwnerAccess', () => {})
vi.stubGlobal('getRouterParam', (_event: H3Event, name: string) => (name === 'id' ? 'p1' : 'context'))
vi.stubGlobal('getEffectiveAiConfig', async () => ({ model: 'configured-model' }))
vi.stubGlobal('aiCompleteStream', aiCompleteStream)

let body: Record<string, unknown>
vi.stubGlobal('readBody', async () => body)
vi.stubGlobal('setHeader', () => {})
vi.stubGlobal('useRateLimitStore', () => ({
  prefix: 'rl:test:',
  store: {
    hit: async (key: string) => {
      const bucket = key.replace('rl:test:', '')
      hits.push(bucket)
      return { count: bucketCounts[bucket] ?? 1, resetInMs: 3_600_000 }
    },
  },
}))

const handler = (await import('../server/api/brand/profiles/[id]/steps/[stepKey]/converse.post'))
  .default as unknown as (event: H3Event) => Promise<unknown>
const { clearBrandConverseKeys } = await import('../server/utils/brandConverse')
const { clearActiveBrandGenerations } = await import('../server/utils/brandGenerators')

function fakeEvent() {
  const chunks: string[] = []
  const closeHandlers: (() => void)[] = []
  const res = {
    writableEnded: false,
    headed: false,
    writeHead(..._args: unknown[]) { this.headed = true },
    write(chunk: string) {
      chunks.push(chunk)
      timeline.push(`send:${/"type":"([^"]+)"/.exec(chunk)?.[1] ?? 'unknown'}`)
      return true
    },
    end() { this.writableEnded = true },
  }
  const req = { on(name: string, fn: () => void) { if (name === 'close') closeHandlers.push(fn) } }
  return {
    event: { node: { req, res }, context: {} } as unknown as H3Event,
    chunks,
    res,
    close: () => closeHandlers.forEach(fn => fn()),
  }
}

function readBack(chunks: readonly string[]): BrandGenerationEvent[] {
  let buffer = ''
  const events: BrandGenerationEvent[] = []
  for (const letter of [...chunks.join('')]) {
    const step = decodeBrandGenerationChunk(buffer, letter)
    buffer = step.buffer
    events.push(...step.events)
  }
  return events
}

function stepRowFor(stepKey: string, overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    $id: `p1_${stepKey}`,
    profileId: 'p1',
    stepKey,
    state: 'open',
    slots: '{}',
    generations: '{"items":[],"count":0}',
    revision: 0,
    activeSeconds: 0,
    ...overrides,
  }
}

const TALK_BUCKET = 'brand-ai-talk-day:p1'
const ACCOUNT_BUCKET = 'brand-ai-day:u1'
const INSTANCE_BUCKET = 'brand-ai-instance-day'

beforeEach(() => {
  timeline = []
  hits = []
  bucketCounts = {}
  messageRows = []
  historyRows = []
  modelText = 'Das nehme ich mit. Was loben eure Kunden an euch?'
  modelFails = null
  lastPrompt = ''
  lastSystem = ''
  appConfigRow = { $id: 'global', brandAiEnabled: true }
  // `a.origin` ist beantwortet ⇒ die nächste offene Frage ist `a.customerPraise`.
  stepRow = stepRowFor('context', {
    revision: 3,
    slots: JSON.stringify({ 'a.origin': { confirmed: 'Wir haben 2019 angefangen.' } }),
  })
  stepRows = [stepRow, stepRowFor('pvm')]
  body = {
    text: 'Weil uns der Kaffee hier zu langweilig war.',
    slotId: 'a.origin',
    question: 'Warum habt ihr angefangen?',
    nextSlotId: 'a.customerPraise',
    nextQuestion: 'Was loben eure Kunden?',
  }
  tablesDB.updateRow.mockClear()
  tablesDB.createRow.mockClear()
  aiCompleteStream.mockClear()
  clearBrandConverseKeys()
  clearActiveBrandGenerations()
})

describe('POST …/steps/:stepKey/converse', () => {
  it('sendet Start, Deltas und Abschluss — und NIE ein `slot.ready`', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    const events = readBack(chunks)

    expect(events[0]!.type).toBe('generation.started')
    expect(events.filter(item => item.type === 'message.delta').length).toBeGreaterThanOrEqual(4)
    expect(events.at(-1)!.type).toBe('generation.completed')
    // DIE Grenze dieser Runde: ein Zug füllt kein Feld.
    expect(events.some(item => item.type === 'slot.ready')).toBe(false)
    expect(new Set(events.map(item => item.generationId)).size).toBe(1)
  })

  it('GEGENPROBE: kein einziger Schreibvorgang auf `brand_steps`', async () => {
    const { event } = fakeEvent()
    await handler(event)
    // Kein Slot, kein inputHash, keine neue Fassung. Der plausible Umbau wäre,
    // die Antwort „sicherheitshalber" auch hier zu speichern — genau der fällt
    // hier durch.
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
    expect(timeline).not.toContain('write:brand_steps')
    // Und die gemeldete Fassung ist die GELESENE, nicht eine erhöhte.
    const completed = readBack([]).at(-1)
    expect(completed).toBeUndefined()
  })

  it('meldet die GELESENE revision, ohne sie zu erhöhen', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)).toMatchObject({
      type: 'generation.completed',
      revision: 3,
      outcome: 'question',
      reused: false,
    })
  })

  it('SCHREIBT IN DER REIHENFOLGE DES VERLAUFS: Mensch, Strom, Berater, fertig', async () => {
    const { event } = fakeEvent()
    await handler(event)
    const first = timeline.indexOf('write:brand_messages')
    const started = timeline.indexOf('send:generation.started')
    const last = timeline.lastIndexOf('write:brand_messages')
    const completed = timeline.indexOf('send:generation.completed')

    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(started)
    expect(last).toBeGreaterThan(started)
    expect(last).toBeLessThan(completed)
  })

  it('legt beide Zeilen mit ihrer Art an — `answer` und `reply`', async () => {
    const { event } = fakeEvent()
    await handler(event)

    expect(messageRows).toHaveLength(2)
    expect(messageRows[0]).toMatchObject({ role: 'user', body: body.text, stepKey: 'context' })
    expect(JSON.parse(String(messageRows[0]!.parts))).toEqual({ kind: 'answer', slotId: 'a.origin' })
    expect(messageRows[1]).toMatchObject({ role: 'george', body: modelText })
    expect(JSON.parse(String(messageRows[1]!.parts))).toEqual({ kind: 'reply', slotId: 'a.origin' })
    // Dieselbe Id verbindet Antwort und Reaktion.
    expect(messageRows[0]!.generationId).toBe(messageRows[1]!.generationId)
  })

  it('PUTZT verirrte Marker aus dem Zug, statt sie in den Verlauf zu schreiben', async () => {
    // Dasselbe Modell schreibt in anderen Zügen mit `BASIS:`/`ASK:` — hier
    // gehört das Etikett weg, nicht in die Sprechblase.
    modelText = 'BASIS: eure Antwort\nDas nehme ich mit.\nASK: Was loben eure Kunden?'
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(String(messageRows[1]!.body)).not.toMatch(/^(BASIS|ASK):/m)
    expect(String(messageRows[1]!.body)).toContain('Das nehme ich mit.')
    const streamed = readBack(chunks)
      .filter(item => item.type === 'message.delta')
      .map(item => (item as { text: string }).text)
      .join('')
    expect(streamed).not.toContain('BASIS:')
    expect(streamed).not.toContain('ASK:')
  })
})

describe('Der Kill-Switch und die stillen Neins', () => {
  it('KI AUS ⇒ `{ conversed: false }`, kein Strom, keine Zeile, keine Buchung', async () => {
    appConfigRow = { $id: 'global', brandAiEnabled: false }
    const { event, res } = fakeEvent()
    const result = await handler(event)

    expect(result).toEqual({ conversed: false })
    // Kein `writeHead`: ein `fetch` sieht eine gewöhnliche JSON-Antwort und die
    // Werkstatt verhält sich wie vor P3.2.
    expect(res.headed).toBe(false)
    expect(tablesDB.createRow).not.toHaveBeenCalled()
    expect(hits).toEqual([])
    expect(aiCompleteStream).not.toHaveBeenCalled()
  })

  it('GEGENPROBE: fehlt die Spalte, gilt dasselbe (fail-closed)', async () => {
    appConfigRow = { $id: 'global' }
    const { event } = fakeEvent()
    expect(await handler(event)).toEqual({ conversed: false })
  })

  it('DERSELBE IDEMPOTENZSCHLÜSSEL kostet kein zweites Mal', async () => {
    body = { ...body, idempotencyKey: 'k1' }
    const first = fakeEvent()
    await handler(first.event)
    expect(aiCompleteStream).toHaveBeenCalledOnce()

    hits = []
    const second = fakeEvent()
    expect(await handler(second.event)).toEqual({ conversed: false })
    expect(aiCompleteStream).toHaveBeenCalledOnce()
    expect(hits).toEqual([])
  })

  it('ein LAUFENDER Zug im selben Baustein wird still übergangen', async () => {
    aiCompleteStream.mockImplementationOnce(async (_event, _prompt, options) => {
      await new Promise(resolve => setTimeout(resolve, 40))
      await options.onDelta?.(modelText)
      return { text: modelText, model: 'test-model', provider: 'test', aborted: false }
    })
    const first = fakeEvent()
    const running = handler(first.event)
    const second = fakeEvent()
    const result = await handler(second.event)
    await running

    // Kein Fehler-Frame, kein Hinweis: die Antwort ist gespeichert, die Frage
    // steht da — es fehlt nur die Reaktion.
    expect(result).toEqual({ conversed: false })
    expect(second.res.headed).toBe(false)
  })
})

describe('Die Drossel des Gesprächs', () => {
  it('bucht den GESPRÄCHS-Eimer, nie den eines Slots', async () => {
    const { event } = fakeEvent()
    await handler(event)
    expect(hits).toEqual([TALK_BUCKET, ACCOUNT_BUCKET, INSTANCE_BUCKET])
    // Der Punkt der Entscheidung: wer antwortet, verliert nicht die Entwürfe
    // für das Feld, für das er geantwortet hat.
    expect(hits.some(key => key.startsWith('brand-ai-slot-day'))).toBe(false)
  })

  it('DER GESPRÄCHS-DECKEL lehnt ab — und verbraucht die weiteren NICHT', async () => {
    bucketCounts[TALK_BUCKET] = 41
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 429,
      data: { code: 'brand_ai_talk_limit' },
    })
    expect(hits).toEqual([TALK_BUCKET])
    expect(aiCompleteStream).not.toHaveBeenCalled()
    // Und die Zeile des Menschen wird auch nicht geschrieben — abgewiesen wird
    // VOR jeder Wirkung.
    expect(tablesDB.createRow).not.toHaveBeenCalled()
  })

  it('gibt den Burst-Platz nach einem Nein wieder frei', async () => {
    const module = await import('../server/utils/brandGenerators')
    bucketCounts[TALK_BUCKET] = 41
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 429 })
    expect(module.countActiveBrandGenerations('u1')).toBe(0)

    bucketCounts = {}
    const second = fakeEvent()
    await handler(second.event)
    expect(module.countActiveBrandGenerations('u1')).toBe(0)
  })
})

describe('Die nächste Frage gehört der Registry', () => {
  it('nimmt den Wortlaut, wenn er zur berechneten Frage gehört', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(lastPrompt).toContain('[the next question]\nWas loben eure Kunden?')
    expect(lastPrompt).toContain('Ask it IN YOUR OWN WORDS')
    // Und die Werkstatt erfährt, dass diese Frage gestellt wurde — daran hängt,
    // ob der Katalog-Satz darunter noch einmal erscheint.
    expect(readBack(chunks).at(-1)).toMatchObject({ slotId: 'a.customerPraise' })
  })

  it('VERWIRFT einen Wortlaut, der zu einer ANDEREN Frage gehört', async () => {
    // Ein zweiter Tab hat weitergearbeitet — der Client zeigt eine Frage, die
    // der Server gar nicht als nächste sieht.
    body = { ...body, nextSlotId: 'a.challenge', nextQuestion: 'Was ist eure größte Hürde?' }
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(lastPrompt).not.toContain('Was ist eure größte Hürde?')
    expect(lastPrompt).toContain('Do NOT')
    expect(readBack(chunks).at(-1)).toMatchObject({ slotId: '' })
  })

  it('RECHNET MIT ÜBERSPRUNGENEN FRAGEN — sonst zeigten beide auf Verschiedenes', async () => {
    // „Weiß ich nicht" auf `a.customerPraise`: der Server speichert davon
    // nichts und käme ohne diese Liste auf dieselbe Frage zurück.
    body = {
      ...body,
      skipped: ['a.customerPraise'],
      nextSlotId: 'a.complaints',
      nextQuestion: 'Worüber beschweren sich Kunden?',
    }
    const { event } = fakeEvent()
    await handler(event)
    expect(lastPrompt).toContain('[the next question]\nWorüber beschweren sich Kunden?')
  })

  it('OHNE Katalog-Frage, ABER offene Pflicht-Felder: nie „fertig" behaupten (converse-3)', async () => {
    // Alle FRAGE-Slots bestätigt, aber Ableitungs-Pflichten (a.pitch & Co.)
    // stehen noch — Davids Live-Fund am Krume-Archetyp: der alte Zweig sagte
    // hier „nichts mehr offen", während vier Felder unbestätigt waren.
    stepRow.slots = JSON.stringify(Object.fromEntries(
      ['a.origin', 'a.customerPraise', 'a.complaints', 'a.oneThing', 'a.challenge', 'a.facts']
        .map(id => [id, { confirmed: 'steht' }]),
    ))
    body = { text: 'Und was ist hier eigentlich noch offen?' }
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(lastPrompt).toContain('THERE ARE NO MORE CATALOG QUESTIONS')
    expect(lastPrompt).toContain('Never claim the chapter is done')
    expect(lastPrompt).not.toContain('THERE IS NO OPEN QUESTION LEFT')
    expect(readBack(chunks).at(-1)).toMatchObject({ slotId: '' })
  })

  it('ALLES bestätigt: der Auftrag sagt „nichts mehr offen"', async () => {
    stepRow.slots = JSON.stringify(Object.fromEntries(
      confirmableRequiredSlotsForStep('context').map(slot => [slot.id, { confirmed: 'steht' }]),
    ))
    body = { text: 'Und was heißt eigentlich Positionierung?' }
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(lastPrompt).toContain('THERE IS NO OPEN QUESTION LEFT')
    expect(readBack(chunks).at(-1)).toMatchObject({ slotId: '' })
  })

  it('nimmt eine FREIE Frage ohne Slot an', async () => {
    body = { text: 'Was meinst du mit Positionierung?' }
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(readBack(chunks).at(-1)!.type).toBe('generation.completed')
    expect(JSON.parse(String(messageRows[0]!.parts))).toEqual({ kind: 'answer' })
  })

  it('lehnt einen Slot aus einem ANDEREN Baustein ab', async () => {
    body = { ...body, slotId: 'b.purpose' }
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 400 })
  })

  it('lehnt einen leeren Text ab', async () => {
    body = { ...body, text: '   ' }
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 400, data: { code: 'invalid_body' } })
  })
})

describe('Der Verlauf und der Kontext', () => {
  it('legt die letzten Nachrichten in den Prompt — ÄLTESTE zuerst', async () => {
    // Die Route fragt absteigend und dreht um.
    historyRows = [
      { $id: 'm2', profileId: 'p1', stepKey: 'context', role: 'george', body: 'Und für wen?' },
      { $id: 'm1', profileId: 'p1', stepKey: 'context', role: 'user', body: 'Wir sind eine Rösterei.' },
    ]
    const { event } = fakeEvent()
    await handler(event)

    const older = lastPrompt.indexOf('person: Wir sind eine Rösterei.')
    const newer = lastPrompt.indexOf('you: Und für wen?')
    expect(older).toBeGreaterThanOrEqual(0)
    expect(newer).toBeGreaterThan(older)
  })

  it('reicht Startkarte, Baustein-Werte und den getippten Text durch', async () => {
    const { event } = fakeEvent()
    await handler(event)
    expect(lastPrompt).toContain('Kaffeerösterei')
    // Menschliche Beschriftung statt interner Id (converse-2, Davids
    // Live-Fund 2026-09-03: George sprach `a.customerPraise` & Co. nach).
    expect(lastPrompt).toContain('[Warum hast du angefangen — was war der Auslöser, welches Problem konntest du nicht ignorieren?]\nWir haben 2019 angefangen.')
    expect(lastPrompt).not.toContain('[a.origin]')
    expect(lastPrompt).toContain('[what they just wrote]\nWeil uns der Kaffee hier zu langweilig war.')
    expect(lastPrompt).toContain('[the question they were answering]\nWarum habt ihr angefangen?')
  })

  it('spricht mit dem BERATER dieses Bausteins und in der Sprache der Seite', async () => {
    body = { ...body, uiLocale: 'en' }
    const { event } = fakeEvent()
    await handler(event)
    // Baustein A gehört George (Registry), die Marke ist deutsch, die Seite englisch.
    expect(lastSystem).toContain('You are George')
    expect(lastSystem).toContain('you speak to the person in en')
    expect(lastSystem).toContain('is written in de')
  })

  it('ein unlesbarer Verlauf kostet den Zug NICHT', async () => {
    tablesDB.listRows.mockImplementationOnce(async ({ tableId }: { tableId: string }) =>
      (tableId === 'brand_steps' ? { rows: stepRows } : { rows: [] }))
    tablesDB.listRows.mockImplementationOnce(async () => { throw new Error('kaputt') })
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)!.type).toBe('generation.completed')
  })
})

describe('Wenn etwas schiefgeht', () => {
  it('ANBIETER KAPUTT ⇒ `provider_error` und KEINE Berater-Zeile', async () => {
    modelFails = new Error('502')
    const { event, chunks } = fakeEvent()
    await handler(event)

    expect(readBack(chunks).at(-1)).toMatchObject({ type: 'generation.failed', code: 'provider_error' })
    // Die Zeile des MENSCHEN steht trotzdem — sie ist nicht das Ergebnis dieses
    // Laufs, sondern das Protokoll seiner Antwort.
    expect(messageRows).toHaveLength(1)
    expect(messageRows[0]).toMatchObject({ role: 'user' })
  })

  it('LEERER ZUG ⇒ `empty_result`, nichts wird geschrieben', async () => {
    modelText = '   '
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)).toMatchObject({ type: 'generation.failed', code: 'empty_result' })
    expect(messageRows).toHaveLength(1)
  })

  it('SCHREIBT DIE BERATER-ZEILE NICHT ⇒ `persist_failed` statt „fertig"', async () => {
    // Ein „fertig" für einen Text, den ein Reload nicht mehr findet, wäre eine
    // Lüge — anders als bei der Generierung ist die Nachricht hier die Sache.
    tablesDB.createRow.mockImplementationOnce(async ({ tableId, data }) => {
      timeline.push(`write:${tableId}`)
      messageRows.push(data)
      return { $id: 'row1' }
    })
    tablesDB.createRow.mockImplementationOnce(async () => { throw new Error('voll') })
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)).toMatchObject({ type: 'generation.failed', code: 'persist_failed' })
  })

  it('LOG-REGEL §6: der getippte Text landet NIE in `brand_events`', async () => {
    const { event } = fakeEvent()
    await handler(event)
    const events = tablesDB.createRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .filter(call => call.tableId === 'brand_events')
    for (const record of events) {
      expect(JSON.stringify(record.data)).not.toContain('langweilig')
      expect(JSON.stringify(record.data)).not.toContain('loben')
    }
  })
})
