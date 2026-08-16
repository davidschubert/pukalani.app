import { z } from 'zod'
import { callControlPlane } from '../../../utils/controlPlane'

/**
 * Wem gehört diese Einladung? — beantwortet OHNE Anmeldung.
 *
 * Die eine Route, die es braucht, damit die Einladungs-Seite einer
 * geschlossenen Community sagen kann „Du bist als Redakteur/in eingeladen, leg
 * dein Konto an" — zu einem Zeitpunkt, an dem es die Person als Konto noch
 * nicht gibt (Davids Entscheidung 2026-08-15).
 *
 * KEINE Anmeldepflicht, und das ist kein Versehen: der TOKEN ist der Beweis.
 * Er stand nur in der Mail an die eingeladene Adresse, in der Datenbank liegt
 * bloss sein SHA-256. Wer ihn hat, kennt Adresse und Rolle ohnehin — sie
 * standen in derselben Mail.
 *
 * Gedrosselt über FAILURE_LIMITED (05.rate-limit.ts), wie die anderen
 * session-losen Token-Prüfungen: ein gültiger Aufruf kostet nichts, geratene
 * Token laufen ins Budget.
 *
 * DER MANDANT KOMMT NIE VOM AUFRUFER. `communityId` setzt die Naht aus
 * `useTenant(event)` — sonst wäre ein gültiges Token für Community A hier ein
 * Schlüssel für B.
 */
const bodySchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

export default defineEventHandler(async (event) => {
  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const result = await callControlPlane<{ ok: boolean, email: string, role: string }>(
    event,
    '/api/control/community/invites/preview',
    { token: body.token, communityId: tenant.communityId },
  ).catch((error: unknown) => {
    const status = (error as { statusCode?: number, status?: number }).statusCode
      ?? (error as { status?: number }).status
    // 404 = Token gilt nicht (mehr). Einheitliche Antwort, damit die Route
    // kein Orakel über fremde Einladungen wird.
    if (status === 404) return null
    throw error
  })

  if (!result?.ok) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  return { ok: true, email: result.email, role: result.role }
})
