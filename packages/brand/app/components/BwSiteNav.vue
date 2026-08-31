<script setup lang="ts">
/** Übergeordnete Header-Navigation für alle Seiten (Meine Brands ·
 *  Discover · Journal) — inkl. Konto-Menü (Runde 132, David): das
 *  Avatar-Menü wohnt DAUERHAFT hier oben rechts, nicht mehr in der
 *  Werkstatt-Topbar. */
const route = useRoute()
/* Reihenfolge (Runde 135, Empfehlung bestätigt): öffentlich → persönlich.
 * Discover und Journal sind die Außenwelt, Meine Brands steht als
 * persönlicher Bereich rechts — direkt neben seiner Aktion (Neue Brand)
 * und dem Konto. */
const items = [
  { label: 'Our Products', to: '/products', match: ['/products'] },
  { label: 'Discover Brands', to: '/brand/demo/discover', match: ['/brand/demo/discover', '/brand/demo/anatomie'] },
  { label: 'Brand Insights', to: '/brand/demo/journal', match: ['/brand/demo/journal', '/brand/demo/artikel', '/brand/demo/profil', '/brand/demo/duell'] },
  { label: 'About us', to: '/team', match: ['/team'] },
]
function isActive(it: { match: string[] }): boolean {
  return it.match.includes(route.path)
}

/* Neue Brand oeffnet das Start-Modal von jeder Seite aus. */
const newBrandOpen = ref(false)

/* Konto-Menü (aus BwWorkspace umgezogen): Sprachwechsel via
 * switchLocalePath, Erscheinungsbild nach Pukalani-Muster über
 * colorMode.preference. */
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const LOCALE_FLAGS: Record<string, string> = { en: 'i-circle-flags-us', de: 'i-circle-flags-de' }
const colorMode = useColorMode()
const APPEARANCE = [
  ['light', 'Hell', 'i-ph-sun'],
  ['dark', 'Dunkel', 'i-ph-moon'],
  ['system', 'System', 'i-ph-monitor'],
] as const
const userMenu = computed(() => [[
  {
    label: locale.value === 'de' ? 'Sprache: Deutsch' : 'Language: English',
    icon: 'i-ph-globe-simple',
    children: locales.value.map(entry => ({
      label: entry.code === 'de' ? 'Deutsch' : 'English',
      icon: LOCALE_FLAGS[entry.code] ?? 'i-ph-globe-hemisphere-west',
      type: 'checkbox' as const,
      checked: entry.code === locale.value,
      to: switchLocalePath(entry.code),
    })),
  },
  {
    label: 'Erscheinungsbild',
    icon: 'i-ph-sun-horizon',
    children: APPEARANCE.map(([mode, label, icon]) => ({
      label,
      icon,
      type: 'checkbox' as const,
      checked: colorMode.preference === mode,
      onSelect: (event: Event) => { event.preventDefault(); colorMode.preference = mode },
    })),
  },
], [
  { label: 'Tastaturkürzel', icon: 'i-ph-keyboard' },
  { label: 'Support kontaktieren', icon: 'i-ph-lifebuoy' },
], [
  { label: 'Konto', icon: 'i-ph-user-circle' },
  { label: 'Abmelden', icon: 'i-ph-sign-out' },
]])
</script>

<template>
  <nav
    class="sticky top-0 z-40 -mx-6 mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4"
    style="background: color-mix(in srgb, var(--bw-paper) 88%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)"
  >
    <NuxtLink to="/start" class="flex items-center gap-2.5">
      <span class="grid size-8 flex-none place-items-center rounded-xl" style="background: var(--bw-ink); color: var(--bw-paper)">
        <UIcon name="i-ph-fingerprint" class="size-4.5" />
      </span>
      <span class="text-sm font-semibold tracking-tight">Branding Supply</span>
    </NuxtLink>
    <!-- Runde 143 (David): klassische Navigation wie apple.com/openai.com —
         Geist Sans, reine Textlinks ohne Pill-/Button-Effekte; aktiv = Ink,
         inaktiv = muted, Hover hebt auf Ink. -->
    <div class="flex flex-wrap items-center gap-x-7 gap-y-2">
      <NuxtLink
        v-for="it in items" :key="it.to" :to="it.to"
        class="text-sm whitespace-nowrap transition-colors hover:!text-(--bw-ink)"
        :style="isActive(it) ? 'color: var(--bw-ink)' : 'color: var(--bw-muted)'"
      >{{ it.label }}</NuxtLink>
      <!-- Runde 145 (David): Split-Control — Meine-Brands-Pille und
           Plus-Kreis beruehren sich mit 0px Abstand. -->
      <div class="flex items-center gap-0">
        <UButton to="/" label="Meine Brands" size="sm" color="neutral" variant="solid" class="rounded-full" />
        <UButton icon="i-ph-plus" size="sm" color="neutral" variant="solid" class="rounded-full" aria-label="Neue Brand" @click="newBrandOpen = true" />
      </div>
      <BwNewBrandModal v-model:open="newBrandOpen" />
      <UDropdownMenu :items="userMenu">
        <button aria-label="Konto-Menü" class="ml-2 grid place-items-center"><UAvatar text="DS" size="sm" /></button>
      </UDropdownMenu>
    </div>
  </nav>
</template>
