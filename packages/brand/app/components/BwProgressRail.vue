<script setup lang="ts">
/** Fortschritt menschlich (§3d): "2 von 5 Entscheidungen · ~8 Min", die fünf
 *  Schichten sichtbar, künftige sichtbar-GESPERRT (= sichtbare Schranke).
 *  Runde 43 (David): keine Schmuck-Icons vorn — der STATUS führt links,
 *  hinten sitzt ein Info-Icon, das einen Erklär-Layer öffnet (was der
 *  Schritt bedeutet, welche Entscheidungen er hat, Fortschrittsbalken). */
export interface BwRailStepInfo {
  /**
   * Der Erklär-Absatz. OPTIONAL seit dem Umbau „Gespräch als Bühne"
   * (2026-09-02): der Klickdummy liefert ihn aus `demoRail`, die echte
   * Werkstatt baut ihre Info-Pakete dagegen aus der Slot-Registry und hat
   * dafür (noch) keinen geschriebenen Absatz. Weglassen ist wahr, erfinden
   * wäre es nicht — s. `BwStepInfoModal`.
   */
  description?: string
  minutes?: string
  bausteine: { label: string, note: string, done?: boolean }[]
}
export interface BwRailStep {
  id: string
  label: string
  icon: string
  /**
   * `locked` kam mit dem Audit dazu (A9): die Werkstatt bildete den
   * gesperrten Zustand der Journey auf `open` ab, und das Schloss des Plans
   * erschien in der Leiste nie — obwohl der Log es an derselben Stelle zeigt.
   * `open` heisst „betretbar, aber noch nichts drin", `locked` heisst „der
   * Vorgänger ist noch offen".
   */
  state: 'done' | 'active' | 'open' | 'locked'
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

/* Die INHALTE der Leiste (Schicht- und Schritt-Beschriftungen, Info-Texte)
 * reicht die Seite bereits übersetzt herein — hier stehen nur die
 * Rahmen-Texte der Komponente selbst (aria-Beschriftungen, „Übersicht",
 * „Entscheidungen", die Fortschrittszeile). */
const { t } = useI18n()

/** Gesperrt ist ein Punkt durch seine SCHICHT oder durch sich selbst (A9). */
function isLocked(layer: BwRailLayer, step: BwRailStep): boolean {
  return layer.locked === true || step.state === 'locked'
}

const infoStep = ref<{ step: BwRailStep, layerLabel: string } | null>(null)
/* Der Erklär-Layer selbst wohnt seit 2026-09-02 in `BwStepInfoModal` — er
 * stand vorher wörtlich auch in der Klickdummy-Sidebar, und mit der neuen
 * `BwWorkspaceSidebar` wäre daraus eine dritte Kopie geworden. */
const infoOpen = computed({
  get: () => infoStep.value !== null,
  set: (v: boolean) => { if (!v) infoStep.value = null },
})
</script>

<template>
  <nav :aria-label="t('brand.workspace.rail.progressNav')">
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
              :aria-label="t('brand.workspace.rail.whatsIn', { label: layer.label })"
              @click="infoStep = { step: { id: layer.id, label: layer.label, icon: '', state: 'open', info: layer.info }, layerLabel: layer.lockedNote ?? t('brand.workspace.rail.overview') }"
              @keydown.enter="infoStep = { step: { id: layer.id, label: layer.label, icon: '', state: 'open', info: layer.info }, layerLabel: layer.lockedNote ?? t('brand.workspace.rail.overview') }"
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
              :disabled="isLocked(layer, step) || step.state === 'open'"
              :style="!isLocked(layer, step) && step.state === 'active' ? 'background: var(--bw-surface-hi); color: var(--bw-ink); font-weight: 600; box-shadow: var(--bw-shadow-card)' : 'background: var(--bw-surface); color: ' + (isLocked(layer, step) || step.state === 'open' ? 'var(--bw-muted)' : 'var(--bw-ink-soft)')"
            >
              <span class="grid size-7 flex-none place-items-center rounded-full" :style="!isLocked(layer, step) && step.state === 'done' ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface-hi)'">
                <UIcon :name="isLocked(layer, step) ? 'i-ph-lock-simple' : step.state === 'done' ? 'i-ph-check' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'" class="size-4" :style="!isLocked(layer, step) && step.state === 'done' ? 'color: var(--bw-accent)' : !isLocked(layer, step) && step.state === 'active' ? 'color: var(--bw-ink)' : 'color: var(--bw-muted)'" />
              </span>
              <span class="min-w-0 flex-1">{{ step.label }}</span>
              <span
                v-if="step.info"
                class="bw-info-btn grid size-7 flex-none place-items-center rounded-full"
                role="button" tabindex="0"
                :aria-label="t('brand.workspace.rail.whatMeans', { label: step.label })"
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
          class="grid place-items-center" :aria-label="t('brand.workspace.rail.whatMeans', { label: step.label })"
          :disabled="!step.info" @click="step.info && (infoStep = { step, layerLabel: layer.label })"
        >
          <UIcon
            :name="step.state === 'locked' ? 'i-ph-lock-simple' : step.state === 'done' ? 'i-ph-check-circle-fill' : step.state === 'active' ? 'i-ph-circle-half-fill' : 'i-ph-circle'"
            :style="`color: var(--bw-${step.state === 'active' ? 'accent' : 'muted'})`"
          />
        </button>
      </template>
    </div>

    <BwStepInfoModal
      v-model:open="infoOpen"
      :step="infoStep?.step ?? null"
      :layer-label="infoStep?.layerLabel ?? ''"
    />
  </nav>
</template>
