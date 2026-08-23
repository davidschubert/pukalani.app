import { describe, expect, it } from 'vitest'
import { groupMembersByLocation, locationKey } from '../shared/membersMap'
import type { CommunityMapMember } from '../shared/types/membersMap'

/**
 * Die Gruppierung der Mitglieder-Karte. Geprüft wird genau das, was auf der
 * Karte NICHT zu sehen wäre, wenn es kaputtginge: ein Mensch, der hinter einem
 * anderen verschwindet, und eine Reihenfolge, die bei jedem Neuladen wechselt.
 */
function member(userId: string, label: string, lat: number, lon: number): CommunityMapMember {
  return {
    userId,
    name: userId,
    handle: userId,
    avatarUrl: '',
    location: { label, lat, lon },
    role: 'viewer',
    joinedAt: '2026-08-01T00:00:00.000Z',
  }
}

describe('groupMembersByLocation', () => {
  it('bündelt identische Koordinaten zu EINEM Punkt', () => {
    const groups = groupMembersByLocation([
      member('a', 'Hamburg', 53.55, 9.99),
      member('b', 'Hamburg', 53.55, 9.99),
      member('c', 'Wien', 48.21, 16.37),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.members.map(m => m.userId)).toEqual(['a', 'b'])
    expect(groups[1]?.members.map(m => m.userId)).toEqual(['c'])
  })

  it('verliert niemanden — die Summe der Gruppen ist die Eingabe', () => {
    const input = [
      member('a', 'Hamburg', 53.55, 9.99),
      member('b', 'Wien', 48.21, 16.37),
      member('c', 'Hamburg', 53.55, 9.99),
      member('d', 'Wien', 48.21, 16.37),
      member('e', 'Pukalani', 20.83, -156.34),
    ]
    const groups = groupMembersByLocation(input)

    expect(groups.flatMap(group => group.members)).toHaveLength(input.length)
    expect(new Set(groups.flatMap(group => group.members.map(m => m.userId))).size).toBe(input.length)
  })

  it('hält die Reihenfolge stabil: Gruppen nach erstem Mitglied, Mitglieder nach Eingabe', () => {
    const groups = groupMembersByLocation([
      member('a', 'Wien', 48.21, 16.37),
      member('b', 'Hamburg', 53.55, 9.99),
      member('c', 'Wien', 48.21, 16.37),
    ])

    expect(groups.map(group => group.label)).toEqual(['Wien', 'Hamburg'])
    expect(groups[0]?.members.map(m => m.userId)).toEqual(['a', 'c'])
  })

  it('trennt NAHE, aber verschiedene Orte — es wird nicht gerundet', () => {
    const groups = groupMembersByLocation([
      member('a', 'Nord', 53.55, 9.99),
      member('b', 'Süd', 53.54, 9.99),
    ])

    expect(groups).toHaveLength(2)
  })

  it('fasst gleiche Koordinaten mit abweichendem Label zusammen — der Punkt entscheidet', () => {
    const groups = groupMembersByLocation([
      member('a', 'Hamburg', 53.55, 9.99),
      member('b', 'Hamburg, Deutschland', 53.55, 9.99),
    ])

    expect(groups).toHaveLength(1)
    // Das Label des ERSTEN Mitglieds gewinnt — die einzige Wahl, die nicht von
    // der Sortierung abhängt.
    expect(groups[0]?.label).toBe('Hamburg')
  })

  it('trennt gleiche Labels an verschiedenen Orten', () => {
    const groups = groupMembersByLocation([
      member('a', 'Springfield', 39.8, -89.65),
      member('b', 'Springfield', 42.1, -72.59),
    ])

    expect(groups).toHaveLength(2)
  })

  it('gibt bei leerer Eingabe eine leere Liste', () => {
    expect(groupMembersByLocation([])).toEqual([])
  })

  it('benutzt denselben Schlüssel wie locationKey', () => {
    const groups = groupMembersByLocation([member('a', 'Wien', 48.21, 16.37)])
    expect(groups[0]?.key).toBe(locationKey(48.21, 16.37))
  })
})
