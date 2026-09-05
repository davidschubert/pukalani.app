import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import { BRAND_ACCESS_TABLE } from './brandAccess'
import type { BrandInviteRow } from './brandInvites'
import { BRAND_FINDINGS_TABLE } from './brandFindingsStore'
import {
  BRAND_EVENTS_TABLE,
  BRAND_MESSAGES_TABLE,
  BRAND_PROFILES_TABLE,
  BRAND_SHARES_TABLE,
  BRAND_STEPS_TABLE,
  type BrandProfileRow,
  brandDb,
  isAppwriteNotFound,
} from './brandStore'

/**
 * GDPR-EXPORT UND -LÖSCHUNG DES BRAND-LAYERS (Schema-Anhang §7).
 *
 * Der Core orchestriert, ohne ein einziges brand-Schema zu kennen
 * (`registerUserDataContributor`, CONCEPT A14) — was zu diesem Konto gehört,
 * weiss nur dieser Layer.
 *
 * ── DIE MENGE IST GRÖSSER ALS „SEINE PROFILE" ─────────────────────────────
 * Dazu gehören auch die `brand_access`-Zeile, die an SEINE ADRESSE gebundenen
 * Einladungen und die Funnel-Ereignisse mit seiner `userId`. Ein Export, der
 * nur die Profile zeigt, verschwiege, dass wir eine Einladung an diese Adresse
 * gespeichert haben.
 *
 * ── EINLADUNGEN WERDEN ANONYMISIERT, NICHT GELÖSCHT ───────────────────────
 * Die Zeile ist der Nachweis, dass ein Code AUSGEGEBEN und ggf. verbraucht
 * wurde; gelöscht liesse sie sich ein zweites Mal einlösen (der 409 auf die
 * Zeilen-Id fiele weg). Verschwinden muss die PERSON, nicht der Vorgang: aus
 * `emailLower` wird ein Marker, `redeemedByUserId` wird geleert. Genau die
 * Aufteilung, die `UserDataDeleteResult` mit `deleted`/`anonymized` meint.
 *
 * ── IDEMPOTENT ────────────────────────────────────────────────────────────
 * Jeder Schritt verzeiht ein 404 (Vertrag: „ein Re-Run nach Teilfehler findet
 * Rest-Daten oder nichts und terminiert erfolgreich"). Eine FEHLENDE TABELLE
 * verzeiht er ebenfalls — auf Instanzen ohne brand-Migration hat dieser Layer
 * nichts, und ein GDPR-Lauf darf daran nicht scheitern.
 */

export const BRAND_USER_DATA_ID = 'brand'

/** Der Marker, der an die Stelle der Adresse tritt. Keine Rück-Rechnung möglich. */
const ANONYMIZED_EMAIL = 'deleted@invalid'

async function safeListAll<T extends Models.Row>(
  event: H3Event,
  tableId: string,
  filters: string[],
): Promise<T[]> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    return await listAllRows<T>(tablesDB, databaseId, tableId, filters)
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return []
    throw error
  }
}

/** Die Adresse des Kontos — sie ist der Schlüssel zu `brand_invites`. */
async function accountEmailLower(event: H3Event, userId: string): Promise<string | null> {
  try {
    const { users } = createAdminClient(event)
    const user = await users.get({ userId })
    return (user.email ?? '').toLowerCase() || null
  }
  catch {
    // Konto schon weg (Löschreihenfolge) ⇒ keine Einladungs-Zeilen auffindbar.
    // Das ist kein Fehlschlag: was nicht mehr adressierbar ist, kann auch nicht
    // mehr zugeordnet werden.
    return null
  }
}

