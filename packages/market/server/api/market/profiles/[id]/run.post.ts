import type { H3Event } from 'h3'
import type { MarketRunResponse } from '../../../../../shared/types/marketApi'
import type { MarketProfileField, MarketRunStep } from '../../../../../shared/marketProfile'
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
import { latestProfilesByCompetitor } from '../../../../utils/marketViews'
import { loadMarketFoundationCandidate } from '../../../../utils/marketOwnProfile'
import { marketLibraryEntry, marketLibraryFields } from '../../../../../shared/marketLibrary'
import { loadMarketReportState, produceMarketReport } from '../../../../utils/marketReportService'
import type { MarketCompetitorRow } from '../../../../../shared/types/market'

/**
 * DER LAUF (Plan §2.3 Schritte 2–3, §7.5; MV1 M2).
 *
 * ── WAS ER TUT UND WAS NICHT ──────────────────────────────────────────────
 * Er holt (Schritt 2), wertet aus (Schritt 3) und fragt die KI-Aussensicht
 * (§7.5). Den VERGLEICH macht er NUR AUF ANSAGE (`withReport`, MV1 M3).
 *
 * ── WARUM EIN FLAG UND KEIN AUTOMATISMUS ──────────────────────────────────
 * Aus Kundensicht gibt es EINEN Knopf („Markt vergleichen"), technisch sind es
 * zwei Schritte. Drei Wege wären denkbar gewesen, und zwei sind falsch:
 * (a) der Lauf hängt den Bericht IMMER an — dann kostet jeder Abruf-Lauf
 * einen Modell-Aufruf, auch wenn niemand einen Vergleich sehen will, und der
 * Beweis von M2 misst plötzlich eine andere Antwortform; (b) die Oberfläche
 * ruft immer beide Routen — dann muss sie den Fall „Lauf gut, Bericht kaputt"
 * selbst zusammensetzen, und zwei Knöpfe wären nur noch eine Frage der Zeit.
 * Gewählt ist (c): `withReport` ist ein FLAG mit Default `false`. Der Lauf
 * bleibt, was er war (M2s Beweis läuft unverändert weiter), und M4 setzt das
 * Flag für den einen Knopf. Fällt der Bericht aus, steht der Abruf trotzdem —
 * `report` ist dann schlicht `null`.
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
  const { userId, profileId, profile } = await requireMarketProfile(event)
  await requireMarketUnlocked(event, profileId)

  // Das Flag darf aus der Adresszeile ODER dem Rumpf kommen: M4 ruft die Route
  // per `$fetch` mit Rumpf, ein Beweis bequemer mit `?report=1`. Beides meint
  // dasselbe, und eine zweite Route dafür wäre eine zweite Freischaltung.
  const query = getQuery(event)
  const body = await readBody(event).catch(() => null) as { withReport?: unknown } | null
  const withReport = query.report === '1' || query.report === 'true' || body?.withReport === true

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
    const outcome = competitor.sourceKind === 'foundation' || competitor.sourceKind === 'library'
      ? await runStoredCandidate(event, userId, profileId, competitor, previousProfiles.get(competitor.$id)?.inputHash ?? '')
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

  // ── Der Vergleich, nur auf Ansage (s. Kopf) ──────────────────────────────
  let report: MarketRunResponse['report'] = null
  if (withReport) {
    try {
      const state = await loadMarketReportState(event, profileId)
      if (state.withProfile > 0) {
        report = (await produceMarketReport(event, profileId, state, {
          locale: profile.contentLocale,
          aiEnabled,
        })).view
      }
    }
    catch (error) {
      // FAIL-SOFT — und zwar bewusst anders als in der eigenen Bericht-Route:
      // dort ist der Bericht der ZWECK des Aufrufs, hier ist er eine Zugabe.
      // Ein Deckel oder ein ausgefallener Anbieter darf einen gelungenen Abruf
      // nicht in eine Fehlermeldung verwandeln — der Kunde holt den Vergleich
      // dann über `POST /report` nach und erfährt DORT den Grund.
      logEvent('warn', 'market.run_report_failed', {
        status: typeof (error as { statusCode?: unknown })?.statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : 0,
      })
    }
  }

  return { ran: true, steps, aiEnabled, extracted, reused, report }
})

/**
 * DIE ZWEI QUELLEN OHNE ABRUF (§7.2 Nr. 2 und 3) — kein Netz, kein Modell,
 * keine Kosten.
 *
 * ── `foundation`: DIE EIGENE MARKE ────────────────────────────────────────
 * Sie wird bei JEDEM Lauf neu geschrieben, und das ist Absicht: die Foundation
 * ändert sich, während der Kunde arbeitet, und ein eingefrorenes eigenes
 * Profil wäre im Relaunch-Vergleich genau die Hälfte, die veraltet. Der
 * BESITZ wird dabei erneut geprüft (`loadMarketFoundationCandidate`) — er kann
 * sich zwischen Anlegen und Lauf geändert haben.
 *
 * ── `library`: EIN HANDGEPRÜFTER EINTRAG ──────────────────────────────────
 * Er wird NICHT abgerufen (Plan §7.2 Nr. 3: „von uns mit demselben Motor
 * gerechnet und VON HAND GEPRÜFT, versioniert im Repo"). Ein Abruf wäre hier
 * sogar schädlich: die Bibliothek ist eine redaktionelle Aussage mit Datum und
 * Namenszeichen, und ein Lauf, der sie stillschweigend durch frischen
 * Maschinentext ersetzte, nähme ihr genau das, wofür es sie gibt.
 *
 * Ein Eintrag, den es NICHT MEHR GIBT (die Datei ist versioniert, Einträge
 * dürfen verschwinden), wird `failed` — nicht still übersprungen: der Kandidat
 * steht in der Liste des Kunden, und „da war mal was" ist eine Auskunft.
 */
