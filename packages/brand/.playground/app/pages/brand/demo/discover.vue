<script setup lang="ts">
/** Clickdummy: Discover (Phase-2-Vorgeschmack) — visuelle GALERIE:
 *  die Farbwelt der Brand IST die Karte (Kachel mit Overlay), im
 *  Unterschied zum redaktionellen Journal (Liste) und zum
 *  Anatomie-Dossier. Statisch. */
const filters = ['Alle', 'Neugründung', 'Rebrand']
const activeFilter = ref('Alle')
const sorts = ['Brand Score', 'Am besten bewertet', 'Trending', 'Neueste']
const activeSort = ref('Brand Score')
const archetypes = ['Der Weise', 'Der Entdecker', 'Der Schöpfer', 'Der Fürsorgliche', 'Der Held']
const activeArchetype = ref<string | null>(null)

const brands = [
  { name: 'Kailua Coffee Co.', meta: 'Café · Neugründung', archetype: 'Der Weise', score: 87, votes: 128, a: '#e8d3b8', b: '#b98a5e', c: '#4a3123' },
  { name: 'Nordlicht Physio', meta: 'Gesundheit · Neugründung', archetype: 'Der Fürsorgliche', score: 91, votes: 96, a: '#dbe9ec', b: '#7fb0ba', c: '#25454c' },
  { name: 'Bergwerk Studio', meta: 'Design · Rebrand', archetype: 'Der Schöpfer', score: 84, votes: 214, before: true, a: '#e6e2da', b: '#8f867a', c: '#2b2723' },
  { name: 'Mila & Ben', meta: 'Kinderladen · Neugründung', archetype: 'Der Unschuldige', score: 78, votes: 61, a: '#f3e3e0', b: '#dba38f', c: '#5c3128' },
  { name: 'Faltwerk Architektur', meta: 'Architektur · Rebrand', archetype: 'Der Herrscher', score: 89, votes: 173, before: true, a: '#e4e6e2', b: '#9aa398', c: '#333a34' },
  { name: 'Trailtage', meta: 'Outdoor · Neugründung', archetype: 'Der Entdecker', score: 82, votes: 145, a: '#e2ead9', b: '#89a06b', c: '#2f3d22' },
  { name: 'Studio Anker', meta: 'Agentur · Rebrand', archetype: 'Der Schöpfer', score: 86, votes: 88, a: '#e3e6ec', b: '#8792ab', c: '#2c3247' },
  { name: 'Backhaus Lore', meta: 'Bäckerei · Neugründung', archetype: 'Der Jedermann', score: 80, votes: 132, a: '#f0e6d8', b: '#c9a06a', c: '#54381f' },
]

const creators = [
  { initials: 'LK', name: 'Lena K.', line: '3 Brandings · Ø 88' },
  { initials: 'DS', name: 'David S.', line: '2 Brandings · Ø 86' },
  { initials: 'JT', name: 'Jonas T.', line: '2 Brandings · Ø 80' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="@container mx-auto max-w-7xl">
      <BwSiteNav />
      <div class="mb-2 text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Discover</p>
        <h1 class="mt-1 text-4xl leading-tight">Marken, gebaut mit George</h1>
      </div>
      <p class="bw-label text-center" style="color: var(--bw-muted)">Jede Brand hier ist freiwillig öffentlich — mit ihrer ganzen Anatomie.</p>

      <!-- Filter & Sortierung -->
      <div class="mt-8 flex flex-wrap items-center gap-2">
        <button
          v-for="f in filters" :key="f"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeFilter === f ? 'bw-select-card--on' : ''"
          @click="activeFilter = f"
        >{{ f }}</button>
        <span class="mx-2 h-5 w-px" style="background: var(--bw-line-strong)" />
        <span class="bw-label" style="color: var(--bw-muted)">Archetyp</span>
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
      <NuxtLink to="/brand/demo/anatomie" class="bw-grain-hero mt-6 block p-10" style="--hero-a: #dbe9ec; --hero-b: #7fb0ba; --hero-c: #25454c">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Brand of the Day</p>
            <p class="mt-3 text-3xl font-extralight leading-snug tracking-tight">Nordlicht Physio</p>
            <p class="mt-2 max-w-md text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">„Wir behandeln Menschen, keine Befunde." — der Fürsorgliche mit klarer Kante, aus Kiel.</p>
            <p class="bw-label mt-5" style="color: rgb(247 242 234 / 0.6)">Kuratiert · Gesundheit · Neugründung</p>
          </div>
          <BwScoreRing :value="91" :size="72" label="Brand Score" class="flex-none" />
        </div>
      </NuxtLink>

      <!-- Galerie-Wand: die Farbwelt ist die Karte -->
      <div class="mt-6 grid gap-x-6 gap-y-20 @sm:grid-cols-2 @md:grid-cols-4">
        <NuxtLink
          v-for="brand in brands" :key="brand.name" to="/brand/demo/anatomie"
          class="group block"
        >
          <div class="relative overflow-hidden rounded-[1.25rem]" style="aspect-ratio: 1 / 1">
            <div class="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]" :style="`background: linear-gradient(165deg, ${brand.a} 0%, ${brand.b} 45%, ${brand.c} 100%)`" />
            <span v-if="brand.before" class="bw-label absolute left-4 top-4 rounded-full px-2.5 py-1" style="background: rgb(20 20 20 / 0.45); color: #f7f2ea">Vorher / Nachher</span>
            <p class="absolute inset-0 grid place-items-center p-6 text-center text-2xl font-extralight leading-snug tracking-tight" style="color: #f7f2ea; text-shadow: 0 1px 12px rgb(20 20 20 / 0.3)">{{ brand.name }}</p>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">{{ brand.meta }} · {{ brand.archetype }} · {{ brand.votes }} Stimmen</p>
            <BwScoreRing :value="brand.score" :size="34" class="flex-none" />
          </div>
        </NuxtLink>
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
