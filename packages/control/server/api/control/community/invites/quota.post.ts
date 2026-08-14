import { z } from 'zod'
import { memberInviteQuota, memberInviteWindowStart } from '../../../../../shared/communityInviteQuota'
import { resolveTenantMemberInvitesEnabled } from '../../../../../shared/types/tenantRecord'
import { communityRoleHasCapability } from '../../../../../../core/shared/communityAuthz'
import { countCommunityInvitesBy, memberInviteLimit, requireCommunityTeamContext } from '../../../../utils/communityTeam'

/**
 * MEIN Einladungs-Kontingent in dieser Community (F57 Mechanik 2).
 *
 * Sie beantwortet genau die Frage, die die Oberfläche stellt: „darf ich hier
 * einladen, und wie oft noch?" — Schalter, Config-Kontingent, Rolle und
 * Verbrauch in EINER Antwort.
 *
 * ── WARUM ES DIESE ROUTE ÜBERHAUPT GIBT ────────────────────────────────────
 * Zwei der vier Zutaten stehen ausschließlich im Control Plane (der Schalter
 * an `communities`, der Verbrauch in `community_invites`). Der Browser könnte
 * sie sich also nicht zusammenrechnen, und der SSR-Payload trägt bewusst nur
 * den SCHALTER (`useTenantMemberInvites`) — der Verbrauch ist personenbezogen
 * und hätte in einem gecachten Mandanten-Kontext nichts zu suchen.
 *
 * Gelesen wird über dieselbe pure Regel, die die Einladungs-Route DURCHSETZT
 * (`memberInviteQuota` ruft `decideMemberInvite` selbst auf). Das ist der
 * ganze Grund, warum die Regel pur ist: ein Knopf, der da ist und dann 403
 * sagt, ist schlimmer als kein Knopf.
 *
 * Capability `members.invite` — jedes Mitglied darf sein eigenes Kontingent
 * sehen. Über ANDERE verrät die Antwort nichts.
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  communityId: z.string().min(1).max(36),
}).strict()

export default defineEventHandler(async (event) => {
  requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamContext(event, body, 'members.invite')

  const managesTeam = communityRoleHasCapability(context.actorRole, 'team.manage')
  const limit = memberInviteLimit()
  // Wie in der Einladungs-Route: für Owner/Admin ist das Kontingent unendlich,
  // also wird auch nichts gezählt.
  const used = managesTeam
    ? 0
    : await countCommunityInvitesBy(
        event,
        body.communityId,
        context.identity.userId,
        memberInviteWindowStart(Date.now()),
      )

  return memberInviteQuota({
    managesTeam,
    invitesEnabled: resolveTenantMemberInvitesEnabled(context.tenant.memberInvitesEnabled),
    limit,
    used,
  })
})
