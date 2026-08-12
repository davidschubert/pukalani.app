import { describe, expect, it } from 'vitest'
import de from '../i18n/locales/de.json'
import en from '../i18n/locales/en.json'
import { buildWelcomePostText } from '../server/utils/seedWelcomePost'
import { WELCOME_POST_ROW_ID_PREFIX, welcomePostRowId } from '../shared/welcomePost'

/**
 * Der Katalog der Wizard-Kategorien gehört dem control-Layer — und ein
 * Produkt-Layer darf ihn nicht importieren, auch nicht im Test (A14, ESLint
 * `pukalani/no-cross-layer-relative`; beim Bau von U4 genau hier gefangen).
 * Die Liste steht deshalb HIER, und der Preis ist benannt: kommt im Wizard
 * eine Kategorie dazu, fällt es nicht auf, solange niemand diese Zeile pflegt.
 * Er ist tragbar, weil die Kategorie-Zeile DEKORATION ist — ein unbekannter
 * Schlüssel lässt sie weg, statt etwas kaputtzumachen (eigener Test unten).
 * SITE_CATEGORIES, Stand 2026-08-12.
 */
const WIZARD_CATEGORIES = [
  'coaching', 'education', 'creator', 'club', 'business', 'health', 'craft', 'other',
] as const

const TENANT = 't-687f2ac31b9d4e5a8c02'

describe('welcomePostRowId', () => {
  it('ist ableitbar — dieselbe Community, dieselbe Id', () => {
    expect(welcomePostRowId(TENANT)).toBe(welcomePostRowId(TENANT))
    expect(welcomePostRowId(TENANT)).toBe(`${WELCOME_POST_ROW_ID_PREFIX}${TENANT}`)
  })
  it('unterscheidet Communities', () => {
    expect(welcomePostRowId(TENANT)).not.toBe(welcomePostRowId('t-andere'))
  })
  it('bleibt im 36-Zeichen-Budget einer Appwrite-Zeilen-Id', () => {
    expect(welcomePostRowId(TENANT).length).toBeLessThanOrEqual(36)
    // Gegenprobe: auch ein unerwartet langer Scope reißt das Limit nicht.
    expect(welcomePostRowId('t-' + 'x'.repeat(80)).length).toBe(36)
  })
})

describe('buildWelcomePostText', () => {
  const base = { siteName: 'Chorverein Wetzlar', locale: 'de' }

  it('nennt die Community im Titel', () => {
    expect(buildWelcomePostText(base).title).toBe('Willkommen bei Chorverein Wetzlar')
    expect(buildWelcomePostText({ ...base, locale: 'en' }).title).toBe('Welcome to Chorverein Wetzlar')
  })

  it('sagt IMMER, dass es ein Beispiel ist und wie man es loswird', () => {
    for (const locale of ['de', 'en']) {
      const { body } = buildWelcomePostText({ ...base, locale })
      expect(body.toLowerCase()).toContain(locale === 'de' ? 'beispiel' : 'example')
      expect(body.toLowerCase()).toContain(locale === 'de' ? 'löschen' : 'delete')
    }
  })

  it('übernimmt die Wizard-Beschreibung wörtlich, wenn es eine gibt', () => {
    const description = 'Wir singen seit 1897 und proben donnerstags.'
    expect(buildWelcomePostText({ ...base, description }).body).toContain(description)
  })

  it('lässt den Absatz weg, wenn die Beschreibung fehlt oder leer ist', () => {
    for (const description of [undefined, '', '   ']) {
      const { body } = buildWelcomePostText({ ...base, description })
      expect(body.startsWith('\n')).toBe(false)
      expect(body).not.toContain('\n\n\n')
    }
  })

  it('trägt eine Zeile zur gewählten Kategorie', () => {
    const withCategory = buildWelcomePostText({ ...base, category: 'club' }).body
    const without = buildWelcomePostText(base).body
    expect(withCategory.length).toBeGreaterThan(without.length)
    expect(withCategory).toContain('Vereine')
  })

  it('eine unbekannte Kategorie lässt die Zeile weg statt einen rohen Schlüssel zu schreiben', () => {
    const { body } = buildWelcomePostText({ ...base, category: 'raumfahrt' })
    expect(body).not.toContain('raumfahrt')
    expect(body).toBe(buildWelcomePostText(base).body)
  })

  it('JEDE Wizard-Kategorie hat einen Satz — in beiden Sprachen', () => {
    for (const category of WIZARD_CATEGORIES) {
      for (const locale of ['de', 'en']) {
        const withCategory = buildWelcomePostText({ ...base, locale, category })
        const without = buildWelcomePostText({ ...base, locale })
        expect(withCategory.body, `${category}/${locale}`).not.toBe(without.body)
      }
    }
  })

  it('unbekannte Sprache fällt auf Englisch zurück (Default-Locale)', () => {
    expect(buildWelcomePostText({ ...base, locale: 'fr' }).title).toBe('Welcome to Chorverein Wetzlar')
  })

  it('de und en tragen DIESELBEN Kategorie-Schlüssel', () => {
    // Netz gegen die halbe Übersetzung: ein Satz, den es nur auf Deutsch gibt,
    // verschwände auf Englisch stillschweigend.
    const keys = (m: { posts: { welcome: { categories: Record<string, string> } } }) =>
      Object.keys(m.posts.welcome.categories).sort()
    expect(keys(de)).toEqual(keys(en))
    expect(keys(de)).toEqual([...WIZARD_CATEGORIES].sort())
  })

  it('bleibt im Spaltenbudget (title 200, body 10000)', () => {
    const long = buildWelcomePostText({
      siteName: 'x'.repeat(120),
      description: 'y'.repeat(600),
      category: 'business',
      locale: 'de',
    })
    expect(long.title.length).toBeLessThanOrEqual(200)
    expect(long.body.length).toBeLessThanOrEqual(10_000)
  })
})
