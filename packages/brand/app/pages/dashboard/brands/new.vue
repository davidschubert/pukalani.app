<script setup lang="ts">
import type { BrandPathKind } from '../../../../shared/slotRegistry'
import { brandIndustrySuggestions } from '../../../../shared/industrySuggestions'
import {
  BRAND_ABOUT_MAX,
  BRAND_AUDIENCE_MAX,
  BRAND_INDUSTRY_MAX,
  BRAND_WEBSITE_URL_MAX,
  isBrandWebsiteUrl,
} from '../../../../shared/brandStartCard'
import type {
  BrandProfileDetailResponse,
  BrandRelaunchScope,
  BrandTeamKind,
} from '../../../../shared/types/brand'

/**
 * NEUES BRANDING ALS SEITE (Plan §3d Hauptansicht 2, Route §3e
 * `/dashboard/brands/new`).
 *
 * Dieselbe Anlage wie im Modal, aber VOLLSTÄNDIG: hier steht auch die
 * Rebrand-Verzweigung aus Katalog §2.2 — **Feinschliff** (gleiche Marke, besser
 * erzählt) oder **Neuschnitt** (Name, Look, Positionierung stehen zur Debatte),
 * und beim Neuschnitt der Chip „Name auf den Prüfstand" mit Voreinstellung
 * NEIN. Die Wirkung dieser drei Angaben rechnet nicht diese Seite, sondern
 * `brandNamingIncluded()` im Server — hier werden sie nur erhoben.
 *
 * SEHR KURZ HALTEN (§3d): Arbeitstitel, Inhaltssprache, Weichen. Kein
 * mehrseitiges Tutorial vor dem Start.
 *
 * Die Inhaltssprache kommt aus `pukalani.brand.contentLocales` und NICHT aus
 * einer Liste in dieser Datei — sonst stünde hier eine Pukalani-Annahme im
 * Layer (White-Label-Regel §3e). Sie wird bei der Anlage FIXIERT.
 */
/* KEIN `layout: 'dashboard'` mehr (2026-09-03): die Brandings-Seiten sind
 * KUNDEN-Fläche und tragen die Wizard-Nav des default-Layouts — das
 * dashboard-Layout gehört seit der admin-Montage der Betreiber-Shell. */

const { t } = useI18n()
const localePath = useLocalePath()
const appConfig = useAppConfig() as { pukalani?: { brand?: { contentLocales?: string[] } } }

const contentLocales = computed(() => appConfig.pukalani?.brand?.contentLocales ?? ['en'])

/**
 * ÜBERGABE AUS DEM ANLAGE-MODAL: `/dashboard/brands` fragt in seinem Modal
 * dieselben drei Dinge (Weiche, Titel, Sprache) und schickt den Menschen
 * hierher weiter, seit die Startkarte Pflicht ist. Was er dort schon
 * beantwortet hat, wird NICHT ein zweites Mal gefragt — mehr tut die Query
 * nicht, und alles daraus wird geprüft, bevor es ein Anfangswert wird.
 */
const route = useRoute()

function queryValue(key: string): string {
  const raw = route.query[key]
  return typeof raw === 'string' ? raw : ''
}

const pathKind = ref<BrandPathKind>(queryValue('path') === 'relaunch' ? 'relaunch' : 'new')
const relaunchScope = ref<BrandRelaunchScope>('refine')
const namingOpted = ref(false)
const title = ref(queryValue('title'))
const contentLocale = ref(
  contentLocales.value.includes(queryValue('lang')) ? queryValue('lang') : contentLocales.value[0] ?? 'en',
)
const team = ref<BrandTeamKind>('solo')

/**
 * DIE STARTKARTE (Content-Spec §2.1) — vier Felder, mehr erhebt Schritt 0
 * nicht. Sie steht am ENDE des Formulars, obwohl sie in der Spez „Schritt 0"
 * heisst: die Vorschläge für die Branche folgen der INHALTSSPRACHE (sie werden
 * gespeichert und wandern in Georges Prompt), und die wird eine Zeile weiter
 * oben gewählt. Die Weichen davor bleiben unangetastet.
 */
const websiteUrl = ref('')
const industry = ref('')
const about = ref('')
const audience = ref('')

const industrySuggestions = computed(() => brandIndustrySuggestions(contentLocale.value))

/**
 * Drei Pflichtfelder, eine freiwillige Adresse — und die Adresse muss, WENN sie
 * dasteht, eine sein. Geprüft wird hier dieselbe pure Regel, die auch das
 * Anlage-Schema anwendet: der Knopf soll nicht freigegeben aussehen, um dann
 * mit „konnte nicht angelegt werden" zu antworten.
 */
