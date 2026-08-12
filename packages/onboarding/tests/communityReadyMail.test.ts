import { describe, expect, it } from 'vitest'
import { buildCommunityReadyMail, formatMailDate } from '../shared/communityReadyMail'

const BASE = {
  siteName: 'Chorverein Wetzlar',
  host: 'chor-wetzlar.pukalani.app',
  accountHost: 'account.pukalani.app',
  trialEndsAt: '2026-08-26T09:15:00.000Z',
}

describe('formatMailDate', () => {
  it('deutsch TT.MM.JJJJ, englisch JJJJ-MM-TT', () => {
    expect(formatMailDate('2026-08-26T09:15:00.000Z', true)).toBe('26.08.2026')
    expect(formatMailDate('2026-08-26T09:15:00.000Z', false)).toBe('2026-08-26')
  })
  it('unlesbares Datum ⇒ leer (der Absatz entfällt, die Mail geht trotzdem)', () => {
    expect(formatMailDate('irgendwann', true)).toBe('')
  })
})

describe('buildCommunityReadyMail', () => {
  it('deutsch: Adresse, Dashboard mit /de-Prefix, Kundenbereich, Testphasen-Ende', () => {
    const mail = buildCommunityReadyMail({ ...BASE, locale: 'de' })
    expect(mail.subject).toBe('Deine Community steht: Chorverein Wetzlar')
    expect(mail.text).toContain('https://chor-wetzlar.pukalani.app')
    expect(mail.text).toContain('https://chor-wetzlar.pukalani.app/de/dashboard')
    expect(mail.text).toContain('https://account.pukalani.app/de')
    expect(mail.text).toContain('26.08.2026')
  })
  it('englisch: kein Sprach-Prefix (prefix_except_default)', () => {
    const mail = buildCommunityReadyMail({ ...BASE, locale: 'en' })
    expect(mail.subject).toBe('Your community is live: Chorverein Wetzlar')
    expect(mail.text).toContain('https://chor-wetzlar.pukalani.app/dashboard')
    expect(mail.text).not.toContain('/de/dashboard')
    expect(mail.text).toContain('2026-08-26')
  })
  it('unbekannte Sprache fällt auf Deutsch zurück (wie die Einladungs-Mail)', () => {
    expect(buildCommunityReadyMail({ ...BASE, locale: 'fr' }).subject).toContain('Deine Community steht')
  })
  it('ohne Testphase entfällt der Absatz — der Rest bleibt vollständig', () => {
    const mail = buildCommunityReadyMail({ ...BASE, trialEndsAt: null, locale: 'de' })
    expect(mail.text).not.toContain('Testphase')
    expect(mail.text).toContain('https://chor-wetzlar.pukalani.app/de/dashboard')
    expect(mail.text).toContain('https://account.pukalani.app/de')
  })
  it('lokale Hosts bekommen http statt https (Dev/Beweisläufe)', () => {
    const mail = buildCommunityReadyMail({
      ...BASE, host: 'kunde-a.localhost:3002', accountHost: 'app.localhost:3002', locale: 'en',
    })
    expect(mail.text).toContain('http://kunde-a.localhost:3002/dashboard')
    expect(mail.text).toContain('http://app.localhost:3002')
    expect(mail.text).not.toContain('https://')
  })
})
