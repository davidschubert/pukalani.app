import type Stripe from 'stripe'
import {
  catalogLookupKeys,
  decideStripePriceAction,
  STRIPE_PRICE_CATALOG,
  STRIPE_PRICE_CURRENCY,
  STRIPE_PRICE_TAX_BEHAVIOR,
  type StripePriceDefinition,
  type StripeProductDefinition,
} from '../../../../packages/control/shared/stripePriceCatalog'

/**
 * Products + Prices bei Stripe sicherstellen — die Logik hinter dem Knopf
 * „Bei Stripe anlegen/abgleichen" (F55).
 *
 * WARUM DAS EINE APP-UTIL IST und kein Layer-Baustein: es komponiert den
 * Plan-Katalog des `control`-Layers mit dem Stripe-Transport des
 * `billing`-Layers. Die beiden kennen sich nicht (A14) — die APP darf beides
 * (dasselbe Muster wie `communityCheckout.ts` nebenan).
 *
 * DIE ENTSCHEIDUNG SELBST IST PURE und liegt im Katalog
 * (`decideStripePriceAction`, unit-getestet). Hier stehen nur noch die
 * Nebenwirkungen — genau die drei Stripe-Aufrufe, die ohne Konto nicht
 * prüfbar wären.
 */

export type StripePriceOutcome = 'created' | 'skipped' | 'transferred'

export interface StripePriceResult {
  lookupKey: string
  interval: 'month' | 'year'
  amount: number
  outcome: StripePriceOutcome
  /** Id des jetzt gültigen Price (auch bei `skipped`). */
  priceId: string
  /** Nur bei `transferred`: der archivierte Vorgänger. */
  archivedPriceId?: string
}

export interface StripePriceSyncReport {
  currency: string
  livemode: boolean
  results: StripePriceResult[]
}

/** Produkt per stabilem `metadata.maui_key` finden oder anlegen (idempotent). */
async function ensureProduct(stripe: Stripe, def: StripeProductDefinition): Promise<Stripe.Product> {
  // `products.search` statt `list` + Filter: der Katalog wächst, und ein
  // `list` über alle Produkte des Kontos wäre spätestens beim zweiten Kunden
  // eine Paginierung, die niemand pflegt.
  const found = await stripe.products.search({ query: `metadata['maui_key']:'${def.key}'`, limit: 1 })
  if (found.data[0]) return found.data[0]
  return stripe.products.create({ name: def.name, metadata: { maui_key: def.key } })
}

async function ensurePrice(
  stripe: Stripe,
  product: Stripe.Product,
  def: StripePriceDefinition,
): Promise<StripePriceResult> {
  const existing = await stripe.prices.list({
    lookup_keys: [def.lookupKey],
    active: true,
    expand: ['data.product'],
    limit: 1,
  })
  const current = existing.data[0] ?? null

  const action = decideStripePriceAction(
    current ? { unitAmount: current.unit_amount, currency: current.currency } : null,
    { amount: def.amount, currency: STRIPE_PRICE_CURRENCY },
  )

  if (action === 'skip' && current) {
    return { lookupKey: def.lookupKey, interval: def.interval, amount: def.amount, outcome: 'skipped', priceId: current.id }
  }

  const created = await stripe.prices.create({
    product: product.id,
    currency: STRIPE_PRICE_CURRENCY,
    unit_amount: def.amount,
    recurring: { interval: def.interval },
    lookup_key: def.lookupKey,
    // Zieht den lookup_key atomar vom alten auf den neuen Price (falls es
    // einen gibt) — ohne das Flag lehnt Stripe den doppelten Key ab.
    transfer_lookup_key: true,
    // Brutto-Endpreis (A3). UNVERÄNDERLICH — deshalb von Anfang an richtig.
    tax_behavior: STRIPE_PRICE_TAX_BEHAVIOR,
  })

  if (!current) {
    return { lookupKey: def.lookupKey, interval: def.interval, amount: def.amount, outcome: 'created', priceId: created.id }
  }

  // Ist der alte Price der `default_price` des Products, verweigert Stripe das
  // Archivieren — erst umhängen. (Derselbe Stolperstein wie in
  // control/billing/prices.post.ts; er kostet sonst einen 400 mitten im Lauf.)
  const productObject = typeof current.product === 'object' && !('deleted' in current.product) ? current.product : null
  const defaultPriceId = typeof productObject?.default_price === 'string'
    ? productObject.default_price
    : productObject?.default_price?.id
  if (defaultPriceId === current.id) {
    await stripe.products.update(product.id, { default_price: created.id })
  }
  await stripe.prices.update(current.id, { active: false })
  // Der Umzug hat den lookup_key auf eine NEUE Price-Id gehängt — der
  // Preis-Cache des billing-Layers hielte sonst bis zu 5 Minuten die
  // ARCHIVIERTE Id fest, und jeder Checkout liefe in Stripes „price inactive"
  // (Session-Audit 2026-08-09, HIGH 2).
  invalidateStripePriceCache()

  return {
    lookupKey: def.lookupKey,
    interval: def.interval,
    amount: def.amount,
    outcome: 'transferred',
    priceId: created.id,
    archivedPriceId: current.id,
  }
}

