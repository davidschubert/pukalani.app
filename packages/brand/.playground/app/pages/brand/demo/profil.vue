<script setup lang="ts">
/** Clickdummy: Brand-Profil einer externen Marke (Nike) — die
 *  Entity-Seite des Knowledge Graph: Score v2 komplett, eigenständige
 *  Markenzeichen, Historie, Beziehungen, Artikel, Vergleich. Statisch;
 *  nominative Markennennung, keine fremden Logos als Assets. */
const dims = [
  { label: 'Eigenständigkeit', value: 97 },
  { label: 'Visuelle Identität', value: 95 },
  { label: 'Konsistenz', value: 94 },
  { label: 'Markenerlebnis', value: 93 },
  { label: 'Positionierung & Klarheit', value: 92 },
  { label: 'Emotionale Wirkung', value: 96 },
  { label: 'Anpassungsfähigkeit', value: 94 },
  { label: 'Handwerk', value: 90 },
]
function tone(v: number): string {
  return v >= 90 ? 'var(--bw-accent)' : v >= 50 ? 'var(--bw-draft)' : 'var(--bw-stale)'
}
const assets = [
  { label: 'Symbol', text: 'Der Swoosh — seit 1995 stark genug, um ohne Namen zu stehen.' },
  { label: 'Claim', text: '„Just Do It" (1988) — Haltung statt Produktversprechen.' },
  { label: 'Typografie', text: 'Kondensierte Grotesk, versal — laut, ohne zu schreien.' },
  { label: 'Farbe', text: 'Schwarz/Weiß als System, Volt als Signal.' },
]
const timeline = [
  { year: '1964', text: 'Gegründet als Blue Ribbon Sports.' },
  { year: '1971', text: 'Name Nike + Swoosh (Carolyn Davidson, 35 $).' },
  { year: '1988', text: '„Just Do It" — Wieden+Kennedy.' },
  { year: '1995', text: 'Wortmarke entfällt: das Symbol trägt allein.' },
]
const articles = [
  { topic: 'Brand Analysis', title: 'Die Evolution der visuellen Identität von Nike' },
  { topic: 'Brand Psychology', title: 'Warum der Swoosh ohne Namen funktioniert' },
  { topic: 'Brand Strategy', title: 'Nike vs. Adidas: zwei Helden, zwei Systeme' },
]
const competitors = [
  { name: 'Adidas', score: 91 },
  { name: 'On', score: 88 },
  { name: 'Puma', score: 84 },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="mx-auto max-w-7xl">
      <div class="mx-auto max-w-4xl">
      <NuxtLink to="/brand/demo/journal" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
        <UIcon name="i-ph-arrow-left" class="size-4" /> Brand Insights
      </NuxtLink>

      <!-- Hero -->
      <div class="bw-grain-hero mt-4 p-10" style="--hero-a: #d8d8d6; --hero-b: #5a5a58; --hero-c: #151515">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Brand-Profil</p>
            <p class="mt-3 text-3xl font-extralight leading-snug tracking-tight">Nike</p>
            <p class="mt-2 max-w-md text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">Der Held unter den Weltmarken: ein Symbol, das ohne Namen trägt — und ein System, das seit Jahrzehnten kaum einen Fehltritt macht.</p>
            <p class="bw-label mt-5" style="color: rgb(247 242 234 / 0.6)">Sport · USA · seit 1971 · Der Held</p>
          </div>
          <div class="bw-on-dark flex flex-none flex-col items-center gap-1 rounded-2xl px-4 py-3" style="background: rgb(20 20 20 / 0.35)">
            <BwScoreRing :value="94" :size="80" label="Brand Score" />
            <p class="bw-label" style="color: rgb(247 242 234 / 0.7)">Außergewöhnlich</p>
          </div>
        </div>
      </div>

      <!-- Score im Detail + Verlauf -->
      <div class="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div class="bw-card p-8">
          <div class="flex items-baseline justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">Score im Detail</p>
            <p class="bw-label" style="color: var(--bw-muted)">40 Prüfkriterien · 27 Quellen</p>
          </div>
          <div class="mt-5 space-y-3">
            <div v-for="d in dims" :key="d.label" class="grid grid-cols-[12rem_1fr_2.5rem] items-center gap-3">
              <p class="bw-label truncate" style="color: var(--bw-muted)">{{ d.label }}</p>
              <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
                <div class="h-full rounded-full" :style="`width: ${d.value}%; background: ${tone(d.value)}`" />
              </div>
              <p class="bw-label text-right" :style="`color: ${tone(d.value)}`">{{ d.value }}</p>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="bw-card p-8">
            <div class="flex items-baseline justify-between gap-3">
              <p class="bw-label" style="color: var(--bw-muted)">Score-Verlauf</p>
              <p class="bw-label" style="color: var(--bw-muted)">seit 2020</p>
            </div>
            <BwSparkline :values="[89, 90, 90, 91, 92, 92, 93, 93, 94, 94]" :width="220" :height="40" class="mt-4" style="color: var(--bw-line-strong)" />
            <p class="bw-pending mt-3">Jede Neubewertung nach Rebrands und neuen Fällen.</p>
          </div>
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Steckbrief</p>
            <ul class="mt-3 space-y-2 text-sm" style="color: var(--bw-ink-soft)">
              <li>Kategorie: Sportartikel</li>
              <li>Archetyp: Der Held · Rest Rebell</li>
              <li>Visual Style: Bold · Minimal · Athletic</li>
              <li>Personality: Confident · Energetic</li>
              <li>Positionierung: Premium Mass Market</li>
              <li>Agentur-Beziehung: Wieden+Kennedy (seit 1982)</li>
              <li>Zeichen: Swoosh, symbol-only seit 1995</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Eigenständige Markenzeichen -->
      <div class="bw-card mt-4 p-8">
        <p class="bw-label" style="color: var(--bw-muted)">Eigenständige Markenzeichen</p>
        <div class="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div v-for="a in assets" :key="a.label">
            <p class="bw-label" style="color: var(--bw-muted)">{{ a.label }}</p>
            <p class="mt-1 text-sm" style="color: var(--bw-ink-soft)">{{ a.text }}</p>
          </div>
        </div>
      </div>

      <!-- Historie + Wettbewerb -->
      <div class="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div class="bw-card p-8">
          <p class="bw-label" style="color: var(--bw-muted)">Marken-Historie</p>
          <ul class="mt-4 space-y-3">
            <li v-for="t in timeline" :key="t.year" class="grid grid-cols-[3.5rem_1fr] gap-3">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t.year }}</p>
              <p class="text-sm" style="color: var(--bw-ink-soft)">{{ t.text }}</p>
            </li>
          </ul>
        </div>
        <div class="bw-card p-8">
          <p class="bw-label" style="color: var(--bw-muted)">Im Vergleich</p>
          <div class="mt-4 space-y-3">
            <div v-for="c in competitors" :key="c.name" class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium">{{ c.name }}</p>
              <BwScoreRing :value="c.score" :size="30" class="flex-none" />
            </div>
          </div>
          <UButton to="/brand/demo/duell" label="Duell ansehen: Nike vs. Adidas" size="sm" color="neutral" variant="ghost" class="mt-5 rounded-full" style="background: var(--bw-surface)" trailing-icon="i-ph-arrow-right" />
          <UButton label="Vergleiche deine Brand mit Nike" size="sm" color="neutral" variant="ghost" class="mt-2 rounded-full" style="background: var(--bw-surface)" trailing-icon="i-ph-arrow-right" />
        </div>
      </div>

      <!-- Artikel zur Marke -->
      <div class="mt-8">
        <p class="bw-label" style="color: var(--bw-muted)">Artikel zu Nike</p>
        <div class="mt-3 space-y-2">
          <div v-for="a in articles" :key="a.title" class="bw-card bw-card--hover flex items-center justify-between gap-3 px-5 py-4">
            <div class="min-w-0">
              <p class="bw-label" style="color: var(--bw-muted)">{{ a.topic }}</p>
              <p class="truncate text-sm font-medium">{{ a.title }}</p>
            </div>
            <UIcon name="i-ph-arrow-right" class="size-4 flex-none" style="color: var(--bw-muted)" />
          </div>
        </div>
      </div>

      <p class="bw-pending mt-8">Redaktionelle Bewertung nach offengelegter Methodik — nominative Markennennung, keine fremden Logos. Zuletzt geprüft 08/2026.</p>
      </div>
      <BwSiteFooter />
    </div>
  </div>
</template>
