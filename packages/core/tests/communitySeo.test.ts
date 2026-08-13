import { describe, expect, it } from 'vitest'
import {
  MAX_SEO_DESCRIPTION,
  RECOMMENDED_SEO_DESCRIPTION,
  emptyCommunitySeoSettings,
  normalizeSeoDescription,
  parseCommunitySeoRow,
  resolveCommunitySeo,
} from '../shared/communitySeo'

/**
 * DIE REGEL HINTER DER SEO-SEITE (U15 Teil 2).
 *
 * Wie in Teil 1: jede Zusage aus dem Kopf von `resolveCommunitySeo` hat hier
 * ihre GEGENPROBE. Besonders die vierte (fail-open bei kaputten Zeilen) — eine
 * Härtung, die man nur in eine Richtung prüft, ist keine.
 */

describe('normalizeSeoDescription', () => {
  it('macht aus Zeilenumbrüchen Leerzeichen', () => {
    expect(normalizeSeoDescription('Erste Zeile\nZweite Zeile')).toBe('Erste Zeile Zweite Zeile')
    expect(normalizeSeoDescription('Absatz\r\n\r\nAbsatz')).toBe('Absatz Absatz')
  })

  it('faltet Tabs und mehrfache Leerzeichen zusammen und trimmt', () => {
    expect(normalizeSeoDescription('  viel\t\t Luft   dazwischen  ')).toBe('viel Luft dazwischen')
  })

  it('gibt für alles, was kein String ist, den leeren String', () => {
    expect(normalizeSeoDescription(undefined)).toBe('')
    expect(normalizeSeoDescription(null)).toBe('')
    expect(normalizeSeoDescription(42)).toBe('')
    expect(normalizeSeoDescription({ toString: () => 'nein' })).toBe('')
    expect(normalizeSeoDescription(['a'])).toBe('')
  })

  it('kappt defensiv auf die harte Grenze', () => {
    const long = 'a'.repeat(MAX_SEO_DESCRIPTION + 50)
    expect(normalizeSeoDescription(long)).toHaveLength(MAX_SEO_DESCRIPTION)
  })

  it('lässt einen Text GENAU auf der Grenze unangetastet (Gegenprobe zum Kappen)', () => {
    const exact = 'b'.repeat(MAX_SEO_DESCRIPTION)
    expect(normalizeSeoDescription(exact)).toBe(exact)
  })

  it('empfiehlt kürzer, als es erlaubt — sonst wäre die Empfehlung die Grenze', () => {
    expect(RECOMMENDED_SEO_DESCRIPTION).toBeLessThan(MAX_SEO_DESCRIPTION)
  })
})

describe('resolveCommunitySeo — Zusage (1): keine Zeile heisst heutiges Verhalten', () => {
  it('ohne Zeile gilt der Anriss der Startseite, und es wird indexiert', () => {
    expect(resolveCommunitySeo(null, 'Anriss der Startseite')).toEqual({
      description: 'Anriss der Startseite',
      noindex: false,
    })
    expect(resolveCommunitySeo(undefined, 'Anriss')).toEqual({ description: 'Anriss', noindex: false })
  })

  it('eine leere Zeile verhält sich wie keine', () => {
    expect(resolveCommunitySeo(emptyCommunitySeoSettings(), 'Anriss')).toEqual({
      description: 'Anriss',
      noindex: false,
    })
  })
})

describe('resolveCommunitySeo — Zusage (2): eigener Text schlägt den Anriss', () => {
  it('nimmt die eigene Beschreibung', () => {
    const head = resolveCommunitySeo({ metaDescription: 'Wir sind der Chor.', noindex: false }, 'Anriss')
    expect(head.description).toBe('Wir sind der Chor.')
  })

  it('GEGENPROBE: ein leeres Feld fällt zurück auf den Anriss, es löscht ihn nicht', () => {
    expect(resolveCommunitySeo({ metaDescription: '', noindex: false }, 'Anriss').description).toBe('Anriss')
    expect(resolveCommunitySeo({ metaDescription: '   ', noindex: false }, 'Anriss').description).toBe('Anriss')
  })

  it('normalisiert auch den eigenen Text (Textfläche ⇒ Absätze)', () => {
    const head = resolveCommunitySeo({ metaDescription: 'Zeile eins\nZeile zwei' }, '')
    expect(head.description).toBe('Zeile eins Zeile zwei')
  })

  it('normalisiert auch den Rückfall — der Anriss kommt aus fremdem Markdown', () => {
    expect(resolveCommunitySeo(null, ' Anriss\nmit Umbruch ').description).toBe('Anriss mit Umbruch')
  })
})

describe('resolveCommunitySeo — Zusage (3): ohne beides bleibt der Kopf leer', () => {
  it('kein Tag, wenn weder eigener Text noch Anriss da ist', () => {
    expect(resolveCommunitySeo(null, undefined).description).toBe('')
    expect(resolveCommunitySeo(null, null).description).toBe('')
    expect(resolveCommunitySeo({ metaDescription: '' }, '').description).toBe('')
  })
})

describe('resolveCommunitySeo — Zusage (4): nur ein echtes true ist noindex', () => {
  it('true schaltet noindex', () => {
    expect(resolveCommunitySeo({ noindex: true }, '').noindex).toBe(true)
  })

  it('GEGENPROBE: false, fehlend und jeder kaputte Wert bleiben indexierbar', () => {
    expect(resolveCommunitySeo({ noindex: false }, '').noindex).toBe(false)
    expect(resolveCommunitySeo({}, '').noindex).toBe(false)
    expect(resolveCommunitySeo({ noindex: null }, '').noindex).toBe(false)
    expect(resolveCommunitySeo({ noindex: 'true' }, '').noindex).toBe(false)
    expect(resolveCommunitySeo({ noindex: 1 }, '').noindex).toBe(false)
  })

  it('eine völlig kaputte Zeile antwortet wie gar keine (fail-open, s. Kopf)', () => {
    const broken = { metaDescription: { nested: true }, noindex: ['ja'] }
    expect(resolveCommunitySeo(broken, 'Anriss')).toEqual({ description: 'Anriss', noindex: false })
  })
})

describe('parseCommunitySeoRow', () => {
  it('unterscheidet „keine Zeile" von „Zeile mit leerem Feld"', () => {
    expect(parseCommunitySeoRow(null)).toBeNull()
    expect(parseCommunitySeoRow(undefined)).toBeNull()
    expect(parseCommunitySeoRow({})).toEqual({ metaDescription: '', noindex: false })
  })

  it('härtet dieselben Felder wie die Regel', () => {
    expect(parseCommunitySeoRow({ metaDescription: ' Hallo\nWelt ', noindex: 'true' })).toEqual({
      metaDescription: 'Hallo Welt',
      noindex: false,
    })
  })
})
