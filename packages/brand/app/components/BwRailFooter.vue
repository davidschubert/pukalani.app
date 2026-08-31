<script setup lang="ts">
/** Gesamt-Fortschritt + Branding-Einstieg unten in der Rail — aus
 *  BwWorkspace extrahiert (Runde 191), weil die Rail seit dem Splitter
 *  in ZWEI Zweigen lebt (Grid-Fallback + Splitter-Panel) und der Fuß
 *  nur eine Quelle haben darf. */
defineProps<{
  progressPct: number
  progressNote?: string
  progressSubnote?: string
  progressTo?: string
  score?: number
}>()
</script>

<template>
  <div class="flex-none pt-5">
    <NuxtLink
      v-if="progressTo" :to="progressTo"
      class="mb-4 flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
      style="background: var(--bw-surface-hi); box-shadow: var(--bw-shadow-card)"
    >
      <span class="grid size-7 flex-none place-items-center rounded-full" style="background: var(--bw-accent-soft)">
        <UIcon name="i-ph-sparkle" class="size-4" style="color: var(--bw-accent)" />
      </span>
      <span class="min-w-0 flex-1 font-medium">Euer Branding</span>
      <BwScoreRing v-if="score !== undefined" :value="score" :size="28" class="flex-none" />
      <span class="grid size-7 flex-none place-items-center rounded-full">
        <UIcon name="i-ph-arrow-right" class="size-4" style="color: var(--bw-ink-soft)" />
      </span>
    </NuxtLink>
    <div class="flex items-baseline justify-between gap-3">
      <p v-if="progressNote" class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
        {{ progressNote }}
        <span v-if="progressSubnote" class="block">{{ progressSubnote }}</span>
      </p>
      <span class="bw-label flex-none uppercase tracking-wider whitespace-nowrap">{{ progressPct }}&thinsp;%</span>
    </div>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
      <div class="h-full rounded-full transition-all" :style="`width: ${progressPct}%; background: var(--bw-accent)`" />
    </div>
  </div>
</template>
