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
/* Runde 170 (David): „Our Products" als Dropdown im Nuxt-UI-Muster —
 * UNavigationMenu mit Kindern (Icon + Titel + Beschreibung). */
const menuItems = computed(() => [
  {
    label: 'Our Products',
    active: route.path === '/products',
    children: [
      { label: 'Brand Wizard', icon: 'i-ph-chats-circle', description: 'Eure Marke entsteht im Gespräch mit George.', to: '/products' },
      { label: 'Brand Design', icon: 'i-ph-palette', description: 'Drei Moodboards aus eurer Visual DNA.', to: '/products' },
      { label: 'Brand Book & Kit', icon: 'i-ph-book-open-text', description: 'Book, Tokens, brand.json + Strategy Playbook.', to: '/products' },
      { label: 'Brand Experience', icon: 'i-ph-rocket-launch', description: 'Assets und Pläne entlang des 90-Tage-Plans.', to: '/products' },
      { label: 'Brand Monitoring', icon: 'i-ph-broadcast', description: 'Wöchentlicher Blick von außen, mit Alerts.', to: '/products' },
      { label: 'Brand Score', icon: 'i-ph-gauge', description: '40 Prüfkriterien, reproduzierbar gerechnet.', to: '/products' },
      { label: 'Brand Benchmark', icon: 'i-ph-binoculars', description: 'Wettbewerber im selben Raster.', to: '/products' },
    ],
  },
  { label: 'Discover Brands', to: '/brand/demo/discover', active: ['/brand/demo/discover', '/brand/demo/anatomie'].includes(route.path) },
  { label: 'Brand Insights', to: '/brand/demo/journal', active: ['/brand/demo/journal', '/brand/demo/artikel', '/brand/demo/profil', '/brand/demo/duell'].includes(route.path) },
  { label: 'About us', to: '/team', active: route.path === '/team' },
])

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
    <!-- Runde 143/165 (David): klassische Navigation, LINKSBUENDIG neben
         der Wortmarke — Geist Sans, reine Textlinks; aktiv = Ink,
         inaktiv = muted. Rechts nur die Aktionen. -->
    <div class="flex flex-wrap items-center gap-x-10 gap-y-2">
      <NuxtLink to="/start" class="flex items-center gap-2.5">
        <span class="grid size-8 flex-none place-items-center rounded-xl" style="background: var(--bw-ink); color: var(--bw-paper)">
          <UIcon name="i-ph-fingerprint" class="size-4.5" />
        </span>
        <span class="text-sm font-semibold tracking-tight">Branding Supply</span>
      </NuxtLink>
      <UNavigationMenu
        :items="menuItems" variant="link" color="neutral"
        :ui="{ link: 'text-sm text-(--bw-muted) data-active:text-(--bw-ink) hover:text-(--bw-ink)', viewport: 'bw-root', childLinkDescription: 'text-(--bw-muted)' }"
      />
    </div>
    <div class="flex flex-wrap items-center gap-1.5">
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
