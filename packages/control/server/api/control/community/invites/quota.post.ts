import { z } from 'zod'
import { memberInviteQuota, memberInviteWindowStart } from '../../../../../shared/communityInviteQuota'
import { resolveTenantMemberInvitesEnabled } from '../../../../../shared/types/tenantRecord'
import { communityRoleHasCapability } from '../../../../../../core/shared/communityAuthz'
import { countCommunityInvitesBy, memberInviteLimit, requireCommunityTeamRole } from '../../../../utils/communityTeam'

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
 *
 * ── WARUM `requireCommunityTeamRole` UND NICHT DER VOLLE KONTEXT (AU1) ─────
 * Diese Route beantwortet fünf Zahlen über den FRAGENDEN. Bis zum Audit
 * 2026-08-15 zog sie dafür die GESAMTE Mitgliederliste durch die Service-Naht
 * (bis zu zwanzig Listen-Abfragen à 500 Zeilen) — und zwar bei jedem
 * SSR-Aufbau der Mitglieder-Seite, die seit F57 jedem Mitglied offensteht.
 * Gebraucht hat sie davon: nichts. Die Kosten wuchsen mit der Community, die
 * Antwort nicht.
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  communityId: z.string().min(1).max(36),
}).strict()

export default defineEventHandler(async (event) => {
  await requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamRole(event, body, 'members.invite')

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
    // AU1: dieselbe Zutat wie in der Einladungs-Route — sonst stünde hier ein
    // Knopf, den die Route mit 403 beantwortet.
    emailVerified: context.identity.emailVerified,
    limit,
    used,
  })
})
