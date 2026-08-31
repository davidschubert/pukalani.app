import { describe, expect, it } from 'vitest'
import { BRAND_ADMISSION_MODES } from '../shared/brandAccess'
import { type BrandInviteDecisionInput, decideBrandInvite } from '../shared/brandInvite'

/**
 * Die Einlöse-Regel, ohne Instanz nachprüfbar (Schema-Anhang §5). Jede Zeile
 * hat ihre GEGENPROBE: eine Prüfung, die nur den erlaubten Fall zeigt, wäre
 * auch dann grün, wenn die Funktion immer `true` zurückgäbe.
 */

const NOW = '2026-08-31T12:00:00.000Z'
const FUTURE = '2026-09-30T12:00:00.000Z'
const PAST = '2026-08-01T12:00:00.000Z'

const base: BrandInviteDecisionInput = {
  mode: 'invite',
  invite: { emailLower: 'beta@example.test', expiresAt: FUTURE },
  now: NOW,
  emailLower: 'beta@example.test',
}

describe('decideBrandInvite', () => {
  it('lässt einen gültigen Code im Modus invite durch', () => {
    expect(decideBrandInvite(base)).toEqual({ valid: true, reason: null })
  })

  it('nur `invite` schafft neuen Zugang — closed und open nicht', () => {
    const results = BRAND_ADMISSION_MODES.map(mode => [mode, decideBrandInvite({ ...base, mode }).valid] as const)
    // `open` sagt bewusst NEIN: dort hat jedes verifizierte Konto ohnehin
    // Zugang, eine zusätzliche `brand_access`-Zeile wäre nur Rauschen.
    expect(results).toEqual([['closed', false], ['invite', true], ['open', false]])
  })

  it('kein Treffer für den Hash', () => {
    expect(decideBrandInvite({ ...base, invite: null })).toEqual({ valid: false, reason: 'unknown' })
  })

  it('widerrufen schlägt alles andere', () => {
    const invite = { ...base.invite!, revokedAt: PAST }
    expect(decideBrandInvite({ ...base, invite })).toEqual({ valid: false, reason: 'revoked' })
  })

  it('bereits eingelöst', () => {
    const invite = { ...base.invite!, redeemedAt: PAST }
    expect(decideBrandInvite({ ...base, invite })).toEqual({ valid: false, reason: 'redeemed' })
  })

  it('abgelaufen — und ein FEHLENDES Ablaufdatum zählt genauso', () => {
    expect(decideBrandInvite({ ...base, invite: { ...base.invite!, expiresAt: PAST } }).reason).toBe('expired')
    expect(decideBrandInvite({ ...base, invite: { ...base.invite!, expiresAt: '' } }).reason).toBe('expired')
    // Gegenprobe: exakt jetzt ablaufend ist abgelaufen, eine Sekunde später nicht.
    expect(decideBrandInvite({ ...base, invite: { ...base.invite!, expiresAt: NOW } }).reason).toBe('expired')
  })

  it('bindet an die Adresse — und überspringt die Bindung nur, wenn sie unbekannt ist', () => {
    expect(decideBrandInvite({ ...base, emailLower: 'fremd@example.test' }))
      .toEqual({ valid: false, reason: 'email_mismatch' })
    // `null` = Vorab-Prüfung vor dem Login: der Code als solcher taugt.
    expect(decideBrandInvite({ ...base, emailLower: null })).toEqual({ valid: true, reason: null })
  })
})
