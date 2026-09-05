<script setup lang="ts">
/**
 * DIE REITER DES BRAND-CHECKS — Start · Ranking · Vergleich
 * (Konzept: docs/plans/BRAND-CHECK-SEITE.md §1).
 *
 * ── JEDER REITER IST EINE EIGENE ADRESSE, KEIN ZUSTAND ────────────────────
 * Deshalb LINKS und kein `UTabs` mit `v-model`: die drei Ansichten sind
 * teilbar, serverseitig gerendert und im Verlauf des Browsers auffindbar.
 * Die Optik borgt sich UTabs (Pillen in einer Leiste), das Verhalten nicht.
 *
 * ── „bald" IST EIN ZUSTAND, KEIN LINK ─────────────────────────────────────
 * Ranking (P3) und Vergleich (P4) sind noch nicht gebaut. Sie stehen hier
 * trotzdem, weil die Seite ihre Nachbarn ankündigt — aber als ETIKETT, nicht
 * als Link: ein Reiter, der auf die Seite zurückführt, auf der man schon
 * steht, ist eine Sackgasse mit Beschriftung. Fertig heisst genau eine
 * Änderung je Reiter: `soon: false` und der echte Pfad; alles andere hier
 * bleibt, wie es ist.
 *
 * ── DER AKTIVE REITER BLEIBT EIN LINK ─────────────────────────────────────
 * Auf der Ergebnisseite (`/brand-check/<id>`) ist „Start" der Rückweg — sie
 * setzt `current="start"` und bekommt damit den Weg zurück zur Startseite des
 * Instruments. Ein aktiver Reiter, der nicht klickbar wäre, hätte diesen
 * Rückweg nicht.
 */
const props = withDefaults(defineProps<{
  /** Welcher Reiter die aktuelle Ansicht ist. */
  current?: 'start' | 'ranking' | 'compare'
}>(), { current: 'start' })

const { t } = useI18n()
const localePath = useLocalePath()

interface TabDefinition {
  key: 'start' | 'ranking' | 'compare'
  path: string
  soon: boolean
}

/** Die Ziele — die EINE Stelle, die P3/P4 anfassen. */
const TABS: readonly TabDefinition[] = [
  { key: 'start', path: '/brand-check', soon: false },
  { key: 'ranking', path: '/brand-check/ranking', soon: true },
  { key: 'compare', path: '/brand-check/vergleich', soon: true },
] as const

const tabs = computed(() => TABS.map(tab => ({
  ...tab,
  label: t(`brand.checkPage.tabs.${tab.key}`),
  to: localePath(tab.path),
  active: tab.key === props.current,
})))
</script>

<template>
  <nav
    :aria-label="t('brand.checkPage.tabsAria')"
    class="bw-frame inline-flex flex-wrap items-center gap-1 p-1"
    style="background: var(--bw-surface-hi)"
    data-check-tabs
  >
    <template v-for="tab in tabs" :key="tab.key">
      <NuxtLink
        v-if="!tab.soon"
        :to="tab.to"
        class="rounded-full px-4 py-1.5 text-sm tracking-tight transition-colors"
        :style="tab.active
          ? 'background: var(--bw-ink); color: var(--bw-paper)'
          : 'color: var(--bw-muted)'"
        :aria-current="tab.active ? 'page' : undefined"
        :data-check-tab="tab.key"
      >
        {{ tab.label }}
      </NuxtLink>
      <span
        v-else
        class="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm tracking-tight"
        style="color: var(--bw-muted)"
        aria-disabled="true"
        :data-check-tab="tab.key"
        data-check-tab-soon
      >
        {{ tab.label }}
        <span class="bw-label rounded-full px-2 py-0.5" style="background: var(--bw-surface); color: var(--bw-muted)">
          {{ t('brand.checkPage.tabs.soon') }}
        </span>
      </span>
    </template>
  </nav>
</template>
