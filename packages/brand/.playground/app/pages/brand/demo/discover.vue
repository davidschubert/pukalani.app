<script setup lang="ts">
/** Clickdummy: Discover (Phase-2-Vorgeschmack) — visuelle GALERIE:
 *  die Farbwelt der Brand IST die Karte (Kachel mit Overlay), im
 *  Unterschied zum redaktionellen Journal (Liste) und zum
 *  Anatomie-Dossier. Statisch. */
const filters = ['Alle', 'Neue Marke', 'Marken-Relaunch']
const activeFilter = ref('Alle')
const sorts = ['Brand Score', 'Am besten bewertet', 'Trending', 'Neueste']
const activeSort = ref('Brand Score')
const archetypes = ['Der Weise', 'Der Entdecker', 'Der Schöpfer', 'Der Fürsorgliche', 'Der Held']
const activeArchetype = ref<string | null>(null)
/* Zweite Taxonomie-Achse (Davids Notiz 2026-08-30): visueller Stil ist
 * vom Archetyp GETRENNT — ein Entdecker kann minimal oder verspielt
 * auftreten. Facetten-Suche kombiniert beide. */
const styles = ['Minimal', 'Editorial', 'Verspielt', 'Organisch', 'Luxus']
const activeStyle = ref<string | null>(null)
const positions = ['Premium', 'Mass Market', 'Accessible Luxury', 'Disruptiv']
const activePosition = ref<string | null>(null)

const brands = [
  { name: 'Kailua Coffee Co.', meta: 'Café · Neue Marke', archetype: 'Der Weise', score: 87, votes: 128, a: '#e8d3b8', b: '#b98a5e', c: '#4a3123' },
  { name: 'Nordlicht Physio', meta: 'Gesundheit · Neue Marke', archetype: 'Der Fürsorgliche', score: 91, votes: 96, a: '#dbe9ec', b: '#7fb0ba', c: '#25454c' },
  { name: 'Bergwerk Studio', meta: 'Design · Marken-Relaunch', archetype: 'Der Schöpfer', score: 84, votes: 214, before: true, a: '#e6e2da', b: '#8f867a', c: '#2b2723' },
  { name: 'Mila & Ben', meta: 'Kinderladen · Neue Marke', archetype: 'Der Unschuldige', score: 78, votes: 61, a: '#f3e3e0', b: '#dba38f', c: '#5c3128' },
  { name: 'Faltwerk Architektur', meta: 'Architektur · Marken-Relaunch', archetype: 'Der Herrscher', score: 89, votes: 173, before: true, a: '#e4e6e2', b: '#9aa398', c: '#333a34' },
  { name: 'Trailtage', meta: 'Outdoor · Neue Marke', archetype: 'Der Entdecker', score: 82, votes: 145, a: '#e2ead9', b: '#89a06b', c: '#2f3d22' },
  { name: 'Studio Anker', meta: 'Agentur · Marken-Relaunch', archetype: 'Der Schöpfer', score: 86, votes: 88, a: '#e3e6ec', b: '#8792ab', c: '#2c3247' },
  { name: 'Backhaus Lore', meta: 'Bäckerei · Neue Marke', archetype: 'Der Jedermann', score: 80, votes: 132, a: '#f0e6d8', b: '#c9a06a', c: '#54381f' },
]

/** Brand of the Day als UCarousel: rechts blättern die Karten, der
 *  linke Text folgt dem aktiven Eintrag (select-Event). */
const days = [
  { name: 'Nordlicht Physio', quote: '„Wir behandeln Menschen, keine Befunde."', line: 'Nordlicht Physio — der Fürsorgliche mit klarer Kante, aus Kiel. Kuratiert vom Team.', score: 91, sub: 'Brand Score — der Fürsorgliche · 96 Stimmen', a: '#dbe9ec', b: '#7fb0ba', c: '#25454c' },
  { name: 'Kailua Coffee Co.', quote: '„One honest, quiet moment a day."', line: 'Kailua Coffee Co. — der Weise unter den Cafés, von Oʻahu. Kuratiert vom Team.', score: 87, sub: 'Brand Score — der Weise · 128 Stimmen', a: '#e8d3b8', b: '#b98a5e', c: '#4a3123' },
  { name: 'Faltwerk Architektur', quote: '„Wir bauen Ruhe."', line: 'Faltwerk Architektur — der Herrscher nach mutigem Relaunch, aus Wien. Kuratiert vom Team.', score: 89, sub: 'Brand Score — der Herrscher · 173 Stimmen', a: '#e4e6e2', b: '#9aa398', c: '#333a34' },
]
const dayIndex = ref(0)
const day = computed(() => days[dayIndex.value] ?? days[0])
const dayCarousel = ref<{ emblaApi?: { scrollPrev: () => void, scrollNext: () => void } } | null>(null)

