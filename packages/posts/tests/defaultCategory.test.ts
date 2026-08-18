import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORY_ROW_ID_PREFIX, defaultCategoryFor, defaultCategoryRowId } from '../shared/defaultCategory'
import { welcomePostRowId } from '../shared/welcomePost'
import { slugify } from '../shared/discussionUrl'

const TENANT = 't-687f2ac31b9d4e5a8c02'

describe('defaultCategoryRowId', () => {
  it('ist ableitbar — dieselbe Community, dieselbe Id', () => {
    expect(defaultCategoryRowId(TENANT)).toBe(defaultCategoryRowId(TENANT))
    expect(defaultCategoryRowId(TENANT)).toBe(`${DEFAULT_CATEGORY_ROW_ID_PREFIX}${TENANT}`)
  })

  it('unterscheidet Communities', () => {
    expect(defaultCategoryRowId(TENANT)).not.toBe(defaultCategoryRowId('t-andere'))
  })

  it('bleibt im 36-Zeichen-Budget einer Appwrite-Zeilen-Id', () => {
    expect(defaultCategoryRowId(TENANT).length).toBeLessThanOrEqual(36)
    // Gegenprobe: auch ein unerwartet langer Scope reißt das Limit nicht.
    expect(defaultCategoryRowId('t-' + 'x'.repeat(80)).length).toBe(36)
  })

  it('kollidiert nicht mit der Id des Beispiel-Beitrags', () => {
    // Beide Saaten leiten aus DEMSELBEN Scope ab und liegen zwar in
    // verschiedenen Tabellen — eine gemeinsame Id wäre trotzdem eine Falle für
    // jeden, der beim Lesen im Log die eine für die andere hält.
    expect(defaultCategoryRowId(TENANT)).not.toBe(welcomePostRowId(TENANT))
  })
})

describe('defaultCategoryFor', () => {
  it('spricht die Sprache des Wizards', () => {
    expect(defaultCategoryFor('de').name).toBe('Allgemein')
    expect(defaultCategoryFor('en').name).toBe('General')
  })

  it('fällt auf Englisch zurück — auch bei Unsinn', () => {
    expect(defaultCategoryFor('fr')).toEqual(defaultCategoryFor('en'))
    expect(defaultCategoryFor('')).toEqual(defaultCategoryFor('en'))
  })

  it('liefert überall einen Slug, den die Kategorie-Route auch selbst bauen würde', () => {
    // Der Slug ist die URL und nach der Anlage FEST (shared/types/post.ts) —
    // ein Wert, den `slugify` anders normalisieren würde, wäre ab Tag eins
    // eine Adresse, die niemand nachbauen kann.
    for (const locale of ['de', 'en']) {
      const seed = defaultCategoryFor(locale)
      expect(seed.slug).toBe(slugify(seed.slug))
      expect(seed.slug.length).toBeGreaterThan(0)
    }
  })

  it('füllt Name und Beschreibung — eine leere Kategorie wäre der halbe Gewinn', () => {
    for (const locale of ['de', 'en']) {
      const seed = defaultCategoryFor(locale)
      expect(seed.name.trim()).not.toBe('')
      expect(seed.description.trim()).not.toBe('')
    }
  })
})

describe('defaultCategoryFor — die andere Sprache kommt mit', () => {
  it('legt zur deutschen Grundfassung die englische Übersetzung', () => {
    const seed = defaultCategoryFor('de')
    expect(seed.name).toBe('Allgemein')
    expect(seed.slug).toBe('allgemein')
    expect(JSON.parse(seed.translations)).toEqual({
      en: { name: 'General', description: 'Everything that does not have its own category yet.' },
    })
  })

  it('und umgekehrt — der SLUG folgt aber allein der Wizard-Sprache', () => {
    const seed = defaultCategoryFor('en')
    expect(seed.slug).toBe('general')
    expect(JSON.parse(seed.translations).de.name).toBe('Allgemein')
    // Kein Slug in den Übersetzungen: die Adresse ist in allen Sprachen dieselbe.
    expect(JSON.parse(seed.translations).de.slug).toBeUndefined()
  })

  it('Unbekanntes fällt auf Englisch zurück — mit deutscher Übersetzung', () => {
    const seed = defaultCategoryFor('fr')
    expect(seed.name).toBe('General')
    expect(JSON.parse(seed.translations)).toHaveProperty('de')
  })
})
