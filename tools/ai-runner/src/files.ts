import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RunnerApi } from './api.ts'
import type { RunAttachment } from './protocol.ts'

/**
 * Material für den Lauf — docs/plans/AI-RUNNER.md § 6.
 *
 * Der Ordner liegt beim Runner (`<stateDir>/runs/<runId>/`), NICHT im Repo.
 * Weil die CLI den Worktree selbst anlegt, startet der Agent mit cwd IM
 * Worktree: ein relativer Pfad zeigte dort ins Leere, und Lesen ausserhalb des
 * Arbeitsverzeichnisses ist ohne Freigabe gesperrt. Deshalb nennt `prompt.md`
 * die Anhänge mit ABSOLUTEM Pfad, und der Start bekommt `--add-dir` auf den
 * `files/`-Ordner — nur diesen einen, sonst läse ein Lauf die Anhänge fremder
 * Läufe.
 */

/**
 * Ein Dateiname aus der Naht ist EINGABE, kein Name. Erlaubt bleibt
 * `[A-Za-z0-9._-]`, alles andere wird zu `-`; führende Punkte fallen weg.
 *
 * Das ist die Sicherung gegen `../../.ssh/authorized_keys` und gegen
 * `.env`-Attrappen im Anhang-Ordner. Sie sitzt hier und nicht im `join`, weil
 * `join` einen Pfad zusammensetzt und keine Meinung dazu hat, ob er nach oben
 * zeigt.
 */
export function sanitizeAttachmentName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '-').replace(/-{2,}/g, '-').replace(/^[.-]+/, '')
  const capped = cleaned.slice(0, 100)
  return capped || 'anhang'
}

/** Kollisionen nummerieren statt überschreiben: `bild.png`, `bild-2.png`, … */
export function uniqueAttachmentName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const suffix = dot > 0 ? name.slice(dot) : ''
  for (let index = 2; index < 1000; index++) {
    const candidate = `${stem}-${index}${suffix}`
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }
  const fallback = `${stem}-${Date.now()}${suffix}`
  taken.add(fallback)
  return fallback
}

/**
 * `prompt.md` — der Auftrag, wie er abgeschickt wurde, plus die Anhänge mit
 * ABSOLUTEN Pfaden (§ 6). Der Text selbst wird NICHT angefasst: er ist
 * serverseitig zusammengesetzt worden, und ein Runner, der daran noch etwas
 * umschreibt, macht aus einem nachvollziehbaren Auftrag eine zweite Wahrheit.
 */
export function buildPromptFile(promptSource: string, absolutePaths: string[]): string {
  if (!absolutePaths.length) return promptSource
  const list = absolutePaths.map(path => `- ${path}`).join('\n')
  return `${promptSource}\n\n## Anhänge (absolute Pfade):\n\n${list}\n`
}

export interface DownloadedAttachment {
  name: string
  path: string
  size: number
}

/**
 * Die Anhänge EINMAL ziehen (§ 7.2 Schritt 4). Die Liste ist mit `queue`
 * versiegelt, sie kann sich also während des Laufs nicht mehr ändern.
 *
 * Ein einzelner Fehlschlag wirft: ein Auftrag, dem ein Screenshot fehlt, ist
 * ein anderer Auftrag — und still ohne ihn zu starten wäre genau das
 * Wettrennen, gegen das `draft` gebaut wurde.
 */
export async function downloadAttachments(
  api: RunnerApi,
  runId: string,
  attachments: RunAttachment[],
  filesDir: string,
): Promise<DownloadedAttachment[]> {
  await mkdir(filesDir, { recursive: true })
  const taken = new Set<string>()
  const written: DownloadedAttachment[] = []

  for (const attachment of attachments) {
    const name = uniqueAttachmentName(sanitizeAttachmentName(attachment.name), taken)
    const data = await api.downloadAttachment(runId, attachment.fileId)
    const target = join(filesDir, name)
    await writeFile(target, data)
    written.push({ name, path: target, size: data.length })
  }

  return written
}
