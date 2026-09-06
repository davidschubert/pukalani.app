import type { H3Event } from 'h3'
import { confirmedSlotValues, loadStepRows } from '../contracts/brandContract'
import type {
  MarketAiStatement,
  MarketAiView,
  MarketCandidateSource,
  MarketCompetitor,
  MarketCompetitorStatus,
  MarketExclusionReason,
  MarketProfile,
  MarketProfileField,
} from '../../shared/marketProfile'
import { MARKET_CANDIDATE_SOURCES, MARKET_FIELDS } from '../../shared/marketProfile'
import type { MarketCompetitorRow, MarketProfileRow } from '../../shared/types/market'
import {
  marketAiViewSchema,
  marketFieldsSchema,
  parseMarketJson,
} from '../../shared/types/market'

/**
 * DIE ÜBERSETZUNG ZWISCHEN ZEILE UND VERTRAG — Appwrite-Zeilen hinein, die
 * Formen aus `shared/marketProfile.ts` heraus.
 *
 * ── WARUM DAS EINE EIGENE DATEI IST ───────────────────────────────────────
 * Vier Routen brauchen dieselbe Umformung. Läge sie in einer davon, schriebe
 * die zweite ihre eigene — und dann heisst `status` an einer Stelle etwas
 * anderes als an der anderen. Dasselbe Muster wie `toSlotView`/`toStepSummary`
 * im brand-Layer.
 *
 * ── DIE ZEILE IST DER VERDÄCHTIGE, NICHT DER VERTRAG ──────────────────────
 * Was in den JSON-Spalten steht, hat ein MODELL geschrieben (Extraktion,
 * Aussensicht). Deshalb wird beim LESEN geprüft (`parseMarketJson` +
 * Schema), und eine unlesbare Spalte wird zu einer leeren Liste statt zu einem
 * Fehler: ein Kandidat mit kaputtem Profil soll in der Liste stehen, damit man
 * ihn neu laufen lassen kann.
 */

const STATUSES: readonly MarketCompetitorStatus[] = ['pending', 'reading', 'fetched', 'excluded', 'failed']
const REASONS: readonly MarketExclusionReason[] = ['robots', 'tdm', 'noText', 'unreachable']

function asStatus(value: string | undefined): MarketCompetitorStatus {
  return STATUSES.find(status => status === value) ?? 'pending'
}

function asReason(value: string | undefined): MarketExclusionReason | undefined {
  return REASONS.find(reason => reason === value)
}

function asSource(value: string | undefined): MarketCandidateSource {
  return MARKET_CANDIDATE_SOURCES.find(source => source === value) ?? 'website'
}

/** Die JSON-Liste `pagesFetched` — kaputt heisst „keine", nie „Fehler". */
function parsePagesFetched(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => {
        if (typeof entry === 'string') return entry
        if (entry && typeof entry === 'object' && typeof (entry as { url?: unknown }).url === 'string') {
          return (entry as { url: string }).url
        }
        return ''
      })
      .filter(Boolean)
  }
  catch {
    return []
  }
}

export function toMarketCompetitor(row: MarketCompetitorRow): MarketCompetitor {
  const pagesRead = parsePagesFetched(row.pagesFetched)
  const reason = asReason(row.excludedReason)
  return {
    id: row.$id,
    name: row.name,
    url: row.url ?? '',
    status: asStatus(row.status),
    ...(reason ? { excludedReason: reason } : {}),
    ...(pagesRead.length ? { pagesRead } : {}),
    ...(row.fetchedAt ? { fetchedAt: row.fetchedAt } : {}),
    source: asSource(row.sourceKind),
    ...(row.sourceRef ? { sourceRefId: row.sourceRef } : {}),
    // `brandCheck` bleibt leer: der Score kommt mit M3 (§7.3) — eine Hülle
    // mit Nullen sähe aus wie ein gemessener Wert.
  }
}

export function toMarketProfile(row: MarketProfileRow): MarketProfile {
  return {
    competitorId: row.competitorId,
    fields: parseMarketJson<MarketProfileField[]>(row.fields, marketFieldsSchema) ?? [],
  }
}

export function toMarketAiView(row: MarketProfileRow): MarketAiView | null {
  const statements = parseMarketJson<MarketAiStatement[]>(row.aiOutsideView, marketAiViewSchema)
  if (!statements?.length) return null
  return { competitorId: row.competitorId, statements }
}

/**
 * DAS JÜNGSTE PROFIL JE KANDIDAT. `listMarketProfiles` liefert absteigend
 * sortiert (jüngste zuerst), der erste Treffer je `competitorId` gewinnt —
 * die älteren sind der Verlauf (Anhang B: „ein neuer Abrufstand legt ein neues
 * Profil an").
 */
export function latestProfilesByCompetitor(rows: readonly MarketProfileRow[]): Map<string, MarketProfileRow> {
  const latest = new Map<string, MarketProfileRow>()
  for (const row of rows) {
    if (!latest.has(row.competitorId)) latest.set(row.competitorId, row)
  }
  return latest
}

// ── Die EIGENE Marke als Marktprofil (§7.2 Nr. 2, Quelle `foundation`) ─────

/**
 * DIE BESTÄTIGTEN FELDER EINES BRANDINGS ALS MARKTPROFIL.
 *
 * ── OHNE BELEG, UND ZWAR ABSICHTLICH ──────────────────────────────────────
 * Eine Foundation ist BESCHLOSSEN, nicht zitiert (s. `MarketCandidateSource`
 * im Produktvertrag) — ein Beleg wäre eine Quellenangabe auf sich selbst. Das
 * Ablage-Schema lässt für `source: 'foundation'` deshalb ausdrücklich ein Feld
 * ohne `evidence` zu.
 *
 * ── OHNE HÄUFIGKEIT ───────────────────────────────────────────────────────
 * „Auf wie vielen Seiten steht das?" hat hier keine Antwort: eine Foundation
 * bestätigt, sie wiederholt nicht. Eine erfundene `1 von 1` sähe aus wie eine
 * Messung.
 *
 * ── MEHRERE SLOTS JE FELD ─────────────────────────────────────────────────
 * `categoryLanguage` liest `a.category` UND `b.positioningCategory`. Genommen
 * wird der ERSTE bestätigte in der Reihenfolge der Abbildung — sie ist im
 * Produktvertrag festgelegt, und „der spätere überschreibt" wäre eine zweite,
 * ungeschriebene Regel.
 */
export async function foundationMarketFields(
  event: H3Event,
  profileId: string,
): Promise<MarketProfileField[]> {
  const rows = await loadStepRows(event, profileId)
  const values = new Map<string, string>()
  for (const row of rows) {
    for (const entry of confirmedSlotValues(row)) {
      if (!values.has(entry.slotId)) values.set(entry.slotId, entry.value)
    }
  }

  return MARKET_FIELDS.map((field) => {
    const raw = field.slotIds.map(slotId => values.get(slotId) ?? '').find(value => value.trim()) ?? ''
    const value = raw.trim()
    if (!value) return { fieldId: field.id, value: '', source: 'foundation' as const }
    if (field.form !== 'list') {
      return { fieldId: field.id, value: value.slice(0, 2000), source: 'foundation' as const }
    }
    // Listen-Felder liegen im Wizard als eine Zeile („Handwerk, Nähe, Ruhe").
    const items = value.split(/[,\n]/).map(part => part.trim()).filter(Boolean).slice(0, field.maxItems ?? 5)
    return {
      fieldId: field.id,
      value: items.join(', '),
      items,
      source: 'foundation' as const,
    }
  })
}
