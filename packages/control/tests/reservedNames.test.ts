import { describe, expect, it } from 'vitest'
import { isReservedHost, RESERVED_SUBDOMAINS } from '../schemas/tenant'
import { decideReservedNameCreate, RESERVED_NAME_MAX } from '../shared/reservedNames'

/**
 * Die Regel fürs Sperren eines Namens (control-027).
 *
 * Sie ist PURE, damit genau das hier ohne Appwrite geht: dass ein System-Name
 * NICHT als Betreiber-Eintrag durchrutscht (er wäre Doppelpflege und sähe
 * löschbar aus, ohne es zu sein) und dass die Längengrenze der Appwrite-Row-Id
 * eingehalten wird — der Name IST die Row-Id.
 */

describe('decideReservedNameCreate', () => {
  it('nimmt einen gewöhnlichen Namen an und normalisiert ihn', () => {
    expect(decideReservedNameCreate('presse', RESERVED_SUBDOMAINS)).toEqual({ ok: true, name: 'presse' })
    // trim + lowercase: „Presse " und „presse" sind derselbe Host — zwei Zeilen
    // dafür wären eine wirkungslos.
    expect(decideReservedNameCreate('  Presse  ', RESERVED_SUBDOMAINS)).toEqual({ ok: true, name: 'presse' })
    expect(decideReservedNameCreate('TEAM-2026', RESERVED_SUBDOMAINS)).toEqual({ ok: true, name: 'team-2026' })
  })

  it('erlaubt Bindestriche und Ziffern in der Mitte', () => {
    for (const name of ['a', 'a1', 'x-y', 'ab-cd-ef', '2026', 'a'.repeat(RESERVED_NAME_MAX)]) {
      expect(decideReservedNameCreate(name, RESERVED_SUBDOMAINS).ok, name).toBe(true)
    }
  })

  it('lehnt ungültige Namen ab', () => {
    const invalid = [
      '', '   ',
      // Sonderzeichen/Umlaute/Punkte — DNS-Label, kein Freitext
      'presse!', 'pres_se', 'pres se', 'preßé', 'a.b', 'x/y',
      // Bindestrich am Anfang oder Ende
      '-presse', 'presse-',
      // zu lang: die Row-Id fasst 36 Zeichen, 37 und 41 fallen beide durch
      'a'.repeat(RESERVED_NAME_MAX + 1), 'a'.repeat(41),
    ]
    for (const name of invalid) {
      expect(decideReservedNameCreate(name, RESERVED_SUBDOMAINS), name).toEqual({ ok: false, reason: 'invalid' })
    }
  })

  it('Großbuchstaben allein sind kein Fehler — sie werden kleingeschrieben', () => {
    expect(decideReservedNameCreate('PRESSE', RESERVED_SUBDOMAINS)).toEqual({ ok: true, name: 'presse' })
  })

  it('lehnt System-Namen mit eigenem Grund ab (nicht als „ungültig“)', () => {
    for (const name of ['login', 'api', 'control', 'www', 'Login', ' start ']) {
      expect(decideReservedNameCreate(name, RESERVED_SUBDOMAINS), name).toEqual({ ok: false, reason: 'system' })
    }
  })

  it('prüft gegen die übergebene Menge, nicht gegen eine eingebaute', () => {
    const eigene = new Set(['presse'])
    expect(decideReservedNameCreate('presse', eigene)).toEqual({ ok: false, reason: 'system' })
    expect(decideReservedNameCreate('login', eigene)).toEqual({ ok: true, name: 'login' })
  })
})

/**
 * Die Basisliste wirkt über `isReservedHost` — das ist die Stelle, an der ein
 * Selbstbedienungs-Kunde abprallt. Geprüft werden hier die Namen, die NICHT
 * für ein Deployment stehen und deshalb am ehesten durchrutschen: unter
 * `platform` und `communities` läuft keine Seite (beide antworten 404), sie
 * sind Infrastruktur- bzw. Auswertungs-Namen. Genau deshalb muss die Sperre
 * ausdrücklich getestet sein: ein „ist doch frei" ist hier nachweisbar falsch.
 */
describe('isReservedHost', () => {
  it('sperrt Infrastruktur- und Auswertungs-Namen unter der Betreiber-Domain', () => {
    for (const host of [
      'platform.pukalani.app',
      'communities.pukalani.app',
      'control.pukalani.app',
      'admin.pukalani.app',
      // erste Ebene entscheidet — auch tiefer gestaffelt bleibt es gesperrt
      'foo.functions.pukalani.app',
      // der Apex selbst
      'pukalani.app',
    ]) {
      expect(isReservedHost(host), host).toBe(true)
    }
  })

  it('lässt gewöhnliche Community-Hosts und fremde Domains durch', () => {
    for (const host of [
      'freelancer.pukalani.app',
      'kunde.pukalani.app',
      // Kundendomains liegen nicht unter dem Apex — dort hat die Liste nichts
      // zu sagen, auch wenn das Label zufällig gesperrt klingt
      'freelancer.supply',
      'platform.kunde.de',
    ]) {
      expect(isReservedHost(host), host).toBe(false)
    }
  })
})
