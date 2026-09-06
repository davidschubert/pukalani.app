import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { type BrandFoundationInput, buildBrandFoundation } from '../shared/brandFoundation'
import { formatBrandSlotList, formatBrandSlotStructured } from '../shared/brandSlotFormat'
import {
  BRAND_SLOTS,
  type BrandSlot,
  exampleKeyFor,
  partKeyFor,
  partLabelKeyFor,
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

/**
 * Die Schlüssel, die die Oberfläche für DIESEN Slot wirklich auflöst — über
 * BEIDE Pfade und, wo es eine Team-Fassung gibt, über beide Seiten der Weiche
 * W3 (Paket 2b: `c.discovery3` fragt im Team D7 statt D3).
 */
function keysFor(slot: BrandSlot): string[] {
  if (slot.type === 'question' || slot.type === 'choice') {
    return [...new Set([
      questionKeyFor(slot, 'new', 'solo'),
      questionKeyFor(slot, 'relaunch', 'solo'),
      questionKeyFor(slot, 'new', 'team'),
      questionKeyFor(slot, 'relaunch', 'team'),
    ])]
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

  it('führt beide Fassungen der Team-Weiche — in de UND en', () => {
    // Sie liegen als KINDER unter `brand.q.c.discovery3` (`.solo` / `.team`)
    // und nicht als Zeichenkette plus Kind: ein verschachtelter JSON-Katalog
    // kann unter EINEM Schlüssel nicht beides halten (dieselbe Grenze wie bei
    // `d.gapReveal`, s. Kopf). Deshalb bekommt AUCH der Solo-Fall ein Suffix.
    expect(missingIn('brand.q.c.discovery3.solo')).toEqual([])
    expect(missingIn('brand.q.c.discovery3.team')).toEqual([])
    // Der Basis-Schlüssel darf es nicht mehr geben — er stünde sonst wörtlich
    // in der Oberfläche, sobald jemand ihn ohne die Weiche auflöst.
    expect(missingIn('brand.q.c.discovery3').length).toBeGreaterThan(0)
  })

  it('hat für JEDEN Teil einer Sammel-Session eine eigene Frage', () => {
    // `a.facts` fragt drei Dinge nacheinander (Paket 3). Sie liegen unter
    // `brand.part.<id>.<teil>` und NICHT unter `brand.q.a.facts.<teil>`: dort
    // steht schon die Klammer-Frage als Zeichenkette, und ein JSON-Katalog kann
    // unter einem Schlüssel nicht gleichzeitig Text und Kind-Objekt halten —
    // dieselbe Grenze wie bei `d.gapReveal` (s. Kopf).
    const gaps: string[] = []
    for (const slot of activeSlots.filter(slot => slot.parts.length > 0)) {
      // Die Klammer-Frage bleibt und wird weiter gerendert.
      if (missingIn(slot.questionKey).length) gaps.push(`${slot.id}: ${slot.questionKey} fehlt`)
      for (const part of slot.parts) {
        const key = partKeyFor(slot, part)
        const missing = missingIn(key)
        if (missing.length) gaps.push(`${slot.id}: ${key} fehlt in ${missing.join(', ')}`)
      }
    }
    expect(gaps).toEqual([])
    // Ohne diese Zeile wäre der Test grün, sobald `parts` irgendwo leer würde.
    expect(activeSlots.filter(slot => slot.parts.length > 0).map(slot => slot.id)).toEqual(['a.facts'])
    expect(missingIn('brand.part.a.facts.erfunden').length).toBeGreaterThan(0)
  })

  it('und für JEDEN Teil ein kurzes Etikett — es steht im gespeicherten Wert', () => {
    // Der zusammengelegte Wert einer Sammel-Session ist ein `structured`-Wert
    // aus beschrifteten Blöcken (`## Team`). Fehlt das Etikett, stünde dort die
    // interne Teil-Id — im Brand-Dokument, das ein Mensch liest.
    const gaps: string[] = []
    for (const slot of activeSlots.filter(slot => slot.parts.length > 0)) {
      for (const part of slot.parts) {
        const key = partLabelKeyFor(slot, part)
        const missing = missingIn(key)
        if (missing.length) gaps.push(`${slot.id}: ${key} fehlt in ${missing.join(', ')}`)
      }
    }
    expect(gaps).toEqual([])
    expect(missingIn('brand.partLabel.a.facts.erfunden').length).toBeGreaterThan(0)
  })

  it('hat für JEDE Menschenfrage eine Beispiel-Antwort (Composer-Platzhalter)', () => {
    // Der Berater-Chat legt zur aktuellen `question`-Frage eine Beispiel-
    // Antwort GRAU ins Antwortfeld (`exampleKeyFor`, Muster Claude Desktop).
    // Fehlt der Schlüssel, stünde dort wörtlich `brand.example.…` — derselbe
    // stille Fehler wie bei den Fragen, deshalb dieselbe Prüfung.
    const gaps: string[] = []
    for (const slot of activeSlots.filter(slot => slot.type === 'question')) {
      const keys = new Set([
        exampleKeyFor(slot, 'new', 'solo'),
        exampleKeyFor(slot, 'relaunch', 'solo'),
        // Auch die Team-Fassung (Paket 8): `c.discovery3` fragt im Team etwas
        // anderes und braucht dafür ihre eigene Musterantwort.
        exampleKeyFor(slot, 'new', 'team'),
        exampleKeyFor(slot, 'relaunch', 'team'),
      ])
      for (const key of keys) {
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

/**
 * DIE LESEANSICHT SPRICHT NUR IN SCHLÜSSELN (Paket G2).
 *
 * `buildBrandFoundation` ist pur und schickt `titleKey`, `labelKey` und
 * `columnKeys` statt Text (Kopf von `shared/brandFoundation.ts`); die visuelle
 * Schranke schickt nur Element-Ids. Fehlt einer dieser Schlüssel im Katalog,
 * steht im Handbuch wörtlich `brand.foundation.label.pitch` — vue-i18n meldet
 * das nie, und Typecheck und Lint sehen davon nichts.
 *
 * GEPRÜFT WIRD DER ECHTE LAUF: die Schlüssel werden nicht aufgezählt, sondern
 * aus einer Foundation über ALLE Sessions eingesammelt. Ein neuer Block-Bauer
 * mit neuem Label ist damit automatisch mitgeprüft.
 */
describe('Brand Foundation — jeder erzeugte Schlüssel hat seinen Text', () => {
  /** Ein formgültiger Wert je Art — sonst fielen Karten und Tabellen aus. */
  function slotValue(slot: BrandSlot): string {
    switch (slot.schema.kind) {
      case 'list':
        return formatBrandSlotList([`${slot.id}-eins`, `${slot.id}-zwei`])
      case 'structured':
        return formatBrandSlotStructured([{ label: `${slot.id}-etikett`, body: `${slot.id}-inhalt` }])
      default:
        return `${slot.id}-text`
    }
  }

  const input: BrandFoundationInput = {
    title: 'Kailua Coffee Co.',
    contentLocale: 'en',
    story: 'Ein Absatz.',
    chapters: [{
      stepKey: 'context',
      slots: BRAND_SLOTS
        .filter(slot => !slot.deactivated)
        .map(slot => ({ slotId: slot.id, value: slotValue(slot) })),
    }],
  }

  /** Alles, was die Oberfläche an `t()` reicht — eingesammelt am Ergebnis. */
  function producedKeys(): string[] {
    const keys = new Set<string>()
    for (const chapter of buildBrandFoundation(input).chapters) {
      keys.add(chapter.titleKey)
      for (const block of chapter.blocks) {
        if ('labelKey' in block && block.labelKey) keys.add(block.labelKey)
        if (block.kind === 'table') block.columnKeys.forEach(key => keys.add(key))
        if (block.kind === 'locked') {
          keys.add(`brand.foundation.visual.${block.element}.title`)
          keys.add(`brand.foundation.visual.${block.element}.text`)
        }
      }
    }
    return [...keys]
  }

  it('kennt jeden Kapitel-, Beschriftungs- und Spalten-Schlüssel in BEIDEN Sprachen', () => {
    const produced = producedKeys()
    // Ohne diese Zeile wäre der Test auch für eine leere Menge grün.
    expect(produced.length).toBeGreaterThan(25)
    expect(produced.filter(key => missingIn(key).length)).toEqual([])
  })

  it('kennt die festen Texte der Seite in BEIDEN Sprachen', () => {
    const fixed = [
      'brand.nav.foundation',
      'brand.document.readFoundation',
      'brand.foundation.title',
      'brand.foundation.toc',
      'brand.foundation.counter',
      'brand.foundation.contentLocale',
      'brand.foundation.standProgress',
      'brand.foundation.loadFailed',
      'brand.foundation.empty',
      'brand.foundation.showToc',
      'brand.foundation.hideToc',
      'brand.foundation.chapterNumber',
      'brand.foundation.pending',
      'brand.foundation.pendingNote',
      'brand.foundation.toAcceptance',
      'brand.foundation.onePage.title',
      'brand.foundation.onePage.values',
      'brand.foundation.onePage.archetype',
      'brand.foundation.onePage.tagline',
      'brand.foundation.onePage.wallLine',
      'brand.foundation.export.label',
      'brand.foundation.export.print',
      'brand.foundation.export.printSub',
      'brand.foundation.export.context',
      'brand.foundation.export.contextSub',
      'brand.foundation.export.tokens',
      'brand.foundation.export.tokensSub',
      'brand.foundation.export.assets',
      'brand.foundation.export.assetsSub',
      'brand.foundation.export.kit',
      'brand.foundation.ai.tone',
      'brand.foundation.ai.avoid',
      'brand.foundation.ai.stands',
      'brand.foundation.ai.hint',
      'brand.foundation.visual.follows',
      'brand.foundation.visual.shareLine',
      'brand.foundation.visual.product',
      'brand.foundation.visual.ctaDesign',
      'brand.foundation.visual.ctaCall',
      // Die optionalen Kapitel-Vermerke — die Seite fragt sie mit `te()` ab,
      // vorhanden sein sollen sie trotzdem in beiden Sprachen.
      'brand.foundation.note.visuell',
      'brand.foundation.note.ki-texte',
      // Die Spaltenköpfe der Tabellen — je nach gespeicherter Form erzeugt die
      // Regel nur einen Teil davon, gebraucht werden sie alle.
      'brand.foundation.column.name',
      'brand.foundation.column.note',
      'brand.foundation.column.rank',
      'brand.foundation.column.check',
      'brand.foundation.column.criteria',
    ]
    expect(fixed.filter(key => missingIn(key).length)).toEqual([])
  })
})
