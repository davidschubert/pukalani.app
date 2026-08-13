import { describe, expect, it } from 'vitest'
import {
  type CommunityNavCandidate,
  type CommunityNavOverride,
  MAX_NAV_CONFIG_CHARS,
  communityNavConfigFits,
  filterChromeNavEntries,
  isCustomNavLinkId,
  isSafeExternalNavTarget,
  isSafeInternalNavTarget,
  nextCustomNavLinkId,
  parseCommunityNavOverride,
  resolveCommunityNav,
} from '../shared/communityNavigation'

/**
 * DIE REGEL HINTER DEM NAVIGATIONS-EDITOR (U15 Teil 1).
 *
 * Jede Zusage aus dem Kopf von `resolveCommunityNav` hat hier ihre GEGENPROBE —
 * ein Test, der grün bliebe, wenn die Regel gar nichts täte, beweist nichts.
 */

const candidates: CommunityNavCandidate[] = [
  { id: 'feed', label: 'Feed', to: '/feed', order: 10 },
  { id: 'discussions', label: 'Discussions', to: '/discussions', order: 20 },
  { id: 'events', label: 'Events', to: '/events', order: 30 },
  { id: 'page-about', label: 'About us', to: '/about', order: 60 },
]

const ids = (items: { id: string }[]) => items.map(item => item.id)

describe('resolveCommunityNav — ohne gespeicherte Wahl', () => {
  it('sortiert nach order (das Verhalten von vor U15)', () => {
    expect(ids(resolveCommunityNav(candidates, null))).toEqual(['feed', 'discussions', 'events', 'page-about'])
  })

  it('behandelt undefined und ein leeres entries-Array gleich', () => {
    expect(ids(resolveCommunityNav(candidates, undefined))).toEqual(ids(resolveCommunityNav(candidates, { entries: [] })))
  })

  it('rührt die übergebene Liste nicht an (kein in-place sort)', () => {
    const input = [...candidates].reverse()
    const snapshot = ids(input)
    resolveCommunityNav(input, null)
    expect(ids(input)).toEqual(snapshot)
  })
})

describe('resolveCommunityNav — umordnen', () => {
  it('nimmt die Reihenfolge des Overrides, nicht die order', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'events' }, { id: 'feed' }] }
    expect(ids(resolveCommunityNav(candidates, override))).toEqual(['events', 'feed', 'discussions', 'page-about'])
  })

  it('GEGENPROBE: nicht erwähnte Einträge verschwinden NICHT, sie hängen hinten an', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'events' }] }
    const result = ids(resolveCommunityNav(candidates, override))
    expect(result[0]).toBe('events')
    expect(result).toContain('discussions')
    expect(result).toContain('page-about')
    expect(result).toHaveLength(4)
  })

  it('eine doppelt genannte Id erscheint genau einmal', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'feed' }, { id: 'feed' }] }
    expect(ids(resolveCommunityNav(candidates, override)).filter(id => id === 'feed')).toHaveLength(1)
  })
})

describe('resolveCommunityNav — ausblenden', () => {
  it('nimmt einen versteckten Eintrag aus dem Menü', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'discussions', hidden: true }] }
    expect(ids(resolveCommunityNav(candidates, override))).not.toContain('discussions')
  })

  it('GEGENPROBE: hidden false versteckt nichts, und der Eintrag bleibt an seinem Platz', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'discussions', hidden: false }] }
    expect(ids(resolveCommunityNav(candidates, override))[0]).toBe('discussions')
  })

  it('GEGENPROBE: ein versteckter Eintrag kommt nicht über den Anhang zurück', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'feed', hidden: true }] }
    const result = ids(resolveCommunityNav(candidates, override))
    expect(result).not.toContain('feed')
    expect(result).toHaveLength(3)
  })
})

describe('resolveCommunityNav — umbenennen', () => {
  it('ersetzt den mitgelieferten Text', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'feed', label: 'Neuigkeiten' }] }
    expect(resolveCommunityNav(candidates, override)[0]!.label).toBe('Neuigkeiten')
  })

  it('GEGENPROBE: ein leerer Text fällt auf die Übersetzung zurück', () => {
    for (const label of ['', '   ']) {
      const override: CommunityNavOverride = { entries: [{ id: 'feed', label }] }
      expect(resolveCommunityNav(candidates, override)[0]!.label).toBe('Feed')
    }
  })

  it('GEGENPROBE: Umbenennen ändert das ZIEL nicht', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'feed', label: 'Woanders', to: 'https://evil.example' }] }
    const item = resolveCommunityNav(candidates, override)[0]!
    expect(item.to).toBe('/feed')
    expect(item.external).toBe(false)
  })
})

