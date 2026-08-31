<script setup lang="ts">
/** Clickdummy: Anatomie-Ansicht einer öffentlichen Brand (Discover,
 *  Phase-2-Vorgeschmack) — als DOSSIER: sticky Steckbrief-Leiste links,
 *  rechts ein fließendes Dokument mit Linien statt Karten (bewusst
 *  anders als die Galerie-Wand von Discover und die Journal-Liste).
 *  Statisch. */
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
/* Steckbrief entlang der 6 Taxonomie-Achsen (Plan: Marken-Taxonomie) —
 * Archetyp, Stil, Stimme und Positionierung sind GETRENNTE Angaben. */
const steckbrief = [
  ['Branche', 'Physiotherapie'],
  ['Ort', 'Kiel'],
  ['Weiche', 'Neue Marke'],
  ['Archetyp', 'Der Fürsorgliche · Rest Weiser'],
  ['Stil', 'Organisch · Minimal'],
  ['Stimme', 'warm, gerade heraus'],
  ['Positionierung', 'Premium · regional'],
  ['Sprache', 'Deutsch'],
  ['Veröffentlicht', 'Juli 2026'],
]
const palette = [
  { hex: '#25454c', name: 'Tiefe' },
  { hex: '#7fb0ba', name: 'Küste' },
  { hex: '#dbe9ec', name: 'Licht' },
  { hex: '#e8b087', name: 'Wärme' },
  { hex: '#f6f4ef', name: 'Papier' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="mx-auto max-w-7xl">
      <div class="mx-auto max-w-4xl">
      <NuxtLink to="/brand/demo/discover" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
        <UIcon name="i-ph-arrow-left" class="size-4" /> Discover Brands
      </NuxtLink>

      <!-- Hero -->
      <div class="bw-grain-hero mt-4 p-10" style="--hero-a: #dbe9ec; --hero-b: #7fb0ba; --hero-c: #25454c">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Anatomie</p>
            <p class="mt-3 text-3xl font-extralight leading-snug tracking-tight">Nordlicht Physio</p>
            <p class="mt-4 max-w-xl text-xl font-extralight leading-snug">„Wir behandeln Menschen, keine Befunde."</p>
          </div>
          <div class="bw-on-dark flex flex-none flex-col items-center gap-1 rounded-2xl px-4 py-3" style="background: rgb(20 20 20 / 0.35)">
            <BwScoreRing :value="91" :size="72" label="Brand Score" />
            <p class="bw-label" style="color: rgb(247 242 234 / 0.7)">Herausragend</p>
          </div>
        </div>
      </div>

      <!-- Dossier: Steckbrief-Leiste + fließendes Dokument -->
      <div class="mt-10 grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <!-- Steckbrief (sticky) -->
        <aside class="self-start lg:sticky lg:top-10">
          <p class="bw-label border-b pb-3" style="color: var(--bw-muted); border-color: var(--bw-line-strong)">Steckbrief</p>
          <dl class="mt-4 space-y-3">
            <div v-for="row in steckbrief" :key="row[0]">
              <dt class="bw-label" style="color: var(--bw-muted)">{{ row[0] }}</dt>
              <dd class="mt-0.5 text-sm">{{ row[1] }}</dd>
            </div>
          </dl>
          <div class="mt-6 flex items-center gap-3 border-t pt-5" style="border-color: var(--bw-line)">
            <UAvatar text="LK" size="md" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">Lena K.</p>
              <p class="bw-label" style="color: var(--bw-muted)">3 Brandings · Ø 88</p>
            </div>
          </div>
        </aside>

        <!-- Dokument -->
        <article class="min-w-0">
          <section>
            <p class="bw-label" style="color: var(--bw-muted)">Purpose</p>
            <p class="mt-3 text-xl font-extralight leading-relaxed tracking-tight">Es gibt uns, damit Behandlung wieder ein Gespräch ist: Zeit, Zuhören und ein Plan, den man zu Hause versteht — Physiotherapie ohne Fließband.</p>
          </section>

          <USeparator class="my-8" :ui="{ border: 'border-(--bw-line)' }" />

          <section>
            <p class="bw-label" style="color: var(--bw-muted)">Werte</p>
            <ul class="mt-4 space-y-4">
              <li v-for="w in werte" :key="w.wort" class="grid gap-x-6 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <p class="font-medium">{{ w.wort }}</p>
                <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ w.regel }}</p>
              </li>
            </ul>
          </section>

          <USeparator class="my-8" :ui="{ border: 'border-(--bw-line)' }" />

          <section>
            <p class="bw-label" style="color: var(--bw-muted)">Stimme</p>
            <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Warm, aber gerade heraus — erklärt wie eine gute Freundin mit Fachwissen, nie wie ein Beipackzettel. Sagt „Rücken" statt „LWS-Syndrom".</p>
          </section>

          <USeparator class="my-8" :ui="{ border: 'border-(--bw-line)' }" />

          <section>
            <p class="bw-label" style="color: var(--bw-muted)">Farbwelt & Typografie</p>
            <div class="mt-4 flex flex-wrap items-end gap-8">
              <div class="flex gap-2">
                <div v-for="c in palette" :key="c.hex" class="flex flex-col items-center gap-1.5">
                  <div class="bw-swatch rounded-full" :style="`background: ${c.hex}; width: 2.5rem; height: 2.5rem`" />
                  <p class="bw-label" style="color: var(--bw-muted)">{{ c.name }}</p>
                </div>
              </div>
              <div>
                <p class="text-5xl font-extralight leading-none tracking-tight">Aa</p>
                <p class="bw-label mt-1.5" style="color: var(--bw-muted)">ruhige Grotesk · zwei Rollen</p>
              </div>
            </div>
          </section>

          <USeparator class="my-8" :ui="{ border: 'border-(--bw-line)' }" />

          <section>
            <div class="flex items-baseline justify-between gap-3">
              <p class="bw-label" style="color: var(--bw-muted)">Bewertung</p>
              <p class="bw-label" style="color: var(--bw-muted)">96 Stimmen</p>
            </div>
            <div class="mt-4 max-w-md space-y-3">
              <div v-for="r in ratings" :key="r.label" class="grid grid-cols-[5rem_1fr_2rem] items-center gap-3">
                <p class="bw-label" style="color: var(--bw-muted)">{{ r.label }}</p>
                <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--bw-line)">
                  <div class="h-full rounded-full" :style="`width: ${r.value / 5 * 100}%; background: var(--bw-accent)`" />
                </div>
                <p class="bw-label text-right">{{ r.value.toFixed(1) }}</p>
              </div>
            </div>
            <UButton label="Bewerten" size="sm" color="neutral" variant="ghost" class="mt-5 rounded-full" style="background: var(--bw-surface)" />
          </section>
        </article>
      </div>

      <div class="bw-card mt-12 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">Gefällt dir, wie das gebaut ist? Marken sind keine Vorlagen — aber der Weg dorthin steht dir offen.</p>
        <UButton icon="i-ph-plus" label="Starte deine eigene" class="rounded-full" />
      </div>
      </div>
      <BwSiteFooter />
    </div>
  </div>
</template>
