import type { H3Event } from 'h3'

/**
 * Avatar-URLs (Account-prefs) für eine Menge User-IDs auflösen — EIN
 * gebündelter `users.list` statt N Einzelabrufe. Bei fehlendem Scope/Fehler
 * leere Map (UI fällt auf Initialen zurück). Auto-importiert in alle
 * Server-Routen (geteilter Core-Util).
 *
 * Seit 2026-08-23 eine ABLEITUNG aus `resolveUserCards` — dieselbe Schleife,
 * nur die halbe Antwort. Wer Name UND Bild braucht (Posteingang, Melde-
 * Warteschlange), ruft direkt die Karte und spart die zweite identische
 * Abfrage; wer nur das Bild braucht (Listen mit denormalisiertem
 * `authorName`), bleibt hier richtig.
 *
 * Nur Einträge MIT hinterlegtem Bild stehen in der Map — ein '' wäre für die
 * Aufrufer nicht von „kein Konto gefunden" zu unterscheiden.
 */
export async function resolveAvatars(event: H3Event, userIds: string[]): Promise<Map<string, string>> {
  const cards = await resolveUserCards(event, userIds)
  const map = new Map<string, string>()
  for (const [id, card] of cards) {
    if (card.avatarUrl.length > 0) map.set(id, card.avatarUrl)
  }
  return map
}
