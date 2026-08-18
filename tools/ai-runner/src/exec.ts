import { spawn } from 'node:child_process'

/**
 * Fremde Programme starten — IMMER ohne Shell.
 *
 * `spawn(bin, args)` ohne `shell: true` ist hier keine Stilfrage: die
 * Argumente eines Laufs (Branch-Name, Modell, Prompt-Pfad, Testbefehl) kommen
 * über die Naht von einem Board, dessen Inhalte teilweise aus GAST-Feedback
 * stammen (§ 8.2). Mit Shell wäre ein `; rm -rf ~` in einem Feld eine
 * Befehlszeile; ohne Shell ist es ein Argument, das ein Programm nicht kennt.
 */

export interface CommandResult {
  code: number
  /** stdout und stderr in Reihenfolge — was ein Mensch im Terminal sähe */
  output: string
  timedOut: boolean
}

export interface CommandOptions {
  cwd: string
  timeoutMs?: number
  /** Ringpuffer-Grenze: ein Testlauf kann Megabytes ausgeben, uns interessiert das Ende */
  maxOutputChars?: number
  /** Verzeichnisse VOR dem geerbten PATH — siehe childEnv() */
  pathPrefix?: string[]
}

/**
 * Umgebung für Kind-Prozesse: der geerbte PATH, davor die konfigurierten
 * Verzeichnisse. Unter launchd erbt der Daemon nur /usr/bin:/bin — ohne
 * diesen Vorbau enden Testbefehle wie `pnpm lint` als Exit 127, obwohl
 * dieselbe Config im Terminal funktioniert (erster Prod-Lauf, 2026-08-18).
 */
export function childEnv(pathPrefix: readonly string[] | undefined): NodeJS.ProcessEnv {
  if (!pathPrefix?.length) return process.env
  const inherited = process.env.PATH ?? ''
  const merged = [...pathPrefix, ...(inherited ? [inherited] : [])].join(':')
  return { ...process.env, PATH: merged }
}

const DEFAULT_TIMEOUT_MS = 10 * 60_000
const DEFAULT_MAX_OUTPUT = 200_000

export function runCommand(bin: string, args: string[], options: CommandOptions): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'], env: childEnv(options.pathPrefix) })
    const limit = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT
    let output = ''
    let timedOut = false

    const append = (chunk: Buffer) => {
      output += chunk.toString('utf8')
      // Vorne abschneiden, nicht hinten: das Ende erklärt den Fehlschlag.
      if (output.length > limit) output = output.slice(output.length - limit)
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 10_000).unref?.()
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    timer.unref?.()

    child.on('error', (error) => {
      clearTimeout(timer)
      // Kein Programm dieses Namens: das ist ein Ergebnis, kein Absturz des
      // Runners — der Bericht soll es zeigen.
      resolve({ code: 127, output: `${output}${error.message}`, timedOut })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? -1, output, timedOut })
    })
  })
}

/**
 * Einen Testbefehl in Wörter zerlegen — `"pnpm -r test"` ⇒
 * `['pnpm', '-r', 'test']`.
 *
 * DAS IST DIE GANZE GRAMMATIK, und sie hat eine harte Grenze: es gibt keine
 * Shell, also keine Pipes, keine Umleitungen, keine Variablen, keine
 * Anführungszeichen. Das ist Absicht (siehe `runCommand`) — wer eine Pipeline
 * braucht, schreibt sie in ein Skript im Repo und ruft das Skript auf.
 */
export function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean)
}

/**
 * Erkennt Shell-Syntax in einem Testbefehl. Ein solcher Befehl wird NICHT
 * ausgeführt, sondern als Fehlschlag mit Begründung gemeldet: ohne Shell
 * landete das `|` als Argument beim Programm, und die Fehlermeldung („unknown
 * option") erklärte niemandem, was wirklich los war.
 */
export function hasShellSyntax(command: string): boolean {
  return /[|&;<>$`(){}*?~\\'"]/.test(command)
}

/** Die letzten N Zeilen — der Teil einer Ausgabe, der den Ausgang erklärt. */
export function lastLines(text: string, count: number): string {
  const lines = text.replace(/\s+$/, '').split('\n')
  return lines.slice(Math.max(0, lines.length - count)).join('\n')
}
