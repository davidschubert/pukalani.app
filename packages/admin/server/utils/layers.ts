import type { LayerInfo } from '../../shared/types/system'
import { computeLayerBreakdown } from '../../build/systemManifest'

/**
 * Der SCAN selbst (`computeLayerBreakdown`, `workspaceRoot`, `listFiles`,
 * `CATEGORIES`) liegt seit 2026-08-28 in `../../build/systemManifest.ts`: er
 * läuft zur Bauzeit, damit die Systemseite in Produktion echte Zahlen zeigt
 * (dort ist nur `.output/` deployt, das Quellverzeichnis fehlt). Hier bleibt
 * der Laufzeit-Weg für die ENTWICKLUNG, wo das Repo wirklich daliegt und ein
 * frischer Scan die gerade geänderten Dateien mitzählt.
 *
 * `workspaceRoot` wird mit-exportiert: die Route entscheidet damit, ob sie
 * live scannen kann (Repo vorhanden) oder das Bauzeit-Manifest nimmt.
 */
export { workspaceRoot } from '../../build/systemManifest'

// Kurzer Prozess-Cache: der Layer-Scan macht dutzende rekursive readdirSync
// über den Monorepo (blockiert den Event-Loop). Bei jedem /admin/system-Request
// neu zu scannen ist Verschwendung — der Quellbaum ändert sich zur Laufzeit nicht.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { at: number, info: LayerInfo }>()

/**
 * Inhaltsaufschlüsselung eines Produkt-Layers (@pukalani/<short> → packages/<short>):
 * Datei-Anzahl je Kategorie. Best effort aus dem Dateisystem — fehlt das
 * Quellverzeichnis, bleibt categories leer (dann greift in der Route das
 * Bauzeit-Manifest). Ergebnis ~60 s im Modul-Scope gecacht (Cache-Key inkl.
 * version, damit ein Versions-Bump den Eintrag invalidiert).
 */
export function layerBreakdown(name: string, version: string): LayerInfo {
  const key = `${name}@${version}`
  const hit = cache.get(key)
  const now = Date.now()
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.info

  const info = computeLayerBreakdown(name, version)
  cache.set(key, { at: now, info })
  return info
}
