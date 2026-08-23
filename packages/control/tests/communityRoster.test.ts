import { describe, expect, it } from 'vitest'
import { communityRosterFrom } from '../shared/communityTeam'
import type { CommunityRole } from '../../core/shared/communityAuthz'
import type { CommunityMemberStatus } from '../shared/types/communityMember'

/**
 * `communityRosterFrom` ist die Sicherheitsaussage der Mitglieder-Karte: „nur
 * aktive, nur diese drei Felder". Geprüft wird deshalb nicht nur, WAS
 * herauskommt, sondern auch, was NICHT — eine E-Mail, die hier durchrutscht,
 * ginge an jeden `viewer` der Community.
 */
function row(
  runtimeUserId: string,
  role: CommunityRole,
  status: CommunityMemberStatus,
  createdAt = '2026-08-01T00:00:00.000Z',
) {
  return { runtimeUserId, role, status, $createdAt: createdAt }
}

describe('communityRosterFrom', () => {
  it('nimmt nur Mitglieder MIT Zugang', () => {
    const roster = communityRosterFrom([
      row('a', 'owner', 'active'),
      row('b', 'viewer', 'removed'),
      row('c', 'editor', 'active'),
    ])

    expect(roster.map(entry => entry.runtimeUserId)).toEqual(['a', 'c'])
  })

  it('lässt jede Rolle zu — anders als die öffentliche Team-Sicht', () => {
    const roster = communityRosterFrom([
      row('a', 'owner', 'active'),
      row('b', 'admin', 'active'),
      row('c', 'moderator', 'active'),
      row('d', 'editor', 'active'),
      row('e', 'viewer', 'active'),
    ])

    expect(roster).toHaveLength(5)
    expect(roster.map(entry => entry.role)).toEqual(['owner', 'admin', 'moderator', 'editor', 'viewer'])
  })

  it('verwirft Zeilen ohne runtimeUserId (DSGVO-Rest eines gelöschten Kontos)', () => {
    const roster = communityRosterFrom([row('', 'owner', 'active'), row('a', 'viewer', 'active')])
    expect(roster.map(entry => entry.runtimeUserId)).toEqual(['a'])
  })

  it('trägt joinedAt aus $createdAt', () => {
    const roster = communityRosterFrom([row('a', 'viewer', 'active', '2026-07-04T12:00:00.000Z')])
    expect(roster[0]?.joinedAt).toBe('2026-07-04T12:00:00.000Z')
  })

  it('gibt GENAU drei Felder heraus — keine E-Mail, kein removedAt, kein self', () => {
    const raw = {
      ...row('a', 'admin', 'active'),
      email: 'geheim@example.test',
      removedAt: null,
      $id: 'row-1',
    }
    const roster = communityRosterFrom([raw])

    expect(Object.keys(roster[0] ?? {}).sort()).toEqual(['joinedAt', 'role', 'runtimeUserId'])
  })

  it('behält die Eingabe-Reihenfolge (die Naht liefert nach Beitritt sortiert)', () => {
    const roster = communityRosterFrom([
      row('a', 'viewer', 'active', '2026-01-01T00:00:00.000Z'),
      row('b', 'viewer', 'active', '2026-02-01T00:00:00.000Z'),
      row('c', 'viewer', 'active', '2026-03-01T00:00:00.000Z'),
    ])

    expect(roster.map(entry => entry.runtimeUserId)).toEqual(['a', 'b', 'c'])
  })
})
