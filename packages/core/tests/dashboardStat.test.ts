import { describe, expect, it } from 'vitest'
import { resolveDashboardStats } from '../shared/types/dashboard-stat'
import type { PukalaniDashboardStat, PukalaniDashboardStatConfig } from '../shared/types/dashboard-stat'
import type { Capability } from '../shared/types/authz'

/**
 * Die Kennzahlen-Registry der Übersicht (U9/K2). Sie hat ZWEI Leser — die
 * Seite (rendert) und die Route (erhebt nur, was gerendert würde) —, und
 * deshalb ist ihre Regel pur.
 */

const yes = () => true
const no = () => false

function stat(overrides: Partial<PukalaniDashboardStat> = {}): PukalaniDashboardStat {
  return {
    scope: 'community',
    labelKey: 'x.label',
    icon: 'i-ph-x',
    requiredCapability: 'dashboard.access' as Capability,
    ...overrides,
  }
}

function ids(config: PukalaniDashboardStatConfig, filter: Parameters<typeof resolveDashboardStats>[1]): string[] {
  return resolveDashboardStats(config, filter).map(s => s.id)
}

const member = { place: 'community' as const, canAsOperator: no, canAsMember: yes }

describe('resolveDashboardStats — Ort', () => {
  it('lässt Community-Kacheln nur auf dem Mandanten-Host stehen', () => {
    const config = { posts: stat({ scope: 'community' }) }
    expect(ids(config, member)).toEqual(['posts'])
    expect(ids(config, { place: 'control', canAsOperator: yes, canAsMember: yes })).toEqual([])
  })

  it('nimmt die Betreiber-Kachel vom Mandanten-Host — das ist die Pool-Regel für die Nutzerzahl (B2)', () => {
    const config = { users: stat({ scope: 'operator', requiredCapability: 'users.manage' as Capability }) }
    expect(ids(config, { place: 'community', canAsOperator: yes, canAsMember: yes })).toEqual([])
    expect(ids(config, { place: 'control', canAsOperator: yes, canAsMember: no })).toEqual(['users'])
    // Im Silo IST das Projekt die Site: dort zählt allein die Capability.
    expect(ids(config, { place: 'single-tenant', canAsOperator: yes, canAsMember: no })).toEqual(['users'])
  })

  it('fällt bei unbekanntem scope heraus (fail-closed wie überall)', () => {
    const config = { broken: { ...stat(), scope: 'nowhere' as unknown as 'community' } }
    expect(ids(config, member)).toEqual([])
  })
})

describe('resolveDashboardStats — Rechte', () => {
  it('erreicht eine Betreiber-Kachel NIE über die Community-Rolle', () => {
    const config = { users: stat({ scope: 'operator', requiredCapability: 'users.manage' as Capability }) }
    expect(ids(config, { place: 'single-tenant', canAsOperator: no, canAsMember: yes })).toEqual([])
  })

  it('lässt die Community-Kachel per Rolle ODER Label durch (Support-Break-Glass)', () => {
    const config = { comments: stat({ requiredCapability: 'comments.moderate' as Capability }) }
    expect(ids(config, { place: 'community', canAsOperator: no, canAsMember: yes })).toEqual(['comments'])
    expect(ids(config, { place: 'community', canAsOperator: yes, canAsMember: no })).toEqual(['comments'])
    expect(ids(config, { place: 'community', canAsOperator: no, canAsMember: no })).toEqual([])
  })
})

describe('resolveDashboardStats — die drei Produkt-Gates', () => {
  const config = {
    posts: stat({ productKey: 'posts', planProduct: 'posts', configFlag: 'posts.enabled' }),
  }

  it('zählt ohne Angabe jedes Produkt als an', () => {
    expect(ids({ plain: stat() }, member)).toEqual(['plain'])
  })

  it('nimmt die Kachel, wenn der Betreiber das Produkt abgeschaltet hat', () => {
    expect(ids(config, { ...member, productOn: no })).toEqual([])
  })

  it('nimmt die Kachel, wenn der Tarif das Produkt nicht enthält (C2)', () => {
    expect(ids(config, { ...member, planOn: no })).toEqual([])
  })

  it('nimmt die Kachel, wenn die App den Bau-Schalter nicht gesetzt hat (F37)', () => {
    expect(ids(config, { ...member, configOn: no })).toEqual([])
  })

  it('fragt planOn/configOn NUR bei gesetztem Feld — sonst bliebe die halbe Reihe leer', () => {
    expect(ids({ plain: stat() }, { ...member, planOn: no, configOn: no })).toEqual(['plain'])
  })
})

describe('resolveDashboardStats — Form der Registry', () => {
  it('lässt eine App eine einzelne Kachel mit false abschalten', () => {
    expect(ids({ posts: stat(), comments: false }, member)).toEqual(['posts'])
  })

  it('sortiert nach order, Default 50', () => {
    const config = {
      late: stat({ order: 90 }),
      early: stat({ order: 10 }),
      middle: stat(),
    }
    expect(ids(config, member)).toEqual(['early', 'middle', 'late'])
  })

  it('reicht die Registry-Id als `id` durch — sie ist der Schlüssel zur Zahl', () => {
    const resolved = resolveDashboardStats({ members: stat({ emptyHintKey: 'x.invite', emptyBelow: 2 }) }, member)
    expect(resolved[0]).toMatchObject({ id: 'members', emptyHintKey: 'x.invite', emptyBelow: 2 })
  })

  it('kommt mit fehlender Registry zurecht (App ohne einen einzigen Layer)', () => {
    expect(resolveDashboardStats(undefined, member)).toEqual([])
  })
})
