import { describe, expect, it } from 'vitest'
import {
  BRAND_FOUNDATION_CHAPTER_IDS,
  BRAND_FOUNDATION_VISUAL_ELEMENTS,
  type BrandFoundationBlock,
  type BrandFoundationInput,
  buildBrandFoundation,
} from '../shared/brandFoundation'
import { formatBrandSlotList, formatBrandSlotStructured } from '../shared/brandSlotFormat'
import { BRAND_SLOTS, type BrandSlot, type BrandStepKey, sessionTravels, slotById } from '../shared/slotRegistry'

/**
 * DER RENDERER DER LESEANSICHT (Konzept §2.2/§2.3, Paket G1).
 *
 * Die teuerste Zusage dieses Vorhabens ist eine NEGATIVE: „eine Rohantwort und
 * ein vertrauliches Feld erscheinen NIE" — und eine negative Zusage ist genau
 * so viel wert wie ihre Gegenprobe. Der Beweis legt deshalb einen Snapshot mit
 * ALLEN 68 Sessions vor (so, wie jeder heute bestehende Snapshot aussieht, s.
 * §2.8) und prüft beide Richtungen an derselben Eingabe: die 30 reisefähigen
 * Werte stehen im Ergebnis, die 38 übrigen nicht.
 */

/** Ein formgültiger, EINDEUTIG wiedererkennbarer Wert je Session. */
function dummyValue(slot: BrandSlot): string {
  const marker = `wert-${slot.id}`
  switch (slot.schema.kind) {
    case 'list':
      return formatBrandSlotList([`${marker}-eins`, `${marker}-zwei`])
    case 'structured':
      return formatBrandSlotStructured([{ label: `${marker}-etikett`, body: `${marker}-inhalt` }])
    default:
      return `${marker}-text`
  }
}

/** Der Snapshot, wie `share.post.ts` ihn heute einfriert: alles Bestätigte. */
function snapshotOf(slots: readonly BrandSlot[], story: string | null = null): BrandFoundationInput {
  const byStep = new Map<BrandStepKey, { slotId: string, value: string }[]>()
  for (const slot of slots) {
    const bucket = byStep.get(slot.stepId) ?? []
    bucket.push({ slotId: slot.id, value: dummyValue(slot) })
    byStep.set(slot.stepId, bucket)
  }
  return {
    title: 'Kailua Coffee Co.',
    contentLocale: 'en',
    story,
    chapters: [...byStep].map(([stepKey, slots]) => ({ stepKey, slots })),
  }
}

function payload(input: BrandFoundationInput): string {
  return JSON.stringify(buildBrandFoundation(input))
}

const ALL = snapshotOf(BRAND_SLOTS, 'Erster Absatz der Story.\n\nZweiter Absatz.')

