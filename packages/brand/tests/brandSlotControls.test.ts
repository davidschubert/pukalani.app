import { describe, expect, it } from 'vitest'
import {
  type BrandSlotControlsInput,
  brandChapterProgress,
  brandSlotControls,
} from '../shared/brandSlotControls'

/**
 * DIE ZUSTANDS-ENTSCHEIDUNG DER BÜHNE, VOLLSTÄNDIG DURCHGESPIELT.
 *
 * Sie ist der Kern von Davids Befund vom 2026-09-02 („wenn confirmed müsste es
 * unmöglich sein zu korrigieren, außer wir klicken auf einen Button
 * Korrigieren") — und sie ist genau die Sorte Regel, die im Markup verrutscht,
 * ohne dass etwas rot wird: ein `v-if` zu viel, und der Bestätigungs-Knopf
 * steht neben dem Korrigieren-Knopf.
 *
 * Was hier NICHT geprüft wird, ist die Durchsetzung — die steht im Server
 * (`slot_confirmed` in der Autosave- und der Generate-Route) und hat ihre
 * eigenen Beweise. Diese Datei prüft, was der Mensch SIEHT.
 */

function input(overrides: Partial<BrandSlotControlsInput> = {}): BrandSlotControlsInput {
  return {
    confirmed: false,
    hasValue: false,
    isGeorgeDraft: false,
    hasEditor: true,
    confirmable: true,
    generatable: true,
    hasHistory: false,
    ready: true,
    ...overrides,
  }
}

describe('brandSlotControls — die Ampel', () => {
  it('leer ohne Wert, Entwurf mit Wert, bestätigt schlägt beides', () => {
    expect(brandSlotControls(input()).state).toBe('empty')
    expect(brandSlotControls(input({ hasValue: true })).state).toBe('draft')
    expect(brandSlotControls(input({ hasValue: true, confirmed: true })).state).toBe('confirmed')
  })

  it('unterscheidet Zustand und HERKUNFT: getippt ist so „Entwurf" wie George', () => {
    const typed = brandSlotControls(input({ hasValue: true, isGeorgeDraft: false }))
    const drafted = brandSlotControls(input({ hasValue: true, isGeorgeDraft: true }))
    expect(typed.state).toBe('draft')
    expect(drafted.state).toBe('draft')
    // Das Etikett trennt die beiden, die Ampel nicht.
    expect(typed.showDraftBadge).toBe(false)
    expect(drafted.showDraftBadge).toBe(true)
  })

  it('bestätigt nimmt Georges Etikett weg — nie zwei Etiketten nebeneinander', () => {
    const controls = brandSlotControls(input({ hasValue: true, isGeorgeDraft: true, confirmed: true }))
    expect(controls.showDraftBadge).toBe(false)
    expect(controls.showConfirmedBadge).toBe(true)
  })
})

describe('brandSlotControls — der offene Slot', () => {
  it('ist beschreibbar und bietet Bestätigen an, sobald etwas drinsteht', () => {
    const empty = brandSlotControls(input())
    expect(empty.editable).toBe(true)
    expect(empty.showConfirm).toBe(true)
    // Einen leeren Slot bestätigt die Route mit `slot_empty` weg — der Knopf
    // sagt es vorher.
    expect(empty.confirmEnabled).toBe(false)
    expect(brandSlotControls(input({ hasValue: true })).confirmEnabled).toBe(true)
  })

  it('zeigt „Korrigieren" nicht — es gibt nichts aufzuheben', () => {
    expect(brandSlotControls(input({ hasValue: true })).showRevise).toBe(false)
  })

  it('zeigt ENTWEDER den Bedarfs-Satz ODER die Werkzeuge, nie beides', () => {
    const blocked = brandSlotControls(input({ ready: false }))
    expect(blocked.showReadinessNote).toBe(true)
    expect(blocked.showGenerate).toBe(false)
    expect(blocked.showHint).toBe(false)

    const open = brandSlotControls(input({ ready: true }))
    expect(open.showReadinessNote).toBe(false)
    expect(open.showGenerate).toBe(true)
    expect(open.showHint).toBe(true)
  })

  it('schweigt über Bereitschaft, wo George gar nicht entwirft', () => {
    const human = brandSlotControls(input({ generatable: false, ready: false }))
    expect(human.showReadinessNote).toBe(false)
    expect(human.showGenerate).toBe(false)
    expect(human.showVersions).toBe(false)
  })

  it('erlaubt das Wiederherstellen früherer Fassungen', () => {
    const controls = brandSlotControls(input({ hasValue: true, hasHistory: true }))
    expect(controls.showVersions).toBe(true)
    expect(controls.canRestoreVersion).toBe(true)
  })
})

