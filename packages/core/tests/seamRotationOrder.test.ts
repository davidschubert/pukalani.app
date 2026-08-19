import { describe, expect, it } from 'vitest'
import {
  preferredSeamSecret,
  seamSecretCandidates,
  seamSecretMatches,
} from '../server/utils/sharedSeamSecret'

/**
 * WARUM ES DIESEN TEST GIBT
 *
 * Die Rotations-Zusage lautet „Empfänger nimmt die Menge {Konsole, Env} an,
 * Sender schickt einen Wert — also erst beim Empfänger eintragen, dann beim
 * Sender, und niemand merkt etwas". Für eine EINSEITIGE Naht stimmt das
 * (`events-sweep`: der Cron sendet, der Sweep empfängt).
 *
 * Für die ZWEISEITIGE Naht `onboarding-service` stimmt es NICHT, und das ist
 * kein Fehler in der Regel, sondern eine Eigenschaft der Lage: dort ist jede
 * Seite Empfänger UND Sender über DIESELBE Sorte. Ein Konsolen-Eintrag ändert
 * deshalb beides auf einmal — was die Seite annimmt (gut) und was sie sendet
 * (zu früh). Zwischen den zwei Einträgen ist genau EINE Richtung tot.
 *
 * Das ist auszuhalten, solange man weiss, WELCHE. Die Karte schickt den
 * Betreiber deshalb zuerst auf die Betreiber-Konsole: dann fällt in der Lücke
 * `control→site` aus (Domain freischalten, eine Handlung, die der Betreiber
 * in genau diesem Moment selbst nicht auslöst) statt `platform→control`
 * (Community anlegen, Team, Switcher — neun Aufrufer, alle kundenseitig).
 *
 * Dieser Test nagelt die Aussage fest, damit niemand die Karte später auf
 * „erst Empfänger" zurückkürzt, weil die kürzere Fassung eleganter klingt.
 */

/** Trägt die Naht in DIESER Richtung? Sender schickt seinen einen Wert, der
 *  Empfänger prüft ihn gegen seine Menge — genau wie zur Laufzeit. */
function nahtTraegt(
  sender: { konsole?: string, env?: string },
  empfaenger: { konsole?: string, env?: string },
): boolean {
  const geschickt = preferredSeamSecret(sender.konsole, sender.env)
  return seamSecretMatches(geschickt, seamSecretCandidates(empfaenger.konsole, empfaenger.env))
}

const ALT = 'wert-vor-der-rotation'
const NEU = 'wert-nach-der-rotation'

describe('einseitige Naht (events-sweep) — fensterlos, wie zugesagt', () => {
  it('Empfänger zuerst: der alte Sender kommt weiter durch', () => {
    const cron = { env: ALT }
    const sweep = { konsole: NEU, env: ALT }
    expect(nahtTraegt(cron, sweep)).toBe(true)
  })

  it('nach beiden Schritten trägt sie ebenfalls', () => {
    expect(nahtTraegt({ konsole: NEU, env: ALT }, { konsole: NEU, env: ALT })).toBe(true)
  })
})

describe('zweiseitige Naht (onboarding-service) — das Fenster ist echt', () => {
  it('Ausgangslage: beide Richtungen tragen', () => {
    const platform = { env: ALT }
    const admin = { env: ALT }
    expect(nahtTraegt(platform, admin)).toBe(true)
    expect(nahtTraegt(admin, platform)).toBe(true)
  })

  it('nur auf der Betreiber-Konsole eingetragen: control→site fällt aus, platform→control hält', () => {
    const platform = { env: ALT }
    const admin = { konsole: NEU, env: ALT }
    // Kundenseitig (Community anlegen, Switcher, Team) — MUSS halten:
    expect(nahtTraegt(platform, admin)).toBe(true)
    // Betreiberseitig (Domain freischalten) — fällt für die Dauer der Lücke aus:
    expect(nahtTraegt(admin, platform)).toBe(false)
  })

  it('umgekehrt begonnen träfe die Lücke die KUNDEN — deshalb steht die Reihenfolge auf der Karte', () => {
    const platform = { konsole: NEU, env: ALT }
    const admin = { env: ALT }
    expect(nahtTraegt(platform, admin)).toBe(false)
    expect(nahtTraegt(admin, platform)).toBe(true)
  })

  it('nach BEIDEN Einträgen tragen wieder beide Richtungen', () => {
    const beide = { konsole: NEU, env: ALT }
    expect(nahtTraegt(beide, beide)).toBe(true)
  })

  it('und der alte Wert bleibt gültig, bis die Env geräumt ist', () => {
    const beide = { konsole: NEU, env: ALT }
    expect(seamSecretMatches(ALT, seamSecretCandidates(beide.konsole, beide.env))).toBe(true)
    const geraeumt = { konsole: NEU }
    expect(seamSecretMatches(ALT, seamSecretCandidates(geraeumt.konsole, undefined))).toBe(false)
  })
})
