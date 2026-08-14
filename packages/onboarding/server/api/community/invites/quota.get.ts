import type { MemberInviteQuotaView } from '../../../../../control/shared/communityInviteQuota'
import { callControlPlane } from '../../../utils/controlPlane'
import { requireCommunityTeamGate } from '../../../utils/communityTeamGate'

/**
 * MEIN Einladungs-Kontingent in dieser Community (F57 Mechanik 2).
 *
 * Sie füttert genau zwei Dinge in der Mitglieder-Seite: ob der
 * „Einladen"-Knopf überhaupt erscheint, und den Satz „noch 3 von 5 diese
 * Woche". Beides kommt aus DERSELBEN puren Regel, die die Einladungs-Route
 * durchsetzt — die Oberfläche rechnet nichts nach.
 *
 * WARUM SIE NICHT AUS DEM SSR-PAYLOAD KOMMT: der Mandanten-Kontext ist pro
 * HOST gecacht (≤30 s), das Kontingent ist pro PERSON. Ein personenbezogener
 * Wert in einem geteilten Cache ist der Fehler, den man genau einmal macht.
 * Der SCHALTER der Community reist dort weiter mit
 * (`useTenantMemberInvites`) — der ist für alle gleich.
 *
 * `members.invite` als Gate: jedes Mitglied darf sein eigenes Kontingent
 * sehen. Über andere verrät die Antwort nichts.
 */
export default defineEventHandler(async (event) => {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'members.invite')

  return await callControlPlane<MemberInviteQuotaView>(
    event,
    '/api/control/community/invites/quota',
    { jwt, communityId },
  )
})
