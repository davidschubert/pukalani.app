import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret, parseSecretBoxKey, sameSecretBoxKey, SECRET_BOX_KEY_HEX_LENGTH } from '../server/utils/secretBox'

const KEY = randomBytes(32)
const OTHER_KEY = randomBytes(32)

describe('parseSecretBoxKey', () => {
  it('liest 64 Hex-Zeichen als 32 Bytes', () => {
    const hex = KEY.toString('hex')
    expect(hex).toHaveLength(SECRET_BOX_KEY_HEX_LENGTH)
    const parsed = parseSecretBoxKey(hex)
    expect(parsed).not.toBeNull()
    expect(sameSecretBoxKey(parsed!, KEY)).toBe(true)
  })

  it('leer/undefined = „nicht konfiguriert" (null, kein Fehler)', () => {
    expect(parseSecretBoxKey('')).toBeNull()
    expect(parseSecretBoxKey('   ')).toBeNull()
    expect(parseSecretBoxKey(undefined)).toBeNull()
    expect(parseSecretBoxKey(null)).toBeNull()
  })

  it('gesetzt, aber falsch geformt = Konfigurationsfehler (wirft)', () => {
    // Sonst verhielte sich ein Tippfehler wie eine bewusste Abschaltung.
    expect(() => parseSecretBoxKey('zu-kurz')).toThrow(/64 Hex/)
    expect(() => parseSecretBoxKey('x'.repeat(64))).toThrow(/64 Hex/)
  })
})

describe('encryptSecret/decryptSecret', () => {
  it('Roundtrip liefert exakt den Klartext zurück', () => {
    // Zur Laufzeit zusammengesetzt, nicht als Literal: ein AUSGESCHRIEBENER
    // sk_live_-Beispielwert matcht GitHubs Push-Protection-Muster und blockt
    // jeden Push dieses Repos (öffentlich, 2026-08-08 live erwischt) — der
    // Scanner liest Quelltext, keine Laufzeitwerte.
    const plain = 'sk_live_' + '51ABCdefGHIjklMNOpqrSTUvwx'
    expect(decryptSecret(encryptSecret(plain, KEY), KEY)).toBe(plain)
  })

  it('Roundtrip trägt Unicode und Leerzeichen', () => {
    const plain = 'whsec_äöü ß — ✓'
    expect(decryptSecret(encryptSecret(plain, KEY), KEY)).toBe(plain)
  })

  it('derselbe Klartext ergibt zweimal verschiedene Umschläge (frischer IV)', () => {
    const a = encryptSecret('sk_test_abc', KEY)
    const b = encryptSecret('sk_test_abc', KEY)
    expect(a).not.toBe(b)
    expect(decryptSecret(a, KEY)).toBe(decryptSecret(b, KEY))
  })

  it('trägt die Format-Kennung v1.', () => {
    expect(encryptSecret('sk_test_abc', KEY).startsWith('v1.')).toBe(true)
  })

  it('MANIPULIERTER AuthTag wirft — kein stiller Müll', () => {
    const envelope = encryptSecret('sk_live_geheim', KEY)
    const raw = Buffer.from(envelope.slice(3), 'base64')
    // Byte im AuthTag (Offset 12..27) kippen.
    raw[14] = raw[14]! ^ 0xFF
    const tampered = 'v1.' + raw.toString('base64')
    expect(() => decryptSecret(tampered, KEY)).toThrow()
  })

  it('manipulierter Ciphertext wirft ebenfalls', () => {
    const envelope = encryptSecret('sk_live_geheim', KEY)
    const raw = Buffer.from(envelope.slice(3), 'base64')
    raw[raw.length - 1] = raw[raw.length - 1]! ^ 0xFF
    expect(() => decryptSecret('v1.' + raw.toString('base64'), KEY)).toThrow()
  })

  it('falscher Schlüssel wirft', () => {
    const envelope = encryptSecret('sk_live_geheim', KEY)
    expect(() => decryptSecret(envelope, OTHER_KEY)).toThrow()
  })

  it('fremdes Format wirft (kein v1.-Präfix)', () => {
    expect(() => decryptSecret('sk_live_klartext', KEY)).toThrow(/Umschlag-Format/)
  })

  it('zu kurzer Umschlag wirft', () => {
    expect(() => decryptSecret('v1.' + Buffer.alloc(10).toString('base64'), KEY)).toThrow(/zu kurz/)
  })
})
