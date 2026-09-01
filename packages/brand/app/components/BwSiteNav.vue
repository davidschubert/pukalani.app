<script setup lang="ts">
/** Übergeordnete Header-Navigation für alle Seiten (Meine Brands ·
 *  Discover · Journal) — inkl. Konto-Menü (Runde 132, David): das
 *  Avatar-Menü wohnt DAUERHAFT hier oben rechts, nicht mehr in der
 *  Werkstatt-Topbar. */
const route = useRoute()
/* Die Beschriftungen laufen seit 2026-09-01 über i18n (`brand.nav.*`) —
 * vorher standen sie fest deutsch auch auf der englischen Oberfläche.
 * AUSNAHME und Davids Design: die vier Hauptpunkte heißen in BEIDEN
 * Sprachen englisch (Products · Discover Brands · Brand Insights · About),
 * ebenso die sieben Produktnamen im Aufklapper — übersetzt sind nur ihre
 * Beschreibungen. */
const { t } = useI18n()
/* Reihenfolge (Runde 135, Empfehlung bestätigt): öffentlich → persönlich.
 * Discover und Journal sind die Außenwelt, Meine Brands steht als
 * persönlicher Bereich rechts — direkt neben seiner Aktion (Neue Brand)
 * und dem Konto. */
/* Runde 170 (David): „Our Products" als Dropdown im Nuxt-UI-Muster —
 * UNavigationMenu mit Kindern (Icon + Titel + Beschreibung). */
const menuItems = computed(() => [
  {
    label: t('brand.nav.products'),
    active: route.path === '/products',
    children: [
      { label: 'Brand Wizard', icon: 'i-ph-chats-circle', description: t('brand.nav.product.wizard'), to: '/products' },
      { label: 'Brand Design', icon: 'i-ph-palette', description: t('brand.nav.product.design'), to: '/products' },
      { label: 'Brand Book & Kit', icon: 'i-ph-book-open-text', description: t('brand.nav.product.book'), to: '/products' },
      { label: 'Brand Experience', icon: 'i-ph-rocket-launch', description: t('brand.nav.product.experience'), to: '/products' },
      { label: 'Brand Monitoring', icon: 'i-ph-broadcast', description: t('brand.nav.product.monitoring'), to: '/products' },
      { label: 'Brand Score', icon: 'i-ph-gauge', description: t('brand.nav.product.score'), to: '/products' },
      { label: 'Brand Benchmark', icon: 'i-ph-binoculars', description: t('brand.nav.product.benchmark'), to: '/products' },
    ],
  },
  { label: t('brand.nav.discover'), to: '/brand/demo/discover', active: ['/brand/demo/discover', '/brand/demo/anatomie'].includes(route.path) },
  { label: t('brand.nav.insights'), to: '/brand/demo/journal', active: ['/brand/demo/journal', '/brand/demo/artikel', '/brand/demo/profil', '/brand/demo/duell'].includes(route.path) },
  { label: t('brand.nav.about'), to: '/team', active: route.path === '/team' },
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
/* Sprachnamen bleiben Eigennamen (de = en) — nur die drei
 * Erscheinungsbild-Beschriftungen laufen über i18n. */
const APPEARANCE = [
  ['light', 'brand.nav.theme.light', 'i-ph-sun'],
  ['dark', 'brand.nav.theme.dark', 'i-ph-moon'],
  ['system', 'brand.nav.theme.system', 'i-ph-monitor'],
] as const
const userMenu = computed(() => [[
  { label: t('brand.brands.title'), icon: 'i-ph-squares-four', to: '/' },
  { label: t('brand.brands.new'), icon: 'i-ph-plus', onSelect: () => { newBrandOpen.value = true } },
], [
  {
    /* Ein Schlüssel JE SPRACHE — die Zeile nennt die aktive Sprache in
     * genau dieser Sprache („Sprache: Deutsch" / „Language: English"). */
    label: t('brand.nav.language'),
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
    label: t('brand.nav.appearance'),
    icon: 'i-ph-sun-horizon',
    children: APPEARANCE.map(([mode, labelKey, icon]) => ({
      label: t(labelKey),
      icon,
      type: 'checkbox' as const,
      checked: colorMode.preference === mode,
      onSelect: (event: Event) => { event.preventDefault(); colorMode.preference = mode },
    })),
  },
], [
  { label: t('brand.nav.account'), icon: 'i-ph-user-circle' },
  { label: t('brand.nav.signOut'), icon: 'i-ph-sign-out' },
]])
</script>

<template>
  <!-- Runde 178 (David): der Header IST Nuxt UIs UHeader — volle Breite,
       startet buendig oben, sticky und Mobile-Menue kommen mit. Farben
       laufen ueber unsere Tokens (Inline-Style schlaegt die Theme-Klassen). -->
  <UHeader
    to="/start" class="bw-root -mx-6 mb-10"
    :ui="{ container: 'max-w-full px-6', title: 'flex items-center gap-2.5 text-sm font-semibold' }"
    style="background: color-mix(in srgb, var(--bw-paper) 88%, transparent); border-color: var(--bw-line)"
  >
    <template #title>
      <!-- Runde 181 (David, Referenz PLATSUPPLY): Kreis-Marke + Versal-
           Wortmarke, fette variable Geist mit weitem Tracking. -->
      <span class="grid size-8 flex-none place-items-center rounded-full" style="background: var(--bw-ink); color: var(--bw-paper)">
        <UIcon name="i-ph-fingerprint" class="size-5" />
      </span>
      <span class="whitespace-nowrap text-[18px]" style="color: var(--bw-ink); font-weight: 400; letter-spacing: -0.01em">Branding Supply</span>
    </template>

    <UNavigationMenu
      :items="menuItems" variant="link" color="neutral"
      :ui="{ link: 'text-sm text-(--bw-muted) data-active:text-(--bw-ink) hover:text-(--bw-ink)', viewport: 'bw-root', childList: 'grid-cols-1', childLinkDescription: 'text-(--bw-muted)' }"
    />

    <template #right>
      <!-- Runde 189 (David): Meine Brands + Neue Brand leben im
           Avatar-Menue — rechts steht nur noch das Konto. -->
      <BwNewBrandModal v-model:open="newBrandOpen" />
      <UDropdownMenu :items="userMenu">
        <button :aria-label="t('brand.nav.accountMenu')" class="grid place-items-center"><UAvatar text="DS" size="md" /></button>
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
