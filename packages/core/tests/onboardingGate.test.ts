import { describe, expect, it } from 'vitest'
import {
  FAILSAFE_ONBOARDING_GATE,
  onboardingInviteRequired,
  resolveOnboardingGate,
} from '../shared/onboardingGate'
import { resolveAuthNotices, type PukalaniAuthNoticeConfig } from '../shared/types/auth-notice'

/**
 * Der Tor-Zustand reist über drei Prozessgrenzen (Control Plane → Platform →
 * Marketing). Diese Tests halten die eine Eigenschaft fest, an der alles
 * hängt: NUR ein ausdrückliches `false` öffnet.
 */
describe('onboardingInviteRequired', () => {
  it('öffnet ausschließlich bei echtem false', () => {
    expect(onboardingInviteRequired(false)).toBe(false)
  })

  it('hält bei true, fehlend und leer geschlossen', () => {
    expect(onboardingInviteRequired(true)).toBe(true)
    expect(onboardingInviteRequired(undefined)).toBe(true)
    expect(onboardingInviteRequired(null)).toBe(true)
  })

  it('lässt sich von einem WERT, der wie „aus" aussieht, nicht öffnen', () => {
    // Genau die Fälle, die aus JSON, aus einer Formularantwort oder aus einer
    // fehlgeschlagenen Migration kommen können.
    for (const value of ['false', '0', 0, '', 'off', 'no']) {
      expect(onboardingInviteRequired(value)).toBe(true)
    }
  })
})

describe('resolveOnboardingGate', () => {
  it('liest den offenen Zustand aus einem sauberen Umschlag', () => {
    expect(resolveOnboardingGate({ inviteRequired: false })).toEqual({ inviteRequired: false })
    expect(resolveOnboardingGate({ inviteRequired: true })).toEqual({ inviteRequired: true })
  })

  it('fällt bei jedem unbrauchbaren Umschlag auf die Einladungs-Variante', () => {
    // undefined = Netz weg · null = leere Antwort · '' = HTML-Fehlerseite ·
    // [] / 42 = irgendetwas anderes am anderen Ende.
    for (const raw of [undefined, null, '', 'nope', 42, [], {}]) {
      expect(resolveOnboardingGate(raw)).toEqual(FAILSAFE_ONBOARDING_GATE)
    }
  })

  it('gibt eine EIGENE Kopie zurück — der Fail-safe darf nicht beschreibbar sein', () => {
    const state = resolveOnboardingGate(null)
    state.inviteRequired = false
    expect(FAILSAFE_ONBOARDING_GATE.inviteRequired).toBe(true)
  })
})

describe('resolveAuthNotices', () => {
  it('gibt ohne Registrierungen nichts heraus', () => {
    expect(resolveAuthNotices(undefined)).toEqual([])
    expect(resolveAuthNotices({})).toEqual([])
  })

  it('sortiert nach order und trägt die Id mit', () => {
    const notices: PukalaniAuthNoticeConfig = {
      spaet: { component: 'B', order: 90 },
      frueh: { component: 'A', order: 10 },
      ohne: { component: 'C' },
    }
    expect(resolveAuthNotices(notices)).toEqual([
      { id: 'frueh', component: 'A' },
      { id: 'ohne', component: 'C' },
      { id: 'spaet', component: 'B' },
    ])
  })

  it('lässt eine App einen Eintrag mit false abschalten', () => {
    expect(resolveAuthNotices({ a: { component: 'A' }, b: false })).toEqual([{ id: 'a', component: 'A' }])
  })
})
