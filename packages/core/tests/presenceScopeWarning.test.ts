import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetPresenceScopeWarning, warnPresenceScopeMissingOnce } from '../server/utils/presence'

/**
 * AH-1 live erwischt (2026-08-11 → 2026-08-18): der neue account-Runtime-Key
 * wurde ohne `presences.read`/`presences.write` angelegt — Heartbeat und
 * Online-Zähler liefen auf JEDER Pool-Community in ein still verschlucktes
 * 401, eine Woche lang stand überall „0 online" ohne eine einzige Logzeile.
 *
 * Festgenagelt (dasselbe Muster wie die Mailer-Warnung, F44):
 * (1) GENAU der Scope-Fehler (`general_unauthorized_scope`) wird gemeldet —
 *     er ist sicher ein Konfigurationsfehler und heilt nie von selbst.
 * (2) Transiente Fehler bleiben still — Presence ist Zusatzschicht, ein
 *     kurzer Appwrite-Schluckauf darf das Log nicht fluten.
 * (3) Einmal pro Prozess — eine Zeile je 20-s-Heartbeat wäre Lärm, den man
 *     wegfiltert, und dann ist der Ausfall wieder unsichtbar.
 */
describe('Presence-Scope-Warnung', () => {
  beforeEach(() => {
    __resetPresenceScopeWarning()
  })

  const scopeError = Object.assign(new Error('app.account missing scopes (["presences.read"])'), {
    type: 'general_unauthorized_scope',
    code: 401,
  })

  it('meldet den Scope-Fehler genau EINMAL, egal wie oft er auftritt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnPresenceScopeMissingOnce(scopeError, 'presence.heartbeat')
    warnPresenceScopeMissingOnce(scopeError, 'presence.list')
    warnPresenceScopeMissingOnce(scopeError, 'presence.leave')
    expect(warn).toHaveBeenCalledTimes(1)
    const line = String(warn.mock.calls[0]?.[0] ?? '')
    expect(line).toContain('presence.scope_missing')
    expect(line).toContain('presences.read')
    warn.mockRestore()
  })

  it('bleibt bei transienten Fehlern still (kein type / anderer type)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnPresenceScopeMissingOnce(new Error('fetch failed'), 'presence.heartbeat')
    warnPresenceScopeMissingOnce(Object.assign(new Error('nope'), { type: 'general_rate_limit_exceeded' }), 'presence.list')
    warnPresenceScopeMissingOnce(null, 'presence.leave')
    warnPresenceScopeMissingOnce(undefined, 'presence.leave')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('ein transienter Fehler verbraucht den Merker NICHT — der Scope-Fehler danach wird noch gemeldet', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnPresenceScopeMissingOnce(new Error('fetch failed'), 'presence.heartbeat')
    warnPresenceScopeMissingOnce(scopeError, 'presence.heartbeat')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
