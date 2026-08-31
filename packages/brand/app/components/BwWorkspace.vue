<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
defineProps<{
  progressPct: number
  contentLocale: string
  progressNote?: string
  /* Zweite Fuß-Zeile (Runde 77): bewusster Umbruch OHNE Trenner-Punkt. */
  progressSubnote?: string
  /* §3e: NUR Abweichungs-Zustände erscheinen — Stille heißt gespeichert. */
  syncState?: 'saving' | 'offline' | 'conflict' | null
  /* Runde 78 (David): der Fuß IST der Einstieg ins kombinierte Branding. */
  progressTo?: string
  /* Runde 96 (David): der Brand Score gehört an den Branding-Einstieg. */
  score?: number
}>()
const SYNC = {
  saving: { label: 'Speichert …', icon: 'i-ph-circle-notch', spin: true, tone: 'var(--bw-muted)' },
  offline: { label: 'Offline — Eingabe bleibt erhalten', icon: 'i-ph-cloud-slash', spin: false, tone: 'var(--bw-draft)' },
  conflict: { label: 'Konflikt — Stand neu laden', icon: 'i-ph-warning', spin: false, tone: 'var(--bw-stale)' },
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
    <header class="bw-topbar">
      <div class="flex min-w-0 items-center gap-2.5">
        <!-- Runde 5: das Auswahlmenü ERSETZT den Brandnamen im Header -->
        <slot name="brand" />
        <Transition name="bw-sync">
          <span v-if="syncState" class="bw-label flex flex-none items-center gap-1.5" :style="`color: ${SYNC[syncState].tone}`">
            <UIcon :name="SYNC[syncState].icon" :class="SYNC[syncState].spin ? 'animate-spin' : ''" class="size-4" />
            {{ SYNC[syncState].label }}
          </span>
        </Transition>
        <!-- Kein Dauer-Badge (Runde 4): Autosave ist Vertrag, Stille heißt
             gespeichert. Hier erscheinen NUR Abweichungs-Zustände (§3e):
             Speichert… / Offline — Eingabe bleibt erhalten / Konflikt. -->
      </div>
      <div class="ml-auto flex items-center gap-4">
        <span class="bw-label whitespace-nowrap" style="color: var(--bw-muted)">Inhaltssprache: {{ contentLocale.toUpperCase() }}</span>
      </div>
    </header>

    <div class="bw-modeswitch flex border-b" style="border-color: var(--bw-line)">
      <button class="flex-1 py-2 text-sm" :class="mode === 'stage' ? 'font-semibold' : ''" :style="mode === 'stage' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" @click="mode = 'stage'">
        Dokument
      </button>
      <button class="flex-1 py-2 text-sm" :class="mode === 'george' ? 'font-semibold' : ''" :style="mode === 'george' ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" @click="mode = 'george'">
        George
      </button>
    </div>

    <USplitter
      v-if="isDesktop" id="bw-workspace" auto-save-id="bw-workspace" :items="zoneItems"
      class="min-h-0 flex-1"
      :ui="{ handle: 'w-px transition-colors bg-(--bw-line) data-[state=hover]:bg-(--bw-accent) data-[state=drag]:bg-(--bw-accent)' }"
    >
      <template #rail>
        <aside class="bw-rail flex h-full w-full flex-col">
          <div class="min-h-0 flex-1 overflow-y-auto pr-3"><slot name="rail" /></div>
          <BwRailFooter :progress-pct="progressPct" :progress-note="progressNote" :progress-subnote="progressSubnote" :progress-to="progressTo" :score="score" />
        </aside>
      </template>
      <template #stage>
        <main class="bw-stage h-full w-full min-w-0"><div class="bw-stage-inner"><slot /></div></main>
      </template>
      <template #george>
        <aside class="bw-george h-full w-full"><slot name="george" /></aside>
      </template>
    </USplitter>
    <div v-else class="bw-zones">
      <aside class="bw-rail flex flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto pr-3"><slot name="rail" /></div>
        <!-- Runde 48 (David): Gesamt-Fortschritt unten links statt Ring in
             der Topbar — Balken wie im Info-Layer. -->
        <BwRailFooter :progress-pct="progressPct" :progress-note="progressNote" :progress-subnote="progressSubnote" :progress-to="progressTo" :score="score" />
      </aside>
      <main class="bw-stage"><div class="bw-stage-inner"><slot /></div></main>
      <aside class="bw-george"><slot name="george" /></aside>
    </div>
  </div>
</template>