describe('resolveCommunityNav — das Plan-Gate bleibt autoritativ', () => {
  it('GEGENPROBE: ein per Tarif gesperrtes Produkt kommt durch KEIN Override zurück', () => {
    // Genau das tut das Layout: `planAllows` filtert VORHER, `events` ist also
    // gar nicht erst Kandidat.
    const gated = candidates.filter(c => c.id !== 'events')
    const override: CommunityNavOverride = { entries: [{ id: 'events', label: 'Termine' }] }
    expect(ids(resolveCommunityNav(gated, override))).not.toContain('events')
  })

  it('GEGENPROBE: auch als eigener Link getarnt nicht — die Id trägt kein link-Präfix', () => {
    const gated = candidates.filter(c => c.id !== 'events')
    const override: CommunityNavOverride = {
      entries: [{ id: 'events', label: 'Termine', to: '/events' }],
    }
    expect(ids(resolveCommunityNav(gated, override))).not.toContain('events')
  })

  it('unbekannte Ids werden still ignoriert, der Rest bleibt heil', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'ghost' }, { id: 'feed' }] }
    expect(ids(resolveCommunityNav(candidates, override))).toEqual(['feed', 'discussions', 'events', 'page-about'])
  })
})

describe('resolveCommunityNav — eigene Links', () => {
  it('nimmt einen internen Link auf', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'link-1', label: 'Hilfe', to: '/help' }] }
    const item = resolveCommunityNav(candidates, override)[0]!
    expect(item).toMatchObject({ id: 'link-1', label: 'Hilfe', to: '/help', external: false })
  })

  it('nimmt einen externen https-Link auf und markiert ihn', () => {
    const override: CommunityNavOverride = {
      entries: [{ id: 'link-1', label: 'Shop', to: 'https://shop.example', external: true }],
    }
    expect(resolveCommunityNav(candidates, override)[0]!.external).toBe(true)
  })

  it('GEGENPROBE: http, javascript: und protokollrelative Ziele fallen weg', () => {
    for (const [to, external] of [
      ['http://shop.example', true],
      ['javascript:alert(1)', false],
      ['//evil.example', false],
      ['/../etc', false],
      ['', true],
    ] as const) {
      const override: CommunityNavOverride = {
        entries: [{ id: 'link-1', label: 'X', to, ...(external ? { external: true } : {}) }],
      }
      expect(ids(resolveCommunityNav(candidates, override))).not.toContain('link-1')
    }
  })

  it('GEGENPROBE: ein eigener Link ohne Text fällt weg', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'link-1', label: '  ', to: '/help' }] }
    expect(ids(resolveCommunityNav(candidates, override))).not.toContain('link-1')
  })

  it('GEGENPROBE: ein externes Ziel OHNE external-Flag wird als Pfad geprüft und fällt weg', () => {
    const override: CommunityNavOverride = { entries: [{ id: 'link-1', label: 'X', to: 'https://x.example' }] }
    expect(ids(resolveCommunityNav(candidates, override))).not.toContain('link-1')
  })

  it('ein versteckter eigener Link erscheint nicht', () => {
    const override: CommunityNavOverride = {
      entries: [{ id: 'link-1', label: 'Shop', to: '/shop', hidden: true }],
    }
    expect(ids(resolveCommunityNav(candidates, override))).not.toContain('link-1')
  })
})

