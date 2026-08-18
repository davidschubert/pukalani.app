import { describe, expect, it } from 'vitest'
import { roleLabelKey } from '../shared/roleLabel'
import { COMMUNITY_ROLES } from '../shared/communityAuthz'
import de from '../i18n/locales/de.json'
import en from '../i18n/locales/en.json'

/**
 * WELCHE ROLLE NENNT DAS KONTO-MENÜ? (Davids Frage 2026-08-17)
 *
 * Die Rolle entscheidet über jeden Menüpunkt, stand aber an keiner Stelle der
 * Oberfläche — man merkte sie nur daran, was FEHLT. Genau deshalb sah ein
 * fehlender Menüpunkt („Kurse") wie ein Fehler aus statt wie eine Regel.
 *
 * Getestet wird die REGEL, nicht die Anzeige: zwei Menüs in zwei Layern
 * (core/UserMenu.vue, admin/DashboardUserMenu.vue) lesen dieselbe Funktion, und
 * „sieht auf beiden Seiten gleich aus" wäre kein Beweis.
 */
describe('roleLabelKey', () => {
  it('nennt die COMMUNITY-Rolle, wo es eine gibt', () => {
    for (const role of COMMUNITY_ROLES) {
      expect(roleLabelKey(role, [])).toBe(`community.roles.${role}`)
    }
  })

  it('die Community-Rolle schlägt das Operator-Label — nicht umgekehrt', () => {
    // Auf einem Mandanten-Host hängt jede Sichtbarkeit an der Community-Rolle.
    // Ein Betreiber, der dort Redakteur ist, sieht auch das Menü eines
    // Redakteurs; sein Label als Rolle zu nennen wäre die falsche Antwort.
    expect(roleLabelKey('editor', ['admin'])).toBe('community.roles.editor')
  })

  it('ohne Community-Rolle das Operator-Label — der Silo-/Kontroll-Host-Fall', () => {
    expect(roleLabelKey(null, ['admin'])).toBe('community.operatorRoles.admin')
    expect(roleLabelKey(null, ['moderator'])).toBe('community.operatorRoles.moderator')
    // Beide Labels: admin gewinnt, es ist das umfassendere (ALL_CAPABILITIES).
    expect(roleLabelKey(null, ['moderator', 'admin'])).toBe('community.operatorRoles.admin')
  })

  it('ohne alles: KEINE Zeile statt einer Behauptung', () => {
    expect(roleLabelKey(null, [])).toBeNull()
    expect(roleLabelKey(null, undefined)).toBeNull()
    expect(roleLabelKey(undefined, null)).toBeNull()
    // Fremde Labels sind keine Rollen (Appwrite-Labels tragen auch anderes,
    // z.B. Community-Labels `label:<id>` aus A5).
    expect(roleLabelKey(null, ['6a7bc358002348a190ce', 'beta'])).toBeNull()
  })

  it('unbekannte Rolle wird NICHT genannt (fail-closed)', () => {
    // Sonst stünde am Ende ein roher i18n-Schlüssel im Menü — genau der
    // Fehler, den `check:i18n-keys` für Config-Schlüssel verhindert und der
    // im Fuß von comments.pukalani.app vier Tage lang zu sehen war.
    expect(roleLabelKey('superuser' as never, [])).toBeNull()
  })

  it('jeder gelieferte Schlüssel existiert in BEIDEN Sprachen', () => {
    // Das Netz unter der ganzen Funktion: ein Schlüssel ohne Übersetzung
    // rendert vue-i18n als Schlüssel-String.
    const read = (dict: unknown, key: string) =>
      key.split('.').reduce<unknown>((node, part) =>
        (typeof node === 'object' && node !== null) ? (node as Record<string, unknown>)[part] : undefined, dict)

    const keys = [
      ...COMMUNITY_ROLES.map(r => roleLabelKey(r, [])),
      roleLabelKey(null, ['admin']),
      roleLabelKey(null, ['moderator']),
    ].filter((k): k is string => k !== null)

    expect(keys).toHaveLength(7)
    for (const key of keys) {
      expect(typeof read(de, key), `de fehlt: ${key}`).toBe('string')
      expect(typeof read(en, key), `en fehlt: ${key}`).toBe('string')
    }
  })
})
