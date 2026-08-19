import { z } from 'zod'
import { COMMUNITIES_TABLE, resolveTenantMemberInvitesEnabled, type TenantRow } from '../../../../shared/types/tenantRecord'
import { requireCommunityTeamContext } from '../../../utils/communityTeam'

/**
 * Self-Service: „Mitglieder dürfen einladen" EINER Community umschalten
 * (F57 Mechanik 2 — Davids Entscheidung 2026-08-14: „je Community vom Owner
 * abschaltbar").
 *
 * Der Schwester-Schalter zu `registration.post.ts` und bewusst daneben
 * gebaut: dieselbe Naht (Service-Secret + JWT + Site-Rolle), dieselbe
 * Ein-Feld-Beschränkung, dieselbe ≤30-s-Wirksamkeit über den
 * Resolver-Cache. Er steht in der Oberfläche auch direkt darunter — beide
 * beantworten „wer kommt hier herein".
 *
 * DIE PRÜFUNG LÄUFT ÜBER `requireCommunityTeamContext` statt über die
 * ausgeschriebene Kette aus `registration.post.ts`: die Funktion IST diese
 * Kette (Rolle, Projekt-Zugehörigkeit, Mitglieder), und eine achte handgeführte
 * Kopie wäre die eine, in der irgendwann eine Prüfung fehlt.
 *
 * CAPABILITY `team.manage` UND NICHT `members.invite` — das ist der Punkt der
 * ganzen Mechanik: wer einladen darf, darf deswegen nicht das Einladen
 * ABSCHALTEN. Sonst nähme ein frisch beigetretenes Mitglied der Community
 * ihren Wachstumshebel weg.
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  /** = communities.$id. Wird NICHT geglaubt, sondern gegen die Mitgliedschaft geprüft. */
  communityId: z.string().min(1).max(36),
  memberInvitesEnabled: z.boolean(),
}).strict()

export default defineEventHandler(async (event) => {
  await requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamContext(event, body, 'team.manage')

  const admin = createAdminClient(event)
  const row = await admin.tablesDB.updateRow<TenantRow>({
    databaseId: context.databaseId,
    tableId: COMMUNITIES_TABLE,
    rowId: body.communityId,
    data: { memberInvitesEnabled: body.memberInvitesEnabled },
  }).catch((error) => { throw toH3Error(error, 'Could not update community') })

  logEvent('info', 'community.member_invites_toggled', {
    communityId: row.$id,
    runtimeUserId: context.identity.userId,
    memberInvitesEnabled: body.memberInvitesEnabled,
  })

  /**
   * Zurück kommt der AUFGELÖSTE Wert, nicht der geschickte. Sie sind heute
   * gleich; sie wären es nicht mehr, wenn hier je ein Schreibfehler säße, und
   * dann soll die Oberfläche den Zustand der Datenbank zeigen, nicht ihren
   * eigenen Wunsch.
   */
  return { communityId: row.$id, memberInvitesEnabled: resolveTenantMemberInvitesEnabled(row.memberInvitesEnabled) }
})
