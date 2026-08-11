import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACCOUNT_ACTIVITY_EXCERPT_MAX,
  ACCOUNT_ACTIVITY_KINDS,
  accountActivityExcerpt,
  groupAccountActivityByCommunity,
  isAccountActivityKind,
  mergeAccountActivity,
  type AccountActivityEntry,
} from '../shared/accountActivity'
import {
  __resetAccountActivityContributors,
  listAccountActivityContributors,
  registerAccountActivityContributor,
} from '../server/utils/accountActivity'

function entry(over: Partial<AccountActivityEntry> & Pick<AccountActivityEntry, 'id' | 'createdAt'>): AccountActivityEntry {
  return {
    source: 'posts',
    kind: 'post',
    communityId: 't-alpha',
    title: 'Titel',
    path: '/feed',
    ...over,
  }
}

describe('accountActivityExcerpt', () => {
  it('zieht Umbrüche und Mehrfach-Leerzeichen zusammen', () => {
    expect(accountActivityExcerpt('Hallo\n\n  Welt  ')).toBe('Hallo Welt')
  })

  it('gibt bei leerer Eingabe einen leeren String (nie null/undefined)', () => {
    expect(accountActivityExcerpt(null)).toBe('')
    expect(accountActivityExcerpt(undefined)).toBe('')
  })

  it('kürzt mit Auslassungszeichen und lässt kein Leerzeichen davor stehen', () => {
    const text = `${'a'.repeat(118)} bcdef`
    const out = accountActivityExcerpt(text)
    expect(out.endsWith('…')).toBe(true)
    expect(out.endsWith(' …')).toBe(false)
    // 120 Zeichen Budget + das Auslassungszeichen, nie mehr.
    expect(out.length).toBeLessThanOrEqual(ACCOUNT_ACTIVITY_EXCERPT_MAX + 1)
  })

  it('lässt einen Text auf der Grenze unangetastet (kein Zeichen zu früh)', () => {
    const exact = 'x'.repeat(ACCOUNT_ACTIVITY_EXCERPT_MAX)
    expect(accountActivityExcerpt(exact)).toBe(exact)
    expect(accountActivityExcerpt(exact)).not.toContain('…')
  })
})

