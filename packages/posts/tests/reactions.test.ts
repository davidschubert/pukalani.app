import { describe, expect, it } from 'vitest'
import {
  REACTION_EMOJI,
  REACTION_KEYS,
  type ReactionCount,
  aggregateReactions,
  allowedReactions,
  isReactionKey,
  toggledChips,
} from '../shared/reactions'
import { BADGE_CATALOG } from '../shared/badges'
import { MEMBER_COUNTER_COLUMNS } from '../shared/memberCounters'

/**
 * Die Regeln der Emoji-Reaktionen (F57 Mechanik 1).
 *
 * Der wichtigste Test dieser Datei ist der LETZTE Abschnitt: er haelt
 * fest, dass Reaktionen badge-neutral sind. Ohne ihn waere Davids
 * Folgeregel eine Bemerkung im Kommentar.
 */

describe('der kuratierte Satz', () => {
  it('hat acht Reaktionen, jede mit einem Zeichen', () => {
    expect(REACTION_KEYS.length).toBe(8)
    for (const key of REACTION_KEYS) {
      expect(REACTION_EMOJI[key], key).toBeTruthy()
    }
  })

  it('enthaelt WEDER Daumen NOCH Herz — die zweite Like-Quelle, die es nicht geben soll', () => {
    /**
     * DER WAECHTER UEBER DIE PRODUKT-ENTSCHEIDUNG, nicht ueber den Geschmack.
     * „Like = Upvote" (Konzept-Entscheidung 4) haelt nur, solange die
     * Reaktionsleiste keine Geste anbietet, die neben dem Aufstimm-Pfeil als
     * zweite Zustimmung gelesen wird. Wer 👍 oder ❤️ ergaenzt, hebt diese
     * Entscheidung auf und soll hier darueber stolpern.
     */
    const zeichen = Object.values(REACTION_EMOJI)
    expect(zeichen).not.toContain('👍')
    expect(zeichen).not.toContain('❤️')
    expect(zeichen).not.toContain('❤')
  })

  it('erkennt nur eigene Schluessel', () => {
    expect(isReactionKey('tada')).toBe(true)
    expect(isReactionKey('thumbsup')).toBe(false)
    expect(isReactionKey('')).toBe(false)
    expect(isReactionKey(null)).toBe(false)
    // Das ZEICHEN ist kein Schluessel — gespeichert wird 'tada', nie '🎉'.
    expect(isReactionKey('🎉')).toBe(false)
  })
})

describe('allowedReactions', () => {
  it('kuerzt auf die Konfiguration', () => {
    expect(allowedReactions(['tada', 'fire'])).toEqual(['tada', 'fire'])
  })

  it('behaelt die Katalog-Reihenfolge, nicht die der Konfiguration', () => {
    // Sonst haengt die Reihenfolge im Menue davon ab, wie jemand die Liste
    // getippt hat — und sie wechselt beim naechsten Umsortieren.
    expect(allowedReactions(['fire', 'laugh'])).toEqual(['laugh', 'fire'])
  })

  it('erweitert NIE — Unbekanntes faellt raus', () => {
    expect(allowedReactions(['tada', 'thumbsup', 'heart'])).toEqual(['tada'])
  })

  it('faellt auf den vollen Satz zurueck, wenn nichts Brauchbares dasteht', () => {
    // Eine leere Liste ist eine Fehlkonfiguration, kein „Produkt aus" — das
    // schaltet man ueber das Produkt-Gate ab.
    expect(allowedReactions(undefined)).toEqual([...REACTION_KEYS])
    expect(allowedReactions([])).toEqual([...REACTION_KEYS])
    expect(allowedReactions(['gibtsnicht'])).toEqual([...REACTION_KEYS])
  })
})

describe('aggregateReactions', () => {
  const rows = [
    { targetId: 'a', userId: 'u1', reaction: 'tada' },
    { targetId: 'a', userId: 'u2', reaction: 'tada' },
    { targetId: 'a', userId: 'u1', reaction: 'fire' },
    { targetId: 'b', userId: 'u2', reaction: 'laugh' },
  ]

  it('zaehlt je Ziel und Emoji und markiert die eigenen', () => {
    const summary = aggregateReactions(rows, 'u1')
    expect(summary.a).toEqual([
      { reaction: 'tada', count: 2, mine: true },
      { reaction: 'fire', count: 1, mine: true },
    ])
    expect(summary.b).toEqual([{ reaction: 'laugh', count: 1, mine: false }])
  })

  it('kennt ohne Betrachter kein „meine"', () => {
    const summary = aggregateReactions(rows, null)
    expect(summary.a?.every(chip => !chip.mine)).toBe(true)
  })

  it('ordnet die Chips nach Katalog, nicht nach Haeufigkeit', () => {
    // Eine Leiste, die bei jeder Reaktion die Plaetze tauscht, laesst den
    // Nutzer auf den falschen Chip klicken.
    const summary = aggregateReactions([
      { targetId: 'a', userId: 'u1', reaction: 'fire' },
      { targetId: 'a', userId: 'u2', reaction: 'fire' },
      { targetId: 'a', userId: 'u3', reaction: 'laugh' },
    ], null)
    expect(summary.a?.map(c => c.reaction)).toEqual(['laugh', 'fire'])
  })

  it('verwirft Unbekanntes still, statt einen Chip ohne Zeichen zu bauen', () => {
    const summary = aggregateReactions([
      { targetId: 'a', userId: 'u1', reaction: 'thumbsup' },
      { targetId: 'a', userId: 'u1', reaction: 'tada' },
    ], 'u1')
    expect(summary.a).toEqual([{ reaction: 'tada', count: 1, mine: true }])
  })

  it('beachtet einen gekuerzten Satz', () => {
    const summary = aggregateReactions(rows, 'u1', ['fire'])
    expect(summary.a).toEqual([{ reaction: 'fire', count: 1, mine: true }])
  })

  it('liefert fuer ein Ziel ohne Reaktionen gar keinen Eintrag', () => {
    expect(aggregateReactions([], 'u1')).toEqual({})
  })
})

describe('toggledChips — die optimistische Vorschau', () => {
  it('legt eine neue Reaktion an der Katalog-Position an', () => {
    const next = toggledChips([{ reaction: 'fire', count: 2, mine: false }], 'laugh')
    expect(next).toEqual([
      { reaction: 'laugh', count: 1, mine: true },
      { reaction: 'fire', count: 2, mine: false },
    ])
  })

  it('haengt sich an eine fremde Reaktion an', () => {
    const next = toggledChips([{ reaction: 'tada', count: 3, mine: false }], 'tada')
    expect(next).toEqual([{ reaction: 'tada', count: 4, mine: true }])
  })

  it('nimmt die eigene zurueck und laesst die fremden stehen', () => {
    const next = toggledChips([{ reaction: 'tada', count: 3, mine: true }], 'tada')
    expect(next).toEqual([{ reaction: 'tada', count: 2, mine: false }])
  })

  it('entfernt den Chip, wenn die eigene die letzte war', () => {
    expect(toggledChips([{ reaction: 'tada', count: 1, mine: true }], 'tada')).toEqual([])
  })

  it('fasst die Vorlage nicht an', () => {
    const before: ReactionCount[] = [{ reaction: 'tada', count: 1, mine: true }]
    toggledChips(before, 'tada')
    expect(before).toEqual([{ reaction: 'tada', count: 1, mine: true }])
  })
})

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
