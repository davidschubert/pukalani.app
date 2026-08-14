import { z } from 'zod'
import { createSessionClient } from '../../lib/appwrite'
import { AUTOMATIC_TIMEZONE, isSupportedTimezone } from '../../../shared/timezone'

/**
 * Zeitzone des Kontos setzen (Konto-Einstellungen → Allgemein, U15 Teil 5).
 *
 * FAIL-CLOSED: geprüft wird gegen die Zonenliste der Laufzeit
 * (`Intl.supportedValuesOf('timeZone')`, s. shared/timezone.ts) — ein
 * unbekannter Name ist eine 400, kein „speichern wir mal". Ein Tippfehler in
 * den Prefs würde sonst bei JEDER späteren Anzeige eine RangeError aus
 * `Intl.DateTimeFormat` werfen.
 *
 * EIGENE ROUTE, kein Anhängsel an `notification-prefs.put.ts`: die verlangt
 * `emailNotifications` + `emailLocale` als Pflichtfelder und heißt nach dem,
 * was sie tut. Die Zeitzone ist Anzeige, keine Benachrichtigung; über dieselbe
 * Route zu schreiben hieße, in einem Formular fremde Werte mitzuschicken.
 * MECHANIK ist identisch und bleibt es: Session-Client, `account.updatePrefs`
 * MIT MERGE (updatePrefs ERSETZT sonst bio/avatarUrl & Co.), keine Tabelle.
 *
 * `/api/auth/` steht bereits in `pukalani.tenancy.controlApiPrefixes` — die
 * Route antwortet damit auch auf den Kontroll-Hosts, wo dieselbe Fläche als
 * `/profile` läuft.
 */
const timezoneSchema = z.object({
  // '' ist ausdrücklich erlaubt: „automatisch" ist eine Wahl, kein Fehlen.
  timezone: z.string().refine(
    value => value === AUTOMATIC_TIMEZONE || isSupportedTimezone(value),
    { message: 'Unknown time zone' },
  ),
})

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { timezone } = await readValidatedBody(event, timezoneSchema.parse)

  const { account } = createSessionClient(event)
  await account.updatePrefs({
    prefs: {
      ...event.context.user.prefs,
      timezone,
    },
  })

  return { ok: true, timezone }
})
