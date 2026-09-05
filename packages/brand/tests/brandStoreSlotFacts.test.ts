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
 *
 * SEIT PAKET 3b REIST DER WERT MIT — und zwar in der SERVER-Rangfolge
 * (`brandSlotStoredValue`: bestätigt schlägt Entwurf), nicht in der
 * Anzeige-Rangfolge daneben. Beides steht bewusst in EINEM Objekt und bleibt
 * getrennt: `hasValue` beantwortet „bewegt sich der Balken?", `value` ist der
 * Stoff, aus dem `computeSourcesHash` rechnet. Wer sie gleichsetzt, bekommt
 * entweder den alten Fortschritts-Fehler zurück oder einen Hash, der den
 * ENTWURF für die Quelle hält.
 */
describe('toSlotFacts', () => {
  it('ein geleerter Entwurf zählt NICHT als gefüllt (Anzeige-Rangfolge)', () => {
    const facts = toSlotFacts({
      'b.mission': { firstDraft: 'x', latestDraft: '' },
    })
    // Der WERT bleibt trotzdem der gespeicherte (Server-Rangfolge) — sonst
    // rechnete der Hash mit einer leeren Quelle, sobald jemand ein Feld leert.
    expect(facts['b.mission']).toEqual({ hasValue: false, confirmed: false, value: 'x' })
  })

  it('Entwurf, Alt-Entwurf und reine Bestätigung zählen weiter', () => {
    const facts = toSlotFacts({
      draft: { latestDraft: 'neu' },
      first: { firstDraft: 'alt' },
      confirmedOnly: { confirmed: 'zugestimmt' },
    })
    expect(facts.draft).toEqual({ hasValue: true, confirmed: false, value: 'neu' })
    expect(facts.first).toEqual({ hasValue: true, confirmed: false, value: 'alt' })
    expect(facts.confirmedOnly).toEqual({ hasValue: true, confirmed: true, value: 'zugestimmt' })
  })

  it('Gegenprobe: leere Bestätigung ist weder Wert noch Zustimmung', () => {
    const facts = toSlotFacts({ empty: { confirmed: '' } })
    expect(facts.empty).toEqual({ hasValue: false, confirmed: false, value: '' })
  })
})

describe('toSlotFacts — die Flags der Finalen Abnahme (Paket 3b)', () => {
  it('reicht `accepted`/`deferred` NUR durch, wo sie gesetzt sind', () => {
    const facts = toSlotFacts({
      taken: { confirmed: 'ja', accepted: true },
      later: { deferred: true },
      plain: { latestDraft: 'x' },
    })
    expect(facts.taken).toMatchObject({ confirmed: true, accepted: true })
    expect(facts.later).toMatchObject({ deferred: true })
    // Ein leeres Flag ist keine Aussage — und ein `false` an 68 Feldern wäre
    // Rauschen in jeder Rechnung.
    expect(facts.plain).not.toHaveProperty('accepted')
    expect(facts.plain).not.toHaveProperty('deferred')
    expect(facts.taken).not.toHaveProperty('deferred')
  })

  it('trägt den gespeicherten `sourcesHash` weiter — er ist die Quelle von `stale`', () => {
    const facts = toSlotFacts({ hashed: { confirmed: 'ja', sourcesHash: 'abc' } })
    expect(facts.hashed).toMatchObject({ sourcesHash: 'abc' })
    // Ohne gespeicherten Hash gilt die Session als AKTUELL (Migrationsvertrag).
    expect(toSlotFacts({ old: { confirmed: 'ja' } }).old).not.toHaveProperty('sourcesHash')
  })
})
