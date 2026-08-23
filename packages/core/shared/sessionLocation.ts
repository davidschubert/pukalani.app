/**
 * Wie ein Session-Standort in EINER Zeile steht.
 *
 * Drei Angaben mit drei Quellen und drei Genauigkeiten: Stadt und Region
 * kommen aus der lokalen MMDB (server/utils/geoCity.ts), das Land von
 * Appwrite. Jede davon kann fehlen — pro Session gibt es also acht mögliche
 * Kombinationen, und genau deshalb ist die Regel hier PUR und getestet statt
 * in einem Template verteilt.
 *
 * Der Punkt-Trenner setzt die zwei QUELLEN auseinander („Hamburg, Hamburg ·
 * Deutschland"), das Komma trennt innerhalb der feineren Angabe. Bleibt vom
 * Feinen nichts übrig, steht das Land allein da — wie vor der MMDB.
 */
export interface SessionLocationParts {
  city: string
  region: string
  countryName: string
}

export function formatSessionLocation(parts: SessionLocationParts): string {
  // Stadt und Region sind oft identisch (Stadtstaaten: „Hamburg, Hamburg") —
  // das ist KEIN Fehler, sondern die Wahrheit der Daten, und Zusammenfassen
  // wäre geraten. Doppelungen entfernt daher niemand; leere Teile schon.
  const fine = [parts.city, parts.region].map(p => p.trim()).filter(Boolean).join(', ')
  const country = parts.countryName.trim()

  if (!fine) return country
  if (!country) return fine
  return `${fine} · ${country}`
}
