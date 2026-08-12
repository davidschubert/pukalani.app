import { describe, expect, it } from 'vitest'
import {
  WIZARD_STEPS,
  isStepComplete,
  nextStep,
  normalizeStep,
  previousStep,
  stepIndex,
} from '../shared/wizardSteps'

const FULL = {
  name: 'Jungle Zipline',
  slug: 'jungle-zipline',
  category: 'creator',
  vibe: 'calm',
}

describe('Schrittfolge', () => {
  it('hat drei Fragen und einen Abschluss (U12)', () => {
    // Nagelt Davids Entscheidung fest: Name/Adresse · Kategorie · Vibe.
    // Wächst die Liste wieder, ist das eine Entscheidung und kein Versehen.
    expect(WIZARD_STEPS).toEqual(['basics', 'category', 'vibe', 'summary'])
  })

  it('normalisiert Müll aus der URL auf den ersten Schritt', () => {
    for (const value of ['', 'gibt-es-nicht', undefined, null, 42, {}]) {
      expect(normalizeStep(value)).toBe('basics')
    }
    expect(normalizeStep('vibe')).toBe('vibe')
    // Die weggefallenen Schritte sind aus der URL nicht mehr erreichbar —
    // ein alter Link (Lesezeichen, offener Tab) landet vorne statt im Nichts.
    for (const gone of ['size', 'description', 'goal', 'purpose']) {
      expect(normalizeStep(gone)).toBe('basics')
    }
  })

  it('läuft vorwärts und rückwärts bis an die Ränder', () => {
    expect(nextStep('basics')).toBe('category')
    expect(nextStep('summary')).toBeNull()
    expect(previousStep('basics')).toBeNull()
    expect(previousStep('summary')).toBe('vibe')
    expect(stepIndex('vibe')).toBe(2)
  })
})

describe('Wann „Weiter" erlaubt ist', () => {
  it('verlangt Name und Adresse im ersten Schritt', () => {
    expect(isStepComplete('basics', FULL, 'free')).toBe(true)
    expect(isStepComplete('basics', { ...FULL, name: ' A ' }, 'free')).toBe(false)
    expect(isStepComplete('basics', { ...FULL, slug: 'ab' }, 'free')).toBe(false)
  })

  it('blockiert eine belegte Adresse und eine laufende Prüfung', () => {
    expect(isStepComplete('basics', FULL, 'taken')).toBe(false)
    expect(isStepComplete('basics', FULL, 'checking')).toBe(false)
  })

  it('lässt bei einem PRÜFFEHLER weiterarbeiten', () => {
    // Fällt unsere Prüfung aus, darf das nicht wie „Name vergeben" wirken —
    // sonst sucht jemand einen neuen Namen, obwohl der alte frei ist.
    expect(isStepComplete('basics', FULL, 'error')).toBe(true)
    expect(isStepComplete('basics', FULL, 'idle')).toBe(true)
  })

  it('verlangt eine Auswahl in den Katalog-Schritten', () => {
    expect(isStepComplete('category', {})).toBe(false)
    expect(isStepComplete('vibe', {})).toBe(false)
    expect(isStepComplete('category', { category: 'creator' })).toBe(true)
    expect(isStepComplete('vibe', { vibe: 'calm' })).toBe(true)
  })

  it('lässt die Zusammenfassung immer abschicken', () => {
    expect(isStepComplete('summary', {})).toBe(true)
  })
})
