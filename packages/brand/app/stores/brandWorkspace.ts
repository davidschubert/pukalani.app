import { defineStore } from 'pinia'
import type {
  BrandConfidence,
  BrandJourneyStep,
} from '../../shared/brandJourney'
import { canEnterBrandStep } from '../../shared/brandJourney'
import type { BrandStepKey, BrandStepProgress } from '../../shared/slotRegistry'
import {
  type BrandLocalSlotEdit,
  type BrandSlotPatch,
  type BrandSyncEvent,
  type BrandSyncState,
  brandAutosaveAllowed,
  brandSlotDisplayValue,
  brandSlotIsConfirmed,
  diffBrandSlots,
  nextBrandSyncState,
  pruneSettledEdits,
} from '../../shared/brandAutosaveDiff'
import type {
  BrandProfileDetailResponse,
  BrandProfileListResponse,
  BrandProfileSummary,
  BrandSlotView,
  BrandStepCompleteResponse,
  BrandStepDetailResponse,
  BrandStepSaveResponse,
} from '../../shared/types/brand'

/**
 * DER ZUSTAND DER WERKSTATT IM BROWSER — Profil, Journey, offener Baustein,
 * Slots (Server-Fassung UND lokale Eingabe getrennt), `revision` und der
 * sichtbare Speicher-Zustand.
 *
 * ── ZWEI FASSUNGEN, NIE EINE ──────────────────────────────────────────────
 * `serverSlots` ist, was der Server zuletzt bestätigt hat; `localEdits` ist,
 * was der Mensch seitdem getippt hat. Sie werden NICHT zusammengelegt, und das
 * ist der ganze 409-Vertrag: kommt ein Konflikt, bleibt die lokale Eingabe
 * unangetastet stehen, während die Serverfassung daneben gezeigt wird. Ein
 * einziges gemeinsames Feld könnte diese Frage nicht mehr beantworten.
 *
 * ── DER STORE MACHT KEINE ZEITSTEUERUNG ───────────────────────────────────
 * Entprellen, Blur, Navigation und der Wiederholungsversuch nach
 * Verbindungsverlust leben in `useBrandAutosave()`. Hier steht nur, WAS gilt —
 * dieselbe Trennung wie zwischen `brandJourney.ts` und den Routen.
 *
 * ── 404 IST EINE ANTWORT, KEIN AUSFALL ────────────────────────────────────
 * Die `/api/brand/**`-Routen antworten bei fehlendem Beta-Zugang 404
 * (Datentür-Muster, `requireBrandAccess`). Der Store macht daraus `denied`, und
 * die Seiten zeigen einen Leerzustand statt einer Fehlerseite: der Grund bleibt
 * bewusst im Server, die Oberfläche sagt nur „noch kein Zugang".
 *
 * ── DIE LESE-AKTIONEN NEHMEN IHREN `fetch` ENTGEGEN ───────────────────────
 * Beim SSR MÜSSEN die Browser-Cookies mitgehen, sonst antwortet das Gate mit
 * der Gast-Sicht (404) und die Seite hydratisiert als „kein Zugang", obwohl das
 * Konto längst eines hat — derselbe Fehler wie bei den Gast-Votes im
 * comments-Store. `useRequestFetch()` gehört aber in eine SETUP-Funktion, nicht
 * in einen Store. Also reicht die Seite ihn herein; im Browser ist die
 * Voreinstellung `$fetch` genau dasselbe.
 */

/** Was ein 409 dem Client hinterlässt, damit die UI beide Fassungen zeigen kann. */
export interface BrandWorkspaceConflict {
  revision: number
  slots: Record<string, BrandSlotView>
}

const EMPTY_PROGRESS: BrandStepProgress = { requiredTotal: 0, requiredFilled: 0, pct: 0 }

/**
 * Womit gelesen wird. Beim SSR reicht die Seite `useRequestFetch()` herein
 * (Cookies!), im Browser bleibt es `$fetch` (s. Kopf).
 */
export type BrandFetcher = ReturnType<typeof useRequestFetch> | typeof $fetch

/** Die vier Formen, in denen ein HTTP-Fehler bei ofetch ankommt. */
interface FetchLikeError {
  status?: number
  statusCode?: number
  response?: { status?: number }
  data?: { reason?: string }
}

function errorStatus(error: unknown): number | null {
  const e = error as FetchLikeError | null
  return e?.status ?? e?.statusCode ?? e?.response?.status ?? null
}

export function brandErrorReason(error: unknown): string | null {
  return (error as FetchLikeError | null)?.data?.reason ?? null
}

