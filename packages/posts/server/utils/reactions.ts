import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import {
  type ReactionKey,
  type ReactionSummary,
  type ReactionTargetType,
  aggregateReactions,
  allowedReactions,
} from '../../shared/reactions'
import { DISCUSSION_REACTIONS_TABLE, POSTS_TABLE, type CommunityPost, type DiscussionReaction } from '../../shared/types/post'

/**
 * DIE SERVER-SEITE DER EMOJI-REAKTIONEN (F57 Mechanik 1) — alles, was sich die
 * Lese- und die Schreib-Route teilen.
 */

/**
 * Wie viele Ziele eine gebuendelte Abfrage tragen darf.
 *
 * Eine Themenseite zeigt heute EIN reagierbares Ziel, eine Themenliste bis zu
 * 25. Die Obergrenze ist trotzdem hart: der Parameter kommt vom Client, und
 * ohne Deckel waere er eine Einladung, die halbe Community in einem Rutsch
 * abzufragen.
 */
export const MAX_REACTION_TARGETS = 50

/**
 * Wie viele Reaktions-ZEILEN eine gebuendelte Abfrage hoechstens einsammelt.
 *
 * EHRLICH GESAGT EINE DECKELUNG, KEINE VOLLSTAENDIGKEIT: darueber hinaus
 * zaehlt die Leiste zu niedrig. Das ist die bewusste Abwaegung des MVP — die
 * Alternativen waeren eine Abfrage je Emoji und Ziel (bei 25 Zielen 200
 * Abfragen) oder eine denormalisierte Zaehler-Spalte mit allen
 * Konsistenz-Schreibwegen, die „Hot" schon hat. Wird die Grenze real erreicht,
 * ist die Spalte der naechste Schritt — nicht ein groesseres Fenster.
 */
export const REACTION_BUNDLE_LIMIT = 1000

/**
 * Der in DIESER App erlaubte Satz — App-Config kuerzt, erweitert nie.
 *
 * OHNE `event`, weil `useAppConfig()` in Nitro keines nimmt: die `app.config`
 * ist zur Bauzeit gemergt und damit fuer alle Requests dieselbe. Nicht zu
 * verwechseln mit `getAppConfig(event)` — das ist die Zeile in der Datenbank
 * (Wartungsmodus, KI-Modell) und sehr wohl request-abhaengig.
 */
export function allowedReactionsFor(): ReactionKey[] {
  const appConfig = useAppConfig() as {
    pukalani?: { discussions?: { reactions?: string[] } }
  }
  return allowedReactions(appConfig.pukalani?.discussions?.reactions)
}

/**
 * DAS ZIEL AUFLOESEN — und damit die Mandanten-Grenze belegen.
 *
 * Ueber die OPERATOR-Klinke, wie beim Stimmen (`score.post.ts`): gelesen wird
 * eine FREMDE Zeile, um eine Tatsache ueber sie festzustellen. Die Datentuer
 * ist dabei die Grenze — ein Beitrag aus einer anderen Community ergibt 404,
 * nicht 403, genau wie ueberall sonst.
 *
 * DREI ABLEHNUNGEN, jede mit ihrem Grund:
 *  - unbekannt/fremder Mandant ⇒ 404 (die Datentuer)
 *  - nicht veroeffentlicht (geplant, ausgeblendet, geloescht) ⇒ 409
 *  - OHNE KATEGORIE ⇒ 409 `reaction_target_not_topic`. Das ist die Stelle, an
 *    der „Feed-Beitraege nicht im MVP" durchgesetzt wird: Thema und
 *    Feed-Beitrag sind DIESELBE Tabelle (`community_posts`), unterschieden nur
 *    durch die Kategorie. Ohne diese Pruefung waere die Reaktion still auch im
 *    Feed offen — eine eigene Flaeche mit eigener Produkt-Entscheidung.
 */
export async function resolveReactionTarget(
  event: H3Event,
  targetType: ReactionTargetType,
  targetId: string,
): Promise<CommunityPost> {
  const ops = tenantDb(event, { as: 'operator' })
  const target = await ops.get<CommunityPost>(POSTS_TABLE, targetId, 'Target not found')

  if (target.status !== 'published') {
    throw createError({
      status: 409,
      statusText: 'Target not reactable',
      data: { code: 'reaction_target_not_reactable' },
    })
  }
  if (!target.categoryId) {
    throw createError({
      status: 409,
      statusText: 'Target is not a topic',
      data: { code: 'reaction_target_not_topic' },
    })
  }
  return target
}

/**
 * DIE EINE GEBUENDELTE LESEABFRAGE — Reaktionen ALLER sichtbaren Ziele.
 *
 * ── WARUM DIE MITGLIEDER-KLINKE UND NICHT DER OPERATOR ────────────────────
 * Weil die Row-Permissions hier genau die richtige Antwort geben und mein Code
 * sie nicht nachbauen muss: die Zeilen tragen das Publikum ihres Beitrags
 * (`read: 'public'`, von C18 auf Mitglieder heruntergestuft, wenn die Community
 * das so will). Ein Gast auf einer oeffentlichen Community sieht die Zahlen,
 * derselbe Gast auf einer mitglieder-privaten sieht sie nicht — ohne eine
 * einzige Verzweigung. Mit der Operator-Klinke waere die Sichtbarkeit meine
 * Erfindung, und die erste falsche Verzweigung waere ein Leck.
 *
 * Gelesen wird NIE geschrieben: keine Sperre (M13), kein Beitritt (A5).
 */
export async function loadReactionSummary(
  event: H3Event,
  targetIds: readonly string[],
  viewerId: string | null,
  allowed: readonly ReactionKey[],
): Promise<ReactionSummary> {
  const ids = [...new Set(targetIds.filter(Boolean))].slice(0, MAX_REACTION_TARGETS)
  if (ids.length === 0) return {}

  const db = tenantDb(event)
  const { rows } = await db.list<DiscussionReaction>(DISCUSSION_REACTIONS_TABLE, [
    Query.equal('targetId', ids),
    Query.limit(REACTION_BUNDLE_LIMIT),
  ])

  return aggregateReactions(rows, viewerId, allowed)
}
