import { describe, expect, it } from 'vitest'
import type { ContentNavigationItem } from '@nuxt/content'
import {
  docsCollection,
  docsLandingCollection,
  docsSectionItems,
  docsSectionPrefix,
  isEnglishDocsPath,
  resolveDocsSection,
} from '../app/utils/docsSections'

/**
 * Die Abschnitts-Auflösung der zweisprachigen Hilfe.
 *
 * Zwei Fallen sind hier eingebaut und beide sind live aufgetreten — deshalb
 * steht zu jeder ein Test, der ohne die Vorkehrung ROT wird:
 *
 *  1. Der deutsche Abschnitt `/entwickler` beginnt selbst mit den Zeichen
 *     `/en`. Ein naives Abschneiden des Sprach-Prefixes macht daraus
 *     `twickler`, und der Entwickler-Bereich fiele auf Deutsch still in die
 *     Anleitung zurück.
 *  2. Die englischen Sammlungen liegen unter `content/en/…`; ihr
 *     Navigationsbaum trägt `/en` als Wurzel und den Abschnitt erst als dessen
 *     Kind. Eine Suche nur auf der obersten Ebene findet ihn nicht.
 */

/** Baum, wie ihn die DEUTSCHEN Sammlungen liefern: Abschnitt ist die Wurzel. */
const baumDe: ContentNavigationItem[] = [{
  title: 'Anleitung',
  path: '/anleitung',
  children: [
    { title: 'Überblick', path: '/anleitung' },
    { title: 'Produkte', path: '/anleitung/produkte', children: [
      { title: 'Kommentare', path: '/anleitung/produkte/kommentare' },
    ] },
  ],
}]

/** Baum der ENGLISCHEN Sammlungen: der Sprachordner liegt darüber. */
const baumEn: ContentNavigationItem[] = [{
  title: 'En',
  path: '/en',
  children: [{
    title: 'Guide',
    path: '/en/anleitung',
    children: [
      { title: 'Overview', path: '/en/anleitung' },
      { title: 'Products', path: '/en/anleitung/produkte', children: [
        { title: 'Comments', path: '/en/anleitung/produkte/kommentare' },
      ] },
    ],
  }],
}]

describe('resolveDocsSection', () => {
  it('erkennt den Abschnitt in beiden Sprachen', () => {
    expect(resolveDocsSection('/anleitung')).toBe('anleitung')
    expect(resolveDocsSection('/anleitung/produkte/kommentare')).toBe('anleitung')
    expect(resolveDocsSection('/en/anleitung')).toBe('anleitung')
    expect(resolveDocsSection('/en/anleitung/produkte/kommentare')).toBe('anleitung')
    expect(resolveDocsSection('/entwickler')).toBe('entwickler')
    expect(resolveDocsSection('/en/entwickler')).toBe('entwickler')
  })

  it('verwechselt den deutschen Pfad /entwickler NICHT mit dem Sprach-Prefix /en', () => {
    // Ohne die Grenzregel würde `/entwickler` zu `twickler` und landete in der
    // Anleitung — der ganze Entwickler-Bereich bekäme die falsche Sammlung.
    expect(resolveDocsSection('/entwickler')).toBe('entwickler')
    expect(resolveDocsSection('/entwickler/embed-widget')).toBe('entwickler')
    expect(isEnglishDocsPath('/entwickler')).toBe(false)
    expect(isEnglishDocsPath('/entwickler/embed-widget')).toBe(false)
    expect(isEnglishDocsPath('/en')).toBe(true)
    expect(isEnglishDocsPath('/en/entwickler')).toBe(true)
  })

  it('fällt außerhalb von /entwickler auf die Anleitung zurück', () => {
    expect(resolveDocsSection('/')).toBe('anleitung')
    expect(resolveDocsSection('/en')).toBe('anleitung')
  })
})

describe('docsCollection', () => {
  it('bildet Abschnitt + Sprache auf die vier Sammlungsnamen ab', () => {
    expect(docsCollection('anleitung', 'de')).toBe('anleitung')
    expect(docsCollection('entwickler', 'de')).toBe('entwickler')
    expect(docsCollection('anleitung', 'en')).toBe('anleitungEn')
    expect(docsCollection('entwickler', 'en')).toBe('entwicklerEn')
    // Vollständige Sprachcodes müssen genauso greifen wie die kurzen.
    expect(docsCollection('anleitung', 'en-US')).toBe('anleitungEn')
    expect(docsCollection('anleitung', 'de-DE')).toBe('anleitung')
  })

  it('wählt die Startseiten-Sammlung je Sprache', () => {
    expect(docsLandingCollection('de')).toBe('landing')
    expect(docsLandingCollection('en-US')).toBe('landingEn')
  })
})

describe('docsSectionPrefix', () => {
  it('stellt der englischen Fassung /en voran', () => {
    expect(docsSectionPrefix('anleitung', 'de')).toBe('/anleitung')
    expect(docsSectionPrefix('anleitung', 'en')).toBe('/en/anleitung')
    expect(docsSectionPrefix('entwickler', 'en-US')).toBe('/en/entwickler')
  })
})

describe('docsSectionItems', () => {
  it('liefert die Kinder des Abschnitts, wenn er die Wurzel ist (deutsch)', () => {
    const items = docsSectionItems({ anleitung: baumDe, entwickler: [] }, 'anleitung', 'de')
    expect(items.map(i => i.title)).toEqual(['Überblick', 'Produkte'])
  })

  it('findet den Abschnitt auch UNTER dem Sprachordner (englisch)', () => {
    // Der eigentliche Fehler: ohne die Suche in der Tiefe kam hier der ganze
    // Baum zurück — samt Knoten „En", der dann als Abschnitts-Zeile über der
    // Überschrift von /en/anleitung stand.
    const items = docsSectionItems({ anleitung: baumEn, entwickler: [] }, 'anleitung', 'en')
    expect(items.map(i => i.title)).toEqual(['Overview', 'Products'])
    expect(items.some(i => i.title === 'En')).toBe(false)
  })

  it('gibt den Baum unverändert zurück, wenn der Abschnitt fehlt', () => {
    const fremd: ContentNavigationItem[] = [{ title: 'X', path: '/x' }]
    expect(docsSectionItems({ anleitung: fremd, entwickler: [] }, 'anleitung', 'de')).toEqual(fremd)
  })

  it('kommt mit fehlender Navigation zurecht', () => {
    expect(docsSectionItems(null, 'anleitung', 'de')).toEqual([])
    expect(docsSectionItems(undefined, 'entwickler', 'en')).toEqual([])
  })
})
