<script setup lang="ts">
import type { BrandPathKind } from '../../shared/slotRegistry'
import { brandIndustrySuggestions } from '../../shared/industrySuggestions'
import {
  BRAND_ABOUT_MAX,
  BRAND_AUDIENCE_MAX,
  BRAND_INDUSTRY_MAX,
  BRAND_WEBSITE_URL_MAX,
  type BrandNewDraft,
} from '../../shared/brandStartCard'

/**
 * ALLES, WAS EIN NEUES BRANDING NACH DER WEICHE NOCH BRAUCHT — genau EINMAL
 * gebaut (Kailua-Befund 6, 2026-09-08).
 *
 * ── WARUM ES DIESE KOMPONENTE GIBT ───────────────────────────────────────
 * Bis heute fragte das Modal auf `/dashboard/brands` Weiche, Titel und Sprache,
 * schickte den Menschen weiter auf `/dashboard/brands/new` — und DORT standen
 * dieselben drei Felder noch einmal. Wer im Modal „Neue Marke" gewählt und
 * einen Arbeitstitel getippt hatte, musste beides gleich wieder bestätigen.
 *
 * Davids Entscheidung: das Modal LEGT AN und springt in die Werkstatt; die
 * Seite bleibt das Ziel direkter Links (Startseite, Discover-CTA, Konto-Menü).
 * Damit erheben zwei Oberflächen dieselben Angaben — und genau deshalb stehen
 * die Felder hier und nicht zweimal. Die REGELN daneben (Anfangswert,
 * Vollständigkeit, Rumpf der Route) liegen pur in `shared/brandStartCard.ts`:
 * zwei Formulare mit einer Meinung darüber, wann sie fertig sind.
 *
 * ── SIE ENTSCHEIDET NICHTS ───────────────────────────────────────────────
 * Kein `$fetch`, kein Absenden-Knopf, keine Navigation. Der WIRT sagt, wie es
 * weitergeht: die Seite navigiert selbst, das Modal reicht den Entwurf nach
 * oben. Ein Knopf hier wüsste nicht, welches von beidem gemeint ist.
 *
 * ── DIE WEICHE W1 BLEIBT DRAUSSEN ────────────────────────────────────────
 * Sie kommt als Prop herein, weil beide Wirte sie ANDERS zeigen: das Modal als
 * Schritt 1 mit zwei grossen Karten (progressive Enthüllung, Davids
 * abgenommener Klickdummy), die Seite als Kartenpaar über dem Formular. Der
 * gemeinsame Teil beginnt genau dahinter.
 */
defineProps<{
  pathKind: BrandPathKind
  /** Die erlaubten Inhaltssprachen — aus `pukalani.brand.contentLocales`. */
  contentLocales: readonly string[]
  /**
   * B7: bis zur Hydration sind die Felder sichtbar abgeschaltet. Ohne das
   * schluckte die Seite vorgetippte Zeichen — sie SAHEN bedienbar aus, hatten
   * aber noch kein `v-model` (Audit 2026-09-02, dreimal reproduziert).
   */
  disabled?: boolean
}>()

/**
 * EIN Modell statt neun — die Felder gehören zusammen und reisen zusammen
 * (`BrandNewDraft`). Neun `defineModel` wären neun Gelegenheiten, eines beim
 * nächsten Feld zu vergessen.
 */
const draft = defineModel<BrandNewDraft>({ required: true })

const { t } = useI18n()

function set<K extends keyof BrandNewDraft>(key: K, value: BrandNewDraft[K]): void {
  draft.value = { ...draft.value, [key]: value }
}

const industrySuggestions = computed(() => brandIndustrySuggestions(draft.value.contentLocale))

/** Der Chip erscheint nur beim Neuschnitt — der Feinschliff friert W2 ein. */
const showNamingOpt = computed(() => draft.value.relaunchScope === 'recut')

/**
 * Die `datalist` braucht eine Id, und zwei gleichzeitig gerenderte Formulare
 * (Seite + Modal) dürften sie sich nicht teilen — eine doppelte Id im Dokument
 * bindet das zweite Feld an die Vorschläge des ersten.
 */
const listId = `bw-industry-${useId()}`
</script>

