<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { InsightsOpportunity, InsightsRadarVideo } from '../../shared/insightsPost'
import {
  INSIGHTS_OPPORTUNITY_MAX,
  INSIGHTS_RADAR_RETENTION_DAYS,
  insightsOpportunity,
  insightsPopularity,
  insightsTopicLabel,
} from '../../shared/insightsPost'
import { insightsDaysBetween, insightsNumber } from '../utils/insightsFormat'

/**
 * PROTOTYP (I0) — DER THEMENRADAR IN DER REDAKTION (§9.6, Paket I4).
 *
 * ── WAS HIER STEHT, IST ALLES, WAS STEHEN DARF ──────────────────────────
 * Je Video die öffentlichen Zahlen der API: Kanal, Titel, Aufrufe, Likes,
 * Kommentar-ZAHL, Alter. KEINE Kommentar-Texte, KEINE Nutzernamen
 * (Leitplanke b) und kein Verdichten über Kanäle hinweg (Policies III.E.2).
 * Die Aufbewahrung ist auf {INSIGHTS_RADAR_RETENTION_DAYS} Kalendertage
 * begrenzt (III.E.4) — der Satz darüber steht in der Oberfläche und nicht nur
 * im Plan, weil er das Verhalten der Tabelle erklärt: sie ist kurzlebig.
 *
 * ── UNSERE ZAHL HEISST, WAS SIE RECHNET ─────────────────────────────────
 * „44 von 60 · 3 Signale" und nicht „44 von 100". Der Plan nennt fünf
 * Signale; für Suchnachfrage und Konkurrenz gibt es heute keine Datenquelle
 * (§11.1 Nr. 2). Ein Score, der fünf behauptet und drei rechnet, sähe aus wie
 * ein schlechtes Ergebnis, wo in Wahrheit zwei Summanden fehlen. Die Formel
 * hängt als Tooltip an der Spalte — eine Zahl ohne Rechenweg ist eine
 * Behauptung.
 *
 * ── `UTable` IST DER STANDARD (Davids B6-Regel) ─────────────────────────
 * Sortierung, Spaltenbreiten und Zeilenverhalten kommen mitgeliefert; eine
 * handgebaute Tabelle wäre hier nur eine zweite, schlechtere.
 */
const props = defineProps<{
  videos: readonly InsightsRadarVideo[]
  locale: string
  /** Der Stichtag, gegen den das Alter gerechnet wird — nie `new Date()` im
   *  Rendern: das ist auf dem Server ein anderer Wert als im Browser. */
  today: string
  /** Nähe zu unseren Themenclustern (0–1), je Video — in I4 aus Schlagwörtern. */
  resolveRelevance?: (video: InsightsRadarVideo) => number
}>()

const { t } = useI18n()

interface RadarRow extends InsightsRadarVideo {
  ageDays: number
  opportunity: InsightsOpportunity
}

const rows = computed<RadarRow[]>(() => props.videos.map((video) => {
  const ageDays = insightsDaysBetween(video.publishedAt, props.today)
  return {
    ...video,
    ageDays,
    opportunity: insightsOpportunity({
      popularity: insightsPopularity(video.views, video.channelSubscribers),
      ageDays,
      relevance: props.resolveRelevance ? props.resolveRelevance(video) : 0.5,
    }),
  }
}).sort((a, b) => b.opportunity.score - a.opportunity.score))

const columns = computed<TableColumn<RadarRow>[]>(() => [
  { accessorKey: 'channelTitle', header: () => t('insights.radar.channel') },
  { accessorKey: 'title', header: () => t('insights.radar.video') },
  { accessorKey: 'topic', header: () => t('insights.radar.topic') },
  { accessorKey: 'views', header: () => t('insights.radar.views') },
  { accessorKey: 'likes', header: () => t('insights.radar.likes') },
  { accessorKey: 'commentCount', header: () => t('insights.radar.comments') },
  { id: 'age', header: () => t('insights.radar.age') },
  { id: 'opportunity', header: () => t('insights.radar.opportunity') },
])
</script>

<template>
  <section>
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <h2 class="text-lg font-medium">{{ t('insights.radar.title') }}</h2>
      <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.radar.signals') }}</p>
    </div>
    <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('insights.radar.lead') }}</p>
    <p class="bw-pending mt-2">{{ t('insights.radar.retention', { days: INSIGHTS_RADAR_RETENTION_DAYS }) }}</p>
    <p class="bw-pending mt-1">{{ t('insights.radar.noComments') }}</p>

    <CoreEmptyState
      v-if="rows.length === 0"
      class="mt-6" icon="i-ph-radar"
      :title="t('insights.radar.title')" :description="t('insights.radar.empty')"
    />

    <div v-else class="bw-card mt-4 overflow-x-auto p-2">
      <UTable :data="rows" :columns="columns">
        <template #channelTitle-cell="{ row }">
          <span class="text-sm" style="color: var(--bw-ink-soft)">{{ row.original.channelTitle }}</span>
        </template>
        <template #title-cell="{ row }">
          <span class="text-sm font-medium">{{ row.original.title }}</span>
        </template>
        <template #topic-cell="{ row }">
          <span class="bw-label rounded-full px-2 py-0.5" style="background: var(--bw-surface-hi); color: var(--bw-muted)">
            {{ insightsTopicLabel(row.original.topic) }}
          </span>
        </template>
        <template #views-cell="{ row }">
          <span class="bw-label tabular-nums">{{ insightsNumber(row.original.views, locale) }}</span>
        </template>
        <template #likes-cell="{ row }">
          <span class="bw-label tabular-nums">{{ insightsNumber(row.original.likes, locale) }}</span>
        </template>
        <template #commentCount-cell="{ row }">
          <span class="bw-label tabular-nums">{{ insightsNumber(row.original.commentCount, locale) }}</span>
        </template>
        <template #age-cell="{ row }">
          <span class="bw-label tabular-nums" style="color: var(--bw-muted)">
            {{ t('insights.radar.ageDays', { count: row.original.ageDays }) }}
          </span>
        </template>
        <template #opportunity-cell="{ row }">
          <UTooltip :text="t('insights.radar.formula')">
            <span class="bw-label tabular-nums" style="color: var(--bw-accent)">
              {{ t('insights.radar.opportunityOf', { score: row.original.opportunity.score, max: INSIGHTS_OPPORTUNITY_MAX }) }}
            </span>
          </UTooltip>
        </template>
      </UTable>
    </div>
  </section>
</template>
