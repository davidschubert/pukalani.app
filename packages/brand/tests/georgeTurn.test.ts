import { describe, expect, it } from 'vitest'
import {
  createGeorgeTurnScrubber,
  parseGeorgeTurn,
  stripGeorgeTurnMarkers,
} from '../server/utils/georgeTurn'

/**
 * DER ZUG-VERTRAG (george-a-4) — vier Aussagen, die ohne Beweis Glaubenssache
 * wären und deren Bruch man erst im Brand-Dokument sähe:
 *
 *  1. Der FELDWERT enthält keinen Marker. Ein „ASK: trifft das?" im Slot stünde
 *     wörtlich im fertigen Brand-Dokument.
 *  2. Der CHAT-Zug enthält die Rahmung — sonst war der ganze B2-Umbau umsonst
 *     und die Sprechblase zeigt wieder einen nackten Entwurf.
 *  3. OHNE Marker ist alles wie vorher (`george-a-3`). Das ist der
 *     Sicherheitsgurt: der schlimmste Fall dieses Umbaus ist der Stand von
 *     gestern, nie ein zerschnittener Entwurf.
 *  4. Der Strom-Putzer liefert ZERRISSEN dasselbe wie am Stück. Deltas kommen
 *     an beliebiger Stelle zerteilt an, und ein Marker, der über zwei Chunks
 *     fällt, ist der Normalfall, nicht die Ausnahme.
 */

const FRAMED = [
  'BASIS: Aus eurem Startbogen und der Antwort zur Ursprungsgeschichte.',
  'DRAFT:',
  'Wir rösten Kaffee in kleinen Mengen für Cafés auf Maui.',
  'Jede Charge wird von Hand abgeschmeckt.',
  'ASK: Trifft das, oder fehlt euch etwas Wesentliches?',
].join('\n')

describe('parseGeorgeTurn — Entwurf', () => {
  it('trennt Feldwert und Chat-Zug', () => {
    const turn = parseGeorgeTurn(FRAMED)
    expect(turn.outcome).toBe('draft')
    expect(turn.draft).toBe(
      'Wir rösten Kaffee in kleinen Mengen für Cafés auf Maui.\nJede Charge wird von Hand abgeschmeckt.',
    )
    // Der Zug rahmt: Basis, Entwurf, genau eine Frage.
    expect(turn.message).toBe(
      'Aus eurem Startbogen und der Antwort zur Ursprungsgeschichte.\n\n'
      + 'Wir rösten Kaffee in kleinen Mengen für Cafés auf Maui.\nJede Charge wird von Hand abgeschmeckt.\n\n'
      + 'Trifft das, oder fehlt euch etwas Wesentliches?',
    )
  })

  it('KEIN MARKER LANDET IM FELDWERT', () => {
    const turn = parseGeorgeTurn(FRAMED)
    for (const marker of ['BASIS:', 'DRAFT:', 'ASK:', 'QUESTION:']) {
      expect(turn.draft).not.toContain(marker)
      expect(turn.message).not.toContain(marker)
    }
  })

  it('nimmt auch Text, der direkt hinter DRAFT: steht', () => {
    expect(parseGeorgeTurn('BASIS: kurz\nDRAFT: Ein Satz.\nASK: passt?').draft).toBe('Ein Satz.')
  })

  it('hält eine mehrzeilige Liste zusammen — auch mit Bindestrichen', () => {
    const turn = parseGeorgeTurn([
      'BASIS: Aus eurer Website.',
      'DRAFT:',
      '- Kona Roasters - strong: Reichweite - weak: austauschbar',
      '- Maui Beans - assumption, please verify: kleine Röstmenge',
      'ASK: Fehlt jemand?',
    ].join('\n'))
    expect(turn.draft.split('\n')).toHaveLength(2)
    expect(turn.draft).toContain('assumption, please verify')
  })

  it('kommt ohne BASIS und ohne ASK aus — dann rahmt eben nichts', () => {
    const turn = parseGeorgeTurn('DRAFT:\nNur der Wert.')
    expect(turn.draft).toBe('Nur der Wert.')
    expect(turn.message).toBe('Nur der Wert.')
  })
})

describe('parseGeorgeTurn — Rückfrage (B3)', () => {
  it('erkennt QUESTION: und lässt den Feldwert LEER', () => {
    const turn = parseGeorgeTurn('QUESTION: Wen von euren Wettbewerbern nennt ihr selbst zuerst?')
    expect(turn).toEqual({
      outcome: 'question',
      draft: '',
      message: 'Wen von euren Wettbewerbern nennt ihr selbst zuerst?',
    })
  })

  it('nimmt auch eine mehrzeilige Rückfrage mit', () => {
    const turn = parseGeorgeTurn('QUESTION: Zwei Namen reichen mir.\nWelche fallen euch zuerst ein?')
    expect(turn.outcome).toBe('question')
    expect(turn.message).toBe('Zwei Namen reichen mir.\nWelche fallen euch zuerst ein?')
  })

  it('EIN ENTWURF SCHLÄGT EINE FRAGE: schickt das Modell beides, gilt der Entwurf', () => {
    // Die verlässlichere Auskunft gewinnt — eine Frage neben einem fertigen
    // Entwurf hiesse sonst, den Entwurf wegzuwerfen, für den bezahlt wurde.
    const turn = parseGeorgeTurn('QUESTION: unsicher?\nDRAFT:\nTrotzdem ein Wert.')
    expect(turn.outcome).toBe('draft')
    expect(turn.draft).toBe('Trotzdem ein Wert.')
  })
})

