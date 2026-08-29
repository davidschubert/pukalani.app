<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
const props = defineProps<{
  progressPct: number
  contentLocale: string
  progressNote?: string
  /* Zweite Fuß-Zeile (Runde 77): bewusster Umbruch OHNE Trenner-Punkt. */
  progressSubnote?: string
  /* §3e: NUR Abweichungs-Zustände erscheinen — Stille heißt gespeichert. */
  syncState?: 'saving' | 'offline' | 'conflict' | null
}>()
const SYNC = {
  saving: { label: 'Speichert …', icon: 'i-ph-circle-notch', spin: true, tone: 'var(--bw-muted)' },
  offline: { label: 'Offline — Eingabe bleibt erhalten', icon: 'i-ph-cloud-slash', spin: false, tone: 'var(--bw-draft)' },
  conflict: { label: 'Konflikt — Stand neu laden', icon: 'i-ph-warning', spin: false, tone: 'var(--bw-stale)' },
} as const
const mode = ref<'stage' | 'george'>('george')
/* Runde 54 (David): das ?-Icon ist raus — Erklärungen macht der
 * Info-Layer je Schritt, Beispiele macht George; Tastaturkürzel und
 * Support leben jetzt hier im Konto-Menü. Runde 66: der Sprachwechsler
 * hängt als Untermenü hier — Wechsel wie überall via switchLocalePath. */
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const LOCALE_FLAGS: Record<string, string> = { en: 'i-circle-flags-us', de: 'i-circle-flags-de' }
/* Erscheinungsbild nach Pukalani-Muster (DisplaySettingsMenu im
 * themes-Layer): Hell/Dunkel/System über colorMode.preference. */
const colorMode = useColorMode()
const APPEARANCE = [
  ['light', 'Hell', 'i-ph-sun'],
  ['dark', 'Dunkel', 'i-ph-moon'],
  ['system', 'System', 'i-ph-monitor'],
] as const
const userMenu = computed(() => [[
  { label: `Inhaltssprache: ${props.contentLocale.toUpperCase()}`, icon: 'i-ph-translate', disabled: true },
  {
    label: locale.value === 'de' ? 'Sprache: Deutsch' : 'Language: English',
    icon: 'i-ph-globe-simple',
    children: locales.value.map(entry => ({
      label: entry.code === 'de' ? 'Deutsch' : 'English',
      icon: LOCALE_FLAGS[entry.code] ?? 'i-ph-globe-hemisphere-west',
      type: 'checkbox' as const,
      checked: entry.code === locale.value,
      to: switchLocalePath(entry.code),
    })),
  },
  {
    label: 'Erscheinungsbild',
    icon: 'i-ph-sun-horizon',
    children: APPEARANCE.map(([mode, label, icon]) => ({
      label,
      icon,
      type: 'checkbox' as const,
      checked: colorMode.preference === mode,
      onSelect: (event: Event) => { event.preventDefault(); colorMode.preference = mode },
    })),
  },
], [
  { label: 'Tastaturkürzel', icon: 'i-ph-keyboard' },
  { label: 'Support kontaktieren', icon: 'i-ph-lifebuoy' },
], [
  { label: 'Konto', icon: 'i-ph-user-circle' },
  { label: 'Abmelden', icon: 'i-ph-sign-out' },
]])
</script>

<template>
  <div class="bw-root bw-shell" :class="mode === 'stage' ? 'bw-mode-stage' : 'bw-mode-george'">
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
      <div class="ml-auto flex items-center gap-4" style="color: var(--bw-muted)">
        <UDropdownMenu :items="userMenu">
          <button aria-label="Konto-Menü" class="grid place-items-center"><UAvatar text="DS" size="md" /></button>
        </UDropdownMenu>
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
