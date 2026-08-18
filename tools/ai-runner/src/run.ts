import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { RunnerApi } from './api.ts'
import { clampRun } from './clamp.ts'
import type { RunnerConfig } from './config.ts'
import { EventPump, FLUSH_AT_EVENTS } from './events.ts'
import { buildPromptFile, downloadAttachments } from './files.ts'
import { buildCommitMessage, commitWorktree, currentBranch } from './git.ts'
import { hasShellSyntax, lastLines, runCommand, splitCommand } from './exec.ts'
import { log } from './log.ts'
import { parseTestCommands, type RunFinalStatus, type RunPayload } from './protocol.ts'
import { buildResultJson, type RunReport, type TestOutcome } from './result.ts'
import {
  condenseStreamLine,
  deriveFinalStatus,
  isPostTurnSummary,
  readResultLine,
  summaryStatusCategory,
  truncate,
  type ResultSummary,
} from './stream.ts'

/**
 * EIN Lauf, von der Claim-Antwort bis zum `finish` — docs/plans/AI-RUNNER.md
 * § 7.2.
 *
 * DIE LEITREGEL DIESER DATEI: ein Lauf darf nie stumm hängen bleiben. Jeder
 * Weg hier hinaus endet in genau EINEM `finish` — auch der unerwartete Fehler,
 * auch der Abbruch, auch die Zeitüberschreitung. Die einzige Ausnahme ist ein
 * Daemon, der KOMPLETT stirbt (kill -9, Stromausfall); dann steht der Lauf auf
 * `running`, und die Kur ist der Abbrechen-Knopf im Board (README).
 */

/** Ein Fehlschlag mit einem Kurz-Code, wie ihn `runs.error` trägt. */
class RunFailure extends Error {
  override name = 'RunFailure'
  code: string

  constructor(code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.code = code
  }
}

export interface RunContext {
  api: RunnerApi
  config: RunnerConfig
  /** Setzt der Daemon bei SIGINT/SIGTERM — der Lauf beendet sich dann selbst */
  shutdownRequested: () => boolean
}

/** Wie oft die Wache nach Abbruch/Herunterfahren sieht. */
const WATCHDOG_MS = 500
/** Frist zwischen SIGTERM und SIGKILL. */
const KILL_GRACE_MS = 10_000
/** Höchstens so viele stderr-Zeilen als Ereignis — der Rest steht im Transkript. */
const MAX_STDERR_EVENTS = 50
/** Serverseitiger Deckel für das Transkript (`transcript.post.ts`). */
const MAX_TRANSCRIPT_BYTES = 10 * 1024 * 1024

export async function executeRun(ctx: RunContext, run: RunPayload): Promise<void> {
  /**
   * SCHRITT 1 (§ 7.2): die Session-Id wird VOR dem Start gewürfelt und SOFORT
   * gemeldet. Damit kennt das Ticket seine Session ab Sekunde null, und
   * `--resume` trägt auch dann noch, wenn der Runner mittendrin abstürzt.
   */
  const sessionId = randomUUID()
  const startedAt = Date.now()
  const pump = new EventPump(ctx.api, run.$id, sessionId)
  let workBranch = ''
  let finished = false

  const finish = async (status: RunFinalStatus, error: string, resultJson: string): Promise<void> => {
    if (finished) return
    finished = true
    await pump.drain().catch(() => {})
    try {
      await ctx.api.finish(run.$id, {
        status,
        error: truncate(error, 2000),
        resultJson,
        sessionId,
        ...(workBranch ? { workBranch } : {}),
      })
      log.info(`Lauf ${run.$id} beendet: ${status}${error ? ` (${error})` : ''}`)
    }
    catch (apiError) {
      // Mehr als „best effort" geht hier nicht: der Lauf ist gelaufen, die
      // Naht ist weg. Das Board zeigt ihn weiter als laufend, bis jemand
      // abbricht — genau die Grenze, die im README steht.
      log.error(`Abschluss für ${run.$id} konnte nicht gemeldet werden: ${(apiError as Error).message}`)
    }
  }

  pump.start()
  pump.status('Lauf angenommen')
  // Erstes Bündel sofort: es trägt die Session-Id und hebt den Lauf
  // serverseitig von `claimed` auf `running`.
  await pump.flush()

  try {
    await performRun(ctx, run, pump, sessionId, startedAt, {
      setWorkBranch: (branch) => {
        workBranch = branch
        pump.setWorkBranch(branch)
      },
      finish,
    })
  }
  catch (error) {
    if (error instanceof RunFailure) {
      pump.error(error.message)
      await finish('failed', error.code, '')
    }
    else {
      const message = truncate((error as Error).message || String(error), 2000)
      pump.error(message)
      await finish('failed', message, '')
    }
  }
  finally {
    pump.stop()
  }
}