describe('brandSlotControls — der bestätigte Slot ist zu', () => {
  const confirmed = brandSlotControls(input({ hasValue: true, confirmed: true, hasHistory: true }))

  it('nimmt das Feld aus dem Schreibbetrieb', () => {
    expect(confirmed.editable).toBe(false)
  })

  it('nimmt George das Wort: kein Entwerfen, kein Hinweis', () => {
    expect(confirmed.showGenerate).toBe(false)
    expect(confirmed.showHint).toBe(false)
  })

  it('sagt nicht mehr, was zum Entwerfen fehlt — es wird nicht entworfen', () => {
    const stillBlocked = brandSlotControls(input({ hasValue: true, confirmed: true, ready: false }))
    expect(stillBlocked.showReadinessNote).toBe(false)
  })

  it('lässt frühere Fassungen LESEN, aber nicht übernehmen', () => {
    expect(confirmed.showVersions).toBe(true)
    expect(confirmed.canRestoreVersion).toBe(false)
  })

  it('zeigt den Knopf weiter — als Zustand, nicht als Angebot — und daneben „Korrigieren"', () => {
    expect(confirmed.showConfirm).toBe(true)
    expect(confirmed.confirmEnabled).toBe(false)
    expect(confirmed.showRevise).toBe(true)
  })

  it('ist die EINZIGE Tür zurück: ohne „Korrigieren" bleibt alles zu', () => {
    // Gegenprobe — derselbe Slot ohne Bestätigung ist in jedem Punkt offen.
    const open = brandSlotControls(input({ hasValue: true, hasHistory: true }))
    expect(open.editable).toBe(true)
    expect(open.showGenerate).toBe(true)
    expect(open.canRestoreVersion).toBe(true)
    expect(open.showRevise).toBe(false)
  })
})

describe('brandSlotControls — wer nichts entscheiden kann, zählt nicht', () => {
  it('schliesst Ableitungen ohne Feld aus', () => {
    const derivation = brandSlotControls(input({ hasEditor: false }))
    expect(derivation.countsForProgress).toBe(false)
    expect(derivation.showConfirm).toBe(false)
    expect(derivation.editable).toBe(false)
  })

  it('schliesst den Paarvergleich aus (eigenes Instrument, Katalog §12)', () => {
    const special = brandSlotControls(input({ confirmable: false }))
    expect(special.countsForProgress).toBe(false)
    expect(special.showConfirm).toBe(false)
  })

  it('lässt einen bestätigten Sonderfall trotzdem nicht in die Knöpfe rutschen', () => {
    const special = brandSlotControls(input({ confirmable: false, confirmed: true, hasValue: true }))
    expect(special.showConfirm).toBe(false)
    expect(special.showRevise).toBe(false)
    // Der ZUSTAND stimmt trotzdem — der Punkt links darf ihn zeigen.
    expect(special.state).toBe('confirmed')
  })
})

describe('brandChapterProgress', () => {
  const controls = (over: Partial<BrandSlotControlsInput>) => brandSlotControls(input(over))

  it('zählt bestätigte von zählbaren', () => {
    const result = brandChapterProgress([
      controls({ hasValue: true, confirmed: true }),
      controls({ hasValue: true, confirmed: true }),
      controls({ hasValue: true }),
      controls({}),
    ])
    expect(result).toEqual({ confirmed: 2, total: 4, pct: 50 })
  })

  it('lässt Ableitungen und den Paarvergleich aus dem Nenner', () => {
    const result = brandChapterProgress([
      controls({ hasValue: true, confirmed: true }),
      controls({ hasEditor: false }),
      controls({ confirmable: false }),
    ])
    // Ein Nenner, den niemand bewegen kann, stünde für immer unter 100 %.
    expect(result).toEqual({ confirmed: 1, total: 1, pct: 100 })
  })

  it('ist bei einem Kapitel ohne zählbare Slots still (0/0, kein Balken)', () => {
    expect(brandChapterProgress([controls({ hasEditor: false })]))
      .toEqual({ confirmed: 0, total: 0, pct: 0 })
    expect(brandChapterProgress([])).toEqual({ confirmed: 0, total: 0, pct: 0 })
  })

  it('rundet, statt Nachkommastellen in die Oberfläche zu lassen', () => {
    const result = brandChapterProgress([
      controls({ hasValue: true, confirmed: true }),
      controls({}),
      controls({}),
    ])
    expect(result.pct).toBe(33)
  })
})
