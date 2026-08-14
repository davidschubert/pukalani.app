import { describe, expect, it } from 'vitest'
import {
  MAX_TOPIC_LINKS_PER_CONTENT,
  extractTopicLinkCandidates,
  extractTopicLinkIds,
  topicLinkHref,
  topicLinkToken,
  topicLinkTokensFor,
} from '../shared/topicLinks'

/**
 * DIE ERKENNUNGS-REGEL DER THEMEN-VERLINKUNG (F57).
 *
 * Jede Zusage aus dem Kopf von `shared/topicLinks.ts` hat hier ihren Test —
 * besonders die NEGATIVEN. Eine Regel, die zu viel erkennt, macht aus einer
 * Ticket-Nummer einen Verweis und aus einem URL-Anker einen Rückverweis in ein
 * fremdes Thema; das fällt niemandem auf, bis es jemandem auffällt.
 */

/** Eine Id in der Form, die Appwrites `ID.unique()` liefert: 20 Zeichen hex. */
const ID_A = '68a1b2c3d4e5f6a7b8c9'
const ID_B = '77f0e1d2c3b4a5968778'

describe('topicLinkToken', () => {
  it('bildet Id plus lesbare Deko', () => {
    expect(topicLinkToken(ID_A, 'polipoli-open-yet')).toBe(`#${ID_A}-polipoli-open-yet`)
  })

  it('kommt ohne Deko aus', () => {
    expect(topicLinkToken(ID_A)).toBe(`#${ID_A}`)
    expect(topicLinkToken(ID_A, '')).toBe(`#${ID_A}`)
  })
})

describe('extractTopicLinkCandidates — was erkannt wird', () => {
  it('erkennt den Token mit Deko und liefert Token UND Id getrennt', () => {
    const found = extractTopicLinkCandidates(`Siehe #${ID_A}-mein-thema dazu.`)
    expect(found).toEqual([{ token: `#${ID_A}-mein-thema`, id: ID_A }])
  })

  it('erkennt den Token ohne Deko', () => {
    expect(extractTopicLinkIds(`Siehe #${ID_A} dazu.`)).toEqual([ID_A])
  })

  it('erkennt mehrere Verweise in der Reihenfolge des Auftretens', () => {
    expect(extractTopicLinkIds(`#${ID_B}-b und #${ID_A}-a`)).toEqual([ID_B, ID_A])
  })

  it('erkennt einen Verweis am Zeilenanfang', () => {
    expect(extractTopicLinkIds(`#${ID_A}-thema ist der Anfang`)).toEqual([ID_A])
  })

  it('erkennt einen Verweis in Fettschrift und in einer Liste', () => {
    expect(extractTopicLinkIds(`**#${ID_A}-fett**`)).toEqual([ID_A])
    expect(extractTopicLinkIds(`- #${ID_A}-punkt`)).toEqual([ID_A])
  })

  it('erkennt einen Verweis im Zitat (Zitieren ist eine gebaute Funktion)', () => {
    expect(extractTopicLinkIds(`> vgl. #${ID_A}-zitiert`)).toEqual([ID_A])
  })

  it('meldet dieselbe Id nur EINMAL, auch bei zwei Schreibweisen', () => {
    const found = extractTopicLinkIds(`#${ID_A}-alt und nochmal #${ID_A}-neu`)
    expect(found).toEqual([ID_A])
  })

  it('deckelt die Anzahl', () => {
    const many = Array.from({ length: 25 }, (_, i) => `#${String(i).padStart(2, '0')}b2c3d4e5f6a7b8c9`).join(' ')
    expect(extractTopicLinkIds(many)).toHaveLength(MAX_TOPIC_LINKS_PER_CONTENT)
  })
})

describe('extractTopicLinkCandidates — was BEWUSST nicht erkannt wird', () => {
  it('ignoriert Alltags-Rauten: Hausnummer, Jahreszahl, Ticket-Nummer', () => {
    expect(extractTopicLinkIds('Zimmer #42, Jahr #2026, Ticket #1234')).toEqual([])
  })

  it('ignoriert eine Überschrift', () => {
    expect(extractTopicLinkIds(`## Überschrift ${ID_A}`)).toEqual([])
  })

  it('ignoriert eine doppelte Raute', () => {
    expect(extractTopicLinkIds(`##${ID_A}-thema`)).toEqual([])
  })

  it('ignoriert den Anker einer URL im Fliesstext', () => {
    expect(extractTopicLinkIds(`https://example.com/seite#${ID_A}`)).toEqual([])
  })

  it('ignoriert ein Link-ZIEL — dort steht kein Text, sondern ein href', () => {
    expect(extractTopicLinkIds(`[Titel](/seite#${ID_A}-thema)`)).toEqual([])
  })

  it('ignoriert einen Verweis im Code-Span', () => {
    expect(extractTopicLinkIds(`Schreib \`#${ID_A}-thema\` hin`)).toEqual([])
  })

  it('ignoriert einen Verweis im Codeblock', () => {
    expect(extractTopicLinkIds(`\`\`\`\n#${ID_A}-thema\n\`\`\``)).toEqual([])
  })

  it('ignoriert eine Id mit Trennzeichen — der Willkommens-Beitrag (wp-…)', () => {
    // Begründung im Kopf: mit erlaubtem `-` in der Id waere `#<id>-<deko>`
    // nicht mehr eindeutig zerlegbar. Der Willkommens-Beitrag ist ohnehin ein
    // Feed-Beitrag ohne Kategorie und damit nie ein Verweisziel.
    expect(extractTopicLinkIds('#wp-t-abc123def456ghi789')).toEqual([])
  })

  it('ignoriert eine zu kurze Id', () => {
    expect(extractTopicLinkIds('#abc123def456')).toEqual([])
  })

  it('ignoriert eine Raute mitten im Wort', () => {
    expect(extractTopicLinkIds(`foo#${ID_A}`)).toEqual([])
  })

  it('erkennt nichts in einem Text ohne Raute', () => {
    expect(extractTopicLinkIds('Ein ganz gewöhnlicher Beitrag.')).toEqual([])
  })
})

describe('extractTopicLinkCandidates — Zusammenspiel mit Erwähnungen', () => {
  it('lässt Erwähnungen unberührt und findet den Verweis daneben', () => {
    const body = `@erika schau mal auf #${ID_A}-thema`
    expect(extractTopicLinkIds(body)).toEqual([ID_A])
  })

  it('macht aus einer E-Mail-Adresse keinen Verweis', () => {
    expect(extractTopicLinkIds('kontakt@firma.de')).toEqual([])
  })
})

describe('topicLinkTokensFor — jede Schreibweise für den Renderer', () => {
  it('behält BEIDE Schreibweisen derselben Id', () => {
    const map = topicLinkTokensFor(`#${ID_A}-alt und #${ID_A}-neu`)
    expect(map.get(ID_A)).toEqual([`#${ID_A}-alt`, `#${ID_A}-neu`])
  })

  it('meldet denselben Token nicht doppelt', () => {
    const map = topicLinkTokensFor(`#${ID_A}-x und #${ID_A}-x`)
    expect(map.get(ID_A)).toEqual([`#${ID_A}-x`])
  })

  it('ist leer, wo die Erkennungs-Regel nichts findet', () => {
    expect(topicLinkTokensFor('Zimmer #42').size).toBe(0)
  })
})

describe('topicLinkHref', () => {
  it('baut denselben Pfad wie jeder andere Themen-Link', () => {
    expect(topicLinkHref('pukalani', ID_A, 'mein-thema')).toBe(`/discussions/pukalani/${ID_A}/mein-thema`)
  })
})
