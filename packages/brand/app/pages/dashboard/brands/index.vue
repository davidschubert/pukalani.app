<script setup lang="ts">
import type { BwNewBrandSubmit } from '../../../components/BwNewBrandModal.vue'
import { BRAND_STEP_KEYS, type BrandStepKey } from '../../../../shared/slotRegistry'
import type { BrandProfileDetailResponse, BrandProfileSummary } from '../../../../shared/types/brand'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'

/**
 * „BRANDINGS" — die echte Übersicht (Plan §3d Hauptansicht 1, Route §3e).
 *
 * Die OPTIK ist die des abgenommenen Klickdummys: `BwBrandCard` in einem
 * ruhigen Kartenraster, kein Datengrid, und ein Leerzustand als Einladung.
 * Die DATEN kommen aus `GET /api/brand/profiles`.
 *
 * ── DAS 404 DES GATES IST EIN ZUSTAND, KEINE FEHLERSEITE ──────────────────
 * `requireBrandAccess` antwortet ohne Beta-Zugang mit 404 (Datentür-Muster:
 * ein 403 verriete, dass es hinter dem Pfad etwas gibt). Diese Seite zeigt
 * dann „noch kein Zugang" — sie wirft NICHT, denn die Seite selbst ist ja
 * erreichbar. Genau dieser Zweig ist auch das, was der `.playground` ohne
 * eigene Appwrite zeigt.
 *
 * ── WARUM `useRequestFetch` ───────────────────────────────────────────────
 * Beim SSR müssen die Session-Cookies mitgehen; ein nacktes `$fetch` schickte
 * sie nicht mit und die Seite hydratisierte als „kein Zugang", obwohl das
 * Konto eines hat.
 */
