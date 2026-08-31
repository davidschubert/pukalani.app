import { createHash, randomBytes } from 'node:crypto'
import { ID, Query } from 'node-appwrite'
import { BRAND_TABLES, announceTarget, listAll, readBrandOpsEnv } from './lib/brandOps.mjs'

/**
 * EINEN BETA-CODE AUSGEBEN (`pnpm brand:invite <e-mail> [--days 30] [--by <userId>]`).
 *
 *   pnpm brand:invite kunde@example.com
 *
 * ── DER CODE ERSCHEINT GENAU EINMAL ───────────────────────────────────────
 * Gespeichert wird nur sein sha256-Hash (Schema-Anhang §5, M9-Muster). Diese
 * Ausgabe ist die EINZIGE Stelle, an der er im Klartext existiert — wer sie
 * schliesst, ohne ihn zu kopieren, gibt einen neuen aus. Ein „Code nochmal
 * anzeigen" gäbe es nur um den Preis, ihn im Klartext zu speichern, und dann
 * wäre die Datenbank der Generalschlüssel zur Beta.
 *
 * ── AN EINE ADRESSE GEBUNDEN ──────────────────────────────────────────────
 * Der Code gilt nur für DIESE Adresse (`emailLower`); die Einlösung prüft die
 * Bindung gegen die Session-Adresse. Ein Konto braucht es dafür noch nicht —
 * die Naht zum Signup öffnet die geschlossene Registrierung genau für diesen
 * Fall.
 *
 * ── ER SCHALTET NICHTS FREI, SOLANGE DER MODUS NICHT `invite` IST ─────────
 * Das Skript sagt das ausdrücklich, statt einen wirkungslosen Code auszugeben:
 * `admissionAllowsRedeem` lässt nur im Modus `invite` eine Einlösung zu
 * (`pnpm brand:access --mode invite`).
 */

const args = process.argv.slice(2)
const email = args.find(arg => !arg.startsWith('--'))
const days = Number(valueOf('--days') ?? 30)
const createdBy = valueOf('--by') ?? 'cli'

function valueOf(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

if (!email || !email.includes('@')) {
  console.error('Nutzung: pnpm brand:invite <e-mail> [--days 30] [--by <userId>]')
  process.exit(1)
}
if (!Number.isFinite(days) || days < 1 || days > 365) {
  console.error('✗ --days muss zwischen 1 und 365 liegen.')
  process.exit(1)
}

const env = readBrandOpsEnv()
const emailLower = email.toLowerCase()

announceTarget(env, `Beta-Code für ${emailLower} anlegen (gültig ${days} Tage)`)

// Der aktuelle Aufnahme-Modus — nur ein Hinweis, keine Sperre: einen Code auf
// Vorrat auszugeben und den Modus danach zu stellen ist ein legitimer Ablauf.
try {
  const config = await env.tablesDB.getRow({
    databaseId: env.databaseId, tableId: 'app_config', rowId: 'global',
  })
  const mode = config.brandAdmissionMode ?? 'closed'
  if (mode !== 'invite') {
    console.log(`  Hinweis : Aufnahme-Modus ist '${mode}' — der Code wirkt erst mit 'invite'.`)
    console.log('            (pnpm brand:access --mode invite)')
  }
}
catch {
  console.log('  Hinweis : Aufnahme-Modus nicht lesbar (app_config) — Default gilt als \'closed\'.')
}

// Offene Einladungen derselben Adresse melden. Sie werden NICHT automatisch
// widerrufen: mehrere gültige Codes für eine Adresse sind kein Fehler (die
// erste Mail kam vielleicht nicht an), und stilles Entwerten würde einen Link
// töten, den jemand gerade in der Hand hält.
const open = (await listAll(env, BRAND_TABLES.invites, [Query.equal('emailLower', emailLower)]))
  .filter(row => !row.revokedAt && !row.redeemedAt && Date.parse(row.expiresAt) > Date.now())
if (open.length) {
  console.log(`  Hinweis : ${open.length} offene Einladung(en) für diese Adresse bestehen bereits.`)
}

const code = randomBytes(32).toString('hex')
const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

const row = await env.tablesDB.createRow({
  databaseId: env.databaseId,
  tableId: BRAND_TABLES.invites,
  rowId: ID.unique(),
  data: {
    emailLower,
    codeHash: createHash('sha256').update(code, 'utf8').digest('hex'),
    createdByUserId: createdBy,
    expiresAt,
  },
})

console.log('')
console.log(`✔ Einladung angelegt (${row.$id}), gültig bis ${expiresAt}`)
console.log('')
console.log('  CODE (erscheint nur dieses eine Mal):')
console.log(`  ${code}`)
console.log('')
