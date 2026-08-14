import { describe, expect, it } from 'vitest'
import {
  EXTERNAL_REDIRECT_STATUS,
  INTERNAL_REDIRECT_STATUS,
  MAX_REDIRECT_CONFIG_CHARS,
  MAX_REDIRECT_FROM,
  MAX_REDIRECT_RULES,
  MAX_REDIRECT_TO,
  communityRedirectConfigFits,
  emptyCommunityRedirectConfig,
  findRedirectChain,
  isReservedRedirectPath,
  isSafeExternalRedirectTarget,
  isSafeInternalRedirectTarget,
  isSafeRedirectSource,
  normalizeRedirectPath,
  parseCommunityRedirectConfig,
  resolveCommunityRedirect,
} from '../shared/communityRedirects'

/**
 * DIE REGEL HINTER DEN WEITERLEITUNGEN (U15 Teil 3).
 *
 * Wie in Teil 1 und 2: jede Zusage aus dem Kopf von `resolveCommunityRedirect`
 * hat hier ihre GEGENPROBE. Das ist hier wichtiger als bei den Geschwistern —
 * die Regel läuft VOR allem anderen und entscheidet, ob ein Besucher die Seite
 * überhaupt zu sehen bekommt. Ein Test, der nur „Treffer ⇒ Ziel" prüft, bliebe
 * grün, wenn sie ALLES umleitete.
 */

const LOCALES = ['en', 'de']

function cfg(...rules: Array<{ from: string, to: string, external?: boolean }>) {
  return { rules }
}

describe('normalizeRedirectPath', () => {
  it('nimmt den Schrägstrich am Ende weg, die Wurzel behält ihn', () => {
    expect(normalizeRedirectPath('/alt/')).toBe('/alt')
    expect(normalizeRedirectPath('/a/b///')).toBe('/a/b')
    expect(normalizeRedirectPath('/')).toBe('/')
  })

  it('lässt Gross- und Kleinschreibung in Ruhe', () => {
    expect(normalizeRedirectPath('/Team')).toBe('/Team')
  })

  it('gibt für alles, was kein Pfad ist, den leeren String', () => {
    expect(normalizeRedirectPath('alt')).toBe('')
    expect(normalizeRedirectPath('https://example.com')).toBe('')
    expect(normalizeRedirectPath(undefined)).toBe('')
    expect(normalizeRedirectPath(42)).toBe('')
  })
})

