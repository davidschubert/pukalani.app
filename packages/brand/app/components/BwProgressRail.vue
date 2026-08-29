<script setup lang="ts">
/** Fortschritt menschlich (§3d): "4 von 6 geklärt · ~8 Minuten", die fünf
 *  Schichten sichtbar, künftige sichtbar-GESPERRT (= sichtbare Schranke). */
export interface BwRailLayer {
  id: string
  label: string
  locked?: boolean
  lockedNote?: string
  steps?: { id: string, label: string, state: 'done' | 'active' | 'open', slots?: string, minutes?: string }[]
}
defineProps<{ layers: BwRailLayer[] }>()
</script>

<template>
  <nav aria-label="Fortschritt">
    <div class="bw-rail-full space-y-5">
      <div v-for="layer in layers" :key="layer.id">
        <div v-if="layer.locked" class="flex items-start justify-between gap-2 pr-1.5" style="color: var(--bw-muted)">
          <div>
            <div class="text-xs uppercase tracking-wider">{{ layer.label }}</div>
            <p class="mt-0.5 text-xs">{{ layer.lockedNote }}</p>
          </div>
          <UIcon name="i-ph-lock-simple" class="mt-0.5 size-4 flex-none" />
        </div>
        <template v-else>
          <div class="text-xs uppercase tracking-wider" style="color: var(--bw-ink-soft)">
            {{ layer.label }}
          </div>
          <ul class="mt-2 space-y-1.5">
          <li v-for="step in layer.steps" :key="step.id">
            <button
              class="flex w-full items-start gap-2 rounded-full px-3.5 py-2 text-left text-sm"
              :disabled="step.state === 'open'"
              :style="step.state === 'active' ? 'background: var(--bw-surface); color: var(--bw-ink); font-weight: 600; box-shadow: var(--bw-shadow-card)' : step.state === 'open' ? 'color: var(--bw-muted)' : 'color: var(--bw-ink-soft)'"
            >
              <span class="flex-1">
                {{ step.label }}
                <span v-if="step.slots" class="block text-xs font-normal" style="color: var(--bw-muted)">{{ step.slots }}<template v-if="step.minutes"> · {{ step.minutes }}</template></span>
              </span>
              <UIcon :name="step.state === 'done' ? 'i-ph-check-circle-fill' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'" class="mt-0.5 size-4 flex-none" />
            </button>
          </li>
          </ul>
        </template>
      </div>
    </div>
    <div class="bw-rail-mini flex flex-col items-center gap-3 pt-1">
      <template v-for="layer in layers" :key="layer.id">
        <UIcon v-if="layer.locked" name="i-ph-lock-simple" style="color: var(--bw-muted)" />
        <UIcon
          v-for="step in layer.steps" v-else :key="step.id"
          :name="step.state === 'done' ? 'i-ph-check-circle-fill' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'"
          :style="`color: var(--bw-${step.state === 'active' ? 'accent' : 'muted'})`"
        />
      </template>
    </div>
  </nav>
</template>
