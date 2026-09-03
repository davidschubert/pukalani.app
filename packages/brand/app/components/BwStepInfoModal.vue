<script setup lang="ts">
import type { BwRailStep } from './BwProgressRail.vue'

/**
 * DER ERKLÄR-LAYER DER LEISTE — „was bedeutet dieser Baustein, welche
 * Entscheidungen hat er, wie weit ist er".
 *
 * ── WARUM ER EINE EIGENE DATEI IST ────────────────────────────────────────
 * Bis zum Umbau „Gespräch als Bühne" (2026-09-02) stand dieses Markup ZWEIMAL
 * wörtlich da: in `BwProgressRail` und in der Klickdummy-Sidebar
 * (`GdSidebar`, deren Kopf es selbst ankündigt: „beim echten Umbau wird er in
 * EINE Quelle gezogen"). Mit `BwWorkspaceSidebar` wäre daraus eine dritte
 * Kopie geworden — drei Stellen, an denen dieselbe Karte anders altern kann.
 * Der Dummy behält seine Kopie (er ist das eingefrorene Abnahme-Dokument),
 * der LAYER hat ab hier genau eine.
 *
 * ── `description` IST OPTIONAL, UND DAS IST EIN BEFUND, KEIN DEFAULT ──────
 * Der Klickdummy speist die Leiste aus `demoRail`, wo jeder Baustein einen
 * geschriebenen Erklär-Absatz trägt. Die ECHTE Werkstatt baut ihre
 * Info-Pakete aus der Slot-Registry (Entscheidungen + Stand) — die
 * Beschreibungs-Absätze je Baustein gibt es dort noch nicht als i18n-Text.
 * Statt sie zu erfinden, fällt der Absatz weg: die Entscheidungsliste allein
 * ist wahr, ein ausgedachter Absatz wäre es nicht.
 */
const props = defineProps<{
  step: BwRailStep | null
  layerLabel: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const bausteine = computed(() => props.step?.info?.bausteine ?? [])
const doneCount = computed(() => bausteine.value.filter(entry => entry.done).length)
const pct = computed(() =>
  (bausteine.value.length ? Math.round((doneCount.value / bausteine.value.length) * 100) : 0))
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div v-if="step?.info" class="bw-root relative max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <button
          class="absolute right-5 top-5 grid size-8 place-items-center rounded-full transition-colors hover:bg-[var(--bw-line)]"
          :aria-label="t('brand.common.close')"
          @click="open = false"
        >
          <UIcon name="i-ph-x" class="size-4.5" style="color: var(--bw-ink-soft)" />
        </button>
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ layerLabel }}</p>
        <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">{{ step.label }}</h2>
        <p v-if="step.info.description" class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ step.info.description }}</p>

        <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.workspace.decisions') }}</p>
        <ul class="mt-2 space-y-2.5">
          <li v-for="b in bausteine" :key="b.label" class="flex items-start gap-3">
            <span class="mt-0.5 grid size-6 flex-none place-items-center rounded-full" :style="b.done ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface)'">
              <UIcon :name="b.done ? 'i-ph-check' : 'i-ph-circle'" class="size-3.5" :style="b.done ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-medium">{{ b.label }}</span>
              <span v-if="b.note" class="block text-sm" style="color: var(--bw-ink-soft)">{{ b.note }}</span>
            </span>
          </li>
        </ul>

        <div class="mt-7">
          <div class="flex items-baseline justify-between gap-3">
            <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
              {{ step.slots ?? t('brand.workspace.progress', { filled: doneCount, total: bausteine.length }) }}<template v-if="step.info.minutes"> · {{ step.info.minutes }}</template>
            </p>
            <span class="bw-label uppercase tracking-wider">{{ pct }}&thinsp;%</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
            <div class="h-full rounded-full transition-all" :style="`width: ${pct}%; background: var(--bw-accent)`" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
