<script setup lang="ts">
import type { BwSidebarBrand } from '../../../components/BwWorkspaceSidebar.vue'
import type { BwRailLayer, BwRailStep } from '../../../components/BwProgressRail.vue'
import { brandAiRejectionMessageKey } from '../../../../shared/brandAiLimits'
import type {
  BrandAcceptanceSessionView,
  BrandDocumentChapter,
  BrandDocumentResponse,
  BrandDocumentReviewResponse,
  BrandFindingDecisionResponse,
  BrandSessionAcceptResponse,
} from '../../../../shared/types/brand'
import { BRAND_ACCEPTANCE_VIEW } from '../../../../shared/brandWorkspaceNav'
import { slotById } from '../../../../shared/slotRegistry'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'
import { useBrandImpactConsent } from '../../../composables/useBrandImpactConsent'

/**
 * „EUER BRANDING" — DAS DOKUMENT (BW2 Paket 7,
 * docs/plans/BRAND-WIZARD-SESSIONS.md §10).
 *
 * ── ES IST DIE FINALE ABNAHME DER EBENE 1 ────────────────────────────────
 * Session → bestätigen, Kapitel → Finale Abnahme, Foundation → hier. Deshalb
 * sieht diese Seite aus wie die Kapitel-Abnahme und benutzt WÖRTLICH deren
 * Blöcke (`BwSessionBlock`) — nur über alle Kapitel, mit einem Abschnitt je
 * Kapitel und dem Prüfblick statt der Konfidenz-Frage.
 *
 * KEIN GEORGE, KEIN PROMPT (§10 „Kein George auf dieser Seite"): hier wird
 * gelesen, nicht gesprochen. Ein Eingabefeld, das an jemanden schickt, der gar
 * nicht da ist, wäre ein Versprechen ohne Empfänger.
 *
 * ── WARUM EIN EIGENER ROUTE-RECORD ───────────────────────────────────────
 * Die Kapitel-Abnahme ist eine ANSICHT der Werkstatt (`?s=acceptance`), weil
 * sie zu EINEM Kapitel gehört. Das Dokument gehört keinem: es als dritte
 * Ansicht unter `brand/[profileId]/[stepKey]` zu legen hiesse, einen
 * Kapitel-Schlüssel in die Adresse zu schreiben, der dort nichts bedeutet —
 * und die Leiste müsste sich für einen aussuchen.
 *
 * ── DIE RECHTE SPALTE ZEIGT DEN STAND, NICHT DEN LOG ─────────────────────
 * Die Abnahme-Seite hat ihren Log behalten, weil er dort etwas ANDERES zeigt
 * als die Mitte (das ganze Branding neben einem Kapitel). Hier IST die Mitte
 * das ganze Branding — ein Log daneben wäre dasselbe zweimal. Also steht dort,
 * was die Mitte nicht sagt: wie weit die Abnahme ist, je Kapitel und im Ganzen.
 *
 * ── DER PRÜFBLICK LÄUFT NUR AUF KLICK (§16) ──────────────────────────────
 * Kein `watch`, kein `onMounted`, kein Nachladen. Er wiegt 5 im Tages-Eimer,
 * und diese Seite wird beim Durchblättern eines fertigen Brandings oft
 * geöffnet. Der Server hat zusätzlich seinen eigenen Riegel je Dokument-Stand.
 */
