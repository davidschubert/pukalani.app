import { describe, expect, it } from 'vitest'
import {
  type BrandSyncState,
  brandAutosaveAllowed,
  brandSlotDisplayValue,
  brandSlotIsConfirmed,
  diffBrandSlots,
  nextBrandSyncState,
  pruneSettledEdits,
} from '../shared/brandAutosaveDiff'
import type { BrandSlotView } from '../shared/types/brand'

/**
 * DIE AUTOSAVE-RECHNUNG OHNE NUXT. Was hier grün ist, muss im Browser nicht
 * mehr nachgestellt werden — und die drei teuren Fälle (No-op, zweiter Tab,
 * Verbindungsabbruch) sind genau die, die man von Hand kaum reproduziert.
 */

function view(partial: Partial<BrandSlotView> = {}): BrandSlotView {
  return {
    firstDraft: null,
    latestDraft: null,
    confirmed: null,
    confidence: null,
    updatedAt: null,
    ...partial,
  }
}

describe('brandSlotDisplayValue', () => {
  it('zeigt den NEUESTEN Entwurf, nicht die Bestätigung', () => {
    // Wer hier `confirmed` bevorzugt, nimmt eine Bearbeitung nach der
    // Bestätigung beim nächsten Laden still zurück.
    expect(brandSlotDisplayValue(view({
      firstDraft: 'erster',
      latestDraft: 'neuester',
      confirmed: 'bestätigter',
    }))).toBe('neuester')
  })

  it('fällt über firstDraft auf confirmed zurück und sonst auf leer', () => {
    expect(brandSlotDisplayValue(view({ firstDraft: 'erster' }))).toBe('erster')
    expect(brandSlotDisplayValue(view({ confirmed: 'nur bestätigt' }))).toBe('nur bestätigt')
    expect(brandSlotDisplayValue(undefined)).toBe('')
  })

  it('kennt die Bestätigung als Tatsache, nicht als Text-Vergleich', () => {
    expect(brandSlotIsConfirmed(view({ confirmed: 'ja' }))).toBe(true)
    expect(brandSlotIsConfirmed(view({ latestDraft: 'ja' }))).toBe(false)
    expect(brandSlotIsConfirmed(undefined)).toBe(false)
  })
})

describe('diffBrandSlots', () => {
  const server = {
    'a.oneThing': view({ firstDraft: 'alt', latestDraft: 'stand', confirmed: null }),
    'a.complaints': view({ firstDraft: 'x', latestDraft: 'x', confirmed: 'x' }),
  }

  it('sendet NICHTS, wenn die lokale Eingabe dem Server entspricht (No-op)', () => {
    expect(diffBrandSlots(server, { 'a.oneThing': { value: 'stand' } })).toEqual({})
    expect(diffBrandSlots(server, {})).toEqual({})
  })

  it('sendet nur die geänderten Slots', () => {
    expect(diffBrandSlots(server, {
      'a.oneThing': { value: 'neu' },
      'a.complaints': { value: 'x' },
    })).toEqual({ 'a.oneThing': { value: 'neu' } })
  })

  it('behandelt den leeren String als echte Eingabe', () => {
    expect(diffBrandSlots(server, { 'a.oneThing': { value: '' } })).toEqual({ 'a.oneThing': { value: '' } })
  })

  it('kennt Slots, die der Server noch nicht hat', () => {
    expect(diffBrandSlots(server, { 'a.challenge': { value: 'frisch' } }))
      .toEqual({ 'a.challenge': { value: 'frisch' } })
  })

  it('bestätigt nur, wenn der Server nicht schon genau diesen Text bestätigt hat', () => {
    // schon bestätigt, gleicher Text ⇒ nichts zu tun
    expect(diffBrandSlots(server, { 'a.complaints': { confirmed: true } })).toEqual({})
    // noch nicht bestätigt ⇒ Bestätigung geht raus
    expect(diffBrandSlots(server, { 'a.oneThing': { confirmed: true } }))
      .toEqual({ 'a.oneThing': { confirmed: true } })
    // Text UND Bestätigung in einem Zug
    expect(diffBrandSlots(server, { 'a.complaints': { value: 'y', confirmed: true } }))
      .toEqual({ 'a.complaints': { value: 'y', confirmed: true } })
  })

  it('nimmt eine Bestätigung nur zurück, wenn es eine gibt', () => {
    expect(diffBrandSlots(server, { 'a.complaints': { confirmed: false } }))
      .toEqual({ 'a.complaints': { confirmed: false } })
    expect(diffBrandSlots(server, { 'a.oneThing': { confirmed: false } })).toEqual({})
  })

  it('erzeugt nie einen leeren Slot-Patch (die Route lehnt ihn ab)', () => {
    const result = diffBrandSlots(server, { 'a.oneThing': {} })
    expect(result).toEqual({})
    for (const patch of Object.values(diffBrandSlots(server, {
      'a.oneThing': { value: 'neu', confirmed: false },
    }))) {
      expect(Object.keys(patch).length).toBeGreaterThan(0)
    }
  })
})

