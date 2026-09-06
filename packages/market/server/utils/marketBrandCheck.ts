import type { H3Event } from 'h3'
import { findBrandCheckForUrl } from '../contracts/brandContract'
import type { MarketBrandCheck } from '../../shared/marketProfile'
import type { MarketCompetitorRow } from '../../shared/types/market'

/**
 * DER BRAND-CHECK-SCORE JE KANDIDAT (Plan §7.3, Davids Entscheidung: „der
 * BESTEHENDE Score, kein zweiter").
 *
 * ── DER MARKTVERGLEICH RECHNET NICHTS ─────────────────────────────────────
 * Er LIEST den Score, den der Brand-Check ermittelt hat, und verlinkt dessen
 * Ergebnis. Er beeinflusst ihn auch nicht — insbesondere nicht über die
 * KI-Aussensicht (§7.5 c): die ist ungeprüft und hat in einer belegbasierten
 * Zahl nichts zu suchen. Was der Marktvergleich zeigt, ist eine ZWEITE
 * Ansicht auf dieselbe Marke, keine zweite Messung.
 *
 * ── DER LAUF STÖSST HEUTE KEINEN CHECK AN ─────────────────────────────────
 * §7.3 sieht vor, dass ein fehlender Check angestossen wird. Das ist bewusst
 * NICHT gebaut, und zwar aus einem nachprüfbaren Grund: die Check-Mechanik
 * liegt vollständig im Handler von `packages/brand/server/api/brand/
 * check.post.ts` (Zwischenspeicher, zwei Deckel, Abruf, Messung, Urteil,
 * Ablage) und ist nirgends als Funktion herausgezogen. Von hier zu rufen hiesse
 * kopieren — und dann hätte der Marktvergleich seinen eigenen, langsam
 * abweichenden Brand-Check, also genau die zweite Zahl, die §7.3 streicht.
 * Solange kein Check vorliegt, bleibt `brandCheck` LEER; die Oberfläche zeigt
 * dafür den Zustand „Brand-Check läuft mit" (`market.score.pending`).
 * Der Weg dorthin gehört der Brand-Check-Sitzung: eine herausgezogene
 * `runBrandCheck()`, die unter IHREM Konto-Deckel läuft (10/Tag, `force`).
 * Danach genügt hier ein zweiter Aufruf.
 *
 * ── NUR WEBSITE-KANDIDATEN ────────────────────────────────────────────────
 * Ein Brand-Check misst einen AUFTRITT. Eine Foundation hat keinen (sie ist
 * eine Entscheidung, keine Website), ein Bibliotheks-Eintrag hat einen, aber
 * nicht bei uns geprüft. Beide bleiben deshalb ohne Score — statt mit einem,
 * der etwas anderes misst als er behauptet.
 */

/**
 * Die Adresse, unter der ein Check zu suchen ist: der URSPRUNG der Website,
 * nicht die eingetragene Unterseite.
 *
 * `brandCheckUrlKey` schneidet die Query weg, behält aber den PFAD — der Check
 * einer Startseite und der einer Unterseite sind für ihn zwei Ergebnisse. Der
 * Marktvergleich fragt aber nach der MARKE, und deren Auftritt ist die
 * Startseite; ohne diese Reduktion fände ein Kandidat, der als
 * `marke.de/leistungen` eingetragen ist, den Check seiner eigenen Startseite
 * nie.
 */
function originOf(rawUrl: string): string {
  try {
    return `${new URL(rawUrl).origin}/`
  }
  catch {
    return ''
  }
}

/**
 * DIE SCORES ALLER KANDIDATEN — eine Abfrage je Website-Kandidat, höchstens
 * fünf.
 *
 * FAIL-SOFT im Ganzen (die Lesefunktion ist es schon je Zeile): ein Kandidat
 * ohne Eintrag steht schlicht nicht in der Karte.
 */
export async function loadMarketBrandChecks(
  event: H3Event,
  competitors: readonly MarketCompetitorRow[],
): Promise<Map<string, MarketBrandCheck>> {
  const checks = new Map<string, MarketBrandCheck>()

  for (const competitor of competitors) {
    if ((competitor.sourceKind ?? 'website') !== 'website') continue
    const url = originOf(competitor.url ?? '')
    if (!url) continue
    const found = await findBrandCheckForUrl(event, url)
    if (!found) continue
    checks.set(competitor.$id, { score: found.score, band: found.band, checkId: found.checkId })
  }

  return checks
}

/**
 * DIE ID DES CHECKS AN DER KANDIDATEN-ZEILE FESTHALTEN
 * (`market_competitors.brandCheckId`, Anhang B: „Adresse des Ergebnisses —
 * **nicht** der Score").
 *
 * Die ZAHL wird bewusst nicht mitgeschrieben: sie ändert sich, wenn jemand den
 * Check neu ermittelt, und eine Kopie daneben wäre ab dann eine zweite
 * Wahrheit. Die Id dagegen ist stabil und beantwortet die einzige Frage, die
 * ohne zweiten Lesevorgang nicht zu beantworten wäre: „auf welches Ergebnis
 * zeigt der Link?".
 */
export function marketBrandCheckIdOf(
  checks: ReadonlyMap<string, MarketBrandCheck>,
  competitorId: string,
): string {
  return checks.get(competitorId)?.checkId ?? ''
}
