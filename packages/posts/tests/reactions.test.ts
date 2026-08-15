import { describe, expect, it } from 'vitest'
import { BADGE_CATALOG } from '../shared/badges'
import { MEMBER_COUNTER_COLUMNS } from '../shared/memberCounters'

/**
 * BADGE-NEUTRALITAET — Davids Folgeregel, am Abzeichen-Katalog festgenagelt
 * (F57 Mechanik 1).
 *
 * Die REGELN der Reaktionen (Satz, Aggregation, Umschalten) sind am
 * 2026-08-14 mit ihrer Datei nach `core` gezogen und werden dort geprueft
 * (`packages/core/tests/reactions.test.ts`) — seit Davids Entscheidung vom
 * 2026-08-13 zeigen zwei Produkte dieselbe Leiste. HIER bleibt, was nur
 * dieser Layer beantworten kann: der Katalog und die Zaehler-Spalten liegen
 * bei `posts`, und genau sie halten fest, dass Reaktionen KEIN Abzeichen
 * bewegen ausser `first-reaction`.
 *
 * Ohne diese Datei waere Davids Folgeregel eine Bemerkung im Kommentar. Die
 * Gegenprobe am SCHREIBWEG steht daneben in `reactions-door.test.ts` (posts)
 * bzw. `comment-reactions-door.test.ts` (comments).
 */

describe('BADGE-NEUTRALITAET — Davids Folgeregel, festgenagelt', () => {
  /**
   * Konzept Teil 4 Punkt 3: „Badges zaehlen weiter AUSSCHLIESSLICH Upvotes,
   * Reaktionen sind reiner Ausdruck und badge-neutral — sonst haette ‚Like'
   * zwei Quellen." Die einzige zugesagte Ausnahme ist `first-reaction`.
   */
  it('laesst GENAU EIN Abzeichen von Reaktionen wissen', () => {
    const abhaengig = BADGE_CATALOG.filter(b => b.requires.reactionsGiven !== undefined)
    expect(abhaengig.map(b => b.key)).toEqual(['first-reaction'])
  })

  it('macht daraus ein erstes Mal, keine Sammel-Schwelle', () => {
    const badge = BADGE_CATALOG.find(b => b.key === 'first-reaction')!
    expect(badge.requires.reactionsGiven).toBe(1)
    expect(badge.awardedPer).toBe('once')
    // Und sonst NICHTS: keine Stimmen, keine Zugehoerigkeit, keine Stufe —
    // sonst waere es nicht mehr „die erste Reaktion".
    expect(Object.keys(badge.requires)).toEqual(['reactionsGiven'])
  })

  it('zaehlt Reaktionen NUR in der gebenden Richtung', () => {
    /**
     * Es gibt bewusst kein `reactionsReceived` — weder als Zaehler-Spalte noch
     * als Katalog-Bedingung. Genau das waere die zweite Like-Quelle.
     */
    expect(MEMBER_COUNTER_COLUMNS).toContain('reactionsGiven')
    expect(MEMBER_COUNTER_COLUMNS).not.toContain('reactionsReceived')
    for (const badge of BADGE_CATALOG) {
      expect(Object.keys(badge.requires), badge.key).not.toContain('reactionsReceived')
    }
  })

  it('laesst die Upvote-Bedingungen unangetastet', () => {
    // Die Gegenprobe zur Zeile darueber: die Abzeichen, die es schon gab,
    // haengen unveraendert an Stimmen — eine Reaktion bewegt keine davon.
    const upvoteBasiert = BADGE_CATALOG.filter(b =>
      b.requires.likesGiven !== undefined
      || b.requires.likedItems || b.requires.likedTopics || b.requires.likedReplies)
    expect(upvoteBasiert.length).toBe(14)
    for (const badge of upvoteBasiert) {
      expect(badge.requires.reactionsGiven, badge.key).toBeUndefined()
    }
  })
})
