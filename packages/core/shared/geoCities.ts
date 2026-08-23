import type { GeoCitySuggestion } from './types/geo'

/**
 * ORTS-VERZEICHNIS — die PURE Hälfte (Mitglieder-Karte, Etappe 1, 2026-08-23).
 *
 * Hier steht alles, was ohne Datei, ohne Request und ohne Appwrite auskommt:
 * Zeile lesen, Suchbegriff normalisieren, Treffer ranken. Die unreine Hälfte
 * (Datei laden, im Prozess halten, fail-soft warnen) liegt in
 * server/utils/geoCities.ts.
 *
 * WARUM GETRENNT: die Rangfolge ist die einzige Stelle, an der man sich hier
 * irren kann („Berlin" muss Berlin/DE heißen und nicht Berlin/Wisconsin), und
 * eine Regel, die eine 10-MB-Datei und einen H3Event braucht, wird nicht
 * getestet. Dasselbe Muster wie presencePriority.ts oder themeSelection.ts.
 *
 * DIE QUELLE ist `geonames-cities.tsv` (erzeugt von
 * scripts/geo/build-geonames-cities.mjs): eine Zeile je Ort, sieben
 * Tab-getrennte Felder, **nach Einwohnerzahl absteigend sortiert**. Diese
 * Sortierung IST die Rangfolge — deshalb steht die Einwohnerzahl nicht im
 * Eintrag: sie wäre eine zweite Kopie derselben Aussage, die man beim nächsten
 * Datei-Tausch vergisst mitzupflegen.
 *
 * LIZENZ: GeoNames, CC BY 4.0 — die Nennung ist Pflicht, WO Vorschläge
 * gezeigt werden (GeoCityPicker.vue), nicht hier.
 */

/** Feld-Reihenfolge der TSV. Ändert sich sie, ändert sich diese Datei. */
const FIELD_COUNT = 7

/** Ein eingelesener Ort — die Form, die im Speicher gehalten wird. */
export interface GeoCityEntry {
  /** Anzeigename in Original-Schreibweise („Zürich"). */
  name: string
  /** Region/Bundesland; '' wenn das Verzeichnis keine kennt. */
  region: string
  /** ISO-Ländercode, KLEIN (direkt für `flagIcon()`). */
  countryCode: string
  lat: number
  lon: number
  /** `name`, klein und ohne Diakritika — die Vergleichsform. */
  search: string
  /**
   * `asciiName`, ebenso normalisiert. Sie steht NEBEN `search`, weil beide
   * verschiedene Wege zum selben Ort sind: „Zürich" wird durch das Entfernen
   * der Diakritika zu „zurich", der ASCII-Name des Verzeichnisses lautet
   * aber „Zuerich" (deutsche Umschrift). Wer „zue…" tippt, findet den Ort nur
   * über dieses Feld; wer „zur…" tippt, nur über das andere.
   *
   * Sind beide gleich, trägt dieses Feld dieselbe Zeichenkette — die 170.000
   * Einträge sollen nicht doppelt so viele Strings halten wie nötig.
   */
  searchAscii: string
}

/**
 * Vergleichsform eines Suchbegriffs oder Ortsnamens: klein, ohne Rand,
 * ohne Diakritika.
 *
 * NFD zerlegt „ü" in „u" + kombinierendes Trema, der Bereich U+0300–U+036F
 * wirft die Zeichen weg. Damit findet „zurich" das „Zürich" der Datei — ohne
 * eine gepflegte Ersetzungstabelle, die für jede Sprache anders aussähe.
 * Was NFD nicht zerlegt (ß, ø, đ), fängt der ASCII-Name des Verzeichnisses.
 */
