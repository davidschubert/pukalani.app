import type { H3Event } from 'h3'
import { Query } from 'node-appwrite'
import { slotsForStep, type BrandStepKey } from '../../shared/slotRegistry'
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
 *
 * ── SEIT BW2: DER VERLAUF HÄNGT AN DER SESSION (Plan §6, brand-011) ───────
 * `sessionKey` schneidet das Fenster auf EIN Feld zu; ohne ihn (Entwurfs-
 * Generator, GDPR-Export) bleibt es das ganze Kapitel wie bisher. Das ist kein
 * Rückstand, sondern die richtige Frage je Aufrufer: ein Gespräch findet in
 * einer Session statt, ein ENTWURF schöpft aus dem Kapitel.
 *
 * DIE BESTANDS-REGEL, die man nicht „vereinfachen" darf: Zeilen mit LEEREM
 * `sessionKey` sind der Kapitel-Verlauf aus der Zeit vor BW2 und zählen zum
 * Fenster der ERSTEN Session des Kapitels (Registry-Reihenfolge). Ohne sie
 * stünde jedes Bestands-Branding nach dem Deploy ohne Gedächtnis da — der
 * Mensch sähe seine alten Züge auf der Seite und George kennte sie nicht mehr.
 * Umgesetzt als EIN `Query.equal` mit ZWEI Werten (Appwrite verodert eine
 * Werteliste), nicht als zwei Abfragen: zwei Abfragen hätten zwei Fenster von
 * je sechs Zügen und müssten sie danach von Hand mischen.
 */
export async function loadBrandConversationHistory(
  event: H3Event,
  profileId: string,
  stepKey: string,
  sessionKey?: string,
  restartedAt?: string | null,
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
        ...(sessionKey ? [Query.equal('sessionKey', sessionKeyValues(stepKey, sessionKey))] : []),
        // DER VERLAUFS-SCHNITT nach „Nochmal von vorn" (brand-013, §5a): die
        // Nachrichten BLEIBEN stehen (Retention brand-003), aber George
        // beginnt ohne das alte Gedächtnis — sonst wäre „von vorn" eine Lüge.
        // Die Bestands-Regel darüber (leerer `sessionKey` zählt zur ersten
        // Session) bleibt daneben bestehen: sie beantwortet eine andere Frage.
        ...(restartedAt ? [Query.greaterThan('$createdAt', restartedAt)] : []),
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

/**
 * WELCHE `sessionKey`-WERTE ZU DIESER SESSION ZÄHLEN — sie selbst, und bei der
 * ERSTEN Session des Kapitels zusätzlich der leere Schlüssel (s. Kopf).
 *
 * Die „erste" ist die erste AKTIVE Session der Registry-Reihenfolge, dieselbe
 * Ordnung, die auch `resolveNextSession` fragt. Ein unbekannter Kapitel-
 * Schlüssel liefert keine erste — dann zählt nur die Session selbst, und das
 * ist die vorsichtige Richtung: lieber kein fremdes Gedächtnis als eines aus
 * einem Kapitel, das es nicht gibt.
 */
export function sessionKeyValues(stepKey: string, sessionKey: string): string[] {
  const first = slotsForStep(stepKey as BrandStepKey)[0]
  return first?.id === sessionKey ? ['', sessionKey] : [sessionKey]
}

/**
 * GIBT ES IN DIESER SESSION SCHON EINEN ZUG DES BERATERS? — die Sicherung des
 * Eröffnungszuges (Plan §6).
 *
 * Der Client ruft die Eröffnung bei JEDEM Öffnen einer Session: er kann nicht
 * wissen, ob sie schon einmal offen war. Ohne diese Frage bekäme dieselbe
 * Session bei jedem Blick einen neuen ersten Satz — und jeder davon kostete
 * einen Anbieter-Aufruf aus dem Tages-Eimer.
 *
 * EXISTENZ, KEINE ZÄHLUNG (`Query.limit(1)`): „gibt es einen" ist die Frage,
 * „wie viele" wäre eine andere und teurer.
 *
 * ── FAIL-CLOSED, UND ZWAR BEWUSST HERUM ──────────────────────────────────
 * Ist die Abfrage kaputt, gilt „es gibt schon einen" und die Route antwortet
 * `skipped`. Die andere Richtung erzeugte bei jedem Lesefehler einen zweiten
 * Eröffnungszug im selben Faden — sichtbarer Doppel-Text plus Kosten. Ein
 * ausbleibender Eröffnungszug ist dagegen still: die Katalog-Frage steht
 * daneben, der Mensch kann tippen, und der nächste Aufruf holt es nach.
 */
export async function hasBrandSessionAdvisorTurn(
  event: H3Event,
  profileId: string,
  stepKey: string,
  sessionKey: string,
): Promise<boolean> {
  try {
    const { tablesDB, databaseId } = brandDb(event)
    const res = await tablesDB.listRows<BrandMessageRow>({
      databaseId,
      tableId: BRAND_MESSAGES_TABLE,
      queries: [
        Query.equal('profileId', profileId),
        Query.equal('stepKey', stepKey),
        Query.equal('sessionKey', sessionKeyValues(stepKey, sessionKey)),
        Query.equal('role', 'george'),
        Query.limit(1),
      ],
    })
    return res.rows.length > 0
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return false
    logEvent('warn', 'brand.session_turn_probe_failed', {
      stepKey,
      message: error instanceof Error ? error.message : String(error),
    })
    return true
  }
}

/**
 * HAT DIESES KAPITEL ÜBERHAUPT SCHON EINE NACHRICHT? — die Bedingung des
 * Kapitel-Intros („Vera liest mit"), das genau EINMAL je Kapitel fällt.
 *
 * Eine EXISTENZ-Prüfung und keine Zählung, aus demselben Grund wie oben; und
 * fail-soft in die andere Richtung: kann sie nicht antworten, gilt „es gibt
 * schon welche" und das Intro entfällt. Ein fehlendes Intro ist eine
 * Kleinigkeit, ein doppeltes ist die Vorstellung, die niemand zweimal hören
 * will.
 */
export async function hasBrandStepMessage(
  event: H3Event,
  profileId: string,
  stepKey: string,
): Promise<boolean> {
  try {
    const { tablesDB, databaseId } = brandDb(event)
    const res = await tablesDB.listRows<BrandMessageRow>({
      databaseId,
      tableId: BRAND_MESSAGES_TABLE,
      queries: [
        Query.equal('profileId', profileId),
        Query.equal('stepKey', stepKey),
        Query.limit(1),
      ],
    })
    return res.rows.length > 0
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return false
    logEvent('warn', 'brand.step_message_probe_failed', {
      stepKey,
      message: error instanceof Error ? error.message : String(error),
    })
    return true
  }
}
