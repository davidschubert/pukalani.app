import { z } from 'zod'
import type { GeoCitiesResponse } from '../../../shared/types/geo'
import { searchCities } from '../../utils/geoCities'

/**
 * Orts-Vorschläge für den Picker im Profil (Mitglieder-Karte, Etappe 1).
 *
 * ── WARUM NUR FÜR EINGELOGGTE ──────────────────────────────────────────────
 * Die Daten selbst sind öffentlich (GeoNames, CC BY 4.0) — es geht nicht um
 * Geheimhaltung, sondern darum, was diese Route IST: ein Suchindex über
 * 170.000 Orte, der bei jedem getippten Zeichen antwortet. Gastoffen wäre sie
 * ein kostenloser Geocoding-Dienst auf unserer Maschine, den man von überall
 * anzapfen kann. Wer sie legitim braucht, füllt gerade sein eigenes Profil
 * aus und ist angemeldet.
 *
 * KEIN Mitglieder-Gate wie bei `/api/handles/search`: dort ist die Antwort
 * eine Mitgliederliste, hier ist sie ein Ortsverzeichnis. Und die Route MUSS
 * ohne Community auskommen — ihr Hauptwohnsitz ist `/profile` auf
 * account.pukalani.app, wo es keine gibt (deshalb steht `/api/geo/cities` als
 * EXAKTER Pfad in `pukalani.tenancy.controlApiPrefixes`).
 *
 * MINDESTENS ZWEI ZEICHEN: bei einem Zeichen wäre die Antwort schlicht die
 * einwohnerstärkste Stadt mit diesem Anfangsbuchstaben — kein Vorschlag,
 * sondern Rauschen, für das die Datei trotzdem durchlaufen wird. Weniger als
 * zwei Zeichen ergibt deshalb eine leere Liste, keinen Fehler: der Picker
 * fragt beim Tippen, und ein 400 auf dem Weg zum zweiten Buchstaben wäre eine
 * Fehlermeldung für korrektes Verhalten.
 *
 * Die Trefferzahl ist NICHT vom Aufrufer wählbar (kein `limit` in der Query):
 * ein Menü zeigt eine Handvoll, und ein Parameter dafür wäre nur ein Hebel,
 * um die Antwort größer zu machen.
 */
const MIN_QUERY_LENGTH = 2

/** Länger als jeder echte Ortsname — die Grenze bremst nur Unsinn. */
const MAX_QUERY_LENGTH = 80

const querySchema = z.object({
  q: z.string().trim().max(MAX_QUERY_LENGTH).optional(),
  /**
   * OPTIONALER Länder-Filter (Davids Nachtrag 2026-08-23) — kein Pflicht-
   * Vorspiel: die eine Suche bleibt der Hauptweg, das Land hilft für die
   * Berlin/Wisconsin-Fälle. Großzügig validiert (max. 8 Zeichen statt exakt 2)
   * und erst in `normalizeCountryCode` auf zwei Buchstaben gebracht: ein
   * unbrauchbarer Wert soll den Filter FALLEN LASSEN, nicht die Anfrage — ein
   * 400 mitten im Tippen wäre eine Fehlermeldung für ein Feld, das gerade
   * niemand angefasst hat.
   */
  country: z.string().trim().max(8).optional(),
})

export default defineEventHandler(async (event): Promise<GeoCitiesResponse> => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { q, country } = await getValidatedQuery(event, querySchema.parse)
  const query = q ?? ''
  if (query.length < MIN_QUERY_LENGTH) return { cities: [] }

  return { cities: await searchCities(event, query, { country }) }
})
