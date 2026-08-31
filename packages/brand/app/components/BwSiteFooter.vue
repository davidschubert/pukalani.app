<script setup lang="ts">
/** Site-Footer der öffentlichen Seiten (Runde 136) — gleiche
 *  Reihenfolge wie die Hauptnavigation: öffentlich → persönlich. */
const nav = [
  { label: 'Our Products', to: '/products' },
  { label: 'Discover Brands', to: '/brand/demo/discover' },
  { label: 'Brand Insights', to: '/brand/demo/journal' },
  { label: 'About us', to: '/team' },
  { label: 'Meine Brands', to: '/' },
]
const legal = ['Impressum', 'Datenschutz', 'AGB']
</script>

<template>
  <footer class="mt-24 border-t pb-6 pt-8" style="border-color: var(--bw-line)">
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <NuxtLink to="/start" class="flex items-center gap-2">
        <span class="grid size-6 flex-none place-items-center rounded-lg" style="background: var(--bw-ink); color: var(--bw-paper)">
          <UIcon name="i-ph-fingerprint" class="size-3.5" />
        </span>
        <span class="text-sm font-semibold tracking-tight">Branding Supply</span>
      </NuxtLink>
      <nav class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
        <NuxtLink v-for="it in nav" :key="it.to" :to="it.to" class="bw-label transition-colors hover:!text-(--bw-ink)" style="color: var(--bw-muted)">{{ it.label }}</NuxtLink>
      </nav>
      <div class="flex flex-wrap gap-x-6 gap-y-2">
        <span v-for="l in legal" :key="l" class="bw-label" style="color: var(--bw-muted)">{{ l }}</span>
      </div>
    </div>
    <p class="bw-label mt-6" style="color: var(--bw-muted)">© 2026 Branding Supply · Marken sind keine Vorlagen — aber der Weg dorthin steht allen offen.</p>
  </footer>
</template>
