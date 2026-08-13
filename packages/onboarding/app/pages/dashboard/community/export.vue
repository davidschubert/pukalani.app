<script setup lang="ts">
/**
 * COMMUNITY-EINSTELLUNGEN → EXPORT: das Bündel dieser Community als EINE
 * JSON-Datei (U20, 2026-08-12).
 *
 * ── DIE SEITE IST VOR ALLEM EINE EHRLICHE LISTE ────────────────────────────
 * Zwei kurze Aufzählungen — was drin ist, was nicht. Sie stehen NEBEN dem
 * Knopf und nicht in einem Hilfetext, weil ein Export sein Versprechen sonst
 * erst nach dem Herunterladen einlöst: wer eine Datei „Community-Export"
 * öffnet und die Mitgliederliste vermisst, hält das für einen Fehler. Der
 * Zuschnitt selbst ist Davids Entscheidung und wird serverseitig durchgesetzt
 * (packages/onboarding/server/utils/communityTeamExport.ts).
 *
 * ── DER DOWNLOAD ───────────────────────────────────────────────────────────
 * `responseType: 'blob'` statt eines einfachen Links: die Route verlangt eine
 * Session, und ein `<a href>` in einem neuen Tab wäre ein zweiter Weg mit
 * eigenen Fehlerzuständen. Der Toast danach ist kein Schmuck — ein
 * programmatischer Download meldet sich in manchen Browsern gar nicht, ohne
 * Rückmeldung sieht der Klick wie ein Fehlschlag aus (dieselbe Überlegung wie
 * in core/app/components/auth/AccountDataExport.vue).
 *
 * `community.export` trägt nur der Owner. Die Autorität ist trotzdem der
 * Server: `/api/community/export` prüft dieselbe Capability.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], requiredCapability: 'community.export' })

const { t } = useI18n()
const toast = useToast()

useBrandTitle(() => t('onboarding.communityExport.title'))

const { plan } = useTenantPlan()
/** null = kein Pool-Mandant (Silo, Kontroll-Host) — dort gibt es keine Community. */
const isTenantHost = computed(() => plan.value !== null)

/**
 * Die zwei Listen als Schlüssel-Reihen. Sie stehen hier und nicht als Array in
 * der Locale-Datei, damit jeder Punkt ein eigener, prüfbarer i18n-Schlüssel
 * bleibt.
 */
const IN_BUNDLE = ['posts', 'comments', 'pages', 'events', 'courses', 'team'] as const
const NOT_IN_BUNDLE = ['members', 'emails', 'messages', 'reports'] as const

const loading = ref(false)

async function download() {
  loading.value = true
  try {
    const blob = await $fetch<Blob>('/api/community/export', { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // Der Server setzt dasselbe per content-disposition; über den Blob-Weg
    // kommt der Header nicht beim Browser an, also wird der Name hier noch
    // einmal gebaut.
    const host = window.location.hostname.replace(/[^\w.-]/g, '_')
    link.download = `community-export-${host}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.add({
      title: t('onboarding.communityExport.successTitle'),
      description: t('onboarding.communityExport.successDesc'),
      color: 'success',
      icon: 'i-ph-download-simple',
    })
  }
  catch (error) {
    /**
     * HIER WIRD DER STATUS GELESEN UND NICHT `data.reason` — anders als überall
     * sonst im Dashboard, und das hat einen Grund: `responseType: 'blob'` gilt
     * bei ofetch auch für die FEHLER-Antwort. `error.data` wäre also ein Blob,
     * `data.reason` immer `undefined` und der Drossel-Hinweis darunter toter
     * Code, der nie erscheint (dieselbe Falle wie beim `last_admin`-Zweig der
     * Nutzerverwaltung). Der Status trägt hier dieselbe Auskunft und überlebt
     * jeden Antwort-Typ.
     */
    const status = (error as { statusCode?: number, status?: number })?.statusCode
      ?? (error as { status?: number })?.status
    toast.add({
      title: t('onboarding.communityExport.failedTitle'),
      description: status === 429
        ? t('onboarding.communityExport.rateLimited')
        : t('onboarding.communityExport.failedDesc'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="!isTenantHost"
      icon="i-ph-info"
      color="neutral"
      variant="subtle"
      :title="t('onboarding.communityExport.noTenantTitle')"
      :description="t('onboarding.communityExport.noTenantDesc')"
    />

    <UPageCard
      v-else
      :title="t('onboarding.communityExport.title')"
      :description="t('onboarding.communityExport.description')"
      variant="subtle"
    >
      <div class="grid gap-6 sm:grid-cols-2">
        <div>
          <p class="mb-2 text-sm font-medium">{{ t('onboarding.communityExport.inBundleTitle') }}</p>
          <ul class="space-y-1.5">
            <li
              v-for="key in IN_BUNDLE"
              :key="key"
              class="flex items-start gap-2 text-sm text-muted"
            >
              <UIcon name="i-ph-check" class="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{{ t(`onboarding.communityExport.inBundle.${key}`) }}</span>
            </li>
          </ul>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium">{{ t('onboarding.communityExport.notInBundleTitle') }}</p>
          <ul class="space-y-1.5">
            <li
              v-for="key in NOT_IN_BUNDLE"
              :key="key"
              class="flex items-start gap-2 text-sm text-muted"
            >
              <UIcon name="i-ph-x" class="mt-0.5 size-4 shrink-0 text-dimmed" />
              <span>{{ t(`onboarding.communityExport.notInBundle.${key}`) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-muted">{{ t('onboarding.communityExport.hint') }}</p>
          <UButton
            :loading="loading"
            color="primary"
            variant="subtle"
            icon="i-ph-download-simple"
            data-community-export
            @click="download"
          >
            {{ t('onboarding.communityExport.cta') }}
          </UButton>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
