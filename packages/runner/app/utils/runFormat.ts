import type { RunRow } from '../../shared/types/runner'

/**
 * Wie lange lief das? — an zwei Stellen gebraucht (Bericht im Lauf-Bereich,
 * Läufe-Tabelle auf /dashboard/runner), deshalb hier und nicht zweimal.
 *
 * DIE DAUER KOMMT AUS DEN STEMPELN DER ZEILE, nicht aus dem Bericht des
 * Runners: `claimedAt`/`startedAt`/`finishedAt` setzt der SERVER, sie können
 * also nicht auseinanderlaufen, wenn eine Uhr auf dem Mac falsch geht. Der
 * Bericht darf sie überschreiben (er weiß es genauer — er misst den Prozess),
 * aber er ist nicht die Grundlage.
 */
export function runDurationMs(run: RunRow): number | null {
  const start = run.startedAt ?? run.claimedAt
  if (!start || !run.finishedAt) return null
  const ms = new Date(run.finishedAt).getTime() - new Date(start).getTime()
  return Number.isFinite(ms) && ms >= 0 ? ms : null
}

/** ms → „8 s" bzw. „2 min 14 s". Zwei Einheiten reichen; ohne Bibliothek. */
export function formatDurationMs(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds} s`
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}
