/**
 * ── ORTE: DIE ZWEI FORMEN, DIE ÜBER DIE LEITUNG GEHEN ──────────────────────
 *
 * Sie stehen hier und nicht in der Route, weil Nitros Routen-Typisierung AUS
 * ist (packages/core/nuxt.config.ts, `types:extend`): `$fetch` leitet seinen
 * Antworttyp nicht mehr aus dem Handler ab. Die Form wird deshalb an BEIDEN
 * Enden verlangt — der Handler annotiert sie, die Aufrufstelle nennt sie.
 */

/**
 * EIN Vorschlag der Orts-Suche (`GET /api/geo/cities`).
 *
 * `label` ist FERTIG ZUSAMMENGESETZT („Pukalani, Hawaii") und wird genau so
 * gespeichert und später auf der Mitglieder-Karte gezeigt: die Zusammensetzung
 * gehört an EINE Stelle (shared/geoCities.ts), sonst baut jede Anzeige ihre
 * eigene Variante und die gespeicherte Angabe passt zu keiner davon.
 *
 * `countryCode` ist KLEIN geschrieben, weil er direkt in ein Flaggen-Symbol
 * geht (`flagIcon()` in app/utils/clientInfo.ts erwartet genau das) — die
 * Umwandlung passiert einmal beim Einlesen, nicht in jeder Vorlage.
 *
 * Die Koordinaten sind Zahlen und nie `null`: ein Vorschlag OHNE Koordinaten
 * wäre für die Karte wertlos und wird schon beim Einlesen verworfen.
 */
export interface GeoCitySuggestion {
  label: string
  countryCode: string
  lat: number
  lon: number
}

/**
 * `GET /api/geo/cities` — bewusst ein Umschlag statt eines nackten Arrays:
 * an dieser Liste hängt eine Lizenz-Pflicht (GeoNames, CC BY 4.0), und wenn
 * die Attribution eines Tages mitreisen soll, ist dafür Platz, ohne jede
 * Aufrufstelle zu brechen.
 */
export interface GeoCitiesResponse {
  cities: GeoCitySuggestion[]
}

/**
 * `GET /api/geo/countries` — die Ländercodes, die im Verzeichnis vorkommen
 * (klein, alphabetisch). BEWUSST ohne Namen: die löst der Browser mit
 * `Intl.DisplayNames` in seiner Sprache auf.
 *
 * Eine LEERE Liste heißt „kein Verzeichnis konfiguriert" — der Picker blendet
 * den Filter dann aus.
 */
export interface GeoCountriesResponse {
  countries: string[]
}

/**
 * Der Standort, den ein Mensch FREIWILLIG in seinem Profil angibt
 * (`prefs.locationLabel/locationLat/locationLon`).
 *
 * Label UND Koordinaten zusammen, weil beides beim Auswählen aus dem
 * Verzeichnis feststeht: die Karte (Etappe 2) braucht die Zahlen, der Mensch
 * liest den Namen. Nachträgliches Auflösen eines frei getippten Ortes gibt es
 * bewusst nicht — es wäre eine zweite, stillschweigend abweichende Wahrheit.
 */
export interface ProfileLocation {
  label: string
  lat: number
  lon: number
}
