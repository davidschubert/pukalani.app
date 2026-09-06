import type { MarketCompetitorListResponse } from '../../../../../../shared/types/marketApi'
import { MARKET_COMPETITORS_MAX } from '../../../../../../shared/marketProfile'
import { requireMarketProfile } from '../../../../../utils/marketAccess'
import { listMarketCompetitors } from '../../../../../utils/marketStore'
import { toMarketCompetitor } from '../../../../../utils/marketViews'

/**
 * DIE KANDIDATEN EINES BRANDINGS (MV1 M2).
 *
 * OHNE Freischaltungs-Prüfung: Wettbewerber einzutragen, während man an
 * Kapitel B arbeitet, ist eine sinnvolle Reihenfolge — gesperrt ist der LAUF
 * (Begründung im Kopf von `marketAccess.ts`).
 */
export default defineEventHandler(async (event): Promise<MarketCompetitorListResponse> => {
  const { profileId } = await requireMarketProfile(event)
  const rows = await listMarketCompetitors(event, profileId)
  return {
    competitors: rows.map(toMarketCompetitor),
    max: MARKET_COMPETITORS_MAX,
  }
})
