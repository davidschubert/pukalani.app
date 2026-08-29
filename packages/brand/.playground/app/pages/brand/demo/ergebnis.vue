<script setup lang="ts">
import type { BwMessage } from '../../../../../app/components/BwGeorge.vue'
import { demoRail } from '../../../utils/demoRail'

/** Clickdummy Iteration 2 — Ergebnis-Ansicht: die fertige Brand
 *  Foundation als EIN Stück (Grain-Hero + Kit-Vorschau). Statisch. */
const doneRail = demoRail.map(layer => layer.steps
  ? { ...layer, steps: layer.steps.map(step => ({ ...step, state: 'done' as const, slots: undefined, minutes: undefined })) }
  : layer)

const messages = ref<BwMessage[]>([
  { id: 'm1', role: 'george', text: 'Das ist sie — eure Brand Foundation, aus euren eigenen Antworten. Lies sie einmal laut: Wenn ein Satz nicht nach euch klingt, ändern wir ihn.', help: 'Jedes Kapitel bleibt bearbeitbar — das Buch rechnet dann nach.' },
  { id: 'm2', role: 'george', text: 'Wenn alles sitzt, bauen wir darauf euer Brand Design: Farben und Schrift kommen nicht aus dem Katalog, sondern aus dem, was hier steht.' },
])

const palette = [
  { hex: '#4a3123', name: 'Roast' },
  { hex: '#b98a5e', name: 'Crema' },
  { hex: '#e8d3b8', name: 'Milk' },
  { hex: '#2f4a3a', name: 'Palm' },
  { hex: '#f7f2ea', name: 'Paper' },
]
</script>

<template>
  <BwWorkspace :progress-pct="100" progress-note="21 von 21 Entscheidungen · Brand Foundation abgeschlossen" content-locale="en">
    <template #brand>
      <BwBrandSwitcher :current="{ title: 'Kailua Coffee Co.', path: 'Neugründung', flag: 'i-circle-flags-us' }" :others="[{ title: 'Schubert UX Studio', path: 'Rebrand', flag: 'i-circle-flags-de', to: '/brand/demo/archetyp' }]" />
    </template>

    <template #rail>
      <BwProgressRail :layers="doneRail" />
    </template>

    <template #default>
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Foundation · Ergebnis</p>
      <h1 class="mt-1 text-4xl leading-tight">Eure Brand Foundation ist fertig</h1>

      <!-- Grain-Hero: die Marke als ein Stück -->
      <div class="bw-grain-hero mt-6 p-10" style="--hero-a: #e8d3b8; --hero-b: #b98a5e; --hero-c: #4a3123">
        <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Kailua Coffee Co.</p>
        <p class="mt-4 max-w-xl text-3xl font-extralight leading-snug tracking-tight">
          One honest, quiet moment a day.
        </p>
        <p class="mt-6 max-w-xl text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">
          Kaffee mit nachvollziehbarer Herkunft — Anbau, Röstung, Ausschank aus einer Hand.
          Klartext, Handwerk, Nähe.
        </p>
        <p class="bw-label mt-8" style="color: rgb(247 242 234 / 0.6)">Sage · warm, aber nie anbiedernd · EN</p>
      </div>

      <!-- Kit-Vorschau -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <div class="bw-card p-8">
          <p class="bw-label" style="color: var(--bw-muted)">Farbwelt (Vorschlag)</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <div v-for="c in palette" :key="c.hex" class="flex flex-col items-center gap-1.5">
              <div class="rounded-full" :style="`background: ${c.hex}; width: 2.5rem; height: 2.5rem`" />
              <p class="bw-label" style="color: var(--bw-muted)">{{ c.name }}</p>
            </div>
          </div>
          <p class="bw-pending mt-3">Wird im Brand Design entschieden — hergeleitet aus eurer Foundation.</p>
        </div>
        <div class="bw-card p-8">
          <p class="bw-label" style="color: var(--bw-muted)">Typografie (Vorschlag)</p>
          <p class="mt-2 text-5xl font-extralight leading-none tracking-tight">Aa</p>
          <p class="mt-2 text-sm" style="color: var(--bw-ink-soft)">Ruhig und fundiert — eine Serifenlose mit Wärme, dazu eine Mono für die Herkunftsangaben.</p>
          <p class="bw-pending mt-3">Wird im Brand Design entschieden.</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-end gap-2">
        <UButton label="Foundation als PDF" icon="i-ph-file-pdf" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
        <UButton label="Weiter zu Brand Design" trailing-icon="i-ph-arrow-right" class="rounded-full" />
      </div>
    </template>

    <template #george>
      <BwGeorge :messages="messages" @send="() => {}" />
    </template>
  </BwWorkspace>
</template>
