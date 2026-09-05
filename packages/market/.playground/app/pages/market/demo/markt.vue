<script setup lang="ts">
import type { MarketCompetitor } from '../../../../../shared/marketProfile'
import { DEMO_CANDIDATES } from '../../../utils/demoMarket'

/**
 * SCREEN 1 — DIE SEITE „MARKT", AUSGANGSLAGE (Plan §2.11 Nr. 1).
 *
 * Sie zeigt drei Dinge und sonst nichts: was das Produkt tut, wo seine Grenze
 * liegt, und was es kostet.
 *
 * ── DIE GRENZE STEHT IM KOPF, NICHT IM KLEINGEDRUCKTEN (§2.5) ────────────
 * „Wir zeigen, was Marken sagen — nicht, wie erfolgreich sie damit sind."
 * Dieser Satz ist die wichtigste Zeile der Seite (§1.4): er verhindert die
 * Erwartung, die das Produkt nie einlösen könnte, und er tut es DA, wo der
 * Kunde die Erwartung bildet.
 *
 * ── DIE SCHRANKE IST IM PROTOTYP UMSCHALTBAR ─────────────────────────────
 * Beide Zustände sind zu beurteilen — gesperrt (der Normalfall am Tag eins)
 * und frei (Beta-Konten, Davids Entscheidung 3). Ein Schalter statt zweier
 * Screens: so sieht man den UNTERSCHIED, nicht zwei Bilder.
 */
const { t } = useI18n()
const localePath = useLocalePath()

/** Der Beta-Schalter des Prototyps — im Produkt ist das eine Zuteilung. */
const unlocked = ref(false)

const candidates = ref<MarketCompetitor[]>(DEMO_CANDIDATES.map(candidate => ({ ...candidate })))

/** Ohne Adresse kein Lauf: geraten wird sie nie (§1.4, Entscheidung 4). */
const ready = computed(() => candidates.value.some(candidate => candidate.url.trim().length > 0))

function setUrl({ id, url }: { id: string, url: string }): void {
  const found = candidates.value.find(candidate => candidate.id === id)
  if (found) found.url = url
}

function remove(id: string): void {
  candidates.value = candidates.value.filter(candidate => candidate.id !== id)
}

/**
 * Ein zusätzlicher Kandidat trägt zunächst den Gattungsnamen: im Produkt
 * kommt der Name aus `a.competitors` oder aus einem Namensfeld — im Prototyp
 * geht es nur um die ZEILE, nicht um das Benennen.
 */
function add(): void {
  candidates.value.push({
    id: `extra-${candidates.value.length + 1}`,
    name: t('market.candidates.name'),
    url: '',
    status: 'pending',
  })
}

const standRows = computed(() => [
  { label: t('market.stand.candidates'), value: String(candidates.value.length) },
  { label: t('market.stand.profiles'), value: '0' },
  { label: t('market.stand.lastRun'), value: t('market.stand.never') },
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
      </div>
    </template>

    <h1 class="text-2xl font-medium tracking-tight">{{ t('market.page.title') }}</h1>
    <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.page.lead') }}</p>

    <!-- Die ehrliche Grenze — hervorgehoben, nicht versteckt. -->
    <p
      class="mt-3 rounded-xl px-4 py-3 text-sm leading-relaxed"
      style="background: var(--bw-surface); color: var(--bw-ink)"
    >
      {{ t('market.page.limit') }}
    </p>

    <p class="bw-label mt-3 flex items-center gap-1.5" style="color: var(--bw-muted)">
      <UIcon name="i-ph-lock-simple-open" class="size-3.5 flex-none" />
      {{ t('market.page.unlocked') }}
    </p>

    <div class="mt-8">
      <MkCompetitorList
        :competitors="candidates"
        @update:url="setUrl"
        @remove="remove"
        @add="add"
      />
    </div>

    <p class="mt-4 text-sm leading-relaxed" style="color: var(--bw-muted)">{{ t('market.page.sources') }}</p>

    <div class="mt-8">
      <MkPaywall :unlocked="unlocked">
        <template #action>
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              color="neutral" class="rounded-full"
              icon="i-ph-compass" :label="t('market.action.compare')"
              :disabled="!unlocked || !ready"
              :to="unlocked && ready ? localePath('/market/demo/lauf') : undefined"
            />
            <!-- Der Schalter gehört zum PROTOTYP und sagt das auch. -->
            <USwitch v-model="unlocked" :label="t('market.paywall.toggle')" />
            <span class="bw-label" style="color: var(--bw-muted)">{{ t('market.paywall.toggleHint') }}</span>
          </div>
        </template>
      </MkPaywall>
    </div>

    <template #george>
      <MkDemoStand
        :rows="standRows"
        :notes="[t('market.stand.limits'), t('market.stand.confidential')]"
      />
    </template>
  </BwWorkspace>
</template>