const setup = () => {
  const profile = ref<BrandProfileSummary | null>(null)
  const journey = ref<BrandJourneyStep[]>([])

  const stepKey = ref<BrandStepKey | null>(null)
  const serverSlots = ref<Record<string, BrandSlotView>>({})
  const localEdits = ref<Record<string, BrandLocalSlotEdit>>({})
  const revision = ref(0)
  const serverConfidence = ref<BrandConfidence | null>(null)
  const localConfidence = ref<BrandConfidence | null>(null)
  const progress = ref<BrandStepProgress>({ ...EMPTY_PROGRESS })
  const missingRequired = ref<string[]>([])

  const syncState = ref<BrandSyncState>('saved')
  const conflict = ref<BrandWorkspaceConflict | null>(null)

  /** Der Beta-Zugang fehlt (404 der Datentür) — kein Fehler, ein Zustand. */
  const denied = ref(false)
  /**
   * Der Baustein liegt nicht (mehr) auf dem Weg: `locked` (Vorgänger offen)
   * oder `skipped` (Weiche abgewählt). Die Route antwortet darauf mit 403 und
   * legt den Grund als `data.code` bei — anders als beim ZUGANG darf sie das,
   * denn die Existenz des Bausteins ist hier keine Auskunft.
   */
  const blocked = ref<string | null>(null)
  const loading = ref(false)

  const profiles = ref<BrandProfileSummary[]>([])

  // ── Lesen ───────────────────────────────────────────────────────────────

  /** Der Text, den der Editor für einen Slot zeigt: lokale Eingabe schlägt Server. */
  function slotValue(slotId: string): string {
    const edit = localEdits.value[slotId]
    if (edit?.value !== undefined) return edit.value
    return brandSlotDisplayValue(serverSlots.value[slotId])
  }

  function slotConfirmed(slotId: string): boolean {
    const edit = localEdits.value[slotId]
    if (edit?.confirmed !== undefined) return edit.confirmed
    return brandSlotIsConfirmed(serverSlots.value[slotId])
  }

  const pendingSlots = computed<Record<string, BrandSlotPatch>>(
    () => diffBrandSlots(serverSlots.value, localEdits.value),
  )

  const pendingConfidence = computed<BrandConfidence | undefined>(
    () => (localConfidence.value && localConfidence.value !== serverConfidence.value
      ? localConfidence.value
      : undefined),
  )

  const hasPendingWork = computed(
    () => Object.keys(pendingSlots.value).length > 0 || pendingConfidence.value !== undefined,
  )

  const confidence = computed<BrandConfidence | null>(
    () => localConfidence.value ?? serverConfidence.value,
  )

  const currentJourneyStep = computed<BrandJourneyStep | null>(
    () => journey.value.find(entry => entry.stepKey === stepKey.value) ?? null,
  )

  /** Die Bausteine, die auf dem Weg liegen — `skipped` gehört nicht in die Leiste. */
  const railSteps = computed<BrandJourneyStep[]>(
    () => journey.value.filter(entry => entry.state !== 'skipped'),
  )

  function canEnter(candidate: string): boolean {
    return canEnterBrandStep(journey.value, candidate).allowed
  }

  /** Nachbar-Baustein in Weg-Reihenfolge, sofern betretbar. */
  function neighbourStep(direction: -1 | 1): BrandStepKey | null {
    const path = railSteps.value
    const index = path.findIndex(entry => entry.stepKey === stepKey.value)
    if (index < 0) return null
    const target = path[index + direction]
    if (!target) return null
    return canEnter(target.stepKey) ? target.stepKey : null
  }

  // ── Schreiben (lokal) ───────────────────────────────────────────────────

  function setSlotValue(slotId: string, value: string): void {
    localEdits.value = { ...localEdits.value, [slotId]: { ...localEdits.value[slotId], value } }
  }

  function setSlotConfirmed(slotId: string, value: boolean): void {
    localEdits.value = { ...localEdits.value, [slotId]: { ...localEdits.value[slotId], confirmed: value } }
  }

  function setConfidence(value: BrandConfidence): void {
    localConfidence.value = value
  }

  function mark(event: BrandSyncEvent): void {
    syncState.value = nextBrandSyncState(syncState.value, event)
  }

  const autosaveAllowed = computed(() => brandAutosaveAllowed(syncState.value))

  // ── Antworten übernehmen ────────────────────────────────────────────────

  function applyStepDetail(detail: BrandStepDetailResponse): void {
    stepKey.value = detail.stepKey
    serverSlots.value = detail.slots
    revision.value = detail.revision
    serverConfidence.value = detail.confidence
    localConfidence.value = null
    localEdits.value = {}
    progress.value = detail.progress
    missingRequired.value = [...detail.missingRequired]
    conflict.value = null
    syncState.value = 'saved'
    blocked.value = null
  }

  function applySaveResponse(response: BrandStepSaveResponse): void {
    serverSlots.value = response.slots
    revision.value = response.revision
    // Was der Server jetzt so trägt, ist keine offene Änderung mehr — sonst
    // sendete der nächste Tick dieselbe Eingabe erneut.
    localEdits.value = pruneSettledEdits(response.slots, localEdits.value)
    if (pendingConfidence.value === undefined) localConfidence.value = null
    mark('ok')
  }

  function applyConflict(current: BrandWorkspaceConflict): void {
    conflict.value = current
    mark('conflict')
  }

  /** „Serverfassung laden" — die einzige Auflösung, die etwas überschreibt. */
  function resolveWithServer(): void {
    if (!conflict.value) return
    serverSlots.value = conflict.value.slots
    revision.value = conflict.value.revision
    localEdits.value = {}
    localConfidence.value = null
    conflict.value = null
    mark('resolve')
  }

  // ── Routen ──────────────────────────────────────────────────────────────

  async function loadProfiles(fetcher: BrandFetcher = $fetch): Promise<void> {
    loading.value = true
    try {
      const response = await fetcher<BrandProfileListResponse>('/api/brand/profiles')
      profiles.value = response.profiles
      denied.value = false
    }
    catch (error) {
      profiles.value = []
      denied.value = errorStatus(error) === 404
      if (!denied.value) throw error
    }
    finally {
      loading.value = false
    }
  }

  function applyDetail(detail: BrandProfileDetailResponse): void {
    profile.value = detail.profile
    journey.value = detail.journey
    denied.value = false
  }

  async function loadProfile(profileId: string, fetcher: BrandFetcher = $fetch): Promise<boolean> {
    try {
      const detail = await fetcher<BrandProfileDetailResponse>(`/api/brand/profiles/${profileId}`)
      applyDetail(detail)
      return true
    }
    catch (error) {
      if (errorStatus(error) === 404) {
        denied.value = true
        profile.value = null
        journey.value = []
        return false
      }
      throw error
    }
  }

  async function loadStep(profileId: string, key: string, fetcher: BrandFetcher = $fetch): Promise<boolean> {
    try {
      const detail = await fetcher<BrandStepDetailResponse>(
        `/api/brand/profiles/${profileId}/steps/${key}`,
      )
      applyStepDetail(detail)
      return true
    }
    catch (error) {
      const status = errorStatus(error)
      if (status === 404) {
        denied.value = true
        return false
      }
      if (status === 403) {
        blocked.value = brandErrorReason(error) ?? 'locked'
        return false
      }
      throw error
    }
  }

  async function completeStep(profileId: string): Promise<void> {
    if (!stepKey.value) return
    const response = await $fetch<BrandStepCompleteResponse>(
      `/api/brand/profiles/${profileId}/steps/${stepKey.value}/complete`,
      {
        method: 'POST',
        body: { ...(confidence.value ? { confidence: confidence.value } : {}) },
      },
    )
    journey.value = response.journey
    serverConfidence.value = confidence.value
    localConfidence.value = null
    if (profile.value) {
      profile.value = {
        ...profile.value,
        progressPct: response.progressPct,
        currentStepKey: response.currentStepKey,
      }
    }
  }

  function reset(): void {
    profile.value = null
    journey.value = []
    stepKey.value = null
    serverSlots.value = {}
    localEdits.value = {}
    revision.value = 0
    serverConfidence.value = null
    localConfidence.value = null
    progress.value = { ...EMPTY_PROGRESS }
    missingRequired.value = []
    syncState.value = 'saved'
    conflict.value = null
    denied.value = false
    blocked.value = null
  }

  return {
    profile,
    profiles,
    journey,
    stepKey,
    serverSlots,
    localEdits,
    revision,
    progress,
    missingRequired,
    syncState,
    conflict,
    denied,
    blocked,
    loading,
    confidence,
    pendingSlots,
    pendingConfidence,
    hasPendingWork,
    autosaveAllowed,
    currentJourneyStep,
    railSteps,
    slotValue,
    slotConfirmed,
    canEnter,
    neighbourStep,
    setSlotValue,
    setSlotConfirmed,
    setConfidence,
    mark,
    applyStepDetail,
    applySaveResponse,
    applyConflict,
    resolveWithServer,
    loadProfiles,
    loadProfile,
    loadStep,
    completeStep,
    reset,
  }
}

export const useBrandWorkspaceStore = defineStore('brandWorkspace', setup)
