import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import {
  type BrandGenerationEvent,
  decodeBrandGenerationChunk,
} from '../shared/brandGeneration'
import type { BrandGenerationsView } from '../shared/types/brand'

/**
 * DIE ROUTE, DURCHGESPIELT — mit gefälschter Ablage, echtem Handler.
 *
 * Warum das den Aufwand wert ist: die vier puren Regeln (Protokoll, Sperre,
 * Hash, Beschnitt) sind einzeln bewiesen, aber die REIHENFOLGE ist die Aussage,
 * an der alles hängt — „erst speichern, dann `generation.completed`" (Plan §6).
 * Sie steht in keiner puren Funktion, sondern zwischen den Zeilen der Route,
 * und genau solche Aussagen verrutschen beim Umbauen still. Hier wird sie
 * gemessen: der Zeitpunkt des `updateRow` gegen den Zeitpunkt des
 * Abschluss-Frames.
 *
 * Der zweite Grund ist der Kreisschluss: die Frames, die dieser Test einsammelt,
 * gehen durch DENSELBEN Leser, den der Browser benutzt
 * (`decodeBrandGenerationChunk`) — und zwar zerrissen. Server und Client sind
 * damit an EINEM Beweis aneinandergenagelt statt an zwei Behauptungen.
 *
 * Ein Live-Beweis im Playground scheitert an etwas anderem: dort gibt es keinen
 * Appwrite-Zugang, das Gate antwortet 404, bevor irgendein Frame entsteht.
 */

const appConfig = { pukalani: { brand: { devStubGenerator: true, aiDailyInstanceCap: 1000 } } }

/** Die gebuchten Eimer dieses Laufs — der Beweis, WAS Kontingent kostet. */
let hits: string[] = []
/** Zählerstand je Eimer; alles Ungenannte steht auf 1 (erster Lauf des Tages). */
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
  // Die Startkarte (§2.1) — sie steht am PROFIL und reist über den
  // Generator-Vertrag zu George (P2.5).
  websiteUrl: 'https://kailua.coffee',
  industry: 'Kaffeerösterei',
  about: 'Wir rösten Kaffee in kleinen Mengen.',
  audience: 'Cafés auf Maui.',
  progressPct: 0,
  currentStepKey: 'context',
  lastActivityAt: '2026-08-01T00:00:00.000Z',
}

let stepRow: FakeRow
let appConfigRow: FakeRow
/** Die Reihenfolge ALLER Wirkungen — Schreibvorgänge und gesendete Frames. */
let timeline: string[]

const tablesDB = {
  getRow: vi.fn(async ({ tableId }: { tableId: string }) => {
    if (tableId === 'brand_profiles') return profileRow
    if (tableId === 'brand_steps') return stepRow
    if (tableId === 'app_config') return appConfigRow
    throw new Error(`unerwartete Tabelle ${tableId}`)
  }),
  listRows: vi.fn(async ({ tableId }: { tableId: string }) => (tableId === 'brand_steps'
    ? { rows: [stepRow] }
    : { rows: [] })),
  updateRow: vi.fn(async ({ tableId, data }: { tableId: string, data: Record<string, unknown> }) => {
    if (tableId === 'brand_steps') {
      timeline.push('write:step')
      Object.assign(stepRow, data)
    }
    else {
      timeline.push('write:profile')
    }
    return stepRow
  }),
  createRow: vi.fn(async ({ tableId }: { tableId: string }) => {
    timeline.push(`write:${tableId}`)
    return { $id: 'm1' }
  }),
}

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
vi.stubGlobal('getRouterParam', (_event: H3Event, name: string) =>
  (name === 'id' ? 'p1' : 'context'))

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

const handler = (await import('../server/api/brand/profiles/[id]/steps/[stepKey]/generate.post'))
  .default as unknown as (event: H3Event) => Promise<unknown>