describe('mergeAccountActivity', () => {
  it('sortiert quellenübergreifend neueste zuerst', () => {
    const merged = mergeAccountActivity([
      [entry({ id: 'a', createdAt: '2026-08-01T10:00:00.000Z' })],
      [entry({ id: 'b', source: 'comments', kind: 'comment', createdAt: '2026-08-03T10:00:00.000Z' })],
      [entry({ id: 'c', source: 'events', kind: 'rsvp', createdAt: '2026-08-02T10:00:00.000Z' })],
    ], 50)
    expect(merged.map(e => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('ordnet zeitgleiche Einträge STABIL nach Id — nicht nach Antwort-Reihenfolge', () => {
    const stamp = '2026-08-05T12:00:00.000Z'
    const forwards = mergeAccountActivity([
      [entry({ id: 'aaa', createdAt: stamp })],
      [entry({ id: 'zzz', source: 'comments', kind: 'comment', createdAt: stamp })],
    ], 50)
    const backwards = mergeAccountActivity([
      [entry({ id: 'zzz', source: 'comments', kind: 'comment', createdAt: stamp })],
      [entry({ id: 'aaa', createdAt: stamp })],
    ], 50)
    expect(forwards.map(e => e.id)).toEqual(backwards.map(e => e.id))
    expect(forwards.map(e => e.id)).toEqual(['zzz', 'aaa'])
  })

  it('deckelt auf das Budget und behält dabei die NEUESTEN', () => {
    const batch = Array.from({ length: 10 }, (_, i) =>
      entry({ id: `id${i}`, createdAt: `2026-08-0${i % 9 + 1}T10:00:00.000Z` }))
    const merged = mergeAccountActivity([batch], 3)
    expect(merged).toHaveLength(3)
    expect(merged[0]!.createdAt).toBe('2026-08-09T10:00:00.000Z')
  })

  it('dedupliziert über source+id, aber NICHT über die Id allein', () => {
    const merged = mergeAccountActivity([
      [entry({ id: 'same', createdAt: '2026-08-01T10:00:00.000Z' })],
      [entry({ id: 'same', createdAt: '2026-08-01T10:00:00.000Z' })],
      [entry({ id: 'same', source: 'comments', kind: 'comment', createdAt: '2026-08-01T10:00:00.000Z' })],
    ], 50)
    // Zwei Layer dürfen dieselbe Row-Id tragen — Row-Ids sind pro Tabelle
    // eindeutig, nicht global über Tabellen hinweg.
    expect(merged).toHaveLength(2)
    expect(merged.map(e => e.source).sort()).toEqual(['comments', 'posts'])
  })

  it('verträgt leere Beiträge', () => {
    expect(mergeAccountActivity([[], []], 50)).toEqual([])
  })
})

describe('groupAccountActivityByCommunity', () => {
  const entries = mergeAccountActivity([[
    entry({ id: 'neu', communityId: 't-beta', createdAt: '2026-08-09T10:00:00.000Z' }),
    entry({ id: 'alt', communityId: 't-alpha', createdAt: '2026-08-01T10:00:00.000Z' }),
    entry({ id: 'mittel', communityId: 't-beta', createdAt: '2026-08-05T10:00:00.000Z' }),
  ]], 50)

  it('sortiert Gruppen nach ihrem neuesten Eintrag, nicht nach Name oder Id', () => {
    const groups = groupAccountActivityByCommunity(entries, { 't-alpha': 'alpha.pukalani.app', 't-beta': 'beta.pukalani.app' })
    expect(groups.map(g => g.communityId)).toEqual(['t-beta', 't-alpha'])
  })

  it('behält innerhalb einer Gruppe die gemischte Reihenfolge', () => {
    const groups = groupAccountActivityByCommunity(entries, {})
    expect(groups[0]!.entries.map(e => e.id)).toEqual(['neu', 'mittel'])
  })

  it('lässt den Host LEER, wenn der Resolver ihn nicht kennt — verwirft den Eintrag aber nicht', () => {
    // Gegenprobe zur Fail-soft-Regel: eine stillgelegte oder abuse-gesperrte
    // Community fehlt in der Host-Karte. Ihre Einträge sind trotzdem die
    // eigenen und gehören in die Selbstauskunft — nur eben ohne Klickziel.
    const groups = groupAccountActivityByCommunity(entries, { 't-beta': 'beta.pukalani.app' })
    const alpha = groups.find(g => g.communityId === 't-alpha')
    expect(alpha).toBeDefined()
    expect(alpha!.host).toBe('')
    expect(alpha!.entries).toHaveLength(1)
  })

  it('gibt für eine leere Zeitleiste keine Gruppen', () => {
    expect(groupAccountActivityByCommunity([], { 't-alpha': 'alpha.pukalani.app' })).toEqual([])
  })
})

describe('ACCOUNT_ACTIVITY_KINDS', () => {
  it('ist geschlossen und deckt die vier AH-3-Zusagen ab', () => {
    expect([...ACCOUNT_ACTIVITY_KINDS]).toEqual(['post', 'comment', 'rsvp', 'enrollment'])
  })

  it('erkennt Fremdes nicht als Art', () => {
    expect(isAccountActivityKind('post')).toBe(true)
    expect(isAccountActivityKind('vote')).toBe(false)
  })
})

describe('Contributor-Registry', () => {
  beforeEach(() => { __resetAccountActivityContributors() })

  it('gibt Contributors in stabiler Reihenfolge zurück — unabhängig vom Laden', () => {
    registerAccountActivityContributor({ id: 'posts', listAccountActivity: async () => [] })
    registerAccountActivityContributor({ id: 'comments', listAccountActivity: async () => [] })
    registerAccountActivityContributor({ id: 'events', listAccountActivity: async () => [] })
    expect(listAccountActivityContributors().map(c => c.id)).toEqual(['comments', 'events', 'posts'])
  })

  it('ist idempotent — ein zweites Plugin überschreibt nur sich selbst', () => {
    registerAccountActivityContributor({ id: 'posts', listAccountActivity: async () => [] })
    registerAccountActivityContributor({ id: 'posts', listAccountActivity: async () => [entry({ id: 'x', createdAt: '2026-08-01T10:00:00.000Z' })] })
    expect(listAccountActivityContributors()).toHaveLength(1)
  })
})
