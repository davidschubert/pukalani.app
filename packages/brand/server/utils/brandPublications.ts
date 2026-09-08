import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import { brandCheckUrlKey } from '../../shared/brandCheck'
import {
  BRAND_PUBLICATION_ARCHETYPE_SLOT,
  BRAND_PUBLICATION_DAY_WINDOW_MS,
  type BrandPublicationStatus,
  type BrandPublicationSubmitDecision,
  brandPublicationCanSubmit,
  brandPublicationDayKey,
  brandPublicationPath,
  brandPublicationSlugCandidate,
  decideBrandPublicationQuota,
  normalizeBrandPublicationStatus,
} from '../../shared/brandPublication'
import type { BrandPublicationState } from '../../shared/types/brand'
import {
  BRAND_CHECKS_TABLE,
  BRAND_PROFILES_TABLE,
  type BrandCheckRow,
  type BrandProfileRow,
  type BrandStepRow,
  brandCheckRankingFacts,
  brandDb,
  confirmedSlotValues,
  isAppwriteNotFound,
  loadStepRows,
} from './brandStore'

/**
 * DIE VERÖFFENTLICHUNG EINER MARKE — Lesen, Adresse vergeben, Zustand
 * hinausgeben (docs/plans/DISCOVER-BRANDS.md §5, Paket D1).
 *
 * Die REGELN (Zustände, Slug-Form, Voraussetzungen) stehen pur in
 * `shared/brandPublication.ts`; hier steht, was eine Datenbank dazu braucht.
 * Dieselbe Arbeitsteilung wie `brandMarketVisibility.ts` neben
 * `shared/brandCheckRanking.ts`.
 *
 * ── DIE ZEILEN-ID IST DIE PROFIL-ID ───────────────────────────────────────
 * Eine Marke hat genau eine Veröffentlichung (Kopf von Migration brand-020).
 * Das macht aus jedem Lesen ein `getRow` und aus dem erneuten Einreichen eine
 * idempotente Handlung. Es heisst zugleich: es gibt KEINE `profileId`-Spalte,
 * und wer aufräumt, räumt über die Id.
 */

export const BRAND_PUBLICATIONS_TABLE = 'brand_publications'
export const BRAND_PUBLICATION_REPORTS_TABLE = 'brand_publication_reports'

export type BrandPublicationRow = Models.Row & {
  slug: string
  title?: string
  /** Der ÖFFENTLICHE Stand. MEDIUMTEXT ⇒ auf alten Zeilen `undefined`. */
  snapshot?: string | null
  /** Der EINGEREICHTE Stand, solange die Freigabe aussteht. */
  pendingSnapshot?: string | null
  submittedAt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  decidedAt?: string | null
  pathKind?: string
  industry?: string
  archetype?: string
  archetypeSecondary?: string
  paletteId?: string
  locale?: string
  checkId?: string
  status?: string
  decisionNote?: string
  featuredAt?: string | null
  reportCount?: number
  example?: boolean
}

/**
 * Die Zeile zu einem Branding — `null` heisst „nie eingereicht".
 *
 * FEHLT DIE TABELLE (Deploy vor brand-020), ist die Antwort ebenfalls `null`:
 * „es gibt keine Veröffentlichung" ist dann die wahre Auskunft, und die
 * Leseansicht soll deswegen nicht mit 500 antworten. Das gilt fürs LESEN;
 * beim SCHREIBEN ist eine fehlende Tabelle ein echter Fehler (s. Route).
 */
export async function loadBrandPublication(
  event: H3Event,
  profileId: string,
): Promise<BrandPublicationRow | null> {
  const { tablesDB, databaseId } = brandDb(event)
  try {
    return await tablesDB.getRow<BrandPublicationRow>({
      databaseId, tableId: BRAND_PUBLICATIONS_TABLE, rowId: profileId,
    })
  }
  catch (error) {
    if (isAppwriteNotFound(error)) return null
    throw toH3Error(error, 'Brand publication could not be loaded')
  }
}

