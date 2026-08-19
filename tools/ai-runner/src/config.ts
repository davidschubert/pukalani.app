import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { PERMISSION_MODES, type PermissionMode } from './protocol.ts'

/**
 * Die lokale Allowlist — docs/plans/AI-RUNNER.md § 7.1/§ 8.1.
 *
 * DIE WICHTIGSTE EINZELREGEL DES GANZEN SYSTEMS: die Datenbank darf
 * AUSWÄHLEN, was diese Datei ERLAUBT — nie umgekehrt. Deshalb reist über die
 * Naht nur ein `repoKey`, nie ein Pfad; erlaubte Modi, Modelle, Budget-Deckel
 * und geschützte Branches stehen ausschliesslich hier. Läge die Allowlist in
 * der Datenbank, wäre jede Lücke in der Betreiber-Konsole eine
 * Remote-Code-Execution auf diesem Laptop.
 *
 * Alles in dieser Datei ausser `loadRunnerConfig` ist PUR — die Prüfungen sind
 * Sicherungen, und eine Sicherung, die man nur durch Starten des Daemons
 * auslösen kann, wird nie einzeln gegengeprüft (scripts/smoke.mjs).
 */

/** Ein Konfigurationsfehler, der dem Menschen gilt — nicht ein Stacktrace. */
export class ConfigError extends Error {
  override name = 'ConfigError'
}

export interface RepoRule {
  /** Der Schlüssel, unter dem der Lauf dieses Repo wählt */
  key: string
  path: string
  /** Auf diesen Branches wird NIE gearbeitet (§ 8.1) */
  protectedBranches: string[]
  allowedModes: PermissionMode[]
  /** null = keine Einschränkung; sonst gewinnt der erste Eintrag als Rückfall */
  allowedModels: string[] | null
  maxBudgetUsd: number
}

export interface RunnerConfig {
  endpoint: string
  secretFile: string
  pollSeconds: number
  heartbeatSeconds: number
  maxRunMinutes: number
  stateDir: string
  /** Ausführbare Datei der Claude-Code-CLI (launchd hat einen kargen PATH) */
  claudeBin: string
  /**
   * Datei mit einem langlebigen CLI-Token (`claude setup-token`), das dem
   * claude-Prozess als CLAUDE_CODE_OAUTH_TOKEN mitgegeben wird. NÖTIG für den
   * Daemon-Betrieb: das normale OAuth-Login der CLI läuft ab, und headless
   * kann sie sich nicht re-authentifizieren — der erste Feature-Lauf starb
   * am 2026-08-18 genau daran (401 bei \$0.00/1 Turn). '' = kein Token-File,
   * die CLI nutzt ihre eigene gespeicherte Anmeldung.
   */
  claudeTokenFile: string
  /**
   * Verzeichnisse, die dem PATH der KIND-Prozesse vorangestellt werden.
   * launchd startet den Daemon mit kargem PATH (/usr/bin:/bin) — `claude`
   * rettet `claudeBin` (absolut), aber die TESTBEFEHLE eines Laufs fanden ihr
   * `pnpm` nicht (Exit 127 im ersten Prod-Lauf, 2026-08-18: pnpm liegt in
   * /opt/homebrew/bin). Konfiguration statt Hardcode, weil der Ort je
   * Maschine anders ist (Homebrew, corepack, nvm).
   */
  extraPath: string[]
  /**
   * Native macOS-Mitteilung bei succeeded/needs_input/failed (notify.ts).
   * Vorgabe `true`; `false` schaltet sie ab. cancelled meldet nie (der
   * Abbrechende weiß es schon).
   */
  macosNotifications: boolean
  repos: Record<string, RepoRule>
}

/**
 * Der Claim ist serverseitig auf 30/min gedrosselt (§ 5: „Ein Poll-Loop mit
 * Fehler ist eine Selbst-DoS gegen die eigene Konsole"). Unter 2 Sekunden wird
 * deshalb nicht gepollt — und zwar geklemmt, nicht nur dokumentiert: eine
 * Zahl in einer Datei, die man von Hand tippt, ist irgendwann eine 0.
 */
export const MIN_POLL_SECONDS = 2

export const DEFAULT_POLL_SECONDS = 3
export const DEFAULT_HEARTBEAT_SECONDS = 60
export const DEFAULT_MAX_RUN_MINUTES = 30

/** `~` und `~/…` gegen das Home-Verzeichnis auflösen — sonst legt Node ein Verzeichnis namens „~" an. */
export function expandHome(value: string, home: string): string {
  if (value === '~') return home
  if (value.startsWith('~/')) return join(home, value.slice(2))
  return value
}

/** Wo liegt die Config? Env schlägt Vorgabe — der Testlauf braucht eine eigene Datei. */
export function resolveConfigPath(env: Record<string, string | undefined>, home: string): string {
  const override = env.PUKALANI_RUNNER_CONFIG?.trim()
  if (override) return expandHome(override, home)
  return join(home, '.config', 'pukalani-runner', 'config.json')
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ConfigError(`${where}: erwartet ein Objekt`)
  }
  return value as Record<string, unknown>
}

