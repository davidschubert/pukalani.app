<script setup lang="ts">
// Dünne App: nur Komposition + Branding — Logik lebt in den Layern.

// SEO: hreflang-Alternates + og:locale + canonical (Core-Composable;
// absolute URLs via NUXT_PUBLIC_I18N_BASE_URL — Single-Host-App).
useLocaleSeoHead()

/**
 * Vorschaubild für geteilte Links. Es wird BEWUSST nicht in den Seiten per
 * `useHead` gesetzt: `useLocaleSeoHead()` ist der einzige Ort, an dem
 * canonical/og:url entstehen, und genau dort gehört og:image dazu — sonst
 * laufen die absoluten URLs wieder auseinander (Audit-Befund B1). Der Kern
 * macht aus dem Pfad die absolute URL auf dem richtigen Host und ergänzt
 * Maße, Typ und `twitter:card`. PNG, nicht SVG: Facebook, WhatsApp und
 * LinkedIn zeigen SVG als Vorschaubild nicht an.
 */
useBrandOgImage().value = {
  path: '/images/og-pukalani-studio.png',
  width: 1200,
  height: 630,
  type: 'image/png',
}
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
