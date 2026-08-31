import { Query } from 'node-appwrite'
import { BRAND_TABLES, announceTarget, findUserByEmail, listAll, readBrandOpsEnv } from './lib/brandOps.mjs'

/**
 * EINEN ZUGANG ENTZIEHEN (`pnpm brand:revoke <e-mail|userId>`).
 *
 *   pnpm brand:revoke kunde@example.com
 *
 * ── DREI DINGE AUF EINMAL, UND DAS IST DER PUNKT ──────────────────────────
 * (1) die `brand_access`-Zeile bekommt `revokedAt` — das Gate weist ab dem
 *     nächsten Request ab (die Tabellen sind server-only, es gibt keinen
 *     Row-Permission-Pfad, der noch offen bliebe),
 * (2) offene Einladungen dieser Adresse werden widerrufen — sonst holte sich
 *     der Entzogene über einen liegengebliebenen Code sofort wieder Zugang,
 * (3) **aktive Share-Links seiner Profile werden MIT widerrufen** (Audit 6,
 *     Plan §3e: „bei Missbrauchssperren werden aktive Share-Links AUTOMATISCH
 *     mit widerrufen"). Das ist die Regel, die man beim Nachbauen vergisst: ein
 *     gesperrtes Konto ohne widerrufene Links veröffentlicht weiter, es kann
 *     nur nichts Neues mehr schreiben.
 *
 * ── ES WIRD NICHTS GELÖSCHT ───────────────────────────────────────────────
 * Kein Profil, kein Verlauf, kein Snapshot-Inhalt. Ein Entzug ist eine Sperre,
 * keine Enteignung — dieselbe Trennung wie bei `community.delete`
 * (Stilllegen statt Vernichten). Wer Daten löschen will, nimmt den
 * GDPR-Weg oder die Profil-Löschung.
 *
 * ── OHNE ZUGANGS-ZEILE IST DER LAUF TROTZDEM SINNVOLL ─────────────────────
 * Im Modus `open` hat niemand eine Zeile, und genau dann ist der Entzug wichtig:
 * er LEGT eine an (`grantedVia: 'operator'`, sofort widerrufen). Sonst wäre ein
 * Rauswurf im offenen Modus wirkungslos — die Regel „Entzug schlägt Öffnung"
 * (shared/brandAccess.ts, Regel 2) braucht eine Zeile, an der sie hängt.
 */

const target = process.argv.slice(2).find(arg => !arg.startsWith('--'))
if (!target) {
  console.error('Nutzung: pnpm brand:revoke <e-mail|userId>')
  process.exit(1)
}

const env = readBrandOpsEnv()
const now = new Date().toISOString()

let userId = target
let emailLower = target.includes('@') ? target.toLowerCase() : null

if (emailLower) {
  const user = await findUserByEmail(env, emailLower)
  if (!user) {
    console.error(`✗ Kein Konto mit ${emailLower} — Einladungen lassen sich trotzdem widerrufen.`)
    userId = ''
  }
  else {
    userId = user.$id
  }
}
else {
  const user = await env.users.get({ userId }).catch(() => null)
  emailLower = user ? (user.email ?? '').toLowerCase() : null
}

announceTarget(env, `Zugang entziehen: ${emailLower ?? userId}`)

let revokedAccess = 0
let createdBlock = 0
let revokedInvites = 0
let revokedShares = 0

// (1) Zugangs-Zeile
if (userId) {
  const rows = await listAll(env, BRAND_TABLES.access, [Query.equal('userId', userId)])
  for (const row of rows) {
    if (row.revokedAt) continue
    await env.tablesDB.updateRow({
      databaseId: env.databaseId, tableId: BRAND_TABLES.access, rowId: row.$id, data: { revokedAt: now },
    })
    revokedAccess++
  }
  if (!rows.length) {
    // s. Kopf: im Modus `open` gibt es nichts zu widerrufen — also wird die
    // Sperre angelegt, an der die Regel hängen kann.
    await env.tablesDB.createRow({
      databaseId: env.databaseId,
      tableId: BRAND_TABLES.access,
      rowId: userId,
      data: { userId, grantedVia: 'operator', revokedAt: now },
    })
    createdBlock++
  }
}

// (2) Offene Einladungen
if (emailLower) {
  const invites = await listAll(env, BRAND_TABLES.invites, [Query.equal('emailLower', emailLower)])
  for (const row of invites) {
    if (row.revokedAt || row.redeemedAt) continue
    await env.tablesDB.updateRow({
      databaseId: env.databaseId, tableId: BRAND_TABLES.invites, rowId: row.$id, data: { revokedAt: now },
    })
    revokedInvites++
  }
}

// (3) Aktive Share-Links seiner Profile
if (userId) {
  const profiles = await listAll(env, BRAND_TABLES.profiles, [
    Query.equal('ownerType', 'user'),
    Query.equal('ownerId', userId),
  ])
  for (const profile of profiles) {
    const shares = await listAll(env, BRAND_TABLES.shares, [Query.equal('profileId', profile.$id)])
    for (const share of shares) {
      if (share.revokedAt) continue
      if (Date.parse(share.expiresAt) <= Date.now()) continue
      await env.tablesDB.updateRow({
        databaseId: env.databaseId, tableId: BRAND_TABLES.shares, rowId: share.$id, data: { revokedAt: now },
      })
      revokedShares++
    }
  }
}

console.log('')
console.log(`✔ Zugang widerrufen   : ${revokedAccess}${createdBlock ? ' (+1 Sperre neu angelegt)' : ''}`)
console.log(`✔ Einladungen         : ${revokedInvites}`)
console.log(`✔ Aktive Share-Links  : ${revokedShares}`)
console.log('  Profile, Verläufe und Snapshots bleiben unangetastet.')