describe('buildBrandFoundation — was reist und was nicht', () => {
  it('zeigt KEINEN Wert einer Session, die nicht reist — auch wenn er im Snapshot steht', () => {
    const rendered = payload(ALL)
    const held = BRAND_SLOTS.filter(slot => !sessionTravels(slot))
    // Der Snapshot trägt sie alle — das ist die Ausgangslage, nicht der Fehler.
    expect(held.length).toBeGreaterThan(0)
    for (const slot of held) {
      expect(rendered, `${slot.id} steht in der Leseansicht`).not.toContain(`wert-${slot.id}`)
    }
  })

  it('GEGENPROBE: die reisefähigen Werte stehen sehr wohl darin', () => {
    const rendered = payload(ALL)
    // Ohne diese Zeile bestünde die Prüfung oben auch für einen Renderer, der
    // gar nichts ausgibt.
    for (const slot of BRAND_SLOTS.filter(slot => sessionTravels(slot))) {
      expect(rendered, `${slot.id} fehlt in der Leseansicht`).toContain(`wert-${slot.id}`)
    }
  })

  it('GEGENPROBE am Paar: der Pitch steht da, die Gründungsgeschichte daneben nicht', () => {
    // Beide sind `sensitivity: 'public'` — den Unterschied macht allein
    // `audience` (§2.3): der Pitch ist eine Festlegung, die Herkunftsgeschichte
    // ist das Material, aus dem George ihn gebaut hat.
    expect(slotById('a.origin')!.sensitivity).toBe('public')
    const rendered = payload(snapshotOf([slotById('a.pitch')!, slotById('a.origin')!]))
    expect(rendered).toContain('wert-a.pitch')
    expect(rendered).not.toContain('wert-a.origin')
  })

  it('hält die vier vertraulichen Sessions zurück (Beschwerden, Wettbewerber)', () => {
    const heikel = ['a.competitors', 'a.complaints', 'a.challenge', 'a.facts']
    const rendered = payload(snapshotOf(heikel.map(id => slotById(id)!)))
    for (const id of heikel) expect(rendered).not.toContain(`wert-${id}`)
  })

  it('glaubt der Registry und nicht dem Kapitel, in dem ein Wert eingefroren wurde', () => {
    // Ein Snapshot könnte einen Wert unter dem falschen stepKey tragen (oder
    // ein künftiger Upcaster ihn umhängen) — entscheiden darf das die Registry.
    const rendered = payload({
      title: '', contentLocale: 'de', story: null,
      chapters: [{ stepKey: 'result', slots: [{ slotId: 'a.complaints', value: 'wert-a.complaints-text' }] }],
    })
    expect(rendered).not.toContain('wert-a.complaints')
  })

  it('FAIL-CLOSED: eine unbekannte Slot-Id erzeugt keinen Block', () => {
    const rendered = payload({
      title: '', contentLocale: 'de', story: null,
      chapters: [{ stepKey: 'context', slots: [{ slotId: 'gibt.es.nicht', value: 'geheim-xy' }] }],
    })
    expect(rendered).not.toContain('geheim-xy')
  })
})

describe('buildBrandFoundation — die Kapitel', () => {
  it('hält die Reihenfolge aus §2.2 ein', () => {
    expect(buildBrandFoundation(ALL).chapters.map(chapter => chapter.id))
      .toEqual([...BRAND_FOUNDATION_CHAPTER_IDS])
  })

  it('gibt jedem Kapitel Sprungmarke, Titel-Schlüssel und Zustand', () => {
    for (const chapter of buildBrandFoundation(ALL).chapters) {
      expect(chapter.anchor, chapter.id).toBe(chapter.id)
      expect(chapter.titleKey, chapter.id).toBe(`brand.foundation.chapter.${chapter.id}`)
      expect(chapter.state, chapter.id).toBe(chapter.id === 'visuell' ? 'locked' : 'done')
    }
  })

  it('LEERE EINGABE: nur die visuelle Schranke bleibt stehen', () => {
    const view = buildBrandFoundation({
      title: '', contentLocale: 'de', story: null, chapters: [],
    })
    expect(view.chapters.map(chapter => chapter.id)).toEqual(['visuell'])
    expect(view.chapters[0]!.blocks).toEqual(
      BRAND_FOUNDATION_VISUAL_ELEMENTS.map(element => ({ kind: 'locked', element })),
    )
  })

  it('lässt Markenarchitektur und Name ohne ihre Sessions ENTFALLEN', () => {
    const withoutPaths = BRAND_SLOTS.filter(slot => slot.stepId !== 'architecture' && slot.stepId !== 'naming')
    const ids = buildBrandFoundation(snapshotOf(withoutPaths)).chapters.map(chapter => chapter.id)
    expect(ids).not.toContain('architektur')
    expect(ids).not.toContain('name')
    // Gegenprobe: mit ihnen sind beide da.
    expect(buildBrandFoundation(ALL).chapters.map(chapter => chapter.id)).toContain('architektur')
  })

  it('erzeugt die Story nicht beim Lesen — ohne sie entfällt Kapitel 0', () => {
    expect(buildBrandFoundation(snapshotOf(BRAND_SLOTS)).chapters.map(chapter => chapter.id))
      .not.toContain('story')
    const story = buildBrandFoundation(snapshotOf(BRAND_SLOTS, 'Eins.\n\nZwei.\n\nDrei.')).chapters[0]!
    expect(story.id).toBe('story')
    expect(story.blocks).toEqual([
      { kind: 'lead', text: 'Eins.' },
      { kind: 'text', text: 'Zwei.' },
      { kind: 'text', text: 'Drei.' },
    ])
  })

  it('zeigt Kapitel 11 nur mit mindestens einer seiner Quellen', () => {
    const source = buildBrandFoundation(snapshotOf([slotById('c.final')!]))
    expect(source.chapters.map(chapter => chapter.id)).toContain('ki-texte')
    const other = buildBrandFoundation(snapshotOf([slotById('b.purpose')!]))
    expect(other.chapters.map(chapter => chapter.id)).not.toContain('ki-texte')
  })
})