interface RunHooks {
  setWorkBranch: (branch: string) => void
  finish: (status: RunFinalStatus, error: string, resultJson: string) => Promise<void>
}

async function performRun(
  ctx: RunContext,
  run: RunPayload,
  pump: EventPump,
  sessionId: string,
  startedAt: number,
  hooks: RunHooks,
): Promise<void> {
  /**
   * SCHRITT 2: den `repoKey` gegen die LOKALE Allowlist auflösen (§ 8.1). Ein
   * Pfad aus der Naht wird NIE angenommen — es reist auch keiner.
   */
  const repo = ctx.config.repos[run.repoKey]
  if (!repo) {
    pump.error(`Unbekannter Repo-Schlüssel „${run.repoKey}" — dieser Rechner kennt: ${Object.keys(ctx.config.repos).join(', ')}`)
    throw new RunFailure('unknown_repo_key')
  }

  /**
   * Die Spalte `executor` trägt heute nur `'claude-code'` (§ 2) — sie existiert,
   * damit ein zweiter Agent später keine Migration kostet. Ein FREMDER Wert
   * darf hier trotzdem nicht durchrutschen: dieser Daemon kann genau eine CLI
   * starten, und still die falsche zu nehmen wäre schlimmer als ein Fehlschlag.
   */
  if (run.executor && run.executor !== 'claude-code') {
    pump.error(`Dieser Runner kann nur „claude-code" ausführen, verlangt war „${run.executor}"`)
    throw new RunFailure('unsupported_executor')
  }

  // § 7.3 ist nach dem MVP dran; bis dahin läuft auch ein „interaktiv"
  // gewünschter Lauf headless — sichtbar in der Zeitleiste, nicht heimlich.
  if (run.interactive) {
    pump.status('Interaktiver Modus ist noch nicht gebaut — der Lauf läuft headless')
  }

  // SCHRITT 3: kappen. Stilles Herunterstufen mit je einer Ereigniszeile.
  const decision = clampRun({
    requestedMode: run.permissionMode,
    requestedModel: run.model,
    requestedBudgetUsd: run.maxBudgetUsd,
    promptTrusted: run.promptTrusted,
  }, repo)
  for (const note of decision.notes) pump.status(note)
  if (decision.rejection) {
    pump.error(decision.rejection.message)
    throw new RunFailure(decision.rejection.code)
  }
  pump.status(`Repo „${repo.key}", Modus ${decision.mode}, Budget ${decision.budgetUsd} USD`)

  // SCHRITT 4: Material holen (§ 6).
  const runDir = join(ctx.config.stateDir, 'runs', run.$id)
  const filesDir = join(runDir, 'files')
  await mkdir(filesDir, { recursive: true })

  const { attachments } = await ctx.api.listAttachments(run.$id)
  const downloaded = attachments.length
    ? await downloadAttachments(ctx.api, run.$id, attachments, filesDir)
    : []
  if (downloaded.length) pump.status(`${downloaded.length} Anhänge geladen`)

  const promptPath = join(runDir, 'prompt.md')
  await writeFile(promptPath, buildPromptFile(run.promptSource, downloaded.map(entry => entry.path)), 'utf8')

  // SCHRITT 5: starten. Der Worktree kommt von der CLI, nicht von uns (§ 11).
  const worktreeName = `ai-${run.$id}`
  const args = ['-p', '--session-id', sessionId]
  if (decision.model) args.push('--model', decision.model)
  args.push(
    '--permission-mode', decision.mode,
    '--worktree', worktreeName,
    // NUR der files-Ordner DIESES Laufs — nicht der State-Ordner (§ 6),
    // sonst läse ein Lauf die Anhänge aller anderen.
    '--add-dir', filesDir,
  )
  if (Number.isFinite(decision.budgetUsd)) args.push('--max-budget-usd', String(decision.budgetUsd))
  args.push(
    '--append-system-prompt',
    `Referenz: Lauf ${run.$id} zu ${run.subjectType} ${run.subjectId}. Ticket-Bezug siehe prompt.`,
    // `stream-json` OHNE `--verbose` lehnt die CLI ab (§ 11, gemessen).
    '--output-format', 'stream-json',
    '--verbose',
  )

  log.info(`Starte ${ctx.config.claudeBin} für Lauf ${run.$id} in ${repo.path}`)
  const child = spawn(ctx.config.claudeBin, args, {
    cwd: repo.path,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  /**
   * DER PROMPT GEHT ÜBER STDIN, nicht als Argument. Zwei Gründe: die Länge
   * (`promptSource` darf 200 000 Zeichen haben — die Argumentliste eines
   * Prozesses darf das nicht) und das Zitieren (ein Auftragstext kann alles
   * enthalten, auch Anführungszeichen und Zeilenumbrüche).
   */
  const promptText = await readFile(promptPath, 'utf8')
  child.stdin.on('error', () => {})
  child.stdin.write(promptText)
  child.stdin.end()

  const transcriptPath = join(runDir, 'transcript.jsonl')
  const transcript = createWriteStream(transcriptPath, { flags: 'w' })

  /**
   * Der veränderliche Zustand des Mitlesens — BEWUSST EIN OBJEKT und keine
   * losen `let`-Variablen. Grund ist die Fluss-Analyse von TypeScript: ein
   * `let x: T | null = null`, das nur in einem Callback beschrieben wird, gilt
   * an der Leseseite weiter als `null` (bekannte Grenze, gemessen: „Property
   * 'costUsd' does not exist on type 'never'"). Der Bericht hätte dann nie
   * Kosten, Turns oder Verweigerungen gesehen — und zwar ohne dass irgendwo
   * ein Fehler stünde. Ein Feld eines annotierten Objekts behält seinen
   * deklarierten Typ.
   */
  const state: {
    summary: ResultSummary | null
    blocked: boolean
    brokenLines: number
    stderrEvents: number
    stderrTail: string
    timedOut: boolean
    cancelled: boolean
    shutdown: boolean
    killing: boolean
  } = {
    summary: null,
    blocked: false,
    brokenLines: 0,
    stderrEvents: 0,
    stderrTail: '',
    timedOut: false,
    cancelled: false,
    shutdown: false,
    killing: false,
  }

  const kill = () => {
    if (state.killing) return
    state.killing = true
    child.kill('SIGTERM')
    setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref?.()
  }

  const timeoutMs = ctx.config.maxRunMinutes * 60_000
  const timeoutTimer = setTimeout(() => {
    state.timedOut = true
    pump.error(`Zeitüberschreitung nach ${ctx.config.maxRunMinutes} min — der Lauf wird beendet`)
    kill()
  }, timeoutMs)
  timeoutTimer.unref?.()

  // Die Wache: sie liest den Rückkanal des Boards (§ 9) und das
  // Herunterfahren des Daemons. Beides endet in demselben SIGTERM/SIGKILL.
  const watchdog = setInterval(() => {
    if (state.killing) return
    if (pump.cancelled) {
      state.cancelled = true
      pump.status('Vom Board abgebrochen — der Agent wird beendet')
      kill()
      return
    }
    if (ctx.shutdownRequested()) {
      state.shutdown = true
      kill()
    }
  }, WATCHDOG_MS)
  watchdog.unref?.()

  const readStdout = (async () => {
    for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
      if (!line.trim()) continue
      transcript.write(`${line}\n`)

      let value: unknown
      try {
        value = JSON.parse(line)
      }
      catch {
        // Kaputte Zeile: zählen, nicht daran sterben. Sie steht im Transkript.
        state.brokenLines++
        continue
      }

      const result = readResultLine(value)
      if (result) state.summary = result
      // § 11: `status_category: 'blocked'` ist die EINE Quelle, die ein
      // freundliches „success" als das entlarvt, was es ist.
      if (isPostTurnSummary(value) && summaryStatusCategory(value) === 'blocked') state.blocked = true

      for (const draft of condenseStreamLine(value)) pump.push(draft)
      if (pump.pending >= FLUSH_AT_EVENTS) void pump.flush()
    }
  })()

  const readStderr = (async () => {
    for await (const line of createInterface({ input: child.stderr, crlfDelay: Infinity })) {
      if (!line.trim()) continue
      transcript.write(`${JSON.stringify({ type: 'runner_stderr', line })}\n`)
      state.stderrTail = `${state.stderrTail}${line}\n`.slice(-4000)
      if (state.stderrEvents < MAX_STDERR_EVENTS) {
        state.stderrEvents++
        pump.error(truncate(line, 4000))
      }
    }
  })()

  const exit = await new Promise<{ code: number, spawnError: string }>((resolve) => {
    child.on('error', error => resolve({ code: 127, spawnError: error.message }))
    child.on('close', code => resolve({ code: code ?? -1, spawnError: '' }))
  })
  clearTimeout(timeoutTimer)
  clearInterval(watchdog)
  await Promise.all([readStdout, readStderr])
  await new Promise<void>(resolve => transcript.end(resolve))
  await pump.flush()

  if (exit.spawnError) {
    pump.error(`Agent konnte nicht gestartet werden: ${exit.spawnError}`)
    throw new RunFailure('spawn_failed', exit.spawnError)
  }
  if (state.brokenLines) pump.status(`${state.brokenLines} unlesbare Protokollzeilen übersprungen`)

  // SIGINT/SIGTERM am Daemon: der Lauf wird als Fehlschlag geschlossen,
  // damit er nicht als „läuft" zurückbleibt.
  if (state.shutdown) throw new RunFailure('runner_shutdown')

  const durationMs = Date.now() - startedAt
  const outcome = deriveFinalStatus({
    timedOut: state.timedOut,
    cancelled: state.cancelled,
    sawResult: state.summary !== null,
    isError: state.summary?.isError ?? false,
    exitCode: exit.code,
    denials: state.summary?.denials ?? [],
    blocked: state.blocked,
  })

  /**
   * ABGEBROCHEN heisst: niemand will dieses Ergebnis mehr. Es wird deshalb
   * NICHT committet und es laufen keine Tests — die Arbeit liegt im Worktree
   * und kann von Hand angesehen werden.
   */
  if (outcome.status === 'cancelled') {
    await hooks.finish('cancelled', '', buildResultJson(emptyReport(durationMs, state.summary)))
    return
  }

  // SCHRITT 8: der Runner committet selbst (§ 11 — `acceptEdits` erlaubt kein
  // `git commit`).
  const worktree = join(repo.path, '.claude', 'worktrees', worktreeName)
  let branch = ''
  let commit = ''
  let diffstat = ''

  if (existsSync(worktree)) {
    branch = await currentBranch(worktree)
    /**
     * NIE AUF EINEM GESCHÜTZTEN BRANCH (§ 8.1). Der Worktree sollte hier gar
     * nicht stehen können — aber „sollte nicht" ist keine Sicherung, und der
     * Preis eines `git add -A` auf `main` wäre ein Commit in Davids
     * Hauptzweig, den niemand bestellt hat.
     */
    if (branch && repo.protectedBranches.includes(branch)) {
      pump.error(`Worktree steht auf geschütztem Branch „${branch}" — es wird nichts committet`)
      throw new RunFailure('protected_branch')
    }
    hooks.setWorkBranch(branch)

    const facts = await commitWorktree(worktree, buildCommitMessage({
      subjectType: run.subjectType,
      subjectId: run.subjectId,
      runId: run.$id,
      sessionId,
    }))
    commit = facts.commit
    diffstat = facts.diffstat
    pump.status(facts.committed
      ? `Committet auf ${facts.branch}: ${facts.diffstat || 'ohne Statistik'}`
      : 'Keine Änderungen im Worktree — nichts committet')
  }
  else {
    pump.status('Kein Worktree angelegt — nichts zu committen')
  }

  // SCHRITT 7 (nach dem Commit, damit die Tests den committeten Stand sehen):
  // Testbefehle. Ein Fehlschlag bricht die Kette NICHT ab — der Bericht soll
  // alle Ergebnisse zeigen, nicht nur bis zum ersten Roten.
  const tests = existsSync(worktree) && !state.timedOut
    ? await runTestCommands(run, worktree, ctx.config.maxRunMinutes, pump)
    : []

  // SCHRITT 9: Transkript hochladen, dann `finish`.
  const transcriptFileId = await uploadTranscript(ctx.api, run.$id, transcriptPath, pump)

  const report: RunReport = {
    branch,
    commit,
    diffstat,
    tests,
    durationMs: Date.now() - startedAt,
    costUsd: state.summary?.costUsd ?? 0,
    numTurns: state.summary?.numTurns ?? 0,
    // Das GEKLEMMTE Modell, nicht run.model (siehe RunReport.model).
    model: decision.model,
    transcriptFileId,
    workBranch: branch,
  }

  const error = outcome.error || (state.stderrTail && outcome.status === 'failed' ? lastLines(state.stderrTail, 5) : '')
  await hooks.finish(outcome.status, error, buildResultJson(report))
}

function emptyReport(durationMs: number, summary: ResultSummary | null): RunReport {
  return {
    branch: '',
    commit: '',
    diffstat: '',
    tests: [],
    durationMs,
    costUsd: summary?.costUsd ?? 0,
    numTurns: summary?.numTurns ?? 0,
    model: '',
    transcriptFileId: '',
    workBranch: '',
  }
}

async function runTestCommands(run: RunPayload, worktree: string, maxRunMinutes: number, pump: EventPump): Promise<TestOutcome[]> {
  const outcomes: TestOutcome[] = []
  for (const command of parseTestCommands(run.testCommands)) {
    /**
     * KEIN automatisches `pnpm install` (§ 11): ein Worktree hat weder
     * `node_modules` noch `.env`, das Nachinstallieren kostet Minuten und
     * landet in jedem Budget. Wer Abhängigkeiten braucht, schreibt den
     * Install als ERSTEN Testbefehl — sichtbar, gewollt, gemessen.
     */
    if (hasShellSyntax(command)) {
      pump.error(`Testbefehl „${command}" enthält Shell-Zeichen — es gibt keine Shell, er wird nicht ausgeführt`)
      outcomes.push({ cmd: command, exit: -1, tail: 'Nicht ausgeführt: Shell-Syntax wird nicht unterstützt (keine Shell).' })
      continue
    }
    const parts = splitCommand(command)
    const bin = parts[0]
    if (!bin) continue

    pump.status(`Test läuft: ${command}`)
    const result = await runCommand(bin, parts.slice(1), {
      cwd: worktree,
      timeoutMs: maxRunMinutes * 60_000,
    })
    const exit = result.timedOut ? -2 : result.code
    outcomes.push({ cmd: command, exit, tail: lastLines(result.output, 20) })
    pump.status(`Test „${command}" → ${result.timedOut ? 'Zeitüberschreitung' : `Exit ${exit}`}`)
  }
  return outcomes
}

async function uploadTranscript(api: RunnerApi, runId: string, transcriptPath: string, pump: EventPump): Promise<string> {
  try {
    let data = await readFile(transcriptPath)
    if (!data.length) return ''
    if (data.length > MAX_TRANSCRIPT_BYTES) {
      // Der Server lehnt darüber mit 413 ab. Lieber das ENDE behalten (dort
      // steht der Abschluss) als gar kein Protokoll.
      data = data.subarray(data.length - MAX_TRANSCRIPT_BYTES + 200)
      pump.status('Transkript gekürzt — nur das Ende wurde hochgeladen')
    }
    const { fileId } = await api.uploadTranscript(runId, data)
    return fileId
  }
  catch (error) {
    // Ein fehlendes Transkript darf den Bericht nicht kosten.
    pump.error(`Transkript konnte nicht hochgeladen werden: ${(error as Error).message}`)
    return ''
  }
}
