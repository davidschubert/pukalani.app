import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

/**
 * Die Zulassungs-Naht der Kontoanlage. Geprüft wird genau das, was sie zu einer
 * Einladung und nicht zu einer Hintertür macht: OHNE Provider bleibt zu, ein
 * WERFENDER Provider bleibt zu, und nur ein wörtliches „ja" öffnet.
 *
 * `logEvent` ist im Modul ein Nuxt-AUTO-IMPORT; im Test gibt es keinen, also
 * liegt es vorher auf `globalThis` (Muster von contentUpvotes.test.ts).
 */
const logEvent = vi.fn()
;(globalThis as unknown as { logEvent: unknown }).logEvent = logEvent

const {
  __resetSignupAdmissionProvider,
  getSignupAdmissionProvider,
  hasSignupAdmissionProvider,
  registerSignupAdmissionProvider,
  signupAdmissionOpensRegistration,
} = await import('../server/utils/signupAdmission')

const event = {} as H3Event

beforeEach(() => {
  __resetSignupAdmissionProvider()
  logEvent.mockClear()
})

describe('Registry', () => {
  it('ist leer, bis ein Layer etwas verdrahtet', () => {
    expect(hasSignupAdmissionProvider()).toBe(false)
    expect(getSignupAdmissionProvider()).toBeNull()
  })

  it('nimmt genau EINEN Provider und warnt beim Ersetzen', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = () => ({ opensRegistration: true })
    const second = () => ({ opensRegistration: false })
    registerSignupAdmissionProvider(first)
    expect(warn).not.toHaveBeenCalled()
    registerSignupAdmissionProvider(second)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(getSignupAdmissionProvider()).toBe(second)
    warn.mockRestore()
  })
})

describe('signupAdmissionOpensRegistration', () => {
  it('OHNE Provider bleibt die Registrierung zu (fail-closed)', async () => {
    // Der wichtigste Fall der Datei: jede App ohne Zulassungs-Layer (Silo,
    // Playground, CI) muss sich exakt wie vor dieser Naht verhalten.
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test', inviteCode: 'abc' })).toBe(false)
  })

  it('reicht E-Mail und Code unverändert an den Provider durch', async () => {
    const provider = vi.fn(() => ({ opensRegistration: true }))
    registerSignupAdmissionProvider(provider)
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test', inviteCode: 'code-1' })).toBe(true)
    expect(provider).toHaveBeenCalledWith(event, { email: 'a@example.test', inviteCode: 'code-1' })
  })

  it('trägt ein „nein" des Providers ebenso durch', async () => {
    registerSignupAdmissionProvider(() => ({ opensRegistration: false }))
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test', inviteCode: 'code-1' })).toBe(false)
  })

  it('fragt auch ohne Code — ein Provider darf allein an der Adresse entscheiden', async () => {
    const provider = vi.fn(async () => ({ opensRegistration: true }))
    registerSignupAdmissionProvider(provider)
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test' })).toBe(true)
    expect(provider).toHaveBeenCalledWith(event, { email: 'a@example.test', inviteCode: undefined })
  })

  it('fragt ohne E-Mail gar nicht erst', async () => {
    const provider = vi.fn(() => ({ opensRegistration: true }))
    registerSignupAdmissionProvider(provider)
    expect(await signupAdmissionOpensRegistration(event, { email: '', inviteCode: 'code-1' })).toBe(false)
    expect(provider).not.toHaveBeenCalled()
  })

  it('ein WERFENDER Provider öffnet nichts und wird protokolliert', async () => {
    registerSignupAdmissionProvider(() => {
      throw new Error('Tabelle nicht erreichbar')
    })
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test', inviteCode: 'code-1' })).toBe(false)
    expect(logEvent).toHaveBeenCalledTimes(1)
    expect(logEvent.mock.calls[0]?.[1]).toBe('auth.signup_admission_failed')
    // Keine Enumeration über die Logs: weder Adresse noch Code stehen darin.
    const payload = JSON.stringify(logEvent.mock.calls[0]?.[2] ?? {})
    expect(payload).not.toContain('a@example.test')
    expect(payload).not.toContain('code-1')
  })

  it('eine abgelehnte Zusage (Promise-Reject) öffnet ebenfalls nichts', async () => {
    registerSignupAdmissionProvider(async () => {
      throw new Error('Zeitüberschreitung')
    })
    expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test' })).toBe(false)
  })

  it('nur ein wörtliches `opensRegistration: true` öffnet', async () => {
    // Truthy-Werte sind kein Ja: eine kaputte oder ältere Provider-Fassung darf
    // die Tür nicht versehentlich aufstoßen.
    for (const answer of [undefined, null, {}, { opensRegistration: 'yes' }, { opensRegistration: 1 }]) {
      __resetSignupAdmissionProvider()
      registerSignupAdmissionProvider(() => answer as unknown as { opensRegistration: boolean })
      expect(await signupAdmissionOpensRegistration(event, { email: 'a@example.test' })).toBe(false)
    }
  })
})
