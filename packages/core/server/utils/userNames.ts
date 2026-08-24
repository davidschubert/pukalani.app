import type { H3Event } from 'h3'

/**
 * Anzeigenamen für eine Menge User-IDs auflösen — EIN gebündelter
 * `users.list` statt N Einzelabrufe.
 *
 * Seit 2026-08-23 eine ABLEITUNG aus `resolveUserCards` (dieselbe Schleife,
 * nur die halbe Antwort). Wer Name UND Bild braucht, ruft direkt die Karte —
 * zwei identische Abfragen nebeneinander wären genau die Verdopplung, die
 * `resolveUserCards` auflöst.
 *
 * FAIL-SOFT: fehlender Scope, fehlendes Konto oder ein Lesefehler ⇒ der Name
 * fehlt in der Karte. Ein Name ist eine Höflichkeit, kein Datum, an dem eine
 * Seite hängen darf — die Oberfläche fällt auf die Id oder einen Platzhalter
 * zurück.
 *
 * NICHT für Listen mit fremden Inhalten gedacht, die den Namen ohnehin
 * denormalisiert tragen (`authorName` an `community_posts`): dort wäre dieser
 * Aufruf eine zweite Wahrheit über denselben Menschen. Gedacht ist er für
 * Tabellen, die nur Ids führen — die Zähler-Zeilen der Stufen-Verwaltung sind
 * der erste Fall.
 */
export async function resolveUserNames(event: H3Event, userIds: string[]): Promise<Map<string, string>> {
  const cards = await resolveUserCards(event, userIds)
  const map = new Map<string, string>()
  for (const [id, card] of cards) {
    if (card.name.length > 0) map.set(id, card.name)
  }
  return map
}