async function runStoredCandidate(
  event: H3Event,
  userId: string,
  profileId: string,
  competitor: MarketCompetitorRow,
  previousHash: string,
): Promise<CandidateOutcome> {
  let fields: MarketProfileField[]

  if (competitor.sourceKind === 'library') {
    const entry = marketLibraryEntry(competitor.sourceRef ?? '')
    if (!entry) {
      await updateMarketCompetitor(event, profileId, competitor.$id, {
        status: 'failed',
        excludedReason: 'noText',
      })
      return {
        step: {
          competitorId: competitor.$id,
          name: competitor.name,
          status: 'failed',
          robotsChecked: false,
          pagesRead: 0,
          excludedReason: 'noText',
        },
        extracted: false,
        reused: false,
        charsUsed: 0,
      }
    }
    fields = marketLibraryFields(entry)
  }
  else {
    fields = [...(await loadMarketFoundationCandidate(
      event,
      userId,
      competitor.sourceRef ?? '',
      profileId,
    )).fields]
  }

  // DIESELBE IDEMPOTENZ WIE BEIM WEBSITE-KANDIDATEN, nur über die WERTE statt
  // über einen Rohtext — es gibt hier keinen. Unveränderte Foundation,
  // unveränderte Bibliothek ⇒ keine zweite Zeile. Ohne das wüchse die
  // Verlaufs-Tabelle bei jedem Lauf um Kopien, und `market_profiles` ist ein
  // VERLAUF und keine Protokolldatei.
  const inputHash = marketInputHash(JSON.stringify(fields))
  const unchanged = Boolean(inputHash) && inputHash === previousHash

  if (!unchanged) {
    await createMarketProfile(event, profileId, competitor.$id, {
      fields: JSON.stringify(fields),
      aiOutsideView: '',
      extractedAt: new Date().toISOString(),
      model: '',
      promptVersion: '',
      inputHash,
    })
  }
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
    extracted: !unchanged,
    reused: unchanged,
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
