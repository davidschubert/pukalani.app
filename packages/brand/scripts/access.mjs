import { Query } from 'node-appwrite'
import {
  APP_CONFIG_ROW,
  APP_CONFIG_TABLE,
  BRAND_TABLES,
  announceTarget,
  isNotFound,
  listAll,
  readBrandOpsEnv,
} from './lib/brandOps.mjs'

/**
 * WER IST DRIN, UND WIE OFFEN IST DIE BETA? (`pnpm brand:access [--mode …]`)
 *
 *   pnpm brand:access                  listet Zugänge + zeigt den Modus
 *   pnpm brand:access --mode invite    stellt den Aufnahme-Modus um
 *
 * ── DREI MODI, ZWEI FRAGEN (shared/brandAccess.ts) ────────────────────────
 *   closed  keine NEUEN Zugänge; bestehende Zeilen bleiben gültig
 *   invite  neue nur per Einladung
 *   open    jedes eingeloggte, VERIFIZIERTE Konto darf
 *
 * `closed` und `invite` verhalten sich im GATE identisch — der Unterschied
 * liegt in der Einlösung. Ein Stopp ist deshalb keine Enteignung der
 * Beta-Tester: wer drin ist, bleibt drin.
 *
 * ── DER ENTZUG SCHLÄGT AUCH `open` ────────────────────────────────────────
 * Eine widerrufene Zeile bleibt widerrufen, egal wie offen die Beta steht.
 * Deshalb zeigt die Liste `revokedAt` mit an: im Modus `open` sind die
 * WIDERRUFENEN Zeilen die einzigen, die überhaupt noch etwas bedeuten.
 *
 * ── DER MODUS IST EIN LAUFZEIT-FLAG, KEIN DEPLOY ──────────────────────────
 * Er lebt in `app_config.brandAdmissionMode` (system-038). Fehlt die Spalte
 * oder die Zeile, liest der Server `closed` (fail-closed) — dieses Skript sagt
 * das dann ausdrücklich, statt einen Wert zu erfinden.
 */

const args = process.argv.slice(2)
const modeIndex = args.indexOf('--mode')
const mode = modeIndex >= 0 ? args[modeIndex + 1] : null
const VALID_MODES = ['closed', 'invite', 'open']

if (modeIndex >= 0 && !VALID_MODES.includes(mode)) {
  console.error(`Nutzung: pnpm brand:access [--mode ${VALID_MODES.join('|')}]`)
  process.exit(1)
}

const env = readBrandOpsEnv()

async function readMode() {
  try {
    const row = await env.tablesDB.getRow({
      databaseId: env.databaseId, tableId: APP_CONFIG_TABLE, rowId: APP_CONFIG_ROW,
    })
    return { value: row.brandAdmissionMode ?? null, exists: true }
  }
  catch (error) {
    if (isNotFound(error)) return { value: null, exists: false }
    throw error
  }
}

if (mode) {
  announceTarget(env, `Aufnahme-Modus auf '${mode}' stellen`)
  const current = await readMode()
  if (!current.exists) {
    console.error('✗ app_config/global fehlt auf dieser Instanz — erst bootstrappen, dann erneut.')
    process.exit(1)
  }
  await env.tablesDB.updateRow({
    databaseId: env.databaseId,
    tableId: APP_CONFIG_TABLE,
    rowId: APP_CONFIG_ROW,
    data: { brandAdmissionMode: mode },
  })
  console.log(`✔ Aufnahme-Modus: ${current.value ?? '(nicht gesetzt ⇒ closed)'} → ${mode}`)
  console.log('')
}

const current = await readMode()
console.log(`Instanz : ${env.endpoint} / ${env.projectId}`)
console.log(`Modus   : ${current.value ?? '(nicht gesetzt ⇒ closed)'}`)
console.log('')

let rows = []
try {
  rows = await listAll(env, BRAND_TABLES.access, [Query.orderDesc('$createdAt')])
}
catch (error) {
  if (!isNotFound(error)) throw error
  console.log('Keine brand_access-Tabelle — die brand-Migrationen liefen hier noch nicht.')
  process.exit(0)
}

if (!rows.length) {
  console.log('Keine Zugangs-Zeilen.')
  process.exit(0)
}

// Die Adressen werden EINZELN nachgeschlagen: die Zeile trägt nur die userId,
// und ein Betreiber liest lieber eine Adresse. Bei einer geschlossenen Beta
// sind das eine Handvoll Konten — eine Sammel-Abfrage wäre Aufwand ohne Gewinn.
console.log('Zugänge:')
for (const row of rows) {
  const user = await env.users.get({ userId: row.userId }).catch(() => null)
  const who = user?.email ?? `(Konto ${row.userId} nicht gefunden)`
  const state = row.revokedAt ? `WIDERRUFEN ${row.revokedAt}` : 'aktiv'
  console.log(`  ${state.padEnd(34)} ${row.grantedVia.padEnd(9)} ${who}`)
}
console.log('')
console.log(`${rows.filter(row => !row.revokedAt).length} aktiv, ${rows.filter(row => row.revokedAt).length} widerrufen.`)
