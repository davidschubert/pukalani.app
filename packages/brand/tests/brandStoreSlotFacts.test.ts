import { describe, expect, it } from 'vitest'
import { toSlotFacts } from '../server/utils/brandStore'

/**
 * `toSlotFacts` MUSS rechnen wie die Anzeige (`brandSlotDisplayValue`:
 * latestDraft ?? firstDraft ?? confirmed) — nicht „gab es je einen Entwurf".
 *
 * Der Fall, der das erzwingt (live erwischt 2026-09-03, `b.mission`): ein
 * GELEERTES Feld (latestDraft `''`, firstDraft noch mit Text) zählte über den
 * firstDraft-Fallback als gefüllt. Die Journey (Server) meldete den Baustein
 * 10/10, die Live-Rechnung des offenen Bausteins (Client, aus dem Sichtbaren)
 * 9/10 — und der „Gesamtfortschritt" zeigte je nach Seite 20/59 oder 19/59.
 */
describe('toSlotFacts', () => {
  it('ein geleerter Entwurf zählt NICHT als gefüllt (Anzeige-Rangfolge)', () => {
    const facts = toSlotFacts({
      'b.mission': { firstDraft: 'x', latestDraft: '' },
    })
    expect(facts['b.mission']).toEqual({ hasValue: false, confirmed: false })
  })

  it('Entwurf, Alt-Entwurf und reine Bestätigung zählen weiter', () => {
    const facts = toSlotFacts({
      draft: { latestDraft: 'neu' },
      first: { firstDraft: 'alt' },
      confirmedOnly: { confirmed: 'zugestimmt' },
    })
    expect(facts.draft).toEqual({ hasValue: true, confirmed: false })
    expect(facts.first).toEqual({ hasValue: true, confirmed: false })
    expect(facts.confirmedOnly).toEqual({ hasValue: true, confirmed: true })
  })

  it('Gegenprobe: leere Bestätigung ist weder Wert noch Zustimmung', () => {
    const facts = toSlotFacts({ empty: { confirmed: '' } })
    expect(facts.empty).toEqual({ hasValue: false, confirmed: false })
  })
})
