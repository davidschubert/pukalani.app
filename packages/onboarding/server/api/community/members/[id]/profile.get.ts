import type { CommunityRosterResponse } from '../../../../../../control/shared/communityTeam'
import { readProfileLocation } from '../../../../../../core/shared/profileLocation'
import type { CommunityMemberProfileResponse } from '../../../../../shared/types/membersMap'
import { callControlPlane } from '../../../../utils/controlPlane'
import { requireCommunityTeamGate } from '../../../../utils/communityTeamGate'

/**
 * DIE DETAILSEITE EINES MITGLIEDS — was ein Mensch über sich veröffentlicht
 * hat, plus die zwei Fakten seiner Mitgliedschaft.
 *
 * ── KEIN ÖFFENTLICHES PROFIL ───────────────────────────────────────────────
 * Zwei Bedingungen, beide hart:
 *  1. **Eingeloggt UND Mitglied** — dasselbe mitglieder-offene Gate wie die
 *     Karte (`members.invite`). Gast ⇒ 401, Fremder ⇒ 403, Host ohne Community
 *     ⇒ 404.
 *  2. **Das ZIEL ist aktives Mitglied DERSELBEN Community.** Sonst 404 — und
 *     zwar dasselbe 404 wie für eine erfundene Id. Ein 403 („gibt es, darfst du
 *     nur nicht") wäre eine Auskunft über eine fremde Person: mit ihr liesse
 *     sich durch Ausprobieren feststellen, welche Konten es auf der Instanz
 *     gibt.
 *
 * ── WAS DRAUSSEN BLEIBT ────────────────────────────────────────────────────
 * KEINE E-Mail, KEINE Telefonnummer, keine Sitzungen, keine IP. Nicht durch
 * Weglassen an dieser Stelle, sondern weil `CommunityMemberProfileResponse` die
 * Felder nicht hat und die Naht (`members/roster`) die E-Mail gar nicht erst
 * liefert. Gezeigt wird, was der Mensch selbst in sein Konto geschrieben hat
 * (Name, Handle, Avatar, Standort, Bio) und was seine Beziehung zu DIESER
 * Community beschreibt (Rolle, dabei seit).
 *
 * ── WARUM DIE GANZE MITGLIEDER-LISTE FÜR EINEN MENSCHEN ────────────────────
 * Die Zugehörigkeit ist eine Frage an das CONTROL PLANE, und dessen einzige
 * mitglieder-offene Auskunft ist `members/roster`. Eine zweite Naht „ist X
 * Mitglied?" wäre ein weiterer Endpunkt mit eigener Autorisierung für eine
 * Antwort, die hier schon in der Hand liegt — bei Vereins- und
 * Redaktionsgrösse ist die Liste eine Abfrage, kein Problem. Der Deckel von
 * `listCommunityMembers` (10 000, mit Log) gilt unverändert.
 */
export default defineEventHandler(async (event): Promise<CommunityMemberProfileResponse> => {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'members.invite')

  const targetId = getRouterParam(event, 'id') ?? ''
  // Appwrite-Row-Ids sind höchstens 36 Zeichen — was länger ist, war nie eine.
  if (!targetId || targetId.length > 36) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const roster = await callControlPlane<CommunityRosterResponse>(
    event,
    '/api/control/community/members/roster',
    { jwt, communityId },
  )

  // `communityRosterFrom` hat schon auf 'active' gefiltert: wer hier fehlt, ist
  // kein Mitglied (mehr) — und ein Ehemaliger bekommt bewusst dieselbe Antwort
  // wie jemand, den es nie gab.
  const entry = roster.members.find(member => member.runtimeUserId === targetId)
  if (!entry) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  let name = ''
  let avatarUrl = ''
  let bio = ''
  let prefs: Record<string, unknown> = {}
  try {
    const admin = createAdminClient(event)
    const user = await admin.users.get({ userId: targetId })
    prefs = (user.prefs ?? {}) as Record<string, unknown>
    name = user.name ?? ''
    avatarUrl = typeof prefs.avatarUrl === 'string' ? prefs.avatarUrl : ''
    bio = typeof prefs.bio === 'string' ? prefs.bio : ''
  }
  catch {
    /**
     * FAIL-SOFT, nicht 404: die Mitgliedschaft ist BESTÄTIGT, das Konto nur
     * gerade nicht auflösbar (Rechte, Ausfall, oder eine Zeile, deren Konto
     * DSGVO-gelöscht wurde). Die Seite zeigt dann Rolle und Beitrittsdatum —
     * ein 404 behauptete stattdessen, es gäbe dieses Mitglied nicht.
     */
  }

  return {
    userId: targetId,
    name,
    handle: (await accountHandlesForUsers(event, [targetId])).get(targetId) ?? '',
    avatarUrl,
    location: readProfileLocation(prefs),
    role: entry.role,
    joinedAt: entry.joinedAt,
    bio,
  }
})
