<script setup lang="ts">
import type { InsightsPost, InsightsPostEdit, InsightsReviewIssue, InsightsState } from '../../../../shared/insightsPost'
import type {
  InsightsBrandCreatedResponse,
  InsightsBrandListItem,
  InsightsDraftResponse,
  InsightsEvidenceResponse,
  InsightsPostDetailResponse,
  InsightsPostSavedResponse,
  InsightsPostStateResponse,
  InsightsTranslateResponse,
} from '../../../../shared/types/insightsApi'

/**
 * DER BEITRAGS-EDITOR ALS VOLLSEITE (§9.4, Adresse `/dashboard/insights/<id>`).
 *
 * ── DIE SEITE HÄLT DEN ZUSTAND, DIE KOMPONENTE DIE FORM ──────────────────
 * `InEditor` spricht mit keiner Route (Begründung in ihrem Kopf); hier liegen
 * alle Abrufe, alle Ladezustände und alle Fehlercodes. Das ist die Naht, an
 * der der freigegebene Prototyp und die Umsetzung dieselbe Komponente teilen.
 *
 * ── JEDER FEHLER WIRD BEIM NAMEN GENANNT ─────────────────────────────────
 * Die Routen schicken fachliche Gründe als `data.code`; der zentrale Handler
 * hebt genau diesen Schlüssel als `reason` ins Envelope (`{ok,code,message,
 * reason}`), und hier steht der einzige Leser dafür. Ein unbekannter Grund
 * fällt auf einen allgemeinen Satz zurück — sichtbar, nicht still.
 *
 * ── DER GESPERRTE ÜBERGANG IST KEINE 409 ─────────────────────────────────
 * Das Zustands-Gate antwortet 200 mit `changed: false` und der Liste der
 * offenen Stellen. Warum: die Liste käme in einem Fehler-Körper nie an (der
 * Handler lässt nur den kurzen Schlüssel durch) — die Begründung steht am Typ
 * `InsightsPostStateResponse`.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'admin'],
  requiredCapability: 'insights.manage',
  // Betreiber-Sache, wie die Liste daneben: auf einem Mandanten-Host gäbe es
  // diese Seite nicht. `branding` ist ein Silo — die Angabe ist die Aussage.
  dashboardScope: 'operator',
})

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const localePath = useLocalePath()

const id = computed(() => String(route.params.id ?? ''))

const { data, refresh, status } = await useFetch<InsightsPostDetailResponse>(
  () => `/api/insights/posts/${id.value}`,
  { lazy: true, server: false },
)

/**
 * DER STAND, DEN DER EDITOR SIEHT. Er kommt aus der Abfrage, wird aber von
 * jeder Antwort (Speichern, Übersetzen, Entwerfen, Zustand) ÜBERSCHRIEBEN —
 * ein `refresh()` nach jedem Schreiben wäre eine zweite Rundreise für Daten,
 * die die Antwort schon trug.
 */
const post = ref<InsightsPost | null>(null)
const issues = ref<InsightsReviewIssue[]>([])
const brands = ref<InsightsBrandListItem[]>([])
const knownBrandIds = ref<string[]>([])

watch(data, (next) => {
  if (!next) return
  post.value = next.post
  issues.value = next.issues
  brands.value = next.brands
  knownBrandIds.value = next.knownBrandIds
}, { immediate: true })

useBrandTitle(() => {
  const current = post.value
  if (!current) return t('insights.editor.title')
  return current.baseLocale === 'de' ? (current.titleDe || t('insights.editor.untitled')) : (current.titleEn || t('insights.editor.untitled'))
})

const saving = ref(false)
const translating = ref(false)
const drafting = ref(false)
const transitioning = ref(false)
const checkingIndex = ref<number | null>(null)
const evidence = ref<Record<number, InsightsEvidenceResponse>>({})

/**
 * DER GRUND EINER ABLEHNUNG — aus `error.data.reason`, nicht aus der Meldung.
 *
 * Die Meldung ist bei 5xx generisch und bei 4xx englisch; der GRUND ist der
 * geprüfte Schlüssel, den unsere Route selbst gesetzt hat. Ohne diesen Leser
 * hiesse jedes Nein „es ging etwas schief".
 */
const REASON_KEY: Record<string, string> = {
  ai_disabled: 'insights.editor.error.aiDisabled',
  ai_hourly_limit: 'insights.editor.error.aiHourlyLimit',
  ai_daily_limit: 'insights.editor.error.aiDailyLimit',
  not_draft: 'insights.editor.error.notDraft',
  translation_empty: 'insights.editor.error.translationEmpty',
  slug_taken: 'insights.editor.error.slugTaken',
  transition_not_allowed: 'insights.editor.error.transitionNotAllowed',
  post_not_found: 'insights.editor.error.postNotFound',
  source_not_found: 'insights.editor.error.sourceNotFound',
  storage_unavailable: 'insights.editor.error.storageUnavailable',
}

function reasonOf(error: unknown): string {
  const data = (error as { data?: { reason?: unknown } } | undefined)?.data
  return typeof data?.reason === 'string' ? data.reason : ''
}

/**
 * Ein 400 des Schemas trägt keinen `reason` (Zod, nicht Fachlichkeit) — im
 * Klick-Beweis I2 stand dann nur „Das hat nicht geklappt" neben einer Quelle
 * ohne Herausgeber. Der Hinweis zeigt auf die Prüfregeln: sie rechnen dieselben
 * Formregeln lokal am Entwurf und nennen die Stelle.
 */
