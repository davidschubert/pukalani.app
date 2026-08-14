import { describe, expect, it } from 'vitest'
import { classifyContentLink, splitContentLinks, type ContentLink } from '../shared/contentLinks'

const locales = ['en', 'de']

describe('classifyContentLink', () => {
  it('erkennt fremde Ziele', () => {
    expect(classifyContentLink('https://example.com', locales)).toBe('external')
    expect(classifyContentLink('http://example.com/x?y=1', locales)).toBe('external')
  })

  it('behandelt protokoll-relative und unerwartete Ziele defensiv als fremd', () => {
    // isSafeHref lässt diese ohnehin nicht durch — der Renderer darf sie
    // trotzdem NIE als eigenen Pfad behandeln.
    expect(classifyContentLink('//evil.com', locales)).toBe('external')
    expect(classifyContentLink('mailto:a@b.de', locales)).toBe('external')
    expect(classifyContentLink('javascript:alert(1)', locales)).toBe('external')
    expect(classifyContentLink('', locales)).toBe('external')
  })

  it('erkennt eigene Pfade ohne Locale-Prefix', () => {
    expect(classifyContentLink('/feed', locales)).toBe('internal')
    expect(classifyContentLink('/', locales)).toBe('internal')
    expect(classifyContentLink('/imprint?x=1', locales)).toBe('internal')
    expect(classifyContentLink('/community#top', locales)).toBe('internal')
  })

  it('erkennt bereits präfixierte Pfade (bleiben unangetastet)', () => {
    expect(classifyContentLink('/de/feed', locales)).toBe('internal-localized')
    expect(classifyContentLink('/en/imprint', locales)).toBe('internal-localized')
    expect(classifyContentLink('/de', locales)).toBe('internal-localized')
    expect(classifyContentLink('/de?x=1', locales)).toBe('internal-localized')
    expect(classifyContentLink('/DE/feed', locales)).toBe('internal-localized')
  })

  it('verwechselt Segmente NICHT mit Locale-Codes (Prefix-Ähnlichkeit)', () => {
    expect(classifyContentLink('/deutschland', locales)).toBe('internal')
    expect(classifyContentLink('/dentist/x', locales)).toBe('internal')
    expect(classifyContentLink('/events/de', locales)).toBe('internal')
  })

  it('folgt der konfigurierten Locale-Liste, nicht einer festen Annahme', () => {
    expect(classifyContentLink('/fr/feed', locales)).toBe('internal')
    expect(classifyContentLink('/fr/feed', ['en', 'fr'])).toBe('internal-localized')
  })
})

/**
 * DER GENERISCHE VERWEIS-VERTRAG (F57, Themen-Verlinkung).
 *
 * Diese Funktion kennt keine Themen — sie ersetzt Zeichenketten. Getestet wird
 * genau das: exakte Treffer, fail-closed ohne Liste, und die Präfix-Falle.
 */
const LINK_A: ContentLink = { token: '#abc123-thema-a', href: '/discussions/k/abc123/thema-a', label: 'Thema A' }
const LINK_B: ContentLink = { token: '#def456-thema-b', href: '/discussions/k/def456/thema-b', label: 'Thema B' }

describe('splitContentLinks', () => {
  it('gibt ohne Liste ein einziges Text-Stück zurück', () => {
    expect(splitContentLinks('Siehe #abc123-thema-a')).toEqual([{ type: 'text', text: 'Siehe #abc123-thema-a' }])
  })

  it('gibt bei leerer Liste ein einziges Text-Stück zurück', () => {
    expect(splitContentLinks('Siehe #abc123-thema-a', [])).toEqual([{ type: 'text', text: 'Siehe #abc123-thema-a' }])
  })

  it('zerlegt Text um einen Verweis herum', () => {
    expect(splitContentLinks('Siehe #abc123-thema-a dazu.', [LINK_A])).toEqual([
      { type: 'text', text: 'Siehe ' },
      { type: 'link', text: '#abc123-thema-a', href: '/discussions/k/abc123/thema-a', label: 'Thema A' },
      { type: 'text', text: ' dazu.' },
    ])
  })

  it('behält die Reihenfolge des TEXTES, nicht die der Liste', () => {
    const segments = splitContentLinks('#def456-thema-b vor #abc123-thema-a', [LINK_A, LINK_B])
    expect(segments.filter(s => s.type === 'link').map(s => s.type === 'link' && s.label)).toEqual(['Thema B', 'Thema A'])
  })

  it('ersetzt denselben Verweis mehrfach', () => {
    const segments = splitContentLinks('#abc123-thema-a und #abc123-thema-a', [LINK_A])
    expect(segments.filter(s => s.type === 'link')).toHaveLength(2)
  })

  it('lässt einen Token, der NICHT in der Liste steht, als Text stehen', () => {
    expect(splitContentLinks('Siehe #gibtesnicht99999999', [LINK_A])).toEqual([
      { type: 'text', text: 'Siehe #gibtesnicht99999999' },
    ])
  })

  it('nimmt den LÄNGEREN Token, wenn einer den anderen präfixiert', () => {
    // Ohne die Längen-Sortierung bliebe `-thema-a` als Textrest stehen.
    const kurz: ContentLink = { token: '#abc123', href: '/k/abc123', label: 'Kurz' }
    expect(splitContentLinks('Siehe #abc123-thema-a', [kurz, LINK_A])).toEqual([
      { type: 'text', text: 'Siehe ' },
      { type: 'link', text: '#abc123-thema-a', href: '/discussions/k/abc123/thema-a', label: 'Thema A' },
    ])
  })

  it('verwirft leere Tokens, statt in eine Endlosschleife zu laufen', () => {
    const leer: ContentLink = { token: '', href: '/x', label: 'Leer' }
    expect(splitContentLinks('Text', [leer])).toEqual([{ type: 'text', text: 'Text' }])
  })

  it('sortiert die Liste des Aufrufers nicht um', () => {
    const liste = [LINK_A, LINK_B]
    splitContentLinks('#def456-thema-b', liste)
    expect(liste[0]).toBe(LINK_A)
  })
})
