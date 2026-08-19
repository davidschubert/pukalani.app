import { describe, it, expect } from 'vitest'
import {
  preferredSeamSecret,
  seamSecretCandidates,
  seamSecretMatches,
} from '../server/utils/sharedSeamSecret'

/**
 * DIE DUAL-ACCEPT-REGEL (A0, 2026-08-18) — die Hälfte der Naht, die man ohne
 * zwei laufende Deployments prüfen kann.
 *
 * Was hier NICHT geprüft wird und warum: die Rotation ÜBER die Naht (Wert in
 * der Konsole des Empfängers, dann des Senders) bräuchte zwei Dev-Server plus
 * zwei Appwrite-Projekte — das F12-Muster, und dort hat es einen halben Tag
 * gekostet, den zweiten Dienst ehrlich zu bekommen. Die Aussage, die dabei
 * herauskäme, steckt vollständig in diesen drei Funktionen: Sender nimmt den
 * ERSTEN Kandidaten, Empfänger nimmt JEDEN. Der Rest ist Verdrahtung, und die
 * hält der Typ.
 */

describe('seamSecretCandidates — die Menge der gültigen Werte', () => {
  it('nimmt beide, Ablage zuerst', () => {
    expect(seamSecretCandidates('neu', 'alt')).toEqual(['neu', 'alt'])
  })

  it('wirft leere und nur-Leerzeichen weg', () => {
    expect(seamSecretCandidates('', 'alt')).toEqual(['alt'])
    expect(seamSecretCandidates('   ', 'alt')).toEqual(['alt'])
    expect(seamSecretCandidates('neu', undefined)).toEqual(['neu'])
    expect(seamSecretCandidates(undefined, undefined)).toEqual([])
  })

  it('trimmt — eine Zeile aus der Konsole trägt gern ein Leerzeichen', () => {
    expect(seamSecretCandidates(' neu ', 'alt')).toEqual(['neu', 'alt'])
  })

  it('nennt denselben Wert nur EINMAL', () => {
    // Der Normalzustand nach abgeschlossener Rotation: in Konsole und Env
    // steht dasselbe. Zweimal prüfen wäre doppelte Arbeit ohne Aussage.
    expect(seamSecretCandidates('gleich', 'gleich')).toEqual(['gleich'])
  })
})

describe('preferredSeamSecret — was der SENDER schickt', () => {
  it('nimmt die Ablage, wenn es eine gibt', () => {
    expect(preferredSeamSecret('neu', 'alt')).toBe('neu')
  })

  it('fällt auf die Env zurück', () => {
    expect(preferredSeamSecret('', 'alt')).toBe('alt')
    expect(preferredSeamSecret(undefined, 'alt')).toBe('alt')
  })

  it('gibt "" wenn nichts konfiguriert ist — der Aufrufer entscheidet 404/503', () => {
    expect(preferredSeamSecret('', '')).toBe('')
    expect(preferredSeamSecret(undefined, undefined)).toBe('')
  })
})

describe('seamSecretMatches — was der EMPFÄNGER annimmt', () => {
  const accepted = ['neu', 'alt']

  it('nimmt JEDEN Wert aus der Menge an — das ist die ganze Rotation', () => {
    expect(seamSecretMatches('neu', accepted)).toBe(true)
    expect(seamSecretMatches('alt', accepted)).toBe(true)
  })

  it('weist alles andere ab', () => {
    expect(seamSecretMatches('falsch', accepted)).toBe(false)
    expect(seamSecretMatches('neu ', accepted)).toBe(false)
    expect(seamSecretMatches('NEU', accepted)).toBe(false)
  })

  it('ein leerer Wert trifft nie — auch nicht gegen eine leere Menge', () => {
    // „Kein Header" ist keine Behauptung, sondern deren Abwesenheit. Und eine
    // leere Menge (nichts konfiguriert) darf niemanden durchlassen.
    expect(seamSecretMatches('', accepted)).toBe(false)
    expect(seamSecretMatches('', [])).toBe(false)
    expect(seamSecretMatches('irgendwas', [])).toBe(false)
  })

  it('leere Kandidaten in der Menge öffnen nichts', () => {
    // Sie sollten dort nie stehen (seamSecretCandidates räumt sie weg) — wenn
    // doch, dürfen sie kein Schlüsselloch sein.
    expect(seamSecretMatches('', ['', 'alt'])).toBe(false)
    expect(seamSecretMatches('alt', ['', 'alt'])).toBe(true)
  })

  it('vergleicht auch bei ungleicher Länge, ohne zu werfen', () => {
    // `timingSafeEqual` WIRFT bei ungleich langen Puffern — deshalb wird
    // vorher gehasht. Ein Längen-Check davor wäre selbst ein Seitenkanal.
    expect(() => seamSecretMatches('x', ['ein sehr viel längeres geheimnis'])).not.toThrow()
    expect(seamSecretMatches('x', ['ein sehr viel längeres geheimnis'])).toBe(false)
  })
})
