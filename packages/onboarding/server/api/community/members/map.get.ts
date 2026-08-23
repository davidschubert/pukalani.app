import { Query } from 'node-appwrite'
import type { CommunityRosterResponse } from '../../../../../control/shared/communityTeam'
import { readProfileLocation } from '../../../../../core/shared/profileLocation'
import type { CommunityMapMember, CommunityMembersMapResponse } from '../../../../shared/types/membersMap'
import { callControlPlane } from '../../../utils/controlPlane'
import { requireCommunityTeamGate } from '../../../utils/communityTeamGate'

/**
 * DIE MITGLIEDER-KARTE — alle, die einen Standort angegeben haben.
 *
 * Dieselbe Arbeitsteilung wie bei der Mitgliederliste (`index.get.ts`), nur mit
 * einer anderen Naht und einem anderen Gate:
 *  - Das CONTROL PLANE besitzt `community_members` und sagt, WER dazugehört
 *    (Rolle, Beitrittsdatum). Gerufen wird `members/roster` und NICHT
 *    `members/list`: die Karte steht jedem Mitglied offen, `members/list`
 *    liefert E-Mail-Adressen und bleibt deshalb bei `team.manage`.
 *  - Nur die RUNTIME kennt die Konten ihres Appwrite-Projekts und steuert Name,
 *    Avatar und den Standort aus `prefs` bei — GEBÜNDELT (ein `users.list` je
 *    100 Ids), nie eine Abfrage je Zeile.
 *
 * ── DAS GATE IST `members.invite`, NICHT `team.manage` ─────────────────────
 * Davids Zuschnitt: die Karte ist für ALLE Mitglieder, sie ist der Ort, an dem
 * eine Community sich selbst sieht. `members.invite` trägt seit F57 jede der
 * fünf Rollen — es ist damit das mitglieder-offene Gate, dasselbe, an dem auch
 * die Mitglieder-SEITE hängt. Ein Fremder (eingeloggt, kein Mitglied) bekommt
 * 403, ein Gast 401, ein Host ohne Community 404 — alles unverändert aus
 * `requireCommunityTeamGate`.
 *
 * ── NUR WER EINEN ORT ANGEGEBEN HAT ────────────────────────────────────────
 * `readProfileLocation` ist ALLES-ODER-NICHTS (Etappe 1): ein halber Standort
 * ist keiner. Wer keinen hat, taucht hier gar nicht auf — die Karte ist eine
 * FREIWILLIGE Anzeige, und ein Punkt bei (0,0) für „nichts angegeben" wäre die
 * bekannteste Falschmeldung der Kartografie.
 */

/**
 * WIE VIELE MITGLIEDER EIN LAUF ANSIEHT.
 *
 * Der Deckel sitzt auf dem ROSTER, nicht auf dem Ergebnis: ob jemand einen
 * Standort hat, steht in seinen `prefs`, und die kennt man erst nach dem
 * `users.list`. Er ist damit die Grenze der ARBEIT (500 Ids = 5 gebündelte
 * Abfragen), nicht die der Anzeige.
 *
 * ER SCHNEIDET NIE STILL AB: wird er erreicht, trägt die Antwort `truncated:
 * true` und die Seite sagt es. Eine Karte, die 500 von 900 Menschen zeigt und
 * so tut, als wären es alle, ist schlimmer als eine, die um Geduld bittet.
 * Pool-Communities sind Vereins- und Redaktionsgröße; wer den Deckel erreicht,
 * findet den Grund zusätzlich im Log.
 */
const MAP_ROSTER_SCAN_LIMIT = 500

/** `Query.equal` fasst 100 Werte — dieselbe Stapelgrösse wie `resolveAvatars`. */
const USER_BATCH = 100

export default defineEventHandler(async (event): Promise<CommunityMembersMapResponse> => {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'members.invite')

  const roster = await callControlPlane<CommunityRosterResponse>(
    event,
    '/api/control/community/members/roster',
    { jwt, communityId },
  )

  const truncated = roster.members.length > MAP_ROSTER_SCAN_LIMIT
  if (truncated) {
    logEvent('warn', 'community.map_roster_truncated', {
      communityId,
      total: roster.members.length,
      limit: MAP_ROSTER_SCAN_LIMIT,
    })
  }
  const scanned = truncated ? roster.members.slice(0, MAP_ROSTER_SCAN_LIMIT) : roster.members

  const ids = [...new Set(scanned.map(member => member.runtimeUserId).filter(Boolean))]
  if (ids.length === 0) return { members: [], truncated }

  /**
   * EIN Durchlauf für drei Dinge (Name, Avatar, Standort) statt `resolveAvatars`
   * PLUS eines zweiten `users.list` für die prefs: es sind dieselben Konten und
   * dieselbe Antwort. `resolveAvatars` bleibt der Weg, wo NUR der Avatar
   * gebraucht wird — hier wäre es die doppelte Abfrage für dieselben Daten.
   *
   * FAIL-SOFT wie dort: bricht die Auflösung weg, ist die Karte leer statt die
   * Seite rot. Ein Standort, den niemand auflösen konnte, ist kein Fehler des
   * Betrachters.
   */
  const profiles = new Map<string, { name: string, avatarUrl: string, prefs: Record<string, unknown> }>()
  try {
    const admin = createAdminClient(event)
    for (let i = 0; i < ids.length; i += USER_BATCH) {
      const batch = ids.slice(i, i + USER_BATCH)
      const res = await admin.users.list({ queries: [Query.equal('$id', batch), Query.limit(batch.length)] })
      for (const user of res.users) {
        const prefs = (user.prefs ?? {}) as Record<string, unknown>
        const avatarUrl = typeof prefs.avatarUrl === 'string' ? prefs.avatarUrl : ''
        profiles.set(user.$id, { name: user.name ?? '', avatarUrl, prefs })
      }
    }
  }
  catch {
    return { members: [], truncated }
  }

  // Handles ebenfalls gebündelt (eine Abfrage je 100) — der Konto-weite Name
  // aus AH-7. Ohne Publikums-Filter und mit gutem Grund: gefragt wird nach
  // Menschen, deren Mitgliedschaft IN DIESER Community das Control Plane
  // gerade bestätigt hat — genau die Grenze, die der Filter zöge.
  const handles = await accountHandlesForUsers(event, ids)

  const members: CommunityMapMember[] = []
  for (const entry of scanned) {
    const profile = profiles.get(entry.runtimeUserId)
    if (!profile) continue
    const location = readProfileLocation(profile.prefs)
    if (!location) continue

    members.push({
      userId: entry.runtimeUserId,
      name: profile.name,
      handle: handles.get(entry.runtimeUserId) ?? '',
      avatarUrl: profile.avatarUrl,
      location,
      role: entry.role,
      joinedAt: entry.joinedAt,
    })
  }

  return { members, truncated }
})
