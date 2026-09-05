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
  // Der Generierungs-Trichter (§3e). `payload` trägt Slot-Id, Modell, Dauer und
  // Fehlercode — NIE Prompt und NIE den erzeugten Text (Regel 1 im Kopf).
  | 'generation.requested'
  | 'generation.completed'
  | 'generation.failed'
  // Die Konversations-Runde (P3.2). `payload` trägt Baustein, Slot-Id, Modell
  // und Dauer — NIE den getippten Text und NIE die Antwort (Regel 1 im Kopf).
  | 'conversation.turn'
  | 'conversation.failed'
  /**
   * DER SCHNAPPSCHUSS VOR „NOCHMAL VON VORN" (§5a). Die EINE Ausnahme von
   * Regel 1 im Kopf, und sie ist eng gefasst: dieser Eintrag trägt Slot-TEXT,
   * weil er genau dafür da ist — ein versehentlicher Restart soll für den
   * Betreiber rekonstruierbar sein, während er für den Kunden wirklich „von
   * vorn" ist. Er ist damit KEINE Messung, sondern ein AUDIT-Eintrag; dieselbe
   * Aufbewahrung (24 Monate), dieselbe Löschkaskade.
   *
   * Was NICHT hineinpasst, wird gekürzt und als `truncated` markiert — der
   * Deckel liegt bei 4096 Zeichen, und ein Kapitel darf 200k tragen. Ein
   * halber Schnappschuss mit ehrlicher Marke ist mehr wert als gar keiner
   * (`payload` wird sonst KOMPLETT verworfen, s. u.).
   */
  | 'step.restarted'

export interface BrandEventInput {
  type: BrandEventType
  profileId?: string
  userId?: string
  /** Klein halten. Wird beim Überschreiten der Spaltengrösse VERWORFEN, nie gekappt. */
  payload?: Record<string, string | number | boolean>
}

/**
 * Der Spaltendeckel (`brand_events.payload`, varchar 4096, Migration
 * brand-007). EXPORTIERT, weil der Restart-Schnappschuss VOR dem Schreiben
 * wissen muss, wie viel hineinpasst: hier wird ein zu grosser `payload`
 * KOMPLETT verworfen (gekappt wäre er kaputtes JSON), und ein Audit-Eintrag,
 * der still leer ankommt, ist schlimmer als einer, der sagt, dass er gekürzt
 * wurde.
 */
export const BRAND_EVENT_PAYLOAD_MAX = 4096
const PAYLOAD_MAX = BRAND_EVENT_PAYLOAD_MAX

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