/** Ein Response-Doppel, das mitschreibt, WANN etwas gesendet wurde. */
function fakeEvent() {
  const chunks: string[] = []
  const closeHandlers: (() => void)[] = []
  const res = {
    writableEnded: false,
    writeHead: vi.fn(),
    write(chunk: string) {
      chunks.push(chunk)
      const type = /"type":"([^"]+)"/.exec(chunk)?.[1] ?? 'unknown'
      timeline.push(`send:${type}`)
      return true
    },
    end() { this.writableEnded = true },
  }
  const req = {
    on(name: string, fn: () => void) { if (name === 'close') closeHandlers.push(fn) },
  }
  return {
    event: { node: { req, res }, context: {} } as unknown as H3Event,
    chunks,
    close: () => closeHandlers.forEach(fn => fn()),
  }
}

/**
 * Die gesammelten Frames durch den CLIENT-Leser — und zwar BUCHSTABENWEISE
 * zerrissen: so kommen sie in einem echten Browser an.
 */
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

beforeEach(() => {
  timeline = []
  hits = []
  bucketCounts = {}
  appConfigRow = { $id: 'global', brandAiEnabled: true }
  stepRow = {
    $id: 'p1_context',
    profileId: 'p1',
    stepKey: 'context',
    state: 'open',
    slots: '{}',
    generations: '{"items":[],"count":0}',
    revision: 3,
    activeSeconds: 0,
  }
  body = { slotId: 'a.pitch' }
  tablesDB.updateRow.mockClear()
  tablesDB.createRow.mockClear()
})

