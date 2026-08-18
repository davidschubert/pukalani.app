import { describe, expect, it } from 'vitest'
import {
  assertDistinctProjects,
  differingFields,
  missingInTarget,
  resourceFromPath,
  rowDecisionFor,
  rowPayloadOf,
  rowTransferOf,
  samePayload,
  samePermissions,
  scopeErrorHint,
  userDiffFields,
  userTransferPlan,
} from '../../../scripts/ops/ah4c-lib/rules.mts'

/**
 * AH-4c — die Rechenwege des Projekt-Umzugs `control` → `admin`.
 *
 * Was hier hängt, ist NICHT die Übersetzung (die gibt es beim 1:1-Umzug nicht),
 * sondern der VERGLEICH: er trägt den Delta-Lauf direkt vor dem Env-Schnitt
 * (Runbook Schritt 4). Ein zu großzügiger Vergleich lässt eine veraltete Zeile
 * stehen, ein zu strenger schreibt bei jedem Lauf alles neu — beides läuft
 * grün durch und fällt erst im Betrieb auf.
 *
 * Werkzeug: scripts/ops/ah4c-project-transfer.mjs ·
 * Ablauf: docs/runbooks/ADMIN-PROJEKT-CUTOVER.md
 */

const ROW = {
  $id: 'r1',
  $permissions: ['read("any")', 'update("user:u1")'],
  $createdAt: '2026-01-01T00:00:00.000Z',
  $updatedAt: '2026-01-02T00:00:00.000Z',
  $tableId: 'tickets',
  $databaseId: 'main',
  $sequence: 7,
  title: 'Hallo',
  count: 3,
  tags: ['a', 'b'],
  nested: { a: 1, b: [2, 3] },
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 1 — Nutzdaten: alle $-Metafelder bleiben zurück', () => {
  it('lässt nur die Spalten übrig', () => {
    expect(Object.keys(rowPayloadOf(ROW))).toEqual(['title', 'count', 'tags', 'nested'])
  })

  it('nimmt $id und $permissions NICHT in die Nutzdaten', () => {
    // Beide wandern mit, aber als eigene Felder des Requests (`rowId`,
    // `permissions`). Im `data`-Objekt wären sie „Unknown attribute" — und das
    // fiele erst beim ECHTEN Lauf auf, nie im Trockenlauf.
    const payload = rowPayloadOf(ROW)
    expect(payload).not.toHaveProperty('$id')
    expect(payload).not.toHaveProperty('$permissions')
  })

  it('baut daraus den Schreib-Auftrag mit unveränderter Id und Permissions', () => {
    // 1:1-Umzug: kein Id-Remapping, keine Permission-Übersetzung — genau das
    // unterscheidet AH-4c von F3.
    expect(rowTransferOf(ROW)).toEqual({
      rowId: 'r1',
      data: { title: 'Hallo', count: 3, tags: ['a', 'b'], nested: { a: 1, b: [2, 3] } },
      permissions: ['read("any")', 'update("user:u1")'],
    })
  })

  it('kopiert die Permissions statt sie durchzureichen', () => {
    const transfer = rowTransferOf(ROW)
    transfer.permissions.push('delete("any")')
    expect(ROW.$permissions).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 2 — Vergleich: streng bei Inhalten, tolerant bei Permissions', () => {
  const payload = rowPayloadOf(ROW)

  it('erkennt identische Nutzdaten', () => {
    expect(samePayload(payload, { title: 'Hallo', count: 3, tags: ['a', 'b'], nested: { a: 1, b: [2, 3] } })).toBe(true)
  })

  it('meldet einen anderen Wert als Unterschied', () => {
    expect(samePayload(payload, { ...payload, title: 'Hallo!' })).toBe(false)
  })

  it('meldet ein FEHLENDES Feld als Unterschied', () => {
    const { count: _count, ...rest } = payload
    expect(samePayload(payload, rest)).toBe(false)
  })

  it('meldet ein ZUSÄTZLICHES Feld als Unterschied', () => {
    expect(samePayload(payload, { ...payload, extra: null })).toBe(false)
  })

  it('unterscheidet Typen: 1 ist nicht "1", null ist nicht undefined', () => {
    expect(samePayload({ n: 1 }, { n: '1' })).toBe(false)
    expect(samePayload({ n: null }, { n: undefined })).toBe(false)
    expect(samePayload({ flag: false }, { flag: 0 })).toBe(false)
  })

  it('vergleicht verschachtelte Werte tief', () => {
    expect(samePayload(payload, { ...payload, nested: { a: 1, b: [3, 2] } })).toBe(false)
    expect(samePayload(payload, { ...payload, nested: { a: 1, b: [2, 3] } })).toBe(true)
  })

  it('hält gewöhnliche Arrays reihenfolge-TREU', () => {
    // Eine Spalte vom Typ string[] ist im Produkt eine Liste (Reihenfolge ist
    // Inhalt), keine Menge.
    expect(samePayload({ tags: ['a', 'b'] }, { tags: ['b', 'a'] })).toBe(false)
  })

  it('behandelt Permissions dagegen als MENGE', () => {
    // Appwrite gibt sie nicht stabil sortiert zurück; ein strenger Vergleich
    // schriebe bei jedem Delta-Lauf alle Zeilen ohne Not neu.
    expect(samePermissions(['read("any")', 'update("user:u1")'], ['update("user:u1")', 'read("any")'])).toBe(true)
  })

  it('lässt sich von der Mengen-Toleranz nichts unterschlagen', () => {
    expect(samePermissions(['read("any")', 'read("users")'], ['read("any")'])).toBe(false)
    expect(samePermissions(['read("any")'], ['read("any")', 'read("users")'])).toBe(false)
    // Duplikate zählen: zweimal dasselbe Recht ist nicht dasselbe wie einmal.
    expect(samePermissions(['read("any")', 'read("any")'], ['read("any")', 'read("users")'])).toBe(false)
  })

  it('benennt die abweichenden Felder aus BEIDEN Richtungen', () => {
    expect(differingFields({ a: 1, b: 2 }, { a: 9, c: 3 })).toEqual(['a', 'b', 'c'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 3 — Delta-Semantik des zweiten Laufs', () => {
  it('legt an, was es im Ziel nicht gibt', () => {
    expect(rowDecisionFor(ROW, null)).toEqual({ action: 'create' })
  })

  it('überspringt eine identische Zeile — auch mit anderen Zeitstempeln', () => {
    // $createdAt/$updatedAt gehören dem ZIEL und sind beim Kopieren zwangsläufig
    // andere. Zählten sie mit, wäre jede Zeile in jedem Lauf „verändert".
    const twin = { ...ROW, $createdAt: '2026-08-18T00:00:00.000Z', $updatedAt: '2026-08-18T00:00:00.000Z', $sequence: 99 }
    expect(rowDecisionFor(ROW, twin)).toEqual({ action: 'skip' })
  })

  it('überspringt auch bei gedrehten Permissions', () => {
    const twin = { ...ROW, $permissions: ['update("user:u1")', 'read("any")'] }
    expect(rowDecisionFor(ROW, twin)).toEqual({ action: 'skip' })
  })

  it('aktualisiert bei abweichendem Inhalt und benennt das Feld', () => {
    expect(rowDecisionFor(ROW, { ...ROW, title: 'Anders' })).toEqual({ action: 'update', fields: ['title'] })
  })

  it('aktualisiert auch, wenn nur die Permissions abweichen', () => {
    const decision = rowDecisionFor(ROW, { ...ROW, $permissions: ['read("any")'] })
    expect(decision.action).toBe('update')
    expect(decision).toMatchObject({ fields: ['$permissions'] })
  })

  it('meldet Inhalt UND Permissions, wenn beides abweicht', () => {
    const decision = rowDecisionFor(ROW, { ...ROW, title: 'X', $permissions: [] })
    expect(decision).toEqual({ action: 'update', fields: ['title', '$permissions'] })
  })

  it('behandelt eine Zeile ohne Permissions wie eine mit leerer Liste', () => {
    const bare = { $id: 'r2', wert: 1 }
    expect(rowDecisionFor(bare, { ...bare, $permissions: [] })).toEqual({ action: 'skip' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 4 — Konten: Hash mitnehmen oder gar nicht anlegen', () => {
  it('legt OTP-only-Konten ohne Passwort an', () => {
    // Das Betreiber-Konto ist per H2 genau so angelegt (Runbook Schritt 0).
    expect(userTransferPlan({ $id: 'u1' })).toEqual({ action: 'create-without-password', method: 'create' })
  })

  it.each([
    ['bcrypt', 'createBcryptUser'],
    ['argon2', 'createArgon2User'],
    ['md5', 'createMD5User'],
    ['phpass', 'createPHPassUser'],
  ] as const)('nimmt den %s-Hash über seinen Endpunkt mit', (hash, method) => {
    expect(userTransferPlan({ $id: 'u1', password: 'hash', hash })).toMatchObject({
      action: 'create-with-hash',
      method,
    })
  })

  it('reicht die scrypt-Parameter durch (sie stehen sonst nicht im Request)', () => {
    const plan = userTransferPlan({
      $id: 'u1',
      password: 'hash',
      hash: 'scrypt',
      hashOptions: { salt: 's', costCpu: 8, costMemory: 14, costParallel: 1, length: 64 },
    })
    expect(plan).toMatchObject({
      action: 'create-with-hash',
      method: 'createScryptUser',
      plan: { options: { passwordSalt: 's', passwordCpu: 8, passwordMemory: 14, passwordParallel: 1, passwordLength: 64 } },
    })
  })

  it('behandelt ein Klartext-Passwort als gewöhnliches /users MIT Passwort', () => {
    const plan = userTransferPlan({ $id: 'u1', password: 'geheim', hash: 'plaintext' })
    expect(plan).toMatchObject({ action: 'create-with-hash', method: 'create' })
  })

  it('rät bei einem unbekannten Verfahren NICHT, sondern blockiert (fail-closed)', () => {
    // Lieber ein Konto im Bericht als eines, das sich nie wieder anmelden kann.
    expect(userTransferPlan({ $id: 'u1', password: 'x', hash: 'quantum' }))
      .toEqual({ action: 'unsupported', hash: 'quantum' })
    expect(userTransferPlan({ $id: 'u1', password: 'x' }))
      .toEqual({ action: 'unsupported', hash: '(leer)' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 5 — Wiederanlauf: belegte Id vergleichen, nie überschreiben', () => {
  const person = {
    $id: 'u1',
    email: 'mensch@example.com',
    name: 'Mensch',
    labels: ['admin'],
    prefs: { locale: 'de' },
    status: true,
    emailVerification: true,
    phoneVerification: false,
  }

  it('erkennt dasselbe Konto', () => {
    expect(userDiffFields(person, { ...person })).toEqual([])
  })

  it('nimmt fehlende Felder als „nicht gesetzt" statt als Unterschied', () => {
    expect(userDiffFields(person, { ...person, phone: '' })).toEqual([])
    expect(userDiffFields({ $id: 'u1' }, { $id: 'u1', name: '' })).toEqual([])
  })

  it('ist bei Labels reihenfolge-tolerant, bei allem anderen nicht', () => {
    const both = { ...person, labels: ['admin', 'moderator'] }
    expect(userDiffFields(both, { ...both, labels: ['moderator', 'admin'] })).toEqual([])
  })

  it.each([
    ['email', { email: 'jemand.anderes@example.com' }],
    ['name', { name: 'Anders' }],
    ['status', { status: false }],
    ['emailVerification', { emailVerification: false }],
    ['labels', { labels: [] }],
    ['prefs', { prefs: { locale: 'en' } }],
  ])('meldet %s als Unterschied', (field, patch) => {
    expect(userDiffFields(person, { ...person, ...patch })).toEqual([field])
  })

  it('vergleicht den HASH bewusst nicht', () => {
    // Die Users-API gibt ihn beim Lesen des Ziels nicht heraus — ein Vergleich
    // wäre immer „unterschiedlich" und die Warnung damit wertlos.
    expect(userDiffFields({ ...person, password: 'a', hash: 'bcrypt' }, { ...person })).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 6 — Schutzregeln des Laufs', () => {
  it('weist zweimal dasselbe Projekt ab', () => {
    // Der teuerste Bedienfehler: jede Zeile fände sich selbst, alles hieße
    // „skip", und der Bericht meldete einen grünen Umzug, den es nie gab.
    expect(() => assertDistinctProjects('control', 'control')).toThrow(/DASSELBE Projekt/)
  })

  it('besteht auf beiden Projekt-Ids', () => {
    expect(() => assertDistinctProjects('', 'admin')).toThrow(/Projekt-Id fehlt/)
  })

  it('lässt einen echten Umzug durch', () => {
    expect(() => assertDistinctProjects('control', 'admin')).not.toThrow()
  })

  it('benennt, was im Ziel fehlt — sortiert und ohne Umkehrschluss', () => {
    // Tabellen und Buckets legt das SCHEMA an (Runbook Schritt 2), nicht dieses
    // Werkzeug. Was im ZIEL zusätzlich steht, ist dabei kein Befund.
    expect(missingInTarget(['c', 'a', 'b'], ['b'])).toEqual(['a', 'c'])
    expect(missingInTarget(['a'], ['a', 'z'])).toEqual([])
  })

  it('macht aus einem 401 eine handlungsleitende Zeile', () => {
    const hint = scopeErrorHint(401, 'general_unauthorized_scope', 'users')
    expect(hint).toContain('users.read')
    expect(hint).toContain('ADMIN-PROJEKT-CUTOVER.md')
    expect(hint).toContain('Schritt 0')
  })

  it('erkennt den Scope-Fehler auch ohne Status', () => {
    expect(scopeErrorHint(undefined, 'general_unauthorized_scope', 'files')).toContain('files.read')
  })

  it.each([
    ['/users', 'users'],
    ['/users/u1/prefs', 'users'],
    ['/teams/t1/memberships', 'teams'],
    ['/storage/buckets', 'buckets'],
    ['/storage/buckets/fonts/files', 'files'],
    ['/storage/buckets/fonts/files/f1/download', 'files'],
    ['/tablesdb/main/tables/tickets/rows/r1', 'rows'],
    ['/tablesdb/main/tables', 'tables'],
  ] as const)('ordnet %s der Ressource %s zu', (path, resource) => {
    // Der Hinweis hängt am API-Aufruf und nicht an den Fangstellen: beim ersten
    // Probelauf kam der einzige echte 401 aus einer Existenzprüfung mitten in
    // einer Schleife — dort hätte niemand ein try/catch mit Hinweis erwartet.
    expect(resourceFromPath(path)).toBe(resource)
  })

  it('überdeckt andere Fehler NICHT', () => {
    // Ein 404 oder 409 gehört im Original durchgereicht — ein falscher
    // Scope-Hinweis schickt beim nächsten Lauf jemanden auf die falsche Fährte.
    expect(scopeErrorHint(404, 'row_not_found', 'rows')).toBeNull()
    expect(scopeErrorHint(409, 'document_already_exists', 'rows')).toBeNull()
    expect(scopeErrorHint(500, undefined, 'files')).toBeNull()
  })
})
