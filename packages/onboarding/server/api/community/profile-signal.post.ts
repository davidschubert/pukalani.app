import { communityProfileSignalSchema, type CommunityProfileSignalResult } from '../../../../control/schemas/profileSignal'
import { callControlPlane, mintRuntimeJwt } from '../../utils/controlPlane'

/**
 * DAS MARKT-SIGNAL ABGEBEN (U19) — Aufrufer ist die Karte „Hilf uns, Pukalani
 * zu schärfen" auf der Dashboard-Übersicht.
 *
 * WARUM DIESE ROUTE IM ONBOARDING-LAYER LIEGT: dieselbe Begründung wie beim
 * Nachbarn `profile.patch.ts` — `communities` gehört dem Control Plane, die
 * Platform-App hat dorthin nur einen READ-ONLY-Key, und der einzige vorgesehene
 * Schreibkanal ist die Service-Naht DIESES Layers (utils/controlPlane.ts:
 * Secret + JWT). Kein zweiter Kanal, kein erweiterter Lese-Key.
 *
 * AUTORISIERUNG: `requireCommunityPermission(event, 'team.manage')` — dieselbe
 * Capability, die auch die Karte selbst verlangt, und NIE `requirePermission`
 * (die ist synchron und für Betreiber-Routen). Das Control Plane prüft die
 * Rolle danach noch einmal selbst; diese Prüfung ist die schnelle, die 403
 * gibt, bevor ein JWT geprägt wird.
 *
 * DIE SPERRE GILT HIER NICHT (M13): die Antworten sind kein INHALT, sondern
 * eine Auskunft des Owners über seine eigene Community — sie laufen wie jede
 * Owner-Einstellung über die Service-Naht und nicht durch die Datentür. Eine
 * nur-lesende Community darf uns weiterhin sagen, was sie vorhat; das ist
 * gerade dann interessant.
 */
export default defineEventHandler(async (event): Promise<CommunityProfileSignalResult> => {
  await requireCommunityPermission(event, 'team.manage')

  // Ohne Mandanten-Kontext gibt es keine Community, für die man antworten
  // könnte (Silo-App, Kontroll-Host, Single-Tenant). 404 wie eine fehlende
  // Route.
  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const signal = await readValidatedBody(event, communityProfileSignalSchema.parse)
  const jwt = await mintRuntimeJwt(event)

  // communityId kommt aus dem SERVER-Kontext (Host-Auflösung), nie aus dem
  // Body — sonst beantwortete ein durchgereichter Wert die Frage für eine
  // fremde Community.
  return await callControlPlane<CommunityProfileSignalResult>(
    event,
    '/api/control/community/profile-signal',
    { jwt, communityId: tenant.communityId, signal },
  )
})