describe('POST …/steps/:stepKey/generate', () => {
  it('sendet die fünf Ereignisse in der Reihenfolge des Plans', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    const events = readBack(chunks)

    expect(events[0]!.type).toBe('generation.started')
    expect(events.filter(item => item.type === 'message.delta').length).toBeGreaterThanOrEqual(4)
    expect(events.at(-2)!.type).toBe('slot.ready')
    expect(events.at(-1)!.type).toBe('generation.completed')
    // Alle Frames tragen DIESELBE generationId (§3e).
    expect(new Set(events.map(item => item.generationId)).size).toBe(1)
  })

  it('SPEICHERT VOR `generation.completed` (Plan §6)', async () => {
    const { event } = fakeEvent()
    await handler(event)
    // Gemessen wird die REIHENFOLGE, nicht das Vorhandensein: der plausible
    // Umbau ist „Frame sofort, Persistenz im Hintergrund" — und genau der
    // fällt hier durch (Gegenprobe gefahren).
    expect(timeline).toContain('write:step')
    expect(timeline.indexOf('write:step')).toBeLessThan(timeline.indexOf('send:generation.completed'))
    expect(timeline.indexOf('write:brand_messages')).toBeLessThan(timeline.indexOf('send:generation.completed'))
  })

  it('schreibt Entwurf, Historie, inputHash und die NEUE revision', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)

    const data = tablesDB.updateRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_steps')!.data

    expect(data.revision).toBe(4)
    expect(String(data.inputHash)).toMatch(/^[0-9a-f]{64}$/)

    const slots = JSON.parse(String(data.slots)) as Record<string, { firstDraft: string, latestDraft: string }>
    expect(slots['a.pitch']!.latestDraft.length).toBeGreaterThan(0)
    // Der ERSTE Entwurf wird gesetzt, weil noch keiner da war (Versions-Vertrag).
    expect(slots['a.pitch']!.firstDraft).toBe(slots['a.pitch']!.latestDraft)

    const generations = JSON.parse(String(data.generations)) as BrandGenerationsView
    expect(generations.count).toBe(1)
    expect(generations.items[0]!.slotId).toBe('a.pitch')
    expect(generations.items[0]!.promptVersion).toBe('stub-1')
    // Der Eintrag trägt den TEXT — sonst könnte die Fassungs-Wiederherstellung
    // nichts zurückholen.
    expect(generations.items[0]!.draft).toBe(slots['a.pitch']!.latestDraft)

    // Und der Client erfährt die neue Fassung im Abschluss-Frame.
    const completed = readBack(chunks).at(-1)!
    expect(completed).toMatchObject({ type: 'generation.completed', revision: 4, reused: false })
  })

  it('DER ERSTE ENTWURF BLEIBT STEHEN, wenn schon einer da ist', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'ganz früher', latestDraft: 'ganz früher' } })
    const { event } = fakeEvent()
    await handler(event)
    const data = tablesDB.updateRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_steps')!.data
    const slots = JSON.parse(String(data.slots)) as Record<string, { firstDraft: string, latestDraft: string }>
    expect(slots['a.pitch']!.firstDraft).toBe('ganz früher')
    expect(slots['a.pitch']!.latestDraft).not.toBe('ganz früher')
  })

  it('KI AUS ⇒ generation.failed(ai_disabled) und KEIN Schreibvorgang', async () => {
    appConfigRow = { $id: 'global', brandAiEnabled: false }
    const { event, chunks } = fakeEvent()
    await handler(event)
    const events = readBack(chunks)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'generation.failed', code: 'ai_disabled' })
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })

  it('GEGENPROBE: fehlt die Spalte, gilt dasselbe (fail-closed)', async () => {
    appConfigRow = { $id: 'global' }
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks)[0]).toMatchObject({ type: 'generation.failed', code: 'ai_disabled' })
  })

  it('ohne Generator und ohne Schalter: no_generator', async () => {
    appConfig.pukalani.brand.devStubGenerator = false
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks)[0]).toMatchObject({ type: 'generation.failed', code: 'no_generator' })
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
    appConfig.pukalani.brand.devStubGenerator = true
  })

  it('lehnt einen Slot ab, den George gar nicht entwirft', async () => {
    // `a.origin` ist eine reine Menschenfrage (`generator: 'none'`).
    body = { slotId: 'a.origin' }
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 400 })
  })

  it('lehnt einen Slot aus einem ANDEREN Baustein ab', async () => {
    body = { slotId: 'b.purpose' }
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 400 })
  })

  it('DIE ZWEITE GENERIERUNG WIRD ABGEWIESEN, solange die erste läuft', async () => {
    const first = fakeEvent()
    const running = handler(first.event)
    const second = fakeEvent()
    await handler(second.event)
    await running

    expect(readBack(second.chunks)[0]).toMatchObject({ type: 'generation.failed', code: 'generation_active' })
    // Und danach ist wieder frei.
    const third = fakeEvent()
    await handler(third.event)
    expect(readBack(third.chunks).at(-1)!.type).toBe('generation.completed')
  })

  it('ABBRUCH speichert NICHTS und meldet `aborted`', async () => {
    const { event, chunks, close } = fakeEvent()
    const running = handler(event)
    // Der Stub liefert seine Deltas mit Pausen — der Abbruch trifft ihn mittendrin.
    await new Promise(resolve => setTimeout(resolve, 30))
    close()
    await running

    const events = readBack(chunks)
    expect(events.at(-1)).toMatchObject({ type: 'generation.failed', code: 'aborted' })
    expect(events.some(item => item.type === 'slot.ready')).toBe(false)
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })

  it('GLEICHER IDEMPOTENZSCHLÜSSEL ⇒ derselbe Entwurf, kein zweiter Lauf', async () => {
    body = { slotId: 'a.pitch', idempotencyKey: 'k1' }
    const first = fakeEvent()
    await handler(first.event)
    const firstDraft = readBack(first.chunks)
      .find(item => item.type === 'slot.ready')!
    tablesDB.updateRow.mockClear()

    const second = fakeEvent()
    await handler(second.event)
    const events = readBack(second.chunks)

    expect(events.find(item => item.type === 'slot.ready')).toMatchObject({
      draft: (firstDraft as { draft: string }).draft,
    })
    expect(events.at(-1)).toMatchObject({ type: 'generation.completed', reused: true })
    // Kein zweiter Schreibvorgang: die Wiederverwendung kostet kein Kontingent.
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })

  it('der Hinweis wandert in den Entwurf, nicht in `brand_events`', async () => {
    body = { slotId: 'a.pitch', hint: 'wärmer' }
    const { event, chunks } = fakeEvent()
    await handler(event)
    const ready = readBack(chunks).find(item => item.type === 'slot.ready') as { draft: string }
    expect(ready.draft).toContain('wärmer')

    const events = tablesDB.createRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .filter(call => call.tableId === 'brand_events')
    // Log-Regel §6: der Funnel trägt Kennzahlen, nie den Hinweistext.
    for (const record of events) expect(JSON.stringify(record.data)).not.toContain('wärmer')
  })
})