function readString(source: Record<string, unknown>, key: string, where: string): string {
  const value = source[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new ConfigError(`${where}.${key}: fehlt oder ist keine nicht-leere Zeichenkette`)
  }
  return value.trim()
}

function readNumber(source: Record<string, unknown>, key: string, where: string, fallback: number): number {
  const value = source[key]
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ConfigError(`${where}.${key}: erwartet eine positive Zahl`)
  }
  return value
}

function readStringArray(source: Record<string, unknown>, key: string, where: string): string[] | null {
  const value = source[key]
  if (value === undefined) return null
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string' || !entry.trim())) {
    throw new ConfigError(`${where}.${key}: erwartet eine Liste nicht-leerer Zeichenketten`)
  }
  return (value as string[]).map(entry => entry.trim())
}

/**
 * Die Config prüfen und vervollständigen. Wirft mit einem Satz, den man ohne
 * Quelltext versteht — diese Datei tippt ein Mensch.
 */
export function parseRunnerConfig(raw: unknown, home: string): RunnerConfig {
  const root = asRecord(raw, 'config.json')

  const endpoint = readString(root, 'endpoint', 'config.json').replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(endpoint)) {
    throw new ConfigError('config.json.endpoint: muss mit http:// oder https:// beginnen')
  }

  const secretFile = expandHome(readString(root, 'secretFile', 'config.json'), home)
  if (!isAbsolute(secretFile)) {
    throw new ConfigError('config.json.secretFile: muss ein absoluter Pfad sein')
  }

  const pollSeconds = Math.max(MIN_POLL_SECONDS, readNumber(root, 'pollSeconds', 'config.json', DEFAULT_POLL_SECONDS))
  const heartbeatSeconds = readNumber(root, 'heartbeatSeconds', 'config.json', DEFAULT_HEARTBEAT_SECONDS)
  const maxRunMinutes = readNumber(root, 'maxRunMinutes', 'config.json', DEFAULT_MAX_RUN_MINUTES)

  const stateDirRaw = typeof root.stateDir === 'string' && root.stateDir.trim()
    ? root.stateDir.trim()
    : join(home, '.local', 'state', 'pukalani-runner')
  const stateDir = expandHome(stateDirRaw, home)
  if (!isAbsolute(stateDir)) {
    throw new ConfigError('config.json.stateDir: muss ein absoluter Pfad sein')
  }

  const claudeBin = typeof root.claudeBin === 'string' && root.claudeBin.trim() ? root.claudeBin.trim() : 'claude'
  const claudeTokenFile = typeof root.claudeTokenFile === 'string' ? expandHome(root.claudeTokenFile.trim(), home) : ''
  const extraPath = Array.isArray(root.extraPath)
    ? root.extraPath.filter((entry): entry is string => typeof entry === 'string' && entry.startsWith('/'))
    : []
  // Vorgabe AN: nur ein ausdrückliches `false` schaltet die Mitteilung ab.
  const macosNotifications = root.macosNotifications === undefined ? true : root.macosNotifications
  if (typeof macosNotifications !== 'boolean') {
    throw new ConfigError('config.json.macosNotifications: erwartet true oder false')
  }

  const reposRaw = asRecord(root.repos, 'config.json.repos')
  const keys = Object.keys(reposRaw)
  if (!keys.length) {
    throw new ConfigError('config.json.repos: leer — ohne freigegebenes Repo kann kein Lauf starten')
  }

  const repos: Record<string, RepoRule> = {}
  for (const key of keys) {
    const where = `config.json.repos.${key}`
    const entry = asRecord(reposRaw[key], where)

    const path = expandHome(readString(entry, 'path', where), home)
    if (!isAbsolute(path)) throw new ConfigError(`${where}.path: muss ein absoluter Pfad sein`)

    const modes = readStringArray(entry, 'allowedModes', where)
    if (!modes || !modes.length) {
      throw new ConfigError(`${where}.allowedModes: fehlt — ohne erlaubten Modus gibt es nichts freizugeben`)
    }
    for (const mode of modes) {
      if (!(PERMISSION_MODES as readonly string[]).includes(mode)) {
        throw new ConfigError(`${where}.allowedModes: „${mode}" ist kein Modus der CLI (${PERMISSION_MODES.join(', ')})`)
      }
    }

    const maxBudget = entry.maxBudgetUsd
    if (typeof maxBudget !== 'number' || !Number.isFinite(maxBudget) || maxBudget <= 0) {
      throw new ConfigError(`${where}.maxBudgetUsd: erwartet eine positive Zahl — ein Lauf ohne Deckel ist keiner`)
    }

    const allowedModels = readStringArray(entry, 'allowedModels', where)
    if (allowedModels !== null && !allowedModels.length) {
      throw new ConfigError(`${where}.allowedModels: leer — weglassen heisst „alle", eine leere Liste hiesse „keins"`)
    }

    repos[key] = {
      key,
      path,
      protectedBranches: readStringArray(entry, 'protectedBranches', where) ?? ['main'],
      allowedModes: modes as PermissionMode[],
      allowedModels,
      maxBudgetUsd: maxBudget,
    }
  }

  return { endpoint, secretFile, pollSeconds, heartbeatSeconds, maxRunMinutes, stateDir, claudeBin, claudeTokenFile, extraPath, macosNotifications, repos }
}

