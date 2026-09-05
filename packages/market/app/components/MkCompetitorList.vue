<script setup lang="ts">
import {
  MARKET_COMPETITORS_MAX,
  type MarketCompetitor,
  type MarketCompetitorStatus,
} from '../../shared/marketProfile'

/**
 * PROTOTYP (M0) — Komponenten-Vorlage für M1–M4.
 *
 * DIE KANDIDATEN-LISTE: Name, Adresse, Zustand (Plan §2.3 Nr. 1).
 *
 * ── DIE ADRESSE IST EINGABE, DER NAME IST VORSCHLAG ──────────────────────
 * Davids Entscheidung 4 (§6): die Namen kommen aus `a.competitors`, die
 * ADRESSEN trägt der Kunde ein. „Eine geratene Adresse ist die erste
 * Halluzination des Produkts; sie darf gar nicht entstehen" (§1.4). Deshalb
 * ist das Adressfeld leer und beschriftet, statt vorbelegt — und deshalb gibt
 * es hier keinen Knopf „Adresse suchen".
 *
 * ── DER ZUSTAND STEHT ALS WORT DA, NICHT NUR ALS FARBE ───────────────────
 * Glyphe UND Wort (WCAG): „Noch nicht gelesen", „Profil erstellt",
 * „Ausgeschlossen" — und bei einem Ausschluss der GRUND in ehrlichen Worten
 * (§2.3: „ausgeschlossen, weil die Website die Auswertung untersagt"). Der
 * Grund ist aufzählbar und wird hier übersetzt; ein freier Text vom Server
 * wäre in der zweiten Sprache englisch.
 *
 * ── SIE SCHREIBT NICHT SELBST ────────────────────────────────────────────
 * Die Komponente meldet nur, WAS passiert ist (`update:url`, `remove`,
 * `add`); die Seite speichert. Dasselbe Muster wie in der Werkstatt: eine
 * Liste, die selbst speichert, tut es an drei Orten verschieden.
 */
withDefaults(defineProps<{
  competitors: readonly MarketCompetitor[]
  /** Gesperrt, solange der Lauf läuft — oder solange die Schranke zu ist. */
  disabled?: boolean
  max?: number
}>(), {
  disabled: false,
  max: MARKET_COMPETITORS_MAX,
})

const emit = defineEmits<{
  'update:url': [payload: { id: string, url: string }]
  'remove': [id: string]
  'add': []
}>()

const { t } = useI18n()

const STATUS: Record<MarketCompetitorStatus, { icon: string, tone: string }> = {
  pending: { icon: 'i-ph-circle-dashed', tone: 'var(--bw-muted)' },
  reading: { icon: 'i-ph-circle-notch', tone: 'var(--bw-muted)' },
  fetched: { icon: 'i-ph-check-circle', tone: 'var(--bw-accent)' },
  excluded: { icon: 'i-ph-prohibit', tone: 'var(--bw-draft)' },
  failed: { icon: 'i-ph-warning-circle', tone: 'var(--bw-stale)' },
}
</script>

<template>
  <section>
    <h2 class="text-lg font-medium tracking-tight">{{ t('market.candidates.title') }}</h2>
    <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
      {{ t('market.candidates.hint') }}
    </p>

    <ul class="mt-4 space-y-2">
      <li
        v-for="competitor in competitors" :key="competitor.id"
        class="bw-card p-3 sm:p-4"
      >
        <!-- ZWEI ZEILEN STATT EINER REIHE: die Spalte der Werkstatt ist schmal
             (die Bühne teilt sich den Schirm mit Leiste und Stand). Name und
             Adresse in eine Reihe zu zwingen hiess, beide abzuschneiden. -->
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ competitor.name }}</p>
            <p class="bw-label truncate" style="color: var(--bw-muted)">
              {{ t('market.candidates.suggested') }}
            </p>
          </div>
          <UButton
            size="xs" variant="ghost" color="neutral" class="flex-none rounded-full"
            icon="i-ph-x" :disabled="disabled"
            :aria-label="t('market.candidates.remove', { name: competitor.name })"
            @click="emit('remove', competitor.id)"
          />
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <UInput
            :model-value="competitor.url"
            class="min-w-48 flex-1"
            :placeholder="t('market.candidates.urlPlaceholder')"
            :aria-label="`${t('market.candidates.url')} — ${competitor.name}`"
            :disabled="disabled"
            icon="i-ph-globe-simple"
            @update:model-value="emit('update:url', { id: competitor.id, url: String($event) })"
          />

          <!-- Zustand als Glyphe UND Wort (WCAG): nie nur Farbe. -->
          <p class="flex flex-none items-center gap-1.5">
            <UIcon
              :name="STATUS[competitor.status].icon"
              class="size-4 flex-none"
              :class="competitor.status === 'reading' ? 'animate-spin' : ''"
              :style="`color: ${STATUS[competitor.status].tone}`"
            />
            <span class="bw-label" :style="`color: ${STATUS[competitor.status].tone}`">
              {{ t(`market.status.${competitor.status}`) }}
            </span>
          </p>
        </div>

        <p
          v-if="competitor.excludedReason"
          class="mt-2 text-sm leading-snug" style="color: var(--bw-draft)"
        >
          {{ t(`market.reason.${competitor.excludedReason}`) }}
        </p>
      </li>
    </ul>

    <div class="mt-3 flex flex-wrap items-center gap-3">
      <UButton
        size="sm" variant="outline" color="neutral" class="rounded-full"
        icon="i-ph-plus" :label="t('market.candidates.add')"
        :disabled="disabled || competitors.length >= max"
        @click="emit('add')"
      />
      <span class="bw-label" style="color: var(--bw-muted)">{{ t('market.candidates.max', { count: max }) }}</span>
    </div>
  </section>
</template>
