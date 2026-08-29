<script setup lang="ts">
/** Fortschritt menschlich (§3d): "2 von 5 Entscheidungen · ~8 Min", die fünf
 *  Schichten sichtbar, künftige sichtbar-GESPERRT (= sichtbare Schranke).
 *  Runde 43 (David): keine Schmuck-Icons vorn — der STATUS führt links,
 *  hinten sitzt ein Info-Icon, das einen Erklär-Layer öffnet (was der
 *  Schritt bedeutet, welche Entscheidungen er hat, Fortschrittsbalken). */
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
  /* Runde 78 (David): 'result' = Ergebnis-Ansicht der Schicht — letzter
   * Punkt der Gruppe, verlinkt statt Info-Icon, gesperrt bis alles fertig. */
  kind?: 'result'
  to?: string
}
export interface BwRailLayer {
  id: string
  label: string
  locked?: boolean
  lockedNote?: string
  /* Runde 90 (David): Subline auch für entsperrte Gruppen. */
  note?: string
  /* Runde 82 (David): auch gesperrte Schichten erklären sich — der
   * Info-Layer zeigt, welche Schritte dort warten. */
  info?: BwRailStepInfo
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
        <!-- Runde 85 (David): auch gesperrte Schichten zeigen ihre Pills
             komplett — mit Schloss im Status-Kreis statt versteckter Liste. -->
          <div class="flex items-start justify-between gap-2 pr-2">
            <div :style="layer.locked ? 'color: var(--bw-muted)' : ''">
              <div class="bw-label uppercase tracking-wider" :style="layer.locked ? '' : 'color: var(--bw-ink-soft)'">{{ layer.label }}</div>
              <p v-if="layer.locked ? layer.lockedNote : layer.note" class="mt-0.5 text-xs" style="color: var(--bw-muted)">{{ layer.locked ? layer.lockedNote : layer.note }}</p>
            </div>
            <span
              v-if="layer.info"
              class="bw-info-btn grid size-7 flex-none place-items-center rounded-full"
              role="button" tabindex="0"
              :aria-label="`Was kommt in ${layer.label}?`"
              @click="infoStep = { step: { id: layer.id, label: layer.label, icon: '', state: 'open', info: layer.info }, layerLabel: layer.lockedNote ?? 'Übersicht' }"
              @keydown.enter="infoStep = { step: { id: layer.id, label: layer.label, icon: '', state: 'open', info: layer.info }, layerLabel: layer.lockedNote ?? 'Übersicht' }"
            >
              <UIcon name="i-ph-info" class="size-4.5" />
            </span>
          </div>
          <ul v-if="layer.steps" class="mt-2.5 space-y-1">
          <li v-for="step in layer.steps" :key="step.id">
            <button
              v-if="step.kind === 'result'"
              class="flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
              :disabled="step.state !== 'done'"
              :style="step.state === 'done' ? 'background: var(--bw-surface); color: var(--bw-ink)' : 'background: var(--bw-surface); color: var(--bw-muted)'"
              @click="step.to && navigateTo(step.to)"
            >
              <span class="grid size-7 flex-none place-items-center rounded-full" :style="step.state === 'done' ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface-hi)'">
                <UIcon name="i-ph-sparkle" class="size-4" :style="step.state === 'done' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" />
              </span>
              <span class="min-w-0 flex-1">{{ step.label }}</span>
              <span class="grid size-7 flex-none place-items-center rounded-full">
                <UIcon :name="step.state === 'done' ? 'i-ph-arrow-right' : 'i-ph-lock-simple'" class="size-4" :style="step.state === 'done' ? 'color: var(--bw-ink-soft)' : 'color: var(--bw-muted)'" />
              </span>
            </button>
            <button
              v-else
              class="flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
              :disabled="layer.locked || step.state === 'open'"
              :style="!layer.locked && step.state === 'active' ? 'background: var(--bw-surface-hi); color: var(--bw-ink); font-weight: 600; box-shadow: var(--bw-shadow-card)' : 'background: var(--bw-surface); color: ' + (layer.locked || step.state === 'open' ? 'var(--bw-muted)' : 'var(--bw-ink-soft)')"
            >
              <span class="grid size-7 flex-none place-items-center rounded-full" :style="!layer.locked && step.state === 'done' ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface-hi)'">
                <UIcon :name="layer.locked ? 'i-ph-lock-simple' : step.state === 'done' ? 'i-ph-check' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'" class="size-4" :style="!layer.locked && step.state === 'done' ? 'color: var(--bw-accent)' : !layer.locked && step.state === 'active' ? 'color: var(--bw-ink)' : 'color: var(--bw-muted)'" />
              </span>
              <span class="min-w-0 flex-1">{{ step.label }}</span>
              <span
                v-if="step.info"
                class="bw-info-btn grid size-7 flex-none place-items-center rounded-full"
                role="button" tabindex="0"
                :aria-label="`Was bedeutet ${step.label}?`"
                @click.stop="infoStep = { step, layerLabel: layer.label }"
                @keydown.enter.stop="infoStep = { step, layerLabel: layer.label }"
              >
                <UIcon name="i-ph-info" class="size-4.5" />
              </span>
            </button>
          </li>
          </ul>

      </div>
    </div>
    <div class="bw-rail-mini flex flex-col items-center gap-3 pt-1">
      <template v-for="layer in layers" :key="layer.id">
        <UIcon v-if="layer.locked" name="i-ph-lock-simple" style="color: var(--bw-muted)" />
        <button
          v-for="step in (layer.steps ?? []).filter(st => st.kind !== 'result')" v-else :key="step.id"
          class="grid place-items-center" :aria-label="`Was bedeutet ${step.label}?`"
          :disabled="!step.info" @click="step.info && (infoStep = { step, layerLabel: layer.label })"
        >
          <UIcon
            :name="step.state === 'done' ? 'i-ph-check-circle-fill' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'"
            :style="`color: var(--bw-${step.state === 'active' ? 'accent' : 'muted'})`"
          />
        </button>
      </template>
    </div>

    <UModal v-model:open="infoOpen">
      <template #content>
        <div v-if="infoStep" class="bw-root relative max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
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

          <p class="bw-label mt-6" style="color: var(--bw-muted)">Entscheidungen</p>
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
              <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
                {{ infoStep.step.slots ?? `${infoStep.step.info!.bausteine.filter(b => b.done).length} von ${infoStep.step.info!.bausteine.length} Entscheidungen` }}<template v-if="infoStep.step.info!.minutes"> · {{ infoStep.step.info!.minutes }}</template>
              </p>
              <span class="bw-label uppercase tracking-wider">{{ infoPct }}&thinsp;%</span>
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
