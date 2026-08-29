import type { SystemManifest } from '../../shared/types/system'

/**
 * Lesehilfen für das Bauzeit-Manifest (build/systemManifest.ts, abgelegt als
 * JSON-String in der server-only runtimeConfig). Sie stehen hier und nicht in
 * `system.get.ts`, seit eine ZWEITE Route dieselbe Frage stellt („welche
 * Version läuft hier eigentlich?") — eine Kopie in beiden Dateien würde
 * auseinanderlaufen, sobald sich die Fail-soft-Regel ändert.
 */

/**
 * Das Manifest lesen. FAIL-SOFT: ein fehlender oder kaputter Wert darf keine
 * Route umwerfen — dann gilt eben wieder die Laufzeit-Auflösung (im Dev
 * vollständig, in Produktion mit „unknown").
 */
export function readManifest(raw: string): SystemManifest | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as SystemManifest
  }
  catch {
    return null
  }
}

/** Ein Manifest-Wert zählt nur, wenn er wirklich etwas aussagt. */
export function usableVersion(version: string | undefined): version is string {
  return !!version && version !== 'unknown'
}
