<script setup lang="ts">
/** Clickdummy: Brand-Duell — zwei Marken im Direktvergleich, wie die
 *  Statistik-Tafel nach einem Spiel: Dimension für Dimension, Zahl
 *  gegen Zahl, mit klarem Sieger je Zeile. Statisch. */
const left = { name: 'Nike', line: 'Der Held · seit 1971', score: 94 }
const right = { name: 'Adidas', line: 'Der Jedermann · seit 1949', score: 91 }
const dims = [
  { label: 'Eigenständigkeit', a: 97, b: 93 },
  { label: 'Visuelle Identität', a: 95, b: 92 },
  { label: 'Konsistenz', a: 94, b: 90 },
  { label: 'Markenerlebnis', a: 93, b: 89 },
  { label: 'Positionierung & Klarheit', a: 92, b: 88 },
  { label: 'Emotionale Wirkung', a: 96, b: 90 },
  { label: 'Anpassungsfähigkeit', a: 94, b: 95 },
  { label: 'Handwerk', a: 90, b: 92 },
]
const facts = [
  { label: 'Gegründet', a: '1964', b: '1949' },
  { label: 'Claim', a: '„Just Do It" (1988)', b: '„Impossible Is Nothing" (2004)' },
  { label: 'Zeichen', a: 'Swoosh — symbol-only seit 1995', b: 'Drei Streifen — seit 1949' },
  { label: 'Agentur-Beziehung', a: 'Wieden+Kennedy, seit 1982', b: 'wechselnd, zuletzt in-house' },
  { label: 'Archetyp', a: 'Der Held', b: 'Der Jedermann' },
]
const aWins = dims.filter(d => d.a > d.b).length
const bWins = dims.filter(d => d.b > d.a).length
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-7xl">
      <BwSiteNav />
      <div class="mx-auto max-w-4xl">
      <NuxtLink to="/brand/demo/profil" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
        <UIcon name="i-ph-arrow-left" class="size-4" /> Brand-Profil Nike
      </NuxtLink>

      <!-- Aufstellung -->
      <div class="bw-card mt-4 p-8 sm:p-10">
        <p class="bw-label text-center uppercase tracking-widest" style="color: var(--bw-muted)">Brand-Duell</p>
        <div class="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div class="flex flex-col items-center gap-2 text-center">
            <BwScoreRing :value="left.score" :size="72" />
            <p class="text-2xl font-extralight tracking-tight">{{ left.name }}</p>
            <p class="bw-label" style="color: var(--bw-muted)">{{ left.line }}</p>
          </div>
          <p class="bw-label px-2" style="color: var(--bw-muted)">VS</p>
          <div class="flex flex-col items-center gap-2 text-center">
            <BwScoreRing :value="right.score" :size="72" />
            <p class="text-2xl font-extralight tracking-tight">{{ right.name }}</p>
            <p class="bw-label" style="color: var(--bw-muted)">{{ right.line }}</p>
          </div>
        </div>
        <p class="bw-label mt-6 text-center" style="color: var(--bw-muted)">{{ aWins }} Dimensionen an {{ left.name }} · {{ bWins }} an {{ right.name }}</p>
      </div>

      <!-- Dimensionen im Direktvergleich -->
      <div class="bw-card mt-4 p-8">
        <div class="flex items-baseline justify-between gap-3">
          <p class="bw-label" style="color: var(--bw-muted)">Dimension für Dimension</p>
          <p class="bw-label" style="color: var(--bw-muted)">40 Prüfkriterien je Marke</p>
        </div>
        <div class="mt-6 space-y-4">
          <div v-for="d in dims" :key="d.label">
            <p class="bw-label text-center" style="color: var(--bw-muted)">{{ d.label }}</p>
            <div class="mt-1.5 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-3">
              <p class="bw-label" :style="`color: ${d.a >= d.b ? 'var(--bw-accent)' : 'var(--bw-muted)'}`">{{ d.a }}</p>
              <div class="flex justify-end">
                <div class="h-1.5 w-full overflow-hidden rounded-full" style="background: var(--bw-line)">
                  <div class="ml-auto h-full rounded-full" :style="`width: ${d.a}%; background: ${d.a >= d.b ? 'var(--bw-accent)' : 'var(--bw-line-strong)'}`" />
                </div>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
                <div class="h-full rounded-full" :style="`width: ${d.b}%; background: ${d.b >= d.a ? 'var(--bw-accent)' : 'var(--bw-line-strong)'}`" />
              </div>
              <p class="bw-label text-right" :style="`color: ${d.b >= d.a ? 'var(--bw-accent)' : 'var(--bw-muted)'}`">{{ d.b }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Zahlen & Fakten -->
      <div class="bw-card mt-4 p-8">
        <p class="bw-label" style="color: var(--bw-muted)">Zahlen & Fakten</p>
        <div class="mt-4 space-y-3">
          <div v-for="f in facts" :key="f.label" class="grid items-baseline gap-2 sm:grid-cols-[1fr_11rem_1fr]">
            <p class="text-sm sm:text-right" style="color: var(--bw-ink-soft)">{{ f.a }}</p>
            <p class="bw-label text-center" style="color: var(--bw-muted)">{{ f.label }}</p>
            <p class="text-sm" style="color: var(--bw-ink-soft)">{{ f.b }}</p>
          </div>
        </div>
      </div>

      <!-- Einordnung -->
      <div class="bw-card mt-4 p-8">
        <p class="bw-label" style="color: var(--bw-muted)">Einordnung</p>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Zwei Systeme, zwei Philosophien: Nike gewinnt über Konsequenz — ein Symbol, ein Claim, eine Agentur-Beziehung über vier Jahrzehnte. Adidas punktet dort, wo Beweglichkeit zählt: Kollaborationen, Subkultur, das Spiel mit den drei Streifen. Wer Wiedererkennung sucht, lernt von Nike; wer Anschlussfähigkeit sucht, von Adidas.</p>
      </div>

      <div class="bw-card mt-4 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">Wie schlägt sich deine Marke im Duell? Jede Brand hier wird mit denselben Kriterien bewertet.</p>
        <UButton icon="i-ph-plus" label="Starte deine Brand" class="rounded-full" />
      </div>

      <p class="bw-pending mt-8">Redaktionelle Bewertung nach offengelegter Methodik — nominative Markennennung, keine fremden Logos. Zuletzt geprüft 08/2026.</p>
      </div>
    </div>
  </div>
</template>
