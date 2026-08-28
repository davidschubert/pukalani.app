<script setup lang="ts">
/** Drei-Zonen-Werkstatt (UI-Vertrag §3d): Fortschritt | Bühne | George.
 *  Mobil (<768) zwei Vollbild-Modi; Eingaben bleiben gemountet (CSS-Hide). */
const props = defineProps<{ brandTitle: string, contentLocale: string }>()
const mode = ref<'stage' | 'george'>('george')
defineExpose({ mode })
void props
</script>

<template>
  <div class="bw-root bw-shell" :class="mode === 'stage' ? 'bw-mode-stage' : 'bw-mode-george'">
    <header class="bw-topbar">
      <span class="font-semibold truncate">{{ brandTitle }}</span>
      <span class="bw-state bw-state--confirmed"><UIcon name="i-ph-check" /> Gespeichert</span>
      <span class="ml-auto flex items-center gap-3 text-sm" style="color: var(--bw-muted)">
        <span class="hidden sm:inline-flex items-center gap-1"><UIcon name="i-ph-translate" /> Inhalt: {{ contentLocale.toUpperCase() }}</span>
        <UIcon name="i-ph-question" class="size-5" />
        <UIcon name="i-ph-user-circle" class="size-6" />
      </span>
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
