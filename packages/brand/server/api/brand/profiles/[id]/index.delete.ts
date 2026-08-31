import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import type { BrandProfileDeleteResponse } from '../../../../../shared/types/brand'
import {
  BRAND_EVENTS_TABLE,
  BRAND_MESSAGES_TABLE,
  BRAND_PROFILES_TABLE,
  BRAND_SHARES_TABLE,
  BRAND_STEPS_TABLE,
  brandDb,
  isAppwriteNotFound,
  loadOwnedProfile,
  requireProfileIdParam,
} from '../../../../utils/brandStore'

/**
 * EIN BRANDING LÖSCHEN — die Kaskade aus Schema-Anhang §7, wörtlich in dieser
 * Reihenfolge: steps → messages → shares → events(profileId) → profile.
 *
 * ── KINDER ZUERST, UND ZWAR AUS EINEM BETRIEBLICHEN GRUND ─────────────────
 * Appwrite kennt keine Transaktion und kein ON DELETE CASCADE. Bricht der Lauf
 * in der Mitte ab, entscheidet die Reihenfolge, WAS zurückbleibt: mit dem Kopf
 * zuletzt bleibt ein Profil mit halbem Inhalt stehen — sichtbar, wiederholbar,
 * heilbar. Andersherum bliebe Inhalt ohne Kopf liegen: unsichtbar in jeder
 * Oberfläche, von keiner Route mehr erreichbar und damit für immer da.
 *
 * ── DIE SHARES GEHEN MIT, NICHT NUR IHR `revokedAt` ───────────────────────
 * Ein gelöschtes Branding hat keinen Snapshot mehr, den ein alter Link zeigen
 * könnte. Die Zeile zu widerrufen statt zu löschen würde den Text aufbewahren,
 * den der Mensch gerade weghaben wollte.
 *
 * ── IDEMPOTENT ────────────────────────────────────────────────────────────
 * Jede Löschung verzeiht ein 404. Ein zweiter Aufruf nach einem Teilfehler
 * findet Reste (oder nichts) und endet erfolgreich — dieselbe Zusage, die der
 * GDPR-Contributor daneben gibt, und derselbe Code dahinter.
 *
 * ── DAS PROFIL WIRD VORHER GELADEN ────────────────────────────────────────
 * Nicht aus Höflichkeit: `loadOwnedProfile` ist die Besitz-Prüfung. Ohne sie
 * wäre eine fremde Profil-Id ein Löschknopf.
 */
export default defineEventHandler(async (event): Promise<BrandProfileDeleteResponse> => {
  const { userId } = await requireBrandAccess(event)
  const profileId = requireProfileIdParam(event)
  await loadOwnedProfile(event, userId, profileId)

  const { tablesDB, databaseId } = brandDb(event)

  async function purge(tableId: string): Promise<number> {
    let removed = 0
    let rows: Models.Row[]
    try {
      rows = await listAllRows<Models.Row>(tablesDB, databaseId, tableId, [Query.equal('profileId', profileId)])
    }
    catch (error) {
      // Tabelle fehlt (Deploy vor der Migration) ⇒ es gibt nichts zu löschen.
      if (isAppwriteNotFound(error)) return 0
      throw toH3Error(error, 'Brand profile could not be deleted')
    }
    for (const row of rows) {
      try {
        await tablesDB.deleteRow({ databaseId, tableId, rowId: row.$id })
        removed++
      }
      catch (error) {
        if (!isAppwriteNotFound(error)) throw toH3Error(error, 'Brand profile could not be deleted')
      }
    }
    return removed
  }

  const steps = await purge(BRAND_STEPS_TABLE)
  const messages = await purge(BRAND_MESSAGES_TABLE)
  const shares = await purge(BRAND_SHARES_TABLE)
  const events = await purge(BRAND_EVENTS_TABLE)

  try {
    await tablesDB.deleteRow({ databaseId, tableId: BRAND_PROFILES_TABLE, rowId: profileId })
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) throw toH3Error(error, 'Brand profile could not be deleted')
  }

  // Das Löschen selbst schreibt KEIN brand_event: der Funnel hängt an
  // `profileId`, und dessen Zeilen sind gerade Teil der Kaskade gewesen — ein
  // Ereignis über ein gelöschtes Profil wäre der einzige Rest, der bliebe.
  logEvent('info', 'brand.profile_deleted', { profileId, steps, messages, shares, events })

  return { deleted: true, removed: { steps, messages, shares, events } }
})
