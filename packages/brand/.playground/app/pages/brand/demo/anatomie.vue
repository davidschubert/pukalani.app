<script setup lang="ts">
/** Clickdummy: Anatomie-Ansicht einer öffentlichen Brand (Discover,
 *  Phase-2-Vorgeschmack) — jede veröffentlichte Brand als lesbare,
 *  indexierbare Seite: Strategie sichtbar, Bewertung in Dimensionen,
 *  CTA immer „Starte deine eigene". Statisch. */
const werte = [
  { wort: 'Zugewandt', regel: 'Wir hören zu, bevor wir behandeln — der Mensch erklärt den Befund, nicht umgekehrt.' },
  { wort: 'Gerade heraus', regel: 'Wir sagen, was hilft — auch wenn es weniger Termine bedeutet.' },
  { wort: 'Handfest', regel: 'Übungen für den Alltag statt Fachvokabular fürs Wartezimmer.' },
]
const ratings = [
  { label: 'Klarheit', value: 4.6 },
  { label: 'Mut', value: 4.2 },
  { label: 'Handwerk', value: 4.8 },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-4xl">
      <BwSiteNav />
      <NuxtLink to="/brand/demo/discover" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
        <UIcon name="i-ph-arrow-left" class="size-4" /> Discover
      </NuxtLink>

      <!-- Hero -->
      <div class="bw-grain-hero mt-4 p-10" style="--hero-a: #dbe9ec; --hero-b: #7fb0ba; --hero-c: #25454c">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Nordlicht Physio</p>
            <p class="mt-4 max-w-xl text-3xl font-extralight leading-snug tracking-tight">Wir behandeln Menschen, keine Befunde.</p>
            <p class="bw-label mt-6" style="color: rgb(247 242 234 / 0.6)">Der Fürsorgliche · warm, aber gerade heraus · DE · Kiel</p>
          </div>
          <BwScoreRing :value="91" :size="72" label="Brand Score" class="flex-none" />
        </div>
      </div>

      <!-- Anatomie -->
      <div class="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div class="space-y-4">
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Purpose</p>
            <p class="mt-3 leading-relaxed" style="color: var(--bw-ink-soft)">Es gibt uns, damit Behandlung wieder ein Gespräch ist: Zeit, Zuhören und ein Plan, den man zu Hause versteht — Physiotherapie ohne Fließband.</p>
          </div>
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Werte</p>
            <ul class="mt-3 space-y-3">
              <li v-for="w in werte" :key="w.wort">
                <p class="text-sm font-medium">{{ w.wort }}</p>
                <p class="mt-0.5 text-sm" style="color: var(--bw-ink-soft)">{{ w.regel }}</p>
              </li>
            </ul>
          </div>
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Stimme</p>
            <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Warm, aber gerade heraus — erklärt wie eine gute Freundin mit Fachwissen, nie wie ein Beipackzettel. Sagt „Rücken" statt „LWS-Syndrom".</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Farbwelt</p>
            <div class="mt-4 flex gap-2">
              <div v-for="c in ['#25454c', '#7fb0ba', '#dbe9ec', '#e8b087', '#f6f4ef']" :key="c" class="bw-swatch rounded-full" :style="`background: ${c}; width: 2.5rem; height: 2.5rem`" />
            </div>
            <p class="bw-label mt-4" style="color: var(--bw-muted)">Typografie</p>
            <p class="mt-1 text-4xl font-extralight leading-none tracking-tight">Aa</p>
          </div>
          <div class="bw-card p-8">
            <div class="flex items-baseline justify-between gap-3">
              <p class="bw-label" style="color: var(--bw-muted)">Bewertung</p>
              <p class="bw-label" style="color: var(--bw-muted)">96 Stimmen</p>
            </div>
            <div class="mt-4 space-y-3">
              <div v-for="r in ratings" :key="r.label" class="grid grid-cols-[5rem_1fr_2rem] items-center gap-3">
                <p class="bw-label" style="color: var(--bw-muted)">{{ r.label }}</p>
                <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
                  <div class="h-full rounded-full" :style="`width: ${r.value / 5 * 100}%; background: var(--bw-accent)`" />
                </div>
                <p class="bw-label text-right">{{ r.value.toFixed(1) }}</p>
              </div>
            </div>
            <UButton label="Bewerten" size="sm" color="neutral" variant="ghost" class="mt-4 rounded-full" style="background: var(--bw-surface)" />
          </div>
          <div class="bw-card flex items-center gap-4 p-6">
            <UAvatar text="LK" size="xl" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">Lena K.</p>
              <p class="bw-label mt-0.5" style="color: var(--bw-muted)">3 Brandings · Ø 88</p>
            </div>
            <UIcon name="i-ph-arrow-right" class="size-4 flex-none" style="color: var(--bw-muted)" />
          </div>
        </div>
      </div>

      <div class="bw-card mt-6 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">Gefällt dir, wie das gebaut ist? Marken sind keine Vorlagen — aber der Weg dorthin steht dir offen.</p>
        <UButton icon="i-ph-plus" label="Starte deine eigene" class="rounded-full" />
      </div>
    </div>
  </div>
</template>
