import { describe, expect, it } from 'vitest'
import {
  preferredSeamSecret,
  seamSecretCandidates,
  seamSecretMatches,
} from '../server/utils/sharedSeamSecret'

/**
 * WER SPRICHT HIER EIGENTLICH MIT WEM — gemessen, nicht angenommen
 * (2026-08-19; die erste Fassung dieses Tests hat sich genau hier geirrt).
 *
 * `onboarding-service` liegt auf DREI Deployments mit demselben Wert, und die
 * Rollen sind NICHT symmetrisch. Sie ergeben sich daraus, welcher Layer wo
 * montiert ist:
 *
 *   platform   sendet an admin (49 Service-Routen: Community anlegen, Team,
 *              Switcher-Handoff). Sie EMPFÄNGT NIE — der einzige Empfänger
 *              `requireControlCaller` lebt im `domains`-Layer, und den zieht
 *              apps/platform nicht.
 *   admin      empfängt von platform UND von portfolio, und sendet an
 *              portfolio (Domain-Settle). Hier — und NUR hier — ist dieselbe
 *              Ablage-Zeile gleichzeitig Annahme- und Sende-Wert.
 *   portfolio  empfängt von admin und sendet im selben Handler zurück
 *              (`settle.post.ts` ruft `/api/control/site/domain/host`). Es ist
 *              das letzte verbliebene Silo-Deployment.
 *
 * FOLGE FÜR DIE ROTATION: für das Paar platform→admin ist die Zusage
 * „erst Empfänger, dann Sender" vollständig richtig und fensterlos. Das
 * Fenster entsteht ausschliesslich an der Kante admin→portfolio, weil ein
 * Eintrag in der Ablage von admin dort zugleich den GESENDETEN Wert umstellt.
 *
 * Und es lässt sich dort auch nicht wegsortieren: portfolio hat keinen
 * `NUXT_INSTANCE_SECRETS_KEY`, also keine Ablage, also genau EINEN gültigen
 * Wert aus der Env. Wer zuerst portfolio umstellt, bricht admin→portfolio von
 * der anderen Seite. Solange dort keine Ablage existiert, ist die Kante nur
 * mit einem kurzen, bewusst gelegten Fenster zu drehen — nicht ohne.
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

describe('platform → admin: reiner Sender auf reinen Empfänger, fensterlos', () => {
  it('Empfänger zuerst: der noch nicht umgestellte Sender kommt weiter durch', () => {
    const platform = { env: ALT }
    const admin = { konsole: NEU, env: ALT }
    expect(nahtTraegt(platform, admin)).toBe(true)
  })

  it('und nach dem zweiten Schritt ebenso', () => {
    expect(nahtTraegt({ konsole: NEU, env: ALT }, { konsole: NEU, env: ALT })).toBe(true)
  })

  it('umgekehrt begonnen bräche sie — deshalb steht die Reihenfolge auf der Karte', () => {
    expect(nahtTraegt({ konsole: NEU, env: ALT }, { env: ALT })).toBe(false)
  })
})

describe('admin ↔ portfolio: hier sitzt das Fenster, und zwar unvermeidlich', () => {
  it('Ausgangslage: beide Kanten tragen', () => {
    const admin = { env: ALT }
    const portfolio = { env: ALT }
    expect(nahtTraegt(admin, portfolio)).toBe(true)
    expect(nahtTraegt(portfolio, admin)).toBe(true)
  })

  it('admin umgestellt: der Rückweg hält, der Hinweg fällt aus', () => {
    const admin = { konsole: NEU, env: ALT }
    const portfolio = { env: ALT }
    // portfolio → admin (der geschachtelte Rückruf) — hält, weil admin beide annimmt:
    expect(nahtTraegt(portfolio, admin)).toBe(true)
    // admin → portfolio (Domain-Settle) — fällt aus, bis portfolio nachzieht:
    expect(nahtTraegt(admin, portfolio)).toBe(false)
  })

  it('portfolio zuerst umgestellt bräche dieselbe Kante von der anderen Seite', () => {
    const admin = { env: ALT }
    const portfolio = { env: NEU }
    expect(nahtTraegt(admin, portfolio)).toBe(false)
  })

  it('weil portfolio ohne Ablage nur EINEN Wert kennt — daher rührt die Unvermeidbarkeit', () => {
    const ohneAblage = { env: ALT }
    expect(seamSecretCandidates(ohneAblage.konsole, ohneAblage.env)).toHaveLength(1)
    const mitAblage = { konsole: NEU, env: ALT }
    expect(seamSecretCandidates(mitAblage.konsole, mitAblage.env)).toHaveLength(2)
  })

  it('nach beiden Schritten tragen wieder beide Kanten', () => {
    const admin = { konsole: NEU, env: ALT }
    const portfolio = { env: NEU }
    expect(nahtTraegt(admin, portfolio)).toBe(true)
    expect(nahtTraegt(portfolio, admin)).toBe(true)
  })
})

describe('der alte Wert bleibt gültig, bis die Env geräumt ist', () => {
  it('mit Env-Rückfall angenommen, ohne ihn nicht mehr', () => {
    expect(seamSecretMatches(ALT, seamSecretCandidates(NEU, ALT))).toBe(true)
    expect(seamSecretMatches(ALT, seamSecretCandidates(NEU, undefined))).toBe(false)
  })
})