const startCardComplete = computed(() =>
  industry.value.trim().length > 0
  && about.value.trim().length > 0
  && audience.value.trim().length > 0
  && isBrandWebsiteUrl(websiteUrl.value.trim()))

const submitting = ref(false)
const failed = ref(false)

/**
 * ── B7: DIE STARTKARTE SCHLUCKTE EINGABEN (Audit 2026-09-02, dreimal
 * reproduziert) ──────────────────────────────────────────────────────────
 *
 * Wer direkt nach der Navigation hierher zu tippen anfing, verlor den Text:
 * bis zur Hydration hängt an den Feldern kein `v-model`, der Browser nimmt die
 * Zeichen an, und der erste Vue-Render überschreibt sie mit dem leeren
 * Anfangswert. Die Felder SAHEN aber bedienbar aus — das ist der ganze Fehler.
 *
 * DER KLEINSTE EHRLICHE FIX IST, NICHT ZU LÜGEN: bis `onMounted` + `nextTick`
 * sind die Felder sichtbar abgeschaltet, mit einer ruhigen Zeile darüber.
 * Kein Puffer, der vorgetipptes übernimmt — der müsste jedes Feld einzeln
 * auslesen, käme bei Auswahl-Elementen und der `datalist` an seine Grenze und
 * wäre ein zweiter Zustandsspeicher neben den Refs. Lieber eine halbe Sekunde
 * ehrlich gesperrt als scheinbar bereit.
 *
 * `false` auf BEIDEN Seiten (SSR und erster Client-Render), damit das Markup
 * übereinstimmt; das `nextTick` wartet den Render nach der Hydration ab, in dem
 * die Bindungen wirklich hängen.
 */
const hydrated = ref(false)
onMounted(async () => {
  await nextTick()
  hydrated.value = true
})

/** Der Chip erscheint nur beim Neuschnitt — der Feinschliff friert W2 ein. */
const showNamingOpt = computed(() => pathKind.value === 'relaunch' && relaunchScope.value === 'recut')

watch([pathKind, relaunchScope], () => {
  if (!showNamingOpt.value) namingOpted.value = false
})

function firstOpenStep(detail: BrandProfileDetailResponse): string {
  return detail.journey.find(step => step.state === 'open' || step.state === 'active')?.stepKey
    ?? detail.journey.find(step => step.state !== 'skipped')?.stepKey
    ?? 'context'
}

async function submit(): Promise<void> {
  submitting.value = true
  failed.value = false
  try {
    const detail = await $fetch<BrandProfileDetailResponse>('/api/brand/profiles', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        contentLocale: contentLocale.value,
        pathKind: pathKind.value,
        // `relaunchScope` gehört NUR auf den Relaunch-Pfad; das Schema lehnt
        // ihn sonst ab (statt ihn still zu schlucken).
        ...(pathKind.value === 'relaunch' ? { relaunchScope: relaunchScope.value } : {}),
        hasName: pathKind.value === 'relaunch',
        team: team.value,
        subBrands: 'unknown',
        namingOpted: namingOpted.value,
        websiteUrl: websiteUrl.value.trim(),
        industry: industry.value.trim(),
        about: about.value.trim(),
        audience: audience.value.trim(),
      },
    })
    await navigateTo(localePath(`/brand/${detail.profile.id}/${firstOpenStep(detail)}`))
  }
  catch {
    failed.value = true
  }
  finally {
    submitting.value = false
  }
}

useBrandTitle(() => t('brand.new.title'))
</script>

