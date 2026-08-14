import { normalizeTimezonePref } from '../../shared/timezone'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Die gewählte Zeitzone des eingeloggten Kontos (`prefs.timezone`, U15 Teil 5)
 * — `''` heißt „automatisch" (Zone der Laufzeit).
 *
 * WARUM AUS DEM AUTH-STORE UND NICHT AUS EINEM EIGENEN FETCH: der Store trägt
 * den kompletten User samt Prefs, und `plugins/auth.server.ts` füllt ihn schon
 * BEIM SSR aus `event.context.user`. Server-Render und erste Client-Render
 * lesen damit denselben Wert aus demselben Payload — die Einstellung kann also
 * keinen Hydrations-Unterschied erzeugen. Ein nachgeladener Wert könnte das
 * sehr wohl: das HTML zeigte dann eine Zeit, die der Browser eine Sekunde
 * später anders schreibt.
 *
 * Gäste haben keine Prefs ⇒ automatisch, wie bisher.
 */
export function useAccountTimezone() {
  const auth = useAuthStore()

  const timezone = computed(() => normalizeTimezonePref(auth.user?.prefs?.timezone))

  return { timezone }
}
