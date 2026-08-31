<script setup lang="ts">
import type { BrandPathKind } from '../../../../shared/slotRegistry'
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
definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const localePath = useLocalePath()
const appConfig = useAppConfig() as { pukalani?: { brand?: { contentLocales?: string[] } } }

const contentLocales = computed(() => appConfig.pukalani?.brand?.contentLocales ?? ['en'])

const pathKind = ref<BrandPathKind>('new')
const relaunchScope = ref<BrandRelaunchScope>('refine')
const namingOpted = ref(false)
const title = ref('')
const contentLocale = ref(contentLocales.value[0] ?? 'en')
const team = ref<BrandTeamKind>('solo')

const submitting = ref(false)
const failed = ref(false)

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

    <!-- W1: der Pfad -->
    <div class="mt-6 grid gap-2 sm:grid-cols-2">
      <button
        v-for="kind in (['new', 'relaunch'] as const)" :key="kind"
        type="button"
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
      :placeholder="pathKind === 'new' ? t('brand.new.titleField.placeholderNew') : t('brand.new.titleField.placeholderRelaunch')"
      style="background: var(--bw-surface)"
    />

    <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.locale.label') }}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="code in contentLocales" :key="code"
        type="button"
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
        class="bw-select-card rounded-full px-4 py-2 text-sm"
        :class="team === kind ? 'bw-select-card--on' : ''"
        :aria-pressed="team === kind"
        @click="team = kind"
      >
        {{ t(`brand.new.team.${kind}`) }}
      </button>
    </div>

    <div class="mt-8 flex items-center justify-end gap-3">
      <p v-if="failed" class="mr-auto text-sm" style="color: var(--bw-stale)">{{ t('brand.new.failed') }}</p>
      <UButton
        :loading="submitting" trailing-icon="i-ph-arrow-right" :label="t('brand.new.submit')"
        size="lg" class="rounded-full" @click="submit"
      />
    </div>
  </div>
</template>