definePageMeta({ layout: 'brand-workspace' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

const profileId = computed(() => String(route.params.profileId ?? ''))

/**
 * SSR-FÄHIG, wie die Werkstatt: `useAsyncData` mit dem request-gebundenen
 * `fetch` — sonst antwortet die Datentür beim Serverlauf mit der Gast-Sicht
 * (404) und die Seite hydratisiert als „kein Zugang".
 *
 * `doc` und nicht `document`: der Name gehört im Browser dem DOM, und ein
 * Setup-Binding, das ihn überdeckt, ist eine Falle für die nächste Zeile, die
 * ihn wirklich braucht.
 */
const doc = await useAsyncData<BrandDocumentResponse | null>(
  () => `brand-document-${profileId.value}`,
  () => request<BrandDocumentResponse>(`/api/brand/profiles/${profileId.value}/document`),
  { watch: [profileId], default: () => null },
)

/**
 * Das PROFIL für die Leiste (Journey, Marken-Wähler, Kapitel-Beschriftungen).
 *
 * ── EIN FREMDES BRANDING IST EIN 404, KEINE HALBE WERKSTATT (Paket 8) ────
 * Bis hierher stand der Abruf FAIL-SOFT („eine Leiste ohne Kapitel ist besser
 * als eine leere Seite"), und der Rückgabewert wurde weggeworfen. Für einen
 * fremden oder erfundenen Schlüssel hiess das: die Datentür antwortet 404,
 * `loadProfile` setzt `denied` — und der Listen-Abruf gleich darauf setzt es
 * bei einem eingeloggten Menschen SOFORT WIEDER auf `false` (er hat ja eigene
 * Brandings). Übrig blieb die Hülle: „Namenloses Branding" in der Leiste,
 * „Das Dokument konnte nicht geladen werden" in der Mitte, HTTP 200. Ein
 * Soft-404, der wie ein Produktfehler aussieht — dieselbe Falle wie beim
 * ungültigen Baustein-Schlüssel in der Werkstatt (Davids 404-Audit).
 *
 * Das Dokument gehört EINEM Branding. Ist das nicht erreichbar, bedeutet die
 * Adresse nichts, und die ehrliche Antwort ist die Fehlerseite mit 404 — auch
 * für „kein Beta-Zugang": die Datentür sagt bewusst beides mit derselben
 * Antwort (sie verrät nicht, ob es die Zeile gibt), also kann diese Seite die
 * zwei Fälle gar nicht auseinanderhalten. Die WERKSTATT behält ihre ruhige
 * Fläche: sie ist der Einstieg, den man ohne Zugang tatsächlich anläuft, und
 * sie kennt mit `blocked` (403) einen zweiten, erklärbaren Zustand.
 *
 * FAIL-SOFT BLEIBT für alles andere: nur ein AUSDRÜCKLICHES „nicht gefunden"
 * wirft. Ein Transportfehler lässt `data` leer, die Seite steht, und die Mitte
 * sagt es über `brand.document.loadFailed` — aus einem 500 einen 404 zu machen
 * wäre eine Lüge über die Ursache.
 */
const shell = await useAsyncData<{ found: boolean } | null>(
  () => `brand-document-shell-${profileId.value}`,
  async () => {
    const found = await store.loadProfile(profileId.value, request)
    await store.loadProfiles(request).catch(() => {})
    return { found }
  },
  { watch: [profileId], default: () => null },
)

if (shell.data.value && !shell.data.value.found) {
  throw createError({ status: 404, statusText: 'Unknown brand profile' })
}

const view = computed(() => doc.data.value)
const chapters = computed<BrandDocumentChapter[]>(() => view.value?.chapters ?? [])

/** „x von y abgenommen" je Kapitel — dieselbe Zeile wie auf der Abnahme-Seite. */
function counterLine(chapter: BrandDocumentChapter): string {
  return t('brand.acceptance.counter', {
    accepted: chapter.acceptance.accepted,
    total: chapter.acceptance.total,
  })
}

/** Der Zustand eines Kapitels in einem Wort — dieselben Schlüssel wie überall. */
function chapterState(chapter: BrandDocumentChapter): string {
  return t(`brand.document.state.${chapter.storedState === 'done' ? 'done' : chapter.state}`)
}

const overall = computed(() => {
  let accepted = 0
  let total = 0
  for (const chapter of chapters.value) {
    accepted += chapter.acceptance.accepted
    total += chapter.acceptance.total
  }
  return { accepted, total, pct: total === 0 ? 0 : Math.round((accepted / total) * 100) }
})

// ── Korrigieren: der Impact-Hinweis, dann der Sprung (§9) ─────────────────

const {
  open: impactOpen,
  impact: impactData,
  loading: impactLoading,
  changed: impactChanged,
  request: requestImpactConsent,
  accept: acceptImpact,
  cancel: cancelImpact,
} = useBrandImpactConsent(profileId)

/**
 * BEARBEITEN = SPRUNG IN DIE SESSION, mit dem Hinweis davor (§9).
 *
 * Korrigiert wird hier NICHT: das Dokument führt keine `revision` einer
 * Kapitel-Zeile mit sich, und ein PATCH von hier liefe der Werkstatt in einen
 * Konflikt. Die Zustimmung bleibt gemerkt (`useBrandImpactConsent`), also
 * fragt „Korrigieren" drüben nicht ein zweites Mal.
 */
async function goToField(slotId: string): Promise<void> {
  const target = slotById(slotId)?.stepId
  if (!target) return
  // Ein gesperrtes Kapitel wird nicht betreten (wie `goToField` der Werkstatt):
  // ein Sprung in ein 403 wäre die schlechtere Antwort als gar keiner.
  if (!store.canEnter(target)) return
  await navigateTo({ path: localePath(`/brand/${profileId.value}/${target}`), query: { s: slotId } })
}

async function correctThenGo(session: BrandAcceptanceSessionView): Promise<void> {
  if (session.confirmed && !await requestImpactConsent(session.slotId)) return
  await goToField(session.slotId)
}

/** „Zur Abnahme" — die Kapitel-Ansicht, aus der die Blöcke stammen (§5a). */
async function goToAcceptance(chapter: BrandDocumentChapter): Promise<void> {
  if (!store.canEnter(chapter.stepKey)) return
  await navigateTo({
    path: localePath(`/brand/${profileId.value}/${chapter.stepKey}`),
    query: { s: BRAND_ACCEPTANCE_VIEW },
  })
}

// ── „Gilt weiter" auf einer veralteten Zeile (§9) ─────────────────────────

/**
 * Der Stempel läuft über die KAPITEL-Route, also braucht er die `revision`
 * genau dieses Kapitels — sie steht in der Antwort und wird danach mit dem
 * ganzen Dokument neu gelesen: an einer gefallenen Sperre hängen Zähler und
 * Abnahme-Zustand, und beide rechnet der Server.
 */
const keeping = ref<string | null>(null)

async function keep(chapter: BrandDocumentChapter, session: BrandAcceptanceSessionView): Promise<void> {
  if (keeping.value) return
  keeping.value = session.slotId
  try {
    await $fetch<BrandSessionAcceptResponse>(
      `/api/brand/profiles/${profileId.value}/steps/${chapter.stepKey}/sessions/${session.slotId}/restamp`,
      { method: 'POST', body: { revision: chapter.revision } },
    )
    await doc.refresh()
  }
  catch {
    toast.add({ color: 'warning', title: t('brand.session.keepFailed') })
    await doc.refresh()
  }
  finally {
    keeping.value = null
  }
}

/** Ein Befund wurde entschieden (§8) — die SEITE wird neu gelesen. */
async function findingDecided(_decision: BrandFindingDecisionResponse): Promise<void> {
  await doc.refresh()
}

// ── Der Prüfblick (§10) ───────────────────────────────────────────────────

const reviewing = ref(false)
const reviewResult = ref<BrandDocumentReviewResponse | null>(null)
const reviewNotice = ref('')

/**
 * ER BRAUCHT MINDESTENS EIN ABGENOMMENES KAPITEL.
 *
 * Ein Blick über ein Dokument, in dem noch nichts steht, kostet 5 im Eimer und
 * findet nichts — er würde nur beweisen, dass der Knopf funktioniert. Gefragt
 * ist der GESPEICHERTE Zustand: ein Kapitel ist `done`, wenn es die Finale
 * Abnahme durchlaufen hat (§5a).
 */
const hasDoneChapter = computed(() => chapters.value.some(chapter => chapter.storedState === 'done'))

/** Neue Befunde dieses Laufs — die Chips darunter, sonst nichts. */
const reviewFindings = computed(() => reviewResult.value?.findings ?? [])

async function runReview(): Promise<void> {
  if (reviewing.value || !hasDoneChapter.value) return
  reviewing.value = true
  reviewNotice.value = ''
  try {
    const response = await $fetch<BrandDocumentReviewResponse>(
      `/api/brand/profiles/${profileId.value}/review`,
      { method: 'POST' },
    )
    reviewResult.value = response
    // Ein Lauf ohne Urteil und ohne Nachholung ist fail-soft ausgefallen (§7) —
    // ein RUHIGER Hinweis, keine Fehlermeldung: der Mensch verliert nichts.
    if (response.ran && !response.reviewedBy && response.caughtUp.length === 0) {
      reviewNotice.value = t('brand.document.reviewFailed')
    }
    // Nachgeholte Urteile stehen an ihren Zeilen — die Seite liest sich neu.
    if (response.caughtUp.length || response.findings.length) await doc.refresh()
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    // Der Eimer-Deckel bekommt SEINEN Satz (Muster `generate.reviewLimit`);
    // alles andere den allgemeinen.
    reviewNotice.value = t(brandAiRejectionMessageKey(reason) ?? 'brand.document.reviewFailed')
  }
  finally {
    reviewing.value = false
  }
}

// ── Die Leiste (§11) ──────────────────────────────────────────────────────

const openFindingsTotal = computed(
  () => (view.value?.findings ?? []).filter(finding => finding.status === 'open').length,
)

/**
 * DIESELBE LEISTE WIE IN DER WERKSTATT, aber ohne die Unterpunkte: hier ist
 * kein Kapitel offen, also gibt es auch keines aufzuklappen (§11 „nur das
 * aktive Kapitel aufgeklappt"). Der letzte Eintrag ist DIESE Seite — er trägt
 * kein `to`, sondern steht auf `active`.
 */
const railLayers = computed<BwRailLayer[]>(() => [{
  id: 'foundation',
  label: t('brand.workspace.railLayer'),
  steps: [
    ...store.railSteps.map((entry): BwRailStep => ({
      id: entry.stepKey,
      label: t(`brand.steps.${entry.stepKey}`),
      icon: '',
      state: entry.state === 'done'
        ? 'done'
        : entry.state === 'active' ? 'active' : entry.state === 'locked' ? 'locked' : 'open',
      counter: t('brand.nav.chapterCount', {
        confirmed: entry.progress.requiredTotal - entry.missingRequired.length,
        total: entry.progress.requiredTotal,
      }),
    })),
    {
      id: 'document',
      label: t('brand.nav.document'),
      icon: '',
      state: 'active',
      kind: 'document',
      ...(openFindingsTotal.value > 0
        ? {
            counter: t(
              'brand.finding.openCount',
              { count: openFindingsTotal.value },
              openFindingsTotal.value,
            ),
          }
        : {}),
    },
  ],
}])

const LOCALE_FLAGS: Record<string, string> = { en: 'i-circle-flags-us', de: 'i-circle-flags-de' }

const sidebarBrands = computed<BwSidebarBrand[]>(() => store.profiles.map(profile => ({
  id: profile.id,
  title: profile.title || t('brand.brands.card.untitled'),
  path: t(`brand.brands.card.path.${profile.pathKind}`),
  flag: LOCALE_FLAGS[profile.contentLocale],
  to: localePath(`/brand/${profile.id}/${profile.currentStepKey}`),
  current: profile.id === profileId.value,
})))

/* Dieselben zwei Zustände wie in der Werkstatt (Audit A7): ab 768 px klappt der
 * Knopf die SPALTE ein, darunter öffnet er sie als Overlay. */
const railCollapsed = ref(false)
const logCollapsed = ref(false)
const navOverlayOpen = ref(false)
const isNarrow = ref(false)
let narrowMq: MediaQueryList | null = null
const onNarrow = (event: MediaQueryListEvent | MediaQueryList): void => {
  isNarrow.value = event.matches
  if (!event.matches) navOverlayOpen.value = false
}
onMounted(() => {
  narrowMq = window.matchMedia('(max-width: 767px)')
  onNarrow(narrowMq)
  narrowMq.addEventListener('change', onNarrow)
})
onBeforeUnmount(() => narrowMq?.removeEventListener('change', onNarrow))

const navVisible = computed(() => (isNarrow.value ? navOverlayOpen.value : !railCollapsed.value))

function toggleNav(): void {
  if (isNarrow.value) navOverlayOpen.value = !navOverlayOpen.value
  else railCollapsed.value = !railCollapsed.value
}

async function goToStep(key: string | null): Promise<void> {
  navOverlayOpen.value = false
  if (!key || !store.canEnter(key)) return
  await navigateTo(localePath(`/brand/${profileId.value}/${key}`))
}

useBrandTitle(() => (store.profile?.title || view.value?.title || t('brand.document.title')))
</script>

<template>
  <!-- KEINE „kein Zugang"-Fläche mehr (Paket 8): sie hing an `store.denied`,
       und dieser Zustand ist hier seit dem 404 oben unerreichbar — kein
       Zugang UND unbekannt beantwortet die Datentür gleich, und beide
       enden jetzt auf der Fehlerseite. Ein Zweig, der nie zieht, ist kein
       Sicherheitsnetz, sondern eine Behauptung. -->
  <BwWorkspace
    v-model:rail-overlay="navOverlayOpen"
    :progress-pct="overall.pct"
    :content-locale="store.profile?.contentLocale ?? locale"
    :locale-in-topbar="false"
    :topbar="false"
    :rail-footer="false"
    rail-width="300px"
    :rail-collapsed="railCollapsed"
    :george-collapsed="logCollapsed"
    initial-mode="stage"
    style="--bw-rail-pad-x: 1rem; --bw-rail-pad-y: 0.75rem"
  >
    <template #rail>
      <BwWorkspaceSidebar
        :layers="railLayers"
        :brands="sidebarBrands"
        :manage-to="localePath('/dashboard/brands')"
        @select="goToStep"
        @select-brand="to => navigateTo(to)"
      />
    </template>

    <template #stage-bar>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <UButton
          size="sm" color="neutral" variant="ghost"
          icon="i-ph-sidebar-simple"
          :aria-label="navVisible ? t('brand.workspace.bar.hideNav') : t('brand.workspace.bar.showNav')"
          :aria-expanded="navVisible"
          @click="toggleNav"
        />
        <div class="min-w-0 leading-tight">
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">{{ t('brand.workspace.railLayer') }}</p>
          <p class="truncate font-semibold">{{ t('brand.document.title') }}</p>
        </div>
        <UButton
          size="sm" color="neutral" variant="ghost" class="ml-auto max-md:hidden"
          icon="i-ph-sidebar-simple" :ui="{ leadingIcon: '-scale-x-100' }"
          :aria-label="logCollapsed ? t('brand.workspace.bar.showLog') : t('brand.workspace.bar.hideLog')"
          @click="logCollapsed = !logCollapsed"
        />
      </div>
    </template>

    <!-- MITTE: das Dokument. Je Kapitel ein Abschnitt, darin die Blöcke —
         dieselben wie auf der Finalen Abnahme, nur ohne Beispiel und ohne
         Häkchen: abgenommen wird im Kapitel (§5a), gelesen wird hier. -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-8 pb-4">
        <div>
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
            {{ t('brand.workspace.railLayer') }}
          </p>
          <h1 class="mt-1 text-[26px] font-extralight leading-tight tracking-tight">
            {{ t('brand.document.title') }}
          </h1>
          <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
            {{ t('brand.document.lead') }}
          </p>
        </div>

        <p v-if="doc.error.value" class="bw-pending">{{ t('brand.document.loadFailed') }}</p>
        <p v-else-if="!chapters.length" class="bw-pending">{{ t('brand.document.empty') }}</p>

        <section v-for="chapter in chapters" :key="chapter.stepKey" class="flex flex-col gap-3">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 class="text-[20px] font-extralight leading-tight tracking-tight">
              {{ t(`brand.steps.${chapter.stepKey}`) }}
            </h2>
            <button
              type="button" class="bw-label flex-none underline" style="color: var(--bw-muted)"
              @click="goToAcceptance(chapter)"
            >{{ t('brand.document.chapter.toAcceptance') }}</button>
          </div>
          <p class="bw-label tabular-nums" style="color: var(--bw-muted)">
            {{ chapterState(chapter) }} · {{ counterLine(chapter) }}
          </p>

          <BwSessionBlock
            v-for="session in chapter.sessions" :key="session.slotId"
            :session="session" :profile-id="profileId"
            :show-example="false"
            :show-accept="false"
            :keeping="keeping === session.slotId"
            :busy="keeping !== null"
            @keep="keep(chapter, session)"
            @edit="correctThenGo(session)"
            @field="goToField"
            @decided="findingDecided"
            @stale="doc.refresh()"
          />
        </section>

        <!-- DER PRÜFBLICK (§10) — auf Klick, nie von selbst (§16). -->
        <div v-if="chapters.length" class="rounded-2xl px-4 py-4" style="background: var(--bw-surface)">
          <p class="text-sm font-medium">{{ t('brand.document.reviewTitle') }}</p>
          <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
            {{ t('brand.document.reviewLead') }}
          </p>
          <p v-if="!hasDoneChapter" class="bw-label mt-2" style="color: var(--bw-muted)">
            {{ t('brand.document.reviewNeedsChapter') }}
          </p>
          <p v-else-if="view?.review.unreviewed.length" class="bw-label mt-2" style="color: var(--bw-muted)">
            {{ t('brand.document.unreviewedCount', { count: view.review.unreviewed.length }, view.review.unreviewed.length) }}
          </p>

          <UButton
            class="mt-3 rounded-full" color="neutral" icon="i-ph-magnifying-glass"
            :disabled="!hasDoneChapter" :loading="reviewing"
            :label="reviewing ? t('brand.document.reviewing') : t('brand.document.review')"
            @click="runReview"
          />

          <p v-if="reviewNotice" class="bw-label mt-3" style="color: var(--bw-muted)">{{ reviewNotice }}</p>

          <template v-if="reviewResult">
            <p class="mt-3 text-sm" style="color: var(--bw-ink-soft)">
              {{ t('brand.document.reviewResult', {
                caughtUp: reviewResult.caughtUp.length,
                findings: reviewFindings.length,
              }) }}
            </p>
            <p v-if="reviewResult.stillUnreviewed.length" class="bw-label mt-1" style="color: var(--bw-muted)">
              {{ t('brand.document.stillUnreviewed', { count: reviewResult.stillUnreviewed.length }, reviewResult.stillUnreviewed.length) }}
            </p>
            <p v-if="!reviewFindings.length" class="bw-label mt-1" style="color: var(--bw-muted)">
              {{ t('brand.document.noFindings') }}
            </p>
            <div v-else class="mt-3 flex flex-col gap-2">
              <BwFindingChip
                v-for="finding in reviewFindings" :key="finding.id"
                :finding="finding" :profile-id="profileId"
                @field="goToField"
                @decided="findingDecided"
                @stale="doc.refresh()"
              />
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- RECHTS: der STAND. Nicht der Log — der zeigte hier dasselbe wie die
         Mitte (s. Kopf). Je Kapitel eine Zeile mit seinem Abnahme-Zähler,
         unten der Gesamtstand. -->
    <template #george>
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
            {{ t('brand.document.standTitle') }}
          </p>
          <ul class="mt-3 flex flex-col gap-2">
            <li v-for="chapter in chapters" :key="chapter.stepKey">
              <button
                type="button"
                class="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left"
                @click="goToAcceptance(chapter)"
              >
                <UIcon
                  :name="chapter.storedState === 'done' ? 'i-ph-check-circle-fill' : 'i-ph-circle'"
                  class="mt-0.5 size-4 flex-none"
                  :style="chapter.storedState === 'done' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'"
                />
                <span class="min-w-0 flex-1 leading-tight">
                  <span class="block text-sm">{{ t(`brand.steps.${chapter.stepKey}`) }}</span>
                  <span class="bw-label block tabular-nums" style="color: var(--bw-muted)">
                    {{ counterLine(chapter) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div class="flex-none border-t px-6 pb-5" style="border-color: var(--bw-line)">
          <BwRailFooter
            :progress-pct="overall.pct"
            :progress-title="t('brand.document.standProgress')"
            :progress-count="`${overall.accepted}/${overall.total}`"
          />
        </div>
      </div>
    </template>
  </BwWorkspace>

  <!-- Der Impact-Hinweis vor jeder Korrektur (§9). NIE per `v-if` unmounten. -->
  <BwImpactLayer
    v-model:open="impactOpen"
    :impact="impactData"
    :loading="impactLoading"
    :changed="impactChanged"
    @accept="acceptImpact"
    @cancel="cancelImpact"
  />
</template>
