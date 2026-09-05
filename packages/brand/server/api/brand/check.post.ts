import { createHash } from 'node:crypto'
import { ID, Query } from 'node-appwrite'
import { createBrandCheckSchema } from '../../../schemas/brandCheck'
import {
  BRAND_CHECK_CACHE_MS,
  BRAND_CHECK_CRITERIA,
  BRAND_CHECK_SCORE_VERSION,
  type BrandCheckScores,
  brandCheckUrlKey,
  computeBrandCheck,
  pickBrandCheckFindings,
} from '../../../shared/brandCheck'
import type {
  BrandCheckCriterionResult,
  BrandCheckFinding,
  BrandCheckStartResponse,
} from '../../../shared/types/brand'
import { bookBrandCheckQuota, brandCheckIpHash } from '../../utils/brandAiQuota'
import { BRAND_CHECK_PROMPT_VERSION, judgeBrandCheck } from '../../utils/brandCheckJudge'
import { measureBrandCheck } from '../../utils/brandCheckMeasure'
import { BrandSiteFetchError, fetchBrandSite } from '../../utils/brandSiteFetch'
import { BRAND_CHECKS_TABLE, type BrandCheckRow, brandDb } from '../../utils/brandStore'

/**
 * DER KOSTENLOSE BRAND-CHECK (docs/plans/BRAND-CHECK.md) — die vierte
 * öffentliche Route des Layers und die teuerste von allen: sie baut eine
 * ausgehende Verbindung zu einer FREMDEN Adresse auf UND bezahlt einen
 * KI-Aufruf, beides ohne Konto davor (Davids Hybrid-Zugang 2026-09-05: „Score
 * sofort ohne Anmeldung").
 *
 * ── DIE REIHENFOLGE IST DIE KOSTENKONTROLLE ───────────────────────────────
 *  1. Honigtopf — gefüllt ⇒ dieselbe Antwortform, ohne dass irgendetwas
 *     passiert. Ein 400 wäre die Rückmeldung, an der ein Bot lernt.
 *  2. ZWISCHENSPEICHER — dieselbe Adresse innerhalb von sieben Tagen ⇒ die
 *     gespeicherte Zeile, KEIN Abruf, KEIN Modell, KEINE Buchung. Das ist
 *     zugleich der Kostendeckel des Plans (§2) und der Grund, warum ein
 *     geteilter Link nicht jedes Mal Geld kostet.
 *  3. Deckel buchen (3/Tag je Anschluss, 200/Tag je Instanz).
 *  4. Erst DANN lesen, messen, urteilen, speichern.
 * Was nichts kostet, kostet kein Kontingent — dieselbe Regel wie beim Wizard.
 * Andersherum sperrte sich jemand mit drei Klicks auf dasselbe Ergebnis
 * selbst aus.
 *
 * ── DIE ANTWORT IST EINE ID, NICHT DAS ERGEBNIS ───────────────────────────
 * Der Client springt auf `/brand-check/<id>` und holt es dort (`[id].get.ts`).
 * So ist das Ergebnis von der ersten Sekunde an eine ADRESSE — teilbar,
 * nachladbar, und beim zweiten Aufruf derselben Website buchstäblich dieselbe.
 *
 * ── OHNE MODELL GIBT ES KEINEN CHECK ──────────────────────────────────────
 * Anders als der Spezialist des Wizards ist diese Route NICHT fail-soft: fällt
 * der Anbieter aus, wird NICHTS gespeichert und die Antwort ist 503
 * `check_unavailable`. Sechzehn von vierzig Kriterien ergäben zwar eine Zahl,
 * aber eine, die etwas anderes misst als sie behauptet — und sie läge dann
 * sieben Tage als „Ergebnis" im Zwischenspeicher.
 *
 * ── LOG-REGEL §6 UND PLAN §5 ──────────────────────────────────────────────
 * Geloggt werden Host, Score, Dauer und Fehlercode — nie ein Stück Seitentext,
 * nie die rohe IP. GESPEICHERT wird ebenfalls kein Seitentext: nur die Belege
 * (je ≤ 160 Zeichen) und ein `textHash`.
 */
