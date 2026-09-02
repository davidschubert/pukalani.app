import type { H3Event } from 'h3'
import {
  BRAND_AI_DAY_WINDOW_MS,
  BRAND_AI_LIMITS,
  type BrandAiQuotaCounts,
  type BrandAiRejectionCode,
  brandAiAccountDayKey,
  brandAiInstanceDayKey,
  brandAiSlotDayKey,
  brandAiTalkDayKey,
  decideBrandAiQuota,
  resolveBrandAiInstanceCap,
} from '../../shared/brandAiLimits'
import { countActiveBrandGenerations } from './brandGenerators'

/**
 * DIE BUCHUNG — vier Zähler, in der Reihenfolge eng vor weit, mit Abbruch beim
 * ersten Nein. Die Zahlen, die Schlüssel und die Entscheidung stehen pur in
 * `shared/brandAiLimits.ts`; hier steht nur, WANN gezählt wird.
 *
 * Der ENGE Zähler ist seit P3.2 einer von zweien (`kind`): der Slot-Eimer für
 * einen Entwurf, der Gesprächs-Eimer für einen Berater-Zug. Nie beide.
 *
 * ── GEBUCHT WIRD BEIM START, NICHT BEIM ERFOLG ────────────────────────────
 * Ein Lauf, der beim Anbieter scheitert oder den der Mensch abbricht, ist
 * bezahlt: die Anfrage ist raus, die Tokens sind verbraucht. Vor allem aber
 * wäre die Gegenregel ein Geschenk an genau den Missbrauch, gegen den der
 * Deckel steht — wer jeden Lauf nach zwei Sekunden abbricht, hätte unbegrenzt
 * viele freie Läufe. Erfolg ist keine Bedingung fürs Bezahlen.
 *
 * ── WAS NICHT ZÄHLT (Plan §6, hier festgehalten für P3+) ──────────────────
 *  · CACHE-TREFFER. Heute ist das der Idempotenz-Fall (derselbe Knopfdruck,
 *    derselbe Schlüssel) — die Route prüft ihn VOR dieser Buchung. Der
 *    Entwurfs-Cache je Baustein-Stand kommt später und gehört an dieselbe
 *    Stelle: „was nichts kostet, kostet kein Kontingent".
 *  · AUTOMATISCHE SCHEMA-REPARATUR (gibt es noch nicht). Sie ist die zweite
 *    Hälfte EINES Laufs, den der Mensch einmal ausgelöst hat — sie ein zweites
 *    Mal zu berechnen hiesse, ihm unsere Reparatur in Rechnung zu stellen.
 *  · DER DEV-STUB. Er ruft keinen Anbieter; die Route bucht deshalb nur, wenn
 *    `resolveBrandSlotGenerator()` `chargesQuota` sagt.
 *
 * ── FAIL-OPEN, WIE ÜBERALL ────────────────────────────────────────────────
 * Der Rate-Limit-Store ist fail-open (toter Redis ⇒ In-Memory-Rückfall). Das
 * bleibt so: eine kaputte Drossel darf den Wizard nicht abschalten. Der harte
 * Riegel gegen Kosten ist `app_config.brandAiEnabled`, nicht dieser Zähler.
 */
export interface BrandAiQuotaRequest {
  userId: string
  profileId: string
  /**
   * WELCHER ENGE EIMER (P3.2): der Entwurf eines Feldes bucht auf seinen
   * Slot-Typ, ein Gesprächszug auf das Gespräch DIESES Brandings. Warum das
   * zwei Eimer sind und kein geteilter, steht im Kopf von `brandAiLimits.ts`.
   */
  kind: 'slot' | 'talk'
  /** Nur bei `kind: 'slot'` — der Slot-TYP, dessen Anläufe gezählt werden. */
  slotId?: string
}

