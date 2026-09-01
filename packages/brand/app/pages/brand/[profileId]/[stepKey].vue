<script setup lang="ts">
import type { BwMessage } from '../../../components/BwGeorge.vue'
import type { BwRailLayer, BwRailStep } from '../../../components/BwProgressRail.vue'
import {
  BRAND_CONFIDENCE_VALUES,
  type BrandConfidence,
  resolveNextQuestion,
} from '../../../../shared/brandJourney'
import {
  BRAND_STEP_KEYS,
  type BrandPathKind,
  type BrandSlot,
  type BrandSlotStateFacts,
  type BrandStepKey,
  questionKeyFor,
  slotsForStep,
} from '../../../../shared/slotRegistry'
import { brandSlotDisplayValue } from '../../../../shared/brandAutosaveDiff'
import { brandAiRejectionMessageKey } from '../../../../shared/brandAiLimits'
import type { BrandGenerationVersionsResponse } from '../../../../shared/types/brand'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'
import { useBrandAutosave } from '../../../composables/useBrandAutosave'
import { useBrandGeneration } from '../../../composables/useBrandGeneration'

/**
 * DER VOLLBILD-WORKSPACE — die echte Werkstatt (Plan §3d Hauptansicht 4,
 * Route §3e `/brand/:profileId/:stepKey`).
 *
 * ── DIE OPTIK IST DIE ABGENOMMENE, DIE DATEN SIND ECHT ────────────────────
 * `BwWorkspace` (drei Zonen, USplitter, Responsive), `BwProgressRail`
 * (Fortschritt menschlich), `BwGeorge` (Monogramm, ein Zug pro Frage),
 * `BwChapter` und `BwChips` kommen unverändert aus dem Klickdummy. Was hier neu
 * ist, ist ausschliesslich die Herkunft der Inhalte: Journey aus
 * `GET /api/brand/profiles/:id`, Slots aus `GET …/steps/:stepKey`, Beschriftung
 * aus der SLOT-REGISTRY über i18n.
 *
 * ── DIE BÜHNE RENDERT DIE REGISTRY, NICHT EINE LISTE ──────────────────────
 * `slotsForStep(stepKey)` ist die einzige Quelle dafür, welche Felder dieser
 * Baustein hat, in welcher Reihenfolge, mit welchem Editor und welchem Deckel.
 * Eine zweite Liste hier wäre genau das „fünfte getrennte Regelwerk", das §3e
 * ausschliesst — und sie liefe beim nächsten Katalog-Update auseinander.
 *
 * ── GEORGE FÜHRT — UND SEIT P1c SCHREIBT ER AUCH ──────────────────────────
 * Die Spalte zeigt weiter die NÄCHSTE offene Frage (`resolveNextQuestion` +
 * `questionKeyFor` für den Pfad der Weiche W1). Dazu kommen seine ZÜGE aus dem
 * Strom: jeder generierbare Slot hat einen Knopf, der
 * `POST …/steps/:stepKey/generate` öffnet, die Deltas laufen live in eine
 * Sprechblase, und der fertige Entwurf landet MARKIERT im Editor (§3b.3) —
 * sichtbar als Entwurf, bis der Mensch bestätigt.
 *
 * WELCHER TEXT DABEI ENTSTEHT, entscheidet die Generator-Registry des Servers.
 * In P1c ist das der Entwicklungs-Ersatz (`pukalani.brand.devStubGenerator`,
 * nur im .playground); die echten Prompts kommen mit P2 an derselben Naht,
 * ohne eine Zeile hier.
 *
 * ── DREI ZUSTÄNDE, DIE KEINE FEHLERSEITE SIND ─────────────────────────────
 * `denied` (404 der Datentür — kein Beta-Zugang), `blocked` (403: der Baustein
 * liegt nicht auf dem Weg) und der KONFLIKT (409). Alle drei bekommen eine
 * Fläche mit Erklärung; geworfen wird hier nichts.
 */
