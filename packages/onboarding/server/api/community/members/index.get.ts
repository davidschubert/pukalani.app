import { Query } from 'node-appwrite'
import type { CommunityTeamResponse } from '../../../../../control/shared/communityTeam'
import { callControlPlane } from '../../../utils/controlPlane'
import { requireCommunityTeamGate } from '../../../utils/communityTeamGate'

/**
 * Das Team DIESER Community lesen — die Datenquelle von /dashboard/members.
 *
 * Zwei Welten, zwei Beiträge, und keine kann die andere ersetzen:
 *  - Das CONTROL PLANE besitzt `community_members`/`community_invites` und liefert Rollen,
 *    Status, Beitrittsdatum, offene Einladungen.
 *  - Nur die RUNTIME kennt die Nutzer ihres Appwrite-Projekts und ergänzt NAMEN
 *    UND AVATARE. Gebündelt (ein users.list für alle IDs), nicht pro Zeile —
 *    dieselbe Regel wie bei resolveAvatars.
 *
 * BEIDES AUS DEMSELBEN AUFRUF (2026-08-23): `resolveAvatars` daneben zu rufen
 * wäre ein ZWEITER, identischer `users.list` über dieselben Ids — Name und
 * `prefs.avatarUrl` stehen an demselben Konto-Objekt, das diese Schleife schon
 * in der Hand hat.
 */
export default defineEventHandler(async (event): Promise<CommunityTeamResponse> => {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'team.manage')

  const team = await callControlPlane<CommunityTeamResponse>(
    event,
    '/api/control/community/members/list',
    { jwt, communityId },
  )

  const ids = [...new Set(team.members.map(member => member.runtimeUserId).filter(Boolean))]
  const names = new Map<string, string>()
  const avatars = new Map<string, string>()
  if (ids.length > 0) {
    try {
      const admin = createAdminClient(event)
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100)
        const res = await admin.users.list({ queries: [Query.equal('$id', batch), Query.limit(batch.length)] })
        for (const user of res.users) {
          if (user.name) names.set(user.$id, user.name)
          const avatarUrl = (user.prefs as { avatarUrl?: string })?.avatarUrl
          if (typeof avatarUrl === 'string' && avatarUrl.length > 0) avatars.set(user.$id, avatarUrl)
        }
      }
    }
    catch {
      // Namen und Bilder sind Komfort, nicht Inhalt: fehlen sie, zeigt die
      // Liste die E-Mail-Adresse und Initialen — eine leere Seite wäre die
      // schlechtere Antwort.
    }
  }

  return {
    ...team,
    members: team.members.map(member => ({
      ...member,
      name: names.get(member.runtimeUserId) ?? '',
      avatarUrl: avatars.get(member.runtimeUserId) ?? '',
    })),
  }
})
