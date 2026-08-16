import { callControlPlane } from '../utils/controlPlane'
import type { CommunityInviteLookup } from '../../../core/server/utils/communityInvite'

/**
 * Der core-Vertrag „öffnet dieser Token die Registrierung?" wird hier mit der
 * Service-Naht zum Control Plane verdrahtet.
 *
 * Warum in DIESEM Layer: `community_invites` gehört dem Control Plane, und der
 * einzige Kanal dorthin ist die Naht dieses Layers. Core darf sie nicht kennen
 * (A14) — dasselbe Muster wie beim Join-Handler nebenan.
 *
 * OHNE JWT, anders als jede andere Naht hier: Wer registrieren will, HAT noch
 * kein Konto — es gibt schlicht keine Identität zu prägen. Der Beweis ist der
 * Token selbst (er stand nur in der Mail an die eingeladene Adresse), und die
 * Bindung an die Adresse zieht der Kern (`inviteOpensRegistrationFor`).
 *
 * Ohne diesen Layer (Silo-App comments, Playground) ist kein Resolver
 * registriert, `inviteOpensRegistrationFor` liefert `false` und die Sperre
 * gilt unverändert — dort ist das PROJEKT die Grenze und es gibt keine
 * community_invites.
 */
export default defineNitroPlugin(() => {
  registerCommunityInviteResolver(async (event, token): Promise<CommunityInviteLookup | null> => {
    const tenant = useTenant(event)
    // Kein Mandant ⇒ keine Community, zu der eine Einladung gehören könnte.
    if (!tenant?.communityId) return null

    /**
     * Ein 404 des Control Plane ist die NORMALE Antwort auf einen Token, der
     * nicht (mehr) gilt — kein Zwischenfall. Er wird deshalb hier zu `null`
     * und nicht nach oben gereicht: die Route soll „geht hier nicht" sagen,
     * nicht „Fehler". Alles andere (Naht tot, 500) fliegt weiter und landet im
     * fail-closed `catch` des Vertrags, wo es ebenfalls zur geschlossenen Tür
     * wird — dann aber mit Log-Spur.
     */
    const result = await callControlPlane<{ ok: boolean, email: string, role: string }>(
      event,
      '/api/control/community/invites/preview',
      { token, communityId: tenant.communityId },
    ).catch((error: unknown) => {
      const status = (error as { statusCode?: number, status?: number }).statusCode
        ?? (error as { status?: number }).status
      if (status === 404) return null
      throw error
    })

    return result?.ok ? { email: result.email, role: result.role } : null
  })
})
