<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { INSIGHTS_FORMATS, INSIGHTS_LOCALES } from '../../../../shared/insightsPost'
import type { InsightsPostListItem, InsightsPostCreatedResponse, InsightsPostsListResponse } from '../../../../shared/types/insightsApi'
import { createInsightsNewPostSchema } from '../../../utils/insightsForms'

/**
 * DIE REDAKTIONSLISTE (§9.4, Adresse `/dashboard/insights`).
 *
 * ── SIE IST EINE ARBEITSLISTE, KEIN JOURNAL ──────────────────────────────
 * Sie zeigt ALLE Zustände, sortiert nach zuletzt bearbeitet. Was öffentlich
 * ist, sieht man auf `/insights` (I3) — hier interessiert, woran gerade
 * gearbeitet wird.
 *
 * ── `UTable` IST GESETZT (Davids Entscheidung B6) ────────────────────────
 * Sortierung, Auswahl und Blättern verhalten sich damit überall gleich; der
 * Leerzustand läuft über `CoreEmptyState`.
 *
 * ── DER TITEL STEHT IN DER SPRACHE DES LESERS ────────────────────────────
 * `insightsPublicFassung` beantwortet dieselbe Frage wie die öffentliche
 * Route: welche Fassung gilt? Ein „·1" daneben heisst, dass die zweite Fassung
 * noch nicht redigiert ist — die Zahl der offenen Sprachen, nicht ein Fehler.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'admin'],
  requiredCapability: 'insights.manage',
  // Betreiber-Sache: auf einem Mandanten-Host gäbe es diese Liste nicht (der
  // Orts-Wächter antwortet dort 404). `branding` ist ein Silo — hier ist sie
  // immer sichtbar; die Angabe ist die Aussage, nicht die Ausnahme.
  dashboardScope: 'operator',
})

const { t, locale } = useI18n()
const toast = useToast()
const localePath = useLocalePath()
useBrandTitle(() => t('insights.editor.title'))

const readerLocale = computed(() => (locale.value === 'de' ? 'de' : 'en') as 'de' | 'en')

const { data, refresh, status } = await useFetch<InsightsPostsListResponse>('/api/insights/posts', {
  lazy: true,
  server: false,
})

const rows = computed(() => data.value?.posts ?? [])

const columns = computed<TableColumn<InsightsPostListItem>[]>(() => [
  { id: 'title', header: () => t('insights.editor.colTitle') },
  { accessorKey: 'format', header: () => t('insights.editor.colFormat') },
  { accessorKey: 'state', header: () => t('insights.editor.colState') },
  { accessorKey: 'baseLocale', header: () => t('insights.editor.colLocale') },
  { accessorKey: 'updatedAt', header: () => t('insights.editor.colUpdated') },
  // Ein Kopf DARF nicht leer bleiben (`header: () => ''` ist ein stiller
  // Hydrations-Fehler) — er trägt eine Beschriftung für Vorleseprogramme.
  { id: 'open', header: () => t('insights.editor.colOpen') },
])

/** Der Titel in der Lesersprache — mit Rückfall auf die Grundfassung. */
function titleOf(row: InsightsPostListItem): string {
  const wantsDe = readerLocale.value === 'de'
  const hasWanted = row.baseLocale === readerLocale.value || row.translationReviewed
  const useDe = hasWanted ? wantsDe : row.baseLocale === 'de'
  return (useDe ? row.titleDe : row.titleEn) || t('insights.editor.untitled')
}

function openPost(id: string): void {
  navigateTo(localePath(`/dashboard/insights/${id}`))
}

// ── Neuer Beitrag ──────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const creating = ref(false)
const schema = computed(() => createInsightsNewPostSchema(t))
const form = reactive({ format: 'article' as (typeof INSIGHTS_FORMATS)[number], baseLocale: 'de' as (typeof INSIGHTS_LOCALES)[number], title: '' })

const formatItems = computed(() => INSIGHTS_FORMATS.map(format => ({ label: t(`insights.format.${format}`), value: format })))
const localeItems = computed(() => INSIGHTS_LOCALES.map(code => ({
  label: t(`insights.list.locale${code === 'de' ? 'De' : 'En'}`),
  value: code,
})))

async function createPost(): Promise<void> {
  creating.value = true
  try {
    const created = await $fetch<InsightsPostCreatedResponse>('/api/insights/posts', {
      method: 'POST',
      body: { format: form.format, baseLocale: form.baseLocale, title: form.title.trim() },
    })
    dialogOpen.value = false
    form.title = ''
    await refresh()
    openPost(created.id)
  }
  catch {
    toast.add({ title: t('insights.editor.createFailed'), color: 'error' })
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="insights-posts">
    <template #header>
      <UDashboardNavbar :title="t('insights.editor.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :label="t('insights.admin.navRadar')" icon="i-ph-broadcast"
            color="neutral" variant="ghost"
            :to="localePath('/dashboard/insights/radar')"
          />
          <UButton :label="t('insights.editor.newPost')" icon="i-ph-plus" @click="dialogOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-sm leading-relaxed text-muted">{{ t('insights.editor.lead') }}</p>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
        class="mt-4"
      >
        <template #title-cell="{ row }">
          <button class="text-left text-sm font-medium hover:underline" @click="openPost(row.original.id)">
            {{ titleOf(row.original) }}
          </button>
        </template>
        <template #format-cell="{ row }">
          <span class="text-sm text-muted">{{ t(`insights.format.${row.original.format}`) }}</span>
        </template>
        <template #state-cell="{ row }">
          <UBadge
            :color="row.original.state === 'draft' ? 'neutral' : row.original.state === 'review' ? 'warning' : 'success'"
            variant="subtle"
            :label="t(`insights.state.${row.original.state}`)"
          />
        </template>
        <template #baseLocale-cell="{ row }">
          <span class="text-sm text-muted">
            {{ row.original.baseLocale }}<template v-if="!row.original.translationReviewed"> · 1</template>
          </span>
        </template>
        <template #updatedAt-cell="{ row }">
          <span class="text-sm tabular-nums text-muted">{{ row.original.updatedAt.slice(0, 10) }}</span>
        </template>
        <template #open-cell="{ row }">
          <UButton
            icon="i-ph-pencil-simple" size="xs" color="neutral" variant="ghost"
            :aria-label="t('insights.editor.colOpen')"
            @click="openPost(row.original.id)"
          />
        </template>

        <template #empty>
          <CoreEmptyState
            icon="i-ph-newspaper"
            :title="t('insights.editor.emptyTitle')"
            :description="t('insights.editor.emptyDescription')"
            :action-label="t('insights.editor.newPost')"
            action-icon="i-ph-plus"
            @action="dialogOpen = true"
          />
        </template>
      </UTable>

      <UModal v-model:open="dialogOpen" :title="t('insights.editor.newPost')">
        <template #body>
          <UForm :schema="schema" :state="form" class="space-y-3" @submit="createPost">
            <UFormField :label="t('insights.editor.format')" name="format" required>
              <USelect v-model="form.format" :items="formatItems" value-key="value" class="w-full" />
            </UFormField>
            <UFormField :label="t('insights.editor.baseLocale')" name="baseLocale" required>
              <USelect v-model="form.baseLocale" :items="localeItems" value-key="value" class="w-full" />
            </UFormField>
            <UFormField :label="t('insights.editor.titleField')" name="title" required>
              <UInput v-model="form.title" class="w-full" :maxlength="200" />
            </UFormField>
            <UButton type="submit" :loading="creating" :label="t('insights.editor.newPostSubmit')" />
          </UForm>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
