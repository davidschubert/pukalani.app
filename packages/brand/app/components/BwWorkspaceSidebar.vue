<script setup lang="ts">
import type { BwRailLayer, BwRailStep } from './BwProgressRail.vue'
import type { BwNewBrandSubmit } from './BwNewBrandModal.vue'

/**
 * DIE LINKE SPALTE DER WERKSTATT — Nuxt-UI-Sidebar-Muster in der bw-Welt.
 *
 * Sie ist die in den Layer gehobene Fassung von `GdSidebar` aus dem
 * Klickdummy (Runden 16–22/30, abgenommen 2026-09-02). Der Dummy bleibt
 * unangetastet als Abnahme-Dokument; DIESE Komponente ist die, die mit
 * echten Daten läuft — Bereiche/Bausteine aus der Journey, Marken aus dem
 * Konto, Texte aus i18n statt fest deutsch.
 *
 * 1. OBEN der Brand-Switcher (Team-Switcher-Muster). Er ERSETZT den Switcher
 *    aus der Topbar, die mit dem Umbau ganz entfällt. **Falle:** das Menü
 *    teleportiert an den Body, also AUSSERHALB des Token-Wirtes `.bw-root` —
 *    ohne `bw-root bw-overlay` am Content sind alle `--bw-*`-Farben leer
 *    (Monogramme ohne Quadrat, Häkchen schwarz; R19b/c live erwischt).
 *    Aus demselben Grund stehen die Farben im Menü INLINE: scoped CSS greift
 *    in teleportierten Slot-Inhalt nicht verlässlich.
 * 2. KEINE Suche (Davids Entscheidung).
 * 3. Bereiche als einklappbare Gruppen (UCollapsible) mit schlanken Zeilen:
 *    vorn der STATUS (Haken/Halbmond/Kreis/Schloss), hinten das Info-Icon als
 *    echter Knopf — erst bei Hover/Fokus sichtbar, damit die Zeilen ruhig
 *    bleiben. Der Erklär-Layer ist `BwStepInfoModal`, dieselbe Quelle, die
 *    auch `BwProgressRail` benutzt.
 * 4. Der Sync-Zustand wohnt hier, weil es keine Topbar mehr gibt, die ihn
 *    zeigen könnte — und weiterhin NUR als Abweichung (§3e: Stille heisst
 *    gespeichert).
 *
 * Der GESAMT-Fortschritt gehört NICHT hierher: er steht seit Runde 31 unten
 * rechts im Log (`railFooter=false` an `BwWorkspace`).
 */

/** Ein Eintrag des Marken-Wählers — die Seite reicht ihn übersetzt herein. */
export interface BwSidebarBrand {
  id: string
  title: string
  /** „Neue Marke" / „Marken-Relaunch" — das VORHABEN, zweite Zeile. */
  path: string
  /** Flaggen-Icon der Inhaltssprache, z. B. `i-circle-flags-de`. */
  flag?: string
  /** Ziel des Eintrags (Werkstatt der Marke); die aktive Marke braucht keins. */
  to?: string
  current?: boolean
}

const props = withDefaults(defineProps<{
  layers: BwRailLayer[]
  /** Die Brandings des Kontos. Leer ⇒ der Switcher zeigt nur die Ausgänge. */
  brands?: BwSidebarBrand[]
  /** Ziel von „Brandings verwalten". */
  manageTo?: string
  /** §3e: nur Abweichungen erscheinen; `null` heisst gespeichert. */
  syncState?: 'saving' | 'offline' | 'conflict' | 'error' | null
  syncLabel?: string
}>(), {
  brands: () => [],
  manageTo: '/dashboard/brands',
  syncState: null,
  syncLabel: undefined,
})