describe('isSafeRedirectSource', () => {
  it('nimmt einen gewöhnlichen Pfad', () => {
    expect(isSafeRedirectSource('/ueber-uns')).toBe(true)
    expect(isSafeRedirectSource('/blog/2024/rueckblick')).toBe(true)
    expect(isSafeRedirectSource('/impressum.html')).toBe(true)
  })

  it('lehnt Schemata, protokollrelative Adressen und Traversal ab', () => {
    expect(isSafeRedirectSource('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirectSource('/a:b')).toBe(false)
    expect(isSafeRedirectSource('//example.com')).toBe(false)
    expect(isSafeRedirectSource('/a/../b')).toBe(false)
    expect(isSafeRedirectSource('https://example.com/x')).toBe(false)
  })

  it('lehnt die Startseite ab', () => {
    expect(isSafeRedirectSource('/')).toBe(false)
    expect(isSafeRedirectSource('//')).toBe(false)
  })

  it('lehnt jeden System-Pfad ab — Anmeldung, Verwaltung, Interna', () => {
    for (const path of [
      '/api', '/api/pages', '/_nuxt/entry.js', '/dashboard', '/dashboard/community/redirects',
      '/settings', '/account/billing', '/login', '/register', '/join', '/start', '/verify',
      '/forgot-password', '/reset-password', '/embed', '/og/x.png', '/robots.txt',
      '/sitemap.xml', '/favicon.ico',
    ]) {
      expect(isSafeRedirectSource(path), path).toBe(false)
    }
  })

  it('lässt die Pfade der PRODUKTE zu — sie gehören der Community', () => {
    for (const path of ['/feed', '/discussions/x', '/events', '/courses', '/pages', '/profile']) {
      expect(isSafeRedirectSource(path), path).toBe(true)
    }
  })

  it('lehnt zu lange Pfade ab', () => {
    expect(isSafeRedirectSource(`/${'a'.repeat(MAX_REDIRECT_FROM)}`)).toBe(false)
  })
})

describe('isReservedRedirectPath', () => {
  it('trifft den Bereich, nicht den Namensanfang', () => {
    expect(isReservedRedirectPath('/login')).toBe(true)
    expect(isReservedRedirectPath('/login/oauth')).toBe(true)
    // `/logindaten` ist eine gewöhnliche Seite und darf umziehen.
    expect(isReservedRedirectPath('/logindaten')).toBe(false)
    expect(isReservedRedirectPath('/dashboards')).toBe(false)
  })
})

describe('Ziele', () => {
  it('intern: ein Pfad, sonst nichts', () => {
    expect(isSafeInternalRedirectTarget('/team')).toBe(true)
    // Nach `/login` DARF man leiten — verboten ist nur, von dort weg.
    expect(isSafeInternalRedirectTarget('/login')).toBe(true)
    expect(isSafeInternalRedirectTarget('//example.com')).toBe(false)
    expect(isSafeInternalRedirectTarget('https://example.com')).toBe(false)
    expect(isSafeInternalRedirectTarget(`/${'a'.repeat(MAX_REDIRECT_TO)}`)).toBe(false)
  })

  it('extern: https, sonst nichts', () => {
    expect(isSafeExternalRedirectTarget('https://example.com/neu')).toBe(true)
    expect(isSafeExternalRedirectTarget('http://example.com')).toBe(false)
    expect(isSafeExternalRedirectTarget('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalRedirectTarget('https://')).toBe(false)
    expect(isSafeExternalRedirectTarget('/team')).toBe(false)
  })
})

describe('findRedirectChain', () => {
  it('lehnt den Ringschluss ab', () => {
    const found = findRedirectChain([{ from: '/a', to: '/b' }, { from: '/b', to: '/a' }])
    expect(found).not.toBeNull()
  })

  it('lehnt auch die harmlose Kette ab (bewusst gröber als das Problem)', () => {
    const found = findRedirectChain([{ from: '/a', to: '/b' }, { from: '/b', to: '/c' }])
    expect(found?.from).toBe('/a')
  })

  it('lehnt die Regel auf sich selbst ab', () => {
    expect(findRedirectChain([{ from: '/a', to: '/a' }])).not.toBeNull()
  })

  it('sieht durch den Schrägstrich am Ende hindurch', () => {
    expect(findRedirectChain([{ from: '/a', to: '/b/' }, { from: '/b', to: '/c' }])).not.toBeNull()
  })

  it('lässt eine gewöhnliche Liste durch, externe Ziele sind nie Quellen', () => {
    expect(findRedirectChain([
      { from: '/a', to: '/x' },
      { from: '/b', to: '/x' },
      { from: '/c', to: 'https://example.com/a', external: true },
    ])).toBeNull()
  })
})

describe('resolveCommunityRedirect — Zusage (1): kein Treffer heisst nichts', () => {
  it('ohne Regeln, ohne Config, mit leerer Config', () => {
    expect(resolveCommunityRedirect(null, '/alt', LOCALES)).toBeNull()
    expect(resolveCommunityRedirect(undefined, '/alt', LOCALES)).toBeNull()
    expect(resolveCommunityRedirect(emptyCommunityRedirectConfig(), '/alt', LOCALES)).toBeNull()
  })

  it('ein Pfad, über den keine Regel etwas sagt', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/ganz-anders', LOCALES)).toBeNull()
  })

  it('die Startseite wird nie umgeleitet', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/', to: '/neu' }), '/', LOCALES)).toBeNull()
  })
})

describe('resolveCommunityRedirect — der einfache Treffer', () => {
  it('intern ⇒ 301', () => {
    const hit = resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/alt', LOCALES)
    expect(hit).toEqual({ to: '/neu', status: INTERNAL_REDIRECT_STATUS, external: false })
  })

  it('extern ⇒ 302', () => {
    const hit = resolveCommunityRedirect(
      cfg({ from: '/alt', to: 'https://example.com/neu', external: true }),
      '/alt',
      LOCALES,
    )
    expect(hit).toEqual({ to: 'https://example.com/neu', status: EXTERNAL_REDIRECT_STATUS, external: true })
  })

  it('der Schrägstrich am Ende trifft dieselbe Regel', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/alt/', LOCALES)?.to).toBe('/neu')
  })

  it('bei doppelter Quelle gewinnt die erste', () => {
    const hit = resolveCommunityRedirect(cfg({ from: '/alt', to: '/eins' }, { from: '/alt', to: '/zwei' }), '/alt', LOCALES)
    expect(hit?.to).toBe('/eins')
  })
})

describe('resolveCommunityRedirect — Zusagen (2) und (3): die Sprache', () => {
  it('eine präfixlose Regel fängt den präfixlosen Pfad', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/alt', LOCALES)?.to).toBe('/neu')
  })

  it('… und den mit Präfix, und das Präfix wandert mit', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/de/alt', LOCALES)?.to).toBe('/de/neu')
  })

  it('der exakte Treffer gewinnt vor dem Sprach-Treffer', () => {
    const config = cfg({ from: '/alt', to: '/neu' }, { from: '/de/alt', to: '/de/anders' })
    expect(resolveCommunityRedirect(config, '/de/alt', LOCALES)?.to).toBe('/de/anders')
    expect(resolveCommunityRedirect(config, '/alt', LOCALES)?.to).toBe('/neu')
  })

  it('ein EXTERNES Ziel bekommt nie ein Sprach-Präfix', () => {
    const hit = resolveCommunityRedirect(
      cfg({ from: '/alt', to: 'https://example.com/neu', external: true }),
      '/de/alt',
      LOCALES,
    )
    expect(hit?.to).toBe('https://example.com/neu')
  })

  it('ein Segment, das keine konfigurierte Sprache ist, bleibt Teil des Pfads', () => {
    // `/it/handbuch` ist eine gewöhnliche Seite, solange `it` keine Sprache ist.
    expect(resolveCommunityRedirect(cfg({ from: '/handbuch', to: '/neu' }), '/it/handbuch', LOCALES)).toBeNull()
    expect(resolveCommunityRedirect(cfg({ from: '/it/handbuch', to: '/neu' }), '/it/handbuch', LOCALES)?.to).toBe('/neu')
  })

  it('ohne Sprach-Liste gibt es kein Präfix — dann zählt nur der exakte Treffer', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/de/alt')).toBeNull()
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/neu' }), '/alt')?.to).toBe('/neu')
  })
})

