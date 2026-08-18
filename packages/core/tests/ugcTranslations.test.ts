import { describe, it, expect } from 'vitest'
import {
  LOCALE_CODE_PATTERN,
  MAX_UGC_TRANSLATION_LOCALES,
  TRANSLATE_DAILY_LIMIT,
  TRANSLATION_DAILY_LIMIT_CODE,
  mayAddUgcTranslationLocale,
  normalizeUgcTranslations,
  parseUgcTranslations,
  serializeUgcTranslations,
  ugcTranslationDayKey,
  ugcTranslationErrorKey,
  ugcTranslationFor,
} from '../shared/ugcTranslations'

const withEn = JSON.stringify({ en: { title: 'A title', body: 'The text.' } })

describe('ugcTranslationFor — welche Fassung in welcher Sprache', () => {
  it('gibt die Fassung, wenn es eine gibt', () => {
    expect(ugcTranslationFor(withEn, 'en')).toEqual({ title: 'A title', body: 'The text.' })
  })

  it('gibt null, wenn die Sprache fehlt — „nicht übersetzt", nie leerer Text', () => {
    expect(ugcTranslationFor(withEn, 'fr')).toBeNull()
    expect(ugcTranslationFor('', 'en')).toBeNull()
    expect(ugcTranslationFor(null, 'en')).toBeNull()
  })

  it('lässt den Titel weg, wo das Original keinen hat', () => {
    const raw = JSON.stringify({ en: { body: 'Just text.' } })
    expect(ugcTranslationFor(raw, 'en')).toEqual({ body: 'Just text.' })
  })
})

describe('parse/normalize — was die Spalte trägt', () => {
  it('liest unlesbares JSON als „nichts übersetzt" statt zu werfen', () => {
    // Fail-soft ist hier Absicht: eine kaputte Spalte darf keinen Beitrag
    // unlesbar machen — der Cache ist wiederherstellbar.
    expect(parseUgcTranslations('{kaputt')).toEqual({})
    expect(parseUgcTranslations('')).toEqual({})
    expect(parseUgcTranslations(undefined)).toEqual({})
    expect(parseUgcTranslations('[1,2]')).toEqual({})
    expect(parseUgcTranslations('"text"')).toEqual({})
  })

  it('wirft fremde Formen und unmögliche Sprachcodes weg', () => {
    const raw = JSON.stringify({
      en: { body: 'The text.' },
      'nicht-ein-code!': { body: 'X' },
      de: 'kein Objekt',
      es: { body: 42 },
    })
    expect(parseUgcTranslations(raw)).toEqual({ en: { body: 'The text.' } })
  })

  it('wirft Einträge OHNE body weg — ein Titel allein ist keine Fassung', () => {
    const raw = JSON.stringify({ en: { title: 'A title' }, fr: { title: 'Titre', body: '   ' } })
    expect(parseUgcTranslations(raw)).toEqual({})
  })

  it('trimmt und behandelt einen leeren Titel wie keinen', () => {
    expect(normalizeUgcTranslations({ en: { title: '  ', body: '  Text  ' } }))
      .toEqual({ en: { body: 'Text' } })
    expect(normalizeUgcTranslations({ en: { title: ' A ', body: 'Text' } }))
      .toEqual({ en: { title: 'A', body: 'Text' } })
  })

  it('deckelt beim LESEN bewusst nicht', () => {
    // Die Grenze gilt beim Schreiben (die Route weist ab). Ein Deckel hier
    // machte eine vorhandene Übersetzung unsichtbar, und welche überlebt,
    // entschiede die Reihenfolge der Schlüssel.
    const many = Object.fromEntries(
      ['de', 'en', 'fr', 'es', 'it', 'nl', 'pt'].map(locale => [locale, { body: locale }]),
    )
    expect(Object.keys(parseUgcTranslations(JSON.stringify(many)))).toHaveLength(7)
  })
})

describe('serializeUgcTranslations — was in die Spalte geht', () => {
  it('schreibt leere Karten als "" — nicht als "{}"', () => {
    expect(serializeUgcTranslations({})).toBe('')
    expect(serializeUgcTranslations(undefined)).toBe('')
    expect(serializeUgcTranslations({ en: { body: '   ' } })).toBe('')
  })

  it('geht durch parse wieder heil heraus', () => {
    const raw = serializeUgcTranslations({ en: { title: 'A title', body: 'The text.' } })
    expect(parseUgcTranslations(raw)).toEqual({ en: { title: 'A title', body: 'The text.' } })
  })
})

