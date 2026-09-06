import type { H3Event } from 'h3'
import type { BrandProfileRow } from '../contracts/brandContract'
import { loadStepRow, requireBrandAccess, requireProfileIdParam } from '../contracts/brandContract'
import { MARKET_LOCKED_CODE } from '../../shared/marketLimits'
import { requireOwnedMarketProfile } from './marketStore'

/**
 * DIE TÜR JEDER `/api/market`-ROUTE — drei Fragen in dieser Reihenfolge, und
 * die Reihenfolge ist selbst eine Regel.
 *
 *  1. DARF DIESES KONTO ÜBERHAUPT? (`requireBrandAccess`, Beta-Gate des
 *     Wizards, 404 statt 403.) Zuerst, weil die Antwort keinen Datenzugriff
 *     braucht: ohne Session ist sie fest.
 *  2. GEHÖRT IHM DIESES BRANDING? (`loadOwnedProfile` über den Store, 404.)
 *     Alle market_*-Tabellen sind server-only; das hier IST die
 *     Zugriffsgrenze, es gibt keine Row-Permission dahinter.
 *  3. IST DAS PRODUKT FÜR DIESES BRANDING FREIGESCHALTET? (Kapitel B
 *     abgenommen, §2.4.) Zuletzt, weil es eine FACHLICHE Antwort ist: sie
 *     antwortet 409 mit Grund, nicht 404 — der Mensch soll erfahren, was ihm
 *     fehlt, und dieses Branding gehört ihm ja.
 *
 * ── WARUM DIE FREISCHALTUNG NICHT ÜBERALL GILT ────────────────────────────
 * Die LESE-Route und das Führen der Kandidatenliste laufen ohne sie: einen
 * Wettbewerber einzutragen, während man an Kapitel B arbeitet, ist eine
 * sinnvolle Reihenfolge. Gesperrt ist der LAUF — er kostet Geld und liefert
 * einen Vergleich, für den es ohne Kapitel B keine eigene Seite gäbe („vorher
 * gibt es keine eigene Behauptung, die man vergleichen könnte", §2.4).
 */

/** Das Kapitel, dessen Abnahme den Marktvergleich freischaltet (§2.4). */
export const MARKET_UNLOCK_STEP = 'pvm'

export interface MarketRouteContext {
  userId: string
  profileId: string
  profile: BrandProfileRow
}

/**
 * Die Kandidaten-Id aus dem Pfad — vorhanden und plausibel, sonst 404.
 * Dieselbe Form wie `requireProfileIdParam` im brand-Layer, und aus demselben
 * Grund an EINER Stelle: zwei Routen, die den Deckel verschieden setzen, sind
 * zwei Routen mit verschiedenem Verhalten auf denselben Unsinn.
 */
export function requireCompetitorIdParam(event: H3Event): string {
  const id = getRouterParam(event, 'cid')
  if (!id || id.length > 64) throw createError({ status: 404, statusText: 'Not Found' })
  return id
}

/** Schritt 1 und 2 — für jede Route. */
export async function requireMarketProfile(event: H3Event): Promise<MarketRouteContext> {
  const { userId } = await requireBrandAccess(event)
  const profileId = requireProfileIdParam(event)
  const profile = await requireOwnedMarketProfile(event, userId, profileId)
  return { userId, profileId, profile }
}

/**
 * IST KAPITEL B ABGENOMMEN?
 *
 * Ein Kapitel gilt als abgenommen, wenn seine `brand_steps`-Zeile auf `done`
 * steht — das setzt ausschliesslich `…/steps/pvm/complete`, und zwar erst,
 * wenn jede zählende Session abgenommen ist (`brandStepAcceptance`). Gelesen
 * wird über den Vertrag, nicht über die Tabelle: sonst gäbe es eine zweite
 * Wahrheit darüber, was „abgenommen" heisst.
 *
 * FAIL-CLOSED: keine Zeile ⇒ nicht abgenommen. Das ist der Zustand vor dem
 * ersten Öffnen des Kapitels und darf den Lauf nicht freigeben.
 */
export async function marketUnlocked(event: H3Event, profileId: string): Promise<boolean> {
  const row = await loadStepRow(event, profileId, MARKET_UNLOCK_STEP)
  return row?.state === 'done'
}

/** Schritt 3 — nur für die Routen, die etwas kosten. */
export async function requireMarketUnlocked(event: H3Event, profileId: string): Promise<void> {
  if (await marketUnlocked(event, profileId)) return
  throw createError({
    status: 409,
    statusText: 'Market comparison is not unlocked yet',
    // Der Grund reist als `data.code` und wird vom zentralen Handler als
    // `reason` ins Envelope gehoben — der Client liest `error.data.reason`.
    data: { code: MARKET_LOCKED_CODE },
  })
}
