<script setup lang="ts">
/** Übergeordnete Header-Navigation für die öffentlichen Seiten
 *  (Meine Brands · Discover · Journal). Die Werkstatt behält ihre
 *  eigene Topbar (BwWorkspace). */
const route = useRoute()
const items = [
  { label: 'Meine Brands', to: '/', match: ['/', '/brand/demo/beispiel'] },
  { label: 'Discover', to: '/brand/demo/discover', match: ['/brand/demo/discover', '/brand/demo/anatomie'] },
  { label: 'Journal', to: '/brand/demo/journal', match: ['/brand/demo/journal', '/brand/demo/artikel', '/brand/demo/profil', '/brand/demo/duell'] },
]
function isActive(it: { match: string[] }): boolean {
  return it.match.includes(route.path)
}
</script>

<template>
  <nav
    class="sticky top-0 z-40 -mx-6 mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4"
    style="background: color-mix(in srgb, var(--bw-paper) 88%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)"
  >
    <NuxtLink to="/" class="flex items-center gap-2.5">
      <span class="grid size-8 flex-none place-items-center rounded-xl" style="background: var(--bw-ink); color: var(--bw-paper)">
        <UIcon name="i-ph-paw-print-fill" class="size-4.5" />
      </span>
      <span class="text-sm font-semibold tracking-tight">Branding Supply</span>
    </NuxtLink>
    <div class="flex items-center gap-1.5">
      <NuxtLink
        v-for="it in items" :key="it.to" :to="it.to"
        class="bw-label rounded-full px-3.5 py-2 transition-colors"
        :style="isActive(it)
          ? 'background: var(--bw-ink); color: var(--bw-paper)'
          : 'color: var(--bw-muted)'"
      >{{ it.label }}</NuxtLink>
      <UButton icon="i-ph-plus" label="Neue Brand" size="sm" color="neutral" variant="outline" class="ml-2 rounded-full" style="background: var(--bw-surface-hi)" />
    </div>
  </nav>
</template>
