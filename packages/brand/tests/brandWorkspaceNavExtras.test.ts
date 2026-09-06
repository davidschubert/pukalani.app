import { describe, expect, it } from 'vitest'
import type { BrandWorkspaceNavExtra } from '../shared/brandWorkspaceNav'
import { resolveWorkspaceNavExtras } from '../shared/brandWorkspaceNav'

/**
 * DER ERWEITERUNGSPUNKT DER WERKSTATT-LEISTE (MV1 M4,
 * docs/plans/BRAND-MARKTVERGLEICH.md §2.5).
 *
 * `brand` kennt kein Produkt, das auf ihm aufsetzt (CONCEPT A14) — es kennt
 * nur die FORM eines zusätzlichen Ebene-1-Eintrags. Diese Rechnung ist die
 * ganze Logik dahinter, und weil drei Seiten sie benutzen (Werkstatt,
 * Dokument, Markt), gehört sie festgenagelt: ein falsch gerechnetes `locked`
 * wäre ein Knopf, der in ein 409 führt, und ein falscher Zähler eine Zahl,
 * die niemand nachrechnen kann.
 */

const MARKET: BrandWorkspaceNavExtra = {
  key: 'market',
  labelKey: 'market.nav.market',
  icon: 'i-ph-compass',
  to: '/brand/:profileId/market',
  lockedUntil: 'pvm',
  counterKind: 'market',
}

describe('resolveWorkspaceNavExtras', () => {
  it('setzt die Profil-Id in die Adress-Vorlage ein', () => {
    const [entry] = resolveWorkspaceNavExtras([MARKET], {
      profileId: 'p1',
      doneStepKeys: ['pvm'],
      findings: [],
    })
    expect(entry?.to).toBe('/brand/p1/market')
    expect(entry?.icon).toBe('i-ph-compass')
  })

  it('sperrt, solange das genannte Kapitel nicht abgenommen ist', () => {
    const [locked] = resolveWorkspaceNavExtras([MARKET], {
      profileId: 'p1',
      doneStepKeys: ['context'],
      findings: [],
    })
    expect(locked?.locked).toBe(true)
  })

  it('GEGENPROBE: mit abgenommenem Kapitel ist er offen', () => {
    const [open] = resolveWorkspaceNavExtras([MARKET], {
      profileId: 'p1',
      doneStepKeys: ['context', 'pvm'],
      findings: [],
    })
    expect(open?.locked).toBe(false)
  })

  it('ohne `lockedUntil` ist ein Eintrag nie gesperrt', () => {
    const [entry] = resolveWorkspaceNavExtras([{ ...MARKET, lockedUntil: undefined }], {
      profileId: 'p1',
      doneStepKeys: [],
      findings: [],
    })
    expect(entry?.locked).toBe(false)
  })

  it('zählt NUR offene Befunde der genannten Art', () => {
    const [entry] = resolveWorkspaceNavExtras([MARKET], {
      profileId: 'p1',
      doneStepKeys: ['pvm'],
      findings: [
        { kind: 'market', status: 'open' },
        { kind: 'market', status: 'open' },
        // Entschieden — er ist Protokoll, keine Arbeit.
        { kind: 'market', status: 'dismissed' },
        // Andere Art — sie gehört an ihr Kapitel, nicht an diesen Eintrag.
        { kind: 'conflict', status: 'open' },
      ],
    })
    expect(entry?.count).toBe(2)
  })

  it('ohne `counterKind` gibt es keinen Zähler', () => {
    const [entry] = resolveWorkspaceNavExtras([{ ...MARKET, counterKind: undefined }], {
      profileId: 'p1',
      doneStepKeys: ['pvm'],
      findings: [{ kind: 'market', status: 'open' }],
    })
    expect(entry?.count).toBe(0)
  })

  it('eine halb ausgefüllte Zeile fällt still weg', () => {
    const broken = [
      { ...MARKET, key: '' },
      { ...MARKET, labelKey: '' },
      { ...MARKET, to: '' },
    ] as BrandWorkspaceNavExtra[]
    expect(resolveWorkspaceNavExtras(broken, {
      profileId: 'p1',
      doneStepKeys: ['pvm'],
      findings: [],
    })).toEqual([])
  })

  it('ohne Einträge ist die Leiste, was sie war', () => {
    expect(resolveWorkspaceNavExtras([], { profileId: 'p1', doneStepKeys: [], findings: [] }))
      .toEqual([])
  })
})
