import { describe, expect, it } from 'vitest'
import { controlExitTarget } from '../shared/controlExit'

/**
 * Die zwei Ausgänge des Community-Switchers als ZIEL (F50-Nachtrag,
 * 2026-08-08). Drei Zusagen, jede einzeln nagelbar: jeder Ausgang holt sich
 * seine EIGENE Host-Liste, der erste brauchbare Eintrag gewinnt, und ohne
 * Kontroll-Host gibt es kein Ziel (die Route antwortet dann 404, statt auf
 * einen leeren Host zu siegeln).
 */
describe('controlExitTarget', () => {
  it('„anlegen" geht auf den WIZARD-Host, „verwalten" auf den Kundenbereich', () => {
    const tenancy = {
      controlHosts: ['my.pukalani.app', 'start.pukalani.app'],
      wizardHosts: ['start.pukalani.app'],
    }
    expect(controlExitTarget('create', tenancy)).toEqual({ host: 'start.pukalani.app', path: '/start' })
    expect(controlExitTarget('manage', tenancy)).toEqual({ host: 'my.pukalani.app', path: '/communities' })
  })

  it('rät nichts aus der jeweils ANDEREN Liste', () => {
    // Zwei eigene Achsen: fehlt die Wizard-Liste, gibt es keinen Anlege-Ausgang
    // — auch wenn `start.*` in den Kontroll-Hosts steht.
    expect(controlExitTarget('create', { controlHosts: ['my.pukalani.app', 'start.pukalani.app'] })).toBeNull()
    expect(controlExitTarget('manage', { wizardHosts: ['start.pukalani.app'] })).toBeNull()
  })

  it('nimmt den ersten nicht-leeren Eintrag und trimmt ihn', () => {
    expect(controlExitTarget('manage', { controlHosts: ['  ', ' my.pukalani.app '] }))
      .toEqual({ host: 'my.pukalani.app', path: '/communities' })
    expect(controlExitTarget('create', { wizardHosts: ['start.localhost', 'start.pukalani.app'] }))
      .toEqual({ host: 'start.localhost', path: '/start' })
  })

  it('liefert null ohne konfigurierte Hosts (Silo, Playground)', () => {
    expect(controlExitTarget('create', {})).toBeNull()
    expect(controlExitTarget('manage', {})).toBeNull()
    expect(controlExitTarget('create', { wizardHosts: [] })).toBeNull()
    expect(controlExitTarget('manage', { controlHosts: ['', '   '] })).toBeNull()
  })
})
