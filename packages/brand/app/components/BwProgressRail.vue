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
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider" :style="`color: var(--bw-${layer.locked ? 'muted' : 'ink-soft'})`">
          <UIcon v-if="layer.locked" name="i-ph-lock-simple" />
          {{ layer.label }}
        </div>
        <p v-if="layer.locked" class="mt-1 text-xs" style="color: var(--bw-muted)">{{ layer.lockedNote }}</p>
        <ul v-else class="mt-2 space-y-1.5">
          <li v-for="step in layer.steps" :key="step.id">
            <button
              class="flex w-full items-start gap-2 rounded px-1.5 py-1 text-left text-sm"
              :disabled="step.state === 'open'"
              :style="step.state === 'active' ? 'background: var(--bw-accent-soft); color: var(--bw-accent); font-weight: 600' : step.state === 'open' ? 'color: var(--bw-muted)' : 'color: var(--bw-ink-soft)'"
            >
              <UIcon :name="step.state === 'done' ? 'i-ph-check-circle-fill' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'" class="mt-0.5 flex-none" />
              <span>
                {{ step.label }}
                <span v-if="step.slots" class="block text-xs font-normal" style="color: var(--bw-muted)">{{ step.slots }}<template v-if="step.minutes"> · {{ step.minutes }}</template></span>
              </span>
            </button>
          </li>
        </ul>
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
