<script setup lang="ts">
/** "Meine Brands"-Karte (§3d): ruhig, kein Datengrid. Seit Runde 118
 *  wie die Discover-Kacheln: quadratisches Farbwelt-Bild mit der
 *  Wortmarke mittig, Details darunter auf der Freifläche. */
const props = withDefaults(defineProps<{
  title: string
  path: string
  flag?: string
  step: string
  progress: string
  remaining: string
  edited: string
  pct: number
  activity?: number[]
  score?: number
  /** Farbwelt der Brand: [hell, mittel, dunkel]. */
  gradient?: [string, string, string]
  /* Runde 35 (David): der „Euer Branding"-Einstieg wohnt AN DER KACHEL —
   * gesperrt (ausgegraut, Schloss), bis die Brand Foundation abgeschlossen
   * ist; erst dann aktiv mit Score und Pfeil. Bewusst kein 100%-Gate:
   * Monitoring läuft dauerhaft, „alles fertig" träte nie ein. */
  resultTo?: string
  resultReady?: boolean
}>(), {
  flag: undefined,
  activity: undefined,
  score: undefined,
  gradient: () => ['#e6e5e2', '#b8b7b3', '#4a4a47'],
  resultTo: undefined,
  resultReady: false,
})
const bg = computed(() => `background: linear-gradient(165deg, ${props.gradient[0]} 0%, ${props.gradient[1]} 45%, ${props.gradient[2]} 100%)`)
/* Die Karten-TEXTE reicht die Seite bereits übersetzt herein (`step`,
 * `progress`, `remaining`, `edited`); übrig blieben das Aktionen-Menü und
 * der Knopf — die laufen seit 2026-09-01 ebenfalls über i18n. */
const { t } = useI18n()
const actions = computed(() => [[
  { label: t('brand.brands.card.rename'), icon: 'i-ph-pencil-simple' },
  { label: t('brand.brands.card.share'), icon: 'i-ph-share-network' },
  { label: t('brand.brands.card.delete'), icon: 'i-ph-trash' },
]])
</script>

<template>
  <div class="bw-root group">
    <div class="bw-tile relative overflow-hidden" style="aspect-ratio: 1 / 1">
      <div class="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]" :style="bg" />
      <p class="absolute inset-0 grid place-items-center p-6 text-center text-2xl font-extralight leading-snug tracking-tight" style="color: #f7f2ea; text-shadow: 0 1px 12px rgb(20 20 20 / 0.3)">{{ title }}</p>
    </div>
    <div class="mt-3 flex items-start justify-between gap-3">
      <p class="bw-label flex items-center gap-1.5" style="color: var(--bw-muted)">{{ path }}<UIcon v-if="flag" :name="flag" class="size-4 flex-none" /></p>
      <div class="flex flex-none items-center gap-2">
        <BwScoreRing v-if="score !== undefined" :value="score" :size="34" />
        <UDropdownMenu :items="actions">
          <UButton icon="i-ph-dots-three" color="neutral" variant="ghost" size="sm" :aria-label="t('brand.brands.card.actions')" />
        </UDropdownMenu>
      </div>
    </div>
    <div class="mt-2 flex items-end justify-between gap-3">
      <p class="bw-label" style="color: var(--bw-ink-soft)">{{ step }}</p>
      <BwSparkline v-if="activity" :values="activity" style="color: var(--bw-line-strong)" />
    </div>
    <!-- Runde 52 (David): dasselbe Fortschritts-Modul wie unten links im
         Wizard — Mono-Versal-Zeile, Prozent, horizontaler Balken. -->
    <div class="mt-3">
      <div class="flex items-baseline justify-between gap-3">
        <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">{{ progress }} · {{ remaining }}</p>
        <span class="bw-label uppercase tracking-wider">{{ pct }}&thinsp;%</span>
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
        <div class="h-full rounded-full" :style="`width: ${pct}%; background: var(--bw-accent)`" />
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <span class="bw-label" style="color: var(--bw-muted)">{{ edited }}</span>
      <UButton size="sm" trailing-icon="i-ph-arrow-right" :label="t('brand.brands.card.continue')" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </div>
    <!-- Runde 35: der Ergebnis-Einstieg (vorher Button in der Werkstatt-
         Spalte). Button statt NuxtLink, weil die Karte auf der Übersicht
         selbst in einem Link steckt — kein a-in-a. -->
    <div v-if="resultTo" class="mt-3">
      <button
        v-if="resultReady" type="button"
        class="flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
        style="background: var(--bw-surface-hi); box-shadow: var(--bw-shadow-card)"
        @click.stop.prevent="navigateTo(resultTo)"
      >
        <BwScoreRing v-if="score !== undefined" :value="score" :size="28" class="flex-none" />
        <span class="min-w-0 flex-1 font-medium">{{ t('brand.brands.card.result') }}</span>
        <span class="grid size-7 flex-none place-items-center rounded-full">
          <UIcon name="i-ph-arrow-right" class="size-4" style="color: var(--bw-ink-soft)" />
        </span>
      </button>
      <div
        v-else class="flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-sm"
        style="background: var(--bw-surface); color: var(--bw-muted)"
        :aria-label="t('brand.brands.card.resultLocked')"
      >
        <span class="grid size-7 flex-none place-items-center rounded-full" style="background: var(--bw-surface-hi)">
          <UIcon name="i-ph-lock-simple" class="size-4" />
        </span>
        <span class="min-w-0 flex-1">{{ t('brand.brands.card.result') }}</span>
        <span class="bw-label flex-none pr-1">{{ t('brand.brands.card.resultLocked') }}</span>
      </div>
    </div>
  </div>
</template>
