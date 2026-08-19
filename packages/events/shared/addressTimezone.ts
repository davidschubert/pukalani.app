/**
 * ZEIGT DIE ADRESSE IN EIN ANDERES LAND? — pure Regel für EINEN Vorschlag.
 *
 * WARUM VORSCHLAGEN STATT ABLEITEN (F59, Davids Entscheidung 2026-08-17): das
 * Formular stempelt heute still die Heimat-Zone der Community auf jeden Termin
 * (control-038). Für den Stammtisch um die Ecke ist das richtig, für das
 * Barcamp in Tokio ist es falsch — und zwar UNSICHTBAR falsch: die Zeile sieht
 * heil aus, nur die Uhrzeit meint etwas anderes, als der Organisator dachte.
 * Trotzdem wird hier NICHTS still abgeleitet. Eine Adresse ist Freitext, und
 * Freitext lügt: „Berliner Str. 5, Tokyo Haus" ist eine Adresse in Deutschland.
 * Wer die Zone tauscht, verschiebt einen bereits eingetragenen Termin um
 * Stunden — das darf nur der Mensch entscheiden, der den Ort kennt. Also:
 * Vorschlag, ein Klick, fertig.
 *
 * KEIN GEOCODING, KEIN DIENST. Ein externer Aufruf je Tastendruck kostet
 * Latenz, ein Konto, einen Schlüssel und schickt die Anschrift eines Kunden zu
 * einem Dritten — für eine Frage, die eine Tabelle mit Ländernamen beantwortet.
 *
 * FAIL-CLOSED: im Zweifel KEIN Vorschlag. Ein ausbleibender Vorschlag kostet
 * einen manuellen Blick, ein falscher verschiebt einen Termin. Daraus folgen
 * die drei Auslassungen, die man nicht „vervollständigen" darf:
 *
 *  1. MEHR-ZONEN-LÄNDER FEHLEN ABSICHTLICH — USA, Kanada, Australien,
 *     Brasilien, Mexiko, Russland, Indonesien, Chile, Kasachstan. Aus „USA"
 *     folgt keine Zone: New York und Los Angeles trennen drei Stunden. Nur
 *     Länder, deren Bevölkerung praktisch vollständig in EINER Zone lebt,
 *     stehen in der Tabelle.
 *  2. MEHRDEUTIGE NAMEN FEHLEN — kein „Georgia" (Land und US-Bundesstaat),
 *     kein „Island" (deutscher Name Islands, im Englischen ein Allerweltswort:
 *     „Long Island"), kein „England"/„Wales" („New England", „New South
 *     Wales"), kein „Korea" allein.
 *  3. KEINE ZWEI-BUCHSTABEN-CODES UND KEINE STÄDTE — „AT" steht in jeder
 *     zweiten englischen Zeile, „Paris" auch in Texas.
 *  4. LÄNDER MIT WANDERNDEM ZONEN-NAMEN FEHLEN (beim Bau gemessen) — Ukraine,
 *     Indien, Vietnam, Argentinien. Ihre Zone heißt je nach Laufzeit anders:
 *     Node 22 (ICU 77) kennt NUR `Europe/Kiev`, `Asia/Calcutta`, `Asia/Saigon`,
 *     `America/Buenos_Aires`, aktuelle Browser nennen dieselben Zonen
 *     `Europe/Kyiv`, `Asia/Kolkata`, `Asia/Ho_Chi_Minh`,
 *     `America/Argentina/Buenos_Aires` — `Intl.supportedValuesOf` liefert immer
 *     nur EINE Schreibweise, die Aliasse fehlen. Beide Enden validieren aber
 *     gegen `isSupportedTimezone` (schemas/event.ts): welchen Namen man auch
 *     wählte, eine der beiden Seiten lehnte ihn ab — der Klick auf „Übernehmen"
 *     endete dann im 400 statt in einer Uhrzeit. Ein Vorschlag, den man nicht
 *     speichern kann, ist schlimmer als keiner. Der Invariantentest
 *     (tests/address-timezone.test.ts) hält die Tabelle an dieser Prüfung fest.
 *
 * Und: matchen ZWEI VERSCHIEDENE Länder, gibt es keinen Vorschlag. Zwei Länder
 * in einer Zeile heißt, dass wir die Adresse nicht verstanden haben.
 */

