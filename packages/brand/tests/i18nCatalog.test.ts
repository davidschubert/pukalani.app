import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BRAND_SLOTS,
  type BrandSlot,
  questionKeyFor,
} from '../shared/slotRegistry'

/**
 * DIE REGISTRY IST DIE QUELLE, DER KATALOG MUSS IHR FOLGEN.
 *
 * vue-i18n gibt bei fehlender Übersetzung den SCHLÜSSEL zurück — es gibt keinen
 * Fehler, keine Warnung, keinen roten Build (vier Tage `legal.imprint` im Fuß
 * von comments.pukalani.app). Der Wizard rendert seine Fragen aus
 * `slot.questionKey`, seine Lehrblöcke aus `slot.helpKey`: kommt ein Slot dazu,
 * ohne dass jemand Copy schreibt, stünde dort wörtlich `brand.q.c.discovery4`.
 * Genau das fängt dieser Test — in BEIDEN Sprachen, denn ein Schlüssel, den nur
 * eine Sprache hat, ist derselbe Fehler mit halber Trefferwahrscheinlichkeit.
 *
 * GEPRÜFT WIRD, WAS DIE OBERFLÄCHE WIRKLICH AUFRUFT:
 *  - `question`/`choice`-Slots werden GEFRAGT — dort zählt `questionKeyFor()`
 *    für BEIDE Pfade (die Weiche W1 tauscht die Fassung, nicht den Slot).
 *  - Alle anderen Slots (`derivation`, `stage-edit`, `special`) tragen auf der
 *    Bühne ein kurzes FELD-ETIKETT; die Seiten lösen es über den BASIS-Schlüssel
 *    auf, nie über `questionKeyFor` (Begründung s. `d.gapReveal` unten).
 *  - Jeder gesetzte `helpKey` braucht seinen Lehrblock.
 *
 * `d.gapReveal` IST DER GRUND FÜR DIESE TRENNUNG: der Slot hat nur
 * `pathVariants: { relaunch: true }`, also lieferte `questionKeyFor` auf dem
 * Gründer-Pfad `brand.q.d.gapReveal` und auf dem Relaunch-Pfad
 * `brand.q.d.gapReveal.relaunch`. Ein verschachtelter JSON-Katalog kann unter
 * EINEM Schlüssel nicht gleichzeitig eine Zeichenkette und ein Kind-Objekt
 * halten — beides zusammen ist dort nicht ausdrückbar. Da `d.gapReveal` eine
 * ABLEITUNG ist (`editor: 'none'`, es wird nie gefragt), ist die Auflösung: die
 * Bühne beschriftet ihn mit dem Basis-Schlüssel, der beide Pfade trägt. Ein
 * eigener Relaunch-Wortlaut („Außenbild-Check") braucht eine Änderung an der
 * Schlüssel-Konvention, nicht einen Sonderfall im Katalog.
 */

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'i18n', 'locales')
const LOCALES = ['de', 'en'] as const

function flatten(node: unknown, prefix: string, into: Set<string>): Set<string> {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return into
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, into)
    else into.add(path)
  }
  return into
}

const catalogs = Object.fromEntries(
  LOCALES.map(locale => [
    locale,
    flatten(JSON.parse(readFileSync(join(localesDir, `${locale}.json`), 'utf8')), '', new Set<string>()),
  ]),
) as Record<(typeof LOCALES)[number], Set<string>>

/** Welche Sprachen den Schlüssel NICHT haben — leer heisst „in Ordnung". */
function missingIn(key: string): string[] {
  return LOCALES.filter(locale => !catalogs[locale].has(key))
}

/** Die Schlüssel, die die Oberfläche für DIESEN Slot wirklich auflöst. */
function keysFor(slot: BrandSlot): string[] {
  if (slot.type === 'question' || slot.type === 'choice') {
    return [...new Set([questionKeyFor(slot, 'new'), questionKeyFor(slot, 'relaunch')])]
  }
  return [slot.questionKey]
}

const activeSlots = BRAND_SLOTS.filter(slot => !slot.deactivated)

