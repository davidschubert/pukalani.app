import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  decryptSecret,
  decryptSecretWithKeys,
  encryptSecret,
  parseSecretBoxKey,
  sameSecretBoxKey,
  SECRET_BOX_KEY_HEX_LENGTH,
  secretBoxKeyId,
} from '../server/utils/secretBox'

const KEY = randomBytes(32)
const OTHER_KEY = randomBytes(32)

/** Nutzlast eines Umschlags (iv|tag|ciphertext) — ohne `v1.` und ohne Kennung. */
function envelopeBody(envelope: string): Buffer {
  return Buffer.from(envelope.split('.')[2]!, 'base64')
}

/** Nutzlast wieder zu einem Umschlag DIESES Schlüssels zusammensetzen. */
function rebuild(key: Buffer, body: Buffer): string {
  return `v1.${secretBoxKeyId(key)}.${body.toString('base64')}`
}

/**
 * Ein Umschlag in der Fassung VOR LOW 7: `v1.<base64>`, ohne Kennung. Genau
 * das liegt heute in `stripe_settings` — er MUSS lesbar bleiben.
 */
function legacyEnvelope(plain: string, key: Buffer): string {
  return `v1.${envelopeBody(encryptSecret(plain, key)).toString('base64')}`
}

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

  it('NICHT-STRING wirft, statt still abzuschalten (NOTE 10, destr)', () => {
    // Nitro schickt Env-Werte durch destr: ein Schlüssel aus lauter Ziffern
    // käme als Number an. Vorher fiel das auf '' zurück und die Ablage war
    // ohne jede Meldung tot.
    expect(() => parseSecretBoxKey(12345678901234567890n)).toThrow(/Zeichenkette/)
    expect(() => parseSecretBoxKey(Number('1'.repeat(64)))).toThrow(/Zeichenkette/)
    expect(() => parseSecretBoxKey(true)).toThrow(/Zeichenkette/)
    expect(() => parseSecretBoxKey({})).toThrow(/Zeichenkette/)
  })

  it('nennt im Fehler den übergebenen Variablennamen', () => {
    expect(() => parseSecretBoxKey('kurz', 'NUXT_BILLING_SETTINGS_KEY_OLD')).toThrow(/NUXT_BILLING_SETTINGS_KEY_OLD/)
  })
})

describe('secretBoxKeyId (LOW 7)', () => {
  it('ist stabil, 8 Hex-Zeichen und schlüsselabhängig', () => {
    expect(secretBoxKeyId(KEY)).toMatch(/^[0-9a-f]{8}$/)
    expect(secretBoxKeyId(KEY)).toBe(secretBoxKeyId(Buffer.from(KEY)))
    expect(secretBoxKeyId(KEY)).not.toBe(secretBoxKeyId(OTHER_KEY))
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

  it('trägt Format-Kennung UND Schlüssel-Kennung (v1.<kid>.…)', () => {
    const envelope = encryptSecret('sk_test_abc', KEY)
    expect(envelope.startsWith(`v1.${secretBoxKeyId(KEY)}.`)).toBe(true)
  })

  it('MANIPULIERTER AuthTag wirft — kein stiller Müll', () => {
    const raw = envelopeBody(encryptSecret('sk_live_geheim', KEY))
    // Byte im AuthTag (Offset 12..27) kippen.
    raw[14] = raw[14]! ^ 0xFF
    expect(() => decryptSecret(rebuild(KEY, raw), KEY)).toThrow()
  })

  it('manipulierter Ciphertext wirft ebenfalls', () => {
    const raw = envelopeBody(encryptSecret('sk_live_geheim', KEY))
    raw[raw.length - 1] = raw[raw.length - 1]! ^ 0xFF
    expect(() => decryptSecret(rebuild(KEY, raw), KEY)).toThrow()
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

  it('BESTANDS-Umschlag OHNE Kennung bleibt lesbar (Abwärtskompatibilität)', () => {
    const plain = 'sk_test_bestand'
    const legacy = legacyEnvelope(plain, KEY)
    expect(legacy.split('.')).toHaveLength(2)
    expect(decryptSecret(legacy, KEY)).toBe(plain)
  })

  it('fremde Kennung wirft mit AUSKUNFT statt mit „unable to authenticate"', () => {
    const foreign = encryptSecret('sk_test_abc', OTHER_KEY)
    expect(() => decryptSecret(foreign, KEY)).toThrow(new RegExp(secretBoxKeyId(OTHER_KEY)))
  })
})

describe('decryptSecretWithKeys — Rotation (LOW 7)', () => {
  it('öffnet mit dem ALT-Schlüssel, während schon der neue schreibt', () => {
    // Der Zustand mitten in einer Rotation: OLD=alt, NEU=neu deployed, die
    // Zeile trägt noch den alten Umschlag.
    const withOld = encryptSecret('whsec_alt', OTHER_KEY)
    expect(decryptSecretWithKeys(withOld, [KEY, OTHER_KEY])).toBe('whsec_alt')
  })

  it('öffnet neue Umschläge weiterhin mit dem aktuellen Schlüssel', () => {
    expect(decryptSecretWithKeys(encryptSecret('whsec_neu', KEY), [KEY, OTHER_KEY])).toBe('whsec_neu')
  })

  it('BESTAND ohne Kennung wird durchprobiert — auch gegen den Zweitschlüssel', () => {
    expect(decryptSecretWithKeys(legacyEnvelope('sk_test_a', KEY), [KEY, OTHER_KEY])).toBe('sk_test_a')
    expect(decryptSecretWithKeys(legacyEnvelope('sk_test_b', OTHER_KEY), [KEY, OTHER_KEY])).toBe('sk_test_b')
  })

  it('GEGENPROBE: ohne den Alt-Schlüssel ist derselbe Umschlag zu', () => {
    // Der Test, der scheitern MUSS, wenn die Rotation nur zufällig grün ist.
    const withOld = encryptSecret('whsec_alt', OTHER_KEY)
    expect(() => decryptSecretWithKeys(withOld, [KEY])).toThrow()
    expect(() => decryptSecretWithKeys(legacyEnvelope('sk_test_b', OTHER_KEY), [KEY])).toThrow()
  })

  it('ohne jeden Schlüssel wirft es, statt „" zu liefern', () => {
    expect(() => decryptSecretWithKeys(encryptSecret('x', KEY), [])).toThrow(/Kein Schlüssel/)
  })
})
