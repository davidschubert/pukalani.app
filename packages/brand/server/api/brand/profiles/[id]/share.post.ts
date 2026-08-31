import { randomBytes } from 'node:crypto'
import { ID } from 'node-appwrite'
import { createBrandSharePublishSchema } from '../../../../../schemas/brandAccess'
import { resolveBrandJourney } from '../../../../../shared/brandJourney'
import type { BrandShareSnapshot, BrandSharePublishResponse } from '../../../../../shared/types/brand'
import {
  BRAND_SHARES_TABLE,
  brandDb,
  confirmedSlotValues,
  listActiveShares,
  loadOwnedProfile,
  loadStepRows,
  profileFacts,
  requireProfileIdParam,
  toStepFacts,
  toStoryView,
} from '../../../../utils/brandStore'
import { hashBrandShareToken } from '../../../../utils/brandShares'
import { recordBrandEvent } from '../../../../utils/brandEvents'

/**
 * VERÖFFENTLICHEN — einen Lese-Link auf ein EINGEFRORENES Abbild erzeugen.
 *
 * ── DER SNAPSHOT WIRD KOPIERT, NICHT VERLINKT ─────────────────────────────
 * Die Zeile trägt den Inhalt selbst (Schema-Anhang §4). Ein Link auf die
 * lebenden Daten wäre billiger und falsch: „Momentaufnahme" heisst, dass
 * spätere Änderungen erst nach erneutem Veröffentlichen sichtbar werden — wer
 * seinen Entwurf an einen Kunden schickt, soll nicht mittendrin einen anderen
 * Text zeigen. Aus demselben Grund reisen `presetId`/`presetVersion` mit: eine
 * spätere Theme-Anpassung darf das Eingefrorene nicht umfärben.
 *
 * ── WAS HINEIN DARF (Audit 3) ─────────────────────────────────────────────
 * Brand Story + die BESTÄTIGTEN Kapitel. NIE Chats, nie Entwürfe, nie
 * Metriken. `confirmedSlotValues` liest deshalb ausschliesslich das Feld
 * `confirmed` — `latestDraft` steht direkt daneben und wäre der eine Griff, mit
 * dem ein halbfertiger Gedanke öffentlich würde.
 *
 * ÜBERSPRUNGENE BAUSTEINE FEHLEN, ihre Daten bleiben aber liegen: die Kapitel
 * kommen aus der JOURNEY, nicht aus der Zeilenmenge.
 *
 * ── DER TOKEN EXISTIERT GENAU EINMAL ──────────────────────────────────────
 * 32 Zufallsbytes (256 Bit, Vorgabe ≥128), gespeichert wird nur sein
 * sha256-Hash. Er steht in dieser Antwort — danach nirgends mehr, auch nicht im
 * Log. Wer ihn verliert, veröffentlicht neu; das ist die ROTATION: neue Zeile,
 * alte widerrufen (nie dieselbe Zeile umschreiben, sonst hätte ein bereits
 * verschickter Link plötzlich einen anderen Inhalt).
 *
 * ── AUCH VOR DEM ABSCHLUSS ERLAUBT ────────────────────────────────────────
 * Es gibt bewusst keine Vollständigkeits-Bedingung (Plan §6). Ein Zwischenstand
 * zu teilen ist ein legitimer Arbeitsschritt — sichtbar wird ohnehin nur, was
 * bestätigt wurde.
 */

/** Standard-Ablauf 30 Tage (Plan §6). */
const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Fassung der Snapshot-FORM — steigt, wenn sich der Aufbau ändert. Ein alter
 * Link muss danach weiter lesbar bleiben; deshalb steht die Zahl IM Snapshot
 * und nicht in einer Spalte, die man beim Lesen erst nachschlagen müsste.
 */
const SHARE_SCHEMA_VERSION = 1

/** Zod-Zusage aus Schema-Anhang §4. */
const SNAPSHOT_MAX = 400_000

export default defineEventHandler(async (event): Promise<BrandSharePublishResponse> => {
  const { userId } = await requireBrandAccess(event)
  const profileId = requireProfileIdParam(event)
  const profile = await loadOwnedProfile(event, userId, profileId)
  await readValidatedBody(event, createBrandSharePublishSchema().parse)

  const stepRows = await loadStepRows(event, profileId)
  const journey = resolveBrandJourney(profileFacts(profile), toStepFacts(stepRows))
  const byStepKey = new Map(stepRows.map(row => [row.stepKey, row]))

  const snapshot: BrandShareSnapshot = {
    schemaVersion: SHARE_SCHEMA_VERSION,
    title: profile.title ?? '',
    contentLocale: profile.contentLocale,
    story: toStoryView(profile).body,
    chapters: journey
      .filter(step => step.state !== 'skipped')
      .map((step) => {
        const row = byStepKey.get(step.stepKey)
        return { stepKey: step.stepKey, slots: row ? confirmedSlotValues(row) : [] }
      })
      // Ein Kapitel ohne bestätigten Inhalt hat nichts zu zeigen — es fehlt,
      // statt als leere Überschrift dazustehen.
      .filter(chapter => chapter.slots.length > 0),
    presetId: profile.designPresetId ?? '',
    presetVersion: profile.designPresetVersion ?? '',
  }

  const payload = JSON.stringify(snapshot)
  if (payload.length > SNAPSHOT_MAX) {
    throw createError({
      status: 413,
      statusText: 'Snapshot too large',
      data: { code: 'snapshot_too_large' },
    })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SHARE_TTL_MS).toISOString()
  const token = randomBytes(32).toString('hex')

  const { tablesDB, databaseId } = brandDb(event)

  // ROTATION: erst die alten widerrufen, dann die neue anlegen. Andersherum
  // gäbe es einen Moment mit ZWEI gültigen Links, und der ältere wäre der, den
  // jemand gerade offen hat.
  const previous = await listActiveShares(event, profileId)
  for (const row of previous) {
    await tablesDB.updateRow({
      databaseId, tableId: BRAND_SHARES_TABLE, rowId: row.$id, data: { revokedAt: now.toISOString() },
    }).catch((error: unknown) => {
      logEvent('warn', 'brand.share_rotate_failed', {
        shareId: row.$id,
        message: error instanceof Error ? error.message : String(error),
      })
    })
  }

  let shareId: string
  try {
    const created = await tablesDB.createRow({
      databaseId,
      tableId: BRAND_SHARES_TABLE,
      rowId: ID.unique(),
      data: {
        profileId,
        tokenHash: hashBrandShareToken(token),
        snapshot: payload,
        publishedAt: now.toISOString(),
        expiresAt,
      },
    })
    shareId = created.$id
  }
  catch (error) {
    throw toH3Error(error, 'Brand share could not be published')
  }

  await recordBrandEvent(event, {
    type: 'share.published',
    profileId,
    userId,
    // Umfang, nicht Inhalt.
    payload: { chapters: snapshot.chapters.length, bytes: payload.length },
  })

  return { shareId, token, publishedAt: now.toISOString(), expiresAt }
})
