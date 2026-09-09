<script setup lang="ts">
import type { InsightsBrand, InsightsBrandScore, InsightsDuelFact, InsightsLocale, InsightsSource } from '../../shared/insightsPost'

/**
 * PROTOTYP (I0) — DAS BRAND-DUELL ALS STATISTIK-TAFEL (§2.2; Vorlage: der
 * Klickdummy `.../demo/duell.vue`).
 *
 * ── DER SIEGER JE ZEILE STEHT IN DEN DATEN, NICHT IM RENDERING ──────────
 * Der Klickdummy verglich zwei Zahlen im Template (`d.a >= d.b`). Für die
 * DIMENSIONEN bleibt das richtig — sie kommen aus demselben Brand-Check und
 * sind vergleichbar. Für die FAKTEN nicht: „Agentur-Beziehung seit 1982" ist
 * gegen „wechselnd, zuletzt in-house" nicht rechenbar. `winner` ist deshalb
 * ein Feld der Zeile (§9.3) — eine redaktionelle Aussage, die jemand
 * verantwortet, mit `sourceIndex` als Beleg daneben.
 *
 * ── EINE FAKTENZEILE OHNE BELEG GIBT ES NICHT ───────────────────────────
 * §9.3: „`sourceIndex` zeigt in `sources` — eine Faktenzeile OHNE Beleg lässt
 * sich nicht speichern." Die Tafel ZEIGT die Beleg-Nummer; ohne sie wäre die
 * Pflicht erfüllt und unsichtbar, und die Zeile sähe aus wie eine Behauptung.
 */
const props = defineProps<{
  left: InsightsBrand
  right: InsightsBrand
  leftScore: InsightsBrandScore
  rightScore: InsightsBrandScore
  facts: readonly InsightsDuelFact[]
  sources: readonly InsightsSource[]
  locale: InsightsLocale
}>()

const { t } = useI18n()

/** Die acht Dimensionen nebeneinander — dieselbe Reihenfolge auf beiden Seiten. */
const dimensions = computed(() => props.leftScore.dimensions.map((dimension, index) => ({
  key: dimension.key,
  label: dimension.label,
  a: dimension.value,
  b: props.rightScore.dimensions[index]?.value ?? 0,
})))

const leftWins = computed(() => dimensions.value.filter(dimension => dimension.a > dimension.b).length)
const rightWins = computed(() => dimensions.value.filter(dimension => dimension.b > dimension.a).length)

function factLabel(fact: InsightsDuelFact): string {
  return props.locale === 'de' ? fact.labelDe : fact.labelEn
}
</script>

<template>
  <div>
    <!-- Aufstellung -->
    <div class="bw-card p-8 sm:p-10">
      <p class="bw-label text-center uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('insights.duel.eyebrow') }}</p>
      <div class="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div class="flex flex-col items-center gap-2 text-center">
          <slot name="ringLeft" :score="leftScore" />
          <p class="text-2xl font-extralight tracking-tight">{{ left.name }}</p>
          <p class="bw-label" style="color: var(--bw-muted)">{{ left.archetype }}</p>
        </div>
        <p class="bw-label px-2" style="color: var(--bw-muted)">{{ t('insights.duel.versus') }}</p>
        <div class="flex flex-col items-center gap-2 text-center">
          <slot name="ringRight" :score="rightScore" />
          <p class="text-2xl font-extralight tracking-tight">{{ right.name }}</p>
          <p class="bw-label" style="color: var(--bw-muted)">{{ right.archetype }}</p>
        </div>
      </div>
      <p class="bw-label mt-6 text-center" style="color: var(--bw-muted)">
        {{ t('insights.duel.standing', { left: left.name, leftCount: leftWins, right: right.name, rightCount: rightWins }) }}
      </p>
    </div>

    <!-- Dimension für Dimension, gespiegelte Balken, Sieger im Akzent. -->
    <div class="bw-card mt-4 p-8">
      <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.duel.dimensions') }}</p>
      <div class="mt-6 space-y-4">
        <div v-for="dimension in dimensions" :key="dimension.key">
          <p class="bw-label text-center" style="color: var(--bw-muted)">{{ dimension.label }}</p>
          <div class="mt-1.5 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-3">
            <p class="bw-label" :style="`color: ${dimension.a >= dimension.b ? 'var(--bw-accent)' : 'var(--bw-muted)'}`">{{ dimension.a }}</p>
            <div class="flex justify-end">
              <div class="h-1.5 w-full overflow-hidden rounded-full" style="background: var(--bw-line)">
                <div class="ml-auto h-full rounded-full" :style="`width: ${dimension.a}%; background: ${dimension.a >= dimension.b ? 'var(--bw-accent)' : 'var(--bw-line-strong)'}`" />
              </div>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
              <div class="h-full rounded-full" :style="`width: ${dimension.b}%; background: ${dimension.b >= dimension.a ? 'var(--bw-accent)' : 'var(--bw-line-strong)'}`" />
            </div>
            <p class="bw-label text-right" :style="`color: ${dimension.b >= dimension.a ? 'var(--bw-accent)' : 'var(--bw-muted)'}`">{{ dimension.b }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Zahlen & Fakten — je Zeile ein Sieger und ein Beleg. -->
    <div class="bw-card mt-4 p-8">
      <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.duel.facts') }}</p>
      <div class="mt-4 space-y-3">
        <div v-for="fact in facts" :key="fact.key" class="grid items-baseline gap-2 sm:grid-cols-[1fr_12rem_1fr]">
          <p
            class="text-sm sm:text-right"
            :style="`color: ${fact.winner === 'left' ? 'var(--bw-ink)' : 'var(--bw-ink-soft)'}; font-weight: ${fact.winner === 'left' ? 500 : 400}`"
          >{{ fact.left }}</p>
          <p class="bw-label text-center" style="color: var(--bw-muted)">
            {{ factLabel(fact) }}
            <span class="block" style="color: var(--bw-muted)">{{ t('insights.duel.factSource') }} {{ fact.sourceIndex + 1 }}</span>
          </p>
          <p
            class="text-sm"
            :style="`color: ${fact.winner === 'right' ? 'var(--bw-ink)' : 'var(--bw-ink-soft)'}; font-weight: ${fact.winner === 'right' ? 500 : 400}`"
          >{{ fact.right }}</p>
        </div>
      </div>
    </div>

    <!-- Einordnung: Kritik-/Meinungs-Stil, Wir-Stimme (Entscheidungen 4 + 7). -->
    <div class="bw-card mt-4 p-8">
      <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.duel.verdict') }}</p>
      <div class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
        <slot name="verdict" />
      </div>
    </div>

    <div class="mt-4">
      <div class="bw-card p-8">
        <InSourceList :sources="sources" :locale="locale" />
      </div>
    </div>

    <!-- Der eine Einstieg des Formats (Entscheidung 9): Duell ⇒ Vergleich. -->
    <div class="bw-card mt-4 flex flex-wrap items-center justify-between gap-4 p-8">
      <p class="text-sm" style="color: var(--bw-ink-soft)">{{ t('insights.duel.ctaTitle') }}</p>
      <slot name="cta">
        <UButton :label="t('insights.duel.ctaLabel')" icon="i-ph-arrows-left-right" class="rounded-full" />
      </slot>
    </div>
  </div>
</template>