describe('brand i18n-Katalog', () => {
  it('kennt beide Sprachen mit demselben Schlüsselvorrat', () => {
    const de = [...catalogs.de].sort()
    const en = [...catalogs.en].sort()
    expect(de).toEqual(en)
    expect(de.length).toBeGreaterThan(0)
  })

  it('hat für JEDEN aktiven Slot eine Frage bzw. ein Feld-Etikett', () => {
    const gaps: string[] = []
    for (const slot of activeSlots) {
      for (const key of keysFor(slot)) {
        const missing = missingIn(key)
        if (missing.length) gaps.push(`${slot.id}: ${key} fehlt in ${missing.join(', ')}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('hat für JEDEN helpKey einen Lehrblock', () => {
    const withHelp = activeSlots.filter(slot => slot.helpKey !== null)
    // Katalog §13 kennt sieben Lehrblöcke + die B2-Infografik; sie hängen an
    // 15 Slots. Die Zahl steht hier, damit ein stilles Wegfallen auffällt.
    expect(withHelp).toHaveLength(15)

    const gaps: string[] = []
    for (const slot of withHelp) {
      const missing = missingIn(slot.helpKey!)
      if (missing.length) gaps.push(`${slot.id}: ${slot.helpKey} fehlt in ${missing.join(', ')}`)
    }
    expect(gaps).toEqual([])
  })

  it('löst den Abschluss-CTA der App-Config auf', () => {
    // `pukalani.brand.completionCta.labelKey` — die Schuld aus P1a.
    expect(missingIn('brand.cta.book')).toEqual([])
  })

  it('trägt die Werkstatt-Beschriftung (Konfidenz, Autosave, 409)', () => {
    const chrome = [
      'brand.workspace.confidence.fits',
      'brand.workspace.confidence.almost',
      'brand.workspace.confidence.restart',
      'brand.workspace.sync.saving',
      'brand.workspace.sync.saved',
      'brand.workspace.sync.offline',
      'brand.workspace.sync.error',
      'brand.workspace.sync.conflict',
      'brand.workspace.conflict.loadServer',
      'brand.workspace.conflict.copyMine',
      'brand.workspace.next',
      'brand.workspace.back',
      'brand.workspace.dontKnow',
    ]
    const gaps = chrome.filter(key => missingIn(key).length)
    expect(gaps).toEqual([])
  })

  it('trägt die Beschriftung der Generierung und der Fassungs-Wiederherstellung', () => {
    // Diese Schlüssel rendert die Werkstatt an Slots und in zwei Fenstern. Sie
    // stehen hier NAMENTLICH, weil sie an keiner Registry hängen: fiele einer
    // weg, stünde er wörtlich in der Oberfläche, und kein anderer Test sähe es.
    const generation = [
      'brand.workspace.draftBadge',
      'brand.workspace.generate.start',
      'brand.workspace.generate.again',
      'brand.workspace.generate.stop',
      'brand.workspace.generate.hintPlaceholder',
      'brand.workspace.generate.hintLabel',
      'brand.workspace.generate.aiDisabled',
      'brand.workspace.generate.noGenerator',
      'brand.workspace.generate.busy',
      'brand.workspace.generate.stopped',
      'brand.workspace.generate.failed',
      'brand.workspace.generate.dismiss',
      'brand.workspace.versions.open',
      'brand.workspace.versions.title',
      'brand.workspace.versions.description',
      'brand.workspace.versions.use',
      'brand.workspace.versions.first',
      'brand.workspace.versions.dropped',
      'brand.workspace.versions.empty',
      'brand.workspace.versions.loading',
      'brand.workspace.versions.close',
    ]
    expect(generation.filter(key => missingIn(key).length)).toEqual([])
  })

  it('GEGENPROBE: ein erfundener Slot fällt durch', () => {
    const invented: BrandSlot = { ...activeSlots[0]!, id: 'z.erfunden', questionKey: 'brand.q.z.erfunden' }
    expect(keysFor(invented).every(key => missingIn(key).length === 0)).toBe(false)
  })

  it('KEINE spitzen Klammern und kein rohes At-Zeichen in Nachrichten', () => {
    // Beides bricht den Nachrichten-Compiler bzw. wird als HTML gelesen
    // (CLAUDE.md: `/discussions/<adresse>` hat den CLIENT ausgehebelt).
    for (const locale of LOCALES) {
      const raw = readFileSync(join(localesDir, `${locale}.json`), 'utf8')
      const parsed = JSON.parse(raw) as unknown
      const values: string[] = []
      const walk = (node: unknown): void => {
        if (typeof node === 'string') { values.push(node); return }
        if (node && typeof node === 'object') Object.values(node).forEach(walk)
      }
      walk(parsed)
      expect(values.filter(value => /[<>]/.test(value)), locale).toEqual([])
      expect(values.filter(value => value.includes('@')), locale).toEqual([])
    }
  })
})
