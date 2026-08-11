import { z } from 'zod'
import { readOnboardingGate, writeOnboardingGate } from '../../../utils/onboardingGate'

/**
 * Der Betreiber legt das Early-Access-Tor um (U2, Davids Entscheidung 1 vom
 * 2026-08-10): braucht das Gründen einer eigenen Community einen
 * Einladungs-Code — ja oder nein?
 *
 * `sites.manage` wie die Nachbar-Routen dieses Ordners: wer Codes ausstellt
 * und einzieht, entscheidet auch, ob überhaupt einer nötig ist.
 *
 * Der Vorgang gehört ins Audit-Protokoll. Er ist selten, folgenreich und von
 * außen nicht zu sehen — genau die Sorte Änderung, bei der später jemand
 * fragt, seit wann das Tor offen steht.
 */
const bodySchema = z.object({ inviteRequired: z.boolean() }).strict()

export default defineEventHandler(async (event) => {
  requirePermission(event, 'sites.manage')

  const { inviteRequired } = await readValidatedBody(event, bodySchema.parse)
  const before = await readOnboardingGate(event)
  await writeOnboardingGate(event, inviteRequired)

  await recordAudit(event, {
    action: 'onboarding.gate_updated',
    targetType: 'config',
    targetId: 'global',
    metadata: { inviteRequired, previous: before.inviteRequired },
  })

  return { inviteRequired }
})
