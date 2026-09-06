import type { MarketOverviewResponse } from '../../../../../shared/types/marketApi'
import type { MarketAiView, MarketProfile } from '../../../../../shared/marketProfile'
import { readBrandAiEnabled } from '../../../../contracts/brandContract'
import { requireMarketProfile } from '../../../../utils/marketAccess'
import { listMarketCompetitors, listMarketProfiles } from '../../../../utils/marketStore'
import {
  latestProfilesByCompetitor,
  toMarketAiView,
  toMarketCompetitor,
  toMarketProfile,
} from '../../../../utils/marketViews'

/**
 * DER STAND EINES BRANDINGS (MV1 M2): Kandidaten, ihre JÜNGSTEN Marktprofile
 * und die getrennt gehaltene KI-Aussensicht.
 *
 * ── WARUM NUR DAS JÜNGSTE PROFIL ──────────────────────────────────────────
 * Die Tabelle hält den Verlauf (jeder Abrufstand legt eine neue Zeile an). Die
 * SEITE zeigt einen Stand, nicht eine Geschichte — und ein Vergleich, in dem
 * derselbe Wettbewerber zweimal mit verschiedenen Sätzen steht, wäre keiner.
 *
 * ── `aiViews` STEHT NEBEN `profiles`, NICHT DARIN ─────────────────────────
 * Die Trennung ist die Leitplanke selbst (§7.5 a): „Website sagt" und
 * „KI-Antworten sagen" dürfen sich nirgends berühren. Sie kommen aus derselben
 * ZEILE, aber aus zwei Spalten — und verlassen den Server als zwei Listen.
 */
export default defineEventHandler(async (event): Promise<MarketOverviewResponse> => {
  const { profileId } = await requireMarketProfile(event)

  const [competitors, profileRows, aiEnabled] = await Promise.all([
    listMarketCompetitors(event, profileId),
    listMarketProfiles(event, profileId),
    readBrandAiEnabled(event),
  ])

  const latest = latestProfilesByCompetitor(profileRows)
  const profiles: MarketProfile[] = []
  const aiViews: MarketAiView[] = []
  for (const row of latest.values()) {
    profiles.push(toMarketProfile(row))
    const view = toMarketAiView(row)
    if (view) aiViews.push(view)
  }

  return {
    competitors: competitors.map(toMarketCompetitor),
    profiles,
    aiViews,
    aiEnabled,
  }
})
