import { describe, expect, it } from 'vitest'
import {
  type BrandInviteViewInput,
  type BrandInviteViewState,
  inviteViewState,
} from '../shared/brandInviteView'

/**
 * Der Zustand der Einladungs-Seite, ohne Browser nachprüfbar.
 *
 * Warum das ein Test und keine Sichtprüfung ist: die Seite hat SECHS Zustände
 * aus FÜNF Tatsachen. Von den 48 möglichen Kombinationen (2×2×2×2×3) ist im
 * Betrieb höchstens eine Handvoll je Person zu sehen — die Fehler stecken
 * genau in den anderen. Deshalb wird hier die VOLLSTÄNDIGE Wahrheitstafel
 * durchgezählt und nicht eine Auswahl von Beispielen.
 *
 * Jede Regel hat zusätzlich ihre GEGENPROBE: eine Prüfung, die nur den
 * erlaubten Fall zeigt, wäre auch dann grün, wenn die Funktion immer denselben
 * Zustand zurückgäbe.
 */

const base: BrandInviteViewInput = {
  hasCode: true,
  valid: true,
  loggedIn: true,
  verified: true,
  redeemed: null,
}

describe('inviteViewState', () => {
  it('zeigt ohne Code das Eingabefeld — egal, wer davorsteht', () => {
    for (const loggedIn of [false, true]) {
      for (const verified of [false, true]) {
        expect(inviteViewState({ ...base, hasCode: false, loggedIn, verified })).toBe('enterCode')
      }
    }
    // GEGENPROBE: mit Code ist es NICHT mehr der Eingabe-Zustand.
    expect(inviteViewState(base)).not.toBe('enterCode')
  })

  it('lehnt einen untauglichen Code neutral ab, bevor die Person zählt', () => {
    for (const loggedIn of [false, true]) {
      for (const verified of [false, true]) {
        expect(inviteViewState({ ...base, valid: false, loggedIn, verified })).toBe('invalid')
      }
    }
    // GEGENPROBE: derselbe Mensch mit gültigem Code sieht etwas anderes.
    expect(inviteViewState({ ...base, valid: true })).not.toBe('invalid')
  })

  it('bietet ohne Konto die Registrierung an', () => {
    // `verified` ist ohne Konto bedeutungslos und darf den Zustand nicht kippen.
    expect(inviteViewState({ ...base, loggedIn: false, verified: false })).toBe('register')
    expect(inviteViewState({ ...base, loggedIn: false, verified: true })).toBe('register')
    // GEGENPROBE
    expect(inviteViewState({ ...base, loggedIn: true })).not.toBe('register')
  })

  it('verlangt vor der Einlösung die bestätigte Adresse', () => {
    expect(inviteViewState({ ...base, verified: false })).toBe('verifyPending')
    // Auch ein bereits abgelehnter Versuch ändert daran nichts: unbestätigt
    // ist unbestätigt, und der Weg heraus ist die Mail, nicht ein zweiter Klick.
    expect(inviteViewState({ ...base, verified: false, redeemed: false })).toBe('verifyPending')
    // GEGENPROBE
    expect(inviteViewState({ ...base, verified: true })).not.toBe('verifyPending')
  })

  it('löst ein, sobald alle drei Vorbedingungen stehen', () => {
    expect(inviteViewState(base)).toBe('redeeming')
  })

  it('bleibt beim Erfolg im Einlöse-Zustand — der Ausgang ist die Weiterleitung', () => {
    expect(inviteViewState({ ...base, redeemed: true })).toBe('redeeming')
  })

  it('unterscheidet „noch nicht gefragt" von „abgelehnt"', () => {
    expect(inviteViewState({ ...base, redeemed: null })).toBe('redeeming')
    expect(inviteViewState({ ...base, redeemed: false })).toBe('denied')
    // GEGENPROBE gegen ein zweiwertiges Feld: wäre `null` wie `false`, stünde
    // die Ablehnung schon da, bevor irgendjemand gefragt hat.
    expect(inviteViewState({ ...base, redeemed: null }))
      .not.toBe(inviteViewState({ ...base, redeemed: false }))
  })

  it('ist über die VOLLSTÄNDIGE Wahrheitstafel eindeutig und lückenlos', () => {
    const seen = new Set<BrandInviteViewState>()
    let count = 0
    for (const hasCode of [false, true]) {
      for (const valid of [false, true]) {
        for (const loggedIn of [false, true]) {
          for (const verified of [false, true]) {
            for (const redeemed of [null, false, true] as const) {
              const result = inviteViewState({ hasCode, valid, loggedIn, verified, redeemed })
              expect(result, JSON.stringify({ hasCode, valid, loggedIn, verified, redeemed }))
                .toMatch(/^(enterCode|invalid|register|verifyPending|redeeming|denied)$/)
              seen.add(result)
              count += 1
            }
          }
        }
      }
    }
    expect(count).toBe(48)
    // Jeder der sechs Zustände ist erreichbar — ein toter Zweig wäre eine
    // Ansicht, die niemand je zu sehen bekommt.
    expect([...seen].sort()).toEqual(
      ['denied', 'enterCode', 'invalid', 'redeeming', 'register', 'verifyPending'],
    )
  })
})
