<script setup lang="ts">
import {
  MARKET_FIELDS,
  marketField,
  type MarketCompetitor,
  type MarketFieldId,
  type MarketProfile,
  type MarketProfileField,
} from '../../shared/marketProfile'
import { marketDate, marketHost } from '../utils/marketFormat'

/**
 * PROTOTYP (M0) — Komponenten-Vorlage für M1–M4.
 *
 * DIE PROFIL-KARTE EINES WETTBEWERBERS (Plan §2.5 Nr. 5) — alle Felder mit
 * Zitat und Link, aufklappbar.
 *
 * ── LEERE FELDER STEHEN DRIN, MIT WORTEN ─────────────────────────────────
 * „nicht öffentlich formuliert" ist die zweitwichtigste Auskunft dieses
 * Produkts (§1.10): dass eine Marke keinen Purpose-Satz hat, sagt mehr über
 * die Kategorie als drei ausformulierte Versprechen. Wegzulassen wäre
 * bequemer und würde genau diese Auskunft verschlucken.
 *
 * ── SIE URTEILT NICHT ────────────────────────────────────────────────────
 * Hier steht kein Score, keine Note, kein „stark/schwach" (§1.4, §2.9 Nr. 5).
 * Nur: was diese Website sagt, mit dem Satz, aus dem es stammt. Der Kunde
 * urteilt, wir zeigen.
 */
withDefaults(defineProps<{
  competitor: MarketCompetitor
  profile?: MarketProfile | null
  fieldLabels?: Partial<Record<MarketFieldId, string>>
  resolveHref?: (sourceUrl: string) => string
  defaultOpen?: boolean
}>(), {
  profile: null,
  fieldLabels: () => ({}),
  resolveHref: (sourceUrl: string) => sourceUrl,
  defaultOpen: false,
})

const { t, locale } = useI18n()
const fields = MARKET_FIELDS

/**
 * Wert und Beleg EINES Feldes — der Beleg als null-oder-eins-Liste, damit das
 * Template ohne Nicht-null-Behauptung auskommt (s. MkComparisonTable).
 *
 * SIE HIESS EINMAL `valueOf`, UND DAS WAR EIN 500er (live erwischt): der
 * Render-Kontext löst einen solchen Namen gegen `Object.prototype.valueOf`
 * auf, das dann ohne `this` gerufen wird — „Cannot convert undefined or null
 * to object", mitten in einer Schleife, die aussieht, als wäre sie schuld.
 * Namen aus `Object.prototype` (`valueOf`, `toString`, `hasOwnProperty`)
 * gehören in einer Vue-Komponente nicht an eine Template-Funktion; gemessen:
 * Umbenennen behebt den 500er, sonst bleibt alles gleich.
 */
function fieldValue(profileFields: readonly MarketProfileField[], fieldId: MarketFieldId): string {
  return marketField(profileFields, fieldId)?.value ?? ''
}
function evidenceOf(profileFields: readonly MarketProfileField[], fieldId: MarketFieldId) {
  const evidence = marketField(profileFields, fieldId)?.evidence
  return evidence ? [evidence] : []
}
</script>

<template>
  <div class="bw-card p-4">
    <UCollapsible :default-open="defaultOpen">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 text-left"
      >
        <UIcon
          :name="competitor.status === 'excluded' ? 'i-ph-prohibit' : 'i-ph-storefront'"
          class="size-4 flex-none"
          :style="`color: ${competitor.status === 'excluded' ? 'var(--bw-draft)' : 'var(--bw-ink-soft)'}`"
        />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ competitor.name }}</span>
          <span class="bw-label block truncate" style="color: var(--bw-muted)">
            {{ marketHost(competitor.url) }}
            <template v-if="competitor.pagesRead?.length && competitor.fetchedAt">
              &middot; {{ t('market.profiles.read', { count: competitor.pagesRead.length, date: marketDate(competitor.fetchedAt, locale) }) }}
            </template>
          </span>
        </span>
        <UIcon name="i-ph-caret-down" class="size-4 flex-none" style="color: var(--bw-muted)" />
      </button>

      <template #content>
        <div class="mt-3 border-t pt-3" style="border-color: var(--bw-line)">
          <p v-if="!profile" class="text-sm" style="color: var(--bw-ink-soft)">
            {{ t('market.profiles.none') }}
            <template v-if="competitor.excludedReason">
              {{ t(`market.reason.${competitor.excludedReason}`) }}
            </template>
          </p>

          <dl v-else class="space-y-3">
            <div v-for="field in fields" :key="field.id">
              <dt class="bw-label" style="color: var(--bw-muted)">
                {{ fieldLabels[field.id] ?? t(`market.field.${field.id}`) }}
              </dt>
              <dd class="mt-0.5">
                <template v-if="fieldValue(profile.fields, field.id)">
                  <p class="text-sm leading-snug">{{ fieldValue(profile.fields, field.id) }}</p>
                  <MkEvidence
                    v-for="evidence in evidenceOf(profile.fields, field.id)"
                    :key="evidence.sourceUrl"
                    class="mt-1"
                    :evidence="evidence"
                    :resolve-href="resolveHref"
                  />
                </template>
                <p v-else class="text-sm italic" style="color: var(--bw-muted)">{{ t('market.result.empty') }}</p>
              </dd>
            </div>
          </dl>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
