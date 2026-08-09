import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  catalogLookupKeys,
  catalogPriceFor,
  decideStripePriceAction,
  STRIPE_PRICE_CATALOG,
  STRIPE_PRICE_CURRENCY,
  STRIPE_PRICE_TAX_BEHAVIOR,
  stripePriceCatalogMatchesPlans,
} from '../shared/stripePriceCatalog'

describe('Katalog-Inhalt (Davids Pricing 2026-07-26)', () => {
  it('trägt genau die vier Plan-Preise', () => {
    expect(catalogLookupKeys()).toEqual([
      'workspace_personal_monthly',
      'workspace_personal_yearly',
      'workspace_pro_monthly',
      'workspace_pro_yearly',
    ])
  })

  it('Beträge in Cent: Personal 29 €, Pro 149 €', () => {
    expect(catalogPriceFor('workspace_personal_monthly')?.amount).toBe(2900)
    expect(catalogPriceFor('workspace_pro_monthly')?.amount).toBe(14900)
  })

  it('jährlich ist exakt −25 % auf zwölf Monate', () => {
    for (const key of ['personal', 'pro'] as const) {
      const monthly = catalogPriceFor(`workspace_${key}_monthly`)!.amount
      const yearly = catalogPriceFor(`workspace_${key}_yearly`)!.amount
      expect(yearly).toBe(monthly * 12 * 0.75)
    }
  })

  it('Währung euro, Steuer-Verhalten BRUTTO (A3 — sonst rechnet Stripe 19 % obendrauf)', () => {
    expect(STRIPE_PRICE_CURRENCY).toBe('eur')
    expect(STRIPE_PRICE_TAX_BEHAVIOR).toBe('inclusive')
  })

  it('unbekannter lookup_key = null', () => {
    expect(catalogPriceFor('workspace_enterprise_monthly')).toBeNull()
  })

  /**
   * KEINE ANFÜHRUNGSZEICHEN IN SCHLÜSSELN (Session-Audit 2026-08-09).
   *
   * Der Produkt-`key` wird in eine Stripe-SUCHANFRAGE interpoliert
   * (`metadata['maui_key']:'<key>'` — apps/control/server/utils/stripePrices.ts
   * und scripts/stripe/ensure-prices.mjs), der `lookupKey` reist als
   * Query-Parameter. Ein Apostroph darin bräche die Anfrage STILL: die Suche
   * fände nichts, `ensureProduct` legte ein zweites Produkt an, und der Katalog
   * hätte ab da zwei Wahrheiten bei Stripe. Deshalb sind die Zeichen hier
   * verboten statt anderswo maskiert — Schlüssel sind Identitäten, kein Text.
   */
  it('kein Schlüssel trägt Apostroph oder Anführungszeichen', () => {
    const forbidden = /['"\\`]/
    for (const product of STRIPE_PRICE_CATALOG) {
      expect(product.key, `Produkt-Schlüssel ${product.key}`).not.toMatch(forbidden)
      for (const price of product.prices) {
        expect(price.lookupKey, `lookup_key ${price.lookupKey}`).not.toMatch(forbidden)
      }
    }
  })
})

/**
 * DER WÄCHTER GEGEN AUSEINANDERLAUFEN: die Beträge stehen im Katalog, die
 * Produkt-Freischaltung in `pukalani.control.plans` (app.config.ts). Beide
 * nennen dieselben `lookup_key`s. Läuft eine Seite weg, legt die F55-Seite
 * einen Preis an, den kein Checkout je auflöst — oder umgekehrt.
 *
 * Die app.config wird als TEXT gelesen, nicht importiert: `defineAppConfig`
 * ist ein Nuxt-Makro und außerhalb des Nuxt-Kontexts nicht auflösbar. Für
 * diese Frage reicht der Text — es geht um Zeichenketten-Literale.
 */
describe('Deckungsgleichheit mit pukalani.control.plans', () => {
  it('nennt genau dieselben lookup_keys wie der Plan-Katalog', () => {
    const appConfigPath = fileURLToPath(new URL('../app/app.config.ts', import.meta.url))
    const source = readFileSync(appConfigPath, 'utf8')
    const planKeys = [...source.matchAll(/lookupKey(?:Yearly)?:\s*'([^']+)'/g)].map(match => match[1]!)

    // Gegenprobe: der Regex greift überhaupt (sonst wäre der Test immer grün).
    expect(planKeys.length).toBeGreaterThan(0)

    const diff = stripePriceCatalogMatchesPlans(planKeys)
    expect(diff.missingInCatalog).toEqual([])
    expect(diff.missingInPlans).toEqual([])
  })

  it('meldet eine Abweichung in BEIDE Richtungen', () => {
    const diff = stripePriceCatalogMatchesPlans(['workspace_personal_monthly', 'workspace_neu_monthly'])
    expect(diff.missingInCatalog).toEqual(['workspace_neu_monthly'])
    expect(diff.missingInPlans).toEqual([
      'workspace_personal_yearly',
      'workspace_pro_monthly',
      'workspace_pro_yearly',
    ])
  })
})

describe('decideStripePriceAction — die drei Fälle des Abgleichs', () => {
  const desired = { amount: 2900, currency: 'eur' }

  it('kein aktiver Price = anlegen', () => {
    expect(decideStripePriceAction(null, desired)).toBe('create')
  })

  it('gleicher Betrag und gleiche Währung = überspringen (zweiter Klick)', () => {
    expect(decideStripePriceAction({ unitAmount: 2900, currency: 'eur' }, desired)).toBe('skip')
  })

  it('abweichender Betrag = lookup_key zieht um (Stripe-Preise sind unveränderlich)', () => {
    expect(decideStripePriceAction({ unitAmount: 1900, currency: 'eur' }, desired)).toBe('transfer')
    expect(decideStripePriceAction({ unitAmount: 3900, currency: 'eur' }, desired)).toBe('transfer')
  })

  it('abweichende Währung zieht ebenfalls um', () => {
    expect(decideStripePriceAction({ unitAmount: 2900, currency: 'usd' }, desired)).toBe('transfer')
  })

  it('Price ohne Betrag (metered) zieht um statt still zu überspringen', () => {
    expect(decideStripePriceAction({ unitAmount: null, currency: 'eur' }, desired)).toBe('transfer')
  })

  it('der ganze Katalog gegen ein leeres Stripe-Konto = viermal anlegen', () => {
    const actions = STRIPE_PRICE_CATALOG.flatMap(product => product.prices.map(price =>
      decideStripePriceAction(null, { amount: price.amount, currency: STRIPE_PRICE_CURRENCY }),
    ))
    expect(actions).toEqual(['create', 'create', 'create', 'create'])
  })

  it('der ganze Katalog gegen ein passendes Konto = viermal überspringen', () => {
    const actions = STRIPE_PRICE_CATALOG.flatMap(product => product.prices.map(price =>
      decideStripePriceAction({ unitAmount: price.amount, currency: STRIPE_PRICE_CURRENCY }, { amount: price.amount, currency: STRIPE_PRICE_CURRENCY }),
    ))
    expect(actions).toEqual(['skip', 'skip', 'skip', 'skip'])
  })
})
