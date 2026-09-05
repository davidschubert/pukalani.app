import { describe, expect, it } from 'vitest'
import {
  type BrandNavSession,
  chapterEffortMinutes,
  countChapterSessions,
  decideAutoAdvance,
  needsOpeningTurn,
  resolveActiveSession,
} from '../shared/brandWorkspaceNav'
import { slotsForStep } from '../shared/slotRegistry'

/**
 * DIE VIER RECHNUNGEN DER SESSION-NAVIGATION (BW2 Paket 3c-i).
 *
 * Sie sind der Grund, warum die Werkstatt-Seite trotz 2000 Zeilen prüfbar
 * bleibt: „welche Session ist offen", „darf jetzt gewechselt werden" und „was
 * steht im Zähler" sind Fragen mit einer Antwort, und die Antwort hängt nicht
 * an einer montierten Komponente. Jede Gegenprobe hier ist eine Lage, die im
 * Browser nur mit Glück auffiele — eine gesperrte Session in der Adresszeile,
 * ein überstimmter Auto-Weiter, ein Zähler ohne veraltete Felder.
 */

const CONTEXT_SESSIONS = slotsForStep('context')
const FIRST = CONTEXT_SESSIONS[0]!.id
const SECOND = CONTEXT_SESSIONS[1]!.id
const THIRD = CONTEXT_SESSIONS[2]!.id

function map(entries: Record<string, BrandNavSession>): Record<string, BrandNavSession> {
  return entries
}

describe('resolveActiveSession', () => {
  it('nimmt die Session aus der Adresse (Rang 1)', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      requested: SECOND,
      next: { stepKey: 'context', sessionKey: THIRD },
      sessions: map({ [FIRST]: { state: 'open' }, [SECOND]: { state: 'open' }, [THIRD]: { state: 'open' } }),
    })
    expect(active).toBe(SECOND)
  })

  it('nimmt ohne Adresse den Wegweiser des Servers (Rang 2)', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      next: { stepKey: 'context', sessionKey: THIRD },
      sessions: map({ [FIRST]: { state: 'open' }, [THIRD]: { state: 'open' } }),
    })
    expect(active).toBe(THIRD)
  })

  it('nimmt sonst die erste offene Session in Registry-Reihenfolge (Rang 3)', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      sessions: map({ [FIRST]: { state: 'done' }, [SECOND]: { state: 'open' }, [THIRD]: { state: 'open' } }),
    })
    expect(active).toBe(SECOND)
  })

  it('lässt eine GESPERRTE Session auch aus der Adresszeile nicht gewinnen', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      requested: THIRD,
      sessions: map({ [FIRST]: { state: 'open' }, [THIRD]: { state: 'locked' } }),
    })
    expect(active).toBe(FIRST)
  })

  it('ignoriert einen Wegweiser auf ein ANDERES Kapitel', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      next: { stepKey: 'pvm', sessionKey: 'b.purpose' },
      sessions: map({ [FIRST]: { state: 'open' } }),
    })
    expect(active).toBe(FIRST)
  })

  it('ignoriert einen Wegweiser auf die Finale Abnahme (dort gibt es keine Session)', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      next: { stepKey: 'context', acceptance: true },
      sessions: map({ [SECOND]: { state: 'open' } }),
    })
    expect(active).toBe(SECOND)
  })

  it('überspringt eine VERTAGTE Session beim Suchen — einmal', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      sessions: map({ [FIRST]: { state: 'open', deferred: true }, [SECOND]: { state: 'open' } }),
    })
    expect(active).toBe(SECOND)
  })

  it('öffnet eine vertagte Session trotzdem, wenn keine andere offen ist', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      sessions: map({ [FIRST]: { state: 'open', deferred: true }, [SECOND]: { state: 'done' } }),
    })
    expect(active).toBe(FIRST)
  })

  it('öffnet eine vertagte Session, wenn die Adresse sie nennt', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      requested: FIRST,
      sessions: map({ [FIRST]: { state: 'open', deferred: true }, [SECOND]: { state: 'open' } }),
    })
    expect(active).toBe(FIRST)
  })

  it('gibt null zurück, wenn nichts offen ist', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      sessions: map({ [FIRST]: { state: 'done' }, [SECOND]: { state: 'stale' } }),
    })
    expect(active).toBeNull()
  })

  it('ignoriert eine Adresse, die keine Session dieses Kapitels ist', () => {
    const active = resolveActiveSession({
      stepKey: 'context',
      requested: 'b.purpose',
      sessions: map({ [FIRST]: { state: 'open' }, 'b.purpose': { state: 'open' } }),
    })
    expect(active).toBe(FIRST)
  })
})

