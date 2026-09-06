import type { H3Event } from 'h3'
import type { MarketRunResponse } from '../../../../../shared/types/marketApi'
import type { MarketRunStep } from '../../../../../shared/marketProfile'
import { MARKET_MAX_CHARS_PER_RUN } from '../../../../../shared/marketCrawlRules'
import { readBrandAiEnabled } from '../../../../contracts/brandContract'
import { requireMarketProfile, requireMarketUnlocked } from '../../../../utils/marketAccess'
import { bookMarketRun } from '../../../../utils/marketQuota'
import {
  createMarketProfile,
  listMarketCompetitors,
  listMarketProfiles,
  updateMarketCompetitor,
} from '../../../../utils/marketStore'
import { fetchMarketCompetitor } from '../../../../utils/marketFetch'
import { extractMarketProfile, marketInputHash } from '../../../../utils/marketExtract'
import { collectMarketAiView } from '../../../../utils/marketAiView'
import { foundationMarketFields, latestProfilesByCompetitor } from '../../../../utils/marketViews'
import type { MarketCompetitorRow } from '../../../../../shared/types/market'

/**
 * DER LAUF (Plan §2.3 Schritte 2–3, §7.5; MV1 M2).
 *
 * ── WAS ER TUT UND WAS NICHT ──────────────────────────────────────────────
 * Er holt (Schritt 2), wertet aus (Schritt 3) und fragt die KI-Aussensicht
 * (§7.5). Den VERGLEICH (Bericht, Konventionen, Überschneidungen, freie
 * Stellen, Befunde) macht er NICHT — der ist M3. Wer ihn hier einbaute, hätte
 * zwei halbe Pakete statt eines ganzen.
 *
 * ── SEQUENTIELL, NICHT PARALLEL ───────────────────────────────────────────
 * Fünf Wettbewerber nacheinander. Parallel wäre schneller und wäre falsch:
 * jeder Kandidat holt bis zu acht Seiten von EINEM fremden Server, und
 * gleichzeitige Läufe machten aus einem Lesevorgang eine kleine Last. Ausserdem
 * teilt sich der Lauf EIN Zeichen-Budget (§2.8) — das lässt sich nur der Reihe
 * nach herunterrechnen.
 *
 * ── FAIL-SOFT JE KANDIDAT ─────────────────────────────────────────────────
 * Ein nicht erreichbarer Wettbewerber wird als `failed` vermerkt und der Lauf
 * geht weiter. Vier von fünf sind ein Vergleich; ein Abbruch wäre keiner.
 *
 * ── IDEMPOTENZ ÜBER DEN ROHTEXT ───────────────────────────────────────────
 * Gleiches `inputHash` ⇒ kein zweiter Modell-Aufruf. Der Abruf läuft trotzdem
 * (die Website könnte sich geändert haben — das FESTZUSTELLEN ist ja gerade
 * der Zweck); die teure Hälfte spart der Hash.
 */

/** Was ein Kandidat nach seinem Durchgang zu berichten hat. */
interface CandidateOutcome {
  step: MarketRunStep
  extracted: boolean
  reused: boolean
  charsUsed: number
}

export default defineEventHandler(async (event): Promise<MarketRunResponse> => {
  const { profileId, profile } = await requireMarketProfile(event)
  await requireMarketUnlocked(event, profileId)

  const competitors = await listMarketCompetitors(event, profileId)
  if (!competitors.length) {
    return { ran: false, steps: [], aiEnabled: await readBrandAiEnabled(event), extracted: 0, reused: 0 }
  }

  const aiEnabled = await readBrandAiEnabled(event)

  // DIE DROSSEL ERST HIER: bis hierher wurde nichts geholt und nichts gerufen.
  // Ein Lauf ohne Kandidaten hat nichts gekostet und kostet kein Kontingent.
  const rejection = await bookMarketRun(event, profileId)
  if (rejection) {
    setResponseHeader(event, 'Retry-After', rejection.retryAfterSec)
    throw createError({
      status: 429,
      statusText: 'Too many market runs',
      data: { code: rejection.code },
    })
  }

  const previousProfiles = latestProfilesByCompetitor(await listMarketProfiles(event, profileId))
  const steps: MarketRunStep[] = []
  let extracted = 0
  let reused = 0
  let budget = MARKET_MAX_CHARS_PER_RUN

  for (const competitor of competitors) {
    const outcome = competitor.sourceKind === 'foundation'
      ? await runFoundationCandidate(event, profileId, competitor)
      : await runWebsiteCandidate(event, profileId, competitor, {
          aiEnabled,
          budget,
          contentLocale: profile.contentLocale,
          previousHash: previousProfiles.get(competitor.$id)?.inputHash ?? '',
        })

    steps.push(outcome.step)
    if (outcome.extracted) extracted++
    if (outcome.reused) reused++
    budget = Math.max(0, budget - outcome.charsUsed)
  }

  logEvent('info', 'market.run', {
    // ZAHLEN, kein Inhalt — keine Adresse, kein Name, kein Zitat.
    competitors: competitors.length,
    extracted,
    reused,
    excluded: steps.filter(step => step.status === 'excluded').length,
    failed: steps.filter(step => step.status === 'failed').length,
    aiEnabled,
  })

  return { ran: true, steps, aiEnabled, extracted, reused }
})

/**
 * DIE EIGENE MARKE (§7.2 Nr. 2) — kein Abruf, kein Modell, keine Kosten.
 *
 * Sie wird bei JEDEM Lauf neu geschrieben, und das ist Absicht: die
 * Foundation ändert sich, während der Kunde arbeitet, und ein eingefrorenes
 * eigenes Profil wäre im Relaunch-Vergleich genau die Hälfte, die veraltet.
 */