/**
 * DIE DROSSEL AN DER ROUTE (P2.1) — was Kontingent kostet und was nicht.
 *
 * Der Dev-Stub reicht dafür nicht: er sagt `chargesQuota: false` und bucht
 * deshalb gar nichts (das ist eine der Aussagen hier). Für alles andere wird
 * ein echter Generator registriert — genau so, wie P2 seine Prompts einträgt.
 *
 * Gemessen wird an den EIMERN: welche Schlüssel hat die Route angefasst, in
 * welcher Reihenfolge, und wo hat sie aufgehört. Daran hängt die Sorgfalt, die
 * man beim Umbauen als Erstes verliert — ein enger Deckel darf die weiteren
 * nicht mitverbrauchen.
 */
describe('KI-Drossel', () => {
  const SLOT_BUCKET = 'brand-ai-slot-day:p1:a.pitch'
  const ACCOUNT_BUCKET = 'brand-ai-day:u1'
  const INSTANCE_BUCKET = 'brand-ai-instance-day'

  let generator: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearActiveBrandGenerations()
    generator = vi.fn(async () => ({
      draft: 'Ein echter Entwurf.',
      model: 'test-model',
      provider: 'test',
      promptVersion: 'p-1',
      aborted: false,
    }))
    module.registerBrandSlotGenerator('context', generator as never)
  })

  afterEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearBrandSlotGenerators()
    module.clearActiveBrandGenerations()
  })

  it('bucht ALLE DREI Tages-Eimer — eng vor weit', async () => {
    const { event } = fakeEvent()
    await handler(event)
    expect(hits).toEqual([SLOT_BUCKET, ACCOUNT_BUCKET, INSTANCE_BUCKET])
    expect(generator).toHaveBeenCalledOnce()
  })

  /**
   * P2.5: die Startkarte steht am PROFIL, nicht in den Slots — nur diese Route
   * kann sie in den Generator-Vertrag legen. Fehlt sie hier, bekommt George
   * wieder nichts, und kein Prompt-Test würde es merken.
   */
  it('LEGT DIE STARTKARTE DES PROFILS IN DEN KONTEXT', async () => {
    const { event } = fakeEvent()
    await handler(event)
    expect(generator.mock.calls[0]![0]).toMatchObject({
      startCard: {
        websiteUrl: 'https://kailua.coffee',
        industry: 'Kaffeerösterei',
        about: 'Wir rösten Kaffee in kleinen Mengen.',
        audience: 'Cafés auf Maui.',
      },
    })
  })

  it('DER SLOT-DECKEL LEHNT AB — und verbraucht die weiteren NICHT', async () => {
    bucketCounts[SLOT_BUCKET] = 11
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 429,
      data: { code: 'brand_ai_slot_limit' },
    })
    // Genau hier steckt die Sorgfalt: wer an einer Frage hängen bleibt, darf
    // nicht sein Tageskontingent verlieren.
    expect(hits).toEqual([SLOT_BUCKET])
    expect(generator).not.toHaveBeenCalled()
  })

  it('DER KONTO-DECKEL lehnt ab, ohne den Instanz-Deckel zu belasten', async () => {
    bucketCounts[ACCOUNT_BUCKET] = 201
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 429,
      data: { code: 'brand_ai_daily_limit' },
    })
    expect(hits).toEqual([SLOT_BUCKET, ACCOUNT_BUCKET])
  })

  it('DER INSTANZ-DECKEL lehnt zuletzt ab', async () => {
    bucketCounts[INSTANCE_BUCKET] = 1001
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 429,
      data: { code: 'brand_ai_instance_limit' },
    })
    expect(hits).toEqual([SLOT_BUCKET, ACCOUNT_BUCKET, INSTANCE_BUCKET])
  })

  it('ZWEI LAUFEN SCHON ⇒ der dritte wird abgewiesen, OHNE einen Eimer anzufassen', async () => {
    const module = await import('../server/utils/brandGenerators')
    module.retainBrandGeneration('u1')
    module.retainBrandGeneration('u1')

    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 429,
      data: { code: 'brand_ai_busy' },
    })
    expect(hits).toEqual([])
  })

  it('GIBT DEN BURST-PLATZ WIEDER FREI — auch nach einem Nein der Drossel', async () => {
    const module = await import('../server/utils/brandGenerators')
    bucketCounts[SLOT_BUCKET] = 11
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 429 })
    // Ein Platz, der nach einer Ablehnung belegt bliebe, sperrte das Konto nach
    // zwei Fehlversuchen dauerhaft aus.
    expect(module.countActiveBrandGenerations('u1')).toBe(0)

    // Und nach einem VOLLSTÄNDIGEN Lauf ebenso.
    bucketCounts = {}
    hits = []
    const second = fakeEvent()
    await handler(second.event)
    expect(module.countActiveBrandGenerations('u1')).toBe(0)
  })

  it('EIN LAUF, DER AN DER SPERRE HÄNGT, KOSTET NICHTS', async () => {
    // Der erste Lauf hält die Sperre, solange sein Generator arbeitet.
    generator.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 40))
      return {
        draft: 'Ein echter Entwurf.',
        model: 'test-model',
        provider: 'test',
        promptVersion: 'p-1',
        aborted: false,
      }
    })
    const first = fakeEvent()
    const running = handler(first.event)
    const second = fakeEvent()
    await handler(second.event)
    await running

    expect(readBack(second.chunks)[0]).toMatchObject({
      type: 'generation.failed',
      code: 'generation_active',
    })
    // Nur der ERSTE hat gebucht — der abgewiesene zweite nicht.
    expect(hits).toEqual([SLOT_BUCKET, ACCOUNT_BUCKET, INSTANCE_BUCKET])
  })

  it('DER KILL-SWITCH KOMMT VOR JEDER BUCHUNG', async () => {
    appConfigRow = { $id: 'global', brandAiEnabled: false }
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks)[0]).toMatchObject({ type: 'generation.failed', code: 'ai_disabled' })
    // Kein Eimer, kein Generator: ein abgeschalteter Dienst kostet nichts.
    expect(hits).toEqual([])
    expect(generator).not.toHaveBeenCalled()
  })

  it('EIN CACHE-TREFFER KOSTET KEIN KONTINGENT', async () => {
    body = { slotId: 'a.pitch', idempotencyKey: 'k1' }
    const first = fakeEvent()
    await handler(first.event)
    expect(hits).toEqual([SLOT_BUCKET, ACCOUNT_BUCKET, INSTANCE_BUCKET])

    hits = []
    const second = fakeEvent()
    await handler(second.event)
    expect(readBack(second.chunks).at(-1)).toMatchObject({ reused: true })
    // „Was nichts kostet, kostet kein Kontingent" (Plan §6).
    expect(hits).toEqual([])
    expect(generator).toHaveBeenCalledOnce()
  })
})

