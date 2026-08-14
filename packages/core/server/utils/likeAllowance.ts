import type { H3Event } from 'h3'
import type { LikeAllowance } from '../../shared/likeAllowance'

/**
 * „DARF DIESER MENSCH HEUTE NOCH EIN LIKE VERGEBEN?" — der Vertrag hinter dem
 * Tages-Limit (F57 Mechanik 3).
 *
 * ── WARUM EIN VERTRAG UND KEIN DIREKTER AUFRUF ────────────────────────────
 * Gefragt wird an ZWEI Stellen, die in zwei verschiedenen Produkt-Layern
 * liegen: `comments/[id]/vote.post.ts` (Antworten hochstimmen) und
 * `posts/[id]/score.post.ts` (Themen hochstimmen). Geantwortet wird aus
 * `member_counters` — einer Tabelle, die dem posts-Layer gehört (A14). Ein
 * direkter Aufruf hieße, dass `comments` von `posts` weiß; genau das schließt
 * die Layer-Grenzen-Matrix aus. Dieselbe Bauart wie
 * `registerUserCounterRecorder`, dessen Meldungen in derselben Zeile landen.
 *
 * ── OHNE AUTORITÄT IST ALLES HIER EIN NO-OP, UND ZWAR ERLAUBEND ───────────
 * Eine App ohne posts-Layer (Playground, Silo mit nur Kommentaren) hat keine
 * `member_counters` — dort gibt es kein Tages-Limit, und Stimmen laufen wie
 * bisher. `{ ok: true }` ist deshalb die richtige Antwort und nicht `false`:
 * ein Limit, das ohne seine Datenhaltung ALLES abweist, wäre kein Limit,
 * sondern ein Ausfall.
 *
 * ── FAIL-OPEN AUCH IM FEHLERFALL, MIT BEGRÜNDUNG ──────────────────────────
 * Wirft die Autorität (Datenbank-Störung, Deploy mitten im Schreibvorgang),
 * gilt die Stimme als erlaubt. Das ist dieselbe Richtung wie bei den Zählern
 * („ein Zähler ist eine Nebenwirkung des Handelns, kein Teil davon") und hier
 * zusätzlich eine Abwägung: der Schaden einer irrtümlich VERWEIGERTEN Stimme
 * trifft ein Mitglied, das nichts falsch gemacht hat und die Meldung „für
 * heute aufgebraucht" nicht einordnen kann — der Schaden einer irrtümlich
 * ERLAUBTEN ist ein Like über dem Kontingent. Die Mechanik soll bremsen, nicht
 * bei Gegenwind zusperren.
 */

export type LikeAllowanceAuthority = (
  event: H3Event,
  userId: string,
) => Promise<LikeAllowance> | LikeAllowance

let authority: LikeAllowanceAuthority | null = null

/** Von dem Layer registriert, dem die Zähler-Zeilen gehören (Nitro-Plugin). */
export function registerLikeAllowanceAuthority(fn: LikeAllowanceAuthority): void {
  if (authority) {
    console.warn('[core] registerLikeAllowanceAuthority: bestehende Autorität wird ersetzt — pro Deployment ist EINE vorgesehen')
  }
  authority = fn
}

/** Nur für Tests: Registry zurücksetzen. */
export function __resetLikeAllowanceAuthority(): void {
  authority = null
}

/**
 * Ein Like VERBRAUCHEN — die Antwort sagt, ob es vergeben werden darf.
 *
 * KEIN „ERST FRAGEN, DANN BUCHEN": der Aufruf prüft und verbraucht in einem
 * Schritt. Zwischen einer reinen Frage und der Buchung passte ein zweiter
 * Request derselben Person (zwei Tabs, Doppelklick), und beide bekämen ein Ja
 * auf denselben letzten freien Platz. Dieselbe Überlegung wie beim blinden
 * Schreiben der Abzeichen.
 *
 * GERUFEN WIRD VOR DEM SCHREIBEN DER STIMME. Scheitert das Schreiben danach
 * (409 aus dem Unique-Index bei Doppelklick), bleibt das Like verbraucht —
 * bewusst: die Alternative wäre eine Rückbuchung, und eine Rückbuchung ist
 * genau der Weg, über den ein Toggle-Karussell das Limit aushebeln würde.
 * Es geht dabei um höchstens ein Like je Rennen.
 */
export async function spendLikeAllowance(event: H3Event, userId: string): Promise<LikeAllowance> {
  if (!authority || !userId) return { ok: true }
  try {
    return await authority(event, userId)
  }
  catch (error) {
    logEvent('warn', 'like_allowance.spend_failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { ok: true }
  }
}
