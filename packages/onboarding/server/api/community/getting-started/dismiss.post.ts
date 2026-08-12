import { GETTING_STARTED_PREF_KEY, withCommunityDismissed } from '../../../../shared/gettingStarted'

/**
 * „Diese Liste brauche ich nicht." (U4)
 *
 * Der Merker liegt in den KONTO-prefs und trägt die communityId — im Pool
 * teilen sich alle Communities dieselben prefs, ein blankes `true` würde die
 * Liste auch in der nächsten, frisch angelegten Community verschlucken
 * (`withCommunityDismissed`, pur + getestet).
 *
 * PREFS WERDEN GEMERGT: `updatePrefs` ERSETZT das ganze Objekt — ohne den
 * Spread verlöre dieser Klick Bio, Avatar und die Mail-Einstellungen. Dieselbe
 * Sicherung wie in `notification-prefs.put.ts`, aus demselben Grund.
 *
 * Session-Client, nicht Admin: ein Nutzer ändert seine eigenen Einstellungen.
 * Eine Capability wird bewusst NICHT verlangt — wer die Karte gar nicht sieht,
 * kann sie nicht wegklicken, und ein Merker in den eigenen prefs ist für
 * niemanden sonst folgenreich.
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }
  const tenant = useTenant(event)
  if (tenant?.mode !== 'pool' || !tenant.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const prefs = event.context.user.prefs as Record<string, unknown>
  const { account } = createSessionClient(event)
  await account.updatePrefs({
    prefs: {
      ...prefs,
      [GETTING_STARTED_PREF_KEY]: withCommunityDismissed(prefs?.[GETTING_STARTED_PREF_KEY], tenant.communityId),
    },
  })

  return { ok: true }
})
