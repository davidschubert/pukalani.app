import { z } from 'zod'
import { isSupportedTimezone } from '../../../../../core/shared/timezone'
import { COMMUNITIES_TABLE, type TenantRow } from '../../../../shared/types/tenantRecord'
import { requireCommunityTeamContext } from '../../../utils/communityTeam'

/**
 * Self-Service: die HEIMAT-ZEITZONE einer Community setzen (control-038,
 * Davids Entscheidung 2026-08-17).
 *
 * Wort für Wort dieselbe Bauart wie `member-invites.post.ts` und
 * `registration.post.ts` daneben: dieselbe Naht (Service-Secret + JWT +
 * Site-Rolle über `requireCommunityTeamContext`), dieselbe
 * Ein-Feld-Beschränkung, dieselbe ≤30-s-Wirksamkeit über den Resolver-Cache.
 *
 * WARUM EINE EIGENE ROUTE UND NICHT `branding.post.ts`: eine Zeitzone ist
 * keine Optik. Die Branding-Route ist auf `branding.manage` gegated und prüft
 * gegen den Theme-Katalog; beides passt hier nicht. Der Typ, den sie füllt,
 * heißt seit 2026-08-17 aus genau diesem Grund `CommunitySettings` statt
 * `TenantBranding` — der Name durfte nicht länger die Hälfte verschweigen.
 *
 * CAPABILITY `team.manage`: die Zone bestimmt, wann JEDER Termin der Community
 * stattfindet. Das ist eine Owner-/Admin-Entscheidung, keine redaktionelle —
 * `events.manage` (Redakteur/in) reicht bewusst nicht.
 *
 * FAIL-CLOSED GEPRÜFT, wie bei `prefs.timezone`: was die Laufzeit nicht als
 * Zone kennt, wird abgelehnt. Ein Tippfehler hier ließe `Intl` bei JEDER
 * späteren Anzeige mit einem RangeError werfen — ein Feld, das die halbe
 * Oberfläche lahmlegt. `''` ist erlaubt und heißt „keine eigene Wahl".
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  /** = communities.$id. Wird NICHT geglaubt, sondern gegen die Mitgliedschaft geprüft. */
  communityId: z.string().min(1).max(36),
  timezone: z.string().max(64).refine(
    value => value === '' || isSupportedTimezone(value),
    { message: 'Unknown timezone' },
  ),
}).strict()

export default defineEventHandler(async (event) => {
  requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamContext(event, body, 'team.manage')

  const admin = createAdminClient(event)
  const row = await admin.tablesDB.updateRow<TenantRow>({
    databaseId: context.databaseId,
    tableId: COMMUNITIES_TABLE,
    rowId: body.communityId,
    data: { timezone: body.timezone },
  }).catch((error) => { throw toH3Error(error, 'Could not update community') })

  logEvent('info', 'community.timezone_changed', {
    communityId: row.$id,
    runtimeUserId: context.identity.userId,
    timezone: body.timezone,
  })

  /**
   * Zurück kommt der GESPEICHERTE Wert, nicht der geschickte — dieselbe Regel
   * wie bei den Nachbar-Routen: sie sind heute gleich, und wenn hier je ein
   * Schreibfehler säße, soll die Oberfläche den Zustand der Datenbank zeigen
   * und nicht ihren eigenen Wunsch. `?? ''` fängt Bestands-Rows, die die Spalte
   * noch nicht tragen (Appwrite backfillt Defaults nicht).
   */
  return { communityId: row.$id, timezone: row.timezone ?? '' }
})