describe('countChapterSessions', () => {
  it('zählt bestätigt und veraltet GETRENNT', () => {
    const counts = countChapterSessions('context', map({
      [FIRST]: { state: 'done' },
      [SECOND]: { state: 'stale' },
      [THIRD]: { state: 'open' },
    }))
    expect(counts.confirmed).toBe(1)
    expect(counts.stale).toBe(1)
    expect(counts.total).toBe(CONTEXT_SESSIONS.length)
  })

  it('zählt eine fehlende Session als offen, nie als fertig', () => {
    const counts = countChapterSessions('context', {})
    expect(counts.confirmed).toBe(0)
    expect(counts.stale).toBe(0)
    expect(counts.total).toBe(CONTEXT_SESSIONS.length)
  })

  it('zählt vertagte Sessions eigens', () => {
    const counts = countChapterSessions('context', map({
      [FIRST]: { state: 'open', deferred: true },
      [SECOND]: { state: 'done', deferred: false },
    }))
    expect(counts.deferred).toBe(1)
  })
})

describe('chapterEffortMinutes', () => {
  it('summiert die Registry-Minuten des Kapitels', () => {
    expect(chapterEffortMinutes('context')).toBe(
      CONTEXT_SESSIONS.reduce((sum, session) => sum + session.effort.minutes, 0),
    )
  })

  it('bleibt in der kommunizierten Grössenordnung (kein Kapitel über 30 Min)', () => {
    for (const key of ['context', 'pvm', 'values', 'archetype'] as const) {
      expect(chapterEffortMinutes(key)).toBeGreaterThan(0)
      expect(chapterEffortMinutes(key)).toBeLessThanOrEqual(30)
    }
  })
})

describe('decideAutoAdvance', () => {
  const base = {
    from: FIRST,
    active: FIRST,
    next: { stepKey: 'context' as const, sessionKey: SECOND },
    streaming: false,
    savePending: false,
    conflict: false,
  }

  it('wechselt auf die genannte Session', () => {
    expect(decideAutoAdvance(base)).toEqual({ kind: 'session', stepKey: 'context', sessionKey: SECOND })
  })

  it('bleibt, wenn der Mensch inzwischen woanders steht', () => {
    expect(decideAutoAdvance({ ...base, active: THIRD })).toEqual({ kind: 'stay' })
  })

  it('bleibt, solange ein Strom läuft', () => {
    expect(decideAutoAdvance({ ...base, streaming: true })).toEqual({ kind: 'stay' })
  })

  it('bleibt, solange eine Speicherung aussteht (409-Falle)', () => {
    expect(decideAutoAdvance({ ...base, savePending: true })).toEqual({ kind: 'stay' })
  })

  it('bleibt bei offenem Konflikt', () => {
    expect(decideAutoAdvance({ ...base, conflict: true })).toEqual({ kind: 'stay' })
  })

  it('bleibt ohne Wegweiser', () => {
    expect(decideAutoAdvance({ ...base, next: null })).toEqual({ kind: 'stay' })
  })

  it('bleibt, wenn der Wegweiser auf die eigene Session zeigt', () => {
    expect(decideAutoAdvance({ ...base, next: { stepKey: 'context', sessionKey: FIRST } }))
      .toEqual({ kind: 'stay' })
  })

  it('meldet das Kapitelende eigens (der Sprung kommt mit 3c-ii)', () => {
    expect(decideAutoAdvance({ ...base, next: { stepKey: 'context', acceptance: true } }))
      .toEqual({ kind: 'acceptance', stepKey: 'context' })
  })
})

describe('needsOpeningTurn', () => {
  it('eröffnet eine stumme Session', () => {
    expect(needsOpeningTurn({
      sessionKey: FIRST, opened: new Set(), hasAdvisorTurn: false, streaming: false,
    })).toBe(true)
  })

  it('eröffnet NICHT, wenn der Verlauf schon einen Berater-Zug trägt', () => {
    expect(needsOpeningTurn({
      sessionKey: FIRST, opened: new Set(), hasAdvisorTurn: true, streaming: false,
    })).toBe(false)
  })

  it('eröffnet NICHT zweimal in derselben Sitzung', () => {
    expect(needsOpeningTurn({
      sessionKey: FIRST, opened: new Set([FIRST]), hasAdvisorTurn: false, streaming: false,
    })).toBe(false)
  })

  it('eröffnet nicht, während ein Zug läuft', () => {
    expect(needsOpeningTurn({
      sessionKey: FIRST, opened: new Set(), hasAdvisorTurn: false, streaming: true,
    })).toBe(false)
  })

  it('eröffnet nichts ohne Session', () => {
    expect(needsOpeningTurn({
      sessionKey: '', opened: new Set(), hasAdvisorTurn: false, streaming: false,
    })).toBe(false)
  })
})
