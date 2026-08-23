import type { ProfileLocation } from './types/geo'

/**
 * DER STANDORT IM KONTO — wie er in `prefs` liegt und wie man ihn wieder
 * herausholt (Mitglieder-Karte, Etappe 1, 2026-08-23).
 *
 * WARUM prefs UND NICHT EINE SPALTE: der Standort gehört der PUKALANI-ID, nicht
 * einer Community — er gilt überall, wie Name, Bio und Zeitzone, die genau
 * hier liegen. Eine eigene Tabelle brauchte eine Migration auf JEDER Instanz
 * für drei Werte, die immer zusammen gelesen werden.
 *
 * WARUM DREI FLACHE SCHLÜSSEL statt eines verschachtelten Objekts: `prefs` ist
 * bei Appwrite ein flaches Key/Value-Fach, und `updatePrefs` ERSETZT den
 * ganzen Inhalt. Flache Schlüssel lassen sich mit einem Spread erhalten und
 * einzeln löschen; ein Objekt darin wäre eine zweite Ebene, an der jede
 * Teil-Aktualisierung stolpert.
 *
 * DIESE DATEI IST DIE EINZIGE STELLE, DIE DIE SCHLÜSSELNAMEN KENNT. Sonst
 * schreibt die Route `locationLat` und das Formular liest `locationLatitude` —
 * ein Tippfehler, den niemand bemerkt, weil ein leeres Feld genau so aussieht
 * wie „nichts angegeben".
 */

/** Die drei Schlüssel in `prefs`. */
export const PROFILE_LOCATION_LABEL_KEY = 'locationLabel'
export const PROFILE_LOCATION_LAT_KEY = 'locationLat'
export const PROFILE_LOCATION_LON_KEY = 'locationLon'

/** Alle drei zusammen — zum Löschen und für Prüfungen. */
export const PROFILE_LOCATION_KEYS = [
  PROFILE_LOCATION_LABEL_KEY,
  PROFILE_LOCATION_LAT_KEY,
  PROFILE_LOCATION_LON_KEY,
] as const

/** Gehört dieser prefs-Schlüssel zum Standort? */
export function isProfileLocationKey(key: string): boolean {
  return (PROFILE_LOCATION_KEYS as readonly string[]).includes(key)
}

/**
 * Standort aus `prefs` lesen — `null`, sobald auch nur ein Teil fehlt oder
 * nicht die erwartete Sorte hat.
 *
 * ALLES ODER NICHTS ist hier dieselbe Regel wie beim Schreiben: ein Label ohne
 * Koordinaten wäre auf der Karte unsichtbar, Koordinaten ohne Label ein Punkt
 * ohne Namen. `prefs` ist ein offenes Fach — was darin steht, hat niemand
 * typgeprüft, deshalb wird hier geprüft und nicht behauptet.
 */
export function readProfileLocation(prefs: Record<string, unknown> | undefined | null): ProfileLocation | null {
  if (!prefs) return null

  const label = prefs[PROFILE_LOCATION_LABEL_KEY]
  const lat = prefs[PROFILE_LOCATION_LAT_KEY]
  const lon = prefs[PROFILE_LOCATION_LON_KEY]
  if (typeof label !== 'string' || !label) return null
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null
  if (typeof lon !== 'number' || !Number.isFinite(lon)) return null

  return { label, lat, lon }
}

/**
 * Sind zwei Standorte (oder zwei Abwesenheiten) dasselbe?
 *
 * Gebraucht für das Aktivitätsprotokoll: dort soll `location` nur stehen, wenn
 * sich wirklich etwas geändert hat — ein Speichern ohne Änderung darf keine
 * Änderung melden (dieselbe Regel wie `bodyToSave` bei Beiträgen).
 */
export function sameProfileLocation(a: ProfileLocation | null, b: ProfileLocation | null): boolean {
  if (!a || !b) return a === b
  return a.label === b.label && a.lat === b.lat && a.lon === b.lon
}