const emit = defineEmits<{
  /** Ein betretbarer Baustein wurde gewählt — die SEITE navigiert (Autosave!). */
  select: [stepId: string]
  /**
   * Eine ANDERE Marke wurde gewählt — auch hier navigiert die SEITE.
   *
   * Ein `to` am Menü-Eintrag wäre kürzer und falsch (Audit-Befund A3): der
   * Sprung geht auf DENSELBEN Route-Record (`brand/[profileId]/[stepKey]`),
   * also feuert `onBeforeRouteLeave` nicht, und der Autosave hat nie
   * ausgespült — offene Eingaben wären weg. Es ist dieselbe Regel, die
   * `goToStep` schon befolgt.
   */
  selectBrand: [to: string]
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const SYNC = {
  saving: { key: 'brand.workspace.sync.saving', icon: 'i-ph-circle-notch', spin: true },
  offline: { key: 'brand.workspace.sync.offline', icon: 'i-ph-cloud-slash', spin: false },
  conflict: { key: 'brand.workspace.sync.conflict', icon: 'i-ph-warning', spin: false },
  error: { key: 'brand.workspace.sync.error', icon: 'i-ph-warning-circle', spin: false },
} as const

const newBrandOpen = ref(false)

/**
 * „Neues Branding" ist eine ÜBERGABE, keine Anlage — dieselbe Regel wie auf
 * der Übersicht (`/dashboard/brands`): das Modal erhebt Weiche, Titel und
 * Sprache, die Startkarte ist seither Pflicht und wird auf `…/brands/new`
 * erfragt. Ein direkter Anlage-Aufruf von hier bekäme ein 400.
 */
async function startNewBrand(payload: BwNewBrandSubmit): Promise<void> {
  newBrandOpen.value = false
  await navigateTo({
    path: localePath('/dashboard/brands/new'),
    query: {
      path: payload.kind === 'rebrand' ? 'relaunch' : 'new',
      ...(payload.title ? { title: payload.title } : {}),
      lang: payload.lang,
    },
  })
}

const current = computed(() => props.brands.find(brand => brand.current) ?? null)
const monogram = (title: string): string => (title.trim().slice(0, 1) || '?').toUpperCase()

/**
 * Die Menü-Einträge. Die Marken tragen ihre Zusatzfelder direkt am Item
 * (`DropdownMenuItem` erlaubt sie) und werden im `#item`-Slot gerendert —
 * dynamische Slot-Namen je Marke wären dieselbe Anzeige mit mehr Mechanik.
 */
interface BwSwitcherItem {
  label: string
  icon?: string
  to?: string
  /** Marken-Eintrag: Monogramm, Vorhaben, Sprachflagge, Häkchen. */
  mono?: string
  sub?: string
  flag?: string
  active?: boolean
  onSelect?: () => void
}

const brandMenu = computed<BwSwitcherItem[][]>(() => [
  props.brands.map(brand => ({
    label: brand.title,
    mono: monogram(brand.title),
    sub: brand.path,
    flag: brand.flag,
    active: brand.current === true,
    // `onSelect` statt `to`: der Wechsel muss erst den Autosave ausspülen (A3).
    ...(brand.to && !brand.current
      ? { onSelect: () => { emit('selectBrand', brand.to as string) } }
      : {}),
  })),
  [
    { label: t('brand.nav.newBranding'), icon: 'i-ph-plus-circle', onSelect: () => { newBrandOpen.value = true } },
    { label: t('brand.nav.manageBrandings'), icon: 'i-ph-gear-six', to: props.manageTo },
  ],
])

const infoStep = ref<{ step: BwRailStep, layerLabel: string } | null>(null)
const infoOpen = computed({
  get: () => infoStep.value !== null,
  set: (value: boolean) => { if (!value) infoStep.value = null },
})

function openLayerInfo(layer: BwRailLayer): void {
  if (!layer.info) return
  infoStep.value = {
    step: { id: layer.id, label: layer.label, icon: '', state: 'open', info: layer.info },
    layerLabel: layer.lockedNote ?? layer.note ?? t('brand.workspace.rail.overview'),
  }
}

/** Status-Glyphe VORN: Haken accent · Halbmond ink · Kreis muted · Schloss. */
function glyph(layer: BwRailLayer, step: BwRailStep): { name: string, style: string } {
  // Gesperrt ist ein Punkt durch seine SCHICHT oder durch sich selbst (A9).
  if (layer.locked || step.state === 'locked') return { name: 'i-ph-lock-simple', style: 'color: var(--bw-muted)' }
  if (step.kind === 'result') return { name: 'i-ph-sparkle', style: step.state === 'done' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)' }
  if (step.state === 'done') return { name: 'i-ph-check-circle-fill', style: 'color: var(--bw-accent)' }
  if (step.state === 'active') return { name: 'i-ph-circle-half-fill', style: 'color: var(--bw-ink)' }
  return { name: 'i-ph-circle', style: 'color: var(--bw-muted)' }
}

/**
 * Betretbar? Für Ergebnis-Punkte erst nach `done`, sonst alles ausser `open`
 * — dieselbe Regel wie im Dummy. Die HARTE Prüfung macht die Seite
 * (`canEnterBrandStep`), bevor sie navigiert; hier geht es nur darum, keinen
 * Knopf anzubieten, der nichts tut.
 */
function stepDisabled(layer: BwRailLayer, step: BwRailStep): boolean {
  if (layer.locked || step.state === 'locked') return true
  return step.kind === 'result' ? step.state !== 'done' : step.state === 'open'
}

function selectStep(layer: BwRailLayer, step: BwRailStep): void {
  if (stepDisabled(layer, step)) return
  // Ein Punkt mit eigenem Ziel (Ergebnis-Ansicht) führt DORTHIN — `select`
  // meint „öffne diesen Baustein" und liefe für ihn ins Leere.
  if (step.to) { void navigateTo(step.to); return }
  emit('select', step.id)
}
</script>

<template>
  <nav :aria-label="t('brand.workspace.rail.progressNav')">
    <!-- 1. Brand-Switcher oben. Das Menü spannt die VOLLE Trigger-Breite auf
         (Reka-Variable), wie beim Team-Switcher des Vorbilds. -->
    <UDropdownMenu
      :items="brandMenu" :content="{ align: 'start' }"
      :ui="{ content: 'bw-root bw-overlay w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <button
        class="bw-nav-switch flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left"
        :aria-label="t('brand.workspace.sidebar.switchBrand')"
      >
        <span
          class="grid size-7 flex-none place-items-center rounded-lg text-xs font-semibold"
          style="background: var(--bw-ink); color: var(--bw-paper)"
        >{{ monogram(current?.title ?? '') }}</span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ current?.title ?? t('brand.brands.card.untitled') }}</span>
        <UIcon name="i-ph-caret-up-down" class="size-4 flex-none" style="color: var(--bw-muted)" />
      </button>

      <!-- Inline-Farben statt scoped Klassen: der Slot-Inhalt landet im
           teleportierten Menü, wo scoped CSS nicht verlässlich greift. -->
      <template #item="{ item }">
        <template v-if="item.mono">
          <span class="grid size-7 flex-none place-items-center rounded-lg text-xs font-semibold" style="background: var(--bw-ink); color: var(--bw-paper)">{{ item.mono }}</span>
          <span class="min-w-0 flex-1 text-left leading-tight">
            <span class="block truncate font-medium">{{ item.label }}</span>
            <span class="bw-label flex items-center gap-1.5" style="color: var(--bw-muted)">
              {{ item.sub }}<UIcon v-if="item.flag" :name="item.flag" class="size-3.5 flex-none" />
            </span>
          </span>
          <UIcon v-if="item.active" name="i-ph-check" class="size-4 flex-none" style="color: var(--bw-accent)" />
        </template>
        <template v-else>
          <UIcon v-if="item.icon" :name="item.icon" class="size-4 flex-none" style="color: var(--bw-muted)" />
          <span class="min-w-0 flex-1 truncate text-left">{{ item.label }}</span>
        </template>
      </template>
    </UDropdownMenu>

    <!-- 3. Bereiche als einklappbare Gruppen -->
    <div class="mt-4 space-y-1">
      <UCollapsible
        v-for="layer in layers" :key="layer.id"
        :default-open="!layer.locked" :unmount-on-hide="false" class="group/section"
      >
        <button
          class="bw-nav-row group/row flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm font-medium"
          :style="layer.locked ? 'color: var(--bw-muted)' : ''"
        >
          <UIcon v-if="layer.locked" name="i-ph-lock-simple" class="size-4 flex-none" style="color: var(--bw-muted)" />
          <span class="min-w-0 flex-1 truncate">{{ layer.label }}</span>
          <span
            v-if="layer.info"
            class="bw-info-btn bw-nav-info grid size-6 flex-none place-items-center rounded-full"
            role="button" tabindex="0"
            :aria-label="t('brand.workspace.rail.whatsIn', { label: layer.label })"
            @click.stop="openLayerInfo(layer)"
            @keydown.enter.stop="openLayerInfo(layer)"
          >
            <UIcon name="i-ph-info" class="size-4" />
          </span>
          <UIcon
            name="i-ph-caret-down" class="size-4 flex-none transition-transform group-data-[state=closed]/section:-rotate-90"
            style="color: var(--bw-muted)"
          />
        </button>

        <template #content>
          <!-- Kinder an einer 1px-Führungslinie, Nuxt-UI-Einzug (ms-5 / ps-1.5). -->
          <ul class="ml-5 mt-0.5 space-y-0.5 border-l pl-1.5" style="border-color: var(--bw-line)">
            <li v-for="step in layer.steps ?? []" :key="step.id">
              <button
                class="bw-nav-row group/row flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm"
                :class="!layer.locked && step.state === 'active' ? 'font-medium' : ''"
                :style="!layer.locked && step.state === 'active'
                  ? 'background: var(--bw-surface-hi); color: var(--bw-ink); box-shadow: var(--bw-shadow-card)'
                  : stepDisabled(layer, step) ? 'color: var(--bw-muted)' : 'color: var(--bw-ink-soft)'"
                :disabled="stepDisabled(layer, step)"
                @click="selectStep(layer, step)"
              >
                <UIcon :name="glyph(layer, step).name" class="size-4 flex-none" :style="glyph(layer, step).style" />
                <span class="min-w-0 flex-1 truncate">{{ step.label }}</span>
                <span
                  v-if="step.info && !layer.locked"
                  class="bw-info-btn bw-nav-info grid size-6 flex-none place-items-center rounded-full"
                  role="button" tabindex="0"
                  :aria-label="t('brand.workspace.rail.whatMeans', { label: step.label })"
                  @click.stop="infoStep = { step, layerLabel: layer.label }"
                  @keydown.enter.stop="infoStep = { step, layerLabel: layer.label }"
                >
                  <UIcon name="i-ph-info" class="size-4" />
                </span>
                <UIcon
                  v-if="step.kind === 'result' && step.state === 'done'"
                  name="i-ph-arrow-right" class="size-4 flex-none" style="color: var(--bw-ink-soft)"
                />
              </button>
            </li>
          </ul>
        </template>
      </UCollapsible>
    </div>

    <!-- Sync-Zustand: ohne Topbar zeigt ihn die Sidebar (nur Abweichungen). -->
    <Transition name="bw-sync">
      <p v-if="syncState" class="bw-label mt-4 flex items-center gap-1.5 px-2" style="color: var(--bw-muted)">
        <UIcon :name="SYNC[syncState].icon" :class="SYNC[syncState].spin ? 'animate-spin' : ''" class="size-4" />
        {{ syncLabel ?? t(SYNC[syncState].key) }}
      </p>
    </Transition>

    <BwStepInfoModal
      v-model:open="infoOpen"
      :step="infoStep?.step ?? null"
      :layer-label="infoStep?.layerLabel ?? ''"
    />
    <BwNewBrandModal v-model:open="newBrandOpen" mode="live" @submit="startNewBrand" />
  </nav>
</template>
