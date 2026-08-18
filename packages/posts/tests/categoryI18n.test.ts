import { describe, it, expect } from 'vitest'
import {
  categoryNamesByLocale,
  categorySearchHaystack,
  categoryTextFor,
  localizedNameFrom,
  parseCategoryTranslations,
  serializeCategoryTranslations,
} from '../shared/categoryI18n'

const base = { name: 'Allgemein', description: 'Alles, was sonst nirgends passt.' }
const withEn = {
  ...base,
  translations: JSON.stringify({ en: { name: 'General', description: 'Everything else.' } }),
}

describe('categoryTextFor — welcher Text in welcher Sprache', () => {
  it('nimmt die Übersetzung, wenn es eine gibt', () => {
    expect(categoryTextFor(withEn, 'en')).toEqual({ name: 'General', description: 'Everything else.' })
  })

  it('fällt auf die Grundfassung zurück, wenn die Sprache fehlt', () => {
    expect(categoryTextFor(withEn, 'fr')).toEqual(base)
    expect(categoryTextFor(base, 'en')).toEqual(base)
  })

  it('fällt FELD FÜR FELD zurück, nicht als Paket', () => {
    // Der Fall, für den die Regel da ist: jemand übersetzt nur den Namen. Ohne
    // getrennte Rückfälle wäre die Kategorie in dieser Sprache beschreibungslos.
    const half = { ...base, translations: JSON.stringify({ en: { name: 'General' } }) }
    expect(categoryTextFor(half, 'en')).toEqual({ name: 'General', description: base.description })
  })

  it('behandelt eine leere Übersetzung wie keine', () => {
    const empty = { ...base, translations: JSON.stringify({ en: { name: '  ' } }) }
    expect(categoryTextFor(empty, 'en').name).toBe('Allgemein')
  })
})

describe('parse/serialize — was die Spalte trägt', () => {
  it('liest unlesbares JSON als „nichts übersetzt" statt zu werfen', () => {
    // Fail-soft ist hier Absicht: eine kaputte Spalte darf keine Kategorie
    // unsichtbar machen.
    expect(parseCategoryTranslations('{kaputt')).toEqual({})
    expect(parseCategoryTranslations('')).toEqual({})
    expect(parseCategoryTranslations(null)).toEqual({})
    expect(parseCategoryTranslations('[1,2]')).toEqual({})
  })

  it('wirft fremde Formen und unmögliche Sprachcodes weg', () => {
    const raw = JSON.stringify({
      en: { name: 'General' },
      'nicht-ein-code!': { name: 'X' },
      de: 'kein Objekt',
      es: { name: 42 },
    })
    expect(parseCategoryTranslations(raw)).toEqual({ en: { name: 'General' } })
  })

  it('schreibt leere Karten als "" — nicht als "{}"', () => {
    expect(serializeCategoryTranslations({})).toBe('')
    expect(serializeCategoryTranslations({ en: { name: '', description: '' } })).toBe('')
    expect(serializeCategoryTranslations(undefined)).toBe('')
  })

  it('trimmt und entfernt geleerte Felder beim Speichern', () => {
    // So verschwindet eine zurückgenommene Übersetzung wirklich, statt als ''
    // liegen zu bleiben.
    const out = serializeCategoryTranslations({
      en: { name: '  General  ', description: '   ' },
    })
    expect(JSON.parse(out)).toEqual({ en: { name: 'General' } })
  })
})

describe('Listen und Suche', () => {
  it('gibt nur die NAMEN je Sprache heraus (für die Themen-Liste)', () => {
    expect(categoryNamesByLocale(withEn)).toEqual({ en: 'General' })
    expect(categoryNamesByLocale(base)).toEqual({})
  })

  it('localizedNameFrom nimmt die Grundfassung, wenn die Karte schweigt', () => {
    expect(localizedNameFrom({ en: 'General' }, 'Allgemein', 'en')).toBe('General')
    expect(localizedNameFrom({ en: 'General' }, 'Allgemein', 'de')).toBe('Allgemein')
    expect(localizedNameFrom(undefined, 'Allgemein', 'en')).toBe('Allgemein')
  })

  it('die Verwaltung sucht über ALLE Sprachfassungen', () => {
    const hay = categorySearchHaystack(withEn)
    expect(hay).toContain('allgemein')
    expect(hay).toContain('general')
  })
})
