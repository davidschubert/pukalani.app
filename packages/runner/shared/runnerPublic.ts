import type { RunnerPublic, RunnerRow } from './types/runner'

/**
 * Die EINE Stelle, an der aus einer Runner-Zeile das wird, was das Board
 * sehen darf — `secretHash` fällt weg (Begründung am Typ `RunnerPublic`).
 *
 * Bewusst eine Funktion und kein „vergiss das Feld beim Zusammenbauen": es
 * gibt zwei Rückgabewege (Liste und Registrierung), und der zweite entstand
 * später. Ein Feld, das man an jeder Stelle einzeln weglassen muss, kommt
 * irgendwo zurück.
 */
export function toRunnerPublic(row: RunnerRow): RunnerPublic {
  const { secretHash: _secretHash, ...rest } = row
  return rest
}
