<script setup lang="ts">
/** Brand Score (Davids Idee, Runde 94): Lighthouse-artiger Ring —
 *  fundiert gerechnet, nie gefühlt. Farblogik wie Lighthouse:
 *  90+ = accent, 50–89 = draft, darunter = stale. */
const props = withDefaults(defineProps<{ value: number, size?: number, label?: string }>(), { size: 48 })
const R = 20
const CIRC = 2 * Math.PI * R
const tone = computed(() => props.value >= 90 ? 'var(--bw-accent)' : props.value >= 50 ? 'var(--bw-draft)' : 'var(--bw-stale)')
</script>

<template>
  <div class="flex flex-col items-center gap-1.5">
    <div class="relative" :style="`width: ${size}px; height: ${size}px`">
      <svg viewBox="0 0 48 48" class="size-full -rotate-90">
        <circle cx="24" cy="24" :r="R" fill="none" stroke="var(--bw-line)" stroke-width="3.5" />
        <circle
          cx="24" cy="24" :r="R" fill="none" :stroke="tone" stroke-width="3.5" stroke-linecap="round"
          :stroke-dasharray="CIRC" :stroke-dashoffset="CIRC * (1 - value / 100)"
        />
      </svg>
      <span class="bw-label absolute inset-0 grid place-items-center" :style="`color: ${tone}`">{{ value }}</span>
    </div>
    <p v-if="label" class="bw-label text-center" style="color: var(--bw-muted)">{{ label }}</p>
  </div>
</template>