<template>
  <div class="bw-root mx-auto w-full max-w-2xl">
    <NuxtLink :to="localePath('/dashboard/brands')" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
      <UIcon name="i-ph-arrow-left" class="size-4" /> {{ t('brand.brands.title') }}
    </NuxtLink>

    <p class="bw-label mt-4 uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('brand.new.eyebrow') }}</p>
    <h1 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">{{ t('brand.new.title') }}</h1>
    <!-- B7: solange nichts angenommen wird, steht das auch da. Der Satz
         verschwindet mit der Hydration und hinterlässt keine Lücke. -->
    <p v-if="!hydrated" class="bw-pending mt-2">{{ t('brand.new.preparing') }}</p>

    <!-- W1: der Pfad -->
    <div class="mt-6 grid gap-2 sm:grid-cols-2">
      <button
        v-for="kind in (['new', 'relaunch'] as const)" :key="kind"
        type="button"
        :disabled="!hydrated"
        class="bw-select-card rounded-2xl px-4 py-4 text-left"
        :class="pathKind === kind ? 'bw-select-card--on' : ''"
        :aria-pressed="pathKind === kind"
        @click="pathKind = kind"
      >
        <span class="block text-sm font-medium">{{ t(`brand.new.kind.${kind}.label`) }}</span>
        <span class="bw-select-note mt-1 block text-sm">{{ t(`brand.new.kind.${kind}.note`) }}</span>
      </button>
    </div>

    <!-- Rebrand-Verzweigung (Katalog §2.2) -->
    <template v-if="pathKind === 'relaunch'">
      <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.scope.question') }}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="scope in (['refine', 'recut'] as const)" :key="scope"
          type="button"
          :disabled="!hydrated"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="relaunchScope === scope ? 'bw-select-card--on' : ''"
          :aria-pressed="relaunchScope === scope"
          @click="relaunchScope = scope"
        >
          {{ t(`brand.new.scope.${scope}`) }}
        </button>
      </div>
      <div v-if="showNamingOpt" class="mt-3">
        <button
          type="button"
          :disabled="!hydrated"
          class="bw-select-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          :class="namingOpted ? 'bw-select-card--on' : ''"
          :aria-pressed="namingOpted"
          @click="namingOpted = !namingOpted"
        >
          <UIcon :name="namingOpted ? 'i-ph-check' : 'i-ph-circle'" class="size-4 flex-none" />
          {{ t('brand.new.scope.namingOpted') }}
        </button>
      </div>
    </template>

    <!-- Rahmendaten -->
    <p class="bw-label mt-6" style="color: var(--bw-muted)">
      {{ pathKind === 'new' ? t('brand.new.titleField.new') : t('brand.new.titleField.relaunch') }}
    </p>
    <UInput
      v-model="title" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="!hydrated"
      :placeholder="pathKind === 'new' ? t('brand.new.titleField.placeholderNew') : t('brand.new.titleField.placeholderRelaunch')"
      style="background: var(--bw-surface)"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.locale.label') }}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="code in contentLocales" :key="code"
        type="button"
        :disabled="!hydrated"
        class="bw-select-card rounded-full px-4 py-2 text-sm uppercase"
        :class="contentLocale === code ? 'bw-select-card--on' : ''"
        :aria-pressed="contentLocale === code"
        @click="contentLocale = code"
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
        :disabled="!hydrated"
        class="bw-select-card rounded-full px-4 py-2 text-sm"
        :class="team === kind ? 'bw-select-card--on' : ''"
        :aria-pressed="team === kind"
        @click="team = kind"
      >
        {{ t(`brand.new.team.${kind}`) }}
      </button>
    </div>

    <!-- Startkarte (Content-Spec §2.1) — vier Felder in der Reihenfolge der
         Spez: URL (optional), Branche, „was ihr macht", „für wen". -->
    <p class="bw-label mt-8" style="color: var(--bw-muted)">{{ t('brand.new.startCard.website') }}</p>
    <UInput
      v-model="websiteUrl" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="!hydrated" type="url" inputmode="url" :maxlength="BRAND_WEBSITE_URL_MAX"
      style="background: var(--bw-surface)"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.industry') }}</p>
    <UInput
      v-model="industry" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
      :disabled="!hydrated" list="bw-industry-suggestions" :maxlength="BRAND_INDUSTRY_MAX"
      style="background: var(--bw-surface)"
    />
    <!-- „Eingabe mit Vorschlägen" (§2.1): eine datalist, kein zweites API und
         keine geschlossene Auswahl — jeder eigene Begriff bleibt erlaubt. -->
    <datalist id="bw-industry-suggestions">
      <option v-for="suggestion in industrySuggestions" :key="suggestion" :value="suggestion" />
    </datalist>

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.about') }}</p>
    <UTextarea
      v-model="about" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-2xl px-4 py-3' }"
      :disabled="!hydrated" :rows="3" :maxlength="BRAND_ABOUT_MAX"
      style="background: var(--bw-surface)"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.startCard.audience') }}</p>
    <UTextarea
      v-model="audience" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-2xl px-4 py-3' }"
      :disabled="!hydrated" :rows="2" :maxlength="BRAND_AUDIENCE_MAX"
      style="background: var(--bw-surface)"
    />

    <div class="mt-8 flex items-center justify-end gap-3">
      <p v-if="failed" class="mr-auto text-sm" style="color: var(--bw-stale)">{{ t('brand.new.failed') }}</p>
      <UButton
        :loading="submitting"
        :disabled="!hydrated || !startCardComplete"
        trailing-icon="i-ph-arrow-right" :label="t('brand.new.submit')"
        size="lg" class="rounded-full" @click="submit"
      />
    </div>
  </div>
</template>
