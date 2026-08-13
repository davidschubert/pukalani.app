import { z } from 'zod'
import { PROFILE_SIGNAL_PREF_KEY, withCommunityPostponed } from '../../../../shared/profileSignal'

/**
 * „SPÄTER" UND „NICHT MEHR FRAGEN" (U19).
 *
 * Der Merker liegt in den KONTO-prefs und trägt die communityId — im Pool
 * teilen sich alle Communities dieselben prefs, ein blankes `true` würde die
 * Frage auch in der nächsten, frisch angelegten Community verschlucken
 * (`withCommunityPostponed`, pur + getestet).
 *
 * EINE Route für BEIDE Knöpfe, gesteuert von `mode`: es ist dieselbe Aussage
 * mit unterschiedlicher Frist („Später" = 30 Tage, „Nicht mehr fragen" = für
 * immer). Zwei Routen hätten zweimal dasselbe getan.
 *
 * PREFS WERDEN GEMERGT: `updatePrefs` ERSETZT das ganze Objekt — ohne den
 * Spread verlöre dieser Klick Bio, Avatar, die Mail-Einstellungen UND den
 * Merker der Willkommens-Checkliste. Dieselbe Sicherung wie in
 * `getting-started/dismiss.post.ts`, aus demselben Grund.
 *
 * Session-Client, nicht Admin: ein Nutzer ändert seine eigenen Einstellungen.
 * Eine Capability wird bewusst NICHT verlangt — wer die Karte gar nicht sieht,
 * kann sie nicht wegklicken, und ein Merker in den eigenen prefs ist für
 * niemanden sonst folgenreich.
 */
const bodySchema = z.object({ mode: z.enum(['later', 'never']) }).strict()

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }
  const tenant = useTenant(event)
  if (tenant?.mode !== 'pool' || !tenant.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const { mode } = await readValidatedBody(event, bodySchema.parse)

  const prefs = event.context.user.prefs as Record<string, unknown>
  const { account } = createSessionClient(event)
  await account.updatePrefs({
    prefs: {
      ...prefs,
      [PROFILE_SIGNAL_PREF_KEY]: withCommunityPostponed(prefs?.[PROFILE_SIGNAL_PREF_KEY], tenant.communityId, mode),
    },
  })

  return { ok: true }
})