async function runFoundationCandidate(
  event: H3Event,
  profileId: string,
  competitor: MarketCompetitorRow,
): Promise<CandidateOutcome> {
  const source = competitor.sourceRef || profileId
  const fields = await foundationMarketFields(event, source)

  await createMarketProfile(event, profileId, competitor.$id, {
    fields: JSON.stringify(fields),
    aiOutsideView: '',
    extractedAt: new Date().toISOString(),
    model: '',
    promptVersion: '',
    // Der Hash über die WERTE, nicht über einen Rohtext — es gibt keinen.
    inputHash: marketInputHash(JSON.stringify(fields)),
  })
  await updateMarketCompetitor(event, profileId, competitor.$id, {
    status: 'fetched',
    excludedReason: '',
    fetchedAt: new Date().toISOString(),
  })

  return {
    step: {
      competitorId: competitor.$id,
      name: competitor.name,
      status: 'fetched',
      // Es wurde keine `robots.txt` gefragt, weil nichts geholt wurde — die
      // Zeile erscheint erst, wenn sie wahr ist (Kopf von `MarketRunStep`).
      robotsChecked: false,
      pagesRead: 0,
    },
    extracted: true,
    reused: false,
    charsUsed: 0,
  }
}

interface WebsiteRunOptions {
  aiEnabled: boolean
  budget: number
  contentLocale: string
  previousHash: string
}

/** Der Normalfall: Abruf, Auswertung, Aussensicht. */
async function runWebsiteCandidate(
  event: H3Event,
  profileId: string,
  competitor: MarketCompetitorRow,
  options: WebsiteRunOptions,
): Promise<CandidateOutcome> {
  const url = competitor.url ?? ''
  if (!url) {
    return {
      step: {
        competitorId: competitor.$id,
        name: competitor.name,
        status: 'failed',
        robotsChecked: false,
        pagesRead: 0,
        excludedReason: 'unreachable',
      },
      extracted: false,
      reused: false,
      charsUsed: 0,
    }
  }

  const outcome = await fetchMarketCompetitor(url, { budgetChars: options.budget })
  const now = new Date()
  const pageUrls = outcome.pages.map(page => page.url)

  // DER ABRUFSTAND WIRD IMMER GESCHRIEBEN — auch bei Ausschluss und Fehlschlag.
  // „Wir haben nachgesehen und durften nicht" ist eine Auskunft, die der Kunde
  // bekommen soll (§2.3: „ausgeschlossen, weil die Website die Auswertung
  // untersagt"), und ohne Stempel liefe der nächste Lauf blind wieder los.
  await updateMarketCompetitor(event, profileId, competitor.$id, {
    status: outcome.status,
    excludedReason: outcome.reason ?? '',
    pagesFetched: JSON.stringify(outcome.pages),
    fetchedAt: now.toISOString(),
    rawText: outcome.rawText || null,
    // DIE 24-STUNDEN-FRIST (§2.9 Nr. 6). Der Sweep, der sie einlöst, kommt mit
    // M5; der Stempel steht ab jetzt, denn eine Frist, die erst später
    // gesetzt wird, gilt für den heutigen Rohtext nie.
    rawExpiresAt: outcome.rawText ? new Date(now.getTime() + 24 * 60 * 60_000).toISOString() : null,
  })

  const step: MarketRunStep = {
    competitorId: competitor.$id,
    name: competitor.name,
    status: outcome.status,
    robotsChecked: true,
    pagesRead: outcome.pages.length,
    ...(outcome.reason ? { excludedReason: outcome.reason } : {}),
    ...(outcome.sitemapUrls ? { sitemapUrls: outcome.sitemapUrls } : {}),
    llmsTxt: outcome.llmsTxt,
    jsonLd: outcome.jsonLd,
  }

  if (outcome.status !== 'fetched') {
    return { step, extracted: false, reused: false, charsUsed: 0 }
  }

  const charsUsed = outcome.rawText.length

  // ── Idempotenz (§2.3 Nr. 5) ──────────────────────────────────────────────
  const inputHash = marketInputHash(outcome.rawText)
  if (inputHash && inputHash === options.previousHash) {
    return { step, extracted: false, reused: true, charsUsed }
  }

  // ── Kill-Switch (§2.8) ───────────────────────────────────────────────────
  // Der Abruf ist gelaufen und steht in der Zeile; die AUSWERTUNG unterbleibt.
  // Genau so ist es zugesagt: „die Seite zeigt Kandidaten und Abrufstand, der
  // Vergleich meldet: KI ist aus".
  if (!options.aiEnabled) {
    return { step, extracted: false, reused: false, charsUsed }
  }

  const extraction = await extractMarketProfile(event, {
    competitorName: competitor.name,
    pageUrls,
    rawText: outcome.rawText,
  })
  if (extraction.failure) {
    return { step, extracted: false, reused: false, charsUsed }
  }

  const host = hostOf(url)
  const aiView = await collectMarketAiView(event, {
    brandName: competitor.name,
    host,
    locale: options.contentLocale || 'en',
  })

  await createMarketProfile(event, profileId, competitor.$id, {
    fields: JSON.stringify(extraction.fields),
    // Die Aussensicht in ihre EIGENE Spalte (§7.5 a) — nie in `fields`.
    aiOutsideView: aiView.statements.length ? JSON.stringify(aiView.statements) : '',
    extractedAt: new Date().toISOString(),
    model: extraction.model,
    promptVersion: extraction.promptVersion,
    inputHash,
  })

  return { step, extracted: true, reused: false, charsUsed }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  }
  catch {
    return ''
  }
}
