/**
 * DAS TAGES-LIMIT FÜR LIKES — die Rechenregeln (F57 Mechanik 3).
 *
 * Davids Zuschnitt vom 2026-08-14: **50 Likes pro Tag** je Mensch und
 * Community, als Config-Wert justierbar (`pukalani.discussions.likesPerDay`,
 * `0` = Mechanik aus). Im Alltag unspürbar, beim Reihum-Liken erreicht — und
 * genau dieses Erreichen trägt die Abzeichen „Out of Love" / „Higher Love" /
 * „Crazy in Love" (an 1 / 5 / 20 Tagen).
 *
 * PURE und unit-getestet, dieselbe Arbeitsteilung wie beim Einladungs-
 * Kontingent (`control/shared/communityInviteQuota.ts`): hier stehen die
 * REGELN, die Stimm-Routen setzen sie durch, die Zähler-Zeile hält den Stand.
 *
 * ── WARUM DIE REGEL IN `core/shared` LIEGT UND NICHT IM posts-LAYER ────────
 * Weil ZWEI Layer sie brauchen: `comments` stimmt Antworten hoch, `posts`
 * stimmt Themen hoch, und die beiden kennen einander nicht (A14). Dieselbe
 * Überlegung, die `upvoteDelta` hierher gebracht hat — eine Rechnung, die an
 * zwei Stellen gebraucht wird, gehört an keine der beiden.
 *
 * Die DATEN liegen trotzdem woanders: `member_counters` gehört dem
 * posts-Layer (A14, core besitzt keine Tabellen). Diese Datei kennt deshalb
 * keine Spalte und keine Tabelle, nur Zahlen und einen Tagesschlüssel.
 *
 * ── „TAG" IST DER UTC-KALENDERTAG, UND ZWAR ABSICHTLICH ───────────────────
 * Nicht die Zeitzone des Nutzers, obwohl `prefs.timezone` seit U15 existiert.
 * Drei Gründe, in der Reihenfolge ihres Gewichts:
 *  1. **Ein Limit, das mit der Zonen-Wahl wandert, ist manipulierbar.** Wer
 *     seine Zone umstellt, verschiebt seine Mitternacht — und bekommt beim
 *     Sprung nach hinten ein zweites frisches Kontingent am selben Abend. Ein
 *     Missbrauchs-Limit darf nicht an einer Einstellung hängen, die der
 *     Betroffene selbst dreht.
 *  2. **Serverseitig und deterministisch.** Der Tagesschlüssel entsteht aus
 *     der Uhr der Instanz, ohne Nachschlagen im Profil — die Durchsetzung
 *     kostet damit keine zusätzliche Abfrage in einem Pfad, der bei JEDER
 *     Aufstimme läuft.
 *  3. **Nachrechenbar.** `2026-08-14` heißt in jedem Log dasselbe. Mit
 *     Nutzer-Tagen gäbe es so viele „heute" wie Mitglieder, und die Frage
 *     „war das Limit an diesem Tag erreicht?" hätte keine Antwort mehr,
 *     sondern nur noch eine Rückfrage.
 * Der PREIS ist ausgesprochen: wer in UTC+13 lebt, bekommt sein Kontingent
 * mittags statt um Mitternacht. Bei 50 Likes am Tag trifft das niemanden, der
 * nicht ohnehin am Limit klebt.
 */

/**
 * Der fachliche Ablehnungsgrund (`data.code` ⇒ `reason` im Fehler-Envelope).
 *
 * ALS KONSTANTE und nicht als Zeichenkette an drei Stellen: geschrieben wird
 * er in zwei Routen (`comments`, `posts`), gelesen in zwei Oberflächen —
 * ein Tippfehler an einer der vier Stellen wäre eine Meldung, die nie
 * erscheint, und niemand käme darauf, warum.
 */
export const LIKE_LIMIT_REACHED = 'like_limit_reached'

/** Davids Zahl (2026-08-14). Config: `pukalani.discussions.likesPerDay`. */
export const LIKES_PER_DAY_DEFAULT = 50

/**
 * PURE: der UTC-Kalendertag als Schlüssel (`YYYY-MM-DD`).
 *
 * `now` wird hereingereicht statt hier gelesen — sonst wäre die Funktion
 * nicht prüfbar, und ein Limit, dessen Tageswechsel niemand testen kann, ist
 * eine Behauptung (dieselbe Regel wie bei `memberInviteWindowStart`).
 */
export function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

/**
 * PURE: das Kontingent aus der App-Config lesen — defensiv.
 *
 * Ein fehlender, kaputter oder negativer Wert ist NICHT „unbegrenzt", sondern
 * die Vorgabe. Eine vertippte Config darf ein Missbrauchs-Limit nicht
 * aufheben; abschalten geht ausdrücklich über die `0` (Muster
 * `memberInviteLimitFrom`).
 */