/**
 * Den gesamten Katalog abgleichen. Idempotent: ein zweiter Aufruf meldet
 * überall `skipped`.
 */
export async function syncStripePriceCatalog(stripe: Stripe): Promise<StripePriceSyncReport> {
  const results: StripePriceResult[] = []
  let livemode = false
  for (const productDef of STRIPE_PRICE_CATALOG) {
    const product = await ensureProduct(stripe, productDef)
    livemode = product.livemode
    for (const priceDef of productDef.prices) {
      results.push(await ensurePrice(stripe, product, priceDef))
    }
  }
  return { currency: STRIPE_PRICE_CURRENCY, livemode, results }
}

/**
 * IST-Zustand der vier Preise für die Statuskarte — read-only, ein
 * Stripe-Aufruf für alle `lookup_key`s.
 */
export interface StripePriceStatus {
  lookupKey: string
  interval: 'month' | 'year'
  /** Soll-Betrag aus dem Katalog (Cent). */
  expectedAmount: number
  exists: boolean
  /** Ist-Betrag bei Stripe (Cent) — `null`, wenn der Price fehlt. */
  amount: number | null
  currency: string | null
  active: boolean
  /** Steuer-Verhalten des Preises — 'inclusive' ist Pflicht (A3). */
  taxBehavior: string | null
}

/**
 * Stripe nimmt höchstens ZEHN `lookup_keys` je Abfrage entgegen. Heute hat der
 * Katalog vier — aber er ist die Wachstumsstelle dieses Systems (jeder neue
 * Plan bringt zwei), und der elfte Schlüssel hätte die Statuskarte mit einem
 * Stripe-400 lahmgelegt, an einer Stelle, an der niemand einen Fehler erwartet
 * (Session-Audit 2026-08-09).
 */
const LOOKUP_KEYS_PER_CALL = 10

export async function readStripePriceStatus(stripe: Stripe): Promise<StripePriceStatus[]> {
  const keys = catalogLookupKeys()
  const byLookup = new Map<string, Stripe.Price>()
  for (let offset = 0; offset < keys.length; offset += LOOKUP_KEYS_PER_CALL) {
    const found = await stripe.prices.list({
      lookup_keys: keys.slice(offset, offset + LOOKUP_KEYS_PER_CALL),
      active: true,
      limit: 100,
    })
    for (const price of found.data) byLookup.set(price.lookup_key ?? '', price)
  }

  return STRIPE_PRICE_CATALOG.flatMap(product => product.prices.map((def) => {
    const price = byLookup.get(def.lookupKey)
    return {
      lookupKey: def.lookupKey,
      interval: def.interval,
      expectedAmount: def.amount,
      exists: !!price,
      amount: price?.unit_amount ?? null,
      currency: price?.currency ?? null,
      active: price?.active ?? false,
      taxBehavior: price?.tax_behavior ?? null,
    }
  }))
}
