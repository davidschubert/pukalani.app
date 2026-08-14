import { ID } from 'node-appwrite'
import { z } from 'zod'
import { decideInvite } from '../../../../../shared/communityTeam'
import { decideMemberInvite, memberInviteWindowStart } from '../../../../../shared/communityInviteQuota'
import { COMMUNITY_INVITES_TABLE, COMMUNITY_INVITE_TTL_MS, type CommunityInviteRow } from '../../../../../shared/types/communityInvite'
import { resolveTenantMemberInvitesEnabled } from '../../../../../shared/types/tenantRecord'
import { COMMUNITY_ROLES, communityRoleHasCapability } from '../../../../../../core/shared/communityAuthz'
import { countCommunityInvitesBy, listCommunityInvites, memberInviteLimit, requireCommunityTeamContext, createCommunityInviteToken, memberFacts, throwOnDenied } from '../../../../utils/communityTeam'
import { sendCommunityInviteMail } from '../../../../utils/communityInviteMail'

/**
 * Jemanden in eine Community einladen — EIN Feld, eine Rollenwahl (Davids
 * Entscheidung 2 vom 2026-07-29).
 *
 * Reihenfolge mit Absicht: erst Regeln, dann MAIL, dann Row. Wie bei den
 * Einladungen (M9-T2-Muster) gilt „keine Einladung ohne Zustellung": lässt
 * sich die Mail nicht senden, entsteht auch kein pending-Eintrag, der im
 * Dashboard läge und niemanden erreicht (503, nichts angelegt).
 *
 * Eine zweite Einladung an dieselbe Adresse ERSETZT die erste — genau EIN
 * gültiger Link je Adresse, alte Links sterben. Die DB kennt nur den Token-Hash.
 *
 * 'owner' ist hier verboten (decideInvite): Besitz entsteht durch Gründung oder
 * Übergabe, nie durch eine Einladung.
 *
 * ── SEIT F57 DÜRFEN AUCH MITGLIEDER EINLADEN (Davids Entscheidung 2026-08-14)
 * Die Capability heißt jetzt `members.invite` statt `team.manage` und sitzt
 * beim VIEWER — jedes Mitglied mit Zugang. Für ein Mitglied kommen drei
 * Bedingungen dazu, alle in der PUREN `decideMemberInvite`: der Owner-Schalter
 * der Community, die eingeladene Rolle (immer `viewer`) und das Kontingent
 * (5 je rollierender Woche). Owner/Admin gehen unverändert durch.
 *
 * WO DIE PRÜFUNG STEHT, IST DIE HALBE MECHANIK: VOR der Mail. Stünde sie
 * danach, hätte ein erschöpftes Kontingent trotzdem eine Mail verschickt und
 * nur die Zeile verweigert — die Drossel säße hinter dem Missbrauch.
 *
 * WARUM DIE ROLLEN-PRÜFUNG HIER UND NICHT NUR IN DER OBERFLÄCHE: ohne sie
 * wäre `role: 'admin'` im Body eine Rollen-Vergabe per Mitglieds-Capability —
 * dieselbe Klasse Fehler, gegen die `community.transfer` als eigene
 * Capability geschnitten wurde. Ein verstecktes Auswahlfeld ist keine Grenze.
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  communityId: z.string().min(1).max(36),
  email: z.string().email().max(254),
  role: z.enum(COMMUNITY_ROLES),
  locale: z.enum(['de', 'en']).default('de'),
}).strict()

export default defineEventHandler(async (event) => {
  requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamContext(event, body, 'members.invite')

  /**
   * F57: die Zusatz-Regeln für MITGLIEDER. `managesTeam` beantwortet die
   * Capability-Matrix, nicht ein Rollen-Vergleich — käme je eine sechste Rolle
   * dazu, stimmt diese Zeile weiter.
   *
   * Der Verbrauch wird nur GEZÄHLT, wenn er zählt: für Owner/Admin ist das
   * Kontingent unendlich, und eine Abfrage, deren Ergebnis niemand liest, ist
   * eine Abfrage zu viel auf dem Weg jeder Team-Einladung.
   */
  const managesTeam = communityRoleHasCapability(context.actorRole, 'team.manage')
  const limit = memberInviteLimit()
  const used = managesTeam
    ? 0
    : await countCommunityInvitesBy(
        event,
        body.communityId,
        context.identity.userId,
        memberInviteWindowStart(Date.now()),
      )

  const gate = decideMemberInvite({
    managesTeam,
    role: body.role,
    invitesEnabled: resolveTenantMemberInvitesEnabled(context.tenant.memberInvitesEnabled),
    limit,
    used,
  })
  if (!gate.ok) {
    logEvent('info', 'community.member_invite_denied', {
      communityId: body.communityId,
      actor: context.identity.userId,
      role: body.role,
      reason: gate.reason,
      used,
      limit,
    })
    /**
     * 429 NUR fürs erschöpfte Kontingent — das ist die einzige der drei
     * Ablehnungen, die sich von selbst erledigt (in spätestens sieben Tagen).
     * Abgeschaltete Mechanik und verbotene Rolle sind 403: daran ändert
     * Warten nichts, und ein 429 lüde zum Wiederholen ein.
     *
     * `Retry-After` bleibt bewusst WEG. Ehrlich wäre „wenn deine älteste
     * Einladung sieben Tage alt ist" — dafür müsste die Route deren Datum
     * nachschlagen, und der Header ist auf die Sekunde genau gemeint, nicht
     * auf den Tag. Der Text in der Oberfläche sagt es besser.
     */
    throw createError({
      status: gate.reason === 'invite_quota_exhausted' ? 429 : 403,
      statusText: gate.reason === 'invite_quota_exhausted' ? 'Invite quota exhausted' : 'Forbidden',
      data: { code: gate.reason },
    })
  }

  const email = body.email.trim().toLowerCase()
  const activeEmails = context.members
    .filter(row => row.status === 'active')
    .map(row => row.email ?? '')

  throwOnDenied(
    decideInvite({ email, role: body.role, members: context.members.map(memberFacts), activeEmails }),
    { communityId: body.communityId, actor: context.identity.userId, role: body.role },
  )

  const { token, tokenHash } = createCommunityInviteToken()
  const sent = await sendCommunityInviteMail(event, {
    to: email,
    siteName: context.tenant.name || context.tenant.host,
    host: context.tenant.host,
    token,
    role: body.role,
    locale: body.locale,
    invitedByName: context.identity.name,
  })
  if (!sent) {
    throw createError({ status: 503, statusText: 'Mailer not configured' })
  }

  const admin = createAdminClient(event)
  // Vorherige offene Einladung derselben Adresse zurückziehen (nicht löschen —
  // die Spur bleibt, aber der alte Link ist tot).
  const previous = (await listCommunityInvites(event, body.communityId))
    .filter(row => row.email.trim().toLowerCase() === email)
  for (const invite of previous) {
    await admin.tablesDB.updateRow({
      databaseId: context.databaseId, tableId: COMMUNITY_INVITES_TABLE, rowId: invite.$id,
      data: { status: 'revoked' },
    }).catch(() => {})
  }

  const row = await admin.tablesDB.createRow<CommunityInviteRow>({
    databaseId: context.databaseId,
    tableId: COMMUNITY_INVITES_TABLE,
    rowId: ID.unique(),
    data: {
      communityId: body.communityId,
      email,
      role: body.role,
      tokenHash,
      status: 'pending',
      expiresAt: new Date(Date.now() + COMMUNITY_INVITE_TTL_MS).toISOString(),
      invitedBy: context.identity.userId,
      acceptedBy: '',
    },
  }).catch((error) => { throw toH3Error(error, 'Could not create invitation') })

  logEvent('info', 'site.member_invited', {
    communityId: body.communityId,
    inviteId: row.$id,
    role: body.role,
    actor: context.identity.userId,
    // F57: woher das Recht kam. Ohne diese Zeile ließe sich im Nachhinein
    // nicht unterscheiden, ob eine Einladungswelle vom Team oder aus der
    // Mitgliedschaft kam — genau die Frage, die man bei Missbrauch stellt.
    viaQuota: !managesTeam,
  })

  /**
   * Das Kontingent NACH dieser Einladung reist mit — die Oberfläche schreibt
   * „noch 2 von 5" fort, ohne eine zweite Runde zum Server. `used + 1` ist
   * hier keine Schätzung: die Zeile ist eine Anweisung weiter oben entstanden.
   */
  return {
    ok: true,
    inviteId: row.$id,
    email,
    role: body.role,
    expiresAt: row.expiresAt,
    quota: { unlimited: managesTeam, limit, used: used + 1, remaining: managesTeam ? limit : Math.max(0, limit - used - 1) },
  }
})
