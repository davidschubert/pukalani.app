<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
withDefaults(defineProps<{
  progressPct: number
  contentLocale: string
  progressNote?: string
  /* Zweite Fuß-Zeile (Runde 77): bewusster Umbruch OHNE Trenner-Punkt. */
  progressSubnote?: string
  /* Korrekturrunde 11 (David, 2026-09-02): der Gesamt-Fortschritt darf in die
   * Stand-Spalte umziehen — die SEITE rendert BwRailFooter dann selbst und
   * schaltet den Rail-Fuß hier ab. Default true via withDefaults, weil ein
   * fehlendes Boolean-Prop sonst `false` wäre und der Fuß überall verschwände. */
  railFooter?: boolean
  /* Runde 13 (David, 2026-09-02): die Inhaltssprache darf in den Stand-Kopf
   * umziehen — die Seite rendert sie dann selbst und schaltet sie hier ab. */
  localeInTopbar?: boolean
  /* Runde 16 (David, 2026-09-02): mit dem Brand-Switcher in der Sidebar hat
   * die Topbar keine Aufgabe mehr — die Seite darf sie ganz abschalten und
   * zeigt den Sync-Zustand dann selbst (im Dummy: in der Sidebar). */
  topbar?: boolean
  /* Runde 16: dreizeiliger Rail-Fuß — durchgereicht an BwRailFooter. */
  progressTitle?: string
  progressCount?: string
  progressTime?: string
  /* Runde 18 (David, 2026-09-02): FESTE Breite der Nav-Spalte (z. B.
   * '288px', Vorbild UDashboardSidebar --width). Gesetzt entfällt die
   * ziehbare Naht Rail↔Bühne — nur Bühne↔Stand bleibt ein Splitter. */
  railWidth?: string
  /* Runde 20 (David): die Seite darf die Nav-Spalte einklappen (Toggle im
   * Bühnen-Balken). Wirkt nur im Fixed-Rail-Zweig; v-show statt v-if, damit
   * Collapsible-Zustände der Sidebar das Einklappen überleben. */
  railCollapsed?: boolean
  /* §3e: NUR Abweichungs-Zustände erscheinen — Stille heißt gespeichert.
   * P1c: 'error' kam dazu (der fünfte Zustand der Autosave-Regel); die drei
   * bestehenden sind unverändert, der Dummy sieht davon nichts. */
  syncState?: 'saving' | 'offline' | 'conflict' | 'error' | null
  /* P1c: übersetzte Beschriftung. Ohne sie bleibt die feste Dummy-Copy. */
  syncLabel?: string
  /* Runde 78 (David): der Fuß IST der Einstieg ins kombinierte Branding. */
  progressTo?: string
  /* Runde 96 (David): der Brand Score gehört an den Branding-Einstieg. */
  score?: number
}>(), {
  /* Die `undefined`-Defaults ändern nichts — sie stellen nur die Exemption
   * wieder her, die das nackte defineProps hatte (vue/require-default-prop
   * verlangt ab withDefaults für JEDES optionale Prop einen Default). */
  railFooter: true,
  localeInTopbar: true,
  topbar: true,
  progressTitle: undefined,
  progressCount: undefined,
  progressTime: undefined,
  railWidth: undefined,
  railCollapsed: false,
  progressNote: undefined,
  progressSubnote: undefined,
  syncState: null,
  syncLabel: undefined,
  progressTo: undefined,
  score: undefined,
})
const { t } = useI18n()
/* Die Beschriftung kommt aus `brand.workspace.sync.*` — dieselben vier
 * Schlüssel, die die Werkstatt-Seite via `syncLabel` hereinreicht. Der
 * Fallback ist damit kein zweiter Wortlaut mehr, sondern derselbe. */
const SYNC = {
  saving: { key: 'brand.workspace.sync.saving', icon: 'i-ph-circle-notch', spin: true, tone: 'var(--bw-muted)' },
  offline: { key: 'brand.workspace.sync.offline', icon: 'i-ph-cloud-slash', spin: false, tone: 'var(--bw-draft)' },
  conflict: { key: 'brand.workspace.sync.conflict', icon: 'i-ph-warning', spin: false, tone: 'var(--bw-stale)' },
  error: { key: 'brand.workspace.sync.error', icon: 'i-ph-warning-circle', spin: false, tone: 'var(--bw-stale)' },
} as const
const mode = ref<'stage' | 'george'>('george')
/* Runde 191 (David): die zwei Zonen-Nähte sind ZIEHBAR — Nuxt UIs
 * USplitter (seit 4.11.0). Nur auf Desktop (>=1280px), wo alle drei
 * Zonen nebeneinander stehen; darunter bleibt das Grid mit Mini-Rail
 * bzw. dem Mobil-Modusschalter. SSR und erster Client-Paint rendern
 * IMMER das Grid (identisch, kein Hydration-Mismatch) — der Splitter
 * steigt erst nach dem Mount ein. autoSaveId merkt sich die
 * Aufteilung je Browser in localStorage. */