/**
 * DER ZUSTAND, WIE IHN LESEANSICHT UND KARTE BRAUCHEN.
 *
 * ── WAS HIER NICHT HINAUSGEHT ────────────────────────────────────────────
 * Kein Snapshot (das ist Sache der öffentlichen Anatomie, D2), kein `ipHash`,
 * keine Meldungen, kein `featuredAt` — die Kuration des Betreibers geht den
 * Kunden nichts an, und „ich bin Brand of the Day" wäre eine Auskunft, die
 * Erwartungen weckt. `decisionNote` geht sehr wohl hinaus: sie IST für ihn
 * geschrieben (§3.4 „der Kunde sieht sie").
 */
export function toBrandPublicationState(row: BrandPublicationRow | null): BrandPublicationState {
  if (!row) {
    return {
      status: 'none',
      slug: '',
      path: '',
      submittedAt: '',
      publishedAt: '',
      decidedAt: '',
      decisionNote: '',
      pendingUpdate: false,
    }
  }
  const status = normalizeBrandPublicationStatus(row.status)
  return {
    status,
    slug: row.slug,
    path: brandPublicationPath(row.slug),
    submittedAt: row.submittedAt ?? '',
    publishedAt: row.publishedAt ?? '',
    decidedAt: row.decidedAt ?? '',
    decisionNote: row.decisionNote ?? '',
    /**
     * „Öffentlich, und ein neuer Stand wartet" — die Marke ist erreichbar
     * (`publishedAt` steht, der alte Snapshot ist da) UND es liegt etwas zur
     * Freigabe (`status: 'pending'`). Berechnet statt gespeichert: es ist
     * dieselbe Tatsache aus zwei Feldern, und ein drittes Feld daneben wäre
     * das, das eines Tages nicht mitgeführt wird.
     */
    pendingUpdate: status === 'pending' && Boolean(row.publishedAt) && Boolean(row.snapshot),
  }
}

/**
 * DIE TATSACHEN, AUS DENEN „darf eingereicht werden?" FOLGT (§3.3) — an EINER
 * Stelle gelesen, von allen drei Routen benutzt.
 *
 * ── WARUM DIE ANTWORT AUCH IM GET STEHT ──────────────────────────────────
 * Der Dialog muss VOR dem Klick sagen können, was fehlt. Er könnte die Regel
 * selbst rechnen (sie ist pur und liegt in `shared/`), aber die EINGABEN hätte
 * er nur halb: „ist `d.primary` bestätigt?" beantwortet auf der Seite nur ein
 * Umweg über den gerenderten Kapitel-Block, und ein Umweg ist genau die Sorte
 * Ableitung, die still falsch wird, wenn sich der Renderer ändert. Der Server
 * liest die Zeilen ohnehin — er sagt es also selbst. Der 409 der POST-Route
 * bleibt die Durchsetzung (und muss es bleiben: der Envelope trägt nur den
 * `reason`, nie die Liste).
 */
export interface BrandPublicationFacts {
  stepRows: BrandStepRow[]
  /** Der bestätigte Wert von `d.primary` — '' heisst „nicht gesetzt". */
  archetype: string
  archetypeSecondary: string
  readiness: BrandPublicationSubmitDecision
}

export async function readBrandPublicationFacts(
  event: H3Event,
  profile: BrandProfileRow,
): Promise<BrandPublicationFacts> {
  const stepRows = await loadStepRows(event, profile.$id)
  const archetypeRow = stepRows.find(row => row.stepKey === 'archetype')
  const archetypeSlots = archetypeRow ? confirmedSlotValues(archetypeRow) : []
  const archetype = archetypeSlots.find(slot => slot.slotId === BRAND_PUBLICATION_ARCHETYPE_SLOT)?.value ?? ''
  const archetypeSecondary = archetypeSlots.find(slot => slot.slotId === 'd.secondary')?.value ?? ''

  return {
    stepRows,
    archetype,
    archetypeSecondary,
    readiness: brandPublicationCanSubmit({
      title: profile.title ?? '',
      // `state === 'done'` IST die Abnahme eines Kapitels — dieselbe Tatsache,
      // die der Marktvergleich für seine Quellen liest.
      acceptedStepKeys: stepRows.filter(row => row.state === 'done').map(row => row.stepKey),
      archetypeConfirmed: archetype.trim().length > 0,
    }),
  }
}

