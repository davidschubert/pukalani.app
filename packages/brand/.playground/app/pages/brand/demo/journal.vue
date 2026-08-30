<script setup lang="ts">
/** Clickdummy: Journal (Phase-2-Vorgeschmack) — Übersicht nach dem
 *  Muster der OpenAI-News-Liste: Kategorien, Sortierung und ein
 *  Grid/List-Umschalter (synchronisiert mit ?display=, teilbare
 *  Ansicht). List = redaktionelle Zeitungs-Zeilen, Grid = Karten mit
 *  Farb-Thumbnails. Statisch. */
const route = useRoute()
const router = useRouter()

const topics = ['Brand Strategy', 'Visual Identity', 'Rebranding', 'Brand Psychology', 'Brand Analysis']
const activeTopic = ref<string | null>(null)
const sorts = ['Neueste', 'Meistgelesen', 'Kürzeste Lesezeit']
const activeSort = ref('Neueste')

const display = ref<'grid' | 'list'>(route.query.display === 'list' ? 'list' : 'grid')
watch(display, (d) => {
  router.replace({ query: { ...route.query, display: d } })
})

const articles = [
  { date: '27. Aug', topic: 'Rebranding', title: 'Was kostet ein Rebranding wirklich?', dek: 'Die Frage aus tausend Kommentarspalten — beantwortet mit echten Zahlen statt „kommt drauf an".', meta: 'David S. · 7 Min', a: '#efe6db', b: '#a89684' },
  { date: '24. Aug', topic: 'Brand Psychology', title: 'Warum Banken blau sind — und wann du es nicht sein solltest', dek: 'Farbpsychologie zwischen Forschung und Folklore: was belegt ist, was Mythos.', meta: 'Lena K. · 6 Min', a: '#dbe4ec', b: '#7f96ba' },
  { date: '21. Aug', topic: 'Brand Analysis', title: 'IKEA: Wie ein Möbelhaus zur Weltmarke wurde', dek: 'Konsequenz schlägt Kampagne — eine Anatomie in fünf Entscheidungen.', meta: 'Jonas T. · 9 Min', video: 'Mit Video', a: '#e9e4d3', b: '#b0a25e' },
  { date: '18. Aug', topic: 'Brand Strategy', title: 'Der Content-Kompass: 3–5 Säulen statt Posting-Panik', dek: 'Warum „Was poste ich heute?" eine Strategie-Frage ist — und keine Kreativ-Frage.', meta: 'Lena K. · 5 Min', a: '#e2ead9', b: '#89a06b' },
  { date: '14. Aug', topic: 'Brand Language', title: 'Tagline vs. Slogan: der Unterschied, der Geld kostet', dek: 'Eine bleibt, einer wirbt — und warum Verwechslung teuer wird.', meta: 'David S. · 4 Min', a: '#f3e3e0', b: '#dba38f' },
  { date: '11. Aug', topic: 'SEO & GEO', title: 'llms.txt: Wie KI-Assistenten deine Marke zitieren', dek: 'Der neue Auffindbarkeits-Kanal — und warum dein brand.json dafür schon bereitliegt.', meta: 'Jonas T. · 6 Min', a: '#e6e2da', b: '#8f867a' },
]

