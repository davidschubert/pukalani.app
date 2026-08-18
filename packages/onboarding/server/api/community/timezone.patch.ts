import { z } from 'zod'
import { isSupportedTimezone } from '../../../../core/shared/timezone'
import { callControlPlane, mintRuntimeJwt } from '../../utils/controlPlane'

/**
 * Die HEIMAT-ZEITZONE dieser Community setzen (control-038, Davids
 * Entscheidung 2026-08-17). Aufrufer ist die Zeile „Zeitzone" in
 * /dashboard/community.
 *
 * Wort für Wort dieselbe Bauart wie `member-invites.patch.ts` daneben, und aus
 * demselben Grund: `communities` gehört dem Control Plane, die Platform-App hat
 * dorthin nur einen READ-ONLY-Key, der einzige Schreibkanal ist die
 * Service-Naht dieses Layers.
 *
 * AUTORISIERUNG `team.manage` — die Zone bestimmt, wann JEDER Termin der
 * Community stattfindet; das ist Owner-/Admin-Sache, nicht redaktionell.
 * Dieselbe Prüfung läuft im Control Plane noch einmal; die hier ist die
 * schnelle, die 403 gibt, bevor ein JWT geprägt wird.
 *
 * `''` ist erlaubt und heißt „keine eigene Wahl" — dann bleibt es beim
 * bisherigen Verhalten (die Vorgabe im Formular kommt aus dem Gerät des
 * Ausfüllenden, sichtbar beschriftet).
 */
const bodySchema = z.object({
  timezone: z.string().max(64).refine(
    value => value === '' || isSupportedTimezone(value),
    { message: 'Unknown timezone' },
  ),
}).strict()

export default defineEventHandler(async (event) => {
  await requireCommunityPermission(event, 'team.manage')

  // Ohne Mandanten-Kontext gibt es keine Community, deren Zone man setzen
  // könnte (Silo-App, Kontroll-Host, Single-Tenant) — dort ist die Einstellung
  // kein Produkt, das „gerade nicht geht", sondern gar keines.
  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const jwt = await mintRuntimeJwt(event)

  // communityId aus dem SERVER-Kontext (Host-Auflösung), nie aus dem Body.
  return await callControlPlane<{ communityId: string, timezone: string }>(
    event,
    '/api/control/community/timezone',
    { jwt, communityId: tenant.communityId, timezone: body.timezone },
  )
})