export default defineEventHandler(async (event): Promise<BrandCheckStartResponse> => {
  const body = await readValidatedBody(event, createBrandCheckSchema().parse)

  // (1) Der Honigtopf. Ununterscheidbar vom Erfolg — nur ohne Id, weil es
  // nichts gibt, worauf sie zeigen könnte.
  if (body.hp) {
    logEvent('info', 'brand.check_honeypot', { locale: body.locale })
    return { ok: true, id: '', cached: true }
  }

  const urlKey = brandCheckUrlKey(body.url)
  if (!urlKey) {
    throw createError({ status: 400, statusText: 'Invalid check payload', data: { code: 'invalid_body' } })
  }

  const { tablesDB, databaseId } = brandDb(event)

  // (2) Der Zwischenspeicher — VOR jeder Buchung und vor jedem Abruf.
  let cached: BrandCheckRow | undefined
  try {
    const found = await tablesDB.listRows<BrandCheckRow>({
      databaseId,
      tableId: BRAND_CHECKS_TABLE,
      queries: [Query.equal('urlKey', urlKey), Query.orderDesc('$createdAt'), Query.limit(1)],
    })
    cached = found.rows[0]
  }
  catch (error) {
    // Fehlende Tabelle (Migration nicht gelaufen) oder kranke Appwrite. Beides
    // heisst für den Menschen davor dasselbe: „gerade nicht möglich" — und es
    // ist besser als ein Check, der gleich beim Speichern scheitert, nachdem
    // er ein Modell bezahlt hat.
    logEvent('warn', 'brand.check_unavailable', {
      host: hostOf(body.url),
      message: error instanceof Error ? error.message : 'unknown',
    })
    throw createError({ status: 503, statusText: 'Check unavailable', data: { code: 'check_unavailable' } })
  }

  if (cached && Date.parse(cached.$createdAt) > Date.now() - BRAND_CHECK_CACHE_MS) {
    logEvent('info', 'brand.check_completed', {
      host: hostOf(body.url),
      score: cached.score,
      ms: 0,
      cached: true,
    })
    return { ok: true, id: cached.$id, cached: true }
  }

  // (3) Die zwei Deckel. Erst ab hier kostet der Aufruf etwas.
  const rejection = await bookBrandCheckQuota(event, brandCheckIpHash(event))
  if (rejection) {
    setHeader(event, 'Retry-After', rejection.retryAfterSec)
    logEvent('info', 'brand.check_throttled', { code: rejection.code })
    throw createError({
      status: 429,
      statusText: 'Brand check limit reached',
      data: { code: rejection.code },
    })
  }

  // (4a) Die Seite lesen — SSRF-Vertrag aus `shared/brandSiteAnalysis.ts`.
  const started = Date.now()
  let site: Awaited<ReturnType<typeof fetchBrandSite>>
  try {
    site = await fetchBrandSite(body.url)
  }
  catch (error) {
    const code = error instanceof BrandSiteFetchError ? error.code : 'fetch_failed'
    logEvent('info', 'brand.check_fetch_failed', {
      code,
      // Der HOST, nie der Pfad: mit dem Pfad stünde eine private Adresse im Log.
      host: hostOf(body.url),
      ms: Date.now() - started,
    })
    throw createError({
      // „Da dürfen wir nicht hin" ist ein 400 (die ADRESSE ist das Problem);
      // alles andere ist ein 422 — die Adresse war in Ordnung, hinter ihr stand
      // nur nichts Lesbares. Ein 502 wäre die falsche Auskunft: nicht WIR sind
      // ausgefallen.
      status: code === 'blocked_target' ? 400 : 422,
      statusText: 'Website could not be checked',
      data: { code: code === 'blocked_target' ? 'blocked_target' : 'fetch_failed' },
    })
  }

  // (4b) Die sechzehn gerechneten Kriterien — deterministisch, ohne Modell.
  const measured = measureBrandCheck({
    content: site.content,
    signals: site.signals,
    finalUrl: site.finalUrl,
    httpsUpgraded: site.httpsUpgraded,
  })

  // (4c) Die vierundzwanzig beurteilten — EIN Aufruf.
  let judged: Awaited<ReturnType<typeof judgeBrandCheck>>
  try {
    judged = await judgeBrandCheck(event, { content: site.content, signals: site.signals })
  }
  catch (error) {
    logEvent('warn', 'brand.check_provider_error', {
      host: site.finalHost,
      ms: Date.now() - started,
      // Die MELDUNG des Anbieters, nie der Prompt und nie die Antwort.
      message: error instanceof Error ? error.message : 'unknown',
    })
    throw createError({ status: 503, statusText: 'Check unavailable', data: { code: 'check_unavailable' } })
  }

  // (4d) Zusammenlegen — in KATALOG-Reihenfolge, damit die Ergebnis-Seite
  // nichts sortieren muss. Was weder gemessen noch beurteilt wurde, ist
  // `null`: „nicht bewertbar", nicht „null Punkte".
  const criteria: BrandCheckCriterionResult[] = BRAND_CHECK_CRITERIA.map((criterion) => {
    const judgement = criterion.kind === 'judged' ? judged.judgements[criterion.id] : undefined
    const source = criterion.kind === 'measured' ? measured[criterion.id] : judgement
    return {
      id: criterion.id,
      category: criterion.category,
      kind: criterion.kind,
      score: source?.score ?? null,
      evidence: source?.evidence ?? '',
      // Der eine Satz des Modells. Gerechnete Kriterien haben keinen — ihr
      // Beleg IST die Begründung.
      note: judgement?.note ?? '',
    }
  })

  const scores: BrandCheckScores = {}
  for (const entry of criteria) scores[entry.id] = entry.score

  const computation = computeBrandCheck(scores)
  const findings: BrandCheckFinding[] = pickBrandCheckFindings(scores).map(criterionId => ({
    criterionId,
    evidence: criteria.find(entry => entry.id === criterionId)?.evidence ?? '',
  }))

  // (4e) Speichern. JEDE Spalte explizit (CLAUDE.md) — eine neue Spalte soll
  // eine Entscheidung an dieser Stelle sein, kein stiller Default.
  let rowId: string
  try {
    const row = await tablesDB.createRow<BrandCheckRow>({
      databaseId,
      tableId: BRAND_CHECKS_TABLE,
      rowId: ID.unique(),
      data: {
        urlKey,
        url: site.finalUrl.slice(0, 512),
        host: site.finalHost.slice(0, 256),
        locale: body.locale,
        score: computation.score,
        band: computation.band,
        scoreVersion: BRAND_CHECK_SCORE_VERSION,
        promptVersion: BRAND_CHECK_PROMPT_VERSION,
        model: judged.model.slice(0, 120),
        categories: JSON.stringify(computation.categories),
        criteria: JSON.stringify(criteria),
        findings: JSON.stringify(findings),
        // Der einzige Rest der gelesenen Seite (Plan §5, „kein Rohtext").
        textHash: createHash('sha256').update(site.content.text).digest('hex'),
        ipHash: brandCheckIpHash(event),
      },
    })
    rowId = row.$id
  }
  catch (error) {
    logEvent('warn', 'brand.check_unavailable', {
      host: site.finalHost,
      message: error instanceof Error ? error.message : 'unknown',
    })
    throw createError({ status: 503, statusText: 'Check unavailable', data: { code: 'check_unavailable' } })
  }

  logEvent('info', 'brand.check_completed', {
    host: site.finalHost,
    score: computation.score,
    ms: Date.now() - started,
    cached: false,
  })

  return { ok: true, id: rowId, cached: false }
})

/** Nur der Host — und nur, wenn sich die Eingabe überhaupt als URL lesen lässt. */
function hostOf(value: string): string {
  try {
    return new URL(value).host
  }
  catch {
    return ''
  }
}