/**
 * WIE VIELE ADRESSEN PROBIERT WERDEN, bevor aufgegeben wird.
 *
 * Zehn gleichnamige Marken auf einer Instanz sind schon sehr viel; wer die
 * elfte einreicht, bekommt eine ehrliche Ablehnung statt einer Adresse wie
 * `kaffee-47`. Alle Kandidaten werden in EINER Abfrage geprüft — eine Schleife
 * mit zehn `listRows` wäre zehn Rundreisen für eine Frage.
 */
const SLUG_ATTEMPTS = 10

/**
 * DIE FREIE ADRESSE ZU EINEM VORSCHLAG — `name`, sonst `name-2`, `name-3`, …
 *
 * Die EIGENE Zeile zählt nicht als Kollision: wer seinen Stand aktualisiert,
 * behält seine Adresse (§4.2 „Slug bleibt stabil"). Der UNIQUE-Index bleibt
 * die eigentliche Sicherung — diese Funktion sucht den Kandidaten, das 409
 * beim Schreiben ist die Wahrheit.
 */
export async function findFreeBrandPublicationSlug(
  event: H3Event,
  base: string,
  ownRowId: string,
): Promise<string | null> {
  const candidates = Array.from(
    { length: SLUG_ATTEMPTS },
    (_, index) => brandPublicationSlugCandidate(base, index + 1),
  )

  const { tablesDB, databaseId } = brandDb(event)
  let taken = new Set<string>()
  try {
    const res = await tablesDB.listRows<BrandPublicationRow>({
      databaseId,
      tableId: BRAND_PUBLICATIONS_TABLE,
      queries: [Query.equal('slug', candidates), Query.limit(candidates.length)],
    })
    taken = new Set(res.rows.filter(row => row.$id !== ownRowId).map(row => row.slug))
  }
  catch (error) {
    // Fehlt die Tabelle, ist keine Adresse belegt. Jeder andere Fehler gehört
    // dem Aufrufer: eine Adresse zu vergeben, ohne nachgesehen zu haben, wäre
    // ein 409 im Gesicht des Menschen statt eines sauberen Fehlers.
    if (!isAppwriteNotFound(error)) throw toH3Error(error, 'Brand publication slug could not be resolved')
  }

  return candidates.find(candidate => !taken.has(candidate)) ?? null
}

/**
 * DER JÜNGSTE CHECK EINER MARKE — nur seine ADRESSE (§5: „checkId … nur
 * Adresse").
 *
 * Zwei Zugehörigkeiten wie im Verlauf (`checks.get.ts`): die eigene
 * `profileId` und der `urlKey` der hinterlegten Website (der Check, den
 * derselbe Mensch auf `/brand-check` eingetippt hat, bevor es die Brand gab).
 * Website schlägt Dokument — die Galerie sortiert nach dem Brand Score, und
 * das ist die Zahl über den Auftritt (Entscheidung 3).
 *
 * FAIL-SOFT: kein Check, keine Tabelle, ein Lesefehler ⇒ ''. Ein Steckbrief
 * ohne Score ist vollständig genug; eine Veröffentlichung daran scheitern zu
 * lassen wäre eine Nebenangabe mit Vetorecht.
 */
