/**
 * VERSIONS-MANIFEST ZUR BAUZEIT (2026-08-28).
 *
 * Die Systemseite (/dashboard/system) löste Paketversionen und Layer-Inhalte
 * bisher zur LAUFZEIT aus dem Dateisystem auf: `require('<pkg>/package.json')`,
 * Hochlaufen bis `pnpm-workspace.yaml`, rekursives Scannen von `packages/*`.
 * Lokal geht das — in Produktion nicht: deployt wird nur `.output/` (rsync im
 * Deploy-Workflow), dort gibt es weder Monorepo noch `package.json` noch
 * node_modules-Metadaten. Die Seite zeigte deshalb überall „unknown" und
 * „0 Dateien"; echt waren nur die Appwrite-Version (Live-HTTP) und `buildSha`.
 *
 * Kur ist dasselbe Muster wie `buildSha` in `packages/core/nuxt.config.ts`:
 * einmal zur BAUZEIT auswerten und ins Bundle backen. Der Build-Stand IST der
 * ausgelieferte Stand — ein Manifest kann also nicht „veralten", ohne dass ein
 * neuer Build es ersetzt.
 *
 * Diese Datei liegt BEWUSST in `build/` neben der `nuxt.config` (wie
 * `packages/core/build/nitroRouteTypes.ts`): sie wird nicht auto-gescannt,
 * sondern nur explizit importiert — von der `nuxt.config` (Bauzeit) und von
 * `server/utils/*` (Laufzeit-Fallback im Dev, wo das Repo wirklich daliegt).
 */
import { createRequire } from 'node:module'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { LayerCategory, LayerInfo, SystemManifest, SystemManifestDependency } from '../shared/types/system'

const require = createRequire(join(process.cwd(), 'package.json'))

/** Die Produkt-Layer, deren Inhalt die Systemseite aufschlüsselt. */
export const LAYER_PKGS = ['@pukalani/core', '@pukalani/comments', '@pukalani/admin', '@pukalani/themes']

// Kategorisierte Laufzeit-Abhängigkeiten (Anzeige + Update-Whitelist).
export const DEP_GROUPS: Record<string, string[]> = {
  Framework: ['nuxt', 'vue', '@nuxt/ui'],
  State: ['pinia', '@pinia/nuxt'],
  i18n: ['@nuxtjs/i18n'],
  Appwrite: ['node-appwrite', 'appwrite'],
  Validation: ['zod'],
  Icons: ['@iconify-json/ph', '@iconify-json/circle-flags'],
}

/** Flache Liste aller bekannten Pakete — Whitelist für den Update-Endpoint. */
export const ALL_DEP_NAMES: string[] = Object.values(DEP_GROUPS).flat()

/**
 * Aufgelöste Version eines Pakets — best effort. Erst direkter package.json-Import;
 * scheitert der (viele Pakete sperren ./package.json via "exports"), wird vom
 * aufgelösten Entry nach oben bis zur passenden package.json gelaufen.
 */
export function pkgVersion(name: string): string {
  try {
    return (require(`${name}/package.json`) as { version?: string }).version ?? 'unknown'
  }
  catch {
    // exports-Sperre → über den Entry-Pfad nach oben suchen
  }
  try {
    let dir = dirname(require.resolve(name))
    for (let i = 0; i < 8; i++) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string, version?: string }
        if (pkg.name === name) return pkg.version ?? 'unknown'
      }
      catch {
        // hier keine/andere package.json — weiter hoch
      }
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  catch {
    // Entry nicht auflösbar (z.B. @nuxt/ui sperrt "." für require)
  }
  // Letzter Ausweg: node_modules/<name>/package.json direkt lesen (folgt pnpm-Symlinks,
  // umgeht die exports-Sperre). Vom cwd nach oben bis zum Root-node_modules.
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { version?: string }
      if (pkg.version) return pkg.version
    }
    catch {
      // hier nicht installiert — weiter hoch
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return 'unknown'
}