definePageMeta({ layout: 'dashboard' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

await useAsyncData('brand-profiles', async () => {
  await store.loadProfiles(request)
  return true
})

const newBrandOpen = ref(false)
const creating = ref(false)
const createError = ref(false)

/**
 * Grobe Restzeit. §3d verlangt „menschlich, nicht technisch" — 45 Minuten ist
 * die Zahl aus der Interaktionsbilanz (Katalog §16), der Prozentwert kommt vom
 * Server. Eine Minutenzahl auf zwei Stellen wäre eine Genauigkeit, die es
 * nicht gibt.
 */
const TOTAL_MINUTES = 45

function remaining(profile: BrandProfileSummary): string {
  const minutes = Math.max(1, Math.round(((100 - profile.progressPct) / 100) * TOTAL_MINUTES))
  return t('brand.brands.card.remaining', { minutes })
}

function stepLabel(key: string): string {
  return (BRAND_STEP_KEYS as readonly string[]).includes(key)
    ? t(`brand.steps.${key}`)
    : t('brand.steps.context')
}

function stepPosition(profile: BrandProfileSummary): string {
  const index = BRAND_STEP_KEYS.indexOf(profile.currentStepKey as BrandStepKey)
  return t('brand.brands.card.stepOf', {
    index: index < 0 ? 1 : index + 1,
    total: BRAND_STEP_KEYS.length,
  })
}

function editedAt(profile: BrandProfileSummary): string {
  const when = new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' })
    .format(new Date(profile.lastActivityAt))
  return t('brand.brands.card.edited', { when })
}

function workspacePath(profile: BrandProfileSummary): string {
  return localePath(`/brand/${profile.id}/${profile.currentStepKey}`)
}

/** Der erste Baustein, den die Zustandsmaschine freigibt. */
function firstOpenStep(detail: BrandProfileDetailResponse): string {
  return detail.journey.find(step => step.state === 'open' || step.state === 'active')?.stepKey
    ?? detail.journey.find(step => step.state !== 'skipped')?.stepKey
    ?? 'context'
}

/**
 * Der echte Submit des Modals. Es erhebt drei Dinge (Weiche, Titel, Sprache) —
 * die restlichen Weichen bekommen ihre Voreinstellung und werden im Gespräch
 * bzw. unter `/dashboard/brands/new` gestellt. `hasName` folgt der Weiche: eine
 * neue Marke startet namenlos (der Arbeitstitel ist keiner), ein Relaunch hat
 * einen — das ist genau die W2-Regel aus Katalog §2.2.
 */
async function createFromModal(payload: BwNewBrandSubmit): Promise<void> {
  creating.value = true
  createError.value = false
  try {
    const detail = await $fetch<BrandProfileDetailResponse>('/api/brand/profiles', {
      method: 'POST',
      body: {
        title: payload.title,
        contentLocale: payload.lang,
        pathKind: payload.kind === 'rebrand' ? 'relaunch' : 'new',
        hasName: payload.kind === 'rebrand',
        team: 'solo',
        subBrands: 'unknown',
        namingOpted: false,
      },
    })
    newBrandOpen.value = false
    await navigateTo(localePath(`/brand/${detail.profile.id}/${firstOpenStep(detail)}`))
  }
  catch {
    createError.value = true
  }
  finally {
    creating.value = false
  }
}

useBrandTitle(() => t('brand.brands.title'))
</script>

<template>
  <div class="bw-root">
    <div class="@container mx-auto w-full max-w-(--ui-container)">
      <div class="mb-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-2xl font-semibold">{{ t('brand.brands.title') }}</h1>
            <p class="mt-1 text-sm" style="color: var(--bw-muted)">{{ t('brand.brands.subtitle') }}</p>
          </div>
          <UButton
            v-if="!store.denied"
            icon="i-ph-plus" :label="t('brand.brands.new')" variant="outline"
            @click="newBrandOpen = true"
          />
        </div>
      </div>

      <!-- Kein Beta-Zugang: Leerzustand statt Fehlerseite (s. Kopf). -->
      <div
        v-if="store.denied"
        class="bw-rounded-card flex flex-col items-center justify-center border border-dashed p-10 text-center"
        style="border-color: var(--bw-line-strong)"
      >
        <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
        <p class="mt-4 font-medium">{{ t('brand.workspace.noAccess.title') }}</p>
        <p class="mt-1 max-w-md text-sm" style="color: var(--bw-muted)">{{ t('brand.workspace.noAccess.description') }}</p>
      </div>

      <div
        v-else-if="!store.profiles.length"
        class="bw-rounded-card flex flex-col items-center justify-center border border-dashed p-10 text-center"
        style="border-color: var(--bw-line-strong)"
      >
        <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
        <p class="mt-4 font-medium">{{ t('brand.brands.empty.title') }}</p>
        <p class="mt-1 max-w-md text-sm" style="color: var(--bw-muted)">{{ t('brand.brands.empty.description') }}</p>
        <UButton
          class="mt-4" icon="i-ph-plus" :label="t('brand.brands.empty.action')" variant="outline"
          @click="newBrandOpen = true"
        />
      </div>

      <div v-else class="grid gap-x-6 gap-y-16 @sm:grid-cols-2 @lg:grid-cols-3">
        <NuxtLink v-for="profile in store.profiles" :key="profile.id" :to="workspacePath(profile)" class="block">
          <BwBrandCard
            :title="profile.title || t('brand.brands.card.untitled')"
            :path="t(`brand.brands.card.path.${profile.pathKind}`)"
            :step="t('brand.brands.card.currentStep', { step: stepLabel(profile.currentStepKey) })"
            :progress="stepPosition(profile)"
            :remaining="remaining(profile)"
            :edited="editedAt(profile)"
            :pct="profile.progressPct"
          />
        </NuxtLink>
      </div>

      <p v-if="createError" class="mt-6 text-sm" style="color: var(--bw-stale)">{{ t('brand.new.failed') }}</p>
    </div>

    <BwNewBrandModal
      v-model:open="newBrandOpen" mode="live" :loading="creating"
      @submit="createFromModal"
    />
  </div>
</template>
