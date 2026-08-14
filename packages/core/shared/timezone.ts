/**
 * ZEITZONE DES KONTOS (U15 Teil 5) — EINE pure Regel für beide Seiten.
 *
 * Abgelegt wird sie als `prefs.timezone` in den Appwrite-Account-Prefs (wie
 * `emailNotifications`/`emailLocale`) — KEINE Tabelle, keine Migration.
 *
 * `''` heißt „automatisch": die Anzeige folgt der Laufzeit-Zone, also genau dem
 * Verhalten von vor dieser Einstellung. Das ist der Default und bleibt es —
 * ein geratener Wert wäre schlechter als gar keiner.
 *
 * ZWEI HÄRTEN, EIN ZWECK:
 *  - `assertSupportedTimezone` (Schreiben) ist FAIL-CLOSED: was nicht in der
 *    Zonenliste der Laufzeit steht, wird abgelehnt (400). Sonst landete ein
 *    Tippfehler in den Prefs und ließe `Intl.DateTimeFormat` bei JEDER
 *    späteren Anzeige eine RangeError werfen — ein Feld, das die halbe
 *    Oberfläche lahmlegt.
 *  - `normalizeTimezonePref` (Lesen) ist FAIL-SOFT: ein Wert, den diese
 *    Laufzeit nicht (mehr) kennt, wird zu `''`. Die tzdb streicht Zonen; eine
 *    alte Wahl darf ein Dashboard nicht weiß machen.
 */

/** Kein eigener Wunsch — Anzeige in der Zone der Laufzeit (Browser). */
export const AUTOMATIC_TIMEZONE = ''

/**
 * `Intl.supportedValuesOf` ist seit ES2022 spezifiziert (Node 22 und alle
 * aktuellen Browser haben es). Der Zugriff bleibt trotzdem defensiv getypt,
 * damit eine Laufzeit ohne die Funktion nicht am Typ, sondern am Rückfall
 * unten scheitert.
 */
type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: 'timeZone') => string[]
}

let cachedZones: string[] | null = null
let cachedLookup: Set<string> | null = null

/**
 * Alle Zonen dieser Laufzeit, alphabetisch (`Intl.supportedValuesOf` liefert
 * sie bereits sortiert). Einmal berechnet — die Liste ist prozessweit konstant.
 */
export function supportedTimezones(): string[] {
  if (cachedZones) return cachedZones
  const supportedValuesOf = (Intl as IntlWithSupportedValues).supportedValuesOf
  cachedZones = supportedValuesOf ? supportedValuesOf.call(Intl, 'timeZone') : []
  return cachedZones
}

/**
 * Kennt diese Laufzeit die Zone? Erlaubnisliste, solange es eine gibt; ohne sie
 * (uralte Laufzeit) fragt der Rückfall `Intl` direkt — sonst wäre die Antwort
 * pauschal „nein" und die Einstellung unbenutzbar. Der Rückfall lässt zusätzlich
 * ALIASSE durch (`US/Pacific`), die `supportedValuesOf` bewusst weglässt; das
 * ist der Preis dafür, in einer solchen Laufzeit überhaupt zu funktionieren.
 */
export function isSupportedTimezone(value: string): boolean {
  if (!value) return false
  const zones = supportedTimezones()
  if (zones.length > 0) {
    if (!cachedLookup) cachedLookup = new Set(zones)
    return cachedLookup.has(value)
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  }
  catch {
    return false
  }
}

/** Gespeicherten Wert lesen: unbekannt oder kein String ⇒ automatisch. */
export function normalizeTimezonePref(value: unknown): string {
  return typeof value === 'string' && isSupportedTimezone(value) ? value : AUTOMATIC_TIMEZONE
}

/** Der Regionsteil eines IANA-Namens — `Europe/Berlin` ⇒ `Europe`. */
export function timezoneRegion(zone: string): string {
  const slash = zone.indexOf('/')
  return slash === -1 ? zone : zone.slice(0, slash)
}

/**
 * Nach Region gruppiert, Reihenfolge der Eingabe erhalten (also alphabetisch).
 * Reine Rechnung — die Auswahlliste in der Oberfläche baut nur noch Labels
 * darum. 418 Zonen in einer flachen Liste findet niemand.
 */
export function groupTimezonesByRegion(zones: string[]): Array<{ region: string, zones: string[] }> {
  const groups: Array<{ region: string, zones: string[] }> = []
  const index = new Map<string, { region: string, zones: string[] }>()

  for (const zone of zones) {
    const region = timezoneRegion(zone)
    let group = index.get(region)
    if (!group) {
      group = { region, zones: [] }
      index.set(region, group)
      groups.push(group)
    }
    group.zones.push(zone)
  }

  return groups
}
