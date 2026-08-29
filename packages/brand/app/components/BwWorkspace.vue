<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
const props = defineProps<{ progressPct: number, contentLocale: string, progressNote?: string }>()
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
        <!-- Kein Dauer-Badge (Runde 4): Autosave ist Vertrag, Stille heißt
             gespeichert. Hier erscheinen NUR Abweichungs-Zustände (§3e):
             Speichert… / Offline — Eingabe bleibt erhalten / Konflikt. -->
      </div>
      <div class="ml-auto flex items-center gap-3" style="color: var(--bw-muted)">
        <UDropdownMenu :items="helpMenu">
          <button aria-label="Hilfe" class="grid place-items-center"><UIcon name="i-ph-question" class="size-8" /></button>
        </UDropdownMenu>
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
        <div class="min-h-0 flex-1 overflow-y-auto"><slot name="rail" /></div>
        <!-- Runde 48 (David): Gesamt-Fortschritt unten links statt Ring in
             der Topbar — Balken wie im Info-Layer. -->
        <div class="flex-none pt-5">
          <div class="flex items-baseline justify-between gap-3">
            <p v-if="progressNote" class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">{{ progressNote }}</p>
            <span class="bw-label uppercase tracking-wider">{{ progressPct }}&thinsp;%</span>
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
