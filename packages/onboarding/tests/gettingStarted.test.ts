import { describe, expect, it } from 'vitest'
import {
  communityDismissedGettingStarted,
  hasActiveCommunitySubscription,
  homePageEdited,
  resolveGettingStarted,
  withCommunityDismissed,
  GETTING_STARTED_STEPS,
  type GettingStartedState,
} from '../shared/gettingStarted'

const NOTHING_DONE: GettingStartedState = { post: false, branding: false, invite: false, homePage: false, plan: false }
const ALL_DONE: GettingStartedState = { post: true, branding: true, invite: true, homePage: true, plan: true }

describe('GETTING_STARTED_STEPS', () => {
  it('trägt die fünf entschiedenen Schritte in der entschiedenen Reihenfolge', () => {
    // DECISION-LOG 2026-08-10, Nachtrag Punkt 7 — Farbwelt VOR Einladen
    // (Ghost-Daten), Abo am Ende als Umsatz-Hebel.
    expect([...GETTING_STARTED_STEPS]).toEqual(['post', 'branding', 'invite', 'homePage', 'plan'])
  })
})

describe('resolveGettingStarted', () => {
  it('ohne Antwort (404 / noch unterwegs / Fehler) rendert nichts', () => {
    for (const value of [null, undefined]) {
      const view = resolveGettingStarted(value)
      expect(view.visible).toBe(false)
      expect(view.steps).toEqual([])
      expect(view.doneCount).toBe(0)
    }
  })
  it('frische Community: alle fünf offen, Karte sichtbar', () => {
    const view = resolveGettingStarted({ steps: NOTHING_DONE, dismissed: false })
    expect(view.visible).toBe(true)
    expect(view.doneCount).toBe(0)
    expect(view.total).toBe(5)
    expect(view.steps.map(step => step.key)).toEqual([...GETTING_STARTED_STEPS])
    expect(view.steps.every(step => step.done === false)).toBe(true)
  })
  it('zählt erledigte Schritte, bleibt aber sichtbar solange einer fehlt', () => {
    const view = resolveGettingStarted({ steps: { ...NOTHING_DONE, post: true, branding: true }, dismissed: false })
    expect(view.doneCount).toBe(2)
    expect(view.allDone).toBe(false)
    expect(view.visible).toBe(true)
  })
  it('alles erledigt ⇒ die Karte verschwindet von selbst', () => {
    const view = resolveGettingStarted({ steps: ALL_DONE, dismissed: false })
    expect(view.allDone).toBe(true)
    expect(view.visible).toBe(false)
  })
  it('weggeklickt ⇒ unsichtbar, auch wenn nichts erledigt ist', () => {
    expect(resolveGettingStarted({ steps: NOTHING_DONE, dismissed: true }).visible).toBe(false)
  })
  it('ein fehlender Schlüssel gilt als offen, nicht als erledigt', () => {
    const partial = { post: true } as unknown as GettingStartedState
    const view = resolveGettingStarted({ steps: partial, dismissed: false })
    expect(view.doneCount).toBe(1)
    expect(view.visible).toBe(true)
  })
})

describe('hasActiveCommunitySubscription', () => {
  it('nur „active" zählt', () => {
    expect(hasActiveCommunitySubscription('active')).toBe(true)
  })
  it('Testphase, Verzug, Kündigung und „nie ein Abo" zählen nicht', () => {
    for (const value of ['past_due', 'canceled', '', null, undefined]) {
      expect(hasActiveCommunitySubscription(value)).toBe(false)
    }
  })
})

describe('homePageEdited', () => {
  it('frisch gesät (updatedAt == createdAt) ⇒ nicht bearbeitet', () => {
    const t0 = '2026-08-12T10:00:00.000Z'
    expect(homePageEdited(t0, t0)).toBe(false)
  })
  it('Millisekunden-Versatz der Saat gilt noch nicht als Bearbeitung', () => {
    expect(homePageEdited('2026-08-12T10:00:00.000Z', '2026-08-12T10:00:03.000Z')).toBe(false)
  })
  it('echte Bearbeitung ⇒ erledigt', () => {
    expect(homePageEdited('2026-08-12T10:00:00.000Z', '2026-08-12T10:20:00.000Z')).toBe(true)
  })
  it('fehlende oder kaputte Zeitstempel ⇒ nicht bearbeitet (nie geraten)', () => {
    expect(homePageEdited(undefined, '2026-08-12T10:00:00.000Z')).toBe(false)
    expect(homePageEdited('2026-08-12T10:00:00.000Z', undefined)).toBe(false)
    expect(homePageEdited('gestern', 'heute')).toBe(false)
  })
})

describe('Ausblenden-Merker (prefs, konto-weit)', () => {
  it('leerer/fehlender Wert heißt „nicht ausgeblendet"', () => {
    for (const value of [undefined, null, '', 42]) {
      expect(communityDismissedGettingStarted(value, 'c-1')).toBe(false)
    }
  })
  it('gilt NUR für die Community, in der geklickt wurde', () => {
    const stored = withCommunityDismissed('', 'c-1')
    expect(communityDismissedGettingStarted(stored, 'c-1')).toBe(true)
    expect(communityDismissedGettingStarted(stored, 'c-2')).toBe(false)
  })
  it('sammelt mehrere Communities und bleibt idempotent', () => {
    const once = withCommunityDismissed('', 'c-1')
    const twice = withCommunityDismissed(once, 'c-1')
    expect(twice).toBe('c-1')
    const both = withCommunityDismissed(twice, 'c-2')
    expect(communityDismissedGettingStarted(both, 'c-1')).toBe(true)
    expect(communityDismissedGettingStarted(both, 'c-2')).toBe(true)
  })
  it('deckelt den Merker, damit die prefs nicht unbegrenzt wachsen', () => {
    let stored = ''
    for (let i = 0; i < 60; i++) stored = withCommunityDismissed(stored, `c-${i}`)
    expect(stored.split(',')).toHaveLength(50)
    // Der älteste fällt raus, der jüngste bleibt.
    expect(communityDismissedGettingStarted(stored, 'c-0')).toBe(false)
    expect(communityDismissedGettingStarted(stored, 'c-59')).toBe(true)
  })
  it('ohne communityId wird nichts ausgeblendet', () => {
    expect(communityDismissedGettingStarted('c-1', '')).toBe(false)
  })
})
