<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import {
  MARKET_FIELDS,
  marketField,
  type MarketCompetitor,
  type MarketFieldId,
  type MarketProfile,
  type MarketProfileField,
} from '../../shared/marketProfile'

/**
 * PROTOTYP (M0) — Komponenten-Vorlage für M1–M4.
 *
 * DIE GEGENÜBERSTELLUNG (Plan §2.5, Davids Entscheidung 5 in §6).
 *
 * ── `UTable`, WEIL ES EINE DATENLISTE IST ────────────────────────────────
 * Davids UTable-Regel (B6, 2026-07-30): Datenlisten im Dashboard sind
 * `UTable` — Sortierung, Auswahl und Paginierung verhalten sich dann überall
 * gleich. Eine handgebaute Matrix wäre hier besonders verlockend und
 * besonders falsch: sie ist die EINE Ansicht, die der Kunde ausdruckt.
 *
 * ── EINE ZEILE JE FELD, EINE SPALTE JE MARKE ─────────────────────────────
 * Die Zeilen kommen aus `MARKET_FIELDS` und nicht aus den Daten: fehlt ein
 * Feld bei ALLEN, bleibt die Zeile trotzdem stehen und sagt „niemand
 * formuliert das öffentlich". Genau das ist eine Aussage über die Kategorie
 * (§1.10) — eine Zeile, die sich wegkürzt, wäre eine verschwiegene.
 *
 * ── EIN AUSGESCHLOSSENER WETTBEWERBER BLEIBT ALS SPALTE STEHEN ───────────
 * Grau, mit dem Wort „ausgeschlossen" im Kopf (nie nur Farbe). Ihn
 * wegzulassen hiesse, dem Kunden zu verschweigen, dass sein Feld ein Loch
 * hat — und dieses Loch ist eine Tatsache über die Auswertung, keine
 * Schönheitsfrage.
 *
 * ── DIE BESCHRIFTUNG DER EIGENEN FELDER KOMMT VON AUSSEN ─────────────────
 * `fieldLabels` ist der sichtbar gemachte Vertrag zum brand-Layer (§2.1,
 * CONCEPT A14): die SEITE löst die Slot-Ids gegen die brand-Registry auf,
 * diese Komponente kennt sie nicht. Ohne Angabe steht der neutrale Name des
 * Marktprofil-Feldes da — nie eine rohe Id.
 */
const props = withDefaults(defineProps<{
  /** Die eigenen (bestätigten) Werte in derselben Feldstruktur. */
  own: readonly MarketProfileField[]
  ownName: string
  competitors: readonly MarketCompetitor[]
  profiles: readonly MarketProfile[]
  fieldLabels?: Partial<Record<MarketFieldId, string>>
  resolveHref?: (sourceUrl: string) => string
}>(), {
  fieldLabels: () => ({}),
  resolveHref: (sourceUrl: string) => sourceUrl,
})

const { t } = useI18n()

interface Row { fieldId: MarketFieldId, label: string }

const rows = computed<Row[]>(() => MARKET_FIELDS.map(field => ({
  fieldId: field.id,
  label: props.fieldLabels[field.id] ?? t(`market.field.${field.id}`),
})))

const columns = computed<TableColumn<Row>[]>(() => [
  { id: 'field', header: () => t('market.result.field') },
  { id: 'own', header: () => props.ownName },
  ...props.competitors.map(competitor => ({
    id: competitor.id,
    header: () => competitor.name,
  })),
])

/** Slot-Name einer Wettbewerber-Spalte (`<id>-cell`). */
const cellSlot = (id: string): string => `${id}-cell`

function profileOf(competitorId: string): readonly MarketProfileField[] {
  return props.profiles.find(profile => profile.competitorId === competitorId)?.fields ?? []
}

function isExcluded(competitorId: string): boolean {
  return props.competitors.find(c => c.id === competitorId)?.status === 'excluded'
}

function cell(fields: readonly MarketProfileField[], fieldId: MarketFieldId): MarketProfileField | undefined {
  return marketField(fields, fieldId)
}

/**
 * Der Beleg als LISTE mit null oder einem Eintrag. Sieht umständlich aus und
 * ist es nicht: `v-for` über null-oder-eins erspart im Template die
 * Nicht-null-Behauptung (`!`) hinter zwei optionalen Zugriffen — und die ist
 * genau die Sorte Zusicherung, die beim nächsten Umbau still falsch wird.
 */
function evidenceOf(fields: readonly MarketProfileField[], fieldId: MarketFieldId) {
  const evidence = marketField(fields, fieldId)?.evidence
  return evidence ? [evidence] : []
}
</script>

<template>
  <section>
    <h2 class="text-lg font-medium tracking-tight">{{ t('market.result.matrix') }}</h2>
    <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('market.result.matrixHint') }}</p>

    <!-- Breite Tabelle scrollt in IHREM Kasten, nie die Seite. -->
    <div class="mt-4 overflow-x-auto">
      <UTable
        :data="rows"
        :columns="columns"
        :ui="{ td: 'align-top whitespace-normal py-3', th: 'whitespace-normal' }"
        data-market-comparison
      >
        <template #field-cell="{ row }">
          <span class="text-sm font-medium">{{ row.original.label }}</span>
        </template>

        <template #own-cell="{ row }">
          <div class="min-w-40 max-w-64">
            <p v-if="cell(own, row.original.fieldId)?.value" class="text-sm leading-snug">
              {{ cell(own, row.original.fieldId)?.value }}
            </p>
            <p v-else class="bw-label" style="color: var(--bw-muted)">{{ t('market.result.missingOwn') }}</p>
          </div>
        </template>

        <template
          v-for="competitor in competitors" :key="competitor.id"
          #[cellSlot(competitor.id)]="{ row }"
        >
          <div class="min-w-40 max-w-64">
            <p v-if="isExcluded(competitor.id)" class="bw-label" style="color: var(--bw-muted)">
              {{ t('market.result.excluded') }}
            </p>
            <template v-else>
              <p
                v-if="cell(profileOf(competitor.id), row.original.fieldId)?.value"
                class="text-sm leading-snug"
              >
                {{ cell(profileOf(competitor.id), row.original.fieldId)?.value }}
              </p>
              <p v-else class="bw-label" style="color: var(--bw-muted)">{{ t('market.result.empty') }}</p>
              <MkEvidence
                v-for="evidence in evidenceOf(profileOf(competitor.id), row.original.fieldId)"
                :key="evidence.sourceUrl"
                class="mt-1"
                :evidence="evidence"
                :resolve-href="resolveHref"
              />
            </template>
          </div>
        </template>
      </UTable>
    </div>
  </section>
</template>
