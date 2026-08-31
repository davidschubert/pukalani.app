import { describe, expect, it } from 'vitest'
import { BRAND_OWNER_TYPES, type BrandOwnerType, decideBrandOwnerAccess } from '../shared/brandOwnership'

/**
 * Die Eigentümer-Regel. Der `community`-Zweig ist in Phase 1 nicht aktiviert
 * (der Server übergibt `communityRole: null`) — geprüft wird er trotzdem, sonst
 * wäre er beim Einschalten ungetesteter Code.
 */

describe('decideBrandOwnerAccess — Zweig "user" (Phase 1 aktiv)', () => {
  it('erlaubt dem eigenen Konto', () => {
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: 'u1', userId: 'u1' })).toBe(true)
  })

  it('lehnt jedes fremde Konto ab', () => {
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: 'u1', userId: 'u2' })).toBe(false)
  })

  it('lässt eine Community-Rolle den user-Zweig nicht aufweichen', () => {
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: 'u1', userId: 'u2', communityRole: 'owner' }))
      .toBe(false)
  })

  it('lehnt leere Ids beidseitig ab (unvollständige Zeile öffnet nichts)', () => {
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: '', userId: '' })).toBe(false)
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: '', userId: 'u1' })).toBe(false)
    expect(decideBrandOwnerAccess({ ownerType: 'user', ownerId: 'u1', userId: '' })).toBe(false)
  })
})

describe('decideBrandOwnerAccess — Zweig "community" (gebaut, Phase 1 nicht aktiviert)', () => {
  const community = { ownerType: 'community' as const, ownerId: 'c1', userId: 'u1' }

  it('erlaubt owner und admin', () => {
    expect(decideBrandOwnerAccess({ ...community, communityRole: 'owner' })).toBe(true)
    expect(decideBrandOwnerAccess({ ...community, communityRole: 'admin' })).toBe(true)
  })

  it('lehnt moderator, editor und viewer ab', () => {
    for (const role of ['moderator', 'editor', 'viewer']) {
      expect(decideBrandOwnerAccess({ ...community, communityRole: role })).toBe(false)
    }
  })

  it('lehnt ohne aufgelöste Rolle ab — genau der Phase-1-Zustand', () => {
    expect(decideBrandOwnerAccess({ ...community, communityRole: null })).toBe(false)
    expect(decideBrandOwnerAccess({ ...community, communityRole: undefined })).toBe(false)
    expect(decideBrandOwnerAccess(community)).toBe(false)
    expect(decideBrandOwnerAccess({ ...community, communityRole: '' })).toBe(false)
  })

  it('lehnt eine unbekannte Rolle ab (fail-closed)', () => {
    expect(decideBrandOwnerAccess({ ...community, communityRole: 'operator' })).toBe(false)
  })

  it('lässt ownerId === userId den community-Zweig nicht durchbrechen', () => {
    // Eine Community-Id ist nie eine User-Id — aber die Regel darf sich auch
    // dann nicht auf Gleichheit verlassen, wenn zufällig beides gleich lautet.
    expect(decideBrandOwnerAccess({ ownerType: 'community', ownerId: 'u1', userId: 'u1' })).toBe(false)
  })
})

describe('decideBrandOwnerAccess — Randfälle', () => {
  it('kennt genau zwei ownerType-Werte', () => {
    expect([...BRAND_OWNER_TYPES]).toEqual(['user', 'community'])
  })

  it('lehnt einen unbekannten ownerType ab', () => {
    expect(decideBrandOwnerAccess({
      ownerType: 'org' as unknown as BrandOwnerType,
      ownerId: 'u1',
      userId: 'u1',
      communityRole: 'owner',
    })).toBe(false)
  })
})