export function normalizeCityQuery(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Label eines Ortes: „Ort, Region" — ohne Region nur der Ort.
 *
 * Das Land steht bewusst NICHT im Text: es reist als `countryCode` mit und
 * wird als Flagge gezeigt. Zweimal dieselbe Angabe (Flagge UND „, Deutschland")
 * macht die Zeile länger, nicht klarer.
 */
export function cityLabel(name: string, region: string): string {
  return region ? `${name}, ${region}` : name
}

/**
 * EINE TSV-Zeile → Eintrag, oder `null` für alles, was nicht verwertbar ist
 * (zu wenige Felder, kein Name, unbrauchbare Koordinaten).
 *
 * Fail-soft ist hier Absicht: eine kaputte Zeile in einer 170.000-Zeilen-Datei
 * darf die Suche nicht abschalten, sie fällt einfach weg.
 */
export function parseCityLine(line: string): GeoCityEntry | null {
  const fields = line.split('\t')
  if (fields.length < FIELD_COUNT) return null

  const name = (fields[0] ?? '').trim()
  const asciiName = (fields[1] ?? '').trim()
  const region = (fields[2] ?? '').trim()
  const countryCode = (fields[3] ?? '').trim().toLowerCase()
  /**
   * `Number('')` ist 0 — und 0/0 ist ein GÜLTIGER Punkt im Golf von Guinea.
   * Ein leeres Koordinatenfeld würde ohne diese Prüfung also nicht auffallen,
   * sondern jeden solchen Ort auf „Null Island" setzen. Deshalb erst der
   * Text, dann die Zahl.
   */
  const rawLat = (fields[4] ?? '').trim()
  const rawLon = (fields[5] ?? '').trim()
  const lat = Number(rawLat)
  const lon = Number(rawLon)
  if (!name || !rawLat || !rawLon || !Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const search = normalizeCityQuery(name)
  const ascii = normalizeCityQuery(asciiName)
  return {
    name,
    region,
    countryCode,
    lat,
    lon,
    search,
    // Gleiche Zeichenkette wiederverwenden statt eine zweite anzulegen.
    searchAscii: ascii === search ? search : ascii,
  }
}

/**
 * Ganze Datei → Einträge, in DATEI-Reihenfolge (= Einwohner absteigend).
 * Die Reihenfolge ist der Rang; sie wird hier nie umsortiert.
 */
export function parseCityTable(text: string): GeoCityEntry[] {
  const entries: GeoCityEntry[] = []
  for (const line of text.split('\n')) {
    if (!line) continue
    const entry = parseCityLine(line)
    if (entry) entries.push(entry)
  }
  return entries
}

/** Eintrag → Vorschlag (die Form, die den Server verlässt). */
function toSuggestion(entry: GeoCityEntry): GeoCitySuggestion {
  return {
    label: cityLabel(entry.name, entry.region),
    countryCode: entry.countryCode,
    lat: entry.lat,
    lon: entry.lon,
  }
}

/**
 * Ein Ländercode, wie ihn der Filter erwartet: klein, genau zwei Buchstaben.
 * Alles andere (leer, Zahlen, „deutschland") ergibt '' — und '' heißt überall
 * „kein Filter", nie „keine Treffer": ein Tippfehler soll die Suche weiten,
 * nicht abwürgen.
 */
export function normalizeCountryCode(value: string): string {
  const code = value.trim().toLowerCase()
  return /^[a-z]{2}$/.test(code) ? code : ''
}

/**
 * Die Ländercodes, die im Verzeichnis WIRKLICH vorkommen — einmal beim Laden
 * gebaut, alphabetisch.
 *
 * Sie sind die Auswahlliste des optionalen Länder-Filters. Bewusst NUR Codes:
 * die ANZEIGENAMEN löst der Browser auf (`Intl.DisplayNames`), in seiner
 * Sprache und ohne dass wir 250 Ländernamen in zwei Sprachen pflegen — eine
 * Liste, die niemand aktualisiert, wenn sich ein Land umbenennt.
 */
export function collectCountryCodes(entries: readonly GeoCityEntry[]): string[] {
  const codes = new Set<string>()
  for (const entry of entries) {
    if (entry.countryCode) codes.add(entry.countryCode)
  }
  return [...codes].sort()
}

/** Optionen des Rankings. `country` = '' bzw. weggelassen heißt „alle Länder". */
export interface RankCitiesOptions {
  limit: number
  country?: string
}

/**
 * Die Rangfolge — ZWEI Gruppen, innerhalb jeder Gruppe die Datei-Reihenfolge.
 *
 *  1. ANFANGS-Treffer (Name ODER ASCII-Name beginnt mit dem Begriff).
 *  2. ENTHALTEN-Treffer, nur solange Plätze frei bleiben.
 *
 * WARUM ZWEI GRUPPEN UND NICHT EIN `includes`: wer „berl" tippt, meint Berlin
 * und nicht „Puerto Berlín". Und warum INNERHALB der Gruppe nicht noch nach
 * Ähnlichkeit sortiert wird: die Datei ist bereits nach Einwohnerzahl
 * sortiert, damit gewinnt Berlin/DE (3,4 Mio) gegen Berlin/Wisconsin (5.500) —
 * das ist die Reihenfolge, die ein Mensch erwartet, und sie kostet nichts.
 *
 * DER LÄNDER-FILTER GREIFT VOR DEM RANKING, nicht danach: nachträglich
 * gefiltert kämen von acht Treffern womöglich null durch, obwohl das Land
 * hundert Orte hat. Er ist OPTIONAL und bleibt es — die Suche allein ist der
 * Hauptweg; das Land hilft genau dort, wo ein grosser Namensvetter einen
 * kleinen Ort verdeckt (Berlin/Wisconsin).
 *
 * Sind `limit` Anfangs-Treffer beisammen, wird die Schleife verlassen: die
 * Enthalten-Treffer könnten dann ohnehin keinen Platz mehr bekommen.
 */
export function rankCities(entries: readonly GeoCityEntry[], query: string, options: RankCitiesOptions): GeoCitySuggestion[] {
  const { limit } = options
  const needle = normalizeCityQuery(query)
  if (!needle || limit <= 0) return []
  const country = normalizeCountryCode(options.country ?? '')

  const prefix: GeoCityEntry[] = []
  const contains: GeoCityEntry[] = []
  for (const entry of entries) {
    if (country && entry.countryCode !== country) continue
    if (entry.search.startsWith(needle) || entry.searchAscii.startsWith(needle)) {
      prefix.push(entry)
      if (prefix.length >= limit) break
    }
    else if (contains.length < limit && (entry.search.includes(needle) || entry.searchAscii.includes(needle))) {
      contains.push(entry)
    }
  }

  return [...prefix, ...contains].slice(0, limit).map(toSuggestion)
}
