import { describe, expect, it } from 'vitest'
import { Permission, Role } from 'node-appwrite'
import {
  accountHandlePermissions,
  communityHandleReadRole,
  handleAudienceIncludes,
  handleAudienceWith,
  handleAudienceWithout,
  ownerHandleReadRole,
} from '../shared/accountHandleAudience'
import { tenantRowPermissionsFor } from '../server/utils/tenantRowPermissions'

const USER = 'user-1'
const COMMUNITY = 'siteAAA'
const OTHER = 'siteBBB'

/**
 * DIESELBE GRENZE, BEWIESEN GLEICH — das Muster von
 * tests/presencePermissions.test.ts.
 *
 * `shared/accountHandleAudience.ts` baut Berechtigungs-Strings von Hand, weil
 * die Regel auch dort gebraucht wird, wo `node-appwrite` nicht hingehört. Der
 * Preis dafür ist genau EINE Gefahr: eine Schreibweise, die nur so AUSSIEHT
 * wie die von Appwrite. Diese Datei nagelt sie fest.
 */
describe('accountHandleAudience == node-appwrite (Schreibweise)', () => {
  it('die Community-Lese-Rolle ist Permission.read(Role.label(...))', () => {
    expect(communityHandleReadRole(COMMUNITY)).toBe(Permission.read(Role.label(COMMUNITY)))
  })

  it('die Besitzer-Lese-Rolle ist Permission.read(Role.user(...))', () => {
    expect(ownerHandleReadRole(USER)).toBe(Permission.read(Role.user(USER)))
  })

  it('das Silo-Publikum ist dasselbe wie bei jeder anderen Mitglieder-Zeile', () => {
    // tenantRowPermissionsFor(null) = Single-Tenant/Silo → read("users")
    expect(accountHandlePermissions(false, null, USER)).toContain(
      tenantRowPermissionsFor(null)[0],
    )
  })
})

describe('accountHandlePermissions', () => {
  it('Pool mit Community: Besitzer + genau diese Community', () => {
    expect(accountHandlePermissions(true, COMMUNITY, USER)).toEqual([
      Permission.read(Role.user(USER)),
      Permission.read(Role.label(COMMUNITY)),
    ])
  })

  it('Pool OHNE Community (Kontroll-Host): nur der Besitzer — nie read(users)', () => {
    const perms = accountHandlePermissions(true, '', USER)
    expect(perms).toEqual([Permission.read(Role.user(USER))])
    // Der Kern: im geteilten Projekt hiesse read("users") „alle Kunden".
    expect(perms).not.toContain('read("users")')
  })

  it('Silo: Besitzer + alle eingeloggten Konten der Instanz', () => {
    expect(accountHandlePermissions(false, '', USER)).toEqual([
      Permission.read(Role.user(USER)),
      'read("users")',
    ])
  })

  it('vergibt NIE update/delete — geschrieben wird nur über die Route', () => {
    for (const perms of [
      accountHandlePermissions(true, COMMUNITY, USER),
      accountHandlePermissions(false, '', USER),
    ]) {
      expect(perms.some(p => p.startsWith('update('))).toBe(false)
      expect(perms.some(p => p.startsWith('delete('))).toBe(false)
    }
  })
})

describe('handleAudienceIncludes', () => {
  const perms = accountHandlePermissions(true, COMMUNITY, USER)

  it('sieht die eigene Community', () => {
    expect(handleAudienceIncludes(perms, true, COMMUNITY)).toBe(true)
  })

  it('sieht eine FREMDE Community nicht — das ist die Grenze der Auflösung', () => {
    expect(handleAudienceIncludes(perms, true, OTHER)).toBe(false)
  })

  it('ohne communityId im Pool: fail-closed', () => {
    expect(handleAudienceIncludes(perms, true, '')).toBe(false)
    expect(handleAudienceIncludes(perms, true, null)).toBe(false)
  })

  it('im Silo immer wahr — dort gibt es keine Community-Grenze', () => {
    expect(handleAudienceIncludes([], false, '')).toBe(true)
  })
})

describe('handleAudienceWith', () => {
  it('ergänzt eine fehlende Community und lässt den Rest stehen', () => {
    const before = accountHandlePermissions(true, COMMUNITY, USER)
    expect(handleAudienceWith(before, true, OTHER)).toEqual([
      ...before,
      Permission.read(Role.label(OTHER)),
    ])
  })

  it('gibt null zurück, wenn nichts zu tun ist — kein Schreibvorgang ohne Wirkung', () => {
    const before = accountHandlePermissions(true, COMMUNITY, USER)
    expect(handleAudienceWith(before, true, COMMUNITY)).toBeNull()
    expect(handleAudienceWith(before, true, '')).toBeNull()
    expect(handleAudienceWith(before, false, COMMUNITY)).toBeNull()
  })
})

describe('handleAudienceWithout', () => {
  it('nimmt genau EINE Community weg — der Name bleibt, nur die Sicht geht', () => {
    const before = [
      ...accountHandlePermissions(true, COMMUNITY, USER),
      Permission.read(Role.label(OTHER)),
    ]
    expect(handleAudienceWithout(before, COMMUNITY)).toEqual([
      Permission.read(Role.user(USER)),
      Permission.read(Role.label(OTHER)),
    ])
  })

  it('gibt null zurück, wenn die Community ohnehin nicht drinsteht', () => {
    expect(handleAudienceWithout(accountHandlePermissions(true, COMMUNITY, USER), OTHER)).toBeNull()
  })

  it('lässt den Besitzer-Read niemals fallen', () => {
    const result = handleAudienceWithout(accountHandlePermissions(true, COMMUNITY, USER), COMMUNITY)
    expect(result).toEqual([Permission.read(Role.user(USER))])
  })
})
