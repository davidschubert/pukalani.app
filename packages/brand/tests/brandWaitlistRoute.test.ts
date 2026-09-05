import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { AppwriteException } from 'node-appwrite'

/**
 * DIE WARTELISTE, DURCHGESPIELT — gefälschte Ablage, echter Handler.
 *
 * Vier Aussagen hängen NICHT in einer puren Funktion, sondern in der
 * Reihenfolge der Route, und genau die verrutscht beim Umbauen still:
 *
 *  1. Die Dublette schreibt NICHT. Täte sie es, überschriebe die zweite
 *     Anfrage einer Person die Betreiber-Notiz der ersten.
 *  2. Der Honigtopf antwortet WIE DER ERFOLG — und schreibt nichts. Ein
 *     abweichender Status wäre die Rückmeldung, an der ein Bot lernt.
 *  3. Eine kaputte Ablage wird zu 503 mit `waitlist_unavailable`, nicht zu
 *     einem 500 (das Formular soll „später nochmal" sagen können).
 *  4. Die Betreiber-Mail ist FAIL-SOFT und steht außerhalb des try — ein
 *     SMTP-Aussetzer darf aus einer gespeicherten Anfrage kein 503 machen,
 *     sonst trägt sich derselbe Mensch ein zweites Mal ein.
 */

interface FakeRow { $id: string, [key: string]: unknown }

/** Was in der Tabelle liegt, wenn die Route nachsieht. */
let stored: FakeRow[]
/** Wirft die Ablage? (fehlende Tabelle / kranke Appwrite) */
let storeBroken: boolean
/** Die Empfänger-Adresse aus der App-Config ('' = keine Mail). */
let notifyTo: string
/** Wirft der Mailer? */
let mailBroken: boolean
/** Die zugestellten Mails dieses Laufs. */
let mails: { to: string, subject: string, text: string }[]
let logs: { level: string, event: string, data: Record<string, unknown> }[]
let body: Record<string, unknown>

const tablesDB = {
  listRows: vi.fn(async () => {
    if (storeBroken) throw new AppwriteException('Table not found', 404)
    return { rows: stored, total: stored.length }
  }),
  createRow: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    if (storeBroken) throw new AppwriteException('Table not found', 404)
    const row = { $id: `w${stored.length + 1}`, ...data }
    stored.push(row)
    return row
  }),
}

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appwriteDatabaseId: 'main' } }))
vi.stubGlobal('useAppConfig', () => ({ pukalani: { brand: { waitlistNotify: notifyTo } } }))
vi.stubGlobal('createAdminClient', () => ({ tablesDB }))
vi.stubGlobal('createError', (init: Record<string, unknown>) =>
  Object.assign(new Error(String(init.statusText)), init, { statusCode: init.status }))
vi.stubGlobal('logEvent', (level: string, event: string, data: Record<string, unknown> = {}) => {
  logs.push({ level, event, data })
})
vi.stubGlobal('readValidatedBody', async (_event: H3Event, parse: (input: unknown) => unknown) => parse(body))
vi.stubGlobal('sendMail', async (_event: H3Event, mail: { to: string, subject: string, text: string }) => {
  if (mailBroken) throw new Error('SMTP down')
  mails.push(mail)
  return true
})

const handler = (await import('../server/api/brand/waitlist.post'))
  .default as unknown as (event: H3Event) => Promise<{ ok: true, duplicate: boolean }>

const event = { context: {} } as unknown as H3Event

/** Eine Zeile, wie die Route sie schreibt. */
function lastWrite(): Record<string, unknown> {
  const call = tablesDB.createRow.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> } | undefined
  return call?.data ?? {}
}

beforeEach(() => {
  stored = []
  storeBroken = false
  notifyTo = ''
  mailBroken = false
  mails = []
  logs = []
  body = { email: 'Aloha@Kailua.Coffee', name: 'Kai', company: 'Kailua Coffee', website: 'kailua.coffee', locale: 'de', source: 'about' }
  tablesDB.listRows.mockClear()
  tablesDB.createRow.mockClear()
})

