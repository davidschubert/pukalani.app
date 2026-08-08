import { describe, expect, it } from 'vitest'
import type Stripe from 'stripe'
import { isNewPaymentFailure, isStale, missingWebhookEvents, paymentFailureAudience, planIdForPrice, subscriptionToPatch, toSubscriptionStatus, WEBHOOK_ALLOWLIST, WEBHOOK_EVENTS } from '../server/utils/webhookMapping'
import type { PukalaniBillingPlan } from '../shared/types/billing'

const PLANS: PukalaniBillingPlan[] = [
  { id: 'free', labelKey: 'billing.plans.free', products: [], lookupKeys: null },
  { id: 'pro', labelKey: 'billing.plans.pro', products: ['courses.paid'], lookupKeys: { monthly: 'maui_pro_monthly', yearly: 'maui_pro_yearly' } },
]

function fakeSubscription(overrides: Partial<Record<string, unknown>> = {}): Stripe.Subscription {
  return {
    id: 'sub_123',
    customer: 'cus_123',
    status: 'active',
    cancel_at_period_end: false,
    trial_end: null,
    items: { data: [{ current_period_end: 1_800_000_000, price: { id: 'price_1', lookup_key: 'maui_pro_monthly' } }] },
    metadata: {},
    ...overrides,
  } as unknown as Stripe.Subscription
}

describe('subscriptionToPatch', () => {
  it('mappt Status, Plan (lookup_key), Periodenende und Stale-Marker', () => {
    const patch = subscriptionToPatch(fakeSubscription(), PLANS, 1_750_000_000)
    expect(patch.stripeSubscriptionId).toBe('sub_123')
    expect(patch.stripeCustomerId).toBe('cus_123')
    expect(patch.status).toBe('active')
    expect(patch.planId).toBe('pro')
    expect(patch.priceId).toBe('price_1')
    expect(patch.currentPeriodEnd).toBe(new Date(1_800_000_000 * 1000).toISOString())
    expect(patch.cancelAtPeriodEnd).toBe(false)
    expect(patch.lastStripeEventAt).toBe(1_750_000_000)
  })

  it('erkennt den Jahres-lookup_key desselben Plans', () => {
    const sub = fakeSubscription({ items: { data: [{ current_period_end: 1_800_000_000, price: { id: 'price_2', lookup_key: 'maui_pro_yearly' } }] } })
    expect(subscriptionToPatch(sub, PLANS, 1).planId).toBe('pro')
  })

  it('unbekannter lookup_key → planId "unknown" (kein Crash)', () => {
    const sub = fakeSubscription({ items: { data: [{ current_period_end: 1, price: { id: 'p', lookup_key: 'fremd' } }] } })
    expect(subscriptionToPatch(sub, PLANS, 1).planId).toBe('unknown')
  })

  it('cancel_at_period_end wird übernommen (Kündigungs-Anzeige)', () => {
    expect(subscriptionToPatch(fakeSubscription({ cancel_at_period_end: true }), PLANS, 1).cancelAtPeriodEnd).toBe(true)
  })

  it('Legacy current_period_end (Objekt-Ebene) als Fallback', () => {
    const sub = fakeSubscription({
      current_period_end: 1_900_000_000,
      items: { data: [{ price: { id: 'p', lookup_key: 'maui_pro_monthly' } }] },
    })
    expect(subscriptionToPatch(sub, PLANS, 1).currentPeriodEnd).toBe(new Date(1_900_000_000 * 1000).toISOString())
  })
})

describe('toSubscriptionStatus', () => {
  it('kennt den Stripe-Statusraum, hebt Unbekanntes defensiv auf unpaid', () => {
    expect(toSubscriptionStatus('active')).toBe('active')
    expect(toSubscriptionStatus('past_due')).toBe('past_due')
    expect(toSubscriptionStatus('irgendwas_neues')).toBe('unpaid')
  })
})

describe('isStale (B4 Out-of-order-Guard)', () => {
  it('älteres Event als der Row-Stand wird verworfen', () => {
    expect(isStale({ lastStripeEventAt: 100 }, 99)).toBe(true)
    expect(isStale({ lastStripeEventAt: 100 }, 100)).toBe(false)
    expect(isStale({ lastStripeEventAt: 100 }, 101)).toBe(false)
    expect(isStale(null, 1)).toBe(false)
  })
})