export async function latestBrandCheckId(
  event: H3Event,
  profileId: string,
  websiteUrl: string,
): Promise<string> {
  const { tablesDB, databaseId } = brandDb(event)
  const websiteKey = brandCheckUrlKey(websiteUrl)

  const rows = new Map<string, BrandCheckRow>()
  for (const queries of [
    [Query.equal('profileId', profileId)],
    ...(websiteKey ? [[Query.equal('urlKey', websiteKey)]] : []),
  ]) {
    try {
      const res = await tablesDB.listRows<BrandCheckRow>({
        databaseId,
        tableId: BRAND_CHECKS_TABLE,
        queries: [...queries, Query.orderDesc('$createdAt'), Query.limit(25)],
      })
      for (const row of res.rows) rows.set(row.$id, row)
    }
    catch (error) {
      if (!isAppwriteNotFound(error)) {
        logEvent('warn', 'brand.publication_check_lookup_failed', {
          profileId,
          message: error instanceof Error ? error.message : 'unknown',
        })
      }
    }
  }

  const visible = [...rows.values()]
    .filter(row => !brandCheckRankingFacts(row).hidden)
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))

  const website = visible.find(row => brandCheckRankingFacts(row).source === 'website')
  return (website ?? visible[0])?.$id ?? ''
}

/**
 * DER TAGES-DECKEL JE KONTO (§6: 10/Tag).
 *
 * Er steht NEBEN dem Minuten-Eimer `brand:publish` aus `05.rate-limit.ts` und
 * meint etwas anderes: die Minute schützt den Server vor dem Sekundentakt, der
 * Tag die Warteschlange des Betreibers. Gebucht wird VOR dem Bauen des
 * Snapshots — ein Deckel, der erst nach der Arbeit greift, ist keiner.
 */
export async function bookBrandPublicationQuota(
  event: H3Event,
  userId: string,
): Promise<{ code: string, retryAfterSec: number } | null> {
  const { store, prefix } = useRateLimitStore(event)
  const state = await store.hit(
    `${prefix}${brandPublicationDayKey(userId)}`,
    BRAND_PUBLICATION_DAY_WINDOW_MS,
  )
  const code = decideBrandPublicationQuota(state.count)
  return code
    ? { code, retryAfterSec: Math.max(1, Math.ceil(state.resetInMs / 1000)) }
    : null
}

/** Der gelesene Zustand einer Zeile — die EINE Stelle für `undefined`. */
export function brandPublicationStatusOf(row: BrandPublicationRow | null): BrandPublicationStatus | null {
  return row ? normalizeBrandPublicationStatus(row.status) : null
}

export const BRAND_PUBLICATION_VISIBILITIES = ['private', 'public'] as const
export type BrandPublicationVisibility = (typeof BRAND_PUBLICATION_VISIBILITIES)[number]

/**
 * Der gelesene Wert am Profil — FAIL-CLOSED, wie bei `marketVisibility`.
 *
 * Eine Zeile von vor brand-020 liest `undefined`, ein unbekannter Wert ist ein
 * Datenfehler: beides heisst `private`. Eine Zustimmung, die niemand gegeben
 * hat, darf nicht durch einen fehlenden Wert entstehen.
 */
export function brandPublicationVisibilityOf(
  row: Pick<BrandProfileRow, 'publicationVisibility'>,
): BrandPublicationVisibility {
  return row.publicationVisibility === 'public' ? 'public' : 'private'
}

/**
 * DAS OPT-IN SETZEN. Der Aufrufer hat den Besitz VORHER belegt
 * (`loadOwnedProfile`) — diese Funktion prüft ihn nicht noch einmal.
 *
 * NICHT über `touchProfile`: das stempelt `lastActivityAt` mit, und danach
 * stünde die Marke in „zuletzt bearbeitet" ganz oben, obwohl an ihr nichts
 * bearbeitet wurde. NICHT fail-soft: wer ein Häkchen setzt, muss erfahren, ob
 * es gilt.
 */
export async function setBrandProfilePublicationVisibility(
  event: H3Event,
  profileId: string,
  visibility: BrandPublicationVisibility,
): Promise<void> {
  const { tablesDB, databaseId } = brandDb(event)
  await tablesDB.updateRow({
    databaseId,
    tableId: BRAND_PROFILES_TABLE,
    rowId: profileId,
    data: { publicationVisibility: visibility },
  })
}
