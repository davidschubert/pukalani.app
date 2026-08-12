/**
 * DIE IDENTITÄT DES BEISPIEL-BEITRAGS (U4 Teil 5 / Benchmark-E2).
 *
 * Eine frisch angelegte Community bekommt EINEN Beitrag mit auf den Weg, damit
 * der Feed nicht leer dasteht. Dieser Beitrag muss von zwei Stellen
 * WIEDERERKANNT werden, die sich sonst nichts zu sagen haben:
 *
 *  1. die Saat selbst — ein Doppelklick auf „Community anlegen" darf keine
 *     zwei Beispiele erzeugen (es gibt auf `community_posts` KEINEN
 *     Unique-Index, an dem sich ein Wettlauf brechen würde);
 *  2. die Willkommens-Checkliste — ihr Punkt „ersten Beitrag schreiben" darf
 *     sich nicht durch unsere eigene Saat selbst abhaken.
 *
 * Beides löst dieselbe Antwort: eine ABLEITBARE Zeilen-Id. Wer den
 * Zeilen-Scope der Community kennt, kennt die Id des Beispiels — ohne Marker-
 * Spalte, ohne Migration, ohne zweite Tabelle.
 *
 * WARUM DIESE FUNKTION PUR UND HIER LIEGT: sie ist der einzige Berührungspunkt
 * zwischen dem posts-Layer (der den Beitrag schreibt) und dem
 * onboarding-Layer (der ihn beim Zählen ausnimmt). Als benannter, typisierter
 * Import ist das ein EXPLIZITER Vertrag im Sinn von A14 — kein
 * String-Coupling, kein Auto-Import über Layer-Grenzen. Kein `node:crypto`:
 * die Id muss auch dort baubar sein, wo kein Server läuft (Tests).
 */

/** Präfix der Beispiel-Zeile — bewusst lesbar, damit sie in der Konsole auffällt. */
export const WELCOME_POST_ROW_ID_PREFIX = 'wp-'

/**
 * Zeilen-Id des Beispiel-Beitrags aus dem Zeilen-Scope der Community
 * (`communities.tenantId`, Form `t-<20 Zeichen>`).
 *
 * Das Budget: eine Appwrite-Zeilen-Id fasst 36 Zeichen, `t-` + `ID.unique()`
 * sind 22, das Präfix kostet 3 — bleiben 11 ungenutzt. Der `slice` ist
 * trotzdem da und keine Zierde: eine Id, die das Limit reißt, quittiert
 * Appwrite mit einem generischen 400, dessen Text die Ursache nicht verrät
 * (im Haus schon einmal teuer gelernt, OPEN-ITEMS-COMPLETE zum 36-Zeichen-
 * Limit). Lieber eine gekürzte, immer noch ableitbare Id als ein Rätsel im Log.
 */
export function welcomePostRowId(tenantId: string): string {
  return `${WELCOME_POST_ROW_ID_PREFIX}${tenantId}`.slice(0, 36)
}
