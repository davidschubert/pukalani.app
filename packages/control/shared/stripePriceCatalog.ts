/**
 * DER STRIPE-PREIS-KATALOG — die eine Stelle, an der die Beträge stehen (F55).
 *
 * Vorher lebten sie in `scripts/stripe/ensure-prices.mjs`, und der Kommentar
 * dort sagte „muss pukalani.control.plans spiegeln". Ein Spiegel ist keine
 * Wahrheit: der Katalog in `packages/control/app/app.config.ts` trägt die
 * `lookup_key`s (was ein Plan KAUFT), die Beträge standen daneben im Skript
 * (was er KOSTET). Seit F55 klickt der Betreiber „Bei Stripe anlegen" im
 * Dashboard — hätte die Route ihre eigene Kopie bekommen, wären es drei
 * Kopien gewesen.
 *
 * WAS HIER STEHT UND WAS NICHT:
 *  - HIER: Produkt-Name, `lookup_key`, Betrag in Cent, Intervall, Währung.
 *  - NICHT hier: welcher Plan welche PRODUKTE freischaltet. Das bleibt
 *    `pukalani.control.plans` (app.config) — es ist eine Frage des
 *    Berechtigungs-Modells, nicht des Preisschilds. Die `lookup_key`s
 *    verbinden beide Seiten; `stripePriceCatalogMatchesPlans()` prüft, dass
 *    sie deckungsgleich bleiben.
 *
 * BETRÄGE SIND BRUTTO (Davids Entscheid 2026-07-29, OPEN-ITEMS A3): Landing
 * und Hilfe weisen sie als Endpreise „inkl. 19 % MwSt." aus, die Checkouts
 * laufen mit `automatic_tax`. Deshalb entsteht JEDER neue Price fest mit
 * `tax_behavior: 'inclusive'` — auf „exclusive" hätte Stripe die 19 % oben
 * drauf gerechnet (29 € → 34,51 €), im Widerspruch zur Landing. Das Feld ist
 * an einem Price UNVERÄNDERLICH: ein falsch angelegter Price muss ersetzt
 * werden, deshalb steht die Entscheidung im Katalog und nicht im Konto.
 *
 * Die `lookup_key`s heißen weiterhin `workspace_*`. Das sind IDENTITÄTEN bei
 * Stripe (Test- UND Live-Modus), kein Wort — umbenennen hieße, die angelegten
 * Preise nicht mehr zu finden.
 */

export const STRIPE_PRICE_CURRENCY = 'eur'

/** Stripes Steuer-Verhalten an einem Price. Wir legen ausschließlich brutto an. */
export const STRIPE_PRICE_TAX_BEHAVIOR = 'inclusive'

export interface StripePriceDefinition {
  /** Stabiler `lookup_key` — mode-übergreifend identisch (Test wie Live). */
  lookupKey: string
  /** Stripe-Intervall (nicht 'monthly'/'yearly' — das ist unser Wort). */
  interval: 'month' | 'year'
  /** Betrag in CENT. */
  amount: number
}

export interface StripeProductDefinition {
  /** Stabiler Wiedererkennungs-Schlüssel in `metadata.maui_key`. Historisch
   *  `maui_*` — dieselbe Regel wie bei den lookup_keys: Identität, kein Wort. */
  key: string
  /** Anzeigename bei Stripe (Rechnung, Portal, Checkout). */
  name: string
  prices: StripePriceDefinition[]
}

/**
 * Davids Pricing 2026-07-26: Personal 29 €/Monat, Pro 149 €/Monat, jährlich
 * exakt −25 % (29·12·0,75 = 261 €; 149·12·0,75 = 1341 €). `basic` ist
 * kostenlos (kein Price), Enterprise ist das Studio-Angebot ohne
 * Self-Service-Checkout.
 */