describe('resolveCommunityRedirect — Zusage (4): System-Pfade, fail-closed', () => {
  it('leitet einen System-Pfad auch dann nicht um, wenn die Zeile es sagt', () => {
    for (const path of ['/login', '/dashboard/pages', '/api/pages', '/robots.txt']) {
      const config = cfg({ from: path, to: 'https://example.com/phish', external: true })
      expect(resolveCommunityRedirect(config, path, LOCALES), path).toBeNull()
    }
  })

  it('… und auch nicht mit Sprach-Präfix davor', () => {
    const config = cfg({ from: '/login', to: 'https://example.com/phish', external: true })
    expect(resolveCommunityRedirect(config, '/de/login', LOCALES)).toBeNull()
  })
})

describe('resolveCommunityRedirect — Zusage (5): nie auf sich selbst', () => {
  it('Regel auf sich selbst', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/alt' }), '/alt', LOCALES)).toBeNull()
  })

  it('… auch wenn erst das Sprach-Präfix die Gleichheit herstellt', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '/alt' }), '/de/alt', LOCALES)).toBeNull()
  })
})

describe('resolveCommunityRedirect — defensiv gegen kaputte Zeilen', () => {
  it('überspringt Regeln mit unsicherem Ziel, statt sie zu befolgen', () => {
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: '//example.com' }), '/alt', LOCALES)).toBeNull()
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: 'http://example.com', external: true }), '/alt', LOCALES)).toBeNull()
    expect(resolveCommunityRedirect(cfg({ from: '/alt', to: 'javascript:alert(1)', external: true }), '/alt', LOCALES)).toBeNull()
  })

  it('verträgt Müll in der Liste', () => {
    const broken = { rules: [null, 42, { from: 5, to: '/x' }, { from: '/alt', to: '/neu' }] } as never
    expect(resolveCommunityRedirect(broken, '/alt', LOCALES)?.to).toBe('/neu')
  })

  it('rechnet nie mehr als MAX_REDIRECT_RULES Regeln durch', () => {
    const rules = Array.from({ length: MAX_REDIRECT_RULES + 5 }, (_, i) => ({ from: `/a${i}`, to: `/b${i}` }))
    expect(resolveCommunityRedirect({ rules }, `/a${MAX_REDIRECT_RULES + 4}`, LOCALES)).toBeNull()
    expect(resolveCommunityRedirect({ rules }, '/a0', LOCALES)?.to).toBe('/b0')
  })
})

