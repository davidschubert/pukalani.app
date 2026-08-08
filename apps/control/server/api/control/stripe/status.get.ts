import type Stripe from 'stripe'
import { secretTail, stripeModeFromKey, type StripeKeyMode, type StripeSecretSource } from '../../../../../../packages/billing/shared/stripeKeys'
import { missingWebhookEvents, WEBHOOK_EVENTS } from '../../../../../../packages/billing/server/utils/webhookMapping'
import { readStripePriceStatus, type StripePriceStatus } from '../../../utils/stripePrices'
import { stripeWebhookUrl } from '../../../utils/stripeWebhookEndpoint'

/**
 * DIE STATUSKARTE (F55): alles, was der Betreiber vor einem Go-Live wissen
 * muss, in EINER Antwort — Modus, Herkunft der Geheimnisse, Steuer-Default,
 * die vier Preise, der Webhook-Endpunkt.
 *
 * DREI REGELN, die man nicht „aufräumen" darf:
 *
 * 1. AUS DEM KEY GEHT NUR DER SCHWANZ HERAUS. Vier Zeichen (`secretTail`),
 *    nie mehr, auch nicht maskiert-in-der-Mitte. Die Antwort dieser Route
 *    landet im Browser eines Menschen, der sie versehentlich in einen Chat
 *    kopiert — genau so entstand der Teil-Leak vom 2026-08-08.
 *
 * 2. JEDER ABSCHNITT SCHEITERT FÜR SICH. Ein Stripe-Ausfall bei der
 *    Steuerabfrage darf die Preis-Tabelle nicht mit umwerfen: die Karte ist
 *    ein DIAGNOSE-Werkzeug, und ein Werkzeug, das bei der ersten Störung
 *    komplett schwarz wird, ist im Störfall wertlos. Jeder Abschnitt trägt
 *    deshalb ein eigenes `error`-Flag.
 *
 * 3. KEIN STRIPE-FEHLERTEXT NACH DRAUSSEN. Nur `error: true` plus Log —
 *    Stripe-Fehlermeldungen tragen gelegentlich Konto- und Objekt-Ids.
 */

interface SectionError { error: true }

type Section<T> = T | SectionError

/** Abschnitt ausführen; bei Fehler protokollieren und `{ error: true }` melden. */
async function section<T>(label: string, run: () => Promise<T>): Promise<Section<T>> {
  try {
    return await run()
  }
  catch (error) {
    console.error(`[control/stripe/status] ${label} fehlgeschlagen:`, error)
    return { error: true }
  }
}

export default defineEventHandler(async (event) => {
  requirePermission(event, 'system.manage')
  await requireBillingEnabled(event)

  const secret = await resolveStripeSecretKey(event)
  const webhookSecret = await resolveStripeWebhookSecret(event)

  const mode: StripeKeyMode = stripeModeFromKey(secret.value)
  const keySource: StripeSecretSource = secret.source
  const webhookSecretSource: StripeSecretSource = webhookSecret.source
  const base = {
    mode,
    keySource,
    // NUR die letzten vier Zeichen — Regel 1 im Kopf dieser Datei.
    keyTail: secretTail(secret.value),
    webhookSecretSource,
    webhookSecretTail: secretTail(webhookSecret.value),
    storageAvailable: stripeSettingsStorageAvailable(event),
    expectedWebhookUrl: stripeWebhookUrl(event),
    expectedEvents: WEBHOOK_EVENTS,
  }

  // Ohne Key gibt es nichts abzufragen — und zwar OHNE dass das ein Fehler
  // wäre. Das ist der Ausgangszustand jeder frischen Instanz.
  if (!secret.value) {
    return { ...base, tax: null, prices: null, webhook: null }
  }

  const stripe = await useStripe(event)

  const tax = await section('tax.settings.retrieve', async () => {
    const settings = await stripe.tax.settings.retrieve()
    return {
      // 'inclusive' = Brutto (A3, Pflicht). 'exclusive' hieße: Stripe rechnet
      // 19 % OBEN DRAUF und die Landing lügt.
      defaultTaxBehavior: settings.defaults?.tax_behavior ?? null,
      status: settings.status ?? null,
    }
  })

  const prices = await section<StripePriceStatus[]>('prices.list', () => readStripePriceStatus(stripe))

  const webhook = await section('webhookEndpoints.list', async () => {
    const wanted = base.expectedWebhookUrl
    const list = await stripe.webhookEndpoints.list({ limit: 100 })
    const found = wanted ? list.data.find((endpoint: Stripe.WebhookEndpoint) => endpoint.url === wanted) ?? null : null
    return {
      found: !!found,
      id: found?.id ?? null,
      status: found?.status ?? null,
      enabledEvents: found?.enabled_events ?? [],
      missingEvents: found ? missingWebhookEvents(found.enabled_events ?? []) : WEBHOOK_EVENTS.slice(),
      /** Andere Endpunkte desselben Kontos — nur die ANZAHL, nie fremde URLs. */
      otherEndpoints: list.data.length - (found ? 1 : 0),
    }
  })

  return { ...base, tax, prices, webhook }
})