describe('Ziel-Prädikate', () => {
  it('interne Pfade', () => {
    expect(isSafeInternalNavTarget('/')).toBe(true)
    expect(isSafeInternalNavTarget('/about-us')).toBe(true)
    expect(isSafeInternalNavTarget('/a/b')).toBe(true)
    expect(isSafeInternalNavTarget('about')).toBe(false)
    expect(isSafeInternalNavTarget('//evil.example')).toBe(false)
    expect(isSafeInternalNavTarget('/a/../b')).toBe(false)
    expect(isSafeInternalNavTarget('/a?x=1')).toBe(false)
    expect(isSafeInternalNavTarget('javascript:alert(1)')).toBe(false)
  })

  it('externe Adressen', () => {
    expect(isSafeExternalNavTarget('https://x.example')).toBe(true)
    expect(isSafeExternalNavTarget('https://x.example/a?b=1')).toBe(true)
    expect(isSafeExternalNavTarget('http://x.example')).toBe(false)
    expect(isSafeExternalNavTarget('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalNavTarget('/relativ')).toBe(false)
  })

  it('erkennt eigene Link-Ids', () => {
    expect(isCustomNavLinkId('link-1')).toBe(true)
    expect(isCustomNavLinkId('link-')).toBe(false)
    expect(isCustomNavLinkId('feed')).toBe(false)
    expect(isCustomNavLinkId('page-link-1')).toBe(false)
  })

  it('vergibt Link-Ids über das Maximum, nicht über die Anzahl', () => {
    expect(nextCustomNavLinkId([])).toBe('link-1')
    expect(nextCustomNavLinkId([{ id: 'link-1' }, { id: 'link-7' }])).toBe('link-8')
    // Der entfernte link-7 darf seine Id nicht an den nächsten weitergeben.
    expect(nextCustomNavLinkId([{ id: 'link-7' }])).toBe('link-8')
    expect(nextCustomNavLinkId([{ id: 'feed' }])).toBe('link-1')
  })
})

describe('parseCommunityNavOverride', () => {
  it('liest ein gültiges Dokument', () => {
    expect(parseCommunityNavOverride('{"entries":[{"id":"feed","hidden":true}]}'))
      .toEqual({ entries: [{ id: 'feed', hidden: true }] })
  })

  it('GEGENPROBE: kaputtes JSON, leerer Wert und fremde Formen ergeben null', () => {
    for (const raw of ['', null, undefined, 'nicht json', '[]', '{}', '{"entries":"feed"}', '42']) {
      expect(parseCommunityNavOverride(raw)).toBeNull()
    }
  })

  it('wirft Müll-Einträge weg, statt am Dokument zu scheitern', () => {
    const parsed = parseCommunityNavOverride('{"entries":[{"id":"feed"},null,{"nope":1},{"id":""}]}')
    expect(parsed).toEqual({ entries: [{ id: 'feed' }] })
  })

  it('übernimmt nur die bekannten Felder in der richtigen Form', () => {
    const parsed = parseCommunityNavOverride('{"entries":[{"id":"a","hidden":"ja","label":5,"external":"x","to":"/b"}]}')
    expect(parsed).toEqual({ entries: [{ id: 'a', to: '/b' }] })
  })
})

describe('communityNavConfigFits', () => {
  it('ein gewöhnliches Menü passt', () => {
    expect(communityNavConfigFits({ entries: candidates.map(c => ({ id: c.id, label: c.label })) })).toBe(true)
  })

  it('GEGENPROBE: ein zu großes Dokument passt nicht', () => {
    const entries = Array.from({ length: 40 }, (_, i) => ({
      id: `link-${i + 1}`,
      label: 'x'.repeat(64),
      to: `https://example.com/${'y'.repeat(500)}`,
      external: true,
    }))
    expect(JSON.stringify({ entries }).length).toBeGreaterThan(MAX_NAV_CONFIG_CHARS)
    expect(communityNavConfigFits({ entries })).toBe(false)
  })
})

describe('filterChromeNavEntries', () => {
  const nav = {
    feed: { labelKey: 'nav.feed', to: '/feed', order: 10 },
    events: { labelKey: 'nav.events', to: '/events', planProduct: 'events' },
    members: { labelKey: 'nav.members', to: '/members', requiresAuth: true },
    ai: { labelKey: 'nav.ai', to: '/ai', productKey: 'ai' },
    off: false as const,
  }
  const allOn = { isLoggedIn: true, productOn: () => true, planAllows: () => true }

  it('lässt alles durch, was kein Gate hat', () => {
    expect(ids(filterChromeNavEntries(nav, allOn))).toEqual(['feed', 'events', 'members', 'ai'])
  })

  it('GEGENPROBE: `false` schaltet einen Eintrag ab', () => {
    expect(ids(filterChromeNavEntries(nav, allOn))).not.toContain('off')
  })

  it('GEGENPROBE: jedes Gate greift einzeln', () => {
    expect(ids(filterChromeNavEntries(nav, { ...allOn, isLoggedIn: false }))).not.toContain('members')
    expect(ids(filterChromeNavEntries(nav, { ...allOn, planAllows: () => false }))).not.toContain('events')
    expect(ids(filterChromeNavEntries(nav, { ...allOn, productOn: () => false }))).toEqual([])
  })

  it('ohne Registry: leere Liste statt Absturz', () => {
    expect(filterChromeNavEntries(undefined, allOn)).toEqual([])
  })
})
