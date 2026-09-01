#!/usr/bin/env node
/**
 * Löscht die sechs TOTEN Alt-Tabellen der portfolio-Instanz.
 *
 *   pnpm ops:cleanup-portfolio-legacy            # Trockenlauf (zeigt nur)
 *   pnpm ops:cleanup-portfolio-legacy -- --apply # löscht
 *
 * WARUM ES DAS GIBT: `portfolio` (Davids Silo, api.pukalani.app) trägt sechs
 * Tabellen aus der Zeit VOR der Layer-Aufräumung — anderswo längst umbenannt
 * oder entfernt: `sites` → `websites`, `feature_catalog` → `product_catalog`,
 * `workspaces`/`workspace_invites`/`workspace_members`/`feedback` ersatzlos
 * gestrichen. Kein aktueller portfolio-Layer (admin/analytics/domains/pages/
 * system) referenziert sie; der AU4-Schema-Paritäts-Wächter meldet sie als
 * „Alt-/unbekannte Tabelle". Nach dem Löschen ist portfolio dort sauber.
 *
 * DEFENSIV: Jede Tabelle wird UNMITTELBAR VOR dem Löschen erneut auf 0 Zeilen
 * geprüft — trägt eine wider Erwarten Daten, bleibt sie stehen (kein
 * Datenverlust möglich). Am 2026-08-16 waren alle sechs leer + unreferenziert.
 *
 * Schlüssel werden nie ausgegeben. Ohne `--apply` wird NICHTS geschrieben.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Seit 2026-08-31 nach der Migrations-Konvention — die alte
// apps/portfolio/.env.production ist dorthin UMGEZOGEN (fehlte im Repo-Baum
// jedes Worktrees; Entscheidung beim Ausgerollt-Flag des Paritäts-Wächters).
const ENV_PATH = join(homedir(), '.appwrite-secrets/migrations/portfolio.env')
const APPLY = process.argv.includes('--apply')

const DEAD = ['sites', 'workspaces', 'workspace_invites', 'workspace_members', 'feature_catalog', 'feedback']

if (!existsSync(ENV_PATH)) {
  console.error(`✗ ${ENV_PATH} nicht gefunden — liegt nur auf Davids Rechner (Migrations-Ablage).`)
  process.exit(1)
}

const env = {}
for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
  if (!m || m[1].startsWith('#')) continue
  let v = m[2]
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) v = v.slice(1, -1)
  env[m[1]] = v
}
const cfg = {
  endpoint: env.NUXT_PUBLIC_APPWRITE_ENDPOINT,
  project: env.NUXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: env.NUXT_PUBLIC_APPWRITE_DATABASE_ID,
  key: env.NUXT_APPWRITE_MIGRATIONS_KEY || env.NUXT_APPWRITE_KEY,
}
if (!cfg.endpoint || !cfg.project || !cfg.key || !cfg.databaseId) {
  console.error('✗ Env unvollständig (Endpoint/Project/DB/Key).')
  process.exit(1)
}
const H = { 'X-Appwrite-Project': cfg.project, 'X-Appwrite-Key': cfg.key }

console.log(`Projekt ${cfg.project} @ ${cfg.endpoint} — Modus: ${APPLY ? 'LÖSCHEND' : 'trocken'}\n`)

let deleted = 0
let skipped = 0
for (const table of DEAD) {
  const q = encodeURIComponent(JSON.stringify({ method: 'limit', values: [1] }))
  const rc = await fetch(`${cfg.endpoint}/tablesdb/${cfg.databaseId}/tables/${table}/rows?queries%5B%5D=${q}`, {
    headers: H,
    signal: AbortSignal.timeout(25_000),
  })
  if (rc.status === 404) { console.log(`↷ ${table.padEnd(20)} existiert nicht mehr — skip`); continue }
  if (!rc.ok) { console.log(`✖ ${table.padEnd(20)} Zeilen-Check HTTP ${rc.status} — SKIP (Sicherheit)`); skipped++; continue }
  const total = (await rc.json()).total
  if (total !== 0) { console.log(`✖ ${table.padEnd(20)} hat ${total} Zeilen — NICHT gelöscht (Datenschutz)`); skipped++; continue }
  if (!APPLY) { console.log(`(trocken) würde löschen: ${table}  (0 Zeilen)`); continue }
  const del = await fetch(`${cfg.endpoint}/tablesdb/${cfg.databaseId}/tables/${table}`, {
    method: 'DELETE',
    headers: H,
    signal: AbortSignal.timeout(25_000),
  })
  if (del.ok || del.status === 204) { console.log(`✔ gelöscht: ${table}`); deleted++ }
  else { console.log(`✖ ${table.padEnd(20)} DELETE HTTP ${del.status}`); skipped++ }
}

if (APPLY) {
  console.log(`\n${deleted} gelöscht, ${skipped} übersprungen.`)
  if (skipped > 0) process.exit(1)
}
else {
  console.log('\nTrockenlauf — nichts gelöscht. Mit `-- --apply` scharf stellen.')
}
