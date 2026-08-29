<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
const props = defineProps<{ progressPct: number, contentLocale: string }>()
const RING = 2 * Math.PI * 8
const mode = ref<'stage' | 'george'>('george')
const userMenu = computed(() => [[
  { label: `Inhaltssprache: ${props.contentLocale.toUpperCase()}`, icon: 'i-ph-translate', disabled: true },
  { label: 'Oberfläche: Deutsch', icon: 'i-ph-globe-simple' },
], [
  { label: 'Konto', icon: 'i-ph-user-circle' },
  { label: 'Abmelden', icon: 'i-ph-sign-out' },
]])
const helpMenu = [[
  { label: 'Was ist dieser Baustein?', icon: 'i-ph-info' },
  { label: 'Beispiel ansehen', icon: 'i-ph-eye' },
  { label: 'Tastaturkürzel', icon: 'i-ph-keyboard' },
], [
  { label: 'Support kontaktieren', icon: 'i-ph-lifebuoy' },
]]
</script>

<template>
  <div class="bw-root bw-shell" :class="mode === 'stage' ? 'bw-mode-stage' : 'bw-mode-george'">
    <header class="bw-topbar">
      <div class="flex min-w-0 items-center gap-2.5">
        <!-- Runde 5: das Auswahlmenü ERSETZT den Brandnamen im Header -->
        <slot name="brand" />
        <span class="flex flex-none items-center gap-1.5 text-sm" style="color: var(--bw-muted)">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" class="-rotate-90">
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--bw-line-strong)" stroke-width="2.5" />
            <circle
              cx="10" cy="10" r="8" fill="none" stroke="var(--bw-accent)" stroke-width="2.5"
              stroke-linecap="round" :stroke-dasharray="RING" :stroke-dashoffset="RING * (1 - progressPct / 100)"
            />
          </svg>
          <span class="bw-num text-base" style="color: var(--bw-ink)">{{ progressPct }}&thinsp;%</span> abgeschlossen
        </span>
        <!-- Kein Dauer-Badge (Runde 4): Autosave ist Vertrag, Stille heißt
             gespeichert. Hier erscheinen NUR Abweichungs-Zustände (§3e):
             Speichert… / Offline — Eingabe bleibt erhalten / Konflikt. -->
      </div>
      <div class="ml-auto flex items-center gap-3" style="color: var(--bw-muted)">
        <UDropdownMenu :items="helpMenu">
          <button aria-label="Hilfe" class="grid place-items-center"><UIcon name="i-ph-question" class="size-5" /></button>
        </UDropdownMenu>
        <UDropdownMenu :items="userMenu">
          <button aria-label="Konto-Menü" class="grid place-items-center"><UIcon name="i-ph-user-circle" class="size-6" /></button>
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
      <aside class="bw-rail"><slot name="rail" /></aside>
      <main class="bw-stage"><div class="bw-stage-inner"><slot /></div></main>
      <aside class="bw-george"><slot name="george" /></aside>
    </div>
  </div>
</template>
