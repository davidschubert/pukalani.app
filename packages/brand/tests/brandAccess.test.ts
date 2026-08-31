import { describe, expect, it } from 'vitest'
import {
  admissionAllowsRedeem,
  BRAND_ADMISSION_MODES,
  type BrandAccessInput,
  type BrandAdmissionMode,
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

  it('behandelt "invite" im GATE genau wie "closed" (§3e)', () => {
    // Wer eine Zeile hat, arbeitet — in beiden Modi.
    expect(decideBrandAccess({ ...base, admissionMode: 'invite', accessRow: {} }))
      .toEqual({ allowed: true, reason: null })
    // Gegenprobe: „nur per Einladung" ist keine Öffnung — ohne Zeile ist zu.
    expect(decideBrandAccess({ ...base, admissionMode: 'invite' }))
      .toEqual({ allowed: false, reason: 'no_access' })
  })

  it('lässt bestehende Zugänge jeden Modus überleben (closed ist kein Entzug)', () => {
    for (const mode of BRAND_ADMISSION_MODES) {
      expect(decideBrandAccess({ ...base, admissionMode: mode, accessRow: {} }))
        .toEqual({ allowed: true, reason: null })
    }
  })

  it('lässt bei offener Beta jedes verifizierte Konto durch — ohne Zeile', () => {
    expect(decideBrandAccess({ ...base, admissionMode: 'open' }))
      .toEqual({ allowed: true, reason: null })
  })

  it('lässt den Entzug jeden Modus schlagen', () => {
    const revoked = { revokedAt: '2026-08-30T10:00:00.000Z' }
    // DIE Gegenprobe zur Regel: kein Modus hebt einen ausdrücklichen Entzug auf.
    for (const mode of BRAND_ADMISSION_MODES) {
      expect(decideBrandAccess({ ...base, admissionMode: mode, accessRow: revoked }))
        .toEqual({ allowed: false, reason: 'revoked' })
    }
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
  it('erkennt die drei ausdrücklichen Werte', () => {
    expect(normalizeBrandAdmissionMode('open')).toBe('open')
    expect(normalizeBrandAdmissionMode('invite')).toBe('invite')
    expect(normalizeBrandAdmissionMode('closed')).toBe('closed')
  })

  it('fällt bei allem anderen auf "closed" zurück (Deploy vor system-038)', () => {
    for (const value of [undefined, null, '', 'OPEN', 'Invite', 'offen', 'einladung', true, 1, {}]) {
      expect(normalizeBrandAdmissionMode(value)).toBe('closed')
    }
  })
})

describe('admissionAllowsRedeem', () => {
  it('lässt einen Code NUR im Modus "invite" Zugang schaffen', () => {
    expect(admissionAllowsRedeem('invite')).toBe(true)
    // Gegenprobe, beide Seiten: 'closed' heißt „keine NEUEN Zugänge" (ein
    // liegengebliebener Code unterläuft den Stopp nicht), 'open' braucht keine.
    expect(admissionAllowsRedeem('closed')).toBe(false)
    expect(admissionAllowsRedeem('open')).toBe(false)
  })

  it('deckt jeden bekannten Modus ab — genau einer sagt Ja', () => {
    const yes = BRAND_ADMISSION_MODES.filter(mode => admissionAllowsRedeem(mode))
    expect(yes).toEqual(['invite'])
  })

  it('sagt nichts über den ZUGANG aus — die zwei Fragen sind getrennt', () => {
    // 'open': Einlösung nein, Zugang trotzdem ja.
    const open: BrandAdmissionMode = 'open'
    expect(admissionAllowsRedeem(open)).toBe(false)
    expect(decideBrandAccess({ ...base, admissionMode: open }).allowed).toBe(true)
    // 'invite': Einlösung ja, Zugang ohne Zeile trotzdem nein.
    expect(admissionAllowsRedeem('invite')).toBe(true)
    expect(decideBrandAccess({ ...base, admissionMode: 'invite' }).allowed).toBe(false)
  })
})
