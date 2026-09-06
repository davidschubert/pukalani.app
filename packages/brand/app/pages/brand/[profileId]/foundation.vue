<script setup lang="ts">
import type { BwSidebarBrand } from '../../../components/BwWorkspaceSidebar.vue'
import type { BwRailLayer, BwRailStep } from '../../../components/BwProgressRail.vue'
import type { BwTocLink } from '../../../components/BwReadingToc.vue'
import { brandChoiceDisplayLabel } from '../../../../shared/brandChoiceOptions'
import {
  type BrandFoundationBlock,
  type BrandFoundationChapter,
  type BrandFoundationChapterId,
  brandFoundationPendingStep,
} from '../../../../shared/brandFoundation'
import { BRAND_ACCEPTANCE_VIEW } from '../../../../shared/brandWorkspaceNav'
import type { BrandFoundationResponse } from '../../../../shared/types/brand'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'
import { BRAND_FOUNDATION_RAIL_STEP, useBrandFoundationRailStep } from '../../../composables/useBrandFoundationRailStep'

/**
 * „BRAND FOUNDATION" — DIE PRIVATE LESEANSICHT (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.6, Paket G2; Form abgenommen
 * am Klickdummy `/brand/demo/foundation`).
 *
 * ── EIN DOKUMENT, ZWEI ANSICHTEN ─────────────────────────────────────────
 * „Euer Branding" (`document.vue`) bleibt die ARBEITSansicht: abnehmen,
 * prüfen, korrigieren. Diese Seite liest dieselben bestätigten Werte als
 * GUIDELINES — Kapitel wie ein Markenhandbuch, Do & Don't aus vorhandenen
 * Feldern, die visuellen Kapitel als sichtbare Schranke. Beide fahren
 * denselben Datenstand; was ein Kapitel HIER zeigt, entscheidet allein
 * `buildBrandFoundation` (§2.1).
 *
 * ── KEINE KNÖPFE IM TEXT (§2.6) ──────────────────────────────────────────
 * Kein Bearbeiten, kein Abnehmen, kein Prüfblick. Der EINZIGE Sprung ist der
 * Vermerk „noch nicht abgenommen" → in die Werkstatt, wo abgenommen wird. Ein
 * Handbuch mit Arbeits-Knöpfen wäre wieder das Dokument, nur schöner gesetzt.
 *
 * ── DER EINE ZÄHLER ──────────────────────────────────────────────────────
 * „x von y Kapiteln abgenommen" steht EINMAL, oben, und nur privat. Er zählt
 * die Kapitel der WERKSTATT (dort wird abgenommen), nicht die des Handbuchs —
 * s. `BrandFoundationResponse`.
 *
 * ── DER DRUCK IST DER EXPORT (§2.6 e) ────────────────────────────────────
 * Kein Server-PDF: `window.print()` auf einer Seite mit `@media print`. Das
 * Export-Menü zeigt trotzdem ALLE Ausgabeformen der Suite, frei und gesperrt
 * nebeneinander — dieselbe Ehrlichkeit wie Kapitel 10. Der TEILEN-Knopf fehlt
 * hier bewusst: er kommt mit Paket G3 samt Empfänger-Ansicht.
 */
