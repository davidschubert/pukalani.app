import { describe, expect, it } from 'vitest'
import type { ContentNavigationItem } from '@nuxt/content'
import {
  docsCollection,
  docsLandingCollection,
  docsSectionItems,
  docsSectionPrefix,
  isGermanDocsPath,
  resolveDocsSection,
} from '../app/utils/docsSections'

/**
 * Die Abschnitts-Auflösung der zweisprachigen Hilfe.
 *
 * Seit dem Sprach-Tausch vom 2026-08-18 ist ENGLISCH die Vorgabe (ohne Prefix,
 * an der Content-Wurzel), DEUTSCH liegt unter `/de`. Zwei Fallen sind hier
 * eingebaut, beide sind live aufgetreten — deshalb steht zu jeder ein Test, der
 * ohne die Vorkehrung ROT wird:
 *
 *  1. Ein Abschnitt darf nicht angefressen werden, nur weil sein Pfad mit den
 *     Zeichen des Sprach-Prefixes beginnt. Zugeschlagen hat das mit dem
 *     damaligen Prefix `/en` und dem Abschnitt `/entwickler`: naives
 *     Abschneiden machte daraus `twickler`, und der Entwickler-Bereich fiel
 *     still in die Anleitung zurück. Mit `/de` trifft es heute keinen Pfad —
 *     die Grenzregel bleibt trotzdem geprüft, weil ein künftiger Abschnitt
 *     (`/design`, `/developers`) genauso umfiele.
 *  2. Die Sammlungen der NICHT-Vorgabe-Sprache liegen in einem Sprachordner
 *     (heute `content/de/…`); ihr Navigationsbaum trägt `/de` als Wurzel und
 *     den Abschnitt erst als dessen Kind. Eine Suche nur auf der obersten
 *     Ebene findet ihn nicht.
 */

/** Baum, wie ihn die ENGLISCHEN (Vorgabe-)Sammlungen liefern: Abschnitt ist die Wurzel. */
const baumEn: ContentNavigationItem[] = [{
  title: 'Guide',
  path: '/anleitung',
  children: [
    { title: 'Overview', path: '/anleitung' },
    { title: 'Products', path: '/anleitung/produkte', children: [
      { title: 'Comments', path: '/anleitung/produkte/kommentare' },
    ] },
  ],
}]

/** Baum der DEUTSCHEN Sammlungen: der Sprachordner liegt darüber. */
const baumDe: ContentNavigationItem[] = [{
  title: 'De',
  path: '/de',
  children: [{
    title: 'Anleitung',
    path: '/de/anleitung',
    children: [
      { title: 'Überblick', path: '/de/anleitung' },
      { title: 'Produkte', path: '/de/anleitung/produkte', children: [
        { title: 'Kommentare', path: '/de/anleitung/produkte/kommentare' },
      ] },
    ],
  }],
}]

describe('resolveDocsSection', () => {
  it('erkennt den Abschnitt in beiden Sprachen', () => {
    expect(resolveDocsSection('/anleitung')).toBe('anleitung')
    expect(resolveDocsSection('/anleitung/produkte/kommentare')).toBe('anleitung')
    expect(resolveDocsSection('/de/anleitung')).toBe('anleitung')
    expect(resolveDocsSection('/de/anleitung/produkte/kommentare')).toBe('anleitung')
    expect(resolveDocsSection('/entwickler')).toBe('entwickler')
    expect(resolveDocsSection('/de/entwickler')).toBe('entwickler')
  })

  it('schneidet das Sprach-Prefix nur an einer echten Pfadgrenze ab', () => {
    // Die Grenzregel: `/de` gilt nur, wenn danach `/` folgt oder der Pfad
    // endet. Ohne sie fräse die Regex an jedem Pfad, der zufällig mit `de`
    // weitergeht — genau so fiel früher `/entwickler` dem Prefix `/en` zum
    // Opfer und landete still in der Anleitung.
    expect(isGermanDocsPath('/de')).toBe(true)
    expect(isGermanDocsPath('/de/entwickler')).toBe(true)
    expect(isGermanDocsPath('/entwickler')).toBe(false)
    expect(isGermanDocsPath('/entwickler/embed-widget')).toBe(false)
    expect(isGermanDocsPath('/design')).toBe(false)
    expect(isGermanDocsPath('/developers')).toBe(false)
    // Und die Folge davon für die Auflösung selbst:
    expect(resolveDocsSection('/entwickler')).toBe('entwickler')
    expect(resolveDocsSection('/entwickler/embed-widget')).toBe('entwickler')
  })

  it('fällt außerhalb von /entwickler auf die Anleitung zurück', () => {
    expect(resolveDocsSection('/')).toBe('anleitung')
    expect(resolveDocsSection('/de')).toBe('anleitung')
  })
})

describe('docsCollection', () => {
  it('bildet Abschnitt + Sprache auf die vier Sammlungsnamen ab', () => {
    expect(docsCollection('anleitung', 'en')).toBe('anleitung')
    expect(docsCollection('entwickler', 'en')).toBe('entwickler')
    expect(docsCollection('anleitung', 'de')).toBe('anleitungDe')
    expect(docsCollection('entwickler', 'de')).toBe('entwicklerDe')
    // Vollständige Sprachcodes müssen genauso greifen wie die kurzen.
    expect(docsCollection('anleitung', 'de-DE')).toBe('anleitungDe')
    expect(docsCollection('anleitung', 'en-US')).toBe('anleitung')
  })

  it('wählt die Startseiten-Sammlung je Sprache', () => {
    expect(docsLandingCollection('en')).toBe('landing')
    expect(docsLandingCollection('de-DE')).toBe('landingDe')
  })
})

describe('docsSectionPrefix', () => {
  it('stellt der deutschen Fassung /de voran', () => {
    expect(docsSectionPrefix('anleitung', 'en')).toBe('/anleitung')
    expect(docsSectionPrefix('anleitung', 'de')).toBe('/de/anleitung')
    expect(docsSectionPrefix('entwickler', 'de-DE')).toBe('/de/entwickler')
  })
})

describe('docsSectionItems', () => {
  it('liefert die Kinder des Abschnitts, wenn er die Wurzel ist (englisch)', () => {
    const items = docsSectionItems({ anleitung: baumEn, entwickler: [] }, 'anleitung', 'en')
    expect(items.map(i => i.title)).toEqual(['Overview', 'Products'])
  })

  it('findet den Abschnitt auch UNTER dem Sprachordner (deutsch)', () => {
    // Der eigentliche Fehler: ohne die Suche in der Tiefe kam hier der ganze
    // Baum zurück — samt Ordner-Knoten, der dann als Abschnitts-Zeile über der
    // Überschrift von /de/anleitung stand.
    const items = docsSectionItems({ anleitung: baumDe, entwickler: [] }, 'anleitung', 'de')
    expect(items.map(i => i.title)).toEqual(['Überblick', 'Produkte'])
    expect(items.some(i => i.title === 'De')).toBe(false)
  })

  it('gibt den Baum unverändert zurück, wenn der Abschnitt fehlt', () => {
    const fremd: ContentNavigationItem[] = [{ title: 'X', path: '/x' }]
    expect(docsSectionItems({ anleitung: fremd, entwickler: [] }, 'anleitung', 'en')).toEqual(fremd)
  })

  it('kommt mit fehlender Navigation zurecht', () => {
    expect(docsSectionItems(null, 'anleitung', 'en')).toEqual([])
    expect(docsSectionItems(undefined, 'entwickler', 'de')).toEqual([])
  })
})