describe('POST /api/brand/waitlist', () => {
  it('legt eine neue Anfrage an — mit normalisierter Adresse und Status "new"', async () => {
    const result = await handler(event)

    expect(result).toEqual({ ok: true, duplicate: false })
    expect(tablesDB.createRow).toHaveBeenCalledTimes(1)
    expect(lastWrite()).toEqual({
      emailLower: 'aloha@kailua.coffee',
      email: 'aloha@kailua.coffee',
      name: 'Kai',
      company: 'Kailua Coffee',
      website: 'https://kailua.coffee',
      locale: 'de',
      source: 'about',
      status: 'new',
      note: '',
    })
  })

  it('protokolliert nur Herkunft, Sprache und Dubletten-Lage — nie die Adresse', async () => {
    await handler(event)
    const joined = logs.find(entry => entry.event === 'brand.waitlist_joined')
    expect(joined?.data).toEqual({ source: 'about', locale: 'de', duplicate: false })
    expect(JSON.stringify(joined)).not.toContain('kailua.coffee')
  })

  it('erkennt die Dublette und schreibt NICHT', async () => {
    stored = [{ $id: 'w1', emailLower: 'aloha@kailua.coffee', status: 'invited' }]

    const result = await handler(event)

    expect(result).toEqual({ ok: true, duplicate: true })
    expect(tablesDB.createRow).not.toHaveBeenCalled()
    // Auch die Betreiber-Mail bleibt aus: gemeldet wurde diese Person schon.
    expect(mails).toHaveLength(0)
    expect(logs.find(entry => entry.event === 'brand.waitlist_joined')?.data.duplicate).toBe(true)
  })

  it('fragt mit Limit 1 nach der kleingeschriebenen Adresse', async () => {
    await handler(event)
    const queries = (tablesDB.listRows.mock.calls[0]?.[0] as { queries: string[] }).queries
    expect(queries).toHaveLength(2)
    expect(queries.join(' ')).toContain('aloha@kailua.coffee')
    expect(queries.join(' ')).toContain('limit')
  })

  it('HONIGTOPF: antwortet wie der Erfolg, speichert aber nichts', async () => {
    body = { ...body, hp: 'ich bin ein Skript' }

    const result = await handler(event)

    expect(result).toEqual({ ok: true, duplicate: false })
    expect(tablesDB.listRows).not.toHaveBeenCalled()
    expect(tablesDB.createRow).not.toHaveBeenCalled()
    expect(mails).toHaveLength(0)
    expect(logs.map(entry => entry.event)).toContain('brand.waitlist_honeypot')
  })

  it('kaputte Ablage ⇒ 503 mit `waitlist_unavailable`, Adresse nur maskiert im Log', async () => {
    storeBroken = true

    await expect(handler(event)).rejects.toMatchObject({
      status: 503,
      data: { code: 'waitlist_unavailable' },
    })
    const warned = logs.find(entry => entry.event === 'brand.waitlist_unavailable')
    expect(warned?.level).toBe('warn')
    expect(warned?.data.email).toBe('a***@kailua.coffee')
  })

  it('meldet dem Betreiber, sobald eine Adresse konfiguriert ist', async () => {
    notifyTo = 'hallo@pukalani.app'

    await handler(event)

    expect(mails).toHaveLength(1)
    expect(mails[0]!.to).toBe('hallo@pukalani.app')
    expect(mails[0]!.subject).toBe('Neue Warteliste-Anfrage: Kailua Coffee')
    expect(mails[0]!.text).toContain('aloha@kailua.coffee')
    expect(mails[0]!.text).toContain('about')
  })

  it('ohne Firma trägt der Betreff die Adresse', async () => {
    notifyTo = 'hallo@pukalani.app'
    body = { ...body, company: '' }

    await handler(event)

    expect(mails[0]!.subject).toBe('Neue Warteliste-Anfrage: aloha@kailua.coffee')
  })

  it('ein Mail-Fehler ändert die Antwort NICHT — die Zeile steht bereits', async () => {
    notifyTo = 'hallo@pukalani.app'
    mailBroken = true

    const result = await handler(event)

    expect(result).toEqual({ ok: true, duplicate: false })
    expect(tablesDB.createRow).toHaveBeenCalledTimes(1)
  })
})
