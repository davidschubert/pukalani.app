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
        <span class="bw-label" style="color: var(--bw-muted)">Inhaltssprache: {{ contentLocale.toUpperCase() }}</span>
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

    <div class="bw-zones">
      <aside class="bw-rail flex flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto pr-3"><slot name="rail" /></div>
        <!-- Runde 48 (David): Gesamt-Fortschritt unten links statt Ring in
             der Topbar — Balken wie im Info-Layer. -->
        <div class="flex-none pt-5">
          <!-- Runde 80 (David): das kombinierte Branding als ECHTER
               Pill-Knopf über dem Fuß — gleiche Anatomie wie die
               Ergebnis-Zeilen, nicht als unsichtbar verlinkte Fläche. -->
          <NuxtLink
            v-if="progressTo" :to="progressTo"
            class="mb-4 flex w-full items-center gap-3 rounded-full py-2.5 pl-2 pr-2 text-left text-sm"
            style="background: var(--bw-surface-hi); box-shadow: var(--bw-shadow-card)"
          >
            <span class="grid size-7 flex-none place-items-center rounded-full" style="background: var(--bw-accent-soft)">
              <UIcon name="i-ph-sparkle" class="size-4" style="color: var(--bw-accent)" />
            </span>
            <span class="min-w-0 flex-1 font-medium">Euer Branding</span>
            <BwScoreRing v-if="score !== undefined" :value="score" :size="28" class="flex-none" />
            <span class="grid size-7 flex-none place-items-center rounded-full">
              <UIcon name="i-ph-arrow-right" class="size-4" style="color: var(--bw-ink-soft)" />
            </span>
          </NuxtLink>
          <div class="flex items-baseline justify-between gap-3">
            <p v-if="progressNote" class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
              {{ progressNote }}
              <span v-if="progressSubnote" class="block">{{ progressSubnote }}</span>
            </p>
            <span class="bw-label flex-none uppercase tracking-wider whitespace-nowrap">{{ progressPct }}&thinsp;%</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
            <div class="h-full rounded-full transition-all" :style="`width: ${progressPct}%; background: var(--bw-accent)`" />
          </div>
        </div>
      </aside>
      <main class="bw-stage"><div class="bw-stage-inner"><slot /></div></main>
      <aside class="bw-george"><slot name="george" /></aside>
    </div>
  </div>
</template>
