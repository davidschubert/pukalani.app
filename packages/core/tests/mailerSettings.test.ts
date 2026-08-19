import { describe, expect, it } from 'vitest'
import {
  EMPTY_MAILER_SETTINGS,
  mergeMailerSettings,
  parseMailerSettings,
  pickMailerSettings,
  toMailerView,
} from '../shared/mailerSettings'

const gespeichert = { host: 'smtp.alt', port: '587', user: 'u', pass: 'geheim', from: 'a@b.c' }

describe('mergeMailerSettings — das Passwort darf nicht verschwinden', () => {
  it('behält das alte Passwort, wenn das Feld leer bleibt', () => {
    // Der eigentliche Fall: jemand ändert nur den Absender.
    const neu = mergeMailerSettings(gespeichert, { ...gespeichert, pass: '', from: 'neu@b.c' })
    expect(neu.pass).toBe('geheim')
    expect(neu.from).toBe('neu@b.c')
  })

  it('ersetzt es, wenn eines mitkommt', () => {
    expect(mergeMailerSettings(gespeichert, { ...gespeichert, pass: 'neu' }).pass).toBe('neu')
  })

  it('kommt ohne bisherigen Stand aus', () => {
    expect(mergeMailerSettings(null, { ...EMPTY_MAILER_SETTINGS, host: 'h' }).pass).toBe('')
  })

  it('nimmt beim ERSTEN Eintrag das Passwort aus der Env', () => {
    // Die Falle, an der dieser Umzug gestorben wäre: das Formular ist mit den
    // Env-Werten vorausgefüllt, nur das Passwort-Feld ist leer. Wer das so
    // speichert, hätte sonst einen Block OHNE Passwort — und weil die Ablage
    // die Env schlägt, wäre der Versand ab diesem Klick still kaputt.
    const neu = mergeMailerSettings(null, { host: 'smtp.env', port: '587', user: 'u', pass: '', from: 'f' }, 'env-passwort')
    expect(neu.pass).toBe('env-passwort')
  })

  it('Reihenfolge: getippt schlägt gespeichert schlägt Env', () => {
    const getippt = mergeMailerSettings(gespeichert, { ...gespeichert, pass: 'neu' }, 'env-passwort')
    expect(getippt.pass).toBe('neu')
    const gespeichertGewinnt = mergeMailerSettings(gespeichert, { ...gespeichert, pass: '' }, 'env-passwort')
    expect(gespeichertGewinnt.pass).toBe('geheim')
  })

  it('trimmt alles ausser dem Passwort', () => {
    // Ein Passwort DARF vorne oder hinten ein Leerzeichen haben — trimmen
    // würde eine gültige Anmeldung stillschweigend kaputtmachen.
    const neu = mergeMailerSettings(null, { host: ' h ', port: ' 25 ', user: ' u ', pass: ' p ', from: ' f ' })
    expect(neu).toEqual({ host: 'h', port: '25', user: 'u', pass: ' p ', from: 'f' })
  })
})

describe('parseMailerSettings — fail-soft', () => {
  it('liest einen gespeicherten Block', () => {
    expect(parseMailerSettings(JSON.stringify(gespeichert))).toEqual(gespeichert)
  })

  it('gibt bei Unlesbarem null zurück, statt zu werfen', () => {
    for (const wert of ['{kaputt', '', null, undefined, '[1,2]', '"text"']) {
      expect(parseMailerSettings(wert)).toBeNull()
    }
  })

  it('ohne Host ist die Zeile so gut wie leer', () => {
    expect(parseMailerSettings(JSON.stringify({ ...gespeichert, host: '' }))).toBeNull()
  })
})

describe('pickMailerSettings — Ablage schlägt Env', () => {
  const env = { host: 'smtp.env', port: '25', user: '', pass: '', from: 'env@b.c' }

  it('nimmt die Ablage, wenn sie einen Host hat', () => {
    expect(pickMailerSettings(gespeichert, env)?.host).toBe('smtp.alt')
  })

  it('fällt sonst auf die Env zurück', () => {
    expect(pickMailerSettings(null, env)?.host).toBe('smtp.env')
    expect(pickMailerSettings({ ...gespeichert, host: '' }, env)?.host).toBe('smtp.env')
  })

  it('null heisst: es gibt keinen Versandweg', () => {
    expect(pickMailerSettings(null, EMPTY_MAILER_SETTINGS)).toBeNull()
  })
})

describe('toMailerView — das Passwort verlässt den Server nie', () => {
  it('meldet nur, DASS eines gesetzt ist', () => {
    const view = toMailerView(gespeichert)
    expect(view).toEqual({ host: 'smtp.alt', port: '587', user: 'u', from: 'a@b.c', hasPassword: true })
    expect(JSON.stringify(view)).not.toContain('geheim')
  })
})
