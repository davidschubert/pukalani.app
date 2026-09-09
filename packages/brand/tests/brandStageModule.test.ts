import { describe, expect, it } from 'vitest'
import {
  type BrandStageActiveSession,
  brandStageAwaitsDraftAnswer,
  brandStageClaim,
} from '../shared/brandStageModule'
import { slotById, slotIsConfirmable, slotsForStep } from '../shared/slotRegistry'

/**
 * WELCHES MODUL ZEIGT DIE BÜHNE FÜR DIE AKTIVE SESSION? (Kailua-Befund 5,
 * Davids „Weg B", 2026-09-08).
 *
 * ── WAS HIER BEWIESEN WIRD, UND WARUM ES EINE EIGENE DATEI IST ────────────
 * Der Befund sass in der NAHT zwischen drei Ausdrücken der Werkstatt-Seite
 * (`activeAwaitsConfirm`, `nextSlot`, `stageModule`): jede Zeile für sich war
 * plausibel, zusammen zeigten sie die Frage eines FREMDEN Feldes. Genau das
 * ist der Fall, den eine pure Regel prüfbar macht — und die Gegenprobe
 * daneben beweist, dass die Katalog-Sessions ihr Verhalten behalten.
 */

function session(overrides: Partial<BrandStageActiveSession> = {}): BrandStageActiveSession {
  return {
    id: 'a.pitch',
    type: 'derivation',
    confirmable: true,
    generatable: true,
    canGenerate: true,
    hasValue: false,
    confirmed: false,
    ...overrides,
  }
}

describe('Die Entwurfs-Session beansprucht ihre eigene Bühne (Weg B)', () => {
  /**
   * DER BEFUND, ALS TEST. `a.pitch` ist `derivation` und steht in `context`
   * VOR jeder Frage — beim Betreten des Kapitels ist es die aktive Session.
   * Vorher zeigte die Bühne trotzdem die erste offene FRAGE (`a.origin`), und
   * der Entwurfs-Knopf des Feldes, auf dem der Mensch sass, war nirgends.
   */
  it('ein LEERES Entwurfs-Feld bekommt sein Entwurfs-Modul — und zwar sein eigenes', () => {
    expect(brandStageClaim(session())).toEqual({ module: 'draft', slotId: 'a.pitch' })
  })

  it('und wartet dann auf die Antwort, aus der der Entwurf entsteht', () => {
    const claim = brandStageClaim(session())
    expect(brandStageAwaitsDraftAnswer(claim, false)).toBe(true)
    // Steht schon ein Entwurf da, ist „Nochmal, mit Hinweis" der Weg — zwei
    // offene Eingabefelder für dieselbe Sache wären zwei Wahrheiten.
    expect(brandStageAwaitsDraftAnswer(claim, true)).toBe(false)
  })

  /**
   * DAS BEREITSCHAFTS-GATE NIMMT DIE BÜHNE NICHT WEG (bewusst `generatable`
   * und nicht `canGenerate`): fehlt Material, gehört GENAU DIESER Satz auf die
   * Karte (`showReadinessNote`) — und nicht die Frage eines fremden Feldes.
   */
  it('auch ohne genug Material bleibt das Feld auf der Bühne', () => {
    expect(brandStageClaim(session({ canGenerate: false }))).toEqual({
      module: 'draft',
      slotId: 'a.pitch',
    })
  })

  it('mit Wert und ohne Entwurfs-Weg bleibt die reine Bestätigungs-Karte (D2c, unverändert)', () => {
    expect(brandStageClaim(session({ hasValue: true, generatable: false, canGenerate: false }))).toEqual({
      module: 'confirm',
      slotId: 'a.pitch',
    })
  })

  it('mit Wert und Entwurfs-Weg: das Entwurfs-Modul (D2c, unverändert)', () => {
    expect(brandStageClaim(session({ hasValue: true }))).toEqual({ module: 'draft', slotId: 'a.pitch' })
  })

  /**
   * DIE DREI FÄLLE, IN DENEN DIE BÜHNE FREI BLEIBT — jeder mit eigenem Grund,
   * und keiner davon ist „Geschmack".
   */
  it('gibt die Bühne frei, wo sie nichts anzubieten hätte', () => {
    // Bestätigt: dort ist „Korrigieren" die einzige Tür, und die hängt an der
    // Karte, nicht an der Bühne.
    expect(brandStageClaim(session({ hasValue: true, confirmed: true }))).toBeNull()
    // Nicht bestätigbar (`d.pairs`, Audit A4): ein Knopf ohne Wirkung.
    expect(brandStageClaim(session({ type: 'special', confirmable: false }))).toBeNull()
    // Leer UND nicht entwerfbar: die deterministisch gerechneten Felder der
    // Design-Kapitel werden von den Panels DARÜBER gefüllt.
    expect(brandStageClaim(session({ generatable: false, canGenerate: false }))).toBeNull()
    // Und ohne aktive Session gibt es nichts zu beanspruchen.
    expect(brandStageClaim(null)).toBeNull()
  })
})