export const STRIPE_PRICE_CATALOG: readonly StripeProductDefinition[] = [
  {
    key: 'workspace_personal',
    name: 'Pukalani Personal',
    prices: [
      { lookupKey: 'workspace_personal_monthly', interval: 'month', amount: 2900 },
      { lookupKey: 'workspace_personal_yearly', interval: 'year', amount: 26100 },
    ],
  },
  {
    key: 'workspace_pro',
    name: 'Pukalani Pro',
    prices: [
      { lookupKey: 'workspace_pro_monthly', interval: 'month', amount: 14900 },
      { lookupKey: 'workspace_pro_yearly', interval: 'year', amount: 134100 },
    ],
  },
]

/** Alle `lookup_key`s des Katalogs, in Katalog-Reihenfolge. */
export function catalogLookupKeys(): string[] {
  return STRIPE_PRICE_CATALOG.flatMap(product => product.prices.map(price => price.lookupKey))
}

/** Definition zu einem `lookup_key` — `null`, wenn der Katalog ihn nicht kennt. */
export function catalogPriceFor(lookupKey: string): StripePriceDefinition | null {
  for (const product of STRIPE_PRICE_CATALOG) {
    const price = product.prices.find(entry => entry.lookupKey === lookupKey)
    if (price) return price
  }
  return null
}

/**
 * Deckt sich der Katalog mit dem PLAN-Katalog (`pukalani.control.plans`)?
 *
 * Zwei Listen, die dieselben Schlüssel nennen müssen: hier die Preisschilder,
 * dort die Produkt-Freischaltung. Läuft eine der beiden weg, legt die
 * F55-Seite einen Preis an, den kein Checkout je auflöst — oder ein Plan
 * zeigt auf einen `lookup_key`, den niemand anlegt. Beides fällt erst beim
 * Kauf auf. Gibt die FEHLENDEN Schlüssel je Richtung zurück (leer = deckungsgleich).
 */
export function stripePriceCatalogMatchesPlans(
  planLookupKeys: readonly string[],
): { missingInCatalog: string[], missingInPlans: string[] } {
  const catalog = new Set(catalogLookupKeys())
  const plans = new Set(planLookupKeys)
  return {
    missingInCatalog: [...plans].filter(key => !catalog.has(key)),
    missingInPlans: [...catalog].filter(key => !plans.has(key)),
  }
}

/**
 * WAS IST MIT DIESEM PREIS ZU TUN? Pure Entscheidung, damit die drei Fälle
 * ohne Stripe-Konto prüfbar sind (die Route macht danach nur noch
 * Nebenwirkungen).
 *
 *  - `create`   — es gibt keinen aktiven Price mit diesem `lookup_key`.
 *  - `skip`     — es gibt ihn, mit dem richtigen Betrag und der richtigen
 *                 Währung. Nichts zu tun; das ist der Normalfall bei einem
 *                 zweiten Klick auf „Abgleichen".
 *  - `transfer` — es gibt ihn, aber der Betrag (oder die Währung) weicht ab.
 *                 Stripe-Preise sind UNVERÄNDERLICH: neuer Price, `lookup_key`
 *                 zieht per `transfer_lookup_key` um, alter Price wird
 *                 archiviert. Bestands-Abos behalten ihren Preis
 *                 (Grandfathering) — eine Preiserhöhung für Bestandskunden
 *                 wäre ein eigener, kommunikationspflichtiger Schritt.
 *
 * Ein INAKTIVER Bestands-Price zählt als „nicht vorhanden": Stripe gibt ihn
 * bei `active: true` gar nicht erst zurück, und ein archivierter Price kann
 * seinen `lookup_key` nicht mehr halten.
 */
export type StripePriceAction = 'create' | 'skip' | 'transfer'

export function decideStripePriceAction(
  existing: { unitAmount: number | null, currency: string } | null,
  desired: { amount: number, currency: string },
): StripePriceAction {
  if (!existing) return 'create'
  if (existing.unitAmount === desired.amount && existing.currency === desired.currency) return 'skip'
  return 'transfer'
}
