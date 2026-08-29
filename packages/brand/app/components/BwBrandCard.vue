<script setup lang="ts">
/** "Meine Brands"-Karte (§3d): ruhig, kein Datengrid. */
defineProps<{
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
}>()
</script>

<template>
  <div class="bw-root bw-card bw-card--hover p-8">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold">{{ title }}</h3>
        <p class="bw-label flex items-center gap-1.5" style="color: var(--bw-muted)">{{ path }}<UIcon v-if="flag" :name="flag" class="size-4 flex-none" /></p>
      </div>
      <div class="flex flex-none items-center gap-2">
        <BwScoreRing v-if="score !== undefined" :value="score" :size="40" />
      <UDropdownMenu :items="[[{ label: 'Umbenennen', icon: 'i-ph-pencil-simple' }, { label: 'Teilen', icon: 'i-ph-share-network' }, { label: 'Löschen', icon: 'i-ph-trash' }]]">
        <UButton icon="i-ph-dots-three" color="neutral" variant="ghost" size="sm" aria-label="Aktionen" />
      </UDropdownMenu>
      </div>
    </div>
    <div class="mt-4 flex items-end justify-between gap-3">
      <p class="bw-label" style="color: var(--bw-ink-soft)">{{ step }}</p>
      <BwSparkline v-if="activity" :values="activity" style="color: var(--bw-line-strong)" />
    </div>
    <!-- Runde 52 (David): dasselbe Fortschritts-Modul wie unten links im
         Wizard — Mono-Versal-Zeile, Prozent, horizontaler Balken. -->
    <div class="mt-4">
      <div class="flex items-baseline justify-between gap-3">
        <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">{{ progress }} · {{ remaining }}</p>
        <span class="bw-label uppercase tracking-wider">{{ pct }}&thinsp;%</span>
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
        <div class="h-full rounded-full" :style="`width: ${pct}%; background: var(--bw-accent)`" />
      </div>
    </div>
    <div class="mt-4 flex items-center justify-between">
      <span class="bw-label" style="color: var(--bw-muted)">{{ edited }}</span>
      <UButton size="sm" trailing-icon="i-ph-arrow-right" label="Weiterarbeiten" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </div>
  </div>
</template>