describe('Gegenprobe: die Katalog-Sessions verhalten sich unverändert', () => {
  it('eine offene FRAGE zeigt ihr Antwort-Modul', () => {
    expect(brandStageClaim(session({ id: 'a.origin', type: 'question', generatable: false, canGenerate: false })))
      .toEqual({ module: 'answer', slotId: 'a.origin' })
  })

  it('eine offene AUSWAHL zeigt ihr Options-Modul', () => {
    expect(brandStageClaim(session({ id: 'a.facts', type: 'choice', generatable: false, canGenerate: false })))
      .toEqual({ module: 'options', slotId: 'a.facts' })
  })

  /**
   * BEANTWORTET HEISST: DIE BÜHNE GEHT WEITER. Das ist die Regel von BW2 3c-i
   * und der Grund, warum eine beantwortete Frage nicht stehen bleibt — sonst
   * käme man nach der eigenen Antwort nie zur nächsten.
   */
  it('eine beantwortete Frage gibt die Bühne wieder frei', () => {
    expect(brandStageClaim(session({ id: 'a.origin', type: 'question', hasValue: true }))).toBeNull()
    expect(brandStageClaim(session({ id: 'a.facts', type: 'choice', hasValue: true }))).toBeNull()
  })
})

/**
 * DER BEFUND AN DER ECHTEN REGISTRY — ohne sie wäre der Test oben nur eine
 * Rechnung über erfundenen Zahlen. Im Kapitel `context` stehen VIER
 * Entwurfs-Sessions vor der ersten Frage; genau diese Reihenfolge liess die
 * Bühne auf `a.origin` zeigen, während die Session `a.pitch` hiess.
 */
describe('Die Registry stützt den Befund', () => {
  it('das Kapitel `context` beginnt mit vier Feldern, die niemand fragt', () => {
    const order = slotsForStep('context')
    const leading = order.slice(0, 4).map(slot => slot.id)
    expect(leading).toEqual(['a.pitch', 'a.category', 'a.competitors', 'a.audienceSketch'])
    for (const id of leading) {
      const slot = slotById(id)!
      expect(slot.type === 'question' || slot.type === 'choice').toBe(false)
      // Bestätigbar sind sie alle — sie zählen im Abschluss-Gate mit.
      expect(slotIsConfirmable(slot)).toBe(true)
    }
    // Die erste echte Frage steht dahinter — sie war die fremde Bühnen-Frage.
    expect(order.find(slot => slot.type === 'question')?.id).toBe('a.origin')
  })

  it('und jedes dieser vier Felder hat einen Knopf, der es füllen kann', () => {
    for (const id of ['a.pitch', 'a.category', 'a.competitors', 'a.audienceSketch']) {
      const slot = slotById(id)!
      expect(slot.generator).not.toBe('none')
      expect(brandStageClaim({
        id: slot.id,
        type: slot.type,
        confirmable: slotIsConfirmable(slot),
        generatable: slot.generator !== 'none',
        canGenerate: true,
        hasValue: false,
        confirmed: false,
      })).toEqual({ module: 'draft', slotId: slot.id })
    }
  })
})