export interface CountryZoneEntry {
  /** IANA-Zone, in der praktisch die gesamte Bevölkerung des Landes lebt */
  zone: string
  /** Anzeigename für den Vorschlag — die Regel kennt keine i18n-Schlüssel */
  country: { de: string, en: string }
  /**
   * Erkannte Schreibweisen: deutsch, englisch und gebräuchliche Eigennamen.
   * Diakritika und Groß-/Kleinschreibung sind egal (normalisiert wird beides),
   * deshalb steht jeder Name nur EINMAL in seiner natürlichen Form.
   */
  names: string[]
}

/**
 * Kuratiert, nicht generiert: eine vollständige ISO-Länderliste brächte genau
 * die Fälle mit, die oben ausgeschlossen sind.
 */
export const COUNTRY_ZONES: readonly CountryZoneEntry[] = [
  // ---- Europa ----
  { zone: 'Europe/Berlin', country: { de: 'Deutschland', en: 'Germany' }, names: ['Deutschland', 'Germany', 'Allemagne'] },
  { zone: 'Europe/Vienna', country: { de: 'Österreich', en: 'Austria' }, names: ['Österreich', 'Austria'] },
  { zone: 'Europe/Zurich', country: { de: 'Schweiz', en: 'Switzerland' }, names: ['Schweiz', 'Switzerland', 'Suisse', 'Svizzera'] },
  { zone: 'Europe/Paris', country: { de: 'Frankreich', en: 'France' }, names: ['Frankreich', 'France'] },
  { zone: 'Europe/Rome', country: { de: 'Italien', en: 'Italy' }, names: ['Italien', 'Italy', 'Italia'] },
  { zone: 'Europe/Madrid', country: { de: 'Spanien', en: 'Spain' }, names: ['Spanien', 'Spain', 'España'] },
  { zone: 'Europe/Lisbon', country: { de: 'Portugal', en: 'Portugal' }, names: ['Portugal'] },
  { zone: 'Europe/Amsterdam', country: { de: 'Niederlande', en: 'Netherlands' }, names: ['Niederlande', 'Netherlands', 'Nederland'] },
  { zone: 'Europe/Brussels', country: { de: 'Belgien', en: 'Belgium' }, names: ['Belgien', 'Belgium', 'Belgique', 'België'] },
  { zone: 'Europe/Luxembourg', country: { de: 'Luxemburg', en: 'Luxembourg' }, names: ['Luxemburg', 'Luxembourg'] },
  { zone: 'Europe/Copenhagen', country: { de: 'Dänemark', en: 'Denmark' }, names: ['Dänemark', 'Denmark', 'Danmark'] },
  { zone: 'Europe/Stockholm', country: { de: 'Schweden', en: 'Sweden' }, names: ['Schweden', 'Sweden', 'Sverige'] },
  { zone: 'Europe/Oslo', country: { de: 'Norwegen', en: 'Norway' }, names: ['Norwegen', 'Norway', 'Norge'] },
  { zone: 'Europe/Helsinki', country: { de: 'Finnland', en: 'Finland' }, names: ['Finnland', 'Finland', 'Suomi'] },
  { zone: 'Europe/Warsaw', country: { de: 'Polen', en: 'Poland' }, names: ['Polen', 'Poland', 'Polska'] },
  { zone: 'Europe/Prague', country: { de: 'Tschechien', en: 'Czechia' }, names: ['Tschechien', 'Czechia', 'Czech Republic', 'Tschechische Republik', 'Česko'] },
  { zone: 'Europe/Bratislava', country: { de: 'Slowakei', en: 'Slovakia' }, names: ['Slowakei', 'Slovakia', 'Slovensko'] },
  { zone: 'Europe/Budapest', country: { de: 'Ungarn', en: 'Hungary' }, names: ['Ungarn', 'Hungary', 'Magyarország'] },
  { zone: 'Europe/Ljubljana', country: { de: 'Slowenien', en: 'Slovenia' }, names: ['Slowenien', 'Slovenia', 'Slovenija'] },
  { zone: 'Europe/Zagreb', country: { de: 'Kroatien', en: 'Croatia' }, names: ['Kroatien', 'Croatia', 'Hrvatska'] },
  { zone: 'Europe/Athens', country: { de: 'Griechenland', en: 'Greece' }, names: ['Griechenland', 'Greece', 'Hellas'] },
  { zone: 'Europe/Dublin', country: { de: 'Irland', en: 'Ireland' }, names: ['Irland', 'Ireland', 'Éire'] },
  {
    zone: 'Europe/London',
    country: { de: 'Vereinigtes Königreich', en: 'United Kingdom' },
    // England/Schottland/Wales fehlen bewusst (s. Kopf: „New England",
    // „New South Wales") — hier stehen nur Namen des GANZEN Landes.
    names: ['Vereinigtes Königreich', 'United Kingdom', 'Großbritannien', 'Great Britain'],
  },
  // Nur der englische Name: „Island" (deutsch) und „Ísland" normalisieren beide
  // zu `island` und träfen „Long Island" — Fail-closed schlägt Vollständigkeit.
  { zone: 'Atlantic/Reykjavik', country: { de: 'Island', en: 'Iceland' }, names: ['Iceland'] },
  { zone: 'Europe/Tallinn', country: { de: 'Estland', en: 'Estonia' }, names: ['Estland', 'Estonia', 'Eesti'] },
  { zone: 'Europe/Riga', country: { de: 'Lettland', en: 'Latvia' }, names: ['Lettland', 'Latvia', 'Latvija'] },
  { zone: 'Europe/Vilnius', country: { de: 'Litauen', en: 'Lithuania' }, names: ['Litauen', 'Lithuania', 'Lietuva'] },
  { zone: 'Europe/Bucharest', country: { de: 'Rumänien', en: 'Romania' }, names: ['Rumänien', 'Romania'] },
  { zone: 'Europe/Sofia', country: { de: 'Bulgarien', en: 'Bulgaria' }, names: ['Bulgarien', 'Bulgaria'] },
  { zone: 'Europe/Belgrade', country: { de: 'Serbien', en: 'Serbia' }, names: ['Serbien', 'Serbia', 'Srbija'] },
  { zone: 'Europe/Malta', country: { de: 'Malta', en: 'Malta' }, names: ['Malta'] },
  { zone: 'Asia/Nicosia', country: { de: 'Zypern', en: 'Cyprus' }, names: ['Zypern', 'Cyprus', 'Kypros'] },
  { zone: 'Europe/Istanbul', country: { de: 'Türkei', en: 'Türkiye' }, names: ['Türkei', 'Türkiye', 'Turkey'] },

  // ---- Asien / Naher Osten ----
  { zone: 'Asia/Tokyo', country: { de: 'Japan', en: 'Japan' }, names: ['Japan', 'Nippon'] },
  // „Korea" allein fehlt bewusst — das gibt es zweimal.
  { zone: 'Asia/Seoul', country: { de: 'Südkorea', en: 'South Korea' }, names: ['Südkorea', 'South Korea', 'Republic of Korea'] },
  { zone: 'Asia/Shanghai', country: { de: 'China', en: 'China' }, names: ['China', 'Volksrepublik China'] },
  { zone: 'Asia/Singapore', country: { de: 'Singapur', en: 'Singapore' }, names: ['Singapur', 'Singapore'] },
  { zone: 'Asia/Bangkok', country: { de: 'Thailand', en: 'Thailand' }, names: ['Thailand'] },
  {
    zone: 'Asia/Dubai',
    country: { de: 'Vereinigte Arabische Emirate', en: 'United Arab Emirates' },
    names: ['Vereinigte Arabische Emirate', 'United Arab Emirates'],
  },
  { zone: 'Asia/Jerusalem', country: { de: 'Israel', en: 'Israel' }, names: ['Israel'] },

  // ---- Afrika ----
  { zone: 'Africa/Cairo', country: { de: 'Ägypten', en: 'Egypt' }, names: ['Ägypten', 'Egypt'] },
  { zone: 'Africa/Johannesburg', country: { de: 'Südafrika', en: 'South Africa' }, names: ['Südafrika', 'South Africa'] },
  { zone: 'Africa/Nairobi', country: { de: 'Kenia', en: 'Kenya' }, names: ['Kenia', 'Kenya'] },
  { zone: 'Africa/Casablanca', country: { de: 'Marokko', en: 'Morocco' }, names: ['Marokko', 'Morocco', 'Maroc'] },

  // ---- Ozeanien / Südamerika ----
  { zone: 'Pacific/Auckland', country: { de: 'Neuseeland', en: 'New Zealand' }, names: ['Neuseeland', 'New Zealand'] },
  // „Columbia" (US-Schreibweise, District of Columbia) ist ein ANDERES Wort und
  // trifft deshalb nicht.
  { zone: 'America/Bogota', country: { de: 'Kolumbien', en: 'Colombia' }, names: ['Kolumbien', 'Colombia'] },
  { zone: 'America/Lima', country: { de: 'Peru', en: 'Peru' }, names: ['Peru'] },
  { zone: 'America/Montevideo', country: { de: 'Uruguay', en: 'Uruguay' }, names: ['Uruguay'] },
]

