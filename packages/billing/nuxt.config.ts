/**
 * Produkt Layer: Stripe-Billing (Phase 23, Plan docs/archiv/BILLING-STRIPE.md).
 * Stripe-hosted Checkout + Customer Portal (Redirect-Flow, kein Stripe-JS im
 * Client); Webhook als Nitro-Route (B1); eigene Projektion billing_customers/
 * billing_subscriptions (Stripe bleibt Source of Truth). Config-Gate
 * pukalani.billing (Core-Default enabled: false — der Layer ist tot, bis die App
 * ihn aktiviert). Extended den Core NICHT selbst; Produkt-Gating anderer
 * Layer passiert in der APP (A14).
 */
export default defineNuxtConfig({
  runtimeConfig: {
    // server-only! Leer-Defaults = Env-Mapping-Skeleton (B8):
    // NUXT_STRIPE_SECRET_KEY (sk_test_…/sk_live_…), NUXT_STRIPE_WEBHOOK_SECRET (whsec_…)
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    /**
     * NUXT_BILLING_SETTINGS_KEY — 64 Hex-Zeichen (32 Bytes, `openssl rand -hex 32`).
     * Entschlüsselt die in `stripe_settings` abgelegten Geheimnisse (F55).
     * LEER = die Key-Verwaltung im Dashboard sagt ehrlich „nicht konfiguriert";
     * die Laufzeit fällt dann wie eh und je auf NUXT_STRIPE_* zurück.
     * BEWUSST OHNE FALLBACK auf eine abgeleitete Ersatz-Passphrase — eine
     * Verschlüsselung mit Schlüssel aus dem Repository ist eine Verkleidung.
     */
    billingSettingsKey: '',
  },

  // Eigene Layer-Strings — mergen mit Core- und App-Locales (gleiche codes)
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