function isValidationError(error: unknown): boolean {
  const data = (error as { data?: { code?: unknown } } | undefined)?.data
  return data?.code === 'VALIDATION_ERROR'
}

function fail(error: unknown): void {
  const key = REASON_KEY[reasonOf(error)]
  const title = key
    ? t(key)
    : (isValidationError(error) ? t('insights.editor.error.validation') : t('insights.editor.error.generic'))
  toast.add({ title, color: 'error' })
}

// ── Speichern ──────────────────────────────────────────────────────────────

async function save(payload: InsightsPostEdit): Promise<void> {
  saving.value = true
  try {
    const saved = await $fetch<InsightsPostSavedResponse>(`/api/insights/posts/${id.value}`, {
      method: 'PATCH',
      body: payload,
    })
    post.value = saved.post
    issues.value = saved.issues
    toast.add({ title: t('insights.editor.saved'), color: 'success' })
  }
  catch (error) {
    fail(error)
  }
  finally {
    saving.value = false
  }
}

// ── Zustandswechsel ────────────────────────────────────────────────────────

async function changeState(to: InsightsState): Promise<void> {
  transitioning.value = true
  try {
    const result = await $fetch<InsightsPostStateResponse>(`/api/insights/posts/${id.value}/state`, {
      method: 'POST',
      body: { to },
    })
    post.value = result.post
    issues.value = result.issues
    toast.add({
      title: result.changed ? t('insights.editor.stateChanged') : t('insights.editor.stateBlocked', { count: result.issues.length }),
      color: result.changed ? 'success' : 'warning',
    })
  }
  catch (error) {
    fail(error)
  }
  finally {
    transitioning.value = false
  }
}

// ── Beleg-Ampel ────────────────────────────────────────────────────────────

async function checkEvidence(index: number): Promise<void> {
  checkingIndex.value = index
  try {
    const result = await $fetch<InsightsEvidenceResponse>(`/api/insights/posts/${id.value}/evidence`, {
      method: 'POST',
      body: { sourceIndex: index },
    })
    evidence.value = { ...evidence.value, [index]: result }
  }
  catch (error) {
    fail(error)
  }
  finally {
    checkingIndex.value = null
  }
}

// ── Übersetzen ─────────────────────────────────────────────────────────────

async function translate(): Promise<void> {
  translating.value = true
  try {
    const result = await $fetch<InsightsTranslateResponse>(`/api/insights/posts/${id.value}/translate`, {
      method: 'POST',
    })
    post.value = result.post
    toast.add({ title: t('insights.editor.translateDone'), color: 'success' })
  }
  catch (error) {
    fail(error)
  }
  finally {
    translating.value = false
  }
}

// ── KI-Entwurf ─────────────────────────────────────────────────────────────

async function runDraft(input: { brief: string, targetWords: number }): Promise<void> {
  drafting.value = true
  try {
    const result = await $fetch<InsightsDraftResponse>(`/api/insights/posts/${id.value}/draft`, {
      method: 'POST',
      body: input,
    })
    post.value = result.post
    toast.add({ title: t('insights.editor.draftDone'), color: 'success' })
  }
  catch (error) {
    fail(error)
  }
  finally {
    drafting.value = false
  }
}

// ── Marke anlegen ──────────────────────────────────────────────────────────

async function createBrand(input: { name: string, homepage: string, industry: string }): Promise<void> {
  try {
    const created = await $fetch<InsightsBrandCreatedResponse>('/api/insights/brands', {
      method: 'POST',
      body: input,
    })
    brands.value = [...brands.value, created.brand]
    knownBrandIds.value = [...knownBrandIds.value, created.id]
    toast.add({ title: t('insights.editor.brandCreated'), color: 'success' })
  }
  catch (error) {
    fail(error)
  }
}
</script>

<template>
  <UDashboardPanel id="insights-editor">
    <template #header>
      <UDashboardNavbar :title="t('insights.editor.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :label="t('insights.editor.backToList')" icon="i-ph-arrow-left"
            color="neutral" variant="ghost"
            :to="localePath('/dashboard/insights')"
          />
          <UButton
            icon="i-ph-arrows-clockwise" color="neutral" variant="ghost"
            :loading="status === 'pending'"
            :aria-label="t('insights.editor.reload')"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- `bw-root` trägt den Token-Satz des brand-Layers; ohne ihn stünden die
           `var(--bw-*)`-Farben der Komponente auf Vorgabewerten. -->
      <div class="bw-root">
        <InEditor
          v-if="post"
          :post="post"
          :brands="brands"
          :known-brand-ids="knownBrandIds"
          :issues="issues"
          :evidence="evidence"
          :saving="saving"
          :translating="translating"
          :drafting="drafting"
          :transitioning="transitioning"
          :checking-index="checkingIndex"
          @save="save"
          @change-state="changeState"
          @check-evidence="checkEvidence"
          @translate="translate"
          @draft="runDraft"
          @create-brand="createBrand"
        />
        <CoreEmptyState
          v-else-if="status !== 'pending'"
          icon="i-ph-newspaper"
          :title="t('insights.editor.error.postNotFound')"
          :description="t('insights.editor.emptyDescription')"
          :action-label="t('insights.editor.backToList')"
          :action-to="localePath('/dashboard/insights')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