/** Kürzester Name der Tabelle — kürzer wird gar nicht erst gesucht. */
const MIN_NAME_LENGTH = 4

/**
 * Vergleichsform: klein, ohne Diakritika, Leerraum auf EIN Leerzeichen.
 *
 * `ß` wird VOR der Zerlegung zu `ss` — NFD zerlegt es nicht, und
 * „Großbritannien" soll auch als „Grossbritannien" gefunden werden.
 */
export function normalizeForAddressMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Buchstabe oder Ziffer? — die Wortgrenze wird SELBST geprüft, weil `\b` auf
 * Nicht-ASCII nicht verlässlich greift und ein Treffer mitten in einem Wort
 * („Chinatown" ⇒ China) genau der falsche Vorschlag wäre.
 */
function isWordChar(char: string | undefined): boolean {
  return !!char && /[\p{L}\p{N}]/u.test(char)
}

/** Kommt `needle` als GANZES Wort in `haystack` vor? (beides normalisiert) */
function containsWord(haystack: string, needle: string): boolean {
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at === -1) return false
    const before = at === 0 ? undefined : haystack[at - 1]
    const after = haystack[at + needle.length]
    if (!isWordChar(before) && !isWordChar(after)) return true
    from = at + 1
  }
}

export interface AddressTimezoneSuggestion {
  zone: string
  country: { de: string, en: string }
}

/**
 * Vorschlag für die Zeitzone einer Freitext-Adresse — oder `null`.
 *
 * `null` heißt IMMER „kein Vorschlag", nie „Heimat-Zone": die Entscheidung, was
 * ohne Treffer gilt, gehört dem Formular, nicht dieser Regel.
 */
export function suggestTimezoneForAddress(address: string): AddressTimezoneSuggestion | null {
  const haystack = normalizeForAddressMatch(address)
  if (haystack.length < MIN_NAME_LENGTH) return null

  let hit: CountryZoneEntry | null = null
  for (const entry of COUNTRY_ZONES) {
    if (!entry.names.some(name => containsWord(haystack, normalizeForAddressMatch(name)))) continue
    // Zwei verschiedene Länder in einer Zeile: wir haben die Adresse nicht
    // verstanden — dann lieber gar nichts vorschlagen.
    if (hit && hit !== entry) return null
    hit = entry
  }

  return hit ? { zone: hit.zone, country: hit.country } : null
}
