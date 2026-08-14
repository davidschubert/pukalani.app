import type { ReactionsResponse } from '../../../../shared/types/post'
import { MAX_REACTION_TARGETS, allowedReactionsFor, loadReactionSummary } from '../../../../server/utils/reactions'

/**
 * DIE REAKTIONEN MEHRERER ZIELE IN EINEM RUTSCH (F57 Mechanik 1).
 *
 * `GET /api/posts/discussions/reactions?targetIds=a,b,c`
 *
 * ── EINE ABFRAGE, NICHT 25 ────────────────────────────────────────────────
 * Die Themenseite kennt ihre sichtbaren Ziele, bevor sie fragt — also fragt sie
 * EINMAL fuer alle. Der naheliegende Weg (jede Karte holt sich ihre eigenen
 * Reaktionen) waere bei 25 Karten 25 Abfragen, und zwar bei JEDEM Seitenaufbau.
 * Das Buendeln passiert im Client (`useReactions`), das Zaehlen hier.
 *
 * ── OFFEN FUER GAeSTE, ABER NICHT WEITER ALS DER BEITRAG ──────────────────
 * Kein `user`-Zwang: wer den Beitrag lesen darf, darf auch sehen, wie darauf
 * reagiert wurde. WIE WEIT das reicht, entscheiden die Row-Permissions und
 * nicht dieser Code (Begruendung in `server/utils/reactions.ts`). Ohne
 * Anmeldung gibt es lediglich kein `mine` — man sieht die Zahlen, nicht die
 * eigene Beteiligung, weil es keine gibt.
 */
export default defineEventHandler(async (event): Promise<ReactionsResponse> => {
  requirePlanProduct(event, 'posts')

  const query = getQuery(event)
  const raw = typeof query.targetIds === 'string' ? query.targetIds : ''
  const targetIds = raw.split(',').map(id => id.trim()).filter(Boolean)

  if (targetIds.length > MAX_REACTION_TARGETS) {
    throw createError({ status: 400, statusText: 'Too many targets' })
  }

  const allowed = allowedReactionsFor()
  const reactions = await loadReactionSummary(event, targetIds, event.context.user?.$id ?? null, allowed)

  return { reactions, allowed }
})
