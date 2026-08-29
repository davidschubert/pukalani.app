<script setup lang="ts">
/** Fortschritt menschlich (§3d): "2 von 5 Bausteinen · ~8 Min", die fünf
 *  Schichten sichtbar, künftige sichtbar-GESPERRT (= sichtbare Schranke).
 *  Runde 43 (David): keine Schmuck-Icons vorn — der STATUS führt links,
 *  hinten sitzt ein Info-Icon, das einen Erklär-Layer öffnet (was der
 *  Schritt bedeutet, welche Bausteine er hat, Fortschrittsbalken). */
export interface BwRailStepInfo {
  description: string
  minutes?: string
  bausteine: { label: string, note: string, done?: boolean }[]
}
export interface BwRailStep {
  id: string
  label: string
  icon: string
  state: 'done' | 'active' | 'open'
  slots?: string
  minutes?: string
  info?: BwRailStepInfo
}
export interface BwRailLayer {
  id: string
  label: string
  locked?: boolean
  lockedNote?: string
  steps?: BwRailStep[]
}
defineProps<{ layers: BwRailLayer[] }>()

const infoStep = ref<{ step: BwRailStep, layerLabel: string } | null>(null)
const infoOpen = computed({
  get: () => infoStep.value !== null,
  set: (v: boolean) => { if (!v) infoStep.value = null },
})
const infoPct = computed(() => {
  const b = infoStep.value?.step.info?.bausteine ?? []
  return b.length ? Math.round((b.filter(x => x.done).length / b.length) * 100) : 0
})
</script>

<template>
  <nav aria-label="Fortschritt">
    <div class="bw-rail-full space-y-10">
      <div v-for="layer in layers" :key="layer.id">
        <div v-if="layer.locked" class="flex items-start justify-between gap-2 pr-1.5" style="color: var(--bw-muted)">
          <div>
            <div class="bw-label uppercase tracking-wider">{{ layer.label }}</div>
            <p class="mt-0.5 text-xs">{{ layer.lockedNote }}</p>
          </div>
          <UIcon name="i-ph-lock-simple" class="mt-0.5 size-4 flex-none" />
        </div>
        <template v-else>
          <div class="bw-label uppercase tracking-wider" style="color: var(--bw-ink-soft)">
            {{ layer.label }}
          </div>
          <ul class="mt-2.5 space-y-1">
          <li v-for="step in layer.steps" :key="step.id">
            <button
              class="flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
              :disabled="step.state === 'open'"
              :style="step.state === 'active' ? 'background: var(--bw-surface-hi); color: var(--bw-ink); font-weight: 600; box-shadow: var(--bw-shadow-card)' : 'background: var(--bw-surface); color: ' + (step.state === 'open' ? 'var(--bw-muted)' : 'var(--bw-ink-soft)')"
            >
              <span class="grid size-7 flex-none place-items-center rounded-full" :style="step.state === 'done' ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface-hi)'">
                <UIcon :name="step.state === 'done' ? 'i-ph-check' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'" class="size-4" :style="step.state === 'done' ? 'color: var(--bw-accent)' : step.state === 'active' ? 'color: var(--bw-ink)' : 'color: var(--bw-muted)'" />
              </span>
              <span class="min-w-0 flex-1">{{ step.label }}</span>
              <span
                v-if="step.info"
                class="grid size-7 flex-none place-items-center rounded-full transition-colors hover:bg-[var(--bw-pop)]"
                role="button" tabindex="0"
                :aria-label="`Was bedeutet ${step.label}?`"
                @click.stop="infoStep = { step, layerLabel: layer.label }"
                @keydown.enter.stop="infoStep = { step, layerLabel: layer.label }"
              >
                <UIcon name="i-ph-info" class="size-4.5" style="color: var(--bw-ink-soft)" />
              </span>
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

    <UModal v-model:open="infoOpen">
      <template #content>
        <div v-if="infoStep" class="bw-root relative p-8" style="background: var(--bw-surface-hi)">
          <button
            class="absolute right-5 top-5 grid size-8 place-items-center rounded-full transition-colors hover:bg-[var(--bw-line)]"
            aria-label="Schließen"
            @click="infoStep = null"
          >
            <UIcon name="i-ph-x" class="size-4.5" style="color: var(--bw-ink-soft)" />
          </button>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ infoStep.layerLabel }}</p>
          <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">{{ infoStep.step.label }}</h2>
          <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ infoStep.step.info!.description }}</p>

          <p class="bw-label mt-6" style="color: var(--bw-muted)">Bausteine</p>
          <ul class="mt-2 space-y-2.5">
            <li v-for="b in infoStep.step.info!.bausteine" :key="b.label" class="flex items-start gap-3">
              <span class="mt-0.5 grid size-6 flex-none place-items-center rounded-full" :style="b.done ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface)'">
                <UIcon :name="b.done ? 'i-ph-check' : 'i-ph-circle'" class="size-3.5" :style="b.done ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{ b.label }}</span>
                <span class="block text-sm" style="color: var(--bw-ink-soft)">{{ b.note }}</span>
              </span>
            </li>
          </ul>

          <div class="mt-7">
            <div class="flex items-baseline justify-between gap-3">
              <p class="bw-label" style="color: var(--bw-muted)">
                {{ infoStep.step.slots ?? `${infoStep.step.info!.bausteine.filter(b => b.done).length} von ${infoStep.step.info!.bausteine.length} Bausteinen` }}<template v-if="infoStep.step.info!.minutes"> · {{ infoStep.step.info!.minutes }}</template>
              </p>
              <span class="bw-num text-base">{{ infoPct }}&thinsp;%</span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
              <div class="h-full rounded-full transition-all" :style="`width: ${infoPct}%; background: var(--bw-accent)`" />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </nav>
</template>
