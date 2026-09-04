import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

/**
 * DER AUTOSAVE ALS TÜRSTEHER — die Bestätigungs-Sperre, durchgespielt.
 *
 * Davids Entscheidung (2026-09-02): „wenn confirmed müsste es unmöglich sein
 * zu korrigieren, außer wir klicken auf einen Button Korrigieren." Die
 * Oberfläche setzt das um (`brandSlotControls`, eigene Datei), aber eine
 * Oberfläche ist kein Schutz: ein zweiter Tab, ein alter Client oder ein
 * direkter Aufruf gingen daran vorbei. Deshalb ist die Route der Ort, an dem
 * die Regel wirklich gilt — und deshalb wird sie hier gemessen.
 *
 * WARUM DAS WICHTIG IST: vorher nahm die Route die Änderung an und schrieb
 * einen neuen `latestDraft` NEBEN das unveränderte `confirmed`. Der Mensch sah
 * seinen neuen Text im Feld, das Dokument (`confirmedSlotValues`, die Grundlage
 * jeder Veröffentlichung) trug weiter den alten — und niemand erfuhr davon.
 * Genau diese Divergenz prüft der letzte Test.
 */

const profileRow = {
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
  progressPct: 0,
  currentStepKey: 'context',
  lastActivityAt: '2026-08-01T00:00:00.000Z',
}

interface FakeRow { $id: string, [key: string]: unknown }

let stepRow: FakeRow
let body: Record<string, unknown>

const tablesDB = {
  getRow: vi.fn(async ({ tableId }: { tableId: string }) => {
    if (tableId === 'brand_profiles') return profileRow
    if (tableId === 'brand_steps') return stepRow
    throw new Error(`unerwartete Tabelle ${tableId}`)
  }),
  listRows: vi.fn(async ({ tableId }: { tableId: string }) => (tableId === 'brand_steps'
    ? { rows: [stepRow] }
    : { rows: [] })),
  updateRow: vi.fn(async ({ tableId, data }: { tableId: string, data: Record<string, unknown> }) => {
    if (tableId === 'brand_steps') Object.assign(stepRow, data)
    return stepRow
  }),
}

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
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
vi.stubGlobal('readBody', async () => body)

const handler = (await import('../server/api/brand/profiles/[id]/steps/[stepKey].patch'))
  .default as unknown as (event: H3Event) => Promise<{ revision: number, slots: Record<string, { latestDraft: string | null, confirmed: string | null }> }>

const event = { context: {} } as unknown as H3Event

/** Der Stand, wie er nach dem Lauf in der Tabelle steht. */
function storedSlots(): Record<string, { firstDraft?: string | null, latestDraft?: string | null, confirmed?: string | null }> {
  return JSON.parse(String(stepRow.slots))
}

beforeEach(() => {
  stepRow = {
    $id: 'p1_context',
    profileId: 'p1',
    stepKey: 'context',
    state: 'active',
    slots: '{}',
    generations: '{"items":[],"count":0}',
    revision: 3,
    activeSeconds: 0,
    startedAt: '2026-08-01T00:00:00.000Z',
  }
  tablesDB.updateRow.mockClear()
})