const isDesktop = ref(false)
let desktopMq: MediaQueryList | null = null
const onMq = (e: MediaQueryListEvent | MediaQueryList) => { isDesktop.value = e.matches }
onMounted(() => {
  desktopMq = window.matchMedia('(min-width: 1280px)')
  onMq(desktopMq)
  desktopMq.addEventListener('change', onMq)
})
onBeforeUnmount(() => desktopMq?.removeEventListener('change', onMq))
const zoneItems = [
  { slot: 'rail', defaultSize: 24, minSize: 16, maxSize: 34, class: 'min-w-0' },
  { slot: 'stage', defaultSize: 48, minSize: 32, class: 'min-w-0' },
  { slot: 'george', defaultSize: 28, minSize: 20, maxSize: 42, class: 'min-w-0' },
]
/* Runde 18: bei fester Rail-Breite trägt der Splitter nur noch zwei Zonen
 * (Prozente beziehen sich dann auf die Restbreite NEBEN der Rail). */
const zoneItemsFixedRail = [
  { slot: 'stage', defaultSize: 63, minSize: 42, class: 'min-w-0' },
  { slot: 'george', defaultSize: 37, minSize: 24, maxSize: 55, class: 'min-w-0' },
]
/* Runde 132 (David): das Konto-Menü (Sprache, Erscheinungsbild,
 * Tastaturkürzel, Support, Konto) wohnt jetzt DAUERHAFT in BwSiteNav
 * oben rechts — die Topbar behält nur Brand-Switcher und Sync-Zustand.
 * Die Inhaltssprache der Brand zeigt eine stille Mono-Marke rechts. */
</script>

