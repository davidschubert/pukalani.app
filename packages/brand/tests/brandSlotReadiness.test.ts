import { describe, expect, it } from 'vitest'
import {
  type BrandReadinessInput,
  slotReadiness,
} from '../shared/brandSlotReadiness'
import { dependencyClosure } from '../shared/slotRegistry'
import type { BrandStartCard } from '../shared/types/brand'

/**
 * DAS BEREITSCHAFTS-GATE — „zu wenig ist zu wenig" (Davids Entscheidung).
 *
 * Was hier bewiesen wird, ist nicht die Mechanik, sondern die ANGEMESSENHEIT:
 *  1. Eine VOLLE Startkarte reicht für die drei Felder, die aus ihr schöpfen —
 *     ein Gate, das auch dann bremst, ist kein Gate, sondern eine Sackgasse.
 *  2. Ein FEHLENDES Feld wird BEIM NAMEN genannt. „Geht nicht" ist genau die
 *     Auskunft, die Davids Leitsatz verbietet.
 *  3. Wettbewerber und Ton-Analyse hängen an Material, das die vier kurzen
 *     Antworten nicht liefern können — und sagen das VERSCHIEDEN (Namen bzw.
 *     Texte), weil zwei verschiedene Wege daraus folgen.
 *  4. Die Registry-Regel greift für alles Übrige: hat ein Feld Quell-Slots und
 *     ist jeder davon leer, gibt es nichts abzuleiten.
 */

function card(overrides: Partial<BrandStartCard> = {}): BrandStartCard {
  return { websiteUrl: '', industry: '', about: '', audience: '', ...overrides }
}

const FULL_CARD = card({
  websiteUrl: 'https://kailua.coffee',
  industry: 'Kaffeerösterei',
  about: 'Wir rösten Kaffee in kleinen Mengen.',
  audience: 'Cafés auf Maui.',
})

function input(overrides: Partial<BrandReadinessInput> = {}): BrandReadinessInput {
  return {
    startCard: overrides.startCard ?? FULL_CARD,
    hasSiteAnalysis: overrides.hasSiteAnalysis ?? false,
    records: overrides.records ?? {},
  }
}

describe('Startkarten-Felder (Baustein A)', () => {
  it('VOLLE KARTE: Pitch, Kategorie und Zielgruppen-Skizze sind bereit', () => {
    for (const slotId of ['a.pitch', 'a.category', 'a.audienceSketch']) {
      expect(slotReadiness(slotId, input()), slotId).toEqual({ ready: true })
    }
  })

  it('a.pitch nennt BEIDE fehlenden Felder beim Namen', () => {
    expect(slotReadiness('a.pitch', input({ startCard: card({ industry: 'Kaffee' }) })))
      .toEqual({ ready: false, missing: ['startcard.about', 'startcard.audience'] })
  })

  it('a.pitch nennt nur das eine, das wirklich fehlt', () => {
    expect(slotReadiness('a.pitch', input({ startCard: card({ about: 'Wir rösten.', audience: '  ' }) })))
      .toEqual({ ready: false, missing: ['startcard.audience'] })
  })

  it('a.category hängt an der Branche, a.audienceSketch an der Zielgruppe', () => {
    expect(slotReadiness('a.category', input({ startCard: card({ about: 'x', audience: 'y' }) })))
      .toEqual({ ready: false, missing: ['startcard.industry'] })
    expect(slotReadiness('a.audienceSketch', input({ startCard: card({ industry: 'x', about: 'y' }) })))
      .toEqual({ ready: false, missing: ['startcard.audience'] })
  })

  it('LEERZEICHEN SIND KEINE ANTWORT', () => {
    expect(slotReadiness('a.category', input({ startCard: card({ industry: '   \n ' }) })))
      .toEqual({ ready: false, missing: ['startcard.industry'] })
  })
})

describe('Material jenseits der Startkarte', () => {
  it('a.competitors braucht NAMEN — und die stehen heute nur auf der Website', () => {
    expect(slotReadiness('a.competitors', input()))
      .toEqual({ ready: false, missing: ['competitor_names'] })
    expect(slotReadiness('a.competitors', input({ hasSiteAnalysis: true }))).toEqual({ ready: true })
  })

  it('a.toneAnalysis braucht TEXTE — anderer Bedarf, anderer Satz', () => {
    expect(slotReadiness('a.toneAnalysis', input()))
      .toEqual({ ready: false, missing: ['source_texts'] })
    expect(slotReadiness('a.toneAnalysis', input({ hasSiteAnalysis: true }))).toEqual({ ready: true })
  })

  it('EINE VOLLE STARTKARTE ERSETZT BEIDES NICHT', () => {
    // Vier kurze Antworten enthalten weder Wettbewerber-Namen noch Textproben.
    // Genau das ist der Befund, der das Gate ausgelöst hat.
    expect(slotReadiness('a.competitors', input({ startCard: FULL_CARD })).ready).toBe(false)
    expect(slotReadiness('a.toneAnalysis', input({ startCard: FULL_CARD })).ready).toBe(false)
  })
})

describe('Die Regel aus der Registry', () => {
  it('ein Feld mit Quell-Slots, die ALLE leer sind, ist nicht bereit', () => {
    // `b.purpose` schöpft aus a.pitch, b.whyStarted, b.worldLoses, b.conviction.
    expect(dependencyClosure('b.purpose').length).toBeGreaterThan(0)
    expect(slotReadiness('b.purpose', input()))
      .toEqual({ ready: false, missing: ['source_slots'] })
  })

  it('EINE gefüllte Quelle genügt — den Rest fängt Georges Rückfrage ab', () => {
    // „Alle leer" und nicht „einer leer": ein halb gefüllter Stand ist genau
    // der Fall, für den es `outcome: 'question'` gibt.
    expect(slotReadiness('b.purpose', input({ records: { 'a.pitch': 'Wir rösten Kaffee.' } })))
      .toEqual({ ready: true })
  })

  it('ein Feld OHNE Quell-Slots wird von dieser Regel nicht angefasst', () => {
    // Die A-Slots haben laut Registry keine `dependencies` (sie schöpfen aus
    // der Startkarte) — sonst wäre jeder erste Entwurf gesperrt.
    expect(dependencyClosure('a.pitch')).toEqual([])
    expect(slotReadiness('a.pitch', input())).toEqual({ ready: true })
  })

  it('ein unbekannter Slot gilt als bereit — dieses Gate ist kein zweiter Katalog', () => {
    expect(slotReadiness('z.erfunden', input())).toEqual({ ready: true })
  })
})

describe('Mehrere Gründe', () => {
  it('sammelt Slot-Regel UND Registry-Regel, ohne zu doppeln', () => {
    // `c.candidates` schöpft aus sieben Slots (alle leer) — und hat keine
    // eigene Regel; `f.candidates` ebenso. Beide melden genau einen Bedarf.
    expect(slotReadiness('c.candidates', input()))
      .toEqual({ ready: false, missing: ['source_slots'] })

    // Und ein Feld mit beidem: leere Karte + leere Quellen wäre bei
    // `b.positioningCategory` zweimal dasselbe Problem, aber nur ein Eintrag.
    const result = slotReadiness('b.positioningCategory', input({ startCard: card() }))
    expect(result.ready).toBe(false)
    expect(result.ready === false && new Set(result.missing).size).toBe(
      result.ready === false ? result.missing.length : 0,
    )
  })
})