<template>
  <div>
    <!-- Rebrand-Verzweigung (Katalog §2.2) -->
    <template v-if="pathKind === 'relaunch'">
      <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.scope.question') }}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="scope in (['refine', 'recut'] as const)" :key="scope"
          type="button"
          :disabled="disabled"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="draft.relaunchScope === scope ? 'bw-select-card--on' : ''"
          :aria-pressed="draft.relaunchScope === scope"
          @click="set('relaunchScope', scope)"
        >
          {{ t(`brand.new.scope.${scope}`) }}
        </button>
      </div>
      <div v-if="showNamingOpt" class="mt-3">
        <button
          type="button"
          :disabled="disabled"
          class="bw-select-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          :class="draft.namingOpted ? 'bw-select-card--on' : ''"
          :aria-pressed="draft.namingOpted"
          @click="set('namingOpted', !draft.namingOpted)"
        >
          <UIcon :name="draft.namingOpted ? 'i-ph-check' : 'i-ph-circle'" class="size-4 flex-none" />
          {{ t('brand.new.scope.namingOpted') }}
        </button>
      </div>
    </template>

    <!-- Rahmendaten -->
    <p class="bw-label mt-6" style="color: var(--bw-muted)">
      {{ pathKind === 'new' ? t('brand.new.titleField.new') : t('brand.new.titleField.relaunch') }}
    </p>
    <UInput
      :model-value="draft.title" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="disabled"
      :placeholder="pathKind === 'new' ? t('brand.new.titleField.placeholderNew') : t('brand.new.titleField.placeholderRelaunch')"
      style="background: var(--bw-surface)"
      @update:model-value="value => set('title', String(value))"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.locale.label') }}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="code in contentLocales" :key="code"
        type="button"
        :disabled="disabled"
        class="bw-select-card rounded-full px-4 py-2 text-sm uppercase"
        :class="draft.contentLocale === code ? 'bw-select-card--on' : ''"
        :aria-pressed="draft.contentLocale === code"
        @click="set('contentLocale', code)"
      >
        {{ code }}
      </button>
    </div>
    <p class="bw-label mt-2" style="color: var(--bw-muted)">{{ t('brand.new.locale.note') }}</p>

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.team.label') }}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="kind in (['solo', 'team'] as const)" :key="kind"
        type="button"
        :disabled="disabled"
        class="bw-select-card rounded-full px-4 py-2 text-sm"
        :class="draft.team === kind ? 'bw-select-card--on' : ''"
        :aria-pressed="draft.team === kind"
        @click="set('team', kind)"
      >
        {{ t(`brand.new.team.${kind}`) }}
      </button>
    </div>

    <!-- Startkarte (Content-Spec §2.1) — vier Felder in der Reihenfolge der
         Spez: URL (optional), Branche, „was ihr macht", „für wen". -->
    <p class="bw-label mt-8" style="color: var(--bw-muted)">{{ t('brand.new.startCard.website') }}</p>
    <UInput
      :model-value="draft.websiteUrl" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="disabled" type="url" inputmode="url" :maxlength="BRAND_WEBSITE_URL_MAX"
      style="background: var(--bw-surface)"
      @update:model-value="value => set('websiteUrl', String(value))"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.industry') }}</p>
    <UInput
      :model-value="draft.industry" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="disabled" :list="listId" :maxlength="BRAND_INDUSTRY_MAX"
      style="background: var(--bw-surface)"
      @update:model-value="value => set('industry', String(value))"
    />
    <!-- „Eingabe mit Vorschlägen" (§2.1): eine datalist, kein zweites API und
         keine geschlossene Auswahl — jeder eigene Begriff bleibt erlaubt. -->
    <datalist :id="listId">
      <option v-for="suggestion in industrySuggestions" :key="suggestion" :value="suggestion" />
    </datalist>

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.about') }}</p>
    <UTextarea
      :model-value="draft.about" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-2xl px-4 py-3' }"
      :disabled="disabled" :rows="3" :maxlength="BRAND_ABOUT_MAX"
      style="background: var(--bw-surface)"
      @update:model-value="value => set('about', String(value))"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.audience') }}</p>
    <UTextarea
      :model-value="draft.audience" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-2xl px-4 py-3' }"
      :disabled="disabled" :rows="2" :maxlength="BRAND_AUDIENCE_MAX"
      style="background: var(--bw-surface)"
      @update:model-value="value => set('audience', String(value))"
    />
  </div>
</template>
