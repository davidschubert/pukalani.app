import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import { createBrandInviteCodeSchema } from '../../../../schemas/brandAccess'
import type { BrandInviteRedeemResponse } from '../../../../shared/types/brand'
import { BRAND_ACCESS_TABLE } from '../../../utils/brandAccess'
import { evaluateBrandInvite } from '../../../utils/brandInvites'
import { BRAND_INVITES_TABLE, brandDb, isAppwriteNotFound } from '../../../utils/brandStore'
import { recordBrandEvent } from '../../../utils/brandEvents'

/**
 * EINEN CODE EINLÖSEN — die zweite Hälfte des Beta-Zugangs.
 *
 * ── SIE VERLANGT EINE SESSION, ABER KEINEN ZUGANG ─────────────────────────
 * `requireBrandAccess` wäre hier ein Zirkel: wer einlöst, HAT noch keinen
 * Zugang. Geprüft wird deshalb dasselbe wie dort, nur ohne den letzten Schritt:
 * eingeloggt UND E-Mail verifiziert. Die Verifizierung ist keine Formalie —
 * der Code ist an eine ADRESSE gebunden, und ohne Verifizierung wäre diese
 * Adresse eine Behauptung des Anmelders (Plan §6: „ein unverifiziertes Konto
 * hat den Code nicht verbrannt").
 *
 * ── ATOMAR OHNE TRANSAKTION (Schema-Anhang §5) ────────────────────────────
 * Die `brand_access`-Zeile bekommt `rowId = inviteId`. Zwei gleichzeitige
 * Einlösungen desselben Codes laufen damit in EINEN 409 — die Datenbank
 * entscheidet, nicht ein „erst nachsehen, dann schreiben", zwischen dessen
 * beiden Hälften genau der zweite Aufruf passt. Dasselbe Muster wie der
 * Idempotenz-Schlüssel von `notify()`.
 *
 * Und die Reihenfolge steht fest: ERST die Zeile anlegen, DANACH die Einladung
 * als verbraucht stempeln. Andersherum könnte ein Fehlschlag nach dem Stempel
 * einen Code verbrennen, ohne Zugang zu geben — der Mensch stünde mit einer
 * toten Einladung da. So bleibt im schlimmsten Fall eine Einladung ohne
 * `redeemedAt` stehen, deren zweite Einlösung ohnehin am 409 scheitert.
 *
 * ── DER 409 HAT ZWEI BEDEUTUNGEN, UND NUR EINE IST EIN JA ─────────────────
 * Er kommt von der Zeilen-Id (dieser Code wurde schon eingelöst) ODER vom
 * UNIQUE-Index auf `userId` (dieses Konto hat bereits eine Zugangs-Zeile).
 * Danach wird nachgesehen: eine LEBENDE eigene Zeile heisst „du bist längst
 * drin" (`true`, idempotent, ohne einen zweiten Code zu verbrauchen), eine
 * WIDERRUFENE heisst nein — ein hinausgeworfenes Konto darf sich nicht mit
 * einer neuen Einladung selbst zurückholen (Regel 2 in `shared/brandAccess.ts`).
 *
 * ── ABGELEHNT WIRD IMMER GLEICH ───────────────────────────────────────────
 * `{ redeemed: false }` mit 200 für JEDEN Code-Grund. Nur die fehlende oder
 * unverifizierte Session antwortet 404 (Datentür) — sie ist kein Urteil über
 * den Code.
 */
export default defineEventHandler(async (event): Promise<BrandInviteRedeemResponse> => {
  const user = event.context.user ?? null
  const userId = user?.$id ?? null
  const emailLower = (user?.email ?? '').toLowerCase()
  if (!userId || !user?.emailVerification || !emailLower) {
    throw createError({ status: 404, statusText: 'Not Found' })
  }

  const body = await readValidatedBody(event, createBrandInviteCodeSchema().parse)

  const { valid, invite } = await evaluateBrandInvite(event, body.code, emailLower)
  if (!valid || !invite) return { redeemed: false }

  const { tablesDB, databaseId } = brandDb(event)

  try {
    await tablesDB.createRow({
      databaseId,
      tableId: BRAND_ACCESS_TABLE,
      rowId: invite.$id,
      data: { userId, grantedVia: 'invite', inviteId: invite.$id },
    })
  }
  catch (error) {
    if (hasConflict(error)) return { redeemed: await hasLivingAccess(event, userId) }
    logEvent('warn', 'brand.invite_redeem_failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { redeemed: false }
  }

  try {
    await tablesDB.updateRow({
      databaseId,
      tableId: BRAND_INVITES_TABLE,
      rowId: invite.$id,
      data: { redeemedAt: new Date().toISOString(), redeemedByUserId: userId },
    })
  }
  catch (error) {
    // Der Zugang STEHT bereits — ein misslungener Stempel darf ihn nicht
    // zurücknehmen. Die zweite Einlösung scheitert ohnehin am 409 der
    // Zeilen-Id; der Betreiber sieht die Lücke im Log.
    logEvent('warn', 'brand.invite_stamp_failed', {
      inviteId: invite.$id,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  await recordBrandEvent(event, { type: 'invite.redeemed', userId })

  return { redeemed: true }
})

function hasConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 409
}

/** Lebt die Zugangs-Zeile dieses Kontos? Ein Lesefehler heisst nein (fail-closed). */
async function hasLivingAccess(event: H3Event, userId: string): Promise<boolean> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    const res = await tablesDB.listRows<Models.Row & { revokedAt?: string | null }>({
      databaseId,
      tableId: BRAND_ACCESS_TABLE,
      queries: [Query.equal('userId', userId), Query.limit(1)],
    })
    const row = res.rows[0]
    return !!row && !row.revokedAt
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) {
      logEvent('warn', 'brand.access_lookup_failed', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
    return false
  }
}
