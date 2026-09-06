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
const localePath = useLocalePath()

/**
 * NUR ECHTE ZIELE (Davids 404-Audit 2026-09-03): „Products" (samt der sieben
 * Dropdown-Kinder), „Discover Brands" und „Brand Insights" zeigten auf
 * `/products` (404) bzw. die Klickdummy-Pfade `/brand/demo/*` — die fängt in
 * der echten App die Werkstatt-Route als profileId='demo' und rendert eine
 * leere „Namenloses Branding"-Hülle. Die drei Punkte kommen zurück, SOBALD
 * ihre Marketing-Seiten existieren (die i18n-Schlüssel `brand.nav.products`
 * etc. bleiben dafür stehen). Links IMMER über `localePath()` — nackte Pfade
 * warfen den Besucher von /de auf die englische Fassung.
 */
const menuItems = computed(() => [
  // Seit der Aufteilung (Davids Entscheidung 2026-09-04) sind das ZWEI
  // Seiten: /about = wer wir sind, /team = die Menschen dahinter.
  { label: t('brand.nav.about'), to: localePath('/about'), active: route.path.endsWith('/about') },
  { label: t('brand.nav.team'), to: localePath('/team'), active: route.path.endsWith('/team') },
])

/* Neue Brand oeffnet das Start-Modal von jeder Seite aus. */
const newBrandOpen = ref(false)

/* DAS KONTO IST ECHT (Nacht 2026-09-03): das Avatar trug ein hartkodiertes
 * „DS", „Abmelden" war ein toter Menüpunkt, und ein Gast sah ein Konto-Menü
 * ohne Konto. Jetzt: Initialen aus dem echten Konto (Name vor E-Mail),
 * Abmelden über den Core-Weg (useLogout), Gäste bekommen den Login-Knopf. */
const { user, isLoggedIn } = useCurrentUser()
const { logout } = useLogout()
const initials = computed(() => {
  const source = (user.value?.name || user.value?.email || '').trim()
  if (!source) return '?'
  const words = source.split(/\s+/).filter(Boolean)
  return words.length >= 2
    ? `${words[0]![0]}${words[1]![0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase()
})

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
  { label: t('brand.brands.title'), icon: 'i-ph-squares-four', to: localePath('/dashboard/brands') },
  /* „Brand-Scores" (P6c, Davids Auftrag 2026-09-06) steht DIREKT unter den
   * Brandings: es ist dieselbe Menge Brands, nur als Liste mit ihren Zahlen.
   * Er wohnt HIER und nicht in `pukalani.admin.modules` — die Registry rendert
   * ausschliesslich in der Betreiber-Shell (`layout: 'dashboard'`), und ein
   * Beta-Kunde hat keine `dashboard.access`-Capability. Sein Menüpunkt wäre
   * dort für genau die Menschen unsichtbar, für die die Seite gebaut ist. */
  { label: t('brand.myScores.list.nav'), icon: 'i-ph-gauge', to: localePath('/dashboard/brand-scores') },
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
  /* Seit der admin-Montage (2026-09-03) sind das ECHTE Ziele: die
   * Konto-Seiten für jedes eingeloggte Konto, das Betreiber-Dashboard nur
   * für Konten mit `admin`/`moderator`-Label (dieselbe RBAC-Matrix, die
   * auch die Seite selbst durchsetzt — der Menüpunkt ist nur Sichtbarkeit,
   * nie die Grenze). */
  ...(userHasCapability(user.value, 'dashboard.access')
    ? [{ label: t('brand.nav.dashboard'), icon: 'i-ph-squares-four', to: localePath('/dashboard') }]
    : []),
  { label: t('brand.nav.account'), icon: 'i-ph-user-circle', to: localePath('/dashboard/settings') },
  { label: t('brand.nav.signOut'), icon: 'i-ph-sign-out', onSelect: () => { void logout() } },
]])
</script>

<template>
  <!-- Runde 178 (David): der Header IST Nuxt UIs UHeader — volle Breite,
       startet buendig oben, sticky und Mobile-Menue kommen mit. Farben
       laufen ueber unsere Tokens (Inline-Style schlaegt die Theme-Klassen). -->
  <!-- Das Logo führt zur Startseite — `/start` war der Klickdummy-Pfad und
       auf branding.supply ein 404 (Davids 404-Audit 2026-09-03). -->
  <UHeader
    :to="localePath('/')" class="bw-root -mx-6 mb-10"
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
      <UDropdownMenu v-if="isLoggedIn" :items="userMenu">
        <button :aria-label="t('brand.nav.accountMenu')" class="grid place-items-center"><UAvatar :text="initials" size="md" /></button>
      </UDropdownMenu>
      <UButton
        v-else :to="localePath('/login')" color="neutral" variant="ghost" size="sm"
        :label="t('brand.nav.signIn')"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="menuItems" orientation="vertical" variant="link" color="neutral" class="-mx-2.5"
        :ui="{ link: 'text-sm text-(--bw-muted) data-active:text-(--bw-ink) hover:text-(--bw-ink)' }"
      />
    </template>
  </UHeader>
</template>