definePageMeta({ layout: 'brand-workspace' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

const profileId = computed(() => String(route.params.profileId ?? ''))
const routeStepKey = computed(() => String(route.params.stepKey ?? ''))

const autosave = useBrandAutosave(profileId)
// ERST SPEICHERN, DANN GENERIEREN: der Server baut den Entwurf aus den
// GESPEICHERTEN Quell-Slots. Ohne dieses Ausspülen entwürfe George aus einem
// Stand, den der Mensch eine Sekunde vorher überholt hat.
const generation = useBrandGeneration(profileId, { beforeGenerate: () => autosave.flush() })

await useAsyncData(
  () => `brand-workspace-${profileId.value}-${routeStepKey.value}`,
  async () => {
    const ok = await store.loadProfile(profileId.value, request)
    if (ok) await store.loadStep(profileId.value, routeStepKey.value, request)
    return true
  },
  { watch: [profileId, routeStepKey] },
)

const stepKey = computed<BrandStepKey | null>(() =>
  (BRAND_STEP_KEYS as readonly string[]).includes(routeStepKey.value)
    ? (routeStepKey.value as BrandStepKey)
    : null)

const pathKind = computed<BrandPathKind>(() => store.profile?.pathKind ?? 'new')

const slots = computed<readonly BrandSlot[]>(() => (stepKey.value ? slotsForStep(stepKey.value) : []))

/** Die Beschriftung eines Slots: gefragt wird pfadabhängig, beschriftet nicht. */
function slotLabel(slot: BrandSlot): string {
  return slot.type === 'question' || slot.type === 'choice'
    ? t(questionKeyFor(slot, pathKind.value))
    : t(slot.questionKey)
}

// ── George: die nächste offene Frage ──────────────────────────────────────

/** Lokal übersprungen („Weiß ich nicht") — nichts wird gespeichert, der Zeiger rückt vor. */
const skipped = ref<string[]>([])
watch(routeStepKey, () => { skipped.value = [] })

const slotFacts = computed<Record<string, BrandSlotStateFacts>>(() => {
  const facts: Record<string, BrandSlotStateFacts> = {}
  for (const slot of slots.value) {
    facts[slot.id] = {
      hasValue: store.slotValue(slot.id).length > 0 || skipped.value.includes(slot.id),
      confirmed: store.slotConfirmed(slot.id),
    }
  }
  return facts
})

const nextQuestion = computed(() =>
  (stepKey.value ? resolveNextQuestion(stepKey.value, slotFacts.value) : null))

const nextSlot = computed<BrandSlot | null>(() =>
  slots.value.find(slot => slot.id === nextQuestion.value?.slotId) ?? null)

/** Georges Züge aus dem Strom — sie stehen VOR der nächsten Frage. */
const streamed = computed<BwMessage[]>(() => store.streamMessages.map(message => ({
  id: message.id,
  role: 'george' as const,
  text: message.text,
  pending: message.pending,
})))

const georgeMessages = computed<BwMessage[]>(() => {
  if (!nextSlot.value) {
    return [
      ...streamed.value,
      { id: 'done', role: 'george', text: t('brand.workspace.george.nothingOpen') },
    ]
  }
  return [
    ...streamed.value,
    {
      id: nextSlot.value.id,
      role: 'george',
      text: t(questionKeyFor(nextSlot.value, pathKind.value)),
      help: nextSlot.value.helpKey ? t(nextSlot.value.helpKey) : undefined,
    },
  ]
})

function answerFromGeorge(text: string): void {
  const slot = nextSlot.value
  if (!slot) return
  store.setSlotValue(slot.id, text)
  autosave.schedule()
}

function skipQuestion(): void {
  const slot = nextSlot.value
  if (!slot) return
  skipped.value = [...skipped.value, slot.id]
}

// ── Bühne: Eingaben ───────────────────────────────────────────────────────

const openHelp = ref<string | null>(null)

function onInput(slotId: string, value: string): void {
  store.setSlotValue(slotId, value)
  autosave.schedule()
}

async function confirmSlot(slotId: string): Promise<void> {
  store.setSlotConfirmed(slotId, true)
  await autosave.flush()
}

// ── George entwirft (§3b.3) ───────────────────────────────────────────────

/** Der Hinweis je Slot („wärmer", „kürzer") — lokal, nie gespeichert. */
const hints = ref<Record<string, string>>({})
watch(routeStepKey, () => { hints.value = {} })

/** Nur Slots, die George überhaupt entwirft — eine reine Menschenfrage nicht. */
function isGeneratable(slot: BrandSlot): boolean {
  return slot.generator !== 'none'
}

async function generateSlot(slot: BrandSlot): Promise<void> {
  await generation.generate(slot.id, hints.value[slot.id] ?? '')
  // Der Hinweis hat gewirkt oder nicht — stehen bleiben soll er nicht, sonst
  // reist er stillschweigend in den nächsten Versuch.
  hints.value = { ...hints.value, [slot.id]: '' }
}

/**
 * `ai_disabled` und `no_generator` sind BETRIEBSZUSTÄNDE, kein Unglück: der
 * Stand bleibt voll bearbeitbar (§9b.5). Sie bekommen deshalb einen ruhigen
 * Hinweis an Ort und Stelle — keinen Toast, keine Farbe, keine Warnung.
 */
// ── Frühere Fassungen ─────────────────────────────────────────────────────

/**
 * DIE WIEDERHERSTELLUNG SCHREIBT IN DEN EDITOR, NICHT AUF DEN SERVER.
 *
 * Eine gewählte Fassung wird eine ganz gewöhnliche lokale Eingabe und geht über
 * den NORMALEN Autosave — mit derselben `revision`-Rechnung wie jeder Tastendruck.
 * Ein eigener Schreibweg hätte eine zweite Wahrheit über `revision` eingeführt,
 * und der 409-Konfliktdialog aus P1c hätte einen Fall mehr zu erklären, den er
 * nicht ausgelöst hat. Er bekommt durch diese Funktion deshalb NICHTS Neues:
 * kollidiert das Zurückholen mit einer Änderung aus einem anderen Tab, ist das
 * exakt der Konflikt, den er schon kennt.
 */
const versionsSlot = ref<BrandSlot | null>(null)
const versions = ref<BrandGenerationVersionsResponse | null>(null)
const versionsLoading = ref(false)

const versionsOpen = computed({
  get: () => versionsSlot.value !== null,
  set: (value: boolean) => { if (!value) versionsSlot.value = null },
})

/** Es gibt etwas zu zeigen, sobald für den Slot je ein Text gespeichert war. */
function hasHistory(slot: BrandSlot): boolean {
  return Boolean(store.serverSlots[slot.id]?.firstDraft)
}

async function openVersions(slot: BrandSlot): Promise<void> {
  versionsSlot.value = slot
  versions.value = null
  versionsLoading.value = true
  try {
    versions.value = await $fetch<BrandGenerationVersionsResponse>(
      `/api/brand/profiles/${profileId.value}/steps/${routeStepKey.value}/generations`,
      { query: { slotId: slot.id } },
    )
  }
  catch {
    // Eine unlesbare Historie ist kein Grund, die Werkstatt zu stören: das
    // Fenster zeigt dann seinen Leerzustand.
    versions.value = null
  }
  finally {
    versionsLoading.value = false
  }
}

function useVersion(text: string): void {
  const slot = versionsSlot.value
  if (!slot) return
  store.setSlotValue(slot.id, text)
  autosave.schedule()
  versionsSlot.value = null
}

const generationNotice = computed<string | null>(() => {
  const code = generation.failureCode.value
  if (!code) return null
  // Die vier Drossel-Gründe zuerst: sie sind die einzigen, die dem Menschen
  // sagen, WANN es wieder geht (gleich · morgen · nicht an dir).
  const throttled = brandAiRejectionMessageKey(code)
  if (throttled) return t(throttled)
  if (code === 'ai_disabled') return t('brand.workspace.generate.aiDisabled')
  if (code === 'no_generator') return t('brand.workspace.generate.noGenerator')
  if (code === 'generation_active') return t('brand.workspace.generate.busy')
  if (code === 'aborted') return t('brand.workspace.generate.stopped')
  return t('brand.workspace.generate.failed')
})

// ── Leiste + Fortschritt ──────────────────────────────────────────────────

function railState(state: string): BwRailStep['state'] {
  if (state === 'done') return 'done'
  if (state === 'active') return 'active'
  return 'open'
}

const railLayers = computed<BwRailLayer[]>(() => [{
  id: 'foundation',
  label: t('brand.workspace.railLayer'),
  steps: store.railSteps.map((entry): BwRailStep => ({
    id: entry.stepKey,
    label: t(`brand.steps.${entry.stepKey}`),
    icon: '',
    state: entry.stepKey === stepKey.value && entry.state !== 'done' ? 'active' : railState(entry.state),
  })),
}])

const progressNote = computed(() => t('brand.workspace.progress', {
  filled: store.progress.requiredFilled,
  total: store.progress.requiredTotal,
}))

/** `BwWorkspace` zeigt nur ABWEICHUNGEN — Stille heisst gespeichert (§3e). */
const workspaceSync = computed<'saving' | 'offline' | 'conflict' | 'error' | null>(
  () => (store.syncState === 'saved' ? null : store.syncState),
)
const workspaceSyncLabel = computed(() =>
  (store.syncState === 'saved' ? undefined : t(`brand.workspace.sync.${store.syncState}`)))

// ── Navigation ────────────────────────────────────────────────────────────

const previousStep = computed(() => store.neighbourStep(-1))
const nextStep = computed(() => store.neighbourStep(1))

async function goToStep(key: string | null): Promise<void> {
  if (!key) return
  // §3e „vor interner Navigation": der Baustein-Wechsel bleibt in derselben
  // Komponente, `onBeforeRouteLeave` feuert dafür NICHT.
  await autosave.flush()
  await navigateTo(localePath(`/brand/${profileId.value}/${key}`))
}

// ── Konfidenz-Weiche ──────────────────────────────────────────────────────

const confidenceOptions = computed(() => BRAND_CONFIDENCE_VALUES.map(value => ({
  id: value,
  label: t(`brand.workspace.confidence.${value}`),
  recommended: false,
})))

const completing = ref(false)

async function pickConfidence(value: string): Promise<void> {
  const confidence = value as BrandConfidence
  store.setConfidence(confidence)
  await autosave.flush()
  // Nur „Passt" schliesst ab — „Fast" und „Nochmal von vorn" sind
  // Vertiefungsrunden (§3b.8) und bleiben im Baustein.
  if (confidence !== 'fits') return

  completing.value = true
  try {
    await store.completeStep(profileId.value)
    await goToStep(store.neighbourStep(1))
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    toast.add({
      color: 'warning',
      title: t('brand.workspace.completeFailed'),
      description: reason === 'required_slots_missing'
        ? t('brand.workspace.missingRequired')
        : undefined,
    })
  }
  finally {
    completing.value = false
  }
}

// ── 409 ───────────────────────────────────────────────────────────────────

const conflictOpen = computed({
  get: () => store.conflict !== null,
  // Wegklicken löst den Konflikt NICHT auf — der Autosave bleibt angehalten,
  // bis eine der beiden Aktionen gewählt wurde.
  set: () => {},
})

interface ConflictRow { slotId: string, label: string, mine: string, server: string }

const conflictRows = computed<ConflictRow[]>(() => {
  const current = store.conflict
  if (!current) return []
  return Object.keys(store.localEdits).map((slotId) => {
    const slot = slots.value.find(entry => entry.id === slotId)
    return {
      slotId,
      label: slot ? slotLabel(slot) : slotId,
      mine: store.slotValue(slotId),
      server: brandSlotDisplayValue(current.slots[slotId]),
    }
  })
})

const copied = ref<'ok' | 'failed' | null>(null)

async function copyMine(): Promise<void> {
  const text = conflictRows.value.map(row => `${row.label}\n${row.mine}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = 'ok'
  }
  catch {
    copied.value = 'failed'
  }
}

function loadServerVersion(): void {
  copied.value = null
  store.resolveWithServer()
}

useBrandTitle(() => (store.profile?.title || t('brand.brands.card.untitled')))
</script>

<template>
  <!-- Kein Beta-Zugang oder gesperrter Baustein: eine Fläche, keine Fehlerseite. -->
  <div v-if="store.denied || store.blocked" class="bw-root grid min-h-dvh place-items-center px-6">
    <div class="max-w-md text-center">
      <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
      <p class="mt-4 font-medium">
        {{ store.denied ? t('brand.workspace.noAccess.title') : t('brand.workspace.stepLocked.title') }}
      </p>
      <p class="mt-1 text-sm" style="color: var(--bw-muted)">
        {{ store.denied ? t('brand.workspace.noAccess.description') : t('brand.workspace.stepLocked.description') }}
      </p>
      <UButton
        class="mt-5 rounded-full" variant="outline" :to="localePath('/dashboard/brands')"
        :label="t('brand.brands.title')"
      />
    </div>
  </div>

  <BwWorkspace
    v-else
    :progress-pct="store.progress.pct"
    :progress-note="progressNote"
    :content-locale="store.profile?.contentLocale ?? locale"
    :sync-state="workspaceSync"
    :sync-label="workspaceSyncLabel"
  >
    <template #brand>
      <span class="truncate font-semibold">{{ store.profile?.title || t('brand.brands.card.untitled') }}</span>
    </template>

    <template #rail>
      <BwProgressRail :layers="railLayers" />
    </template>

    <template #default>
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('brand.workspace.stage.title') }}</p>
      <h1 class="mt-1 text-4xl leading-tight">{{ stepKey ? t(`brand.steps.${stepKey}`) : '' }}</h1>

      <!-- Ein RUHIGER Hinweis, kein Toast-Gewitter: „KI ist aus" und „hier
           entwirft niemand" sind Zustände, in denen weitergearbeitet wird. -->
      <p v-if="generationNotice" class="bw-pending mt-3 flex items-center gap-2">
        <span>{{ generationNotice }}</span>
        <button type="button" class="underline" @click="generation.dismissFailure()">
          {{ t('brand.workspace.generate.dismiss') }}
        </button>
      </p>

      <BwChapter
        :title="stepKey ? t(`brand.steps.${stepKey}`) : ''"
        :state="store.currentJourneyStep?.state === 'done' ? 'confirmed' : store.currentJourneyStep?.state === 'active' ? 'active' : 'empty'"
      >
        <p v-if="!slots.length" class="bw-pending">{{ t('brand.workspace.stage.empty') }}</p>

        <div v-for="slot in slots" :key="slot.id" class="mb-6">
          <div class="flex items-start justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">
              {{ slotLabel(slot) }}
              <!-- §3b.3: Georges Entwurf ist bis zur Bestätigung als Entwurf
                   ERKENNBAR — Etikett UND gestrichelter Rahmen, nie nur Farbe. -->
              <span v-if="store.slotIsGeorgeDraft(slot.id)" class="bw-state bw-state--draft ml-2">
                {{ t('brand.workspace.draftBadge') }}
              </span>
            </p>
            <button
              v-if="slot.helpKey"
              type="button"
              class="bw-label flex-none underline"
              style="color: var(--bw-muted)"
              :aria-expanded="openHelp === slot.id"
              @click="openHelp = openHelp === slot.id ? null : slot.id"
            >
              {{ t('brand.workspace.help') }}
            </button>
          </div>
          <p
            v-if="slot.helpKey && openHelp === slot.id"
            class="mt-2 rounded-xl px-3 py-2.5 text-sm"
            style="background: var(--bw-surface); color: var(--bw-ink-soft)"
          >
            {{ t(slot.helpKey) }}
          </p>

          <!-- Der Paarvergleich ist ein eigenes Instrument (Katalog §12). -->
          <p v-if="slot.type === 'special'" class="bw-pending mt-2">{{ t('brand.workspace.stage.pairsPlaceholder') }}</p>

          <!-- Der gestrichelte Rahmen umfasst den EDITOR, nicht die Zeile:
               er sagt „dieser Text ist ein Entwurf", nicht „dieses Feld". -->
          <div :class="store.slotIsGeorgeDraft(slot.id) ? 'bw-draft-frame mt-2' : ''">
            <template v-if="slot.editor === 'none'">
              <p v-if="store.slotValue(slot.id)" class="mt-2 text-sm" style="color: var(--bw-ink-soft)">{{ store.slotValue(slot.id) }}</p>
              <p v-else class="bw-pending mt-2">{{ t('brand.workspace.stage.notEditable') }}</p>
            </template>

            <UTextarea
              v-else-if="slot.editor === 'textarea' || slot.editor === 'stage'"
              class="mt-2 w-full"
              :rows="slot.editor === 'stage' ? 6 : 3"
              :maxlength="slot.maxLength"
              :model-value="store.slotValue(slot.id)"
              :placeholder="t('brand.workspace.stage.pending')"
              @update:model-value="value => onInput(slot.id, String(value))"
              @blur="autosave.flush()"
            />

            <UInput
              v-else
              class="mt-2 w-full"
              :maxlength="slot.maxLength"
              :model-value="store.slotValue(slot.id)"
              :placeholder="t('brand.workspace.stage.pending')"
              @update:model-value="value => onInput(slot.id, String(value))"
              @blur="autosave.flush()"
            />
          </div>

          <!-- „George, versuch's nochmal" — mit optionalem Hinweis (§3b.3). -->
          <div v-if="isGeneratable(slot)" class="mt-2 flex flex-wrap items-center gap-2">
            <UInput
              class="min-w-40 flex-1"
              size="sm"
              maxlength="500"
              :model-value="hints[slot.id] ?? ''"
              :placeholder="t('brand.workspace.generate.hintPlaceholder')"
              :aria-label="t('brand.workspace.generate.hintLabel')"
              :disabled="generation.streaming.value"
              @update:model-value="value => hints = { ...hints, [slot.id]: String(value) }"
            />
            <UButton
              v-if="generation.isStreamingSlot(slot.id)"
              size="sm" variant="outline" color="neutral" class="rounded-full"
              icon="i-ph-stop"
              :label="t('brand.workspace.generate.stop')"
              @click="generation.stop()"
            />
            <UButton
              v-else
              size="sm" variant="ghost" color="neutral" class="rounded-full"
              icon="i-ph-sparkle"
              :loading="generation.streaming.value"
              :disabled="generation.streaming.value"
              :label="store.slotValue(slot.id) ? t('brand.workspace.generate.again') : t('brand.workspace.generate.start')"
              @click="generateSlot(slot)"
            />
            <UButton
              v-if="hasHistory(slot)"
              size="sm" variant="ghost" color="neutral" class="rounded-full"
              icon="i-ph-clock-counter-clockwise"
              :label="t('brand.workspace.versions.open')"
              @click="openVersions(slot)"
            />
          </div>

          <div v-if="slot.editor !== 'none' && slot.type !== 'special'" class="mt-2 flex justify-end">
            <UButton
              size="sm" variant="ghost" color="neutral"
              :icon="store.slotConfirmed(slot.id) ? 'i-ph-check-circle-fill' : 'i-ph-check'"
              :disabled="!store.slotValue(slot.id) || store.slotConfirmed(slot.id)"
              :label="t('brand.workspace.confirmSlot')"
              @click="confirmSlot(slot.id)"
            />
          </div>
        </div>
      </BwChapter>

      <div class="mt-6 flex items-center justify-between gap-3">
        <UButton
          variant="ghost" color="neutral" icon="i-ph-arrow-left" class="rounded-full"
          :disabled="!previousStep" :label="t('brand.workspace.back')"
          @click="goToStep(previousStep)"
        />
        <UButton
          variant="outline" color="neutral" trailing-icon="i-ph-arrow-right" class="rounded-full"
          :disabled="!nextStep" :label="t('brand.workspace.next')"
          @click="goToStep(nextStep)"
        />
      </div>
    </template>

    <template #george>
      <BwGeorge :messages="georgeMessages" @send="answerFromGeorge">
        <template #chips>
          <div v-if="nextSlot" class="flex flex-col items-stretch gap-2">
            <button class="bw-chip bw-chip--ghost" @click="skipQuestion">{{ t('brand.workspace.dontKnow') }}</button>
          </div>
          <div v-else class="flex flex-col items-stretch gap-2">
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.confidence.question') }}</p>
            <BwChips
              :options="confidenceOptions"
              :selected="store.confidence ? [store.confidence] : []"
              :show-dont-know="false"
              @pick="pickConfidence"
            />
            <p v-if="completing" class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.completeStep') }}</p>
          </div>
        </template>
      </BwGeorge>
    </template>
  </BwWorkspace>

  <!-- Frühere Fassungen: Auswahl schreibt in den EDITOR, gespeichert wird über
       den normalen Autosave (kein eigener Schreibweg — s. `useVersion`). -->
  <UModal v-model:open="versionsOpen">
    <template #content>
      <div class="bw-root max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
          {{ versionsSlot ? slotLabel(versionsSlot) : '' }}
        </p>
        <h2 class="mt-1 text-[24px] font-extralight leading-tight tracking-tight">{{ t('brand.workspace.versions.title') }}</h2>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.workspace.versions.description') }}</p>

        <p v-if="versionsLoading" class="bw-pending mt-5">{{ t('brand.workspace.versions.loading') }}</p>

        <template v-else>
          <div v-for="item in versions?.items ?? []" :key="item.generationId" class="mt-5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="bw-label" style="color: var(--bw-muted)">
                {{ new Date(item.createdAt).toLocaleString(locale) }} · {{ item.model }} · {{ item.promptVersion }}
              </p>
              <UButton
                size="xs" variant="outline" color="neutral" class="rounded-full"
                :disabled="!item.draft"
                :label="t('brand.workspace.versions.use')"
                @click="useVersion(item.draft ?? '')"
              />
            </div>
            <p v-if="item.draft" class="mt-1 whitespace-pre-wrap rounded-xl p-3 text-sm" style="background: var(--bw-surface)">{{ item.draft }}</p>
            <!-- Ein Eintrag ohne Text ist dem Spalten-Deckel gewichen; seine
                 Herkunft bleibt sichtbar, damit die Lücke erklärt ist. -->
            <p v-else class="bw-pending mt-1">{{ t('brand.workspace.versions.dropped') }}</p>
          </div>

          <div v-if="versions?.firstDraft" class="mt-6 border-t pt-4" style="border-color: var(--bw-line)">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.versions.first') }}</p>
              <UButton
                size="xs" variant="outline" color="neutral" class="rounded-full"
                :label="t('brand.workspace.versions.use')"
                @click="useVersion(versions.firstDraft ?? '')"
              />
            </div>
            <p class="mt-1 whitespace-pre-wrap rounded-xl p-3 text-sm" style="background: var(--bw-surface)">{{ versions.firstDraft }}</p>
          </div>

          <p v-if="!versions?.items.length && !versions?.firstDraft" class="bw-pending mt-5">
            {{ t('brand.workspace.versions.empty') }}
          </p>
        </template>

        <div class="mt-6 flex justify-end">
          <UButton
            variant="ghost" color="neutral" class="rounded-full"
            :label="t('brand.workspace.versions.close')" @click="versionsSlot = null"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- 409: BEIDE Fassungen, nichts wird automatisch überschrieben (§3e). -->
  <UModal v-model:open="conflictOpen">
    <template #content>
      <div class="bw-root max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-stale)">{{ t('brand.workspace.sync.conflict') }}</p>
        <h2 class="mt-1 text-[24px] font-extralight leading-tight tracking-tight">{{ t('brand.workspace.conflict.title') }}</h2>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.workspace.conflict.description') }}</p>

        <div v-for="row in conflictRows" :key="row.slotId" class="mt-5">
          <p class="bw-label" style="color: var(--bw-muted)">{{ row.label }}</p>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl p-3" style="background: var(--bw-surface)">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.conflict.mineLabel') }}</p>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ row.mine }}</p>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bw-surface)">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.conflict.serverLabel') }}</p>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ row.server }}</p>
            </div>
          </div>
        </div>

        <p v-if="copied" class="bw-label mt-4" style="color: var(--bw-muted)">
          {{ copied === 'ok' ? t('brand.workspace.conflict.copied') : t('brand.workspace.conflict.copyFailed') }}
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <UButton
            variant="outline" color="neutral" class="rounded-full"
            :label="t('brand.workspace.conflict.copyMine')" @click="copyMine"
          />
          <UButton class="rounded-full" :label="t('brand.workspace.conflict.loadServer')" @click="loadServerVersion" />
        </div>
      </div>
    </template>
  </UModal>
</template>
