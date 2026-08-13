import { beforeEach, describe, expect, it } from 'vitest'
import type { Models } from 'node-appwrite'
import type { TenantDb } from '../server/utils/tenantDb'
import {
  __resetCommunityExportContributors,
  collectTenantRows,
  listCommunityExportContributors,
  registerCommunityExportContributor,
} from '../server/utils/communityExport'

function contributor(id: string) {
  return { id, exportCommunityData: async () => ({}) }
}

describe('CommunityExportContributor-Registry', () => {
  beforeEach(() => __resetCommunityExportContributors())

  it('registriert idempotent und listet deterministisch sortiert', () => {
    registerCommunityExportContributor(contributor('posts'))
    registerCommunityExportContributor(contributor('comments'))
    registerCommunityExportContributor(contributor('pages'))
    // Doppel-Registrierung (HMR) überschreibt, dupliziert nicht
    registerCommunityExportContributor(contributor('comments'))

    expect(listCommunityExportContributors().map(c => c.id)).toEqual(['comments', 'pages', 'posts'])
  })

  it('ohne registrierten Layer ist die Liste leer (App ohne den Layer)', () => {
    expect(listCommunityExportContributors()).toEqual([])
  })
})

/**
 * Fake-Datentür: liefert `rows` seitenweise gemäß limit/cursorAfter und
 * PROTOKOLLIERT die Queries — der Beweis, dass die Schleife den Cursor
 * weiterreicht und die Filter des Aufrufers nicht verliert.
 */
function fakeTenantDb(rows: { $id: string }[]) {
  const calls: string[][] = []
  const db = {
    list: async (_tableId: string, queries: string[]) => {
      calls.push(queries)
      const limit = Number(JSON.parse(queries.find(q => q.includes('"limit"'))!).values[0])
      const cursorQuery = queries.find(q => q.includes('cursorAfter'))
      const cursor = cursorQuery ? String(JSON.parse(cursorQuery).values[0]) : undefined
      const start = cursor ? rows.findIndex(r => r.$id === cursor) + 1 : 0
      return { total: rows.length, rows: rows.slice(start, start + limit) }
    },
  }
  return { db: db as unknown as TenantDb, calls }
}

const makeRows = (n: number) => Array.from({ length: n }, (_, i) => ({ $id: `row-${i}` }))

describe('collectTenantRows', () => {
  it('leere Tabelle → leeres Ergebnis, ein Aufruf', async () => {
    const { db, calls } = fakeTenantDb([])
    expect(await collectTenantRows(db, 't')).toEqual([])
    expect(calls).toHaveLength(1)
  })

  it('eine Teilseite → ein Aufruf', async () => {
    const { db, calls } = fakeTenantDb(makeRows(7))
    expect((await collectTenantRows(db, 't')).length).toBe(7)
    expect(calls).toHaveLength(1)
  })

  it('2,5 Seiten → drei Aufrufe mit Cursor-Weitergabe, vollständig', async () => {
    const { db, calls } = fakeTenantDb(makeRows(250))
    const result = await collectTenantRows<Models.Row>(db, 't')
    expect(result.length).toBe(250)
    expect(result.at(-1)!.$id).toBe('row-249')
    expect(calls).toHaveLength(3)
    expect(calls[1]!.some(q => q.includes('row-99'))).toBe(true)
    expect(calls[2]!.some(q => q.includes('row-199'))).toBe(true)
  })

  it('reicht die Filter des Aufrufers auf JEDER Seite mit', async () => {
    const { db, calls } = fakeTenantDb(makeRows(150))
    await collectTenantRows(db, 't', ['{"method":"equal","attribute":"status","values":["published"]}'])
    expect(calls).toHaveLength(2)
    expect(calls.every(q => q.some(entry => entry.includes('published')))).toBe(true)
  })
})