describe('isNewPaymentFailure (Retry-Doppel-Notify verhindern)', () => {
  it('notify NUR beim Übergang IN einen Zahlungs-Problem-Status', () => {
    // echter Übergang → notify
    expect(isNewPaymentFailure('active', 'past_due')).toBe(true)
    expect(isNewPaymentFailure('active', 'unpaid')).toBe(true)
    expect(isNewPaymentFailure(null, 'past_due')).toBe(true) // erstes Event ist schon ein Fehlschlag
  })
  it('KEIN erneuter notify, wenn schon in Dunning (Retry/Doppel-Event)', () => {
    expect(isNewPaymentFailure('past_due', 'past_due')).toBe(false) // der eigentliche Bugfix
    expect(isNewPaymentFailure('unpaid', 'past_due')).toBe(false)
    expect(isNewPaymentFailure('past_due', 'unpaid')).toBe(false)
  })
  it('kein notify bei aktiven/erholten Status', () => {
    expect(isNewPaymentFailure('active', 'active')).toBe(false)
    expect(isNewPaymentFailure('past_due', 'active')).toBe(false) // Recovery
    expect(isNewPaymentFailure(null, 'active')).toBe(false)
    expect(isNewPaymentFailure('canceled', 'canceled')).toBe(false)
  })
})

describe('planIdForPrice / Allowlist', () => {
  it('ohne lookup_key → unknown', () => {
    expect(planIdForPrice(PLANS, null)).toBe('unknown')
  })
  it('Allowlist deckt genau die verarbeiteten Typen', () => {
    expect(WEBHOOK_ALLOWLIST.has('checkout.session.completed')).toBe(true)
    expect(WEBHOOK_ALLOWLIST.has('invoice.payment_failed')).toBe(true)
    expect(WEBHOOK_ALLOWLIST.has('charge.succeeded')).toBe(false)
  })
})

/**
 * SILO-WEG UNVERÄNDERT (Davids Entscheidung 2026-08-03): nur ein Abo mit
 * `metadata.communityId` biegt in den Pool ab. Dieses Merkmal setzt allein der
 * Community-Checkout des Control Plane — ein Silo-/Konto-Abo trägt es NIE und
 * meldet deshalb weiter im eigenen Projekt (`scope: 'account'`,
 * `/account/billing`).
 */
describe('paymentFailureAudience (wessen Glocke)', () => {
  it('Konto-Abo (Silo): ohne communityId meldet der Webhook selbst', () => {
    expect(paymentFailureAudience(undefined)).toBe('account')
    expect(paymentFailureAudience(null)).toBe('account')
    expect(paymentFailureAudience({})).toBe('account')
    // Ein Silo-Abo trägt userId/plan — aber nie communityId.
    expect(paymentFailureAudience({ userId: 'u1', plan: 'pro' })).toBe('account')
  })

  it('Community-Abo: mit communityId meldet der Pool in die Community-Glocke', () => {
    expect(paymentFailureAudience({ communityId: 'c1', plan: 'pro', userId: 'pool-user' })).toBe('community')
  })

  it('ein LEERER Wert ist kein Community-Abo (sonst schwiege der Webhook grundlos)', () => {
    expect(paymentFailureAudience({ communityId: '' })).toBe('account')
  })
})

/**
 * F55: der Ereignis-Abgleich der Dashboard-Karte. Der Fehlstand, den er
 * fangen soll, gab es real — im Testmodus fehlten bis 2026-08-02 die drei
 * `checkout.session.*`-Nachzügler, und eine verzögerte Zahlung endete
 * dadurch im Nichts.
 */
describe('missingWebhookEvents (F55, Endpunkt-Abgleich)', () => {
  it('vollständig = nichts fehlt', () => {
    expect(missingWebhookEvents(WEBHOOK_EVENTS)).toEqual([])
  })

  it('meldet genau die fehlenden — im historischen Fehlstand die drei Nachzügler', () => {
    const nurCompleted = WEBHOOK_EVENTS.filter(name => !name.startsWith('checkout.session.') || name === 'checkout.session.completed')
    expect(missingWebhookEvents(nurCompleted)).toEqual([
      'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed',
      'checkout.session.expired',
    ])
  })

  it('leerer Endpunkt = alle neun fehlen', () => {
    expect(missingWebhookEvents([])).toHaveLength(9)
    expect(WEBHOOK_EVENTS).toHaveLength(9)
  })

  it('ÜBERSCHUSS ist kein Befund — die Route beantwortet Unbekanntes mit 200', () => {
    expect(missingWebhookEvents([...WEBHOOK_EVENTS, 'charge.refunded', 'ping'])).toEqual([])
  })

  it('die Wildcard * deckt alles ab', () => {
    expect(missingWebhookEvents(['*'])).toEqual([])
  })

  it('WEBHOOK_EVENTS ist dieselbe Menge wie die Allowlist', () => {
    expect(new Set(WEBHOOK_EVENTS)).toEqual(WEBHOOK_ALLOWLIST)
  })
})