export async function brandExportUserData(event: H3Event, userId: string): Promise<unknown> {
  const profiles = await safeListAll<BrandProfileRow>(event, BRAND_PROFILES_TABLE, [
    Query.equal('ownerType', 'user'),
    Query.equal('ownerId', userId),
  ])

  const exported = []
  for (const profile of profiles) {
    const filter = [Query.equal('profileId', profile.$id)]
    const shares = await safeListAll<Models.Row & { tokenHash?: string }>(event, BRAND_SHARES_TABLE, filter)
    exported.push({
      profile,
      steps: await safeListAll(event, BRAND_STEPS_TABLE, filter),
      messages: await safeListAll(event, BRAND_MESSAGES_TABLE, filter),
      // Die Befunde des Spezialisten (brand-014) gehören zum Branding: sie
      // tragen Aussagen ÜBER die Marke dieses Menschen und müssen deshalb im
      // Export erscheinen — ein Export, der sie verschwiege, wäre unvollständig.
      findings: await safeListAll(event, BRAND_FINDINGS_TABLE, filter),
      // `tokenHash` fliegt raus: er ist kein Datum ÜBER die Person, sondern das
      // Geheimnis eines Links — ein Export ist kein Ort dafür.
      shares: shares.map(({ tokenHash: _tokenHash, ...rest }) => rest),
    })
  }

  const emailLower = await accountEmailLower(event, userId)

  return {
    profiles: exported,
    access: await safeListAll(event, BRAND_ACCESS_TABLE, [Query.equal('userId', userId)]),
    invites: emailLower
      ? await safeListAll<BrandInviteRow>(event, BRAND_INVITES_TABLE, [Query.equal('emailLower', emailLower)])
      : [],
    events: await safeListAll(event, BRAND_EVENTS_TABLE, [Query.equal('userId', userId)]),
  }
}

export async function brandDeleteUserData(event: H3Event, userId: string): Promise<UserDataDeleteResult> {
  const { tablesDB, databaseId } = brandDb(event)
  let deleted = 0
  let anonymized = 0

  async function remove(tableId: string, rowId: string): Promise<void> {
    try {
      await tablesDB.deleteRow({ databaseId, tableId, rowId })
      deleted++
    }
    catch (error) {
      if (!isAppwriteNotFound(error)) throw error
    }
  }

  const profiles = await safeListAll<BrandProfileRow>(event, BRAND_PROFILES_TABLE, [
    Query.equal('ownerType', 'user'),
    Query.equal('ownerId', userId),
  ])

  for (const profile of profiles) {
    const filter = [Query.equal('profileId', profile.$id)]
    // Kinder zuerst — dieselbe Reihenfolge und derselbe Grund wie in der
    // Löschroute: ein Abbruch soll sichtbaren Rest hinterlassen, keinen
    // unsichtbaren.
    for (const tableId of [
      BRAND_STEPS_TABLE,
      BRAND_MESSAGES_TABLE,
      BRAND_SHARES_TABLE,
      BRAND_EVENTS_TABLE,
      BRAND_FINDINGS_TABLE,
    ]) {
      for (const row of await safeListAll<Models.Row>(event, tableId, filter)) {
        await remove(tableId, row.$id)
      }
    }
    await remove(BRAND_PROFILES_TABLE, profile.$id)
  }

  for (const row of await safeListAll<Models.Row>(event, BRAND_ACCESS_TABLE, [Query.equal('userId', userId)])) {
    await remove(BRAND_ACCESS_TABLE, row.$id)
  }

  // Ereignisse OHNE Profil-Bezug (z. B. `invite.redeemed`) hängen nur an der
  // userId — sie wären sonst der Rest, der die Person überlebt.
  for (const row of await safeListAll<Models.Row>(event, BRAND_EVENTS_TABLE, [Query.equal('userId', userId)])) {
    await remove(BRAND_EVENTS_TABLE, row.$id)
  }

  const emailLower = await accountEmailLower(event, userId)
  if (emailLower) {
    for (const invite of await safeListAll<BrandInviteRow>(event, BRAND_INVITES_TABLE, [Query.equal('emailLower', emailLower)])) {
      try {
        await tablesDB.updateRow({
          databaseId,
          tableId: BRAND_INVITES_TABLE,
          rowId: invite.$id,
          data: { emailLower: ANONYMIZED_EMAIL, redeemedByUserId: '' },
        })
        anonymized++
      }
      catch (error) {
        if (!isAppwriteNotFound(error)) throw error
      }
    }
  }

  return { deleted, anonymized }
}