describe('parseCommunityRedirectConfig', () => {
  it('liest ein gültiges Dokument', () => {
    const parsed = parseCommunityRedirectConfig(JSON.stringify(cfg({ from: '/alt/', to: '/neu/' })))
    expect(parsed).toEqual({ rules: [{ from: '/alt', to: '/neu' }] })
  })

  it('wirft nie — kaputtes JSON, falsche Form, leer', () => {
    expect(parseCommunityRedirectConfig('{nope')).toBeNull()
    expect(parseCommunityRedirectConfig('[]')).toBeNull()
    expect(parseCommunityRedirectConfig('{"rules":{}}')).toBeNull()
    expect(parseCommunityRedirectConfig('')).toBeNull()
    expect(parseCommunityRedirectConfig(null)).toBeNull()
  })

  it('wirft einzelne unsichere Regeln weg, behält den Rest', () => {
    const raw = JSON.stringify({
      rules: [
        { from: '/login', to: '/x' },
        { from: '/alt', to: 'javascript:alert(1)' },
        { from: '/gut', to: '/neu' },
      ],
    })
    expect(parseCommunityRedirectConfig(raw)).toEqual({ rules: [{ from: '/gut', to: '/neu' }] })
  })
})

describe('communityRedirectConfigFits', () => {
  it('das realistische Dokument passt weit', () => {
    const rules = Array.from({ length: MAX_REDIRECT_RULES }, (_, i) => ({ from: `/alte-seite-${i}`, to: `/neue-seite-${i}` }))
    expect(communityRedirectConfigFits({ rules })).toBe(true)
  })

  /**
   * DIE NACHRECHNUNG AUS DEM KOPF DER KONSTANTEN, ALS TEST.
   *
   * Das GRÖSSTMÖGLICHE legale Dokument — 100 Regeln, jede mit maximal langer
   * Quelle und maximal langem Ziel — muss durchgehen: eine Grenze, die
   * erlaubte Eingaben ablehnt, wäre ein Fehler, den erst der Kunde findet.
   * Gleichzeitig belegt die Messung, dass das Dokument die 16.381 Zeichen
   * einer varchar-Spalte weit sprengt — das ist der Grund für MEDIUMTEXT.
   */
  it('das grösstmögliche legale Dokument passt — und sprengt jede varchar-Spalte', () => {
    const rules = Array.from({ length: MAX_REDIRECT_RULES }, (_, i) => ({
      from: `/${String(i).padStart(4, '0')}${'a'.repeat(MAX_REDIRECT_FROM - 6)}`,
      to: `/${'b'.repeat(MAX_REDIRECT_TO - 2)}`,
    }))
    const size = JSON.stringify({ rules }).length
    expect(size).toBeGreaterThan(16_381)
    expect(size).toBeLessThanOrEqual(MAX_REDIRECT_CONFIG_CHARS)
    expect(communityRedirectConfigFits({ rules })).toBe(true)
  })

  it('… und ein Zeichen über der Grenze passt nicht mehr', () => {
    const filler = 'x'.repeat(MAX_REDIRECT_CONFIG_CHARS)
    expect(communityRedirectConfigFits({ rules: [{ from: '/a', to: filler }] })).toBe(false)
  })
})