/**
 * Das Bearer-Token hat die Form `<rowId>.<secret>` (§ 5) und erscheint bei der
 * Registrierung GENAU EINMAL. Hier wird nur die FORM geprüft — ob es stimmt,
 * sagt der erste 401.
 *
 * Wirft ohne den Wert zu nennen: eine Fehlermeldung ist ein Log-Eintrag, und
 * dieses Secret ist Code-Ausführung auf diesem Rechner.
 */
export function parseRunnerToken(raw: string): string {
  const token = raw.split('\n')[0]?.trim() ?? ''
  if (!token) throw new ConfigError('secretFile: leer — dort gehört das Token aus der Runner-Registrierung hinein')
  const separator = token.indexOf('.')
  if (separator <= 0 || separator === token.length - 1) {
    throw new ConfigError('secretFile: erwartet ein Token der Form <runnerId>.<secret> (eine Zeile, wie im Board angezeigt)')
  }
  return token
}

export interface LoadedConfig {
  config: RunnerConfig
  /** NIE loggen, nie drucken, nie in eine Fehlermeldung */
  token: string
  configPath: string
}

/** Config + Secret laden. Die EINZIGE Funktion hier, die das Dateisystem anfasst. */
export function loadRunnerConfig(env: Record<string, string | undefined> = process.env, home: string = homedir()): LoadedConfig {
  const configPath = resolveConfigPath(env, home)

  let raw: string
  try {
    raw = readFileSync(configPath, 'utf8')
  }
  catch {
    throw new ConfigError(`Config nicht lesbar: ${configPath}\nAnlegen (siehe README) oder PUKALANI_RUNNER_CONFIG setzen.`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch (error) {
    throw new ConfigError(`Config ist kein gültiges JSON (${configPath}): ${(error as Error).message}`)
  }

  const config = parseRunnerConfig(parsed, home)

  let secretRaw: string
  try {
    secretRaw = readFileSync(config.secretFile, 'utf8')
  }
  catch {
    throw new ConfigError(`Secret-Datei nicht lesbar: ${config.secretFile}`)
  }

  return { config, token: parseRunnerToken(secretRaw), configPath }
}

/**
 * Die Zusammenfassung für `--dry-config`. OHNE Secret — gezeigt wird nur, WO
 * es liegt. Wer sein Token sehen will, öffnet die Datei selbst; ein Daemon,
 * der es auf Wunsch druckt, druckt es irgendwann auch in ein Log.
 */
export function describeConfig(config: RunnerConfig, configPath: string): string {
  const lines = [
    `Config:        ${configPath}`,
    `Endpunkt:      ${config.endpoint}`,
    `Secret-Datei:  ${config.secretFile} (Inhalt wird nicht angezeigt)`,
    `Poll:          alle ${config.pollSeconds}s (Mindestabstand ${MIN_POLL_SECONDS}s)`,
    `Heartbeat:     alle ${config.heartbeatSeconds}s`,
    `Laufzeit max:  ${config.maxRunMinutes} min`,
    `Ablage:        ${config.stateDir}`,
    `CLI:           ${config.claudeBin}`,
    `Mitteilungen:  ${config.macosNotifications ? 'an' : 'aus'} (macOS)`,
    'Repos:',
  ]
  for (const repo of Object.values(config.repos)) {
    lines.push(`  ${repo.key}`)
    lines.push(`    Pfad:      ${repo.path}`)
    lines.push(`    geschützt: ${repo.protectedBranches.join(', ') || '—'}`)
    lines.push(`    Modi:      ${repo.allowedModes.join(', ')}`)
    lines.push(`    Modelle:   ${repo.allowedModels ? repo.allowedModels.join(', ') : 'alle'}`)
    lines.push(`    Budget:    max ${repo.maxBudgetUsd} USD`)
  }
  return lines.join('\n')
}

/** Was der Heartbeat meldet — ANZEIGE-KOPIE, keine Wahrheit (§ 8.1). */
export function capabilitiesOf(config: RunnerConfig, version: string): Record<string, unknown> {
  const modes = new Set<string>()
  for (const repo of Object.values(config.repos)) {
    for (const mode of repo.allowedModes) modes.add(mode)
  }
  return { repos: Object.keys(config.repos), modes: [...modes], version }
}