describe('PATCH …/steps/:stepKey — bestätigen und aufheben', () => {
  it('BESTÄTIGT den Text, der nach diesem Speichern gilt', async () => {
    body = { revision: 3, slots: { 'a.pitch': { value: 'Wir rösten Kaffee.', confirmed: true } } }
    const response = await handler(event)

    expect(response.revision).toBe(4)
    expect(response.slots['a.pitch']).toMatchObject({
      firstDraft: 'Wir rösten Kaffee.',
      latestDraft: 'Wir rösten Kaffee.',
      confirmed: 'Wir rösten Kaffee.',
    })
  })

  it('HEBT DIE BESTÄTIGUNG AUF — „Korrigieren" ist die Tür zurück', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'alt', latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.pitch': { confirmed: false } } }
    const response = await handler(event)

    expect(response.slots['a.pitch']!.confirmed).toBeNull()
    // Der TEXT bleibt stehen — aufheben ist kein Verwerfen.
    expect(response.slots['a.pitch']!.latestDraft).toBe('alt')
  })

  it('LEHNT eine Wert-Änderung am bestätigten Slot mit 409 `slot_confirmed` ab', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'alt', latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'heimlich neu' } } }

    await expect(handler(event)).rejects.toMatchObject({
      status: 409,
      data: { code: 'slot_confirmed' },
    })
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })

  it('LEHNT auch das erneute Bestätigen mit anderem Text ab', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'neu', confirmed: true } } }
    await expect(handler(event)).rejects.toMatchObject({ status: 409, data: { code: 'slot_confirmed' } })
  })

  it('LÄSST aufheben UND schreiben in EINEM Zug durch — dieselbe Tür, ein Handgriff', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'alt', latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'korrigiert', confirmed: false } } }
    const response = await handler(event)

    expect(response.slots['a.pitch']).toMatchObject({
      // Der ERSTE Entwurf bleibt für immer stehen (Versions-Vertrag).
      firstDraft: 'alt',
      latestDraft: 'korrigiert',
      confirmed: null,
    })
  })

  it('SPERRT NUR DEN BESTÄTIGTEN SLOT, nicht den ganzen Baustein', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.category': { value: 'Kaffeerösterei' } } }
    const response = await handler(event)
    expect(response.slots['a.category']!.latestDraft).toBe('Kaffeerösterei')
    expect(response.slots['a.pitch']!.confirmed).toBe('alt')
  })

  it('GEGENPROBE: derselbe Patch OHNE Bestätigung geht durch', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'alt', latestDraft: 'alt', confirmed: null } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'ganz normal' } } }
    const response = await handler(event)
    expect(response.slots['a.pitch']!.latestDraft).toBe('ganz normal')
  })

  it('DAS WAR DER BEFUND: ohne Sperre liefen Feld und Dokument auseinander', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { firstDraft: 'alt', latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'was der Mensch jetzt sieht' } } }

    await expect(handler(event)).rejects.toMatchObject({ data: { code: 'slot_confirmed' } })

    // Der entscheidende Teil: die Zeile ist UNVERÄNDERT. Vorher stand hier
    // `latestDraft: 'was der Mensch jetzt sieht'` neben `confirmed: 'alt'` —
    // zwei Wahrheiten, und veröffentlicht wurde die alte.
    expect(storedSlots()['a.pitch']).toEqual({
      firstDraft: 'alt',
      latestDraft: 'alt',
      confirmed: 'alt',
    })
  })

  it('EINE LEERE ZEICHENKETTE IST KEINE BESTÄTIGUNG', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { latestDraft: 'alt', confirmed: '' } })
    body = { revision: 3, slots: { 'a.pitch': { value: 'neu' } } }
    const response = await handler(event)
    expect(response.slots['a.pitch']!.latestDraft).toBe('neu')
  })

  it('DIE `revision` GEHT VOR: ein Konflikt wird als Konflikt gemeldet', async () => {
    stepRow.slots = JSON.stringify({ 'a.pitch': { latestDraft: 'alt', confirmed: 'alt' } })
    body = { revision: 1, slots: { 'a.pitch': { value: 'neu' } } }
    // Sonst bekäme ein veralteter Tab `slot_confirmed` statt des Dialogs, der
    // ihm seine eigene Fassung zeigt.
    await expect(handler(event)).rejects.toMatchObject({ data: { code: 'revision_conflict' } })
  })

  it('EINEN LEEREN SLOT ZU BESTÄTIGEN bleibt abgelehnt (`slot_empty`)', async () => {
    body = { revision: 3, slots: { 'a.pitch': { confirmed: true } } }
    await expect(handler(event)).rejects.toMatchObject({ status: 400, data: { code: 'slot_empty' } })
  })
})

/**
 * „NOCHMAL VON VORN" (C5, 2026-09-03): die pure `reopen`-Transition war
 * UNVERDRAHTET — kein API-Weg löste sie je aus, der Chip auf einem
 * abgeschlossenen Kapitel speicherte nur die Konfidenz und der Baustein
 * blieb `done`. Jetzt trägt der Autosave-PATCH ein optionales `reopen`.
 */
describe('PATCH …/steps/:stepKey — „Nochmal von vorn" (reopen)', () => {
  it('ÖFFNET einen abgeschlossenen Baustein wieder — Konfidenz im selben Zug', async () => {
    stepRow.state = 'done'
    stepRow.confidence = 'fits'
    body = { revision: 3, reopen: true, confidence: 'restart' }

    const response = await handler(event)

    expect(response.revision).toBe(4)
    expect(stepRow.state).toBe('active')
    expect(stepRow.confidence).toBe('restart')
  })

  it('GEGENPROBE: reopen auf einem offenen Baustein wird mit `not_done` abgewiesen', async () => {
    body = { revision: 3, reopen: true }

    await expect(handler(event)).rejects.toMatchObject({ status: 400, data: { code: 'not_done' } })
    expect(tablesDB.updateRow).not.toHaveBeenCalled()
  })
})

/**
 * DER GERECHNETE ZUSTAND SCHLÄGT DEN ROHEN (Davids Durchspiel-Audit
 * 2026-09-03): `open` ist kein gespeicherter Zustand — eine Zeile, deren
 * Vorgänger fertig wird, bleibt roh `locked`. Mit dem rohen Zustand nahm der
 * Start-Zweig solche Bausteine nie mit, und `setConfidence` prallte mit
 * `step_locked` ab: Krume & Golds pvm stand mit 10/10 bestätigten Feldern da
 * und liess sich trotzdem nicht abschliessen („Passt" ⇒ stilles 400).
 */
describe('PATCH …/steps/:stepKey — roh verriegelt, aber auf dem Weg erreichbar', () => {
  it('NIMMT Konfidenz an: die Journey rechnet die Zeile `open`, der Start greift', async () => {
    stepRow.state = 'locked'
    body = { revision: 3, confidence: 'almost' }

    const response = await handler(event)

    expect(response.revision).toBe(4)
    expect(stepRow.state).toBe('active')
    expect(stepRow.confidence).toBe('almost')
  })
})
