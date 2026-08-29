<script setup lang="ts">
/** Clickdummy: Journal (Phase-2-Vorgeschmack) — kein Blog, sondern der
 *  Einstieg in den Brand Knowledge Graph: Topics, Artikel,
 *  Brand-Profile und Rankings verknüpft. Statisch. */
const topics = ['Brand Strategy', 'Visual Identity', 'Rebranding', 'Brand Psychology', 'Brand Analysis']
const activeTopic = ref<string | null>(null)

const articles = [
  { topic: 'Rebranding', title: 'Was kostet ein Rebranding wirklich?', dek: 'Die Frage aus tausend Kommentarspalten — beantwortet mit echten Zahlen statt „kommt drauf an".', meta: 'David S. · 7 Min' },
  { topic: 'Brand Psychology', title: 'Warum Banken blau sind — und wann du es nicht sein solltest', dek: 'Farbpsychologie zwischen Forschung und Folklore: was belegt ist, was Mythos.', meta: 'Lena K. · 6 Min' },
  { topic: 'Brand Analysis', title: 'IKEA: Wie ein Möbelhaus zur Weltmarke wurde', dek: 'Konsequenz schlägt Kampagne — eine Anatomie in fünf Entscheidungen.', meta: 'Jonas T. · 9 Min', video: 'Mit Video · The Futur' },
  { topic: 'Brand Strategy', title: 'Der Content-Kompass: 3–5 Säulen statt Posting-Panik', dek: 'Warum „Was poste ich heute?" eine Strategie-Frage ist — und keine Kreativ-Frage.', meta: 'Lena K. · 5 Min' },
  { topic: 'Brand Language', title: 'Tagline vs. Slogan: der Unterschied, der Geld kostet', dek: 'Eine bleibt, einer wirbt — und warum Verwechslung teuer wird.', meta: 'David S. · 4 Min' },
  { topic: 'SEO & GEO', title: 'llms.txt: Wie KI-Assistenten deine Marke zitieren', dek: 'Der neue Auffindbarkeits-Kanal — und warum dein brand.json dafür schon bereitliegt.', meta: 'Jonas T. · 6 Min' },
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
      <div class="mb-2 flex items-end justify-between gap-4">
        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Journal</p>
          <h1 class="mt-1 text-4xl leading-tight">Markenwissen, das trägt</h1>
        </div>
        <UButton to="/brand/demo/discover" icon="i-ph-compass" label="Discover" size="lg" color="neutral" variant="ghost" class="rounded-full" />
      </div>
      <p class="bw-label" style="color: var(--bw-muted)">Artikel, Brand-Profile und Rankings — verknüpft statt verbloggt.</p>

      <!-- Topics -->
      <div class="mt-8 flex flex-wrap items-center gap-2">
        <span class="bw-label" style="color: var(--bw-muted)">Topics</span>
        <button
          v-for="t in topics" :key="t"
          class="bw-select-card rounded-full px-4 py-2 text-sm"
          :class="activeTopic === t ? 'bw-select-card--on' : ''"
          @click="activeTopic = activeTopic === t ? null : t"
        >{{ t }}</button>
      </div>

      <!-- Featured -->
      <NuxtLink to="/brand/demo/artikel" class="bw-grain-hero mt-6 block p-10" style="--hero-a: #efe6db; --hero-b: #a89684; --hero-c: #2e2822">
        <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Rebranding · 8 Min</p>
        <p class="mt-3 max-w-xl text-3xl font-extralight leading-snug tracking-tight">Warum Luxusmarken ihre Serifen aufgeben</p>
        <p class="mt-4 max-w-xl text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">Burberry, Saint Laurent, Balenciaga — und jetzt alle gleich? Was hinter der großen Vereinheitlichung steckt, und wann sie ein Fehler ist.</p>
        <p class="bw-label mt-6" style="color: rgb(247 242 234 / 0.6)">Lena K. · Weiterführend: das Quellvideo ist eingebettet</p>
      </NuxtLink>

      <!-- Artikel -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="a in articles" :key="a.title" class="bw-card bw-card--hover flex flex-col p-6">
          <p class="bw-label" style="color: var(--bw-muted)">{{ a.topic }}</p>
          <h3 class="mt-2 font-semibold leading-snug">{{ a.title }}</h3>
          <p class="mt-2 flex-1 text-sm" style="color: var(--bw-ink-soft)">{{ a.dek }}</p>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">{{ a.meta }}</p>
            <p v-if="a.video" class="bw-label flex items-center gap-1" style="color: var(--bw-muted)"><UIcon name="i-ph-play-circle" class="size-3.5" />{{ a.video }}</p>
          </div>
        </div>
      </div>

      <!-- Brand-Profile + Ranking -->
      <div class="mt-10 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div>
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="text-lg font-medium">Brand-Profile</h2>
            <p class="bw-label" style="color: var(--bw-muted)">Bewertet mit dem Brand-Score-System</p>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <NuxtLink v-for="pr in profiles" :key="pr.name" to="/brand/demo/profil" class="bw-card bw-card--hover block p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-semibold">{{ pr.name }}</p>
                  <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ pr.line }}</p>
                </div>
                <BwScoreRing :value="pr.score" :size="36" class="flex-none" />
              </div>
              <p class="bw-label mt-4" style="color: var(--bw-muted)">Profil, Artikel & Verlauf</p>
            </NuxtLink>
          </div>
        </div>
        <div>
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="text-lg font-medium">Rankings</h2>
            <p class="bw-label" style="color: var(--bw-muted)">Kuratiert</p>
          </div>
          <div class="bw-card bw-card--hover mt-4 p-6">
            <p class="bw-label" style="color: var(--bw-muted)">Ranking · 2026</p>
            <h3 class="mt-2 font-semibold leading-snug">Die 30 besten Tech-Brands — nach Branding-Qualität, nicht Unternehmenswert</h3>
            <p class="mt-2 text-sm" style="color: var(--bw-ink-soft)">Bewertet mit denselben 40 Prüfkriterien wie jede Brand auf dieser Plattform.</p>
          </div>
        </div>
      </div>

      <p class="bw-pending mt-10 text-center">Dummy-Vorgeschmack auf Phase 2 — Artikel entstehen aus Research-Signalen, nie aus fremden Inhalten; Quellvideos werden genannt und eingebettet.</p>
    </div>
  </div>
</template>