describe('Der Dev-Stub bucht nichts', () => {
  it('läuft durch, ohne einen einzigen Eimer anzufassen', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)!.type).toBe('generation.completed')
    // Er rechnet eine Zeichenkette zusammen — dafür zahlt niemand.
    expect(hits).toEqual([])
  })
})

/**
 * DAS BEREITSCHAFTS-GATE AN DER ROUTE (Davids „zu wenig ist zu wenig").
 *
 * Die Regel selbst prüft `brandSlotReadiness.test.ts`. Hier zählt der ORT: das
 * Nein muss VOR jeder Buchung und VOR dem Strom kommen, und es darf nur dann
 * fallen, wenn wirklich generiert würde. Ein Gate, das bei ausgeschalteter KI
 * feuert, gäbe dem Menschen die falsche Auskunft — die über sein Material statt
 * die über den Dienst.
 */
describe('Bereitschafts-Gate', () => {
  const emptyCard = { websiteUrl: '', industry: '', about: '', audience: '' }
  let saved: Record<string, unknown>

  beforeEach(() => {
    saved = {
      websiteUrl: profileRow.websiteUrl,
      industry: profileRow.industry,
      about: profileRow.about,
      audience: profileRow.audience,
    }
  })

  afterEach(() => { Object.assign(profileRow, saved) })

  it('LEHNT MIT 409 ab, wenn die Startkarte nichts hergibt', async () => {
    Object.assign(profileRow, emptyCard)
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({
      status: 409,
      data: { code: 'not_ready' },
    })
    // Kein Eimer, kein Schreibvorgang, kein Strom: der Klick kostet nichts.
    expect(hits).toEqual([])
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })

  it('a.competitors braucht die Website — die volle Startkarte reicht dafür NICHT', async () => {
    body = { slotId: 'a.competitors' }
    const { event } = fakeEvent()
    await expect(handler(event)).rejects.toMatchObject({ status: 409, data: { code: 'not_ready' } })

    // Mit eingelesener Website geht derselbe Klick durch.
    profileRow.siteAnalysis = 'Wir rösten seit 2019. Unsere Nachbarn: Kona Roasters.'
    const second = fakeEvent()
    await handler(second.event)
    expect(readBack(second.chunks).at(-1)!.type).toBe('generation.completed')
    delete profileRow.siteAnalysis
  })

  it('DIE VOLLE STARTKARTE GENÜGT — das Gate ist keine Sackgasse', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)!.type).toBe('generation.completed')
  })

  it('KI AUS schlägt das Gate: der Mensch erfährt den Dienst-Zustand, nicht sein Material', async () => {
    Object.assign(profileRow, emptyCard)
    appConfigRow = { $id: 'global', brandAiEnabled: false }
    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks)[0]).toMatchObject({ type: 'generation.failed', code: 'ai_disabled' })
  })
})