const profiles = [
  { name: 'Nike', line: 'Sport · Der Held', score: 94 },
  { name: 'IKEA', line: 'Einrichtung · Der Jedermann', score: 91 },
  { name: 'Rolex', line: 'Uhren · Der Herrscher', score: 89 },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-5xl">
      <BwSiteNav />
      <div class="mb-2">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Journal</p>
        <h1 class="mt-1 text-4xl leading-tight">Markenwissen, das trägt</h1>
      </div>
      <p class="bw-label" style="color: var(--bw-muted)">Artikel, Brand-Profile und Rankings — verknüpft statt verbloggt.</p>

      <!-- Werkzeugleiste: Kategorien · Sortierung · Ansicht -->
      <div class="mt-8 flex flex-wrap items-center gap-2">
        <button
          v-for="t in topics" :key="t"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeTopic === t ? 'bw-select-card--on' : ''"
          @click="activeTopic = activeTopic === t ? null : t"
        >{{ t }}</button>
        <div class="ml-auto flex items-center gap-2">
          <select v-model="activeSort" class="bw-label rounded-full px-4 py-2.5" style="background: var(--bw-surface-hi); color: var(--bw-ink)">
            <option v-for="sv in sorts" :key="sv" :value="sv">{{ sv }}</option>
          </select>
          <div class="flex items-center gap-1 rounded-full p-1" style="background: var(--bw-surface-hi)">
          <button
            class="grid size-8 place-items-center rounded-full transition-colors" :style="display === 'grid' ? 'background: var(--bw-ink); color: var(--bw-paper)' : 'color: var(--bw-muted)'"
            aria-label="Rasteransicht" @click="display = 'grid'"
          ><UIcon name="i-ph-squares-four" class="size-4" /></button>
          <button
            class="grid size-8 place-items-center rounded-full transition-colors" :style="display === 'list' ? 'background: var(--bw-ink); color: var(--bw-paper)' : 'color: var(--bw-muted)'"
            aria-label="Listenansicht" @click="display = 'list'"
          ><UIcon name="i-ph-list-bullets" class="size-4" /></button>
          </div>
        </div>
      </div>

      <!-- Featured: Text-Aufmacher zwischen Linien -->
      <NuxtLink to="/brand/demo/artikel" class="group mt-8 block border-y py-10" style="border-color: var(--bw-line-strong)">
        <p class="bw-label" style="color: var(--bw-muted)">Featured · Rebranding · 8 Min</p>
        <p class="mt-4 max-w-3xl text-balance text-4xl font-extralight leading-tight tracking-tight sm:text-5xl">Warum Luxusmarken ihre Serifen aufgeben</p>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Burberry, Saint Laurent, Balenciaga — und jetzt alle gleich? Was hinter der großen Vereinheitlichung steckt, und wann sie ein Fehler ist.</p>
        <p class="bw-label mt-6 inline-flex items-center gap-1.5" style="color: var(--bw-muted)">Lena K. · 29. August 2026 <UIcon name="i-ph-arrow-right" class="size-3.5 transition-transform group-hover:translate-x-0.5" /></p>
      </NuxtLink>

      <!-- Rasteransicht: Karten mit Farb-Thumbnails -->
      <div v-if="display === 'grid'" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="a in articles" :key="a.title" to="/brand/demo/artikel" class="bw-card bw-card--hover flex flex-col overflow-hidden">
          <div class="h-28" :style="`background: linear-gradient(135deg, ${a.b}, ${a.a})`" />
          <div class="flex flex-1 flex-col p-5">
            <p class="bw-label" style="color: var(--bw-muted)">{{ a.topic }} · {{ a.date }}</p>
            <h3 class="mt-1.5 font-medium leading-snug">{{ a.title }}</h3>
            <p class="mt-1.5 flex-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ a.dek }}</p>
            <p class="bw-label mt-3 flex items-center gap-2" style="color: var(--bw-muted)">
              {{ a.meta }}
              <span v-if="a.video" class="flex items-center gap-1"><UIcon name="i-ph-play-circle" class="size-3.5" />{{ a.video }}</span>
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Listenansicht: Zeitungs-Zeilen mit Datums-Spalte -->
      <div v-else>
        <NuxtLink v-for="a in articles" :key="a.title" to="/brand/demo/artikel" class="group grid gap-x-8 gap-y-1 border-b py-6 sm:grid-cols-[9rem_minmax(0,1fr)]" style="border-color: var(--bw-line)">
          <div>
            <p class="bw-label" style="color: var(--bw-muted)">{{ a.date }}</p>
            <p class="bw-label mt-1" style="color: var(--bw-muted)">{{ a.topic }}</p>
          </div>
          <div class="min-w-0">
            <h3 class="text-lg font-medium leading-snug">{{ a.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ a.dek }}</p>
            <p class="bw-label mt-2.5 flex items-center gap-2" style="color: var(--bw-muted)">
              {{ a.meta }}
              <span v-if="a.video" class="flex items-center gap-1"><UIcon name="i-ph-play-circle" class="size-3.5" />{{ a.video }}</span>
              <UIcon name="i-ph-arrow-right" class="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Brand-Profile + Rankings: kompakte Zeilen -->
      <div class="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <div>
          <div class="flex items-baseline justify-between gap-3 border-b pb-3" style="border-color: var(--bw-line-strong)">
            <h2 class="text-lg font-medium">Brand-Profile</h2>
            <p class="bw-label" style="color: var(--bw-muted)">Bewertet mit dem Brand-Score-System</p>
          </div>
          <div>
            <NuxtLink v-for="pr in profiles" :key="pr.name" to="/brand/demo/profil" class="group flex items-center gap-4 border-b py-4" style="border-color: var(--bw-line)">
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ pr.name }}</p>
                <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ pr.line }}</p>
              </div>
              <BwScoreRing :value="pr.score" :size="34" class="flex-none" />
              <UIcon name="i-ph-arrow-right" class="size-4 flex-none opacity-0 transition-opacity group-hover:opacity-100" style="color: var(--bw-muted)" />
            </NuxtLink>
          </div>
        </div>
        <div>
          <div class="flex items-baseline justify-between gap-3 border-b pb-3" style="border-color: var(--bw-line-strong)">
            <h2 class="text-lg font-medium">Rankings & Formate</h2>
            <p class="bw-label" style="color: var(--bw-muted)">Kuratiert</p>
          </div>
          <div>
            <div class="border-b py-4" style="border-color: var(--bw-line)">
              <p class="bw-label" style="color: var(--bw-muted)">Ranking · 2026</p>
              <p class="mt-1 font-medium leading-snug">Die 30 besten Tech-Brands — nach Branding-Qualität, nicht Unternehmenswert</p>
            </div>
            <NuxtLink to="/brand/demo/duell" class="group flex items-center justify-between gap-3 border-b py-4" style="border-color: var(--bw-line)">
              <div class="min-w-0">
                <p class="bw-label" style="color: var(--bw-muted)">Brand-Duell</p>
                <p class="mt-1 font-medium leading-snug">Nike vs. Adidas — der Direktvergleich</p>
              </div>
              <UIcon name="i-ph-arrow-right" class="size-4 flex-none opacity-0 transition-opacity group-hover:opacity-100" style="color: var(--bw-muted)" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <p class="bw-pending mt-12 text-center">Dummy-Vorgeschmack auf Phase 2 — Artikel entstehen aus Research-Signalen, nie aus fremden Inhalten; Quellvideos werden genannt und eingebettet.</p>
    </div>
  </div>
</template>
