<script setup lang="ts">
import type { BwMessage } from '../../../../../app/components/BwGeorge.vue'
import { demoRail } from '../../../utils/demoRail'

/** Clickdummy Baustein D — Paarvergleich (Interaktionstyp Bild-Karten). */
const round = ref(0)
const pairs = [
  { a: { id: 'sage', motto: 'Die Wahrheit macht euch frei', mood: 'Ruhig, fundiert, erklärt gern — der vertrauenswürdige Kopf im Raum.', brands: 'eine Bibliothek mit gutem Kaffee' }, b: { id: 'explorer', motto: 'Zäunt mich nicht ein', mood: 'Unabhängig, neugierig, immer einen Schritt vor der Karte.', brands: 'ein Pfad, den noch keiner gegangen ist' } },
  { a: { id: 'creator', motto: 'Was vorstellbar ist, ist baubar', mood: 'Erfinderisch, ausdrucksstark, verliebt ins Machen.', brands: 'eine Werkstatt mit offener Tür' }, b: { id: 'caregiver', motto: 'Kümmern ist keine Schwäche', mood: 'Warm, verlässlich, zuerst der Mensch.', brands: 'ein Ort, an dem man aufatmet' } },
]
const messages = ref<BwMessage[]>([
  { id: 'm1', role: 'george', text: 'Aus deinem Auftritt lese ich eine Hypothese: viel Sage, ein Rest Creator. Prüfen wir das — welcher der beiden Sätze ist eher ihr?', help: 'Kein Richtig oder Falsch. 8 kurze Paare, dann rechne ich dein Profil.' },
])
function pick() {
  if (round.value < pairs.length - 1) {
    round.value++
    messages.value.push({ id: `g${round.value}`, role: 'george', text: `Notiert. Paar ${round.value + 1} von 8:` })
  }
  else {
    messages.value.push({ id: 'gdone', role: 'george', text: 'Interessant — dein Selbstbild weicht vom Außenbild deiner Website ab. Das zeige ich dir gleich nebeneinander.' })
  }
}
</script>

<template>
  <BwWorkspace :progress-pct="86" content-locale="de">
    <template #brand>
      <BwBrandSwitcher :current="{ title: 'Schubert UX Studio', path: 'Rebrand · Inhalt: DE' }" :others="[{ title: 'Kailua Coffee Co.', path: 'Neugründung · Inhalt: EN', to: '/brand/demo/werte' }]" />
    </template>

    <template #rail>
      <BwProgressRail :layers="demoRail" />
    </template>

    <template #default>
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Foundation · Archetyp</p>
      <h1 class="mt-1 mb-6 text-2xl">Welcher Charakter ist eure Marke?</h1>
      <BwPairCompare :a="pairs[Math.min(round, pairs.length - 1)]!.a" :b="pairs[Math.min(round, pairs.length - 1)]!.b" @pick="pick" />
      <p class="mt-4 text-sm" style="color: var(--bw-muted)">Paar {{ Math.min(round + 1, 8) }} von 8 · Bauchgefühl reicht</p>
    </template>

    <template #george>
      <BwGeorge :messages="messages" @send="() => {}" />
    </template>
  </BwWorkspace>
</template>
