import { describe, expect, it } from 'vitest'
import { legacyControlRedirect } from '../shared/legacyControlHosts'

/**
 * Die 301 der abgeschalteten Kontroll-Host-Namen (AH-1, 2026-08-11).
 *
 * Der teuerste Fehler wäre hier ein VERLORENER Einladungs-Code: die Mail ist
 * sieben Tage gültig, der Link zeigte bis zum Cutover auf `start.pukalani.app`
 * und trägt seine Absicht in der Query. Deshalb steht die Query-Zusage als
 * eigener Fall da, nicht als Beiwerk eines Pfad-Tests.
 */
const LEGACY = ['my.pukalani.app', 'start.pukalani.app']
const TARGET = 'account.pukalani.app'

describe('legacyControlRedirect', () => {
  it('leitet beide Altnamen auf den heutigen Kundenbereich', () => {
    expect(legacyControlRedirect('my.pukalani.app', '/', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/')
    expect(legacyControlRedirect('start.pukalani.app', '/', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/')
  })

  it('nimmt Pfad UND Query unverändert mit — der Einladungs-Code überlebt', () => {
    expect(legacyControlRedirect('start.pukalani.app', '/?code=PUKA-1234', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/?code=PUKA-1234')
    expect(legacyControlRedirect('my.pukalani.app', '/de/communities?x=1&y=2', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/de/communities?x=1&y=2')
    expect(legacyControlRedirect('my.pukalani.app', '/join?token=abc', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/join?token=abc')
  })

  it('vergleicht ohne Rücksicht auf Groß-/Kleinschreibung und Port', () => {
    expect(legacyControlRedirect('MY.Pukalani.App', '/login', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/login')
    expect(legacyControlRedirect('my.pukalani.app:443', '/login', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/login')
  })

  it('rührt jeden anderen Host nicht an', () => {
    // Mandanten-Hosts, der Zielhost selbst, Präfix-Tricks und Leerwerte: alles
    // läuft weiter wie bisher (Tenant-Auflösung bzw. 404).
    for (const host of ['account.pukalani.app', 'kunde-a.pukalani.app', 'my.pukalani.app.evil.com', 'pukalani.app', '', undefined, null]) {
      expect(legacyControlRedirect(host, '/', LEGACY, TARGET), String(host)).toBeNull()
    }
  })

  it('tut ohne Alt-Liste oder ohne Ziel gar nichts', () => {
    expect(legacyControlRedirect('my.pukalani.app', '/', [], TARGET)).toBeNull()
    expect(legacyControlRedirect('my.pukalani.app', '/', LEGACY, '')).toBeNull()
    expect(legacyControlRedirect('my.pukalani.app', '/', LEGACY, '   ')).toBeNull()
  })

  it('verweigert die Schleife, wenn das Ziel selbst in der Alt-Liste steht', () => {
    // Ein Tippfehler in einer Env darf höchstens ein 404 kosten, nie einen
    // Kundenbereich, der sich endlos auf sich selbst weiterleitet.
    expect(legacyControlRedirect('my.pukalani.app', '/', ['my.pukalani.app', 'account.pukalani.app'], TARGET))
      .toBeNull()
  })

  it('spricht lokal http (dieselbe Schema-Regel wie die Mail-Links)', () => {
    expect(legacyControlRedirect('my.localhost', '/start', ['my.localhost'], 'app.localhost'))
      .toBe('http://app.localhost/start')
  })

  it('klebt einen Pfad ohne führenden Schrägstrich nicht an den Host', () => {
    expect(legacyControlRedirect('my.pukalani.app', 'login', LEGACY, TARGET))
      .toBe('https://account.pukalani.app/login')
  })
})
