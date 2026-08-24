import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'

/**
 * Name UND Avatar eines Kontos — die beiden Auskünfte, aus denen eine
 * Autorenzeile besteht.
 *
 * WARUM ZUSAMMEN (2026-08-23): beide stehen an DEMSELBEN Konto-Objekt. Wer
 * `resolveUserNames` und `resolveAvatars` nebeneinander ruft, schickt zwei
 * identische `users.list`-Abfragen über dieselben Ids los und wirft aus jeder
 * die Hälfte der Antwort weg. Diese Funktion ist deshalb die eine Schleife;
 * die beiden Schwestern nebenan (userNames.ts, avatars.ts) leiten ihr Ergebnis
 * daraus ab und bleiben für Aufrufer, die wirklich nur eines brauchen.
 *
 * EIN gebündelter Query statt N Einzelabrufe, in 100er-Batches (`Query.equal`
 * ist auf 100 Werte begrenzt).
 *
 * FAIL-SOFT: fehlender Scope, fehlendes Konto oder ein Lesefehler ⇒ der
 * Eintrag fehlt in der Karte. Name und Bild sind Höflichkeiten, keine Daten,
 * an denen eine Seite hängen darf — die Oberfläche fällt auf Id, Platzhalter
 * oder Initialen zurück.
 *
 * NICHT für Listen mit fremden Inhalten gedacht, die den Namen ohnehin
 * denormalisiert tragen (`authorName` an `community_posts`): dort wäre der
 * NAME eine zweite Wahrheit über denselben Menschen. Für das BILD gilt das
 * nicht — es steht nirgends an der Zeile, deshalb holen sich solche Listen mit
 * `resolveAvatars` weiterhin nur den Avatar.
 */
export interface UserCard {
  /** Anzeigename; '' = keiner gesetzt. */
  name: string
  /** `prefs.avatarUrl`; '' = keiner hinterlegt. */
  avatarUrl: string
}

export async function resolveUserCards(event: H3Event, userIds: string[]): Promise<Map<string, UserCard>> {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return new Map()

  const map = new Map<string, UserCard>()
  try {
    const admin = createAdminClient(event)
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      const res = await admin.users.list({ queries: [Query.equal('$id', batch), Query.limit(batch.length)] })
      for (const user of res.users) {
        const avatarUrl = (user.prefs as { avatarUrl?: string })?.avatarUrl
        map.set(user.$id, {
          name: user.name || '',
          avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : '',
        })
      }
    }
    return map
  }
  catch {
    return new Map()
  }
}
