import { z } from 'zod'
import type { TopicBacklinksResponse } from '../../../../shared/types/post'
import { backlinksForTopic } from '../../../utils/topicLinks'

/**
 * „VERLINKT VON …" — wer zeigt auf dieses Thema? (F57)
 *
 * `GET /api/posts/discussions/backlinks?targetId=…`
 *
 * ── EIGENE ROUTE STATT EINES FELDES AN `[id].get.ts` ──────────────────────
 * Die Rückverweise sind für die Themen-Detailseite NACHRANGIG: sie stehen
 * unter dem Beitrag, niemand wartet auf sie, und sie kosten zwei zusätzliche
 * Abfragen. Am Haupt-Abruf hätten sie jeden Themen-Aufbau verlangsamt — auch
 * bei den allermeisten Themen, auf die niemand verweist. Dasselbe Muster wie
 * bei den Reaktionen (`reactions.get.ts`).
 *
 * ── OFFEN FÜR GÄSTE, ABER NICHT WEITER ALS DAS THEMA ──────────────────────
 * Kein `user`-Zwang: wer das Thema lesen darf, darf auch sehen, wer darauf
 * verweist. Wie weit das reicht, entscheiden die Row-Permissions und die
 * Datentür, nicht dieser Code — `backlinksForTopic` lädt die Quell-Beiträge
 * durch dieselbe Tür und zeigt nur, was dort ankommt.
 */

const querySchema = z.object({
  targetId: z.string().trim().min(1).max(36),
})

export default defineEventHandler(async (event): Promise<TopicBacklinksResponse> => {
  requirePlanProduct(event, 'posts')

  const { targetId } = await getValidatedQuery(event, querySchema.parse)

  return { backlinks: await backlinksForTopic(event, targetId) }
})
