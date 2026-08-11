import { describe, expect, it } from 'vitest'
import { controlExitTarget } from '../shared/controlExit'

/**
 * Die zwei Ausgänge des Community-Switchers als ZIEL (F50-Nachtrag,
 * 2026-08-08). Drei Zusagen, jede einzeln nagelbar: jeder Ausgang holt sich
 * seine Host-Liste, der erste brauchbare Eintrag gewinnt, und ohne
 * Kontroll-Host gibt es kein Ziel (die Route antwortet dann 404, statt auf
 * einen leeren Host zu siegeln).
 */
describe('controlExitTarget', () => {
  it('„anlegen" geht auf den WIZARD-Host, „verwalten" auf den Kundenbereich', () => {
    const tenancy = {
      controlHosts: ['app.localhost'],
      wizardHosts: ['start.localhost'],
    }
    expect(controlExitTarget('create', tenancy)).toEqual({ host: 'start.localhost', path: '/start' })
    expect(controlExitTarget('manage', tenancy)).toEqual({ host: 'app.localhost', path: '/communities' })
  })

  /**
   * AH-1 (2026-08-11): mit nur noch EINEM Kontroll-Host ist `wizardHosts` in
   * Produktion leer. Vorher hätte „anlegen" damit `null` geliefert und wäre
   * still aus dem Menü verschwunden — der Rückfall auf den Kontroll-Host ist
   * kein Raten, `/start` liegt dort.
   */
  it('fällt ohne Wizard-Host auf `<controlHost>/start` zurück', () => {
    const prod = { controlHosts: ['account.pukalani.app'], wizardHosts: [] }
    expect(controlExitTarget('create', prod)).toEqual({ host: 'account.pukalani.app', path: '/start' })
    expect(controlExitTarget('manage', prod)).toEqual({ host: 'account.pukalani.app', path: '/communities' })
    // Auch ohne das Feld überhaupt.
    expect(controlExitTarget('create', { controlHosts: ['account.pukalani.app'] }))
      .toEqual({ host: 'account.pukalani.app', path: '/start' })
  })

  it('rät nichts aus der jeweils anderen Liste, wo es nichts zu holen gibt', () => {
    // Umgekehrt gilt der Rückfall NICHT: eine Wizard-Liste macht noch keinen
    // Kundenbereich — `/communities` gibt es nur auf einem Kontroll-Host.
    expect(controlExitTarget('manage', { wizardHosts: ['start.localhost'] })).toBeNull()
  })

  it('nimmt den ersten nicht-leeren Eintrag und trimmt ihn', () => {
    expect(controlExitTarget('manage', { controlHosts: ['  ', ' account.pukalani.app '] }))
      .toEqual({ host: 'account.pukalani.app', path: '/communities' })
    expect(controlExitTarget('create', { wizardHosts: ['start.localhost', 'start.example.com'] }))
      .toEqual({ host: 'start.localhost', path: '/start' })
  })

  it('liefert null ohne konfigurierte Hosts (Silo, Playground)', () => {
    expect(controlExitTarget('create', {})).toBeNull()
    expect(controlExitTarget('manage', {})).toBeNull()
    expect(controlExitTarget('create', { wizardHosts: [] })).toBeNull()
    expect(controlExitTarget('manage', { controlHosts: ['', '   '] })).toBeNull()
  })
})
