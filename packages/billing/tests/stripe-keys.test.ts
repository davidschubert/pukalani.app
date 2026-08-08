import { describe, expect, it } from 'vitest'
import {
  looksLikeStripeSecretKey,
  looksLikeStripeWebhookSecret,
  secretTail,
  stripeModeFromKey,
  webhookSecretOrigin,
} from '../shared/stripeKeys'

describe('secretTail — was die Oberfläche sehen darf', () => {
  it('gibt genau die letzten vier Zeichen', () => {
    expect(secretTail('sk_live_51ABCdefGHIjkl9XYZ')).toBe('9XYZ')
  })

  it('gibt NIE mehr als vier Zeichen — auch nicht bei kurzen Werten', () => {
    expect(secretTail('sk_live_abcd')).toHaveLength(4)
    expect(secretTail('a'.repeat(200))).toHaveLength(4)
  })

  it('leer/zu kurz = nichts zu zeigen', () => {
    expect(secretTail('')).toBe('')
    expect(secretTail('abc')).toBe('')
    expect(secretTail(null)).toBe('')
    expect(secretTail(undefined)).toBe('')
  })

  it('enthält niemals das Präfix — der Rest bleibt drin', () => {
    const tail = secretTail('sk_live_51ABCdefGHIjkl9XYZ')
    expect(tail.includes('sk_')).toBe(false)
  })
})

describe('stripeModeFromKey', () => {
  it('erkennt live und test am Präfix', () => {
    expect(stripeModeFromKey('sk_live_abc')).toBe('live')
    expect(stripeModeFromKey('sk_test_abc')).toBe('test')
  })

  it('fail-closed: alles Uneindeutige ist none', () => {
    expect(stripeModeFromKey('')).toBe('none')
    expect(stripeModeFromKey(null)).toBe('none')
    expect(stripeModeFromKey('pk_live_abc')).toBe('none')
    expect(stripeModeFromKey('rk_live_abc')).toBe('none')
    expect(stripeModeFromKey('  sk_live_abc')).toBe('none')
  })
})

describe('looksLikeStripeSecretKey', () => {
  it('nimmt sk_live_/sk_test_ mit ausreichend Rest', () => {
    expect(looksLikeStripeSecretKey('sk_live_51ABCdefGHIjkl')).toBe(true)
    expect(looksLikeStripeSecretKey('sk_test_51ABCdefGHIjkl')).toBe(true)
  })

  it('weist den ÖFFENTLICHEN Key ab (der häufigste Kopierfehler)', () => {
    expect(looksLikeStripeSecretKey('pk_live_51ABCdefGHIjkl')).toBe(false)
  })

  it('weist Restricted Keys ab (bewusst — s. Begründung in stripeKeys.ts)', () => {
    expect(looksLikeStripeSecretKey('rk_live_51ABCdefGHIjkl')).toBe(false)
  })

  it('weist Bruchstücke, Whitespace und Webhook-Secrets ab', () => {
    expect(looksLikeStripeSecretKey('sk_live_')).toBe(false)
    expect(looksLikeStripeSecretKey('sk_live_abc')).toBe(false)
    expect(looksLikeStripeSecretKey(' sk_live_51ABCdefGHIjkl')).toBe(false)
    expect(looksLikeStripeSecretKey('whsec_51ABCdefGHIjkl')).toBe(false)
    expect(looksLikeStripeSecretKey('')).toBe(false)
  })
})

describe('looksLikeStripeWebhookSecret', () => {
  it('nimmt whsec_ mit ausreichend Rest', () => {
    expect(looksLikeStripeWebhookSecret('whsec_ABCdefGHIjkl')).toBe(true)
  })

  it('weist alles andere ab', () => {
    expect(looksLikeStripeWebhookSecret('sk_live_51ABCdefGHIjkl')).toBe(false)
    expect(looksLikeStripeWebhookSecret('whsec_')).toBe(false)
    expect(looksLikeStripeWebhookSecret('')).toBe(false)
  })
})

describe('webhookSecretOrigin — Herkunft des Signatur-Geheimnisses (MEDIUM 2)', () => {
  it('BELEGT: aus der DB und die Marke zeigt auf genau diesen Endpunkt', () => {
    expect(webhookSecretOrigin('db', 'we_123', 'we_123')).toBe('created_here')
  })

  it('kein Geheimnis = „none", nicht „unbestätigt"', () => {
    // Die Karte sagt an anderer Stelle schon „nicht hinterlegt"; ein zweiter
    // Warnhinweis daneben wäre Lärm.
    expect(webhookSecretOrigin('none', 'we_123', 'we_123')).toBe('none')
    expect(webhookSecretOrigin('none', '', null)).toBe('none')
  })

  it('ENV-Geheimnis bleibt unbestätigt — auch wenn die Marke passt', () => {
    // Die Marke gehört zum DB-Wert. Gilt der Env-Wert, sagt sie nichts über
    // ihn aus; ohne diese Bedingung wäre die Zusicherung übertragbar.
    expect(webhookSecretOrigin('env', 'we_123', 'we_123')).toBe('unconfirmed')
  })

  it('ERSETZTER Endpunkt: Marke da, aber eine andere Id → unbestätigt', () => {
    // Der Fall, der vorher grün aussah und trotzdem jede Zustellung abwies.
    expect(webhookSecretOrigin('db', 'we_alt', 'we_neu')).toBe('unconfirmed')
  })

  it('ohne Marke (von Hand eingetragen, Bestand vor billing-003) unbestätigt', () => {
    expect(webhookSecretOrigin('db', '', 'we_123')).toBe('unconfirmed')
    expect(webhookSecretOrigin('db', null, 'we_123')).toBe('unconfirmed')
    expect(webhookSecretOrigin('db', undefined, 'we_123')).toBe('unconfirmed')
  })

  it('ohne gefundenen Endpunkt gibt es nichts zu bestätigen', () => {
    expect(webhookSecretOrigin('db', 'we_123', null)).toBe('unconfirmed')
  })
})
