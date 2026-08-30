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
  { label: 'Discover', to: '/brand/demo/discover', match: ['/brand/demo/discover', '/brand/demo/anatomie'] },
  { label: 'Journal', to: '/brand/demo/journal', match: ['/brand/demo/journal', '/brand/demo/artikel', '/brand/demo/profil', '/brand/demo/duell'] },
  { label: 'Meine Brands', to: '/', match: ['/', '/brand/demo/beispiel'] },
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
    <NuxtLink to="/" class="flex items-center gap-2.5">
      <span class="grid size-8 flex-none place-items-center rounded-xl" style="background: var(--bw-ink); color: var(--bw-paper)">
        <UIcon name="i-ph-paw-print-fill" class="size-4.5" />
      </span>
      <span class="text-sm font-semibold tracking-tight">Branding Supply</span>
    </NuxtLink>
    <div class="flex flex-wrap items-center gap-1.5">
      <NuxtLink
        v-for="it in items" :key="it.to" :to="it.to"
        class="bw-label whitespace-nowrap rounded-full px-3.5 py-2 transition-colors"
        :style="isActive(it)
          ? 'background: var(--bw-ink); color: var(--bw-paper)'
          : 'color: var(--bw-muted)'"
      >{{ it.label }}</NuxtLink>
      <UButton icon="i-ph-plus" label="Neue Brand" size="sm" color="neutral" variant="outline" class="ml-2 rounded-full" style="background: var(--bw-surface-hi)" @click="newBrandOpen = true" />
      <BwNewBrandModal v-model:open="newBrandOpen" />
      <UDropdownMenu :items="userMenu">
        <button aria-label="Konto-Menü" class="ml-2 grid place-items-center"><UAvatar text="DS" size="sm" /></button>
      </UDropdownMenu>
    </div>
  </nav>
</template>
