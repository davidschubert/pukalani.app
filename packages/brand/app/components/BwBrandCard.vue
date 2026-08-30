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
}>(), {
  flag: undefined,
  activity: undefined,
  score: undefined,
  gradient: () => ['#e6e5e2', '#b8b7b3', '#4a4a47'],
})
const bg = computed(() => `background: linear-gradient(165deg, ${props.gradient[0]} 0%, ${props.gradient[1]} 45%, ${props.gradient[2]} 100%)`)
</script>

<template>
  <div class="bw-root group">
    <div class="relative overflow-hidden rounded-[1.25rem]" style="aspect-ratio: 1 / 1">
      <div class="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]" :style="bg" />
      <p class="absolute inset-0 grid place-items-center p-6 text-center text-2xl font-extralight leading-snug tracking-tight" style="color: #f7f2ea; text-shadow: 0 1px 12px rgb(20 20 20 / 0.3)">{{ title }}</p>
    </div>
    <div class="mt-3 flex items-start justify-between gap-3">
      <p class="bw-label flex items-center gap-1.5" style="color: var(--bw-muted)">{{ path }}<UIcon v-if="flag" :name="flag" class="size-4 flex-none" /></p>
      <div class="flex flex-none items-center gap-2">
        <BwScoreRing v-if="score !== undefined" :value="score" :size="34" />
        <UDropdownMenu :items="[[{ label: 'Umbenennen', icon: 'i-ph-pencil-simple' }, { label: 'Teilen', icon: 'i-ph-share-network' }, { label: 'Löschen', icon: 'i-ph-trash' }]]">
          <UButton icon="i-ph-dots-three" color="neutral" variant="ghost" size="sm" aria-label="Aktionen" />
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
      <UButton size="sm" trailing-icon="i-ph-arrow-right" label="Weiterarbeiten" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </div>
  </div>
</template>
