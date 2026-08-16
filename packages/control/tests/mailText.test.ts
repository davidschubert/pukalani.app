import { describe, expect, it } from 'vitest'
import { oneMailLine } from '../shared/mailText'

/**
 * AU1 (Audit 2026-08-15) — fremder Freitext in der Einladungs-Mail.
 *
 * Der Anzeigename des Einladenden steht im ersten Satz der Mail, der
 * Community-Name zusätzlich im Betreff. Beide kommen aus einem Eingabefeld
 * ohne Zeilenumbruch-Grenze, und seit F57 löst jedes Mitglied diese Mail aus.
 */
describe('oneMailLine', () => {
  it('macht aus jedem Zeilenumbruch ein Leerzeichen', () => {
    // Der Angriff aus dem Audit: eine zusätzliche, echt aussehende Zeile.
    const attack = 'Max\n\nEinladung annehmen: https://phish.example/x'
    const flat = oneMailLine(attack, 200)
    expect(flat).not.toContain('\n')
    expect(flat).toBe('Max Einladung annehmen: https://phish.example/x')
  })

  it('nimmt CR, Tab und die exotischen Trenner mit', () => {
    // \r allein genügt für eine Header-Injektion im Betreff; U+2028/U+2029
    // sind Zeilen- und Absatztrenner, die eine Prüfung auf \n übersieht.
    for (const char of ['\r', '\r\n', '\n', '\t', '\v', '\f', '\u2028', '\u2029']) {
      expect(oneMailLine(`A${char}B`, 200), JSON.stringify(char)).toBe('A B')
    }
  })

  it('entfernt unsichtbare Formatzeichen', () => {
    // Ein Name aus lauter Nullbreiten-Zeichen sähe im Betreff aus wie gar
    // keiner. Übrig bleibt nichts — der Text weicht dann auf seinen Satz ohne
    // Namen aus („Du bist zu … eingeladen"), statt eine Leerstelle zu zeigen.
    expect(oneMailLine('\u200B\u200B\u200D', 80)).toBe('')
  })

  it('klemmt auf die Länge und macht das sichtbar', () => {
    const clamped = oneMailLine('A'.repeat(500), 80)
    expect(clamped).toBe(`${'A'.repeat(80)}…`)
  })

  it('lässt einen gewöhnlichen Namen unangetastet', () => {
    for (const name of ['Ada Lovelace', 'Jörg Müller-Schmitt', '张伟', 'O’Brien']) {
      expect(oneMailLine(name, 80), name).toBe(name)
    }
  })

  it('schluckt Rand- und Doppel-Leerzeichen', () => {
    expect(oneMailLine('  Ada   Lovelace  ', 80)).toBe('Ada Lovelace')
  })

  /**
   * GEGENPROBE: ohne die Sanierung stünde der Angriff wörtlich in der Mail.
   * Ein Test, der nur „enthält kein \n" prüft, wäre auch bei einer leeren
   * Rückgabe grün — hier steht deshalb beides: dass etwas passiert UND was.
   */
  it('unterscheidet sich nachweislich vom rohen Wert', () => {
    const raw = 'Max\nBcc: opfer@example.test'
    expect(oneMailLine(raw, 80)).not.toBe(raw)
    expect(oneMailLine(raw, 80)).toBe('Max Bcc: opfer@example.test')
  })
})