export function likeLimitFrom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return LIKES_PER_DAY_DEFAULT
  if (value < 0) return LIKES_PER_DAY_DEFAULT
  return Math.floor(value)
}

/** Der gespeicherte Tagesstand eines Menschen, so wie die Zeile ihn hergibt. */
export interface LikeSpendFacts {
  /** Kontingent je Tag. `0` = Mechanik aus. */
  limit: number
  /** Der heutige UTC-Tagesschlüssel. */
  today: string
  /** Der Tag, auf den der gespeicherte Stand sich bezieht (`''` = noch nie). */
  storedDay: string
  /** Wie viele Likes an jenem Tag schon vergeben wurden. */
  storedCount: number
}

/**
 * Was mit dieser Aufstimme zu geschehen hat.
 *
 *  - `off`     — die Mechanik ist aus. NICHTS wird geschrieben; ohne Limit
 *                gibt es auch keinen Tagesstand, der gepflegt werden müsste.
 *  - `reset`   — erster Like eines neuen Tages: Tag setzen, Zähler auf 1.
 *  - `count`   — derselbe Tag, es ist noch Platz: hochzählen.
 *  - `denied`  — derselbe Tag, aufgebraucht.
 */
export type LikeSpendDecision =
  | { mode: 'off' }
  | { mode: 'reset' }
  | { mode: 'count' }
  | { mode: 'denied' }

/**
 * PURE: Darf dieser Mensch JETZT noch ein Like vergeben — und was ist dafür
 * zu schreiben?
 *
 * ── DIE RÜCKNAHME GIBT NICHTS ZURÜCK, UND DAS STEHT HIER ──────────────────
 * Diese Funktion kennt nur den VERBRAUCH; ein Zurückbuchen gibt es nirgends.
 * Das ist die tragende Eigenschaft der ganzen Mechanik und kein Versehen:
 * eine Stimme lässt sich per Klick zurücknehmen (Toggle), und würde die
 * Rücknahme das Kontingent erstatten, wäre das Limit mit zwei Klicks je Like
 * beliebig oft zu umgehen — 50 würde zu unendlich, und zwar für genau den,
 * gegen den die Mechanik gerichtet ist. Verbraucht ist ein Like deshalb mit
 * seiner VERGABE, so wie eine Einladung mit ihrer Erzeugung verbraucht ist
 * (`communityInviteQuota.ts`).
 *
 * Folgerichtig zählt AUCH NUR die Vergabe: eine Abstimme (Downvote) ist kein
 * Like und rührt das Kontingent nicht an, ein Wechsel von Ab- auf Aufstimme
 * schon. Diese Unterscheidung trifft die aufrufende Route über
 * `upvoteDelta` — dieselbe Rechnung, die auch die Abzeichen-Zähler steuert,
 * damit es über „was ist ein Like" genau EINE Wahrheit gibt.
 */
export function decideLikeSpend(facts: LikeSpendFacts): LikeSpendDecision {
  if (facts.limit <= 0) return { mode: 'off' }
  if (facts.storedDay !== facts.today) return { mode: 'reset' }
  if (facts.storedCount >= facts.limit) return { mode: 'denied' }
  return { mode: 'count' }
}

/**
 * PURE: War GENAU DIESE Vergabe die, die das Limit erreicht hat?
 *
 * `===` und nicht `>=`, und das ist der ganze Zweck der Funktion: daran hängt
 * die Buchung des Abzeichen-Zählers `likeLimitDays`, und die darf an einem Tag
 * genau EINMAL passieren. Mit `>=` bekäme jeder weitere Versuch desselben
 * Tages einen zweiten Tag gutgeschrieben — „an 5 Tagen das Limit erreicht"
 * hieße dann „fünfmal dagegengelaufen", womöglich am selben Nachmittag.
 *
 * Dass die Gleichheit hier trägt, ist keine Nachlässigkeit gegenüber der
 * Sprung-Robustheit der Inhalts-Abzeichen (`contentBadgeCrossings` prüft
 * bewusst KEINE Gleichheit): dort ist `after` eine NEUZÄHLUNG, die springen
 * kann. Hier ist `countAfter` das Ergebnis eines atomaren Hochzählens um 1 —
 * jeder Wert wird von genau einem Aufrufer gesehen, und ein Weiterzählen über
 * das Limit hinaus gibt es nicht, weil `denied` vorher greift.
 */
export function crossesLikeLimit(countAfter: number, limit: number): boolean {
  return limit > 0 && countAfter === limit
}

/** Was die Durchsetzung dem Aufrufer antwortet. */
export type LikeAllowance =
  | { ok: true }
  | { ok: false }
