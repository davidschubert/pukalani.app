import { z } from 'zod'
import type { MarketCandidateOptionsResponse } from '../../../../../shared/types/marketApi'
import type { MarketSourceOption } from '../../../../../shared/marketProfile'
import { marketLibraryEntries } from '../../../../../shared/marketLibrary'
import { listBrandProfilesForOwner, listSharedMarketProfiles } from '../../../../contracts/brandContract'
import { MARKET_UNLOCK_STEP, requireMarketProfile } from '../../../../utils/marketAccess'

/**
 * DIE WÄHLBAREN EINTRÄGE EINER QUELLE (Plan §7.2 Nr. 2–4, MV1 M4).
 *
 * Der Quellen-Wähler auf der Seite „Markt" hat vier Quellen. Eine davon
 * braucht keine Liste (`website` — dort tippt der Kunde eine Adresse), die
 * drei anderen schon:
 *
 *  · `foundation` — die eigenen Brandings des Kontos. Der Relaunch-Fall.
 *  · `library`    — die handgeprüfte Bibliothek aus dem Repo (heute nur
 *                   erfundene Testeinträge; die echten kommen mit M6).
 *  · `shared`     — die freigegebenen Marken FREMDER Konten (Opt-in, §7.2
 *                   Nr. 4), Name-Präfix-Suche über `q`.
 *
 * ── DREI DINGE, DIE MAN NICHT „VEREINFACHEN" DARF ────────────────────────
 *
 * 1. **`shared` gibt NIE eine `ownerId` heraus.** Zurück gehen Id, Name und
 *    das Kategorie-Feld — mehr braucht eine Auswahlliste nicht, und mehr
 *    wäre eine Auskunft über einen Menschen, der nur seiner MARKE eine
 *    Freigabe erteilt hat.
 * 2. **Die eigenen Brandings erscheinen NICHT unter `shared`.** Sie haben
 *    ihre eigene Quelle; zweimal derselbe Eintrag in zwei Quellen wäre eine
 *    Frage, die niemand beantworten kann. Der Filter sitzt im brand-Layer, wo
 *    die `ownerId` bleibt.
 * 3. **`shared` verlangt ein ABGENOMMENES Kapitel B** — dieselbe Bedingung
 *    wie die eigene Freischaltung (§2.4). Eine fremde Marke ohne eigene
 *    Behauptung lieferte ein leeres Marktprofil, und das sähe aus wie ein
 *    Fehler unseres Abrufs.
 *
 * ── OHNE FREISCHALTUNGS-SCHRANKE ─────────────────────────────────────────
 * Wie die Kandidatenliste: Kandidaten vorzubereiten, während man an Kapitel B
 * arbeitet, ist eine sinnvolle Reihenfolge (Kopf von `marketAccess.ts`).
 * Gesperrt ist der LAUF.
 */

const querySchema = z.object({
  source: z.enum(['foundation', 'library', 'shared']),
  /** Namens-Präfix; nur bei `library` und `shared` von Bedeutung. */
  q: z.string().trim().max(80).optional().default(''),
})

/**
 * Wie viele Einträge eine Auswahlliste höchstens zeigt. Zehn ist die Zahl aus
 * dem Auftrag und zugleich die, ab der eine Liste zu einer Suche wird — das
 * Suchfeld steht deshalb im Wähler und nicht als „mehr laden".
 */
const OPTIONS_LIMIT = 10

export default defineEventHandler(async (event): Promise<MarketCandidateOptionsResponse> => {
  const { userId, profileId } = await requireMarketProfile(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ status: 400, statusText: 'Invalid source' })
  const { source, q } = parsed.data
  const prefix = q.toLowerCase()

  if (source === 'foundation') {
    // Das AKTUELLE Branding gehört nicht in die Liste: es mit sich selbst zu
    // vergleichen ergäbe zehn Zeilen „gleich".
    const own = (await listBrandProfilesForOwner(event, userId))
      .filter(entry => entry.id !== profileId && entry.title.trim())
      .filter(entry => !prefix || entry.title.toLowerCase().startsWith(prefix))
      .slice(0, OPTIONS_LIMIT)
    return {
      source,
      options: own.map((entry): MarketSourceOption => ({
        id: entry.id,
        label: entry.title,
        ...(entry.industry ? { hint: entry.industry } : {}),
      })),
    }
  }

  if (source === 'library') {
    const entries = marketLibraryEntries()
      .filter(entry => !prefix || entry.name.toLowerCase().startsWith(prefix))
      .slice(0, OPTIONS_LIMIT)
    return {
      source,
      options: entries.map((entry): MarketSourceOption => ({
        id: entry.key,
        label: entry.name,
        url: entry.homepage,
      })),
    }
  }

  const shared = await listSharedMarketProfiles(event, {
    requiredStepKey: MARKET_UNLOCK_STEP,
    prefix: q,
    limit: OPTIONS_LIMIT,
    excludeOwnerId: userId,
  })
  return {
    source,
    options: shared.map((entry): MarketSourceOption => ({
      id: entry.id,
      label: entry.title,
      ...(entry.industry ? { hint: entry.industry } : {}),
    })),
  }
})
