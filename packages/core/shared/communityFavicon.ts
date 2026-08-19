/**
 * DAS EIGENE FAVICON EINER COMMUNITY — der Vertrag und die zwei PURE Prüfungen,
 * die Upload-Route wie Beweis-Skript teilen (Davids Zuschnitt vom 2026-08-18).
 *
 * Bis hierher bekam jede Pool-Community ein GENERIERTES Favicon: ein SVG-Kreis
 * in ihrer Theme-Farbe mit der Initiale (`/favicon.svg`), dazu generierte
 * PNG-App-Icons (`/icon/<key>.png`). Wer stattdessen ein EIGENES Logo im Tab
 * und auf dem Home-Bildschirm will, lädt es hier hoch — im Dashboard unter
 * Branding.
 *
 * ── WARUM DIESE PRÜFUNGEN HIER IN core LIEGEN, PURE UND OHNE node:* ─────────
 * Dieselbe Aufteilung wie bei `communitySeo.ts`: die REGEL (was ist ein
 * gültiges Favicon?) gehört an EINE Stelle, damit die Upload-Route sie
 * durchsetzt UND das Beweis-Skript dieselbe Grenze belegen kann, ohne sie
 * nachzubauen. Kein node:*, keine Appwrite-Bindung — Eingabe ist ein
 * `Uint8Array`, damit die Funktionen im Test gegen handgebaute Header-Bytes
 * laufen und im Server gegen den Datei-Puffer.
 *
 * ── NUR PNG, UND DAS IST EINE DER ENTSCHEIDUNGEN, NICHT EINE BEQUEMLICHKEIT ──
 * Davids Zuschnitt: nur PNG (Magic-Bytes-Check), 32–512 px Kante, ≤ 1 MB. Kein
 * ICO/SVG/JPEG. Grund: das App-Icon (`apple-touch-icon`) verlangt ohnehin eine
 * Bitmap, und ein einziges Quadrat-PNG bedient Tab-Favicon UND Home-Bildschirm.
 * Ein SVG-Upload wäre der Sonderweg mit eigener Sicherheitsfrage (aktive
 * Inhalte), ein ICO eine Verpackung ohne Vorteil. Der DEKLARIERTE MIME-Typ ist
 * Client-Input — geprüft wird der INHALT.
 */

/**
 * Der Storage-Bucket im RUNTIME-Projekt — EINE Datei je Community, fileId =
 * communityId (`communities.$id`). Angelegt in system-037. Kein Client-Recht
 * (`permissions: []`): gelesen wird über die Route `/icon/<key>.png`, die den
 * Admin-Client benutzt; die Datei selbst ist nie direkt adressierbar.
 */
export const COMMUNITY_FAVICON_BUCKET = 'favicons'

/**
 * Harte Obergrenze der Datei. Dieselbe Zahl steht als `maximumFileSize` am
 * Bucket (system-037): der Bucket weist eine zu große Datei ohnehin ab, aber
 * die Route prüft VORHER und meldet ein sauberes 413, statt einen Appwrite-
 * Fehler zu übersetzen. Ein Favicon braucht keine 1 MB — die Grenze ist
 * großzügig, damit ein unoptimiertes PNG durchgeht, nicht knapp.
 */
export const MAX_FAVICON_BYTES = 1_000_000

/**
 * Kleinste erlaubte Kantenlänge. Unter 32 px ist ein Logo im Tab nicht mehr zu
 * erkennen, und ein Winzbild deutet eher auf einen Fehlgriff (Vorschaubild
 * statt Icon) als auf eine Absicht.
 */
export const MIN_FAVICON_DIM = 32

/**
 * Größte erlaubte Kantenlänge. 512 ist das Maß, das Android/Chrome für den
 * Home-Bildschirm erwarten (BRAND_ICON_SIZES); größer wird beim Ausliefern
 * ohnehin nie gebraucht (die Route skaliert auf 180/512 herunter). QUADRATISCH
 * wird NICHT erzwungen — die Auslieferung schneidet mittig (`gravity: Center`),
 * ein leicht rechteckiges Logo bleibt also brauchbar.
 */
export const MAX_FAVICON_DIM = 512

/** Die acht Bytes, mit denen jede gültige PNG-Datei beginnt. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

/**
 * Beginnt der Puffer mit der PNG-Signatur?
 *
 * Der deklarierte MIME-Typ ist Client-Input (`image/png` lässt sich fälschen) —
 * hier wird geprüft, dass der INHALT tatsächlich ein PNG ist. Verhindert, dass
 * z. B. ein SVG mit aktivem Inhalt oder ein JPEG unter falscher Flagge in den
 * Bucket wandert und später als Icon ausgeliefert wird.
 */
export function isPngMagic(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) return false
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return false
  }
  return true
}

/**
 * Breite und Höhe eines PNG aus dem IHDR-Kopf lesen — oder `null`, wenn der
 * Puffer kein gültiges PNG ist.
 *
 * Das IHDR-Chunk ist bei jedem PNG das erste nach der 8-Byte-Signatur; die
 * beiden 32-bit-Maße stehen big-endian an Offset 16 (Breite) und 20 (Höhe).
 * Das reicht, um die Kantenlänge zu prüfen, ohne das Bild zu dekodieren — die
 * Route braucht keinen Decoder im Betrieb, und ein manipuliertes IHDR fällt
 * höchstens auf ein falsches Maß herein, nie auf Code-Ausführung.
 *
 * FAIL-CLOSED: fehlt die Signatur oder ist der Puffer zu kurz für den Kopf,
 * antwortet die Funktion `null` — die Route weist die Datei dann ab. Ein
 * PNG, dessen erstes Chunk nicht IHDR ist, ist nach der Spezifikation ohnehin
 * ungültig; wir bestehen darauf, statt auf Verdacht zu raten.
 */
export function pngDimensions(bytes: Uint8Array): { width: number, height: number } | null {
  // Signatur (8) + Länge (4) + Typ (4) + Breite (4) + Höhe (4) = 24 Bytes.
  if (bytes.length < 24) return null
  if (!isPngMagic(bytes)) return null
  // Das erste Chunk MUSS IHDR sein (PNG-Spezifikation) — sein Typ steht an 12.
  if (bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) return null

  const readUInt32BE = (offset: number): number =>
    (bytes[offset]! * 0x1000000) + ((bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!)

  const width = readUInt32BE(16)
  const height = readUInt32BE(20)
  if (width <= 0 || height <= 0) return null
  return { width, height }
}
