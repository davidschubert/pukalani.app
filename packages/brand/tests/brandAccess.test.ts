import { describe, expect, it } from 'vitest'
import {
  type BrandAccessInput,
  decideBrandAccess,
  normalizeBrandAdmissionMode,
} from '../shared/brandAccess'

/**
 * Die Zugangsregel des Brand-Wizards, ohne Instanz nachprüfbar (Plan §6
 * „Zugang"). Jede Regel hat hier ihre GEGENPROBE — eine Prüfung, die nur den
 * erlaubten Fall zeigt, wäre auch dann grün, wenn die Funktion immer `true`
 * zurückgäbe.
 */

const base: BrandAccessInput = {
  admissionMode: 'closed',
  userId: 'user-1',
  emailVerified: true,
  accessRow: null,
}

describe('decideBrandAccess', () => {
  it('lehnt ohne Session ab — auch bei offener Beta (kein Anonym-Start)', () => {
    expect(decideBrandAccess({ ...base, userId: null })).toEqual({ allowed: false, reason: 'no_session' })
    expect(decideBrandAccess({ ...base, admissionMode: 'open', userId: null }))
      .toEqual({ allowed: false, reason: 'no_session' })
    expect(decideBrandAccess({ ...base, admissionMode: 'open', userId: null, accessRow: {} }))
      .toEqual({ allowed: false, reason: 'no_session' })
  })

  it('lehnt ein unverifiziertes Konto ab — auch mit Zugangs-Zeile', () => {
    expect(decideBrandAccess({ ...base, emailVerified: false, accessRow: {} }))
      .toEqual({ allowed: false, reason: 'not_verified' })
    expect(decideBrandAccess({ ...base, admissionMode: 'open', emailVerified: false }))
      .toEqual({ allowed: false, reason: 'not_verified' })
  })

  it('lässt bei geschlossener Beta nur Konten mit Zugangs-Zeile durch', () => {
    expect(decideBrandAccess({ ...base, accessRow: {} })).toEqual({ allowed: true, reason: null })
    expect(decideBrandAccess({ ...base, accessRow: { revokedAt: null } }))
      .toEqual({ allowed: true, reason: null })
    // Gegenprobe: ohne Zeile ist geschlossen wirklich geschlossen.
    expect(decideBrandAccess(base)).toEqual({ allowed: false, reason: 'no_access' })
  })

  it('lässt bei offener Beta jedes verifizierte Konto durch — ohne Zeile', () => {
    expect(decideBrandAccess({ ...base, admissionMode: 'open' }))
      .toEqual({ allowed: true, reason: null })
  })

  it('lässt den Entzug die Öffnung schlagen', () => {
    const revoked = { revokedAt: '2026-08-30T10:00:00.000Z' }
    expect(decideBrandAccess({ ...base, accessRow: revoked }))
      .toEqual({ allowed: false, reason: 'revoked' })
    // DIE Gegenprobe zur Regel: 'open' hebt einen ausdrücklichen Entzug NICHT auf.
    expect(decideBrandAccess({ ...base, admissionMode: 'open', accessRow: revoked }))
      .toEqual({ allowed: false, reason: 'revoked' })
  })

  it('nennt bei jeder Ablehnung genau einen Grund, bei Erlaubnis keinen', () => {
    const denied = [
      decideBrandAccess({ ...base, userId: null }),
      decideBrandAccess({ ...base, emailVerified: false }),
      decideBrandAccess({ ...base, accessRow: { revokedAt: '2026-08-30T10:00:00.000Z' } }),
      decideBrandAccess(base),
    ]
    expect(denied.map(d => d.reason)).toEqual(['no_session', 'not_verified', 'revoked', 'no_access'])
    expect(denied.every(d => !d.allowed)).toBe(true)
    expect(decideBrandAccess({ ...base, admissionMode: 'open' }).reason).toBeNull()
  })
})

describe('normalizeBrandAdmissionMode', () => {
  it('erkennt nur den ausdrücklichen Wert "open"', () => {
    expect(normalizeBrandAdmissionMode('open')).toBe('open')
  })

  it('fällt bei allem anderen auf "closed" zurück (Deploy vor system-038)', () => {
    for (const value of [undefined, null, '', 'closed', 'OPEN', 'offen', true, 1, {}]) {
      expect(normalizeBrandAdmissionMode(value)).toBe('closed')
    }
  })
})
