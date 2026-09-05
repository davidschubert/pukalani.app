<script setup lang="ts">
import type { MarketFinding, MarketFindingStatus } from '../../../../../shared/marketProfile'
import {
  DEMO_BRAND,
  DEMO_CLAIMS,
  DEMO_COMPETITORS,
  DEMO_FINDINGS,
  DEMO_OWN,
  DEMO_PROFILES,
  DEMO_REPORT_DATE,
  demoHref,
} from '../../../utils/demoMarket'
import { useBrandFieldLabels, useBrandSlotLabel } from '../../../composables/useBrandFieldLabels'

/**
 * SCREEN 3 — DER BERICHT (Plan §2.11 Nr. 3, Ausgabe nach Entscheidung 5).
 *
 * Vier Teile in der Reihenfolge, in der man sie liest:
 *  1. die GEGENÜBERSTELLUNG als `UTable` (Davids UTable-Regel),
 *  2. die drei LISTEN — Konventionen, Überschneidungen, freie Stellen,
 *  3. je Wettbewerber eine aufklappbare PROFIL-KARTE,
 *  4. die BEFUNDE als Chips, mit Annehmen und Ablehnen.
 *
 * KEINE Zwei-Achsen-Karte, kein Score, kein Ranking (§1.4, Entscheidung 5):
 * die Achsen wählte sonst ein Modell, und das wäre Scheinpräzision.
 *
 * ── DIE BEFUNDE ENTSCHEIDEN HIER NUR ÖRTLICH ─────────────────────────────
 * Ein Klick ändert den Zustand im Bildschirm und sonst nichts — der Prototyp
 * spricht mit niemandem. In der Umsetzung geht die Entscheidung an den
 * Befund-Speicher des brand-Layers (M3), und der Chip verhält sich dann wie
 * jeder andere.
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()
const fieldLabels = useBrandFieldLabels()
const slotLabel = useBrandSlotLabel()

const findings = ref<MarketFinding[]>(DEMO_FINDINGS.map(finding => ({ ...finding })))

function decide(id: string, status: MarketFindingStatus): void {
  findings.value = findings.value.map(finding => (finding.id === id ? { ...finding, status } : finding))
}

const openFindings = computed(() => findings.value.filter(finding => finding.status === 'open').length)

const reportDate = computed(() =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(DEMO_REPORT_DATE)))

const standRows = computed(() => [
  { label: t('market.stand.candidates'), value: String(DEMO_COMPETITORS.length) },
  { label: t('market.stand.profiles'), value: String(DEMO_PROFILES.length) },
  { label: t('market.stand.excluded'), value: String(DEMO_COMPETITORS.filter(c => c.status === 'excluded').length) },
  { label: t('market.stand.findings'), value: String(openFindings.value) },
  { label: t('market.stand.lastRun'), value: reportDate.value },
])

function profileOf(competitorId: string) {
  return DEMO_PROFILES.find(profile => profile.competitorId === competitorId) ?? null
}
</script>

<template>
  <BwWorkspace
    :progress-pct="62" content-locale="en"
    :topbar="false" :rail-footer="false" :locale-in-topbar="false"
    rail-width="288px"
    style="--bw-rail-pad-x: 1rem; --bw-rail-pad-y: 0.75rem"
  >
    <template #rail>
      <MkDemoRail active="market" :findings="openFindings" />
    </template>

    <template #stage-bar>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <UIcon name="i-ph-compass" class="size-4 flex-none" style="color: var(--bw-muted)" />
        <span class="truncate text-sm font-semibold">{{ t('market.page.title') }}</span>
        <span class="bw-label truncate" style="color: var(--bw-muted)">&middot; {{ t('market.result.title') }}</span>
      </div>
    </template>

    <h1 class="text-2xl font-medium tracking-tight">{{ t('market.result.title') }}</h1>
    <p class="bw-label mt-1" style="color: var(--bw-muted)">{{ t('market.result.meta', { date: reportDate }) }}</p>
    <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.page.limit') }}</p>
    <p class="bw-label mt-2" style="color: var(--bw-muted)">{{ t('market.evidence.demoNote') }}</p>

    <!-- 1 · Die Gegenüberstellung -->
    <div class="mt-8">
      <MkComparisonTable
        :own="DEMO_OWN"
        :own-name="DEMO_BRAND"
        :competitors="DEMO_COMPETITORS"
        :profiles="DEMO_PROFILES"
        :field-labels="fieldLabels"
        :resolve-href="demoHref"
      />
    </div>

    <!-- 2 · Die drei Listen -->
    <div class="mt-10 space-y-8">
      <MkClaimList
        v-for="list in DEMO_CLAIMS" :key="list.kind"
        :list="list"
        :field-labels="fieldLabels"
        :resolve-href="demoHref"
      />
    </div>

    <!-- 3 · Die Profil-Karten -->
    <section class="mt-10">
      <h2 class="text-lg font-medium tracking-tight">{{ t('market.profiles.title') }}</h2>
      <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.profiles.hint') }}</p>
      <div class="mt-4 space-y-2">
        <MkCompetitorCard
          v-for="(competitor, index) in DEMO_COMPETITORS" :key="competitor.id"
          :competitor="competitor"
          :profile="profileOf(competitor.id)"
          :field-labels="fieldLabels"
          :resolve-href="demoHref"
          :default-open="index === 0"
        />
      </div>
    </section>

    <!-- 4 · Die Befunde -->
    <section class="mt-10">
      <h2 class="text-lg font-medium tracking-tight">{{ t('market.finding.title') }}</h2>
      <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.finding.hint') }}</p>
      <div class="mt-4 space-y-2">
        <MkFindingChip
          v-for="finding in findings" :key="finding.id"
          :finding="finding"
          :field-label="slotLabel(finding.slotId)"
          @accept="decide($event, 'accepted')"
          @dismiss="decide($event, 'dismissed')"
          @field="navigateTo(localePath('/market/demo/werkstatt'))"
        />
      </div>
    </section>

    <div class="mt-10">
      <UButton
        variant="ghost" color="neutral" class="rounded-full"
        icon="i-ph-arrow-left" :label="t('market.action.back')"
        :to="localePath('/market/demo/markt')"
      />
    </div>

    <template #george>
      <MkDemoStand
        :rows="standRows"
        :notes="[t('market.stand.missingOwn'), t('market.stand.limits'), t('market.stand.confidential')]"
      />
    </template>
  </BwWorkspace>
</template>
