import { describe, expect, it } from 'vitest'
import { switcherExternalLink } from '../shared/communitySwitcherLinks'

/**
 * Die zwei Ausgänge des Community-Switchers (F50, 2026-08-07): sie verlassen
 * den Mandanten-Host, müssen also absolut sein — und dürfen bei fehlender
 * Config lieber gar nicht erscheinen als kaputt.
 */
describe('switcherExternalLink', () => {
  it('baut eine absolute https-URL aus dem ERSTEN Host', () => {
    // Seit AH-1 tragen beide Ausgänge denselben Host — der Anlege-Ausgang
    // bekommt ihn über `resolveWizardHosts()` (core), nicht von hier.
    expect(switcherExternalLink(['account.pukalani.app'], '/communities'))
      .toBe('https://account.pukalani.app/communities')
    expect(switcherExternalLink(['account.pukalani.app'], '/start'))
      .toBe('https://account.pukalani.app/start')
    expect(switcherExternalLink(['start.localhost', 'app.localhost'], '/start'))
      .toBe('http://start.localhost/start')
  })

  it('spricht lokal http (Entwicklungs-Hosts)', () => {
    expect(switcherExternalLink(['app.localhost'], '/communities')).toBe('http://app.localhost/communities')
    expect(switcherExternalLink(['localhost'], '/start')).toBe('http://localhost/start')
  })

  it('überspringt leere Einträge', () => {
    expect(switcherExternalLink(['  ', 'account.pukalani.app'], '/communities'))
      .toBe('https://account.pukalani.app/communities')
  })

  it('liefert leer, wenn kein Host konfiguriert ist — dann fehlt der Menüpunkt', () => {
    expect(switcherExternalLink(undefined, '/start')).toBe('')
    expect(switcherExternalLink([], '/start')).toBe('')
    expect(switcherExternalLink(['', '   '], '/start')).toBe('')
  })
})