describe('mayAddUgcTranslationLocale — der Deckel', () => {
  const full = Object.fromEntries(
    ['de', 'en', 'fr', 'es', 'it', 'nl'].map(locale => [locale, { body: locale }]),
  )

  it('lässt bis zur Obergrenze neue Sprachen zu', () => {
    expect(Object.keys(full)).toHaveLength(MAX_UGC_TRANSLATION_LOCALES)
    expect(mayAddUgcTranslationLocale({}, 'de')).toBe(true)
    expect(mayAddUgcTranslationLocale(full, 'pt')).toBe(false)
  })

  it('lässt eine VORHANDENE Sprache auch am Deckel noch schreiben', () => {
    // Sonst wäre eine Zeile mit sechs Fassungen für immer eingefroren.
    expect(mayAddUgcTranslationLocale(full, 'en')).toBe(true)
  })
})

describe('ugcTranslationDayKey — der Tages-Eimer', () => {
  it('trägt NUR das Konto — keine Community, keine Inhaltsart', () => {
    // Beides ist der Sinn des Deckels: er begrenzt die Rechnung EINES Kontos.
    // Stünde eine Community oder „post"/„comment" darin, hätte ein Mensch
    // mehrere Tageskontingente.
    expect(ugcTranslationDayKey('user-1')).toBe('ugc-translate-day:user-1')
    expect(ugcTranslationDayKey('user-1')).not.toContain('post')
    expect(ugcTranslationDayKey('user-1')).not.toContain('comment')
  })

  it('trennt zwei Konten', () => {
    expect(ugcTranslationDayKey('user-1')).not.toBe(ugcTranslationDayKey('user-2'))
  })

  it('bleibt bei der abgestimmten Zahl', () => {
    expect(TRANSLATE_DAILY_LIMIT).toBe(100)
  })
})

describe('ugcTranslationErrorKey — welcher Hinweis erscheint', () => {
  it('trennt die drei Fälle, die dem Leser etwas anderes sagen', () => {
    // 503 ist ein Dauerzustand (keine KI eingerichtet) — „bitte nochmal" wäre
    // dort gelogen; 429 ist genau das Gegenteil.
    expect(ugcTranslationErrorKey(503)).toBe('translation.unavailable')
    expect(ugcTranslationErrorKey(429)).toBe('translation.rateLimited')
  })

  it('unterscheidet die BEIDEN 429 — Drossel gegen Tages-Deckel', () => {
    // „In ein paar Minuten nochmal" ist am Tages-Deckel eine Aufforderung, die
    // ins Leere läuft: der ist erst morgen vorbei.
    expect(ugcTranslationErrorKey(429, TRANSLATION_DAILY_LIMIT_CODE)).toBe('translation.dailyLimit')
    expect(ugcTranslationErrorKey(429, 'rate_limited')).toBe('translation.rateLimited')
    // Ohne Grund (alter Server, 429 von einem vorgelagerten Proxy) bleibt es
    // beim bisherigen Text — der Grund ist optional, nicht Bedingung.
    expect(ugcTranslationErrorKey(429, undefined)).toBe('translation.rateLimited')
  })

  it('nimmt den Tages-Grund nur bei 429 ernst', () => {
    // Der Code gehört zu genau einem Status; an einem 503 wäre er ein Irrtum
    // des Servers und darf die Dauerzustands-Auskunft nicht überschreiben.
    expect(ugcTranslationErrorKey(503, TRANSLATION_DAILY_LIMIT_CODE)).toBe('translation.unavailable')
  })

  it('fasst alles andere zusammen — auch „gar kein Status"', () => {
    // 400 (Sprachen-Deckel), 401 (Sitzung weg), 502 (Anbieter) und ein
    // Netzfehler ohne Status ändern für den Leser dieselbe Handlung: nochmal.
    expect(ugcTranslationErrorKey(400)).toBe('translation.failed')
    expect(ugcTranslationErrorKey(502)).toBe('translation.failed')
    expect(ugcTranslationErrorKey(undefined)).toBe('translation.failed')
  })
})

describe('LOCALE_CODE_PATTERN', () => {
  it('nimmt Sprachcodes, keine Freitexte', () => {
    expect(LOCALE_CODE_PATTERN.test('de')).toBe(true)
    expect(LOCALE_CODE_PATTERN.test('pt-BR')).toBe(true)
    expect(LOCALE_CODE_PATTERN.test('Deutsch')).toBe(false)
    expect(LOCALE_CODE_PATTERN.test('de_DE')).toBe(false)
  })
})
