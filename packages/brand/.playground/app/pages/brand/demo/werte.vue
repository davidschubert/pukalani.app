<script setup lang="ts">
import type { BwMessage } from '../../../../../app/components/BwGeorge.vue'
import { demoRail } from '../../../utils/demoRail'

/** Clickdummy Baustein C (Werte) — geskripteter Dialog aus der
 *  P0-Inhaltsspez (C-P3 → Kandidaten → Auswahl). Statisch, keine KI. */
const messages = ref<BwMessage[]>([
  { id: 'm1', role: 'george', text: 'Zwei Dinge aus deinem Kontext klingen schon nach Werten: Du hast Verlässlichkeit betont — und dass ihr lieber absagt, als halbe Arbeit zu liefern.', help: 'Ich frage jetzt drei Dinge, dann schlage ich Wertewörter vor.' },
  { id: 'm2', role: 'george', text: 'Welches Verhalten würdest du nie dulden — auch nicht vom bestzahlenden Kunden?' },
])
const phase = ref<'ask' | 'candidates' | 'done'>('ask')
const picked = ref<string[]>([])

const candidateChips = [
  { id: 'handwerk', label: 'Handwerk' },
  { id: 'klartext', label: 'Klartext', recommended: true },
  { id: 'verlaesslichkeit', label: 'Verlässlichkeit' },
  { id: 'naehe', label: 'Nähe' },
  { id: 'eigensinn', label: 'Eigensinn' },
  { id: 'ruhe', label: 'Ruhe' },
]

function answer(text: string) {
  messages.value.push({ id: `u${Date.now()}`, role: 'user', text })
  if (phase.value === 'ask') {
    phase.value = 'candidates'
    messages.value.push(
      { id: 'm3', role: 'george', text: 'Das passt zu dem, was du vorhin über abgesagte Projekte gesagt hast — da steckt eine klare Grenze drin.' },
      { id: 'm4', role: 'george', text: 'Hier sind sechs Wertewörter aus deinen Antworten. Wähle 3 bis 5 — welche würdest du verteidigen, auch wenn es Geld kostet?', help: 'Jeder Vorschlag hat eine Herleitung — tippe ein Wort an, um sie zu sehen.' },
    )
  }
}
function pick(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter(p => p !== id) : [...picked.value, id]
}
function confirmPick() {
  phase.value = 'done'
  messages.value.push(
    { id: `u${Date.now()}`, role: 'user', text: picked.value.map(p => candidateChips.find(c => c.id === p)?.label).join(', ') },
    { id: 'm5', role: 'george', text: 'Gut — ich habe für jeden Wert einen Definitions-Entwurf ins Dokument gelegt. Lies sie auf der Bühne gegen: Stimmt „Klartext" so, wie ich es formuliert habe?' },
  )
}
</script>

<template>
  <BwWorkspace brand-title="Kailua Coffee Co." content-locale="en">
    <template #rail>
      <BwProgressRail :layers="demoRail" />
    </template>

    <template #default>
      <p class="text-xs uppercase tracking-widest" style="color: var(--bw-muted)">Brand Foundation</p>
      <h1 class="mt-1 text-2xl">Kailua Coffee Co.</h1>

      <BwChapter title="Purpose" state="confirmed">
        <p style="color: var(--bw-ink-soft)">We exist so that busy people on Oʻahu get one honest, quiet moment a day — a cup that was grown, roasted and served by people they can name.</p>
      </BwChapter>

      <BwChapter title="Werte" :state="phase === 'done' ? 'draft' : 'empty'">
        <template v-if="phase === 'done'">
          <ul class="space-y-2.5">
            <li><strong>Klartext</strong> → Wir sagen Preise, Herkunft und Grenzen, bevor jemand fragt.</li>
            <li><strong>Handwerk</strong> → Lieber eine Röstung perfekt als fünf Sorten mittelmäßig.</li>
            <li><strong>Nähe</strong> → Unsere Gäste kennen den Namen der Person, die ihre Bohnen geröstet hat.</li>
          </ul>
        </template>
        <p v-else style="color: var(--bw-muted)">George stellt dir gerade die Werte-Fragen — dieses Kapitel füllt sich, sobald ihr die Kandidaten habt.</p>
      </BwChapter>

      <BwChapter title="Archetyp & Stimme" state="stale" stale-note="Deine Purpose-Änderung von gestern betrifft dieses Kapitel — George rechnet es nach der Bestätigung neu.">
        <p style="color: var(--bw-muted)">Wartet auf die neue Werte-Grundlage.</p>
      </BwChapter>
    </template>

    <template #george>
      <BwGeorge :messages="messages" @send="answer">
        <template #chips>
          <div v-if="phase === 'ask'" class="pl-9">
            <BwChips
              :options="[{ id: 'a1', label: 'Druck, Qualität zu opfern' }, { id: 'a2', label: 'Respektlosigkeit im Ton' }, { id: 'a3', label: 'Intransparenz bei Geld' }]"
              @pick="(id) => answer(({ a1: 'Druck, Qualität zu opfern', a2: 'Respektlosigkeit im Ton', a3: 'Intransparenz bei Geld' } as Record<string, string>)[id]!)"
              @dont-know="answer('Weiß ich nicht')"
            />
          </div>
          <div v-else-if="phase === 'candidates'" class="space-y-3 pl-9">
            <BwChips :options="candidateChips" :selected="picked" :show-dont-know="false" multi @pick="pick" />
            <UButton v-if="picked.length >= 3" size="sm" icon="i-ph-check" :label="`${picked.length} Werte übernehmen`" @click="confirmPick" />
            <p v-else class="text-xs" style="color: var(--bw-muted)">Wähle mindestens 3.</p>
          </div>
        </template>
      </BwGeorge>
    </template>
  </BwWorkspace>
</template>