/**
 * `null` = der Lauf darf laufen. Sonst der erste verletzte Deckel als Code, den
 * die Route als `data.code` in eine 429 legt.
 *
 * DER PLATZ IST SCHON BELEGT, WENN DIESE FUNKTION LÄUFT: die Route ruft
 * `retainBrandGeneration()` VOR der Buchung und gibt bei einem Nein wieder
 * frei. Die andere Reihenfolge („erst zählen, dann belegen") sähe richtiger
 * aus und wäre falsch — zwischen Zählung und Beleg liegen hier drei `await`,
 * und in dieser Lücke zählten drei gleichzeitige Anfragen alle dieselbe Null.
 * `countActiveBrandGenerations()` enthält deshalb den eigenen Lauf bereits.
 */
export interface BrandAiQuotaRejection {
  code: BrandAiRejectionCode
  /** Sekunden bis zur nächsten Chance — der Wert des `Retry-After`-Kopfes. */
  retryAfterSec: number
}

export async function bookBrandAiQuota(
  event: H3Event,
  request: BrandAiQuotaRequest,
): Promise<BrandAiQuotaRejection | null> {
  const limits = {
    ...BRAND_AI_LIMITS,
    instanceDay: resolveBrandAiInstanceCap(brandAiInstanceCapFromConfig()),
  }

  // Noch nicht gemessene Zähler bleiben 0 — 0 verletzt nie einen Deckel.
  const counts: BrandAiQuotaCounts = {
    parallel: countActiveBrandGenerations(request.userId),
    slotDay: 0,
    talkDay: 0,
    accountDay: 0,
    instanceDay: 0,
  }
  const busy = decideBrandAiQuota(counts, limits)
  // Der Burst ist in Sekunden vorbei — er wartet auf einen laufenden Entwurf,
  // nicht auf ein Fenster. Eine ehrliche Schätzung ist besser als das
  // Tagesfenster der drei anderen Deckel.
  if (busy) return { code: busy, retryAfterSec: BRAND_AI_BUSY_RETRY_SEC }

  const { store, prefix } = useRateLimitStore(event)

  /**
   * DER ENGE EIMER — genau EINER, nie beide. Ein Gesprächszug, der zusätzlich
   * den Slot-Eimer anfasste, nähme dem Menschen die Entwürfe für das Feld, für
   * das er gerade geantwortet hat (und eine freie Frage hätte gar keinen Slot).
   */
  const narrowKey = request.kind === 'talk'
    ? brandAiTalkDayKey(request.profileId)
    : brandAiSlotDayKey(request.profileId, request.slotId ?? '')
  const narrowState = await store.hit(`${prefix}${narrowKey}`, BRAND_AI_DAY_WINDOW_MS)
  if (request.kind === 'talk') counts.talkDay = narrowState.count
  else counts.slotDay = narrowState.count
  const narrow = decideBrandAiQuota(counts, limits)
  if (narrow) return { code: narrow, retryAfterSec: retryAfter(narrowState.resetInMs) }

  const accountState = await store.hit(
    `${prefix}${brandAiAccountDayKey(request.userId)}`,
    BRAND_AI_DAY_WINDOW_MS,
  )
  counts.accountDay = accountState.count
  const account = decideBrandAiQuota(counts, limits)
  if (account) return { code: account, retryAfterSec: retryAfter(accountState.resetInMs) }

  const instanceState = await store.hit(
    `${prefix}${brandAiInstanceDayKey()}`,
    BRAND_AI_DAY_WINDOW_MS,
  )
  counts.instanceDay = instanceState.count
  const instance = decideBrandAiQuota(counts, limits)
  return instance ? { code: instance, retryAfterSec: retryAfter(instanceState.resetInMs) } : null
}

/** Der laufende Entwurf ist in Sekunden fertig — so lange, nicht länger. */
const BRAND_AI_BUSY_RETRY_SEC = 10

function retryAfter(resetInMs: number): number {
  return Math.max(1, Math.ceil(resetInMs / 1000))
}

/** `pukalani.brand.aiDailyInstanceCap` — ungeprüft; die Prüfung ist pur. */
function brandAiInstanceCapFromConfig(): unknown {
  const config = useAppConfig() as { pukalani?: { brand?: { aiDailyInstanceCap?: unknown } } }
  return config.pukalani?.brand?.aiDailyInstanceCap
}
