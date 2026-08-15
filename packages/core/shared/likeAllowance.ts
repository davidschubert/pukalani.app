/**
 * DAS TAGES-LIMIT FÜR LIKES — die Rechenregeln (F57 Mechanik 3).
 *
 * Davids Zuschnitt vom 2026-08-14: **50 Likes pro Tag** je Mensch und
 * Community, als Config-Wert justierbar (`0` = Mechanik aus). Im Alltag
 * unspürbar, beim Reihum-Liken erreicht — und genau dieses Erreichen trägt die
 * Abzeichen „Out of Love" / „Higher Love" / „Crazy in Love" (an 1 / 5 / 20
 * Tagen).
 *
 * ── SEIT F57-STUFEN (2026-08-14): DAS LIMIT STAFFELT MIT DER STUFE ────────
 * `pukalani.discussions.likesPerDayByLevel` — **TL0/TL1 = 50, TL2 = 75,
 * TL3+ = 100**. Der Index IST die Vertrauensstufe; wer darüber liegt (die
 * ernannte Stufe 4), bekommt den letzten Eintrag.
 *
 * WARUM EINE LISTE UND NICHT VIER SCHLÜSSEL: die Staffel ist EINE Aussage
 * („mit dem Vertrauen wächst das Kontingent"), und eine Liste zwingt dazu, sie
 * als Ganzes zu lesen. Vier Schlüssel laden dazu ein, einen davon zu setzen
 * und die drei anderen zu vergessen — genau der Zustand, in dem eine höhere
 * Stufe stillschweigend WENIGER darf als eine niedrigere.
 *
 * DIE ALTE ZAHL BLEIBT DIE ERSTE: `LIKES_PER_DAY_DEFAULT` ist weiterhin 50 und
 * damit der Wert der Stufen 0 und 1. Wer nie aufsteigt, merkt von der Staffel
 * nichts — sie gibt etwas dazu, sie nimmt niemandem etwas weg.
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

/** Davids Zahl (2026-08-14) — zugleich der Wert der Stufen 0 und 1. */
export const LIKES_PER_DAY_DEFAULT = 50

/**
 * DIE STAFFEL (F57-Stufen, 2026-08-14). Index = Vertrauensstufe.
 *
 * `[50, 50, 75, 100]` — TL0 und TL1 bekommen Davids ursprüngliche Zahl, TL2
 * bekommt 75, TL3 bekommt 100. Für die ERNANNTE Stufe 4 steht hier bewusst
 * KEIN eigener Eintrag: sie ist keine erarbeitete Stufe, und eine fünfte Zahl
 * hieße, sich zu überlegen, ob eine Ernennung mehr Likes bedeutet als der
 * höchste erarbeitete Rang. Sie bekommt den letzten Eintrag (`TL3+`).
 *
 * Config: `pukalani.discussions.likesPerDayByLevel`.
 */
export const LIKES_PER_DAY_BY_LEVEL_DEFAULT: readonly number[] = [50, 50, 75, 100]

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
export function likeLimitFrom(value: unknown, fallback: number = LIKES_PER_DAY_DEFAULT): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  if (value < 0) return fallback
  return Math.floor(value)
}

/**
 * PURE: der Stufen-Index, den die Staffel benutzt.
 *
 * Alles, was keine brauchbare Stufe ist (fehlt, kaputt, negativ), wird zu 0 —
 * der KLEINSTEN Staffel-Stufe. Die gutmütige Richtung wäre hier die falsche:
 * ein unlesbarer Stufen-Wert darf niemandem das größere Kontingent schenken,
 * er darf ihm nur nicht mehr geben, als die unterste Stufe ohnehin hat.
 *
 * Nach oben wird auf den LETZTEN Eintrag geklemmt — dort landet die ernannte
 * Stufe 4, und dort landet auch jede Stufe, die eine spätere Erweiterung
 * einführt, ohne die Staffel zu verlängern.
 */
function levelIndex(level: unknown, length: number): number {
  if (length <= 0) return 0
  if (typeof level !== 'number' || !Number.isFinite(level) || level < 0) return 0
  return Math.min(Math.floor(level), length - 1)
}

