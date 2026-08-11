import { describe, expect, it } from 'vitest'
import { FUNNEL_EVENTS } from '../shared/funnelEvents'

/**
 * DIESER TEST IST EIN VERTRAG MIT PLAUSIBLE, kein Typ-Test.
 *
 * Die Goals werden in der Plausible-Oberfläche von Hand auf den EXAKTEN Namen
 * angelegt (die CE hat keine Sites-API — docs/plans/ANALYTICS-V2.md). Wer einen
 * Namen hier ändert, macht damit ein bestehendes Goal still zur Null: es wird
 * weiter gemessen, nur unter einem Namen, den niemand auswertet. Der Test
 * nagelt die Namen deshalb wörtlich fest — er soll BRECHEN, wenn jemand
 * umbenennt, damit die Umbenennung in Plausible bewusst mitgezogen wird.
 */
describe('FUNNEL_EVENTS', () => {
  it('trägt genau die sieben in Plausible angelegten Namen', () => {
    expect([...FUNNEL_EVENTS]).toEqual([
      'funnel_cta_start',
      'funnel_cta_plan',
      'funnel_register_done',
      'funnel_gate_no_code',
      'funnel_code_redeemed',
      'funnel_site_created',
      'funnel_request_submitted',
    ])
  })

  it('vergibt jeden Namen genau einmal', () => {
    expect(new Set(FUNNEL_EVENTS).size).toBe(FUNNEL_EVENTS.length)
  })

  it('hält die Namensform, die Plausible ohne Maskierung filtern kann', () => {
    for (const name of FUNNEL_EVENTS) {
      expect(name).toMatch(/^funnel_[a-z_]+$/)
    }
  })
})
