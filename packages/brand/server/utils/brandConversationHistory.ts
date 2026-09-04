import type { H3Event } from 'h3'
import { Query } from 'node-appwrite'
import {
  BRAND_MESSAGES_TABLE,
  type BrandMessageRow,
  brandDb,
  isAppwriteNotFound,
} from './brandStore'
import { BRAND_CONVERSE_HISTORY_MAX, type BrandConverseHistoryTurn } from './conversePrompt'

/**
 * DER VERLAUF EINES BAUSTEINS — einmal gelesen, von ZWEI Routen gebraucht.
 *
 * Bis a-9 stand diese Abfrage inline in `converse.post.ts` und war damit genau
 * dort, wo sie am wenigsten fehlte: im Gespräch. Der ENTWURFS-Generator sah sie
 * nie — was ein Mensch auf eine Rückfrage tippte, erreichte den Entwurf nicht,
 * und George stellte dieselbe Frage ein zweites Mal. Zwei Kopien der Abfrage
 * wären zwei Fassungen von „was hat er zuletzt gehört": andere Reihenfolge,
 * anderes Limit, anderes Rollen-Mapping — und dem Entwurf sähe man das nie an.
 *
 * ── WARUM EINE EIGENE DATEI UND NICHT `brandStore.ts` ─────────────────────
 * Der Rückgabetyp gehört `conversePrompt.ts`, und das importiert (für
 * `formatStartCard`) aus `georgePrompt.ts`, das wiederum den Typ
 * `BrandSlotDependency` aus `brandGenerators.ts` holt — und DAS liest
 * `brandStore.ts`. Ein Import von `conversePrompt` in `brandStore` schlösse
 * diesen Ring. Als eigenes Blatt am Rand hängt diese Datei an allem und nichts
 * hängt an ihr ausser den beiden Routen.
 *
 * ── FAIL-SOFT, WIE VORHER ────────────────────────────────────────────────
 * Ein unlesbarer Verlauf kostet weder Zug noch Entwurf: es gibt ein leeres
 * Array, und der Berater arbeitet ohne Gedächtnis weiter — was immer noch besser
 * ist als gar keine Reaktion, denn die Werte des Bausteins reisen ohnehin mit.
 * Ein 404 schweigt (die Tabelle kann in einer frischen Instanz fehlen), alles
 * andere hinterlässt EINE Warnzeile ohne Inhalt (Log-Regel §6).
 */
export async function loadBrandConversationHistory(
  event: H3Event,
  profileId: string,
  stepKey: string,
): Promise<BrandConverseHistoryTurn[]> {
  const history: BrandConverseHistoryTurn[] = []
  try {
    const { tablesDB, databaseId } = brandDb(event)
    // ABSTEIGEND mit Limit, danach umgedreht: die andere Richtung müsste die
    // ganze Historie holen, um die letzten sechs zu finden.
    const res = await tablesDB.listRows<BrandMessageRow>({
      databaseId,
      tableId: BRAND_MESSAGES_TABLE,
      queries: [
        Query.equal('profileId', profileId),
        Query.equal('stepKey', stepKey),
        Query.orderDesc('$id'),
        Query.limit(BRAND_CONVERSE_HISTORY_MAX),
      ],
    })
    for (const row of [...res.rows].reverse()) {
      // Eine unbekannte Rolle gilt als Zug des Beraters — die Spalte ist eine
      // Zeichenkette, und ein geratenes „person" legte dem Modell fremde Worte
      // in den Mund.
      history.push({
        role: row.role === 'user' || row.role === 'system' ? row.role : 'george',
        body: row.body,
      })
    }
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) {
      logEvent('warn', 'brand.converse_history_failed', {
        stepKey,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return history
}
