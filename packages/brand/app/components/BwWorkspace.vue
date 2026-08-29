<script setup lang="ts">
/** Drei-Zonen-Werkstatt. Korrekturrunde 3 (David): Brandname + "% abgeschlossen"
 *  + Gespeichert LINKSBÜNDIG (der Meine-Brands-Weg lebt jetzt im Switcher);
 *  rechts Hilfe (kontextbezogen) + User-Menü mit Sprachregler. */
const props = defineProps<{ brandTitle: string, progress: string, contentLocale: string }>()
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
        <span class="truncate font-semibold">{{ brandTitle }}</span>
        <span class="flex-none text-sm" style="color: var(--bw-muted)">· {{ progress }} abgeschlossen</span>
        <span class="bw-state bw-state--confirmed flex-none"><UIcon name="i-ph-check" /> Gespeichert</span>
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