const creators = [
  { initials: 'LK', name: 'Lena K.', line: '3 Brandings · Ø 88' },
  { initials: 'DS', name: 'David S.', line: '2 Brandings · Ø 86' },
  { initials: 'JT', name: 'Jonas T.', line: '2 Brandings · Ø 80' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="@container mx-auto max-w-7xl">
      <div class="mb-2 text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Discover Brands</p>
        <h1 class="mt-1 text-4xl leading-tight">Marken, gebaut mit George</h1>
      </div>
      <p class="bw-label text-center" style="color: var(--bw-muted)">Jede Brand hier ist freiwillig öffentlich — mit ihrer ganzen Anatomie.</p>

      <!-- Brand of the Day: Split-Aufmacher, Karte mit Stapel dahinter -->
      <div class="mt-16 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand of the Day</p>
          <h2 class="mt-4 max-w-lg text-balance text-4xl font-extralight leading-tight tracking-tight sm:text-5xl">{{ day.quote }}</h2>
          <p class="mt-5 max-w-md text-lg leading-relaxed" style="color: var(--bw-ink-soft)">{{ day.line }}</p>
          <UButton to="/brand/demo/anatomie" label="Anatomie ansehen" trailing-icon="i-ph-arrow-right" class="mt-8 rounded-full" />
        </div>
        <div>
          <!-- Runde 176 (David): Ueberblenden statt Schieben (Embla-Fade). -->
          <UCarousel
            ref="dayCarousel" v-slot="{ item }" :items="days" loop fade
            class="w-full" :ui="{ item: 'basis-full' }"
            @select="dayIndex = $event"
          >
            <NuxtLink to="/brand/demo/anatomie" class="bw-tile bw-tile--lg bw-on-dark group relative flex flex-col justify-between overflow-hidden p-8" :style="`aspect-ratio: 1 / 1; background: linear-gradient(165deg, ${item.a} 0%, ${item.b} 45%, ${item.c} 100%)`">
              <p class="text-xl font-medium" style="color: #f7f2ea">{{ item.name }}</p>
              <div>
                <p class="text-6xl font-extralight leading-none tracking-tight" style="color: #f7f2ea">{{ item.score }}</p>
                <p class="mt-3 text-sm" style="color: rgb(247 242 234 / 0.85)">{{ item.sub }}</p>
                <p class="bw-label mt-5 inline-flex items-center gap-1.5" style="color: rgb(247 242 234 / 0.8)">Weiterlesen <UIcon name="i-ph-arrow-right" class="size-3.5 transition-transform group-hover:translate-x-0.5" /></p>
              </div>
            </NuxtLink>
          </UCarousel>
        </div>
      </div>
      <!-- Pfeile mittig unter dem GANZEN Aufmacher — sie blaettern auch
           Headline und Copy links mit. -->
      <div class="mt-8 flex justify-center gap-2">
        <button class="grid size-9 place-items-center rounded-full" style="background: var(--bw-surface-hi); color: var(--bw-muted)" aria-label="Vorheriges Branding" @click="dayCarousel?.emblaApi?.scrollPrev()"><UIcon name="i-ph-arrow-left" class="size-4" /></button>
        <button class="grid size-9 place-items-center rounded-full" style="background: var(--bw-surface-hi); color: var(--bw-ink)" aria-label="Nächstes Branding" @click="dayCarousel?.emblaApi?.scrollNext()"><UIcon name="i-ph-arrow-right" class="size-4" /></button>
      </div>

      <!-- Filter & Sortierung -->
      <div class="mt-20 flex flex-wrap items-center gap-2">
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
        <span class="mx-2 h-5 w-px" style="background: var(--bw-line-strong)" />
        <span class="bw-label" style="color: var(--bw-muted)">Stil</span>
        <button
          v-for="s in styles" :key="s"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeStyle === s ? 'bw-select-card--on' : ''"
          @click="activeStyle = activeStyle === s ? null : s"
        >{{ s }}</button>
        <span class="mx-2 h-5 w-px" style="background: var(--bw-line-strong)" />
        <span class="bw-label" style="color: var(--bw-muted)">Positionierung</span>
        <button
          v-for="p in positions" :key="p"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activePosition === p ? 'bw-select-card--on' : ''"
          @click="activePosition = activePosition === p ? null : p"
        >{{ p }}</button>
        <span class="ml-auto" />
        <USelect v-model="activeSort" :items="sorts" color="neutral" variant="ghost" class="w-48 justify-between rounded-full text-sm focus-visible:outline-none" :ui="{ base: 'px-4 py-2' }" style="background: var(--bw-surface-hi)" />
      </div>

      <!-- Galerie-Wand: die Farbwelt ist die Karte -->
      <div class="mt-10 grid gap-x-6 gap-y-20 @sm:grid-cols-2 @md:grid-cols-4">
        <NuxtLink
          v-for="brand in brands" :key="brand.name" to="/brand/demo/anatomie"
          class="group block"
        >
          <div class="bw-tile relative overflow-hidden" style="aspect-ratio: 1 / 1">
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
      <BwSiteFooter />
    </div>
  </div>
</template>
