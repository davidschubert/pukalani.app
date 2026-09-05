<script setup lang="ts">
/**
 * PROTOTYP (M0) — die Übersicht der vier Screens (Plan §2.11).
 *
 * Sie ist Davids Einstieg für die Abnahme-Runde: vier Adressen, die drei
 * erfundenen Demo-Websites daneben, und der Satz, was dieser Prototyp NICHT
 * tut (kein Server, kein Modell, keine Tabellen).
 */
const { t } = useI18n()
const localePath = useLocalePath()

const screens = [
  { key: 'screen1', to: '/market/demo/markt', icon: 'i-ph-list-checks' },
  { key: 'screen2', to: '/market/demo/lauf', icon: 'i-ph-spinner-gap' },
  { key: 'screen3', to: '/market/demo/ergebnis', icon: 'i-ph-table' },
  { key: 'screen4', to: '/market/demo/werkstatt', icon: 'i-ph-book-open' },
]

const sites = [
  { name: 'Upcountry Roast Co.', host: 'upcountry-roast.example', href: '/demo-sites/upcountry-roast/index.html' },
  { name: 'Pacific Bean Supply', host: 'pacificbean.example', href: '/demo-sites/pacificbean/index.html' },
  { name: 'Kona Trading', host: 'kona-trading.example', href: '/demo-sites/kona-trading/index.html' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-12">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-medium tracking-tight">{{ t('market.demo.title') }}</h1>
      <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.demo.lead') }}</p>
      <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-muted)">{{ t('market.demo.note') }}</p>

      <ul class="mt-8 space-y-2">
        <li v-for="screen in screens" :key="screen.key">
          <NuxtLink :to="localePath(screen.to)" class="bw-card bw-card--hover flex items-center gap-3 p-4">
            <UIcon :name="screen.icon" class="size-5 flex-none" style="color: var(--bw-muted)" />
            <span class="min-w-0 flex-1 text-sm font-medium">{{ t(`market.demo.${screen.key}`) }}</span>
            <UIcon name="i-ph-arrow-right" class="size-4 flex-none" style="color: var(--bw-muted)" />
          </NuxtLink>
        </li>
      </ul>

      <h2 class="mt-10 text-lg font-medium tracking-tight">{{ t('market.demo.sites') }}</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="site in sites" :key="site.host">
          <a :href="site.href" class="bw-card bw-card--hover flex items-center gap-3 p-4">
            <UIcon name="i-ph-globe-simple" class="size-5 flex-none" style="color: var(--bw-muted)" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium">{{ site.name }}</span>
              <span class="bw-label block" style="color: var(--bw-muted)">{{ site.host }}</span>
            </span>
            <UIcon name="i-ph-arrow-up-right" class="size-4 flex-none" style="color: var(--bw-muted)" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
