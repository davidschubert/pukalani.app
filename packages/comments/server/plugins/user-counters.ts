import { Query } from 'node-appwrite'
import { COMMENTS_TABLE, COMMENT_REACTIONS_TABLE, VOTES_TABLE } from '../../shared/types/comment'

/**
 * Die comments-Seite des Zähl-Vertrags (F1 Stufe 4): vergebene Upvotes,
 * vergebene Reaktionen und eigene ANTWORTEN nach erhaltenen Upvotes.
 *
 * Das Gegenstück zum posts-Provider, mit denselben acht `count`-Abfragen und
 * derselben Begründung (dort ausführlich). Der Unterschied ist der zweite
 * Zähler-Name: hier `likedReplies`, dort `likedTopics`. Beide melden zusätzlich
 * `likedItems` — die Summe über alle Inhaltsarten, die die Gemeinschafts-
 * Abzeichen meinen.
 *
 * ── WARUM `reactionsGiven` HIER MITZÄHLT (Audit 2026-08-15, Schnitt A) ─────
 * Der Zähler ist ein AGGREGAT über alle Inhaltsarten, genau wie `likesGiven` —
 * und wer nur auf ANTWORTEN reagiert hatte, kam darin nicht vor. Das war nicht
 * bloß eine zu kleine Zahl: `ensureSeededCounters` setzt die eichbaren Spalten
 * ABSOLUT, der erste Blick in die Abzeichen-Galerie schrieb den mitlaufenden
 * Stand also auf den halben Bestand zurück — und `first-reaction` blieb
 * unerreichbar, wenn der fail-soft-Schreibweg einmal ausgefallen war.
 *
 * Der Bau ist derselbe wie drüben: EINE `count`-Abfrage, immer gemeldet (nicht
 * hinter `seed`), gedeckt vom Index `idx_community_user` aus comments-019.
 * NUR DIE GEBENDE RICHTUNG — ein `reactionsReceived` gibt es nirgends, weil
 * Reaktionen badge-neutral sind.
 *
 * DIESER LAYER WEISS WEITERHIN NICHT, DASS ES BEITRÄGE GIBT (A14). Er nennt
 * einen Zähler, keinen Nachbarn — die Namen gehören dem Core-Vertrag.
 *
 * NUR SICHTBARE ANTWORTEN ZÄHLEN (`status: 'active'`): eine ausgeblendete oder
 * gelöschte Antwort ist kein Verdienst. Bei den vergebenen Stimmen fehlt der
 * Filter mit Absicht — eine abgegebene Stimme bleibt abgegeben, auch wenn ihr
 * Ziel später verschwindet.
 *
 * GAST-KOMMENTARE fallen von selbst heraus: sie tragen `authorId: ''`, und
 * gezählt wird gegen die Id des Angemeldeten.
 *
 * DIE ZUSÄTZLICHEN ABFRAGEN GIBT ES NUR AUF NACHFRAGE: je gefragtem Fenster
 * (F1, Abzeichen „Jahrestag") kommt „habe ich in diesem Zeitraum geantwortet?"
 * dazu. Gefiltert wird über `$createdAt` — anders als bei den Beiträgen gibt es
 * hier kein Veröffentlichungsdatum, eine Antwort steht mit dem Absenden da. Ist
 * `seed` gesetzt (F1, Lazy-Seed der mitschreibenden Zähler), kommt „wie viele
 * Antworten habe ich überhaupt geschrieben?" dazu — EINMAL je Mensch. Ohne
 * beides bleibt alles wie vorher.
 */
export default defineNitroPlugin(() => {
  registerUserCounterProvider('comments', async (event, { thresholds, windows, seed }) => {
    const userId = event.context.user?.$id
    if (!userId) return {}

    const db = tenantDb(event)
    const asked = windows ?? []

    const [likesGiven, reactionsGiven, repliesCreated, ...rest] = await Promise.all([
      db.count(VOTES_TABLE, [
        Query.equal('userId', userId),
        Query.equal('value', 1),
      ]),
      db.count(COMMENT_REACTIONS_TABLE, [
        Query.equal('userId', userId),
      ]),
      seed
        ? db.count(COMMENTS_TABLE, [
            Query.equal('authorId', userId),
            Query.equal('status', 'active'),
          ])
        : Promise.resolve<number | null>(null),
      ...asked.map(window => db.count(COMMENTS_TABLE, [
        Query.equal('authorId', userId),
        Query.equal('status', 'active'),
        Query.greaterThanEqual('$createdAt', window.since),
        ...(window.until ? [Query.lessThan('$createdAt', window.until)] : []),
      ])),
      ...thresholds.map(threshold => db.count(COMMENTS_TABLE, [
        Query.equal('authorId', userId),
        Query.equal('status', 'active'),
        Query.greaterThanEqual('upvotes', threshold),
      ])),
    ])

    const counters: Record<string, number> = {
      [COUNTER_LIKES_GIVEN]: likesGiven,
      [COUNTER_REACTIONS_GIVEN]: reactionsGiven,
    }
    if (repliesCreated !== null) counters[COUNTER_REPLIES_CREATED] = repliesCreated
    asked.forEach((window, index) => {
      counters[counterContentIn(window.key)] = rest[index] ?? 0
    })
    thresholds.forEach((threshold, index) => {
      const measured = rest[asked.length + index] ?? 0
      counters[counterLikedItems(threshold)] = measured
      counters[counterLikedReplies(threshold)] = measured
    })
    return counters
  })
})