/** Bequemer Zugriff auf die Blöcke EINES Kapitels. */
function blocksOf(input: BrandFoundationInput, chapterId: string): readonly BrandFoundationBlock[] {
  return buildBrandFoundation(input).chapters.find(chapter => chapter.id === chapterId)?.blocks ?? []
}

function valuesFor(entries: Record<string, string>): BrandFoundationInput {
  return {
    title: '',
    contentLocale: 'de',
    story: null,
    chapters: [{
      stepKey: 'values',
      slots: Object.entries(entries).map(([slotId, value]) => ({ slotId, value })),
    }],
  }
}

describe('buildBrandFoundation — die Blöcke', () => {
  it('legt je Wert Definition und gelebtes Beispiel auf EINE Karte', () => {
    const blocks = blocksOf(valuesFor({
      'c.final': '- Klartext\n- Handwerk',
      'c.definitions': '- Klartext — Wir sagen Preise, bevor jemand fragt.',
      'c.livedExamples': '- Klartext — Im März stand der neue Preis eine Woche vorher an der Tafel.',
    }), 'werte')
    expect(blocks[0]).toEqual({
      kind: 'cards',
      labelKey: 'brand.foundation.label.values',
      items: [
        {
          title: 'Klartext',
          text: 'Wir sagen Preise, bevor jemand fragt.',
          note: 'Im März stand der neue Preis eine Woche vorher an der Tafel.',
        },
        { title: 'Handwerk', text: '' },
      ],
    })
  })

  it('verliert eine Definition NICHT, die sich keinem gewählten Wert zuordnen lässt', () => {
    const blocks = blocksOf(valuesFor({
      'c.final': '- Klartext',
      'c.definitions': '- Nähe — Unsere Gäste kennen den Röster beim Namen.',
    }), 'werte')
    expect(JSON.stringify(blocks)).toContain('Unsere Gäste kennen den Röster beim Namen.')
  })

  it('stellt je Ton-Wort EINE Stimmprobe darunter — und erfindet keine', () => {
    const blocks = blocksOf({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'archetype',
        slots: [
          { slotId: 'd.toneWords', value: '- ruhig\n- fundiert\n- gerade heraus' },
          { slotId: 'd.voiceSamples', value: '- Die Maschine läuft seit sechs.\n- Der Preis ist gestiegen.' },
        ],
      }],
    }, 'stimme')
    expect(blocks.find(block => block.kind === 'chips')).toEqual({
      kind: 'chips',
      labelKey: 'brand.foundation.label.toneWords',
      items: [
        { word: 'ruhig', sample: 'Die Maschine läuft seit sechs.' },
        { word: 'fundiert', sample: 'Der Preis ist gestiegen.' },
        { word: 'gerade heraus', sample: '' },
      ],
    })
  })

  it('paart Do und Don’t — bei ungleicher Länge bleibt die andere Hälfte LEER', () => {
    const blocks = blocksOf({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'verbal',
        slots: [{
          slotId: 'ep.vocabulary',
          value: '- benutzen: unsere Bohnen\n- benutzen: von Hand\n- meiden: Premium-Selektion',
        }],
      }],
    }, 'stimme')
    expect(blocks.find(block => block.kind === 'dodont')).toEqual({
      kind: 'dodont',
      labelKey: 'brand.foundation.label.doDont',
      pairs: [
        { doText: 'unsere Bohnen', dontText: 'Premium-Selektion' },
        { doText: 'von Hand', dontText: '' },
      ],
    })
  })

  it('füllt den KI-Rahmen aus Ton-Wörtern, Tabu-Wörtern und Werten', () => {
    const view = buildBrandFoundation({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'archetype',
        slots: [
          { slotId: 'd.toneWords', value: '- ruhig\n- fundiert' },
          { slotId: 'd.vocabulary', value: '- meiden: Genuss-Erlebnis' },
          { slotId: 'c.final', value: '- Klartext\n- Nähe' },
        ],
      }],
    })
    expect(view.chapters.find(chapter => chapter.id === 'ki-texte')!.blocks).toEqual([
      { kind: 'aiRules', tone: ['ruhig', 'fundiert'], avoid: ['Genuss-Erlebnis'], stands: ['Klartext', 'Nähe'] },
    ])
  })

  it('reicht Archetyp und Architektur-Modell als IDS weiter, nie als Text', () => {
    const view = buildBrandFoundation({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'archetype',
        slots: [
          { slotId: 'd.primary', value: 'sage' },
          { slotId: 'd.secondary', value: 'creator' },
        ],
      }],
    })
    expect(view.chapters.find(chapter => chapter.id === 'stimme')!.blocks[0]).toEqual({
      kind: 'choice',
      labelKey: 'brand.foundation.label.archetype',
      slotId: 'd.primary',
      optionIds: ['sage', 'creator'],
    })
  })

  it('nummeriert die Top drei — die Reihenfolge IST die Aussage', () => {
    const blocks = blocksOf({
      title: '', contentLocale: 'de', story: null,
      chapters: [{ stepKey: 'naming', slots: [{ slotId: 'f.decision', value: '- Bogen\n- Nordfeld\n- Satzbau' }] }],
    }, 'name')
    expect(blocks[0]).toEqual({
      kind: 'table',
      labelKey: 'brand.foundation.label.nameDecision',
      columnKeys: ['brand.foundation.column.rank', 'brand.foundation.column.name'],
      rows: [['1', 'Bogen'], ['2', 'Nordfeld'], ['3', 'Satzbau']],
    })
  })

  it('macht aus beschrifteten Blöcken Karten (Zielgruppen, Boilerplates)', () => {
    const blocks = blocksOf({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'context',
        slots: [{ slotId: 'a.audienceSketch', value: '## Wer\nLeute aus den Büros\n\n## Was sie wollen\nEtwas Warmes' }],
      }],
    }, 'kontext')
    expect(blocks).toEqual([{
      kind: 'cards',
      labelKey: 'brand.foundation.label.audience',
      items: [
        { title: 'Wer', text: 'Leute aus den Büros' },
        { title: 'Was sie wollen', text: 'Etwas Warmes' },
      ],
    }])
  })

  it('WIRFT NICHTS WEG: ein formfremder Wert steht als Textblock da', () => {
    const blocks = blocksOf({
      title: '', contentLocale: 'de', story: null,
      chapters: [{
        stepKey: 'verbal',
        // Weder „## " noch „- ": ein Mensch hat im Textfeld nachgebessert.
        slots: [{ slotId: 'ep.boilerplates', value: 'Kailua Coffee Co. röstet eine Sorte pro Saison.' }],
      }],
    }, 'messaging')
    expect(blocks).toEqual([{
      kind: 'text',
      labelKey: 'brand.foundation.label.boilerplates',
      text: 'Kailua Coffee Co. röstet eine Sorte pro Saison.',
    }])
  })
})
