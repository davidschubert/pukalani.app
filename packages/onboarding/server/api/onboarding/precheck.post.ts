import { z } from 'zod'
// Cross-Layer als expliziter Vertrag (s. site.post.ts).
import { inviteCodeSchema } from '../../../../control/schemas/onboarding'
import { createSlugSchema } from '../../../../control/schemas/tenant'
import { callControlPlane } from '../../utils/controlPlane'

/**
 * Live-Prüfung im Wizard: gilt der Code, ist die Adresse frei?
 *
 * Session Pflicht, obwohl hier nichts entsteht: sonst wäre das ein offener
 * Endpunkt, mit dem sich Einladungs-Codes durchprobieren und belegte
 * Subdomains abgrasen lassen. Zusätzlich drosselt die core-Rate-Limit-
 * Middleware pro IP.
 */
const bodySchema = z.object({
  code: inviteCodeSchema.optional(),
  slug: createSlugSchema().optional(),
}).strict().refine(body => body.code !== undefined || body.slug !== undefined, 'empty precheck')

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)
  const result = await callControlPlane<{ codeValid?: boolean, slugAvailable?: boolean, codeReason?: 'email_unverified' }>(
    event,
    '/api/control/onboarding/precheck',
    // Adresse UND Bestätigungs-Status kommen aus der SESSION, nie aus dem Body —
    // sonst könnte jemand die Bindung eines fremden Codes umgehen, indem er die
    // Adresse des Eingeladenen mitschickt (und seit dem Audit 2026-08-02 auch:
    // indem er sich selbst für bestätigt erklärt).
    { ...body, email: event.context.user.email, emailVerified: event.context.user.emailVerification },
  )
  // Bis U12 stand hier zusätzlich `aiAvailable` für den KI-Knopf des
  // Beschreibungs-Schritts. Den Schritt gibt es nicht mehr, also auch die
  // Auskunft nicht — ein Flag ohne Leser ist eine Zusage ohne Deckung.
  return result
})
