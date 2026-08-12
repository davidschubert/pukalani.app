import type { H3Event } from 'h3'
import type { CommunityTeamResponse } from '../../../control/shared/communityTeam'
import { callControlPlane, mintRuntimeJwt } from './controlPlane'

/**
 * WIE GROSS IST DIESES TEAM? — EIN Ruf ans Control Plane, zwei Leser
 * (U9/K2, 2026-08-11).
 *
 * `community_members` und `community_invites` leben im Control Plane, der
 * Mandanten-Host hat auf beide keinen Schlüssel (dieselbe Grenze wie bei
 * `revokeCommunityLabel`, A5). Die Frage kostet also einen Ruf über die
 * Service-Naht — und genau deshalb gibt es diese Datei.
 *
 * BIS U9 stand die Abfrage IN der Checklisten-Route und wurde dort sofort auf
 * ein `boolean` eingedampft („erreicht die Community außer dem Owner noch
 * jemanden?"). Die neue Mitglieder-KACHEL braucht dieselbe Antwort, nur als
 * Zahl. Ein zweiter Ruf daneben wäre auf der meistbesuchten Seite des
 * Dashboards ein zweiter Gang über eine Projektgrenze für Daten, die schon im
 * Speicher liegen — und zwei Zahlen, die auseinanderlaufen können.
 *
 * DER CACHE HÄLT JETZT DIE ROHE ANTWORT, nicht das Urteil: wer zuerst kommt,
 * bezahlt den Ruf, der zweite Leser bekommt ihn geschenkt. 30 s, wie der
 * Mandanten-Resolver.
 *
 * FAIL-SOFT, ABER OHNE RICHTUNG: `null` heißt „keine Auskunft". Die Richtung
 * entscheidet der Leser, und beide entscheiden sie anders — die Checkliste
 * hakt den Punkt ab (ein technischer Fehler darf keine Aufgabe erfinden, die
 * niemand erledigen kann), die Kachel entfällt (lieber keine Zahl als eine
 * erfundene 0). Ein Aussetzer wird bewusst NICHT gecacht.
 *
 * Bewusst OHNE die Namens-Anreicherung von `/api/community/members` — die
 * kostet zusätzlich `users.list`, und für eine Zahl braucht es keine Namen.
 */
export interface CommunityTeamSnapshot {
  /** Mitglieder MIT Zugang — `status: 'removed'` zählt nicht mit (A5). */
  members: number
  /** Offene, nicht abgelaufene Einladungen (das Control Plane filtert sie). */
  invites: number
}

const teamCache = createMicrocache<CommunityTeamSnapshot>(30_000)

export async function resolveCommunityTeamSnapshot(
  event: H3Event,
  communityId: string,
): Promise<CommunityTeamSnapshot | null> {
  const cached = teamCache.get(communityId)
  if (cached !== undefined) return cached

  try {
    const jwt = await mintRuntimeJwt(event)
    const team = await callControlPlane<CommunityTeamResponse>(
      event, '/api/control/community/members/list', { jwt, communityId },
    )
    const snapshot: CommunityTeamSnapshot = {
      members: team.members.filter(member => member.status !== 'removed').length,
      invites: team.invites.length,
    }
    teamCache.set(communityId, snapshot)
    return snapshot
  }
  catch {
    return null
  }
}
