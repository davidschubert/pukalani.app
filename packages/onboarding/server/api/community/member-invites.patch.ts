import { z } from 'zod'
import { callControlPlane, mintRuntimeJwt } from '../../utils/controlPlane'

/**
 * „Mitglieder dürfen einladen" DIESER Community umschalten (F57 Mechanik 2,
 * Davids Entscheidung 2026-08-14). Aufrufer ist der USwitch in
 * /dashboard/community, direkt unter der offenen Registrierung.
 *
 * Wort für Wort dieselbe Bauart wie `registration.patch.ts` daneben, und aus
 * demselben Grund: `communities` gehört dem Control Plane, die Platform-App
 * hat dorthin nur einen READ-ONLY-Key, der einzige Schreibkanal ist die
 * Service-Naht dieses Layers.
 *
 * AUTORISIERUNG `team.manage` — NICHT `members.invite`. Wer einladen darf,
 * darf das Einladen nicht ABSCHALTEN; sonst nähme ein einzelnes Mitglied der
 * Community ihren Wachstumshebel. Dieselbe Prüfung läuft im Control Plane
 * noch einmal; die hier ist die schnelle, die 403 gibt, bevor ein JWT geprägt
 * wird.
 */
const bodySchema = z.object({ memberInvitesEnabled: z.boolean() }).strict()

export default defineEventHandler(async (event) => {
  await requireCommunityPermission(event, 'team.manage')

  // Ohne Mandanten-Kontext gibt es keine Community, die man schalten könnte
  // (Silo-App, Kontroll-Host, Single-Tenant) — dort ist der Schalter kein
  // Produkt, das „gerade nicht geht", sondern gar keines.
  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const jwt = await mintRuntimeJwt(event)

  // communityId aus dem SERVER-Kontext (Host-Auflösung), nie aus dem Body.
  return await callControlPlane<{ communityId: string, memberInvitesEnabled: boolean }>(
    event,
    '/api/control/community/member-invites',
    { jwt, communityId: tenant.communityId, memberInvitesEnabled: body.memberInvitesEnabled },
  )
})