/** Monorepo-Root finden: vom cwd nach oben bis pnpm-workspace.yaml liegt. */
export function workspaceRoot(): string | null {
  let dir = process.cwd()
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

/**
 * Datei-Namen in einem Verzeichnis sammeln (optional rekursiv, optional
 * Namensfilter). Die passende Endung wird entfernt; bei rekursivem Scan bleibt
 * der Unterpfad erhalten (z.B. „admin/users/index.get“, „auth/AuthLoginForm“).
 */
export function listFiles(baseDir: string, exts: string[], recursive: boolean, namePattern?: RegExp, sub = ''): string[] {
  const dir = sub ? join(baseDir, sub) : baseDir
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const rel = sub ? `${sub}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (recursive) out.push(...listFiles(baseDir, exts, true, namePattern, rel))
      continue
    }
    if (!exts.some(e => entry.name.endsWith(e))) continue
    if (namePattern && !namePattern.test(entry.name)) continue
    let name = rel
    for (const e of exts) {
      if (name.endsWith(e)) { name = name.slice(0, -e.length); break }
    }
    out.push(name)
  }
  return out
}

// Inhalts-Kategorien eines Nuxt-Layers (key wird im UI via i18n übersetzt).
export const CATEGORIES: { key: string, path: string, exts: string[], recursive: boolean, namePattern?: RegExp }[] = [
  { key: 'components', path: 'app/components', exts: ['.vue'], recursive: true },
  { key: 'composables', path: 'app/composables', exts: ['.ts'], recursive: false },
  { key: 'stores', path: 'app/stores', exts: ['.ts'], recursive: false },
  { key: 'pages', path: 'app/pages', exts: ['.vue'], recursive: true },
  { key: 'layouts', path: 'app/layouts', exts: ['.vue'], recursive: false },
  { key: 'middleware', path: 'app/middleware', exts: ['.ts'], recursive: false },
  { key: 'plugins', path: 'app/plugins', exts: ['.ts'], recursive: false },
  { key: 'serverRoutes', path: 'server/api', exts: ['.ts'], recursive: true },
  { key: 'serverUtils', path: 'server/utils', exts: ['.ts'], recursive: false },
  // Nur nummerierte Migrationen (NNN-…), keine Helfer wie verify-schema.ts
  { key: 'migrations', path: 'scripts/migrations', exts: ['.ts'], recursive: false, namePattern: /^\d{3}-.*\.ts$/ },
  { key: 'types', path: 'shared/types', exts: ['.ts'], recursive: false },
  { key: 'locales', path: 'i18n/locales', exts: ['.json'], recursive: false },
]

/**
 * Inhaltsaufschlüsselung eines Produkt-Layers (@pukalani/<short> → packages/<short>):
 * Datei-Anzahl je Kategorie. Best effort aus dem Dateisystem — fehlt das
 * Quellverzeichnis (also überall dort, wo nur `.output/` liegt), bleibt
 * `categories` leer. Genau deshalb wird das Ergebnis zur Bauzeit eingefroren.
 *
 * `version` ist nur der RÜCKFALL: die Wahrheit steht in der package.json des
 * Layers selbst. Über `pkgVersion` (App-node_modules) käme sie nur für Layer,
 * die in den Dependencies DIESER App stehen — `@pukalani/comments` stand z.B.
 * in control dauerhaft auf „unknown", obwohl seine Dateien gezählt wurden.
 */
export function computeLayerBreakdown(name: string, version: string): LayerInfo {
  const root = workspaceRoot()
  const short = name.replace('@pukalani/', '')
  const dir = root ? join(root, 'packages', short) : null

  let description: string | null = null
  const categories: LayerCategory[] = []
  let total = 0

  if (dir && existsSync(dir)) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { description?: string, version?: string }
      description = pkg.description ?? null
      version = pkg.version ?? version
    }
    catch {
      // keine/unlesbare package.json — ohne Beschreibung
    }
    for (const c of CATEGORIES) {
      const items = listFiles(join(dir, c.path), c.exts, c.recursive, c.namePattern).sort()
      if (items.length > 0) {
        categories.push({ key: c.key, count: items.length, items })
        total += items.length
      }
    }
  }

  return { name, version, description, total, categories }
}

/**
 * Das Manifest — EINMAL zur Bauzeit gebaut, von `nuxt.config.ts` in die
 * (server-only) runtimeConfig gelegt. Alles darin ist der Stand des Builds:
 * die aufgelösten Paketversionen, die Layer-Inhalte und Name/Version der App.
 */
export function buildSystemManifest(): SystemManifest {
  let appName = 'app'
  let appVersion = ''
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { name?: string, version?: string }
    appName = pkg.name ?? appName
    appVersion = pkg.version ?? appVersion
  }
  catch {
    // package.json der App nicht lesbar — Defaults
  }

  const dependencies: SystemManifestDependency[] = []
  for (const [category, names] of Object.entries(DEP_GROUPS)) {
    for (const name of names) dependencies.push({ name, version: pkgVersion(name), category })
  }

  return {
    builtAt: new Date().toISOString(),
    app: { name: appName, version: appVersion },
    dependencies,
    layers: LAYER_PKGS.map(name => computeLayerBreakdown(name, pkgVersion(name))),
  }
}
