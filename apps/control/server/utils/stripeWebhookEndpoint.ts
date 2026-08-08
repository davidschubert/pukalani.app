import type { H3Event } from 'h3'

/**
 * WOHIN ZEIGT DER STRIPE-WEBHOOK DIESER INSTANZ? (F55)
 *
 * Abgeleitet aus `public.appUrl` (NUXT_PUBLIC_APP_URL) + dem festen Pfad der
 * billing-Route. BEWUSST NICHT hartkodiert auf `control.pukalani.app`: lokal
 * ergibt das eine `localhost`-URL (harmlos — Stripe lehnt sie beim Anlegen
 * ab, und genau das soll man lokal sehen statt versehentlich den PROD-Endpunkt
 * anzulegen), und ein Umzug der Betreiber-Konsole zöge die URL mit.
 *
 * BEWUSST AUCH NICHT aus dem `Host`-Header: derselbe Grund wie bei
 * `billingReturnOrigin` — ein Header ist Eingabe des Aufrufers, und diese URL
 * geht an Stripe, wo sie für alle folgenden Ereignisse gilt.
 */
export const STRIPE_WEBHOOK_PATH = '/api/stripe/webhook'

export function stripeWebhookUrl(event: H3Event): string {
  const base = (useRuntimeConfig(event).public.appUrl || '').replace(/\/+$/, '')
  if (!base) return ''
  return base + STRIPE_WEBHOOK_PATH
}
