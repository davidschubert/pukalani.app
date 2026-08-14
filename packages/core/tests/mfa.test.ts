import { describe, expect, it } from 'vitest'
import {
  MFA_FACTOR_RECOVERY_CODE,
  MFA_FACTOR_TOTP,
  isInvalidMfaCode,
  isMoreFactorsRequired,
  mfaFactorFor,
  normalizeMfaCode,
} from '../shared/mfa'
import { mfaChallengeSchema, mfaVerifySchema } from '../schemas/auth'

describe('mfaFactorFor', () => {
  it('bildet totp ab', () => {
    expect(mfaFactorFor('totp')).toBe(MFA_FACTOR_TOTP)
  })

  /**
   * DAS IST DER WICHTIGSTE TEST DER DATEI. Appwrite 1.9.6 vergleicht den
   * Challenge-Typ mit `===` gegen `Type::RECOVERY_CODE` = 'recoveryCode',
   * während jedes SDK-Enum 'recoverycode' sendet. Mit der kleingeschriebenen
   * Variante ist JEDER Wiederherstellungs-Code ungültig — und der Fehler ist
   * von einem Tippfehler des Nutzers nicht zu unterscheiden.
   */
  it('sendet recoveryCode in camelCase — nicht die SDK-Schreibweise', () => {
    expect(mfaFactorFor('recovery')).toBe('recoveryCode')
    expect(mfaFactorFor('recovery')).not.toBe('recoverycode')
    expect(MFA_FACTOR_RECOVERY_CODE).toBe('recoveryCode')
  })
})

describe('Appwrite-Fehler erkennen', () => {
  it('erkennt die halbe Session', () => {
    expect(isMoreFactorsRequired({ type: 'user_more_factors_required' })).toBe(true)
    expect(isMoreFactorsRequired({ type: 'user_invalid_token' })).toBe(false)
    expect(isMoreFactorsRequired(null)).toBe(false)
    expect(isMoreFactorsRequired(new Error('kaputt'))).toBe(false)
  })

  it('erkennt einen falschen Code', () => {
    expect(isInvalidMfaCode({ type: 'user_invalid_token' })).toBe(true)
    expect(isInvalidMfaCode({ type: 'user_invalid_credentials' })).toBe(true)
    expect(isInvalidMfaCode({ type: 'user_more_factors_required' })).toBe(false)
    expect(isInvalidMfaCode(undefined)).toBe(false)
  })
})

describe('normalizeMfaCode', () => {
  it('putzt Leerzeichen und Bindestriche', () => {
    expect(normalizeMfaCode('123 456')).toBe('123456')
    expect(normalizeMfaCode('4f3a-9c2b-10')).toBe('4f3a9c2b10')
    expect(normalizeMfaCode('  123456  ')).toBe('123456')
  })
})

describe('mfaChallengeSchema', () => {
  it('nimmt einen sechsstelligen TOTP-Code, auch mit Leerzeichen', () => {
    expect(mfaChallengeSchema.parse({ mode: 'totp', code: '123 456' }).code).toBe('123456')
  })

  it('lehnt einen zu kurzen TOTP-Code ab', () => {
    expect(() => mfaChallengeSchema.parse({ mode: 'totp', code: '12345' })).toThrow()
  })

  it('lehnt einen Wiederherstellungs-Code im TOTP-Modus ab', () => {
    expect(() => mfaChallengeSchema.parse({ mode: 'totp', code: '4f3a9c2b10' })).toThrow()
  })

  it('nimmt einen zehnstelligen Wiederherstellungs-Code', () => {
    expect(mfaChallengeSchema.parse({ mode: 'recovery', code: '4f3a-9c2b-10' }).code).toBe('4f3a9c2b10')
  })

  it('lehnt einen unbekannten Modus ab', () => {
    expect(() => mfaChallengeSchema.parse({ mode: 'sms', code: '123456' })).toThrow()
  })
})

describe('mfaVerifySchema', () => {
  it('nimmt nur sechsstellige Ziffern', () => {
    expect(mfaVerifySchema.parse({ code: '000123' }).code).toBe('000123')
    expect(() => mfaVerifySchema.parse({ code: '4f3a9c2b10' })).toThrow()
  })
})
