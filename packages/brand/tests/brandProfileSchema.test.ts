import { describe, expect, it } from 'vitest'
import {
  createBrandProfileCreateSchema,
  createBrandProfilePatchSchema,
} from '../schemas/brandProfile'
import {
  BRAND_ABOUT_MAX,
  BRAND_AUDIENCE_MAX,
  BRAND_INDUSTRY_MAX,
  BRAND_WEBSITE_URL_MAX,
  isBrandWebsiteUrl,
} from '../shared/brandStartCard'
import { brandIndustrySuggestions } from '../shared/industrySuggestions'

/**
 * DIE STARTKARTE AN DER TÜR (P2.5) — was die Anlage-Route annimmt und was
 * nicht.
 *
 * Die vier SPALTEN sind additiv und tragen '' (brand-009, wegen der
 * Bestands-Zeilen). Die PFLICHT lebt deshalb ausschliesslich hier — fällt sie
 * still weg, entstehen wieder Brandings, aus denen George beim ersten Zug
 * nichts entnehmen kann, und der Fehler zeigt sich erst Wochen später an einem
 * dünnen Entwurf. Genau deshalb steht sie unter Test.
 */

const LOCALES = ['en', 'de']

const startCard = {
  websiteUrl: 'https://kailua.coffee',
  industry: 'Kaffeerösterei',
  about: 'Wir rösten Kaffee in kleinen Mengen auf Maui.',
  audience: 'Cafés und kleine Läden auf der Insel.',
}

function createBody(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Kailua Coffee',
    contentLocale: 'de',
    pathKind: 'new',
    hasName: true,
    team: 'solo',
    ...startCard,
    ...overrides,
  }
}

function parseCreate(overrides: Record<string, unknown> = {}) {
  return createBrandProfileCreateSchema(LOCALES).safeParse(createBody(overrides))
}

describe('isBrandWebsiteUrl — eine Adresse oder gar keine', () => {
  it('nimmt http und https', () => {
    expect(isBrandWebsiteUrl('https://kailua.coffee')).toBe(true)
    expect(isBrandWebsiteUrl('http://kailua.coffee/roasting?x=1')).toBe(true)
  })

  it('LEER ist gültig — die URL ist ausdrücklich optional (§2.1)', () => {
    expect(isBrandWebsiteUrl('')).toBe(true)
  })

  it('weist alles ab, was keine vollständige Web-Adresse ist', () => {
    expect(isBrandWebsiteUrl('kailua.coffee')).toBe(false)
    expect(isBrandWebsiteUrl('www.kailua.coffee')).toBe(false)
    expect(isBrandWebsiteUrl('irgendein Text')).toBe(false)
  })

  it('und jedes andere Schema — auch die, die wie eine Adresse aussehen', () => {
    expect(isBrandWebsiteUrl('mailto:hallo@kailua.coffee')).toBe(false)
    expect(isBrandWebsiteUrl('javascript:alert(1)')).toBe(false)
    expect(isBrandWebsiteUrl('ftp://kailua.coffee')).toBe(false)
  })
})

describe('Anlage: die drei inhaltlichen Felder sind PFLICHT', () => {
  it('eine vollständige Karte geht durch — und wird getrimmt', () => {
    const parsed = parseCreate({ industry: '  Kaffeerösterei  ' })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.industry).toBe('Kaffeerösterei')
    expect(parsed.data?.about).toBe(startCard.about)
    expect(parsed.data?.audience).toBe(startCard.audience)
  })

  it.each(['industry', 'about', 'audience'])('ohne %s: abgewiesen', (field) => {
    expect(parseCreate({ [field]: undefined }).success).toBe(false)
  })

  it.each(['industry', 'about', 'audience'])('%s aus lauter Leerzeichen zählt als leer', (field) => {
    expect(parseCreate({ [field]: '   ' }).success).toBe(false)
  })

  it.each([
    ['industry', BRAND_INDUSTRY_MAX],
    ['about', BRAND_ABOUT_MAX],
    ['audience', BRAND_AUDIENCE_MAX],
  ])('%s hält den Spalten-Deckel ein', (field, max) => {
    expect(parseCreate({ [field]: 'x'.repeat(max) }).success).toBe(true)
    expect(parseCreate({ [field]: 'x'.repeat(max + 1) }).success).toBe(false)
  })
})

