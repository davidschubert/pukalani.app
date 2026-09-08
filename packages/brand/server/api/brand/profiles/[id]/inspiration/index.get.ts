import { BRAND_INSPIRATION_MAX } from '../../../../../../shared/brandInspiration'
import type { BrandInspirationListResponse } from '../../../../../../shared/types/brand'
import {
  listBrandInspiration,
  requireBrandInspirationContext,
} from '../../../../../utils/brandInspirationStore'

/**
 * DIE VORBILDER DIESER MARKE — Bereich, Notiz und Nummer, KEIN Bild
 * (Konzept docs/plans/BRAND-DESIGN.md §2.2, Paket D2a).
 *
 * Das Bild holt die Werkstatt je Karte über `…/inspiration/:id/image`; eine
 * Liste, die Bild-Bytes trägt, wäre bei zwölf Screenshots ein Vielfaches der
 * Seite — und eine Liste mit Bucket-ADRESSEN wäre das Leck, gegen das die
 * eigene Ausliefer-Route geschrieben ist (§2.13).
 *
 * Die drei Schranken stehen in `requireBrandInspirationContext` (Zugang,
 * Besitz, Kapitel auf dem Weg) und antworten alle mit 404.
 */
export default defineEventHandler(async (event): Promise<BrandInspirationListResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile } = await requireBrandInspirationContext(event, userId)
  return {
    items: await listBrandInspiration(event, profile.$id),
    max: BRAND_INSPIRATION_MAX,
  }
})