describe('pruneSettledEdits', () => {
  it('verwirft, was der Server jetzt so trägt, und behält den Rest', () => {
    const after = {
      'a.oneThing': view({ firstDraft: 'alt', latestDraft: 'neu' }),
      'a.challenge': view({ firstDraft: 'alt', latestDraft: 'alt' }),
    }
    expect(pruneSettledEdits(after, {
      'a.oneThing': { value: 'neu' },
      'a.challenge': { value: 'noch offen' },
    })).toEqual({ 'a.challenge': { value: 'noch offen' } })
  })

  it('ist nach einer vollständigen Antwort leer — sonst speichert der nächste Tick dasselbe erneut', () => {
    const after = { 'a.oneThing': view({ firstDraft: 'neu', latestDraft: 'neu', confirmed: 'neu' }) }
    expect(pruneSettledEdits(after, { 'a.oneThing': { value: 'neu', confirmed: true } })).toEqual({})
  })
})

describe('nextBrandSyncState', () => {
  it('bildet den normalen Lauf ab', () => {
    expect(nextBrandSyncState('saved', 'start')).toBe('saving')
    expect(nextBrandSyncState('saving', 'ok')).toBe('saved')
    expect(nextBrandSyncState('saving', 'offline')).toBe('offline')
    expect(nextBrandSyncState('saving', 'error')).toBe('error')
    expect(nextBrandSyncState('offline', 'start')).toBe('saving')
  })

  it('geht aus JEDEM Zustand in den Konflikt', () => {
    const states: BrandSyncState[] = ['saving', 'saved', 'offline', 'error', 'conflict']
    for (const state of states) expect(nextBrandSyncState(state, 'conflict')).toBe('conflict')
  })

  it('KLEBT im Konflikt — eine verspätete Erfolgsmeldung löst ihn nicht auf', () => {
    // Genau hier hinge sonst die stille Überschreibung, die der 409 verhindert.
    expect(nextBrandSyncState('conflict', 'ok')).toBe('conflict')
    expect(nextBrandSyncState('conflict', 'start')).toBe('conflict')
    expect(nextBrandSyncState('conflict', 'offline')).toBe('conflict')
    expect(nextBrandSyncState('conflict', 'error')).toBe('conflict')
  })

  it('verlässt den Konflikt NUR über die menschliche Entscheidung', () => {
    expect(nextBrandSyncState('conflict', 'resolve')).toBe('saved')
  })

  it('hält den Autosave im Konflikt an', () => {
    expect(brandAutosaveAllowed('conflict')).toBe(false)
    for (const state of ['saving', 'saved', 'offline', 'error'] as BrandSyncState[]) {
      expect(brandAutosaveAllowed(state)).toBe(true)
    }
  })
})