<template>
  <div class="bw-root bw-shell" :class="mode === 'stage' ? 'bw-mode-stage' : 'bw-mode-george'">
    <!-- Hauptnavigation liegt auch über der Werkstatt (Davids Vorgabe
         Runde 131) — der Rest des Shells teilt sich die Resthöhe. -->
    <div class="flex-none px-6">
      <BwSiteNav style="margin-bottom: 0" />
    </div>
    <header v-if="topbar" class="bw-topbar">
      <div class="flex min-w-0 items-center gap-2.5">
        <!-- Runde 5: das Auswahlmenü ERSETZT den Brandnamen im Header -->
        <slot name="brand" />
        <Transition name="bw-sync">
          <span v-if="syncState" class="bw-label flex flex-none items-center gap-1.5" :style="`color: ${SYNC[syncState].tone}`">
            <UIcon :name="SYNC[syncState].icon" :class="SYNC[syncState].spin ? 'animate-spin' : ''" class="size-4" />
            {{ syncLabel ?? t(SYNC[syncState].key) }}
          </span>
        </Transition>
        <!-- Kein Dauer-Badge (Runde 4): Autosave ist Vertrag, Stille heißt
             gespeichert. Hier erscheinen NUR Abweichungs-Zustände (§3e):
             Speichert… / Offline — Eingabe bleibt erhalten / Konflikt. -->
      </div>
      <div class="ml-auto flex items-center gap-4">
        <span v-if="localeInTopbar" class="bw-label whitespace-nowrap" style="color: var(--bw-muted)">{{ t('brand.workspace.contentLocale') }}: {{ contentLocale.toUpperCase() }}</span>
      </div>
    </header>

    <div class="bw-modeswitch flex border-b" style="border-color: var(--bw-line)">
      <button class="flex-1 py-2 text-sm" :class="mode === 'stage' ? 'font-semibold' : ''" :style="mode === 'stage' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" @click="mode = 'stage'">
        {{ t('brand.workspace.mode.document') }}
      </button>
      <button class="flex-1 py-2 text-sm" :class="mode === 'george' ? 'font-semibold' : ''" :style="mode === 'george' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" @click="mode = 'george'">
        George
      </button>
    </div>

    <!-- Runde 18: feste Rail-Breite — die Rail steht als eigene Spalte NEBEN
         dem Splitter, der nur noch Bühne↔Stand teilt. -->
    <div v-if="isDesktop && railWidth" class="flex min-h-0 flex-1">
      <aside v-show="!railCollapsed" class="bw-rail flex h-full flex-none flex-col" :style="`width: ${railWidth}`">
        <div class="bw-rail-scroll min-h-0 flex-1"><slot name="rail" /></div>
        <div v-if="railFooter" class="bw-rail-foot flex-none">
          <BwRailFooter :progress-pct="progressPct" :progress-note="progressNote" :progress-subnote="progressSubnote" :progress-to="progressTo" :score="score" :progress-title="progressTitle" :progress-count="progressCount" :progress-time="progressTime" />
        </div>
      </aside>
      <USplitter
        id="bw-workspace-fixedrail" auto-save-id="bw-workspace-fixedrail" :items="zoneItemsFixedRail"
        class="min-h-0 min-w-0 flex-1"
        :ui="{ handle: 'w-px transition-colors bg-(--bw-line) data-[state=hover]:bg-(--bw-accent) data-[state=drag]:bg-(--bw-accent)' }"
      >
        <template #stage>
          <!-- Runde 20b (David): der Bühnen-Balken ist eine EIGENE Zone ÜBER
               dem Scroller (heller Grund, 1px-Linie darunter, volle Spalten-
               breite) — im Scroll-Inhalt bliebe er im zentrierten 46rem-Band. -->
          <div class="flex h-full w-full min-w-0 flex-col">
            <div v-if="$slots['stage-bar']" class="bw-stage-bar flex-none"><slot name="stage-bar" /></div>
            <main class="bw-stage min-h-0 w-full min-w-0 flex-1"><div class="bw-stage-inner"><slot /></div></main>
          </div>
        </template>
        <template #george>
          <aside class="bw-george h-full w-full"><slot name="george" /></aside>
        </template>
      </USplitter>
    </div>
    <USplitter
      v-else-if="isDesktop" id="bw-workspace" auto-save-id="bw-workspace" :items="zoneItems"
      class="min-h-0 flex-1"
      :ui="{ handle: 'w-px transition-colors bg-(--bw-line) data-[state=hover]:bg-(--bw-accent) data-[state=drag]:bg-(--bw-accent)' }"
    >
      <template #rail>
        <aside class="bw-rail flex h-full w-full flex-col">
          <!-- Runde 12 (David): der Scroller trägt das Spalten-Padding SELBST
               (.bw-rail-scroll) — vorher lag es außen an .bw-rail und der
               Scrollbalken schwebte mitten in der Spalte statt an ihrer Kante. -->
          <div class="bw-rail-scroll min-h-0 flex-1"><slot name="rail" /></div>
          <div v-if="railFooter" class="bw-rail-foot flex-none">
            <BwRailFooter :progress-pct="progressPct" :progress-note="progressNote" :progress-subnote="progressSubnote" :progress-to="progressTo" :score="score" :progress-title="progressTitle" :progress-count="progressCount" :progress-time="progressTime" />
          </div>
        </aside>
      </template>
      <template #stage>
        <main class="bw-stage h-full w-full min-w-0"><div class="bw-stage-inner"><slot /></div></main>
      </template>
      <template #george>
        <aside class="bw-george h-full w-full"><slot name="george" /></aside>
      </template>
    </USplitter>
    <div v-else class="bw-zones" :style="railWidth ? `--bw-rail-w: ${railWidth}` : undefined">
      <aside class="bw-rail flex flex-col">
        <div class="bw-rail-scroll min-h-0 flex-1"><slot name="rail" /></div>
        <!-- Runde 48 (David): Gesamt-Fortschritt unten links statt Ring in
             der Topbar — Balken wie im Info-Layer. -->
        <div v-if="railFooter" class="bw-rail-foot flex-none">
          <BwRailFooter :progress-pct="progressPct" :progress-note="progressNote" :progress-subnote="progressSubnote" :progress-to="progressTo" :score="score" :progress-title="progressTitle" :progress-count="progressCount" :progress-time="progressTime" />
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-col">
        <div v-if="$slots['stage-bar']" class="bw-stage-bar flex-none"><slot name="stage-bar" /></div>
        <main class="bw-stage min-h-0 flex-1"><div class="bw-stage-inner"><slot /></div></main>
      </div>
      <aside class="bw-george"><slot name="george" /></aside>
    </div>
  </div>
</template>