/**
 * DER RÜCKFRAGE-ZWEIG (george-a-4, Befund B3) — der heikelste Teil des Umbaus:
 * ein Lauf, der KEINEN Slot anfasst und trotzdem als Erfolg endet.
 *
 * Drei Aussagen, die man beim Aufräumen als Erstes verliert:
 *  1. kein `slot.ready` — sonst schriebe der Client die Frage ins Feld;
 *  2. keine `slots` und kein `inputHash` in der Zeile — sonst gälte ein alter
 *     Entwurf plötzlich wieder als „aus dem aktuellen Stand entstanden";
 *  3. ein Historien-Eintrag OHNE `draft` — sonst böte die
 *     Fassungs-Wiederherstellung eine Frage zum Übernehmen an.
 */
describe('Rückfrage statt Entwurf', () => {
  beforeEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearActiveBrandGenerations()
    module.registerBrandSlotGenerator('context', (async (context: {
      onDelta: (text: string) => Promise<void> | void
    }) => {
      await context.onDelta('Wen nennt ihr zuerst?')
      return {
        draft: '',
        message: 'Wen nennt ihr zuerst?',
        outcome: 'question' as const,
        model: 'test-model',
        provider: 'test',
        promptVersion: 'george-a-4',
        aborted: false,
      }
    }) as never)
  })

  afterEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearBrandSlotGenerators()
    module.clearActiveBrandGenerations()
  })

  it('sendet KEIN slot.ready und meldet `outcome: question`', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)
    const events = readBack(chunks)
    expect(events.some(item => item.type === 'slot.ready')).toBe(false)
    expect(events.at(-1)).toMatchObject({ type: 'generation.completed', outcome: 'question' })
    // Die Frage lief trotzdem als Zug durch den Strom.
    expect(events.filter(item => item.type === 'message.delta')).toHaveLength(1)
  })

  it('SCHREIBT KEINEN SLOT UND KEINEN inputHash — nur Historie und Fassung', async () => {
    const { event } = fakeEvent()
    await handler(event)
    const data = tablesDB.updateRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_steps')!.data

    expect(data.slots).toBeUndefined()
    expect(data.inputHash).toBeUndefined()
    // Die `revision` steigt trotzdem: die Zeile HAT sich geändert, und der
    // Autosave des Menschen liefe sonst in einen 409, den niemand ausgelöst hat.
    expect(data.revision).toBe(4)

    const generations = JSON.parse(String(data.generations)) as BrandGenerationsView
    expect(generations.count).toBe(1)
    expect(generations.items[0]!.outcome).toBe('question')
    expect(generations.items[0]!.draft).toBeUndefined()
  })

  it('legt die Frage als Zug in den Verlauf — erkennbar als Frage', async () => {
    const { event } = fakeEvent()
    await handler(event)
    const message = tablesDB.createRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_messages')!.data
    expect(message.body).toBe('Wen nennt ihr zuerst?')
    expect(JSON.parse(String(message.parts))).toMatchObject({ kind: 'question' })
  })
})

