import { describe, expect, it } from 'vitest'
import { extractJsonObject } from '../server/utils/aiComplete'

/**
 * DER ZUSCHNITT AUF DAS ÄUSSERE OBJEKT — die Sicherung gegen den Fehler vom
 * 2026-09-05: das alte `replace(/\}[\s\S]*$/, '}')` griff am ERSTEN `}` und
 * verstümmelte jede Antwort mit einem verschachtelten Objekt. Der erste Test
 * ist deshalb der wichtigste; die anderen halten fest, was der Zuschnitt
 * weiterhin leisten muss (Zaun, Plauderei, Leeres).
 */
describe('extractJsonObject', () => {
  it('lässt ein Objekt mit verschachtelten Objekten UNVERSEHRT', () => {
    const raw = '{"items":[{"id":"a1","score":0},{"id":"a2","score":1}]}'
    expect(extractJsonObject(raw)).toBe(raw)
    expect(JSON.parse(extractJsonObject(raw))).toEqual({ items: [{ id: 'a1', score: 0 }, { id: 'a2', score: 1 }] })
  })

  it('schält einen ```json-Zaun mit Vor- und Nachtext ab', () => {
    const raw = 'Here is the result:\n```json\n{"items":[{"id":"a1"}]}\n```\nHope that helps.'
    expect(extractJsonObject(raw)).toBe('{"items":[{"id":"a1"}]}')
  })

  it('geschweifte Klammern IN Zeichenketten stören nicht — es zählt die letzte', () => {
    const raw = '{"note":"a } in text","items":[{"id":"a1"}]}'
    expect(JSON.parse(extractJsonObject(raw))).toMatchObject({ note: 'a } in text' })
  })

  it('ohne Klammern kommt der getrimmte Text zurück — der Aufrufer sieht den Parse-Fehler', () => {
    expect(extractJsonObject('  no json here  ')).toBe('no json here')
    expect(extractJsonObject('')).toBe('')
    expect(extractJsonObject('} {')).toBe('} {')
  })
})
