import { describe, expect, it } from 'vitest'
import {
  BRAND_DECLARED_FONT_FAMILIES,
  BRAND_FONT_PAIRS,
  BRAND_MONO_STACK,
  brandFontPair,
  brandFontPairFamilies,
  validateBrandFontPairs,
} from '../shared/brandFontPairs'

/**
 * DER SCHRIFTPAAR-KATALOG UND DIE FALLE DAHINTER (Konzept §2.4/§2.17).
 *
 * `@nuxt/fonts` self-hostet nur, was der BUILD im CSS sieht. Eine Familie, die
 * im Katalog steht und nirgends deklariert ist, fällt in der Vorschau STILL
 * auf den Systemstack zurück — kein Fehler, keine Warnung, kein roter Build,
 * und die Seite sähe aus wie G4 („eine Richtung, kein Rendering-Beweis"),
 * obwohl sie genau das Gegenteil beweisen soll.
 *
 * Dieser Test ist bis **D4** der einzige Wächter dagegen: er hält Katalog und
 * Deklarations-Liste aneinander. D4 macht das App-CSS zur QUELLE der Liste;
 * bis dahin ist sie von Hand gepflegt, und genau deshalb braucht sie eine
 * Prüfung mit Gegenprobe.
 */
describe('BRAND_FONT_PAIRS — der kuratierte Katalog', () => {
  it('führt die sechs Paare aus dem Themes-Konzept und dem Richtungs-Katalog', () => {
    expect(BRAND_FONT_PAIRS.map(pair => pair.id))
      .toEqual(['editorial', 'humanist', 'inter', 'geometric', 'classic', 'contrast'])
  })

  it('ist in jeder Hinsicht gültig', () => {
    expect(validateBrandFontPairs()).toEqual([])
  })

  it('JEDE Familie des Katalogs ist deklariert (§2.17)', () => {
    const declared = new Set(BRAND_DECLARED_FONT_FAMILIES)
    for (const pair of BRAND_FONT_PAIRS) {
      for (const family of brandFontPairFamilies(pair)) {
        expect(declared, `${pair.id}: ${family}`).toContain(family)
      }
    }
  })

  it('GEGENPROBE: eine nicht deklarierte Familie fällt durch', () => {
    // Ohne sie wäre die Prüfung oben auch für eine Liste grün, die einfach
    // jede Familie enthält, die je gefragt wird.
    const problems = validateBrandFontPairs(BRAND_FONT_PAIRS, ['Inter'])
    expect(problems.some(line => line.includes('Source Serif 4'))).toBe(true)
    expect(problems.some(line => line.includes('nicht deklariert'))).toBe(true)
  })

  it('GEGENPROBE: ein Stack, der seine eigene Familie nicht nennt, fällt durch', () => {
    const broken = BRAND_FONT_PAIRS.map((pair, index) => (index === 0
      ? { ...pair, headingStack: 'Georgia, serif' }
      : pair))
    expect(validateBrandFontPairs(broken).some(line => line.includes('heading-Stack'))).toBe(true)
  })

  it('gibt jedem Stack einen echten Rückfall — nie eine Familie allein', () => {
    for (const pair of BRAND_FONT_PAIRS) {
      expect(pair.headingStack.split(',').length, `${pair.id} heading`).toBeGreaterThan(1)
      expect(pair.bodyStack.split(',').length, `${pair.id} body`).toBeGreaterThan(1)
    }
  })

  it('hält die Drei-Schriften-Regel: höchstens zwei Familien je Paar plus die feste Mono', () => {
    for (const pair of BRAND_FONT_PAIRS) {
      expect(brandFontPairFamilies(pair).length, pair.id).toBeLessThanOrEqual(2)
    }
    // `humanist` nutzt EINE Familie für beide Rollen — sonst prüfte die Zeile
    // oben nur eine Obergrenze, die nie jemand erreicht.
    expect(brandFontPairFamilies(brandFontPair('humanist')!)).toHaveLength(1)
    expect(BRAND_MONO_STACK).toContain('monospace')
  })

  it('findet ein Paar über seine Id — und erfindet keines', () => {
    expect(brandFontPair('editorial')?.headingFamily).toBe('Source Serif 4')
    expect(brandFontPair('comic')).toBeUndefined()
  })
})
