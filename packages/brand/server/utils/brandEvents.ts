import type { H3Event } from 'h3'
import { ID } from 'node-appwrite'
import { BRAND_EVENTS_TABLE, brandDb } from './brandStore'

/**
 * DER APPEND-ONLY FUNNEL (`brand_events`, Schema-Anhang §6).
 *
 * ── ZWEI REGELN, DIE MAN NICHT AUFWEICHEN DARF ────────────────────────────
 *
 * 1. **NIE INHALTSTEXT.** `payload` ist auf 4096 Zeichen begrenzt und trägt
 *    Kennzahlen, Schlüssel und Zustände — keinen Prompt, keinen Slot-Text,
 *    keinen Namen, keine E-Mail (Log-Regel Plan §6). Der Funnel beantwortet
 *    „wie viele kamen bis Baustein D?", nicht „was stand drin?".
 *
 * 2. **FAIL-SOFT.** Ein Ereignis ist eine BEOBACHTUNG. Scheitert sie, ist die
 *    Handlung trotzdem passiert — ein Profil, das angelegt wurde, aber wegen
 *    einer vollen Ereignis-Tabelle mit 500 quittiert wird, wäre der teuerste
 *    denkbare Tausch. Deshalb: gefangen, geloggt, weiter. (Das ist die
 *    Umkehrung von `touchProfile` nebenan, und der Unterschied ist Absicht:
 *    dort sieht der Mensch den Fehler sofort, hier nie.)
 */

export type BrandEventType =
  | 'profile.created'
  | 'step.completed'
  | 'share.published'
  | 'invite.redeemed'

export interface BrandEventInput {
  type: BrandEventType
  profileId?: string
  userId?: string
  /** Klein halten. Wird beim Überschreiten der Spaltengrösse VERWORFEN, nie gekappt. */
  payload?: Record<string, string | number | boolean>
}

const PAYLOAD_MAX = 4096

export async function recordBrandEvent(event: H3Event, input: BrandEventInput): Promise<void> {
  try {
    const { tablesDB, databaseId } = brandDb(event)
    let payload = ''
    if (input.payload) {
      const json = JSON.stringify(input.payload)
      // Gekappt wäre es kaputtes JSON — ein leeres Feld ist ehrlicher als ein
      // halbes Objekt, das kein Leser mehr parsen kann.
      payload = json.length <= PAYLOAD_MAX ? json : ''
    }
    await tablesDB.createRow({
      databaseId,
      tableId: BRAND_EVENTS_TABLE,
      rowId: ID.unique(),
      data: {
        type: input.type,
        profileId: input.profileId ?? '',
        userId: input.userId ?? '',
        payload,
      },
    })
  }
  catch (error) {
    logEvent('warn', 'brand.event_write_failed', {
      type: input.type,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
