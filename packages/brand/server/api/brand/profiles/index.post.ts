import { ID } from 'node-appwrite'
import { createBrandProfileCreateSchema } from '../../../../schemas/brandProfile'
import { resolveBrandJourney } from '../../../../shared/brandJourney'
import { BRAND_STEP_KEYS } from '../../../../shared/slotRegistry'
import type { BrandProfileDetailResponse } from '../../../../shared/types/brand'
import {
  BRAND_EMPTY_GENERATIONS,
  BRAND_PROFILES_TABLE,
  BRAND_STEPS_TABLE,
  type BrandProfileRow,
  brandDb,
  brandStepRowId,
  resolveProfileProgress,
  toProfileSummary,
} from '../../../utils/brandStore'
import { recordBrandEvent } from '../../../utils/brandEvents'

/**
 * EIN NEUES BRANDING ANLEGEN — Profil-Kopf UND alle NEUN Baustein-Zeilen in
 * einem Zug.
 *
 * ── WARUM ALLE NEUN SOFORT ────────────────────────────────────────────────
 * Man könnte die Zeilen erst beim Betreten anlegen. Dann wäre aber jede
 * Lese-Route gezwungen, zwischen „gibt es nicht" und „noch nie betreten" zu
 * unterscheiden — und die Fortschritts-Rechnung müsste raten, wie viele
 * Bausteine es gibt. Neun Zeilen kosten neun kleine Schreibvorgänge EINMAL und
 * ersparen jeder späteren Route eine Fallunterscheidung.
 *
 * ÜBERSPRUNGENE BAUSTEINE BEKOMMEN TROTZDEM IHRE ZEILE. `skipped` ist kein
 * gespeicherter Zustand, sondern ein ERGEBNIS der Weiche (Kopf von
 * `brandJourney.ts`) — die Spalte `state` kennt nur locked/open/active/done.
 * Gespeichert wird deshalb `locked`; ob der Baustein auf dem Weg liegt,
 * entscheidet bei jedem Lesen die Weiche neu. Genau das trägt den §3e-Vertrag
 * „entfallene Daten werden INAKTIV, nie gelöscht": wer Naming später
 * aktiviert, findet seine Zeile mit ihren Slots vor.
 *
 * ── DIE INHALTSSPRACHE WIRD HIER FIXIERT ──────────────────────────────────
 * Erlaubte Werte kommen aus `pukalani.brand.contentLocales` (App-Config-Form
 * §3e), nicht aus einer Liste im Layer — sonst wäre die White-Label-Zusage
 * gebrochen. Ändern lässt sie sich später NICHT per PATCH (Plan §6).
 *
 * ── SCHEITERT DAS ANLEGEN DER BAUSTEINE, GEHT DER KOPF MIT ────────────────
 * Appwrite kennt keine Transaktion. Ein Profil ohne Bausteine wäre eine Karte,
 * die sich nicht öffnen lässt — also wird aufgeräumt und mit 500 geantwortet.
 * Der Aufräum-Versuch selbst ist best-effort: bleibt etwas liegen, ist es eine
 * verwaiste Zeile ohne Wirkung, kein halbes Produkt.
 */
export default defineEventHandler(async (event): Promise<BrandProfileDetailResponse> => {
  const { userId } = await requireBrandAccess(event)

  const appConfig = useAppConfig() as { pukalani?: { brand?: { contentLocales?: string[] } } }
  const contentLocales = appConfig.pukalani?.brand?.contentLocales ?? []
  const body = await readValidatedBody(event, createBrandProfileCreateSchema(contentLocales).parse)

  const { tablesDB, databaseId } = brandDb(event)
  const now = new Date().toISOString()
  const profileId = ID.unique()

  const facts = {
    pathKind: body.pathKind,
    relaunchScope: body.pathKind === 'relaunch' ? body.relaunchScope ?? null : null,
    hasName: body.hasName,
    team: body.team,
    subBrands: body.subBrands,
    namingOpted: body.namingOpted,
  }
  const journey = resolveBrandJourney(facts)
  const progress = resolveProfileProgress(journey)

  let profile: BrandProfileRow
  try {
    profile = await tablesDB.createRow<BrandProfileRow>({
      databaseId,
      tableId: BRAND_PROFILES_TABLE,
      rowId: profileId,
      data: {
        createdByUserId: userId,
        // Phase 1 aktiviert nur den user-Zweig; die Übertragung an eine
        // Community ist im Modell vorgesehen, hat aber keine UI (§9b.6/7).
        ownerType: 'user',
        ownerId: userId,
        title: body.title,
        contentLocale: body.contentLocale,
        pathKind: body.pathKind,
        // Nur auf dem Relaunch-Pfad gesetzt — das Schema lehnt ihn sonst ab,
        // hier steht die zweite Sicherung gegen eine widersprüchliche Zeile.
        ...(facts.relaunchScope ? { relaunchScope: facts.relaunchScope } : {}),
        hasName: body.hasName,
        namingOpted: body.namingOpted,
        team: body.team,
        subBrands: body.subBrands,
        progressPct: progress.progressPct,
        currentStepKey: progress.currentStepKey,
        lastActivityAt: now,
      },
    })
  }
  catch (error) {
    throw toH3Error(error, 'Brand profile could not be created')
  }

  try {
    for (const step of journey) {
      await tablesDB.createRow({
        databaseId,
        tableId: BRAND_STEPS_TABLE,
        rowId: brandStepRowId(profileId, step.stepKey),
        data: {
          profileId,
          stepKey: step.stepKey,
          // s. Kopf: `skipped` ist kein Spaltenwert.
          state: step.state === 'skipped' ? 'locked' : step.state,
          slots: '{}',
          generations: BRAND_EMPTY_GENERATIONS,
          inputHash: '',
          revision: 0,
          activeSeconds: 0,
        },
      })
    }
  }
  catch (error) {
    for (const stepKey of BRAND_STEP_KEYS) {
      await tablesDB.deleteRow({
        databaseId, tableId: BRAND_STEPS_TABLE, rowId: brandStepRowId(profileId, stepKey),
      }).catch(() => {})
    }
    await tablesDB.deleteRow({
      databaseId, tableId: BRAND_PROFILES_TABLE, rowId: profileId,
    }).catch(() => {})
    throw toH3Error(error, 'Brand profile could not be created')
  }

  await recordBrandEvent(event, {
    type: 'profile.created',
    profileId,
    userId,
    // Kennzahlen, kein Inhalt: der Titel steht bewusst NICHT hier.
    payload: {
      pathKind: body.pathKind,
      hasName: body.hasName,
      team: body.team,
      subBrands: body.subBrands,
      contentLocale: body.contentLocale,
    },
  })

  return {
    profile: toProfileSummary(profile, false),
    story: { body: '', generatedAt: null, editedByUser: false, inputHash: '' },
    journey: [...journey],
    // Die Kurzform wird hier GEBAUT statt aus einer gerade geschriebenen Zeile
    // zurückgelesen: sie ist Zeichen für Zeichen das, was oben angelegt wurde,
    // und ein zweiter Lesevorgang über neun Zeilen wäre nur teurer.
    steps: journey.map(step => ({
      stepKey: step.stepKey,
      storedState: step.state === 'skipped' ? ('locked' as const) : step.state,
      revision: 0,
      confidence: null,
      startedAt: null,
      completedAt: null,
      activeSeconds: 0,
    })),
  }
})
