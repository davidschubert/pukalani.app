<script setup lang="ts">
/** Clickdummy: Discover (Phase-2-Vorgeschmack) — öffentliche Galerie
 *  mit Score, Kuration und den Alleinstellungs-Filtern. Statisch. */
const filters = ['Alle', 'Neugründung', 'Rebrand']
const activeFilter = ref('Alle')
const sorts = ['Brand Score', 'Am besten bewertet', 'Trending', 'Neueste']
const activeSort = ref('Brand Score')
const archetypes = ['Sage', 'Explorer', 'Creator', 'Caregiver', 'Hero']
const activeArchetype = ref<string | null>(null)

const brands = [
  { name: 'Kailua Coffee Co.', meta: 'Café · Neugründung · 🇺🇸', archetype: 'Sage', score: 87, votes: 128, a: '#e8d3b8', b: '#b98a5e', c: '#4a3123' },
  { name: 'Nordlicht Physio', meta: 'Gesundheit · Neugründung', archetype: 'Caregiver', score: 91, votes: 96, a: '#dbe9ec', b: '#7fb0ba', c: '#25454c' },
  { name: 'Bergwerk Studio', meta: 'Design · Rebrand', archetype: 'Creator', score: 84, votes: 214, before: true, a: '#e6e2da', b: '#8f867a', c: '#2b2723' },
  { name: 'Mila & Ben', meta: 'Kinderladen · Neugründung', archetype: 'Innocent', score: 78, votes: 61, a: '#f3e3e0', b: '#dba38f', c: '#5c3128' },
  { name: 'Faltwerk Architektur', meta: 'Architektur · Rebrand', archetype: 'Ruler', score: 89, votes: 173, before: true, a: '#e4e6e2', b: '#9aa398', c: '#333a34' },
  { name: 'Trailtage', meta: 'Outdoor · Neugründung', archetype: 'Explorer', score: 82, votes: 145, a: '#e2ead9', b: '#89a06b', c: '#2f3d22' },
]

const creators = [
  { initials: 'LK', name: 'Lena K.', line: '3 Brandings · Ø 88' },
  { initials: 'DS', name: 'David S.', line: '2 Brandings · Ø 86' },
  { initials: 'JT', name: 'Jonas T.', line: '2 Brandings · Ø 80' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-5xl">
      <div class="mb-2 flex items-end justify-between gap-4">
        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Discover</p>
          <h1 class="mt-1 text-4xl leading-tight">Marken, gebaut mit George</h1>
        </div>
        <UButton icon="i-ph-plus" label="Starte deine eigene" size="lg" class="rounded-full" />
      </div>
      <p class="bw-label" style="color: var(--bw-muted)">Jede Brand hier ist freiwillig öffentlich — mit ihrer ganzen Anatomie.</p>

      <!-- Filter & Sortierung -->
      <div class="mt-8 flex flex-wrap items-center gap-2">
        <button
          v-for="f in filters" :key="f"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeFilter === f ? 'bw-select-card--on' : ''"
          @click="activeFilter = f"
        >{{ f }}</button>
        <span class="mx-2 h-5 w-px" style="background: var(--bw-line-strong)" />
        <button
          v-for="a in archetypes" :key="a"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeArchetype === a ? 'bw-select-card--on' : ''"
          @click="activeArchetype = activeArchetype === a ? null : a"
        >{{ a }}</button>
        <span class="ml-auto" />
        <select v-model="activeSort" class="bw-label rounded-full px-4 py-2.5" style="background: var(--bw-surface-hi); color: var(--bw-ink)">
          <option v-for="sv in sorts" :key="sv" :value="sv">{{ sv }}</option>
        </select>
      </div>

      <!-- Brand of the Day -->
      <div class="bw-grain-hero mt-6 p-10" style="--hero-a: #dbe9ec; --hero-b: #7fb0ba; --hero-c: #25454c">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Brand of the Day</p>
            <p class="mt-3 text-3xl font-extralight leading-snug tracking-tight">Nordlicht Physio</p>
            <p class="mt-2 max-w-md text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">„Wir behandeln Menschen, keine Befunde." — Caregiver mit klarer Kante, aus Kiel.</p>
            <p class="bw-label mt-5" style="color: rgb(247 242 234 / 0.6)">Kuratiert · Gesundheit · Neugründung</p>
          </div>
          <BwScoreRing :value="91" :size="72" label="Brand Score" class="flex-none" />
        </div>
      </div>

      <!-- Galerie -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="brand in brands" :key="brand.name" class="bw-card bw-card--hover overflow-hidden">
          <div class="relative h-24" :style="`background: linear-gradient(120deg, ${brand.a}, ${brand.b} 55%, ${brand.c})`">
            <span v-if="brand.before" class="bw-label absolute left-4 top-3 rounded-full px-2 py-0.5" style="background: rgb(20 20 20 / 0.45); color: #f7f2ea">Vorher / Nachher</span>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-semibold">{{ brand.name }}</h3>
                <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ brand.meta }}</p>
              </div>
              <BwScoreRing :value="brand.score" :size="36" class="flex-none" />
            </div>
            <div class="mt-4 flex items-center justify-between gap-3">
              <span class="bw-label rounded-full px-2.5 py-1" style="background: var(--bw-surface)">{{ brand.archetype }}</span>
              <span class="bw-label" style="color: var(--bw-muted)">{{ brand.votes }} Stimmen</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Creators -->
      <div class="mt-10">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-medium">Featured Creators</h2>
          <p class="bw-label" style="color: var(--bw-muted)">Kuratiert vom Team</p>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div v-for="c in creators" :key="c.name" class="bw-card flex items-center gap-4 p-5">
            <UAvatar :text="c.initials" size="xl" />
            <div class="min-w-0">
              <p class="truncate font-medium">{{ c.name }}</p>
              <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ c.line }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="bw-pending mt-10 text-center">Dummy-Vorgeschmack auf Phase 2 — Bewertung in Dimensionen, Anatomie-Ansicht und Collections folgen dort.</p>
    </div>
  </div>
</template>
