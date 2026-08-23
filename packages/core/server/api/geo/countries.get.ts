import type { GeoCountriesResponse } from '../../../shared/types/geo'
import { listCityCountries } from '../../utils/geoCities'

/**
 * Die Länder, die im Orts-Verzeichnis vorkommen — Auswahl des OPTIONALEN
 * Filters im Profil-Picker (Davids Nachtrag 2026-08-23).
 *
 * NUR CODES, KEINE NAMEN. Übersetzte Ländernamen wären 250 Einträge in zwei
 * Sprachen, gepflegt von Hand und veraltet ab dem Tag, an dem sich ein Land
 * umbenennt. Der Browser kann das besser: `Intl.DisplayNames` löst denselben
 * Code in JEDER Sprache auf, die er ohnehin spricht — die Übersetzung ist
 * damit weder unser Datenbestand noch unsere Pflege.
 *
 * EIGENE ROUTE statt eines Modus von `/api/geo/cities`: die Antwort hängt an
 * NICHTS ausser der geladenen Datei, wird einmal beim Aufbau des Formulars
 * geholt und ist damit eine andere Sorte Frage als „was habe ich gerade
 * getippt". Ein `?countries=1` an der Suchroute hätte zwei Antwortformen in
 * einen Typ gezwungen.
 *
 * SESSION-PFLICHT wie beim Geschwister: dieselbe Datei, dieselbe Begründung —
 * kein anonymer Auskunftsdienst über unser Verzeichnis.
 *
 * LEERE LISTE = kein Pfad konfiguriert oder Datei unlesbar. Der Picker blendet
 * den Filter dann aus; ein Auswahlfeld ohne Auswahl wäre eine Lüge.
 */
export default defineEventHandler(async (event): Promise<GeoCountriesResponse> => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  return { countries: await listCityCountries(event) }
})
