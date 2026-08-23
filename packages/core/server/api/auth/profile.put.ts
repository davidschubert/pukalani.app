import { AppwriteException } from 'node-appwrite'
import { createSessionClient, createAdminClient } from '../../lib/appwrite'
import { profileSchema } from '../../../schemas/profile'
import {
  isProfileLocationKey,
  PROFILE_LOCATION_LABEL_KEY,
  PROFILE_LOCATION_LAT_KEY,
  PROFILE_LOCATION_LON_KEY,
  readProfileLocation,
  sameProfileLocation,
} from '../../../shared/profileLocation'

// avatarFileId (URL→fileId) kommt aus server/utils/avatarFile.ts (Auto-Import)
// — geteilt mit der GDPR-Löschung.

/**
 * Profil-Update: Name + prefs (bio/avatarUrl) als der User selbst (SessionClient).
 * Die Telefonnummer landet im NATIVEN Appwrite-Phone-Feld via Admin-API
 * (account.updatePhone würde Passwort + SMS-Verifikation verlangen — unpassend
 * für unsere passwortlosen OTP-User; der AdminClient setzt es ohne beides).
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { name, bio, phone, avatarUrl, location } = await readValidatedBody(event, profileSchema.parse)
  const { account } = createSessionClient(event)

  if (name !== event.context.user.name) {
    await account.updateName({ name })
  }

  // Natives Phone-Feld nur bei Änderung anfassen. Leerstring löscht es (von Appwrite
  // 1.9.0 verifiziert). Eindeutigkeit ist erzwungen → 409 sauber als Konflikt melden.
  const nextPhone = phone ?? ''
  if (nextPhone !== (event.context.user.phone ?? '')) {
    const { users } = createAdminClient(event)
    try {
      await users.updatePhone({ userId: event.context.user.$id, number: nextPhone })
    }
    catch (error) {
      if (error instanceof AppwriteException && error.code === 409) {
        throw createError({ status: 409, statusText: 'Phone already in use', data: { code: 'phone_taken' } })
      }
      // Keine rohe AppwriteException an den Client leaken
      throw createError({ status: 400, statusText: 'Could not update phone number' })
    }
  }

  const nextAvatarUrl = avatarUrl ?? ''

  /**
   * `updatePrefs` ERSETZT das ganze Fach — der Spread ist deshalb kein
   * Komfort, sondern die Bedingung dafür, dass Zeitzone, Mail-Einstellungen
   * und alles andere ein Profil-Speichern überleben.
   */
  const previousPrefs = (event.context.user.prefs ?? {}) as Record<string, unknown>

  /**
   * DREI ZUSTÄNDE, NICHT ZWEI (Standort, 2026-08-23):
   *  - Feld fehlt (`undefined`) ⇒ NICHT ANGEFASST. Das ist der Normalfall für
   *    jeden Aufrufer, der den Standort gar nicht kennt (ältere Clients, ein
   *    Formular, das nur den Namen schickt) — ohne diesen Fall nähme jedes
   *    Speichern den Standort still mit weg.
   *  - `null` ⇒ LÖSCHEN. Die Schlüssel verschwinden, statt auf '' zu stehen:
   *    „nicht angegeben" ist die ABWESENHEIT, und `readProfileLocation`
   *    fragt genau danach.
   *  - Objekt ⇒ alle drei Werte setzen (das Schema lässt nichts Halbes durch).
   *
   * Gelöscht wird durch WEGLASSEN beim Umkopieren, nicht mit `delete` —
   * dasselbe Ergebnis, ohne einen dynamisch berechneten Schlüssel zu
   * entfernen (ESLint verbietet das aus gutem Grund: was so verschwindet,
   * sieht man an keiner Stelle mehr).
   */
  const keepLocation = location === undefined
  const nextPrefs: Record<string, unknown> = Object.fromEntries(
    Object.entries(previousPrefs).filter(([key]) => keepLocation || !isProfileLocationKey(key)),
  )
  nextPrefs.bio = bio ?? ''
  nextPrefs.avatarUrl = nextAvatarUrl

  const previousLocation = readProfileLocation(previousPrefs)
  if (location) {
    nextPrefs[PROFILE_LOCATION_LABEL_KEY] = location.label
    nextPrefs[PROFILE_LOCATION_LAT_KEY] = location.lat
    nextPrefs[PROFILE_LOCATION_LON_KEY] = location.lon
  }

  await account.updatePrefs({ prefs: nextPrefs })

  // Aktivitätsprotokoll (Admin-Sicht): WELCHE Felder sich geändert haben —
  // bewusst nur Feldnamen, nie Werte (Datenminimierung). Best-effort.
  const changedFields = [
    ...(name !== event.context.user.name ? ['name'] : []),
    ...(nextPhone !== (event.context.user.phone ?? '') ? ['phone'] : []),
    ...((bio ?? '') !== (event.context.user.prefs?.bio ?? '') ? ['bio'] : []),
    ...(nextAvatarUrl !== (event.context.user.prefs?.avatarUrl ?? '') ? ['avatar'] : []),
    // Wieder nur der FELDNAME, nie der Ort selbst (Datenminimierung) — ein
    // Protokoll, das „Hamburg" mitschreibt, ist eine zweite Standort-Ablage
    // mit eigener Aufbewahrungsfrist.
    ...(location !== undefined && !sameProfileLocation(previousLocation, location) ? ['location'] : []),
  ]
  if (changedFields.length > 0) {
    await logAuthEvent(event, 'user.profile_updated', {
      userId: event.context.user.$id,
      name,
      fields: changedFields,
    })
  }

  // Vorheriges Avatar-File aufräumen, sobald die URL wechselt (kein Storage-Müll).
  // Best-effort: läuft als der User (eigene update/delete-Rechte), Fehler ignorieren.
  const bucketId = useRuntimeConfig(event).public.appwriteAvatarsBucket
  const previousId = avatarFileId(event.context.user.prefs?.avatarUrl, bucketId)
  if (previousId && previousId !== avatarFileId(nextAvatarUrl, bucketId)) {
    const { storage } = createSessionClient(event)
    try {
      await storage.deleteFile({ bucketId, fileId: previousId })
    }
    catch {
      // Datei evtl. schon weg / fremd — egal
    }
  }

  return { ok: true }
})
