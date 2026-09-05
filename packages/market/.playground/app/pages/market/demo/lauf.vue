<script setup lang="ts">
import type { MarketRunPhase, MarketRunStep } from '../../../../../shared/marketProfile'
import { DEMO_COMPETITORS } from '../../../utils/demoMarket'

/**
 * SCREEN 2 — DER LAUF (Plan §2.11 Nr. 2).
 *
 * ── ER LÄUFT WIRKLICH AB, UND ZWAR GESKRIPTET ────────────────────────────
 * Der Fortschritt ist die einzige Stelle des Produkts, die ZEIT hat — ein
 * Standbild davon wäre nicht zu beurteilen. Deshalb spielt die Seite die
 * Kette einmal ab (und auf Knopfdruck wieder): prüfen, lesen, übersetzen,
 * vergleichen. Nichts davon spricht mit einem Server; die Zeiten sind
 * Anschauung, keine Messung.
 *
 * ── EIN AUSGESCHLOSSENER IST TEIL DES DREHBUCHS ──────────────────────────
 * „Kona Trading" sagt per robots.txt nein (die Datei liegt wirklich im
 * Playground). Genau dieser Zustand ist der wichtigste des Ablaufs: er zeigt,
 * dass wir fragen, bevor wir lesen (§1.7 Nr. 2) — und dass der Kunde einen
 * ehrlichen Satz bekommt statt eines leeren Feldes.
 *
 * SSR rendert den Anfangszustand (alles wartet); die Kette startet erst im
 * Browser — es gibt also keinen Zweig, der auf Server und Client verschieden
 * aussieht (Hydrations-Regel).
 */
const { t } = useI18n()
const localePath = useLocalePath()

function initialSteps(): MarketRunStep[] {
  return DEMO_COMPETITORS.map(competitor => ({
    competitorId: competitor.id,
    name: competitor.name,
    status: 'pending',
    robotsChecked: false,
    pagesRead: 0,
  }))
}

const steps = ref<MarketRunStep[]>(initialSteps())
const phase = ref<MarketRunPhase>('idle')

function patch(id: string, change: Partial<MarketRunStep>): void {
  steps.value = steps.value.map(step => (step.competitorId === id ? { ...step, ...change } : step))
}

/** Das Drehbuch: Verzögerung in ms und was dann wahr ist. */
const SCRIPT: readonly { at: number, run: () => void }[] = [
  { at: 300, run: () => patch('upcountry', { status: 'reading', robotsChecked: true }) },
  { at: 900, run: () => patch('upcountry', { pagesRead: 2 }) },
  { at: 1400, run: () => patch('upcountry', { status: 'fetched' }) },
  { at: 1700, run: () => patch('pacific', { status: 'reading', robotsChecked: true }) },
  { at: 2300, run: () => patch('pacific', { pagesRead: 2 }) },
  { at: 2800, run: () => patch('pacific', { status: 'fetched' }) },
  { at: 3100, run: () => patch('kona', { robotsChecked: true }) },
  { at: 3500, run: () => patch('kona', { status: 'excluded', excludedReason: 'robots' }) },
  { at: 3800, run: () => { phase.value = 'comparing' } },
  { at: 5200, run: () => { phase.value = 'done' } },
]

let timers: ReturnType<typeof setTimeout>[] = []

function play(): void {
  for (const timer of timers) clearTimeout(timer)
  timers = []
  steps.value = initialSteps()
  phase.value = 'running'
  timers = SCRIPT.map(entry => setTimeout(entry.run, entry.at))
}

onMounted(play)
onBeforeUnmount(() => {
  for (const timer of timers) clearTimeout(timer)
})

const standRows = computed(() => [
  { label: t('market.stand.candidates'), value: String(steps.value.length) },
  { label: t('market.stand.profiles'), value: String(steps.value.filter(step => step.status === 'fetched').length) },
  { label: t('market.stand.excluded'), value: String(steps.value.filter(step => step.status === 'excluded').length) },
])
</script>

<template>
  <BwWorkspace
    :progress-pct="62" content-locale="en"
    :topbar="false" :rail-footer="false" :locale-in-topbar="false"
    rail-width="288px"
    style="--bw-rail-pad-x: 1rem; --bw-rail-pad-y: 0.75rem"
  >
    <template #rail>
      <MkDemoRail active="market" :findings="0" />
    </template>

    <template #stage-bar>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <UIcon name="i-ph-compass" class="size-4 flex-none" style="color: var(--bw-muted)" />
        <span class="truncate text-sm font-semibold">{{ t('market.page.title') }}</span>
        <span class="bw-label truncate" style="color: var(--bw-muted)">&middot; {{ t('market.run.title') }}</span>
      </div>
    </template>

    <MkRunProgress :steps="steps" :phase="phase" />

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <UButton
        color="neutral" class="rounded-full"
        icon="i-ph-arrow-right" :label="t('market.action.toResult')"
        :disabled="phase !== 'done'"
        :to="phase === 'done' ? localePath('/market/demo/ergebnis') : undefined"
      />
      <UButton
        variant="ghost" color="neutral" class="rounded-full"
        icon="i-ph-arrow-counter-clockwise" :label="t('market.run.replay')"
        @click="play"
      />
      <UButton
        variant="ghost" color="neutral" class="rounded-full"
        icon="i-ph-arrow-left" :label="t('market.action.back')"
        :to="localePath('/market/demo/markt')"
      />
    </div>

    <template #george>
      <MkDemoStand :rows="standRows" :notes="[t('market.stand.limits')]" />
    </template>
  </BwWorkspace>
</template>
