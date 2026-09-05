import type {
  BrandCheckCategoryResult,
  BrandCheckCriterionResult,
  BrandCheckFinding,
  BrandCheckResult,
} from '../../../../shared/types/brand'
import {
  BRAND_CHECKS_TABLE,
  type BrandCheckRow,
  brandDb,
  isAppwriteNotFound,
} from '../../../utils/brandStore'

/**
 * EIN GESPEICHERTES CHECK-ERGEBNIS — öffentlich lesbar, unter genau der
 * Adresse, die der Anstoss zurückgegeben hat (`/brand-check/<id>`, Plan §4).
 *
 * ── WARUM SIE OHNE JEDEN BEWEIS ANTWORTET ─────────────────────────────────
 * Weil das Ergebnis TEILBAR sein soll (Davids Entscheidung 2026-09-05). Es
 * enthält nichts, was nicht ohnehin öffentlich wäre: die geprüfte Adresse und
 * Urteile über eine öffentlich erreichbare Startseite. Was NICHT drinsteht,
 * ist der Grund, warum das trägt — kein Seitentext, kein `ipHash`, kein
 * `textHash`, kein Modellname. Die Zeile trägt mehr, als diese Antwort zeigt,
 * und das ist Absicht: `ipHash` ist ein (pseudonymer) Personenbezug und geht
 * niemanden ausser dem Deckel etwas an.
 *
 * Die Seite dazu trägt `noindex` (Client) — geteilt heisst nicht indexiert.
 *
 * ── DIE ID IST DAS GANZE GEHEIMNIS, ALSO WIRD SIE GEMESSEN ────────────────
 * Sie kommt aus der Adresszeile. Eine ungeprüfte Zeichenkette in einem
 * `getRow` ist eine Zeichenkette, die jemand ausprobiert — deshalb erst die
 * Form (Appwrite-Zeilen-Ids: bis 36 Zeichen aus Buchstaben, Ziffern, `_`,
 * `-`), dann die Abfrage.
 *
 * ── EINE KAPUTTE ZEILE IST EIN 404, KEIN 500 ──────────────────────────────
 * `JSON.parse` über eine Spalte, die jemand von Hand editiert hat, wirft. Für
 * den Leser ist das dasselbe wie „gibt es nicht": er kann nichts daran ändern,
 * und ein 500 wäre eine Einladung, es noch dreimal zu versuchen.
 */
const ROW_ID = /^[A-Za-z0-9_-]{1,36}$/

export default defineEventHandler(async (event): Promise<BrandCheckResult> => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!ROW_ID.test(id)) {
    throw createError({ status: 404, statusText: 'Check not found', data: { code: 'check_not_found' } })
  }

  const { tablesDB, databaseId } = brandDb(event)

  let row: BrandCheckRow
  try {
    row = await tablesDB.getRow<BrandCheckRow>({
      databaseId,
      tableId: BRAND_CHECKS_TABLE,
      rowId: id,
    })
  }
  catch (error) {
    if (isAppwriteNotFound(error)) {
      throw createError({ status: 404, statusText: 'Check not found', data: { code: 'check_not_found' } })
    }
    logEvent('warn', 'brand.check_unavailable', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    throw createError({ status: 503, statusText: 'Check unavailable', data: { code: 'check_unavailable' } })
  }

  // AUSGEBLENDET ⇒ dasselbe 404 wie „gibt es nicht" (§3 „Recht", §7).
  //
  // Kein 410 und kein eigener Code: der Betreiber hat einem Entfernungswunsch
  // stattgegeben, und ein Statuscode, der „hier stand mal etwas" sagt, nähme
  // genau die Wirkung wieder weg. Die ZEILE bleibt trotzdem stehen — sie ist
  // der Beleg dafür, was wann behauptet wurde, und ein Löschen brächte den
  // Check beim nächsten Aufruf derselben Adresse frisch zurück.
  if (row.hidden === true) {
    throw createError({ status: 404, statusText: 'Check not found', data: { code: 'check_not_found' } })
  }

  const categories = parseJson<BrandCheckCategoryResult[]>(row.categories)
  const criteria = parseJson<BrandCheckCriterionResult[]>(row.criteria)
  const findings = parseJson<BrandCheckFinding[]>(row.findings)
  if (!categories || !criteria || !findings) {
    logEvent('warn', 'brand.check_corrupt', { id: row.$id })
    throw createError({ status: 404, statusText: 'Check not found', data: { code: 'check_not_found' } })
  }

  return {
    id: row.$id,
    url: row.url,
    host: row.host,
    locale: row.locale === 'de' ? 'de' : 'en',
    createdAt: row.$createdAt,
    score: row.score,
    band: row.band,
    scoreVersion: row.scoreVersion,
    categories,
    criteria,
    findings,
  }
})

/** `null` statt eines Wurfs — der Aufrufer entscheidet, was ein Loch bedeutet. */
function parseJson<T>(value: string): T | null {
  try {
    const parsed = JSON.parse(value || 'null') as unknown
    return Array.isArray(parsed) ? parsed as T : null
  }
  catch {
    return null
  }
}