describe('Anlage: die URL ist freiwillig, aber muss eine sein', () => {
  it('fehlt sie ganz, steht eine leere Zeichenkette in der Zeile — nie undefined', () => {
    const parsed = parseCreate({ websiteUrl: undefined })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.websiteUrl).toBe('')
  })

  it('leer abgeschickt ist ebenfalls in Ordnung', () => {
    expect(parseCreate({ websiteUrl: '' }).success).toBe(true)
    expect(parseCreate({ websiteUrl: '   ' }).data?.websiteUrl).toBe('')
  })

  it('KAPUTT wird abgewiesen, statt still gespeichert zu werden', () => {
    const parsed = parseCreate({ websiteUrl: 'kailua.coffee' })
    expect(parsed.success).toBe(false)
    expect(JSON.stringify(parsed.error?.issues)).toContain('brand.validation.websiteUrl')
  })

  it('und sie hält den Spalten-Deckel ein', () => {
    const long = `https://kailua.coffee/${'x'.repeat(BRAND_WEBSITE_URL_MAX)}`
    expect(parseCreate({ websiteUrl: long }).success).toBe(false)
  })
})

describe('Anlage: die Karte kommt zu den Weichen, sie ersetzt sie nicht', () => {
  it('ein unbekanntes Feld bleibt draußen (strict)', () => {
    expect(parseCreate({ foundedIn: 2019 }).success).toBe(false)
  })

  it('die alten Regeln gelten unverändert', () => {
    expect(parseCreate({ contentLocale: 'fr' }).success).toBe(false)
    expect(parseCreate({ pathKind: 'new', relaunchScope: 'recut' }).success).toBe(false)
  })
})

describe('PATCH: korrigierbar, aber nicht leerbar', () => {
  const patch = createBrandProfilePatchSchema()

  it('nimmt jedes der vier Felder EINZELN entgegen', () => {
    expect(patch.safeParse({ industry: 'Rösterei' }).success).toBe(true)
    expect(patch.safeParse({ about: 'Neu erzählt.' }).success).toBe(true)
    expect(patch.safeParse({ audience: 'Cafés.' }).success).toBe(true)
    expect(patch.safeParse({ websiteUrl: 'https://kailua.coffee' }).success).toBe(true)
  })

  it('die URL DARF geleert werden — sie war nie eine Antwort', () => {
    const parsed = patch.safeParse({ websiteUrl: '' })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.websiteUrl).toBe('')
  })

  it('die drei Pflichtfelder NICHT — weglassen heißt „nicht angefasst"', () => {
    expect(patch.safeParse({ industry: '' }).success).toBe(false)
    expect(patch.safeParse({ about: '   ' }).success).toBe(false)
    expect(patch.safeParse({ audience: '' }).success).toBe(false)
  })

  it('ein leerer Rumpf bleibt abgewiesen', () => {
    expect(patch.safeParse({}).success).toBe(false)
  })

  it('die Inhaltssprache kennt der PATCH weiterhin NICHT', () => {
    expect(patch.safeParse({ contentLocale: 'en' }).success).toBe(false)
  })
})

describe('Branchen-Vorschläge folgen der INHALTSSPRACHE', () => {
  it('deutsche Marke, deutsche Vorschläge — und umgekehrt', () => {
    expect(brandIndustrySuggestions('de')).toContain('Handwerk')
    expect(brandIndustrySuggestions('en')).toContain('Craft & trades')
  })

  it('eine unbekannte Sprache bekommt die Hauptsprache, nie eine leere Liste', () => {
    expect(brandIndustrySuggestions('fr')).toEqual(brandIndustrySuggestions('en'))
    expect(brandIndustrySuggestions('').length).toBeGreaterThan(0)
  })

  it('die Vorschläge passen unter den Spalten-Deckel', () => {
    for (const locale of LOCALES) {
      for (const suggestion of brandIndustrySuggestions(locale)) {
        expect(suggestion.length).toBeLessThanOrEqual(BRAND_INDUSTRY_MAX)
      }
    }
  })
})
