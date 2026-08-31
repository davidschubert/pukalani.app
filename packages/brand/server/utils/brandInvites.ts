import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import { type BrandInviteFacts, decideBrandInvite } from '../../shared/brandInvite'
import { BRAND_INVITES_TABLE, brandDb, isAppwriteNotFound } from './brandStore'

/**
 * DER EINLADUNGS-CODE: nachschlagen und beurteilen — die ENTSCHEIDUNG selbst
 * liegt pur in `shared/brandInvite.ts`.
 *
 * ── GESPEICHERT WIRD NUR DER HASH ─────────────────────────────────────────
 * `brand_invites.codeHash` ist sha256 des rohen Codes (M9-Muster von
 * `workspace_invites`/`community_invites`). Der rohe Code existiert genau
 * zweimal: in der Versand-Mail und in der Ausgabe von `pnpm brand:invite`. Wer
 * die Datenbank liest, kann keine Einladung benutzen.
 *
 * ── EIN LESEFEHLER IST EIN NEIN ───────────────────────────────────────────
 * Fehlende Tabelle (vor der Migration), Netzfehler, kaputte Zeile: alles ergibt
 * `null` bzw. eine Ablehnung. Fail-closed, weil die Gegenrichtung — bei Störung
 * durchlassen — aus einem Zugangsschutz eine Hintertür machte.
 */

export type BrandInviteRow = Models.Row & BrandInviteFacts & {
  createdByUserId?: string
  redeemedByUserId?: string | null
}

/** sha256-hex des rohen Codes. Der Code selbst wird NIE geloggt. */
export function hashBrandInviteCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex')
}

/** `null` = kein Treffer ODER nicht lesbar — der Aufrufer unterscheidet das nicht. */
export async function findBrandInviteByCode(event: H3Event, code: string): Promise<BrandInviteRow | null> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    const res = await tablesDB.listRows<BrandInviteRow>({
      databaseId,
      tableId: BRAND_INVITES_TABLE,
      // `uq_code_hash` ist UNIQUE — mehr als eine Zeile kann es nicht geben.
      queries: [Query.equal('codeHash', hashBrandInviteCode(code)), Query.limit(1)],
    })
    return res.rows[0] ?? null
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) {
      logEvent('warn', 'brand.invite_lookup_failed', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
    return null
  }
}

export interface BrandInviteEvaluation {
  valid: boolean
  invite: BrandInviteRow | null
}

/**
 * Der EINE Weg von „hier ist ein Code" zu „ja/nein" — benutzt von der
 * Vorab-Prüfung, der Einlösung UND dem Signup-Provider. Drei Aufrufer, EINE
 * Regel: sonst hätte der Signup irgendwann andere Grenzen als die Route.
 *
 * `emailLower` bleibt `null`, solange die Adresse unbekannt ist (Prüfung vor
 * dem Login) — die Bindung wird dann übersprungen, nie geraten.
 */
export async function evaluateBrandInvite(
  event: H3Event,
  code: string,
  emailLower: string | null,
): Promise<BrandInviteEvaluation> {
  const mode = await readBrandAdmissionMode(event)
  const invite = await findBrandInviteByCode(event, code)
  const decision = decideBrandInvite({
    mode,
    invite: invite
      ? {
          emailLower: invite.emailLower,
          expiresAt: invite.expiresAt,
          revokedAt: invite.revokedAt ?? null,
          redeemedAt: invite.redeemedAt ?? null,
        }
      : null,
    now: new Date().toISOString(),
    emailLower,
  })
  return { valid: decision.valid, invite: decision.valid ? invite : null }
}