/**
 * PURE: die Staffel aus der App-Config lesen — defensiv, Eintrag für Eintrag.
 *
 * Was KEINE Liste ist (fehlt, Zahl, Objekt, leer), ergibt die Vorgabe. Eine
 * halb kaputte Liste ergibt NICHT die Vorgabe: jeder unbrauchbare Eintrag wird
 * einzeln durch den Vorgabewert SEINER Stufe ersetzt. Der Grund ist derselbe
 * wie bei `likeLimitFrom` — ein Tippfehler an Stelle drei darf die bewusst
 * gesetzte 0 an Stelle eins nicht aufheben.
 */
export function likeLimitStaffel(value: unknown): number[] {
  const raw = Array.isArray(value) && value.length > 0 ? value : LIKES_PER_DAY_BY_LEVEL_DEFAULT
  return raw.map((entry, index) => likeLimitFrom(
    entry,
    LIKES_PER_DAY_BY_LEVEL_DEFAULT[Math.min(index, LIKES_PER_DAY_BY_LEVEL_DEFAULT.length - 1)] ?? LIKES_PER_DAY_DEFAULT,
  ))
}

/**
 * PURE: das Kontingent DIESES Menschen — Staffel-Config plus seine Stufe.
 *
 * Die EINE Stelle, an der aus „welche Stufe" ein „wie viele Likes" wird.
 * Gefragt wird mit der WIRKENDEN Stufe (erarbeitet oder ernannt), nicht mit
 * der gespeicherten Zahl: wer zum Leader ernannt wurde, soll nicht am
 * Kontingent eines Neulings hängen.
 */
export function likeLimitForLevel(value: unknown, level: unknown): number {
  const staffel = likeLimitStaffel(value)
  return staffel[levelIndex(level, staffel.length)] ?? LIKES_PER_DAY_DEFAULT
}

/**
 * PURE: Ist die Mechanik GANZ aus?
 *
 * Nur dann, wenn KEINE Stufe ein Kontingent hat. Der Aufrufer spart sich damit
 * das Lesen der Zähler-Zeile — aber nur im eindeutigen Fall: eine Staffel wie
 * `[0, 50, 75, 100]` (Neulinge unbegrenzt, alle anderen begrenzt) wäre
 * seltsam, ist aber nicht „aus", und ein vorschnelles Ja hier hieße, dass die
 * Stufen 1–3 ihr Limit stillschweigend verlieren.
 */
export function likeMechanicOff(value: unknown): boolean {
  return likeLimitStaffel(value).every(limit => limit <= 0)
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

/**
 * PURE: Soll für DIESEN Tag ein Abzeichen-Tag gebucht werden?
 *
 * ── WARUM DIE GLEICHHEIT SEIT DER STAFFEL NICHT MEHR ALLEIN TRÄGT ─────────
 * `crossesLikeLimit` war genau einmal je Tag wahr, weil das Limit an einem Tag
 * eine feste Zahl war. Mit der Staffel ist es das nicht mehr: wer mit 50 sein
 * Kontingent leerräumt, DANN auf Stufe 2 aufsteigt (der Aufstieg passiert beim
 * Schreiben, also mitten am Tag) und weiterklickt, trifft bei 75 ein ZWEITES
 * Mal die Gleichheit — und hätte an EINEM Nachmittag zwei „Tage" für „Out of
 * Love"/„Higher Love"/„Crazy in Love" gesammelt. Die Zusage des Zähl-Vertrags
 * lautet „genau einmal je Tag"; sie darf nicht davon abhängen, ob jemand
 * zwischendurch aufgestiegen ist.
 *
 * Deshalb merkt sich die Zeile den GEBUCHTEN Tag (`likeLimitDay`) — eine
 * Zeichenkette neben dem Zähler, kein zweiter Zähler. Der Vergleich ist die
 * ganze Regel: derselbe Tag ⇒ schon gebucht ⇒ nichts tun.
 */
export function booksLikeLimitDay(
  countAfter: number,
  limit: number,
  bookedDay: string,
  today: string,
): boolean {
  return crossesLikeLimit(countAfter, limit) && bookedDay !== today
}

/** Was die Durchsetzung dem Aufrufer antwortet. */
export type LikeAllowance =
  | { ok: true }
  | { ok: false }
