import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertCommunityKeys,
  communityRowData,
  decideUserMigration,
  hashPlanFor,
  memberLabelFor,
  moderatorLabelFor,
  ownerMembershipData,
  rewriteRowPermissions,
  roleFromInstanceLabels,
  rowStampFor,
  tablePlanFor,
  tablesToCopy,
  unplannedTables,
} from '../../../scripts/ops/f3-lib/rules.mts'

/**
 * F3 / AH-6 — die drei Rechenwege, an denen der comments→Pool-Umzug laut Plan
 * § 10 am ehesten scheitert. Alle drei laufen bei einem Fehler GRÜN durch und
 * hinterlassen eine leere, unsichtbare oder falsch zugeordnete Community —
 * deshalb hängen sie hier an Tests und nicht an Sorgfalt.
 *
 * Werkzeug: scripts/ops/f3-comments-to-pool.mjs · Ablauf: docs/runbooks/F3-CUTOVER.md
 */

const KEYS = { rowId: 'c0ffee1234', tenantId: 't-abc123' }

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 1 — Stempel-Wahl: t-Id für die SPALTE, $id für das LABEL', () => {
  it('stempelt die Datenzeile mit communities.tenantId', () => {
    // Gegenstück: scopeRowFor() in packages/core/server/utils/tenant.ts
    expect(rowStampFor(KEYS)).toEqual({ communityId: 't-abc123' })
  })

  it('baut Labels aus communities.$id', () => {
    // Gegenstück: tenantRowPermissionsFor() / communityModeratorLabel()
    expect(memberLabelFor(KEYS)).toBe('label:c0ffee1234')
    expect(moderatorLabelFor(KEYS)).toBe('label:modc0ffee1234')
  })

  it('nimmt NIE denselben Wert für beides', () => {
    expect(rowStampFor(KEYS).communityId).not.toBe(memberLabelFor(KEYS).replace('label:', ''))
  })

  it('lässt vertauschte Schlüssel auffliegen statt still eine leere Community zu bauen', () => {
    // Beide Werte glatt getauscht: die $id steht da, wo die t-Id hingehört.
    expect(() => assertCommunityKeys({ rowId: 't-abc123', tenantId: 'c0ffee1234' })).toThrow(/kein "t-"-Präfix/)
    // Zweimal die t-Id: das Label würde damit auf einen Wert zeigen, den es als
    // Label nie gab — die Community wäre für ihre Mitglieder unsichtbar.
    expect(() => assertCommunityKeys({ rowId: 't-abc123', tenantId: 't-abc123' })).toThrow(/vertauscht/)
    // Zweimal die $id: der Stempel passt zu keiner Zeile, die Community ist leer.
    expect(() => rowStampFor({ rowId: 'c0ffee1234', tenantId: 'c0ffee1234' })).toThrow(/kein "t-"-Präfix/)
  })

  it('besteht auf beiden Schlüsseln', () => {
    expect(() => assertCommunityKeys({ rowId: '', tenantId: 't-abc123' })).toThrow(/unvollständig/)
  })

  it('legt die Owner-Mitgliedschaft an der $id an, nicht am Stempel', () => {
    // community_members.communityId = communities.$id (A5) — der EINE Ort, an
    // dem die Spalte `communityId` NICHT den t-Wert trägt.
    const row = ownerMembershipData({ keys: KEYS, runtimeProjectId: 'account', runtimeUserId: 'u1', email: 'a@b.de' })
    expect(row.communityId).toBe(KEYS.rowId)
    expect(row).toMatchObject({ role: 'owner', status: 'active', runtimeProjectId: 'account', runtimeUserId: 'u1' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 2 — Merge-Entscheidung bei gleicher E-Mail (fail-closed)', () => {
  const source = { $id: 'u1', email: 'mensch@example.com', emailVerification: true }

  it('führt zusammen, wenn BEIDE Adressen bestätigt sind', () => {
    const decision = decideUserMigration({
      source,
      targetById: null,
      targetByEmail: { $id: 'acc-1', email: 'mensch@example.com', emailVerification: true },
    })
    expect(decision).toEqual({ action: 'merge', targetUserId: 'acc-1' })
  })

  it.each([
    ['Quelle unbestätigt', false, true],
    ['Ziel unbestätigt', true, false],
    ['beide unbestätigt', false, false],
  ])('verweigert die Zusammenführung — %s', (_name, sourceVerified, targetVerified) => {
    const decision = decideUserMigration({
      source: { ...source, emailVerification: sourceVerified },
      targetById: null,
      targetByEmail: { $id: 'acc-1', email: 'mensch@example.com', emailVerification: targetVerified },
    })
    // Ein 500 beim Migrieren ist ein Wiederholungsversuch; eine falsche
    // Verschmelzung ist unumkehrbar (Plan § 3.3).
    expect(decision).toEqual({ action: 'collision', reason: 'email_unverified' })
  })

  it('legt ohne Kollision ein Konto MIT DERSELBEN Id an', () => {
    expect(decideUserMigration({ source, targetById: null, targetByEmail: null })).toEqual({ action: 'create' })
  })

  it('erkennt den Wiederanlauf: gleiche Id, gleiche Adresse', () => {
    const decision = decideUserMigration({
      source,
      targetById: { $id: 'u1', email: 'MENSCH@example.com', emailVerification: true },
      targetByEmail: null,
    })
    expect(decision).toEqual({ action: 'exists', targetUserId: 'u1' })
  })

  it('meldet eine fremd belegte Id als Einzelfall statt sie zu überschreiben', () => {
    const decision = decideUserMigration({
      source,
      targetById: { $id: 'u1', email: 'jemand.anderes@example.com', emailVerification: true },
      targetByEmail: null,
    })
    expect(decision).toEqual({ action: 'collision', reason: 'id_taken_by_other' })
  })

  it('behandelt die Id-Prüfung VOR der Adress-Prüfung', () => {
    // Sonst würde ein Konto mit belegter Id und passender Adresse still
    // zusammengeführt, obwohl die Id einem Dritten gehört.
    const decision = decideUserMigration({
      source,
      targetById: { $id: 'u1', email: 'fremd@example.com', emailVerification: true },
      targetByEmail: { $id: 'acc-1', email: 'mensch@example.com', emailVerification: true },
    })
    expect(decision.action).toBe('collision')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Pflicht 3 — Row-Permissions vom Silo in den Pool umschreiben', () => {
  const ctx = { keys: KEYS, mapping: { alt: 'neu', gleich: 'gleich' }, audiencePublic: true }

  it('lässt read(any) stehen, solange die Community öffentlich ist', () => {
    expect(rewriteRowPermissions(['read("any")'], ctx).permissions).toEqual(['read("any")'])
  })

  it('macht aus read(any) ein Mitglieder-Label, wenn die Community es NICHT ist', () => {
    // Ein Umzug darf nicht zur unangekündigten Veröffentlichung werden.
    const result = rewriteRowPermissions(['read("any")'], { ...ctx, audiencePublic: false })
    expect(result.permissions).toEqual(['read("label:c0ffee1234")'])
  })

  it('ersetzt die Projekt-Grenze read(users) durch das Community-Label', () => {
    expect(rewriteRowPermissions(['read("users")'], ctx).permissions).toEqual(['read("label:c0ffee1234")'])
  })

  it('übersetzt Silo-Instanzlabels in das Community-Moderationslabel', () => {
    const result = rewriteRowPermissions(['read("label:admin")', 'read("label:moderator")'], ctx)
    // Ein globales Betreiber-Label wäre im Pool eine offene Tür; beide Silo-
    // Labels fallen auf DASSELBE mod<$id> zusammen und werden dedupliziert.
    expect(result.permissions).toEqual(['read("label:modc0ffee1234")'])
  })

  it('zieht Besitzer-Rechte über die Mapping-Tabelle nach', () => {
    const result = rewriteRowPermissions(['update("user:alt")', 'delete("user:alt")'], ctx)
    expect(result.permissions).toEqual(['update("user:neu")', 'delete("user:neu")'])
    expect(result.unmapped).toEqual([])
  })

  it('lässt eine Id ohne Mapping-Eintrag stehen und MELDET sie', () => {
    // Fail-closed bei den Konten (Entscheidung b) heißt: die Zeile wandert,
    // ihre user:-Permission zeigt aber ins Leere. Das darf nicht still bleiben.
    const result = rewriteRowPermissions(['update("user:niemand")'], ctx)
    expect(result.permissions).toEqual(['update("user:niemand")'])
    expect(result.unmapped).toEqual(['niemand'])
  })

  it('wirft Rollen weg, die im Pool nichts bedeuten — und protokolliert sie', () => {
    const result = rewriteRowPermissions(['read("label:irgendwas")', 'read("team:x")', 'kaputt'], ctx)
    expect(result.permissions).toEqual([])
    expect(result.dropped).toEqual(['read("label:irgendwas")', 'read("team:x")', 'kaputt'])
  })

  it('behält Gast-Lesen und dedupliziert', () => {
    const result = rewriteRowPermissions(['read("guests")', 'read("users")', 'read("users")'], ctx)
    expect(result.permissions).toEqual(['read("guests")', 'read("label:c0ffee1234")'])
  })

  it('verweigert die Arbeit bei vertauschten Schlüsseln', () => {
    expect(() => rewriteRowPermissions(['read("any")'], { ...ctx, keys: { rowId: 't-a', tenantId: 'b' } })).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Die communities-Row ist an tenants/index.post.ts genagelt', () => {
  const routePath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../server/api/control/tenants/index.post.ts',
  )

  /** Die Feldnamen aus dem `data: { … }`-Block der Route, per Klammerzählung. */
  function routeFields(): string[] {
    const source = readFileSync(routePath, 'utf8')
    const start = source.indexOf('data: {')
    expect(start).toBeGreaterThan(-1)
    let depth = 0
    let end = start
    for (let i = source.indexOf('{', start); i < source.length; i++) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    const block = source.slice(start, end)
    // `key: wert` UND die Kurzform `key,` (die Route schreibt projectId/tenantId so).
    return [...block.matchAll(/^\s{6}([A-Za-z][A-Za-z0-9]*)\s*[:,]/gm)].map(match => match[1]!)
  }

  it('kennt genau die Spalten, die der Betreiber-Weg schreibt', () => {
    // `createRow<TenantRow>` verlangt ALLE Spalten explizit (CLAUDE.md) — eine
    // neue communities-Spalte erzwingt eine Entscheidung an BEIDEN
    // Anlegestellen. Dieses Werkzeug ist seit F3 die dritte; ohne diesen Test
    // fiele es beim nächsten Schema-Zuwachs stillschweigend hinten runter.
    const ours = Object.keys(communityRowData({
      name: 'Comments',
      host: 'comments.pukalani.app',
      projectId: 'account',
      tenantId: 't-abc123',
      plan: 'pro',
      trialEndsAt: '2036-01-01T00:00:00.000Z',
      theme: '',
      variant: '',
      neutral: '',
    }))
    expect([...ours].sort()).toEqual([...routeFields()].sort())
  })

  it('setzt die abgenommenen Werte: pro, öffentlich, offen, ohne Abo, ohne Sperre', () => {
    const row = communityRowData({
      name: 'Comments',
      host: 'comments.pukalani.app',
      projectId: 'account',
      tenantId: 't-abc123',
      plan: 'pro',
      trialEndsAt: '2036-01-01T00:00:00.000Z',
      theme: '',
      variant: '',
      neutral: '',
    })
    expect(row).toMatchObject({
      mode: 'pool',
      status: 'active',
      plan: 'pro',
      audience: 'public',
      openRegistration: true,
      stripeSubscriptionId: '',
      billingStatus: '',
      suspension: '',
    })
    // Ohne Testphase in der Zukunft sperrt der F49-trialSweep die Community
    // binnen einer Stunde auf NUR-LESEND (M13-`billing`).
    expect(new Date(String(row.trialEndsAt)).getTime()).toBeGreaterThan(Date.now())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Tabellen-Plan und Nebenregeln', () => {
  it('lässt guest_authors bewusst zurück', () => {
    expect(tablePlanFor('guest_authors')?.action).toBe('skip')
  })

  it('lässt app_config zurück — es ist die INSTANZ-Einstellung des Zielprojekts', () => {
    expect(tablePlanFor('app_config')?.action).toBe('skip')
  })

  it('nimmt beide Handle-Register mit, account_handles aber nur wenn frei', () => {
    expect(tablePlanFor('community_handles')?.action).toBe('copy')
    expect(tablePlanFor('account_handles')?.action).toBe('copy-if-handle-free')
  })

  it('gibt jedem Eintrag eine Begründung', () => {
    for (const entry of tablesToCopy()) expect(entry.reason.length).toBeGreaterThan(10)
  })

  it('meldet Tabellen der Instanz, die in keiner Plan-Zeile stehen', () => {
    expect(unplannedTables(['comments', 'neuer_layer', 'app_config'])).toEqual(['neuer_layer'])
  })

  it('leitet die Mitglieds-Rolle aus dem alten Instanz-Label ab', () => {
    expect(roleFromInstanceLabels(['admin'])).toBe('admin')
    expect(roleFromInstanceLabels(['moderator'])).toBe('moderator')
    expect(roleFromInstanceLabels([])).toBe('viewer')
    expect(roleFromInstanceLabels(['irgendwas'])).toBe('viewer')
  })
})

describe('Passwort-Hashes', () => {
  it('braucht für OTP-only-Konten kein Passwort', () => {
    expect(hashPlanFor({})).toEqual({ method: 'create', needs: [] })
  })

  it.each([
    ['bcrypt', 'createBcryptUser'],
    ['argon2', 'createArgon2User'],
    ['md5', 'createMD5User'],
    ['phpass', 'createPHPassUser'],
  ] as const)('wählt für %s den passenden Endpunkt', (hash, method) => {
    expect(hashPlanFor({ password: 'x', hash }).method).toBe(method)
  })

  it('reicht die scrypt-Parameter durch', () => {
    const plan = hashPlanFor({
      password: 'x',
      hash: 'scrypt',
      hashOptions: { salt: 's', costCpu: 8, costMemory: 14, costParallel: 1, length: 64 },
    })
    expect(plan).toMatchObject({
      method: 'createScryptUser',
      options: { passwordSalt: 's', passwordCpu: 8, passwordMemory: 14, passwordParallel: 1, passwordLength: 64 },
    })
  })

  it('rät bei einem unbekannten Verfahren NICHT', () => {
    // Lieber ein Konto im Einzelfall-Report als eines mit kaputtem Passwort.
    expect(hashPlanFor({ password: 'x', hash: 'quantum' })).toEqual({ method: 'unsupported', hash: 'quantum' })
  })
})
