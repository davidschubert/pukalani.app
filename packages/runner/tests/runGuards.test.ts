import { describe, expect, it } from 'vitest'
import { PERMISSION_MODES, RUN_STATUSES, type PermissionMode, type RunStatus } from '../shared/types/runner'
import { isTerminalRunStatus, permissionModeAllowed, runTransitionAllowed, type RunActor } from '../shared/runGuards'

/**
 * Die zwei Sicherungen des AI-Runners, einzeln gemessen —
 * docs/plans/AI-RUNNER.md § 8.2 (Modus-Sperre) und § 4 (Zustandsautomat).
 *
 * Beide Tabellen enthalten bewusst GEGENPROBEN: ein Test, der nur bestätigt,
 * was erlaubt ist, bleibt grün, wenn jemand die Regel „vereinfacht" und alles
 * erlaubt. Die Zeilen mit `false` sind der eigentliche Wert dieser Datei.
 */

describe('permissionModeAllowed (§ 8.2)', () => {
  const cases: Array<[PermissionMode, boolean, boolean, string]> = [
    // GEPRÜFTER Auftragstext: alle sechs Modi der CLI stehen offen.
    ['default', true, true, 'vertraut ⇒ default erlaubt'],
    ['auto', true, true, 'vertraut ⇒ auto erlaubt'],
    ['plan', true, true, 'vertraut ⇒ plan erlaubt'],
    ['acceptEdits', true, true, 'vertraut ⇒ acceptEdits erlaubt'],
    ['dontAsk', true, true, 'vertraut ⇒ dontAsk erlaubt'],
    ['bypassPermissions', true, true, 'vertraut ⇒ bypassPermissions erlaubt'],
    // UNGEPRÜFT (Gast-Feedback im Text): nur die zwei harmlosen.
    ['plan', false, true, 'ungeprüft ⇒ plan erlaubt'],
    ['acceptEdits', false, true, 'ungeprüft ⇒ acceptEdits erlaubt'],
    ['default', false, false, 'ungeprüft ⇒ default gesperrt'],
    ['auto', false, false, 'ungeprüft ⇒ auto gesperrt'],
    ['dontAsk', false, false, 'ungeprüft ⇒ dontAsk gesperrt'],
    /**
     * DIE ZEILE, DIE DEN GANZEN ABSCHNITT TRÄGT. `bypassPermissions` auf einem
     * Text, in dem Fremdmaterial steckt, wäre die volle Werkzeugkiste auf
     * Davids Rechner — genau der Pfad, gegen den § 8.2 geschrieben ist. Wer
     * die Regel „vereinfacht", lässt diesen Test fallen.
     */
    ['bypassPermissions', false, false, 'ungeprüft ⇒ bypassPermissions GESPERRT'],
  ]

  it.each(cases)('%s (trusted=%s) ⇒ %s — %s', (mode, trusted, expected) => {
    expect(permissionModeAllowed(mode, trusted)).toBe(expected)
  })

  it('kennt keinen Modus ausserhalb der CLI-Liste', () => {
    expect(permissionModeAllowed('yolo' as PermissionMode, true)).toBe(false)
  })

  it('erlaubt einem ungeprüften Auftrag höchstens zwei der sechs Modi', () => {
    const allowed = PERMISSION_MODES.filter(mode => permissionModeAllowed(mode, false))
    expect(allowed).toEqual(['plan', 'acceptEdits'])
  })
})

describe('runTransitionAllowed (§ 4)', () => {
  const cases: Array<[RunStatus, RunStatus, RunActor, boolean, string]> = [
    // Das Board kennt genau EINE Bewegung — abbrechen, in drei Zuständen.
    ['queued', 'cancelled', 'board', true, 'Abbrechen VOR dem Claim'],
    ['claimed', 'cancelled', 'board', true, 'Abbrechen nach dem Claim'],
    ['running', 'cancelled', 'board', true, 'Abbrechen im Lauf'],
    ['queued', 'claimed', 'board', false, 'Board claimt nicht'],
    ['running', 'succeeded', 'board', false, 'Board erklärt keinen Erfolg'],
    ['queued', 'running', 'board', false, 'Board startet nichts'],
    // Der Runner bewegt den Lauf vorwärts.
    ['queued', 'claimed', 'runner', true, 'Claim'],
    ['claimed', 'running', 'runner', true, 'erstes Lebenszeichen'],
    ['claimed', 'failed', 'runner', true, 'scheitert vor dem Start (unbekannter repoKey)'],
    ['running', 'succeeded', 'runner', true, 'fertig'],
    ['running', 'needs_input', 'runner', true, 'Rückfrage'],
    ['running', 'failed', 'runner', true, 'Fehler'],
    ['running', 'cancelled', 'runner', true, 'Runner bestätigt den Abbruch'],
    ['queued', 'running', 'runner', false, 'kein Start ohne Claim'],
    ['running', 'claimed', 'runner', false, 'kein Rückwärts'],
    ['running', 'queued', 'runner', false, 'kein Zurück in die Schlange'],
    // GEGENPROBEN: terminal bleibt terminal, für JEDEN Handelnden.
    ['cancelled', 'running', 'runner', false, 'abgebrochen wird nicht wiederbelebt'],
    ['cancelled', 'succeeded', 'runner', false, 'Nachlauf hebt den Abbruch nicht auf'],
    ['succeeded', 'running', 'runner', false, 'fertig bleibt fertig'],
    ['failed', 'running', 'runner', false, 'gescheitert bleibt gescheitert'],
    ['needs_input', 'running', 'runner', false, 'Rückfrage geht per NEUEM Lauf (--resume) weiter'],
    ['succeeded', 'cancelled', 'board', false, 'nichts abzubrechen'],
    ['cancelled', 'cancelled', 'board', false, 'zweimal abbrechen ist kein Übergang'],
  ]

  it.each(cases)('%s → %s (%s) ⇒ %s — %s', (from, to, actor, expected) => {
    expect(runTransitionAllowed(from, to, actor)).toBe(expected)
  })

  /**
   * Die Regel „terminal ist terminal" nicht nur an Stichproben, sondern über
   * das ganze Kreuzprodukt: vier Endzustände × sieben Ziele × zwei Handelnde.
   */
  it('lässt aus KEINEM Endzustand irgendeinen Übergang zu', () => {
    const escapes: string[] = []
    for (const from of RUN_STATUSES.filter(isTerminalRunStatus)) {
      for (const to of RUN_STATUSES) {
        for (const actor of ['board', 'runner'] as const) {
          if (runTransitionAllowed(from, to, actor)) escapes.push(`${actor}: ${from} → ${to}`)
        }
      }
    }
    expect(escapes).toEqual([])
  })

  it('kennt genau vier Endzustände', () => {
    expect(RUN_STATUSES.filter(isTerminalRunStatus)).toEqual(['succeeded', 'needs_input', 'failed', 'cancelled'])
  })
})
