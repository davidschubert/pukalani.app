import { describe, expect, it } from 'vitest'
import {
  MAX_FAVICON_BYTES,
  MAX_FAVICON_DIM,
  MIN_FAVICON_DIM,
  isPngMagic,
  pngDimensions,
} from '../shared/communityFavicon'

/**
 * DIE ZWEI PRÜFUNGEN HINTER DEM FAVICON-UPLOAD (Community-Favicon-Upload).
 *
 * Wie bei `communitySeo.test.ts`: jede Zusage hat ihre GEGENPROBE. `isPngMagic`
 * und `pngDimensions` sind die einzige Barriere zwischen einem gefälschten
 * Content-Type und dem Bucket — eine Prüfung, die man nur in eine Richtung
 * testet, ist keine.
 */

/** Die acht Bytes jeder gültigen PNG-Datei. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * Einen minimalen, aber echten PNG-KOPF bauen: Signatur + IHDR-Chunk mit
 * big-endian Breite/Höhe. Mehr braucht `pngDimensions` nicht — es liest nur den
 * Kopf, nicht das Bild. So prüfen die Tests gegen dieselben Bytes, die ein
 * echter Encoder erzeugt, ohne ein ganzes PNG zu erfinden.
 */
function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set(PNG_MAGIC, 0)
  // Länge des IHDR-Datenteils (13) — für die Maß-Prüfung unerheblich, aber echt.
  bytes[8] = 0x00
  bytes[9] = 0x00
  bytes[10] = 0x00
  bytes[11] = 0x0d
  // Chunk-Typ 'IHDR'
  bytes[12] = 0x49
  bytes[13] = 0x48
  bytes[14] = 0x44
  bytes[15] = 0x52
  const writeUInt32BE = (offset: number, value: number) => {
    bytes[offset] = (value >>> 24) & 0xff
    bytes[offset + 1] = (value >>> 16) & 0xff
    bytes[offset + 2] = (value >>> 8) & 0xff
    bytes[offset + 3] = value & 0xff
  }
  writeUInt32BE(16, width)
  writeUInt32BE(20, height)
  return bytes
}

describe('isPngMagic', () => {
  it('erkennt die PNG-Signatur', () => {
    expect(isPngMagic(pngHeader(64, 64))).toBe(true)
    expect(isPngMagic(new Uint8Array(PNG_MAGIC))).toBe(true)
  })

  it('GEGENPROBE: JPEG wird abgewiesen', () => {
    // JPEG beginnt mit FF D8 FF.
    expect(isPngMagic(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]))).toBe(false)
  })

  it('GEGENPROBE: SVG (Text) wird abgewiesen', () => {
    // '<?xml' bzw. '<svg' — der klassische Umgehungsversuch mit aktivem Inhalt.
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" />')
    expect(isPngMagic(svg)).toBe(false)
  })

  it('GEGENPROBE: ein zu kurzer Puffer ist kein PNG', () => {
    expect(isPngMagic(new Uint8Array([0x89, 0x50, 0x4e]))).toBe(false)
    expect(isPngMagic(new Uint8Array(0))).toBe(false)
  })

  it('GEGENPROBE: richtige Länge, ein Byte falsch', () => {
    const almost = new Uint8Array(PNG_MAGIC)
    almost[7] = 0x00
    expect(isPngMagic(almost)).toBe(false)
  })
})

describe('pngDimensions', () => {
  it('liest Breite und Höhe aus dem IHDR-Kopf', () => {
    expect(pngDimensions(pngHeader(180, 180))).toEqual({ width: 180, height: 180 })
    expect(pngDimensions(pngHeader(32, 512))).toEqual({ width: 32, height: 512 })
    expect(pngDimensions(pngHeader(512, 32))).toEqual({ width: 512, height: 32 })
  })

  it('liest auch große Maße big-endian korrekt (kein Vorzeichen-Fehler)', () => {
    // 300 passt nicht in ein Byte — prüft, dass beide höheren Bytes zählen.
    expect(pngDimensions(pngHeader(300, 300))).toEqual({ width: 300, height: 300 })
  })

  it('GEGENPROBE: kein PNG (fehlende Signatur) ⇒ null', () => {
    const jpeg = new Uint8Array(24)
    jpeg[0] = 0xff
    jpeg[1] = 0xd8
    jpeg[2] = 0xff
    expect(pngDimensions(jpeg)).toBeNull()
  })

  it('GEGENPROBE: Signatur da, aber erstes Chunk ist nicht IHDR ⇒ null', () => {
    const bytes = pngHeader(64, 64)
    // 'IHDR' → 'IDAT' verfälschen: die Maß-Position stimmt, der Kopf nicht.
    bytes[13] = 0x44 // D
    bytes[14] = 0x41 // A
    bytes[15] = 0x54 // T
    expect(pngDimensions(bytes)).toBeNull()
  })

  it('GEGENPROBE: zu kurz für den Kopf ⇒ null', () => {
    expect(pngDimensions(new Uint8Array(PNG_MAGIC))).toBeNull()
    expect(pngDimensions(pngHeader(64, 64).subarray(0, 23))).toBeNull()
  })

  it('GEGENPROBE: ein Maß 0 ⇒ null (ein leeres Bild ist keins)', () => {
    expect(pngDimensions(pngHeader(0, 64))).toBeNull()
    expect(pngDimensions(pngHeader(64, 0))).toBeNull()
  })
})

describe('Grenzwerte passen zur Route-Prüfung', () => {
  it('die Kanten-Grenzen sind ein gültiges Intervall', () => {
    expect(MIN_FAVICON_DIM).toBeLessThan(MAX_FAVICON_DIM)
    // Das größte erlaubte Maß ist zugleich die größte ausgelieferte Icon-Größe.
    expect(MAX_FAVICON_DIM).toBe(512)
    expect(MIN_FAVICON_DIM).toBe(32)
  })

  it('ein Bild GENAU auf den Grenzen ist gültig (die Route lässt es durch)', () => {
    const min = pngDimensions(pngHeader(MIN_FAVICON_DIM, MIN_FAVICON_DIM))
    const max = pngDimensions(pngHeader(MAX_FAVICON_DIM, MAX_FAVICON_DIM))
    expect(min).toEqual({ width: MIN_FAVICON_DIM, height: MIN_FAVICON_DIM })
    expect(max).toEqual({ width: MAX_FAVICON_DIM, height: MAX_FAVICON_DIM })
  })

  it('die Byte-Grenze ist großzügig, aber real', () => {
    expect(MAX_FAVICON_BYTES).toBe(1_000_000)
  })
})