definePageMeta({ layout: 'brand-workspace' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

const profileId = computed(() => String(route.params.profileId ?? ''))

/**
 * SSR-FÄHIG, wie Werkstatt und Dokument: `useAsyncData` mit dem
 * request-gebundenen `fetch` — sonst antwortet die Datentür beim Serverlauf
 * mit der Gast-Sicht (404) und die Seite hydratisiert als „kein Zugang".
 */
const doc = await useAsyncData<BrandFoundationResponse | null>(
  () => `brand-foundation-${profileId.value}`,
  () => request<BrandFoundationResponse>(`/api/brand/profiles/${profileId.value}/foundation`),
  { watch: [profileId], default: () => null },
)

/**
 * Das PROFIL für die Leiste (Journey, Marken-Wähler). EIN FREMDES BRANDING IST
 * EIN 404 — dieselbe Regel und dieselbe Begründung wie im Kopf von
 * `document.vue` (Paket 8/9, Davids 404-Audit): die Adresse bedeutet nichts,
 * also ist die Fehlerseite die ehrliche Antwort. Alles andere bleibt
 * FAIL-SOFT: ein Transportfehler lässt die Mitte ihren Hinweis zeigen.
 */
const shell = await useAsyncData<{ found: boolean } | null>(
  () => `brand-foundation-shell-${profileId.value}`,
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
const title = computed(() => store.profile?.title || view.value?.title || '')
const contentLocale = computed(() => (view.value?.contentLocale ?? store.profile?.contentLocale ?? locale.value))

/** Welche Werkstatt-Kapitel stehen? Grundlage jedes „noch nicht abgenommen". */
const stepStates = computed(() => (view.value?.chapters ?? []).map(chapter => ({
  stepKey: chapter.stepKey,
  accepted: chapter.storedState === 'done',
})))

/**
 * DIE KAPITEL, WIE SIE AUF DER SEITE STEHEN.
 *
 * Der Renderer kennt die Abnahme nicht (Kopf von `shared/brandFoundation.ts`)
 * — sie ist eine Frage der PRIVATEN Ansicht. Also setzt die Seite `pending`,
 * und zwar über die gepflegte Zuordnung Handbuch-Kapitel → Werkstatt-Kapitel:
 * ein Kapitel, dessen Quelle noch offen ist, trägt den Vermerk und den Sprung
 * dorthin. Die Schranke (`locked`) bleibt unangetastet — dort gibt es nichts
 * abzunehmen.
 */
interface FoundationChapterView {
  chapter: BrandFoundationChapter
  acceptanceTo: string | null
}

const chapters = computed<FoundationChapterView[]>(() => (view.value?.view.chapters ?? []).map((chapter) => {
  if (chapter.state === 'locked') return { chapter, acceptanceTo: null }
  const pending = brandFoundationPendingStep(chapter.id, stepStates.value)
  if (!pending) return { chapter, acceptanceTo: null }
  return {
    chapter: { ...chapter, state: 'pending' },
    // Die Abnahme-ANSICHT desselben Route-Records (`?s=acceptance`) — nie eine
    // Session: hier ist keine offen, und ein Sprung in eine fremde wäre eine
    // Frage, nach der niemand gefragt hat.
    acceptanceTo: `${localePath(`/brand/${profileId.value}/${pending}`)}?s=${BRAND_ACCEPTANCE_VIEW}`,
  }
}))

const accepted = computed(() => view.value?.accepted ?? { chapters: 0, total: 0 })
const acceptedPct = computed(() => (accepted.value.total === 0
  ? 0
  : Math.round((accepted.value.chapters / accepted.value.total) * 100)))

const tocLinks = computed<BwTocLink[]>(() => chapters.value.map((entry, index) => ({
  id: entry.chapter.anchor,
  text: t(entry.chapter.titleKey),
  state: entry.chapter.state,
  counter: String(index).padStart(2, '0'),
})))

// ── „Auf einer Seite" (§1.5, HubSpot-Muster) ──────────────────────────────

/**
 * DER SCHNELLZUGRIFF ÜBER KAPITEL 0 — kein eigenes Kapitel, keine zweite
 * Quelle: er greift GENAU die Blöcke ab, die weiter unten ohnehin stehen.
 * Fehlt eine Quelle, fehlt die Zelle — eine leere Überschrift „Tagline" wäre
 * eine Behauptung, die Marke hätte eine.
 */
function blocksOf(id: BrandFoundationChapterId): readonly BrandFoundationBlock[] {
  return chapters.value.find(entry => entry.chapter.id === id)?.chapter.blocks ?? []
}

function firstLead(id: BrandFoundationChapterId): string {
  for (const block of blocksOf(id)) if (block.kind === 'lead') return block.text
  return ''
}

const onePage = computed(() => {
  const values = blocksOf('werte').find(block => block.kind === 'cards')
  const archetype = blocksOf('stimme').find(block => block.kind === 'choice')
  const taglineList = blocksOf('messaging').find(block => block.kind === 'list')
  return {
    purpose: firstLead('purpose'),
    values: values?.kind === 'cards' ? values.items : [],
    archetype: archetype?.kind === 'choice'
      ? archetype.optionIds.map(id => brandChoiceDisplayLabel(archetype.slotId, id, locale.value)).join(' · ')
      : '',
    // Eine einzelne Tagline steht als Leitsatz, mehrere als Liste (s. Renderer).
    tagline: firstLead('messaging') || (taglineList?.kind === 'list' ? taglineList.items[0] ?? '' : ''),
    wallLine: firstLead('manifest'),
  }
})

const hasOnePage = computed(() => Boolean(
  onePage.value.purpose || onePage.value.values.length || onePage.value.archetype
  || onePage.value.tagline || onePage.value.wallLine,
))

// ── Exportieren (§2.6) ────────────────────────────────────────────────────

function print(): void {
  if (import.meta.client) window.print()
}

/**
 * DAS EXPORT-MENÜ ZEIGT ALLE AUSGABEFORMEN DER SUITE — frei und gesperrt
 * nebeneinander, dieselbe Ehrlichkeit wie die visuelle Schranke. Ein Menü, das
 * nur „Drucken" kennt, verschweigt, was es noch gibt; ein Menü ohne Schloss
 * verspricht, was es nicht liefert. Die drei gesperrten Formen gehören
 * Produkt 03 („Brand Book & Kit") und tragen dessen Namen als Untertitel.
 */
interface FdExportItem {
  label: string
  icon?: string
  sub?: string
  locked?: boolean
  disabled?: boolean
  onSelect?: () => void
}

const exportItems = computed<FdExportItem[][]>(() => {
  const kit = t('brand.foundation.export.kit')
  return [
    [{
      label: t('brand.foundation.export.print'),
      icon: 'i-ph-printer',
      sub: t('brand.foundation.export.printSub'),
      onSelect: print,
    }],
    [
      {
        label: t('brand.foundation.export.context'),
        icon: 'i-ph-brackets-curly',
        sub: `${t('brand.foundation.export.contextSub')} · ${kit}`,
        locked: true,
        disabled: true,
      },
      {
        label: t('brand.foundation.export.tokens'),
        icon: 'i-ph-palette',
        sub: `${t('brand.foundation.export.tokensSub')} · ${kit}`,
        locked: true,
        disabled: true,
      },
      {
        label: t('brand.foundation.export.assets'),
        icon: 'i-ph-file-zip',
        sub: `${t('brand.foundation.export.assetsSub')} · ${kit}`,
        locked: true,
        disabled: true,
      },
    ],
  ]
})

// ── Die Leiste (§11) ──────────────────────────────────────────────────────

/**
 * DIESELBE LEISTE WIE IN WERKSTATT UND DOKUMENT. Der letzte Eintrag ist DIESE
 * Seite (s. `useBrandFoundationRailStep`), „Euer Branding" steht davor und
 * trägt sein Ziel.
 */
const navExtras = useBrandWorkspaceNavExtras({
  // Befunde kennt diese Seite nicht: die Leseansicht zeigt keine (§2.3), also
  // lädt sie auch keine. Ohne sie fehlt an einem Zusatz-Eintrag nur der
  // Zähler — ein fehlender Zähler behauptet nichts, ein erfundener schon.
  profileId,
  findings: () => store.findings,
})

const foundationStep = useBrandFoundationRailStep({ profileId, active: true })

const railLayers = computed<BwRailLayer[]>(() => [{
  id: 'foundation',
  label: t('brand.workspace.railLayer'),
  steps: [
    // Dokument, dann Foundation (§2.6) — der Ergebnis-Punkt steht deshalb
    // nicht mehr an seiner Registry-Stelle.
    ...store.railSteps
      .filter(entry => entry.stepKey !== BRAND_FOUNDATION_RAIL_STEP)
      .map((entry): BwRailStep => ({
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
      state: 'open',
      kind: 'document',
      to: localePath(`/brand/${profileId.value}/document`),
    },
    foundationStep.value,
    // Zusatz-Einträge fremder Layer (MV1 M4) — heute „Markt".
    ...navExtras.value,
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

/* Dieselben zwei Zustände wie in Werkstatt und Dokument (Audit A7): ab 768 px
 * klappt der Knopf die SPALTE ein, darunter öffnet er sie als Overlay. */
const railCollapsed = ref(false)
const tocCollapsed = ref(false)
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

useBrandTitle(() => (title.value || t('brand.foundation.title')))
</script>

<template>
  <BwWorkspace
    v-model:rail-overlay="navOverlayOpen"
    class="fd-page"
    :progress-pct="acceptedPct"
    :content-locale="contentLocale"
    :locale-in-topbar="false"
    :topbar="false"
    :rail-footer="false"
    rail-width="300px"
    :rail-collapsed="railCollapsed"
    :george-collapsed="tocCollapsed"
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
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
            {{ t('brand.foundation.title') }}
          </p>
          <p class="truncate font-semibold">{{ title }}</p>
        </div>

        <!-- KEIN „Bearbeiten" (§2.6): korrigiert wird in der Werkstatt.
             KEIN „Teilen": die Empfänger-Ansicht kommt mit Paket G3. -->
        <div class="ml-auto flex flex-none items-center gap-1.5">
          <UDropdownMenu
            :items="exportItems" :content="{ align: 'end' }"
            :ui="{ content: 'bw-root bw-overlay w-72' }"
          >
            <UButton
              size="sm" color="neutral" variant="ghost" icon="i-ph-export"
              :label="t('brand.foundation.export.label')" class="max-sm:hidden"
            />
            <template #item="{ item }">
              <UIcon v-if="item.icon" :name="item.icon" class="size-4 flex-none" style="color: var(--bw-muted)" />
              <span class="min-w-0 flex-1 text-left leading-tight">
                <span class="block truncate">{{ item.label }}</span>
                <span v-if="item.sub" class="bw-label block truncate" style="color: var(--bw-muted)">{{ item.sub }}</span>
              </span>
              <UIcon v-if="item.locked" name="i-ph-lock-simple" class="size-4 flex-none" style="color: var(--bw-muted)" />
            </template>
          </UDropdownMenu>
          <UButton
            size="sm" color="neutral" variant="ghost" class="max-md:hidden"
            icon="i-ph-sidebar-simple" :ui="{ leadingIcon: '-scale-x-100' }"
            :aria-label="tocCollapsed ? t('brand.foundation.showToc') : t('brand.foundation.hideToc')"
            @click="tocCollapsed = !tocCollapsed"
          />
        </div>
      </div>
    </template>

    <!-- MITTE: das Handbuch in LESEBREITE (§2.6). -->
    <template #default>
      <div class="fd-read mx-auto flex max-w-3xl flex-col gap-10 pb-6">
        <!-- Nur im Druck: Kopfzeile mit Marke auf jeder Seite. -->
        <p class="fd-print-head bw-label">{{ title }} · {{ t('brand.foundation.title') }}</p>

        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
            {{ t('brand.foundation.title') }}
          </p>
          <h1 class="mt-1 text-4xl font-extralight leading-tight tracking-tight">{{ title }}</h1>
          <p class="bw-label mt-3" style="color: var(--bw-muted)">
            {{ t('brand.foundation.counter', { accepted: accepted.chapters, total: accepted.total }) }}
            ·
            {{ t('brand.foundation.contentLocale', { locale: contentLocale.toUpperCase() }) }}
          </p>
        </div>

        <p v-if="doc.error.value" class="bw-pending">{{ t('brand.foundation.loadFailed') }}</p>
        <p v-else-if="!chapters.length" class="bw-pending">{{ t('brand.foundation.empty') }}</p>

        <!-- „AUF EINER SEITE" (§1.5): der Schnellzugriff über Kapitel 0 —
             kein eigenes Kapitel, nur vorhandene Felder. -->
        <div v-if="hasOnePage" class="bw-card p-8">
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
            {{ t('brand.foundation.onePage.title') }}
          </p>
          <p v-if="onePage.purpose" class="mt-4 text-lg font-extralight leading-snug tracking-tight">
            {{ onePage.purpose }}
          </p>
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            <div v-if="onePage.values.length">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.foundation.onePage.values') }}</p>
              <ul class="mt-2 space-y-2">
                <li v-for="(value, index) in onePage.values" :key="index">
                  <p class="text-sm font-medium">{{ value.title }}</p>
                  <p v-if="value.text" class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ value.text }}</p>
                </li>
              </ul>
            </div>
            <div class="space-y-4">
              <div v-if="onePage.archetype">
                <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.foundation.onePage.archetype') }}</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ onePage.archetype }}</p>
              </div>
              <div v-if="onePage.tagline">
                <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.foundation.onePage.tagline') }}</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ onePage.tagline }}</p>
              </div>
              <div v-if="onePage.wallLine">
                <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.foundation.onePage.wallLine') }}</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ onePage.wallLine }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Die Kapitel — EIN Renderer für beide Ansichten (§2.1). Die `id`
             sitzt in der Komponente und ist die Sprungmarke des
             Inhaltsverzeichnisses rechts. -->
        <BwFoundationChapter
          v-for="(entry, index) in chapters" :key="entry.chapter.id"
          :chapter="entry.chapter" :index="index"
          :acceptance-to="entry.acceptanceTo"
          variant="private"
        />
      </div>
    </template>

    <!-- RECHTS: das Inhaltsverzeichnis mit Sprungmarken — dieselbe Stelle, an
         der das Arbeits-Dokument seinen Stand zeigt. Hier IST der Stand die
         Kapitel-Liste (Haken · Kreis · Schloss), unten der Zähler. -->
    <template #george>
      <div class="flex min-h-0 flex-1 flex-col">
        <!-- `UPageAside` ist im Vorbild ein sticky Seitenrand unter dem
             Header; hier lebt sie in der scrollenden Spalte des Workspace —
             deshalb `static` statt `sticky` und keine Header-Höhe. -->
        <UPageAside
          :ui="{
            root: 'block static min-h-0 flex-1 overflow-y-auto max-h-none px-6 py-4 lg:ps-6 lg:ms-0 lg:pe-6 lg:max-h-none lg:static',
            container: 'relative',
          }"
        >
          <BwReadingToc :links="tocLinks" :title="t('brand.foundation.toc')" />
        </UPageAside>

        <div class="flex-none border-t px-6 pb-5" style="border-color: var(--bw-line)">
          <BwRailFooter
            :progress-pct="acceptedPct"
            :progress-title="t('brand.foundation.standProgress')"
            :progress-count="`${accepted.chapters}/${accepted.total}`"
          />
        </div>
      </div>
    </template>
  </BwWorkspace>
</template>

<style>
/* DRUCK (§2.6). Nicht `scoped`: die Zonen der Werkstatt (Leiste, Balken,
 * Inhaltsverzeichnis) sind fremde Komponenten, an die eine scoped Regel nicht
 * heranreicht. Die Klasse `.fd-page` am Werkstatt-Wurzelknoten hält die Regeln
 * trotzdem bei DIESER Seite. Der Seitenumbruch je Kapitel wohnt in
 * `BwFoundationChapter`. */
.fd-print-head { display: none; }
@media print {
  .fd-page header,
  .fd-page .bw-rail,
  .fd-page .bw-stage-bar,
  .fd-page .bw-george,
  .fd-page .bw-modeswitch { display: none !important; }
  .fd-page,
  .fd-page .bw-shell { display: block !important; height: auto !important; }
  .fd-page .bw-stage { overflow: visible !important; padding: 0 !important; }
  .fd-page .bw-stage-inner { max-width: none !important; }
  .fd-page .fd-read { max-width: none !important; }
  .fd-page .fd-print-head { display: block; }
  .fd-page .bw-card {
    box-shadow: none !important;
    background: transparent !important;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
}
</style>
