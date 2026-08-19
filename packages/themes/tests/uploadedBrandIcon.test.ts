import { describe, expect, it } from 'vitest'
import {
  BRAND_ICON_KEY_PATTERN,
  brandIconKey,
  uploadedBrandIconKey,
} from '../shared/brandIcon'

/**
 * DER SCHLÜSSEL FÜR EIN HOCHGELADENES FAVICON (Community-Favicon-Upload).
 *
 * Zwei Zusagen: er erfüllt das bestehende Route-Muster (sonst antwortet
 * /icon/<key>.png mit 404), und er wandert mit dem `$updatedAt` der Datei (sonst
 * holt kein Gerät das neue Bild).
 */
describe('uploadedBrandIconKey', () => {
  it('erfüllt das Route-Muster (kein Pattern-Ausbau nötig)', () => {
    // Genau die Werte, die aus `storage.getFile().$updatedAt` kommen — ISO 8601
    // mit `:` und `.`, die roh im Pfad das Muster nie erfüllten.
    for (const updatedAt of [
      '2026-08-18T10:15:30.123+00:00',
      '2026-01-01T00:00:00.000Z',
      '2027-12-31T23:59:59.999Z',
      '',
    ]) {
      expect(uploadedBrandIconKey(updatedAt)).toMatch(BRAND_ICON_KEY_PATTERN)
    }
  })

  it('ist stabil für denselben Zeitstempel', () => {
    const at = '2026-08-18T10:15:30.123+00:00'
    expect(uploadedBrandIconKey(at)).toBe(uploadedBrandIconKey(at))
  })

  it('wandert bei einem neuen Upload (anderer $updatedAt)', () => {
    const first = uploadedBrandIconKey('2026-08-18T10:15:30.123+00:00')
    const second = uploadedBrandIconKey('2026-08-18T10:15:31.000+00:00')
    expect(second).not.toBe(first)
  })

  it('trennt sich vom generierten Icon-Schlüssel (eigener Namensraum)', () => {
    // Selbst wenn der Zeitstempel zufällig wie eine Farbe/ein Name aussähe:
    // der Präfix 'icon-upload' hält die Schlüssel-Räume auseinander, damit ein
    // Upload nie die gemerkte URL eines generierten Icons trifft.
    expect(uploadedBrandIconKey('#ff7a18')).not.toBe(brandIconKey('#ff7a18', ''))
  })
})