/**
 * DIE RAHMUNG (B2): der Chat-Zug und der Feldwert sind seit a-4 zwei
 * verschiedene Zeichenketten. Was wohin gehört, entscheidet der Generator —
 * die Route muss es nur auseinanderhalten.
 */
describe('Gerahmter Entwurf', () => {
  beforeEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearActiveBrandGenerations()
    module.registerBrandSlotGenerator('context', (async () => ({
      draft: 'Wir rösten Kaffee.',
      message: 'Aus eurem Startbogen.\n\nWir rösten Kaffee.\n\nTrifft das?',
      outcome: 'draft' as const,
      model: 'test-model',
      provider: 'test',
      promptVersion: 'george-a-4',
      aborted: false,
    })) as never)
  })

  afterEach(async () => {
    const module = await import('../server/utils/brandGenerators')
    module.clearBrandSlotGenerators()
    module.clearActiveBrandGenerations()
  })

  it('DER SLOT BEKOMMT DEN WERT, DER VERLAUF DEN GERAHMTEN ZUG', async () => {
    const { event, chunks } = fakeEvent()
    await handler(event)

    const ready = readBack(chunks).find(item => item.type === 'slot.ready') as { draft: string }
    expect(ready.draft).toBe('Wir rösten Kaffee.')

    const data = tablesDB.updateRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_steps')!.data
    const slots = JSON.parse(String(data.slots)) as Record<string, { latestDraft: string }>
    // Im FELD steht nur der Wert — keine Basis-Zeile, keine Frage.
    expect(slots['a.pitch']!.latestDraft).toBe('Wir rösten Kaffee.')

    const message = tablesDB.createRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_messages')!.data
    expect(message.body).toBe('Aus eurem Startbogen.\n\nWir rösten Kaffee.\n\nTrifft das?')
    expect(JSON.parse(String(message.parts))).toMatchObject({ kind: 'draft' })
  })

  it('OHNE `message` bleibt es beim Stand von a-3: der Entwurf IST der Zug', async () => {
    const module = await import('../server/utils/brandGenerators')
    module.registerBrandSlotGenerator('context', (async () => ({
      draft: 'Nur der Wert.',
      model: 'test-model',
      provider: 'test',
      promptVersion: 'p-1',
      aborted: false,
    })) as never)

    const { event, chunks } = fakeEvent()
    await handler(event)
    expect(readBack(chunks).at(-1)).toMatchObject({ outcome: 'draft' })
    const message = tablesDB.createRow.mock.calls
      .map(call => call[0] as { tableId: string, data: Record<string, unknown> })
      .find(call => call.tableId === 'brand_messages')!.data
    expect(message.body).toBe('Nur der Wert.')
  })
})
