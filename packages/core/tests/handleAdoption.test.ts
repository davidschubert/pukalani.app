import { describe, expect, it } from 'vitest'
import { planHandleAdoption, type AdoptionSourceRow } from '../shared/handleAdoption'

/**
 * DIE ÜBERNAHME-REGEL (AH-7) — „wer zuerst kam, behält".
 *
 * Die Regel entscheidet EINMAL und unwiderruflich, wem ein Name gehört; sie
 * läuft in einer Migration, wo niemand zusieht. Deshalb steht hier jeder Fall,
 * den Davids Satz offen lässt: zwei Konten mit demselben Namen, ein Konto mit
 * mehreren Namen, Historien-Zeilen, Gleichstand.
 */

function row(partial: Partial<AdoptionSourceRow> & { userId: string, handleLower: string, createdAt: string }): AdoptionSourceRow {
  return {
    handle: partial.handleLower,
    status: 'active',
    communityId: 'siteAAA',
    ...partial,
  }
}

describe('planHandleAdoption', () => {
  it('einfacher Fall: ein Konto, ein Name', () => {
    const plan = planHandleAdoption([row({ userId: 'u1', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z' })])
    expect(plan.candidates).toEqual([{ userId: 'u1', handle: 'david', handleLower: 'david', communityIds: ['siteAAA'] }])
    expect(plan.collisions).toEqual([])
  })

  it('KOLLISION: der Frühere behält, der Spätere geht LEER aus (kein @david2)', () => {
    const plan = planHandleAdoption([
      row({ userId: 'spaet', handleLower: 'david', createdAt: '2026-05-01T00:00:00.000Z', communityId: 'siteBBB' }),
      row({ userId: 'frueh', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z' }),
    ])
    expect(plan.candidates.map(c => c.userId)).toEqual(['frueh'])
    expect(plan.collisions).toEqual([{ userId: 'spaet', handleLower: 'david' }])
    // Ausdrücklich: kein Ersatzname wurde erfunden.
    expect(plan.candidates.map(c => c.handleLower)).not.toContain('david2')
  })

  it('mehrere Namen desselben Kontos: der ÄLTESTE zieht um, die anderen nicht', () => {
    const plan = planHandleAdoption([
      row({ userId: 'u1', handleLower: 'dave', createdAt: '2026-03-01T00:00:00.000Z', communityId: 'siteBBB' }),
      row({ userId: 'u1', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z', communityId: 'siteAAA' }),
    ])
    expect(plan.candidates).toHaveLength(1)
    expect(plan.candidates[0]?.handleLower).toBe('david')
    // Beide Communities sehen ihn danach — sonst stünde ihr Erwähnungs-Menü leer.
    expect(plan.candidates[0]?.communityIds).toEqual(['siteAAA', 'siteBBB'])
  })

  it('das Konto ist die Einheit, nicht die Zeile: ein zweiter freier Name bleibt liegen', () => {
    // u1s ältester Name ist vergeben (an u0) — u1 bekommt NICHTS, obwohl sein
    // zweiter Name frei wäre. Genau so lautet die Vorgabe: ein Kandidat je Konto.
    const plan = planHandleAdoption([
      row({ userId: 'u0', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z' }),
      row({ userId: 'u1', handleLower: 'david', createdAt: '2026-02-01T00:00:00.000Z', communityId: 'siteBBB' }),
      row({ userId: 'u1', handleLower: 'dave', createdAt: '2026-03-01T00:00:00.000Z', communityId: 'siteCCC' }),
    ])
    expect(plan.candidates.map(c => c.userId)).toEqual(['u0'])
    expect(plan.collisions).toEqual([{ userId: 'u1', handleLower: 'david' }])
  })

  it('HISTORIEN-Zeilen ziehen nicht um — die Vergangenheit nimmt niemandem einen Namen weg', () => {
    const plan = planHandleAdoption([
      row({ userId: 'u1', handleLower: 'altername', createdAt: '2026-01-01T00:00:00.000Z', status: 'former' }),
      row({ userId: 'u1', handleLower: 'neuername', createdAt: '2026-02-01T00:00:00.000Z' }),
      row({ userId: 'u2', handleLower: 'altername', createdAt: '2026-03-01T00:00:00.000Z', communityId: 'siteBBB' }),
    ])
    expect(plan.candidates.map(c => c.handleLower).sort()).toEqual(['altername', 'neuername'])
    // u2 bekommt `altername`, obwohl u1 ihn früher trug — im Alt-Bestand löst
    // die alte Erwähnung weiterhin auf u1 auf (Fallback-Kette).
    expect(plan.candidates.find(c => c.handleLower === 'altername')?.userId).toBe('u2')
  })

  it('behält die vom Menschen gewählte SCHREIBWEISE', () => {
    const plan = planHandleAdoption([
      row({ userId: 'u1', handleLower: 'davidschubert', handle: 'DavidSchubert', createdAt: '2026-01-01T00:00:00.000Z' }),
    ])
    expect(plan.candidates[0]?.handle).toBe('DavidSchubert')
    expect(plan.candidates[0]?.handleLower).toBe('davidschubert')
  })

  it('GLEICHSTAND ist reproduzierbar (Name, dann Konto-Id) — zwei Läufe, ein Ergebnis', () => {
    const rows = [
      row({ userId: 'ub', handleLower: 'b', createdAt: '2026-01-01T00:00:00.000Z' }),
      row({ userId: 'ua', handleLower: 'a', createdAt: '2026-01-01T00:00:00.000Z' }),
    ]
    expect(planHandleAdoption(rows).candidates.map(c => c.userId)).toEqual(['ua', 'ub'])
    expect(planHandleAdoption([...rows].reverse()).candidates.map(c => c.userId)).toEqual(['ua', 'ub'])
  })

  it('ein unlesbares Datum verschafft keinen Vorrang — es landet hinten', () => {
    const plan = planHandleAdoption([
      row({ userId: 'kaputt', handleLower: 'david', createdAt: 'nicht-lesbar' }),
      row({ userId: 'echt', handleLower: 'david', createdAt: '2026-09-01T00:00:00.000Z', communityId: 'siteBBB' }),
    ])
    expect(plan.candidates.map(c => c.userId)).toEqual(['echt'])
  })

  it('Silo (communityId leer): Kandidat ohne Publikums-Liste', () => {
    const plan = planHandleAdoption([
      row({ userId: 'u1', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z', communityId: '' }),
    ])
    expect(plan.candidates[0]?.communityIds).toEqual([])
  })

  it('ignoriert unbrauchbare Zeilen (ohne Konto oder ohne Namen)', () => {
    const plan = planHandleAdoption([
      row({ userId: '', handleLower: 'david', createdAt: '2026-01-01T00:00:00.000Z' }),
      row({ userId: 'u1', handleLower: '', createdAt: '2026-01-01T00:00:00.000Z' }),
    ])
    expect(plan.candidates).toEqual([])
  })
})
