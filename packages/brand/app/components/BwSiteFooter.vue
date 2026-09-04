<script setup lang="ts">
/** Site-Footer der öffentlichen Seiten (Runde 136) — gleiche
 *  Reihenfolge wie die Hauptnavigation: öffentlich → persönlich. */
/* Dieselben vier Punkte wie die Hauptnavigation und deshalb dieselben
 * Schlüssel — die Beschriftungen sind Davids Design und heißen in BEIDEN
 * Sprachen englisch; die Rechtstexte dahinter nicht. */
const { t } = useI18n()
const localePath = useLocalePath()
/* NUR ECHTE ZIELE (Davids 404-Audit 2026-09-03): Products/Discover/Insights
 * zeigten auf /products (404) bzw. die Klickdummy-Pfade /brand/demo/* —
 * sie kommen mit ihren Marketing-Seiten zurück (s. BwSiteNav). */
const nav = computed(() => [
  // Zwei Seiten seit der Aufteilung (Davids Entscheidung 2026-09-04).
  { label: t('brand.nav.about'), to: localePath('/about') },
  { label: t('brand.nav.team'), to: localePath('/team') },
])
const legal = computed(() => [
  t('brand.legal.imprint'),
  t('brand.legal.privacy'),
  t('brand.legal.terms'),
])
</script>

<template>
  <footer class="mt-24 border-t pb-6 pt-8" style="border-color: var(--bw-line)">
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
        <span class="grid size-6 flex-none place-items-center rounded-full" style="background: var(--bw-ink); color: var(--bw-paper)">
          <UIcon name="i-ph-fingerprint" class="size-3.5" />
        </span>
        <span class="whitespace-nowrap text-sm" style="font-weight: 400; letter-spacing: -0.01em">Branding Supply</span>
      </NuxtLink>
      <nav class="flex flex-wrap gap-x-6 gap-y-2" :aria-label="t('brand.nav.footerNav')">
        <NuxtLink v-for="it in nav" :key="it.to" :to="it.to" class="text-sm whitespace-nowrap transition-colors hover:!text-(--bw-ink)" style="color: var(--bw-muted)">{{ it.label }}</NuxtLink>
      </nav>
      <div class="flex flex-wrap gap-x-6 gap-y-2">
        <span v-for="l in legal" :key="l" class="text-sm whitespace-nowrap" style="color: var(--bw-muted)">{{ l }}</span>
      </div>
    </div>
  </footer>
</template>