describe('parseGeorgeTurn — der Rückfall auf george-a-3', () => {
  it('OHNE MARKER ist der ganze Text Entwurf UND Zug', () => {
    const turn = parseGeorgeTurn('Wir rösten Kaffee in kleinen Mengen.')
    expect(turn).toEqual({
      outcome: 'draft',
      draft: 'Wir rösten Kaffee in kleinen Mengen.',
      message: 'Wir rösten Kaffee in kleinen Mengen.',
    })
  })

  it('leerer Text bleibt leer — die Route macht daraus `empty_result`', () => {
    expect(parseGeorgeTurn('   \n  ')).toEqual({ outcome: 'draft', draft: '', message: '' })
  })

  it('ein Marker MITTEN im Satz ist keiner', () => {
    const turn = parseGeorgeTurn('Wir fragen: ASK: ist ein Wort in diesem Satz.')
    expect(turn.draft).toBe('Wir fragen: ASK: ist ein Wort in diesem Satz.')
  })

  it('versteht auch CRLF — Windows-Zeilenenden kommen von echten Anbietern', () => {
    expect(parseGeorgeTurn('BASIS: x\r\nDRAFT:\r\nWert\r\nASK: ja?').draft).toBe('Wert')
  })
})

describe('stripGeorgeTurnMarkers', () => {
  it('nimmt die Etiketten weg und lässt die DRAFT-Trennzeile ganz verschwinden', () => {
    expect(stripGeorgeTurnMarkers(FRAMED)).toBe([
      'Aus eurem Startbogen und der Antwort zur Ursprungsgeschichte.',
      'Wir rösten Kaffee in kleinen Mengen für Cafés auf Maui.',
      'Jede Charge wird von Hand abgeschmeckt.',
      'Trifft das, oder fehlt euch etwas Wesentliches?',
    ].join('\n'))
  })

  it('lässt Text ohne Marker unangetastet', () => {
    expect(stripGeorgeTurnMarkers('einfach nur Text\nzweite Zeile')).toBe('einfach nur Text\nzweite Zeile')
  })
})

/**
 * DER STROM-PUTZER. Gemessen wird gegen die Fassung am Stück — und zwar mit
 * ZUFÄLLIGEN Schnitten, weil ein Beweis mit hübschen Grenzen genau den Fall
 * nicht trifft, der in echt vorkommt.
 */
function stream(text: string, cut: (rest: string) => number): string {
  const scrub = createGeorgeTurnScrubber()
  let out = ''
  let rest = text
  while (rest.length > 0) {
    const size = Math.max(1, Math.min(cut(rest), rest.length))
    out += scrub(rest.slice(0, size))
    rest = rest.slice(size)
  }
  return out
}

describe('createGeorgeTurnScrubber', () => {
  it('liefert BUCHSTABENWEISE dasselbe wie am Stück', () => {
    expect(stream(FRAMED, () => 1)).toBe(stripGeorgeTurnMarkers(FRAMED))
  })

  it('liefert bei ZUFÄLLIGEN Schnitten dasselbe — 200 Läufe', () => {
    const expected = stripGeorgeTurnMarkers(FRAMED)
    for (let run = 0; run < 200; run += 1) {
      expect(stream(FRAMED, () => 1 + Math.floor(Math.random() * 7))).toBe(expected)
    }
  })

  it('ZEIGT ZU JEDEM ZEITPUNKT NUR EINEN PRÄFIX DES ENDTEXTS — und nie ein Etikett', () => {
    // Das ist die eigentliche Aussage: ein Delta kennt kein Zurück. Was einmal
    // in der Sprechblase stand, muss dort stehen bleiben dürfen — sonst
    // flackert der Text, sobald ein Marker vollständig wird.
    const expected = stripGeorgeTurnMarkers(FRAMED)
    const scrub = createGeorgeTurnScrubber()
    let shown = ''
    for (const letter of [...FRAMED]) {
      shown += scrub(letter)
      expect(expected.startsWith(shown), shown).toBe(true)
      expect(shown).not.toMatch(/(^|\n)(QUESTION:|BASIS:|DRAFT:|ASK:)/)
    }
    expect(shown).toBe(expected)
  })

  it('putzt auch die Rückfrage — der Marker gehört nicht in den Verlauf', () => {
    const text = 'QUESTION: Wen nennt ihr selbst zuerst?'
    expect(stream(text, () => 3)).toBe('Wen nennt ihr selbst zuerst?')
  })

  it('hält einen Text OHNE Marker nicht auf', () => {
    expect(stream('Wir rösten Kaffee.\nIn kleinen Mengen.', () => 2))
      .toBe('Wir rösten Kaffee.\nIn kleinen Mengen.')
  })
})
