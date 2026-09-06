import type { MarketOverviewResponse } from '../../../../../shared/types/marketApi'
import type { MarketAiView, MarketProfile } from '../../../../../shared/marketProfile'
import { MARKET_COMPETITORS_MAX } from '../../../../../shared/marketProfile'
import { resolveMarketPaywall } from '../../../../../shared/marketPaywall'
import { brandMarketVisibilityOf, readBrandAiEnabled } from '../../../../contracts/brandContract'
import { MARKET_UNLOCK_STEP, marketUnlocked, requireMarketProfile } from '../../../../utils/marketAccess'
import { listMarketCompetitors, listMarketProfiles } from '../../../../utils/marketStore'
import { loadMarketBrandChecks } from '../../../../utils/marketBrandCheck'
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
 *
 * ── SEIT MV1 M4 TRÄGT SIE AUCH DEN ZUSTAND DER SEITE ─────────────────────
 * Freischaltung (§2.4), Schranke (§1.9), Deckel und Opt-in (§7.2 Nr. 4). Alle
 * vier sind Tatsachen ÜBER DIESES BRANDING, sie kosten hier keine zusätzliche
 * Abfrage (die Profil-Zeile liegt schon vor, die Kapitel-Zeile ist ein
 * `getRow` auf eine deterministische Id) — und die Seite braucht sie beim
 * ERSTEN Rendern, weil sie sonst zwischen „gesperrt" und „offen" flackerte.
 * Die Route bleibt bewusst OHNE Freischaltungs-Schranke: Ansehen kostet
 * nichts, und eine Seite, die ihre eigene Sperre nicht laden dürfte, könnte
 * sie nicht erklären.
 */
export default defineEventHandler(async (event): Promise<MarketOverviewResponse> => {
  const { profileId, profile } = await requireMarketProfile(event)

  const [competitors, profileRows, aiEnabled, unlocked] = await Promise.all([
    listMarketCompetitors(event, profileId),
    listMarketProfiles(event, profileId),
    readBrandAiEnabled(event),
    marketUnlocked(event, profileId),
  ])

  const latest = latestProfilesByCompetitor(profileRows)
  const profiles: MarketProfile[] = []
  const aiViews: MarketAiView[] = []
  for (const row of latest.values()) {
    profiles.push(toMarketProfile(row))
    const view = toMarketAiView(row)
    if (view) aiViews.push(view)
  }

  // Der BESTEHENDE Brand-Check-Score je Website-Kandidat (§7.3, MV1 M3) —
  // gelesen, nie gerechnet.
  const checks = await loadMarketBrandChecks(event, competitors)

  return {
    competitors: competitors.map(row => toMarketCompetitor(row, checks.get(row.$id) ?? null)),
    profiles,
    aiViews,
    aiEnabled,
    unlocked,
    unlockStepKey: MARKET_UNLOCK_STEP,
    // Wer hier ankommt, ist durch `requireBrandAccess` gegangen — das IST der
    // Beta-Zugang. Die Rechnung steht trotzdem in einer puren Funktion, damit
    // der gesperrte Zweig eine Tatsache bleibt und kein toter Code
    // (Begründung ausführlich in `shared/marketPaywall.ts`).
    paywall: resolveMarketPaywall({ betaAccess: true }),
    max: MARKET_COMPETITORS_MAX,
    marketVisibility: brandMarketVisibilityOf(profile),
  }
})
