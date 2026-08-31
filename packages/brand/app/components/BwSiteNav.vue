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
    label: 'Products',
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
  { label: 'About', to: '/team', active: route.path === '/team' },
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
  <!-- Runde 178 (David): der Header IST Nuxt UIs UHeader — volle Breite,
       startet buendig oben, sticky und Mobile-Menue kommen mit. Farben
       laufen ueber unsere Tokens (Inline-Style schlaegt die Theme-Klassen). -->
  <UHeader
    to="/start" class="bw-root mb-10"
    :ui="{ container: 'max-w-full px-6', title: 'flex items-center gap-2.5 text-sm font-semibold' }"
    style="background: color-mix(in srgb, var(--bw-paper) 88%, transparent); border-color: var(--bw-line)"
  >
    <template #title>
      <!-- Runde 181 (David, Referenz PLATSUPPLY): Kreis-Marke + Versal-
           Wortmarke, fette variable Geist mit weitem Tracking. -->
      <span class="grid size-8 flex-none place-items-center rounded-full" style="background: var(--bw-ink); color: var(--bw-paper)">
        <UIcon name="i-ph-fingerprint" class="size-5" />
      </span>
      <span class="whitespace-nowrap text-[15px] uppercase" style="color: var(--bw-ink); font-weight: 800; letter-spacing: 0.12em">Branding Supply</span>
    </template>

    <UNavigationMenu
      :items="menuItems" variant="link" color="neutral"
      :ui="{ link: 'text-sm text-(--bw-muted) data-active:text-(--bw-ink) hover:text-(--bw-ink)', viewport: 'bw-root', childList: 'grid-cols-1', childLinkDescription: 'text-(--bw-muted)' }"
    />

    <template #right>
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
    </template>

    <template #body>
      <UNavigationMenu
        :items="menuItems" orientation="vertical" variant="link" color="neutral" class="-mx-2.5"
        :ui="{ link: 'text-sm text-(--bw-muted) data-active:text-(--bw-ink) hover:text-(--bw-ink)' }"
      />
    </template>
  </UHeader>
</template>
