import { z } from 'zod'
import type { MarketCompetitorResponse } from '../../../../../../shared/types/marketApi'
import { MARKET_COMPETITORS_MAX } from '../../../../../../shared/marketProfile'
import {
  MARKET_COMPETITOR_DUPLICATE_CODE,
  MARKET_COMPETITOR_LIMIT_CODE,
  MARKET_INVALID_URL_CODE,
} from '../../../../../../shared/marketLimits'
import { normalizeMarketUrl } from '../../../../../../shared/marketCrawlRules'
import { requireMarketProfile } from '../../../../../utils/marketAccess'
import { createMarketCompetitor, listMarketCompetitors } from '../../../../../utils/marketStore'
import { toMarketCompetitor } from '../../../../../utils/marketViews'

/**
 * EINEN KANDIDATEN ANLEGEN (Plan §2.3 Schritt 1, §2.9 Nr. 8).
 *
 * ── ZWEI QUELLEN IN M2, NICHT VIER ────────────────────────────────────────
 * `website` (der Normalfall: der Kunde trägt die Adresse ein — sie wird NIE
 * geraten, Davids Entscheidung 4) und `foundation` (die eigene Marke aus dem
 * Konto, §7.2 Nr. 2 — der Relaunch-Fall, kein Abruf). `library` und `shared`
 * werden vom Zod-Schema ABGELEHNT, obwohl der Ablage-Vertrag sie kennt: die
 * Bibliothek kommt mit M6, die freigegebene Fremdmarke mit M4 samt ihrem
 * Opt-in (`marketVisibility`, Anhang B „Was NICHT in M1 steckt"). Eine Quelle
 * anzunehmen, hinter der nichts liegt, hiesse einen Kandidaten anzulegen, den
 * kein Lauf je bedienen kann.
 *
 * ── DIE ZUGEHÖRIGKEIT KOMMT NIE AUS DEM RUMPF ─────────────────────────────
 * `profileId` steht im PFAD und wird vom Store gestempelt — dieselbe Regel wie
 * an der Datentür der gepoolten Layer (`stripTenantKey`): eine durchgereichte
 * Id schriebe in ein fremdes Branding.
 */

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().max(512).optional().default(''),
  sourceKind: z.enum(['website', 'foundation']).optional().default('website'),
  /** Bei `foundation`: das eigene Branding, dessen bestätigte Felder gelten. */
  sourceRef: z.string().trim().max(128).optional().default(''),
})

export default defineEventHandler(async (event): Promise<MarketCompetitorResponse> => {
  const { userId, profileId } = await requireMarketProfile(event)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ status: 400, statusText: 'Invalid competitor' })
  const body = parsed.data

  const existing = await listMarketCompetitors(event, profileId)
  if (existing.length >= MARKET_COMPETITORS_MAX) {
    throw createError({
      status: 409,
      statusText: 'Too many competitors',
      data: { code: MARKET_COMPETITOR_LIMIT_CODE },
    })
  }

  let url = ''
  let sourceRef = ''

  if (body.sourceKind === 'website') {
    const normalized = normalizeMarketUrl(body.url)
    if (!normalized) {
      throw createError({
        status: 400,
        statusText: 'Invalid competitor URL',
        data: { code: MARKET_INVALID_URL_CODE },
      })
    }
    // DUBLETTEN JE HOST, nicht je Adresse: `example.com` und
    // `www.example.com/de` sind derselbe Wettbewerber, und zweimal dieselbe
    // Marke im Vergleich verzerrt jede Häufigkeit.
    const duplicate = existing.some((row) => {
      const other = normalizeMarketUrl(row.url ?? '')
      return other?.hostKey === normalized.hostKey
    })
    if (duplicate) {
      throw createError({
        status: 409,
        statusText: 'Competitor already exists',
        data: { code: MARKET_COMPETITOR_DUPLICATE_CODE },
      })
    }
    url = normalized.url
  }
  else {
    // DIE EIGENE MARKE — und zwar EINE, DIE DEM AUFRUFER GEHÖRT. Ohne diese
    // Prüfung wäre `sourceRef` ein Leseweg in ein fremdes Branding: der Lauf
    // liest daraus die bestätigten Felder. `requireOwnedMarketProfile` wirft
    // 404 (nicht 403) — ein 403 bestätigte die Existenz.
    const reference = body.sourceRef.trim()
    if (!reference) throw createError({ status: 400, statusText: 'Missing source reference' })
    await requireOwnedMarketProfile(event, userId, reference)
    if (existing.some(row => row.sourceKind === 'foundation' && row.sourceRef === reference)) {
      throw createError({
        status: 409,
        statusText: 'Competitor already exists',
        data: { code: MARKET_COMPETITOR_DUPLICATE_CODE },
      })
    }
    sourceRef = reference
  }

  const row = await createMarketCompetitor(event, profileId, {
    name: body.name,
    url,
    sourceKind: body.sourceKind,
    sourceRef,
    brandCheckId: '',
    pagesFetched: '',
    excludedReason: '',
    status: 'pending',
  })

  logEvent('info', 'market.competitor_added', {
    // KEIN Name, KEINE Adresse — das ist Kundeninhalt (Log-Regel).
    sourceKind: body.sourceKind,
    total: existing.length + 1,
  })

  return { competitor: toMarketCompetitor(row) }
})
