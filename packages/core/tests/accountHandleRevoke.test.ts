import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

/**
 * „ALLE ZEILEN" MUSS ALLE ZEILEN HEISSEN (Audit-Punkt AU2, 2026-08-15).
 *
 * `revokeAccountHandleAudience` nimmt einer Community den Blick auf den @namen
 * eines Kontos — auch auf dessen FRÜHERE Schreibweisen, damit eine alte
 * Erwähnung in einer fremden Community nicht länger sichtbar bleibt als die
 * aktuelle. Genau das stand im Kopf der Funktion; im Code stand ein einzelnes
 * `Query.limit(25)` ohne Schleife.
 *
 * Der Fehler war unsichtbar und blieb es: eine Handle-Historie wächst um eine
 * Zeile je 30 Tage, die 26. gibt es in keinem Testdatensatz — und selbst wenn,
 * fällt eine zu viel sehende Community niemandem auf. Deshalb hier eine echte
 * Attrappe mit MEHR als einer Seite.
 *
 * Gestubbt sind die drei Auto-Imports, die der Dienst benutzt (Muster wie in
 * `mailerWarning.test.ts`). Die Permissions-Rechnung selbst wird NICHT
 * nachgebaut — sie ist die echte aus `shared/accountHandleAudience.ts`.
 */
interface FakeRow {
  $id: string
  $permissions: string[]
  userId: string
}

const zeilen: FakeRow[] = []
/** Was die Attrappe an Abfragen gesehen hat — je Aufruf ein Eintrag. */
const abfragen: string[][] = []

const listRows = vi.fn(async ({ queries }: { queries: string[] }) => {
  abfragen.push(queries)
  const gefiltert = zeilen.filter(row => row.userId === 'u1')
  // Die Attrappe versteht genau so viel Appwrite-Abfragesprache, wie die
  // Funktion benutzt: ein Limit und einen Cursor.
  const limit = Number(/"limit","values":\[(\d+)\]/.exec(queries.join(''))?.[1] ?? 25)
  const cursor = /"cursorAfter","values":\["([^"]+)"\]/.exec(queries.join(''))?.[1]
  const start = cursor ? gefiltert.findIndex(row => row.$id === cursor) + 1 : 0
  return { rows: gefiltert.slice(start, start + limit), total: gefiltert.length }
})

const updateRow = vi.fn(async ({ rowId, permissions }: { rowId: string, permissions: string[] }) => {
  const row = zeilen.find(r => r.$id === rowId)
  if (row) row.$permissions = permissions
  return row
})

vi.stubGlobal('createAdminClient', () => ({ tablesDB: { listRows, updateRow } }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appwriteDatabaseId: 'db' } }))
vi.stubGlobal('useTenant', () => ({ mode: 'pool', communityId: 'c-eigen' }))

const { revokeAccountHandleAudience } = await import('../server/utils/accountHandles')

/** Die Funktion liest aus dem Event nur, was die Attrappen ohnehin liefern. */
const event = {} as H3Event

function seed(anzahl: number) {
  zeilen.length = 0
  for (let i = 0; i < anzahl; i++) {
    zeilen.push({
      $id: `h${i}`,
      userId: 'u1',
      $permissions: [
        'read("label:c-fremd")',
        'read("label:c-bleibt")',
        'update("user:u1")',
      ],
    })
  }
}

describe('revokeAccountHandleAudience', () => {
  beforeEach(() => {
    abfragen.length = 0
    listRows.mockClear()
    updateRow.mockClear()
  })

  it('nimmt der Community jede Handle-Zeile des Kontos, über Seitengrenzen hinweg', async () => {
    seed(230)
    await revokeAccountHandleAudience(event, 'u1', 'c-fremd')

    // KEINE einzige Zeile darf die Rolle behalten. Mit dem alten `limit(25)`
    // ohne Schleife blieben hier 205 übrig.
    const uebrig = zeilen.filter(row => row.$permissions.includes('read("label:c-fremd")'))
    expect(uebrig).toHaveLength(0)
    // Mehr als eine Seite wurde geholt, und die Folgeseiten liefen über einen
    // Cursor (nicht über einen Offset, der beim Schreiben Zeilen überspringt).
    expect(listRows.mock.calls.length).toBeGreaterThan(1)
    expect(abfragen.slice(1).every(q => q.join('').includes('cursorAfter'))).toBe(true)
  })

  it('lässt andere Communities in Ruhe', async () => {
    seed(30)
    await revokeAccountHandleAudience(event, 'u1', 'c-fremd')
    expect(zeilen.every(row => row.$permissions.includes('read("label:c-bleibt")'))).toBe(true)
    expect(zeilen.every(row => row.$permissions.includes('update("user:u1")'))).toBe(true)
  })

  it('schreibt nur, wo die Rolle wirklich steht', async () => {
    seed(3)
    await revokeAccountHandleAudience(event, 'u1', 'c-niewardahier')
    // Nichts zu entfernen ⇒ kein einziger Schreibvorgang. Die Funktion liegt
    // im Request eines Rollen-Entzugs; eine wirkungslose Aktualisierung je
    // Zeile wäre Last ohne Ergebnis.
    expect(updateRow).not.toHaveBeenCalled()
  })

  it('fragt gar nicht erst ohne Konto oder ohne Community', async () => {
    seed(3)
    await revokeAccountHandleAudience(event, '', 'c-fremd')
    await revokeAccountHandleAudience(event, 'u1', '')
    expect(listRows).not.toHaveBeenCalled()
  })

  it('bleibt fail-soft: eine tote Abfrage wirft nicht in den Aufrufer', async () => {
    seed(3)
    listRows.mockRejectedValueOnce(new Error('Appwrite weg'))
    await expect(revokeAccountHandleAudience(event, 'u1', 'c-fremd')).resolves.toBeUndefined()
  })
})
