<script setup lang="ts">
/** Clickdummy: Products (Runde 160, Davids Suite-Entscheidung) —
 *  sieben Produkte, die aufeinander aufbauen: 1–4 als Aufbau-Pfad,
 *  5–7 laufen dauerhaft mit. Namen = Brand-X-Familie (der frei
 *  gewordene Name „Brand Wizard" wird Produkt 1). Statisch. */
const path = [
  { nr: '01', name: 'Brand Wizard', line: 'Im Gespräch mit George entsteht eure Marke — neue Marke oder Marken-Relaunch. Jede Entscheidung begründet, jederzeit pausierbar.', result: 'Brand Foundation + Brand Language' },
  { nr: '02', name: 'Brand Design', line: 'Aus eurer Foundation entstehen drei Moodboards. Ihr hakt ab, kommentiert, kombiniert — Farbwelt aus 1, Typografie aus 3 — und nähert euch Stück für Stück eurem Design.', result: 'Visual DNA + Design-Richtung' },
  { nr: '03', name: 'Brand Book & Kit', line: 'Alles Festgehaltene wird Werkzeug: Brand Book, Design-Tokens, brand.json, Pressekit — plus Strategy Playbook mit Positionierung, Content-Säulen und 90-Tage-Plan.', result: 'Brand Book, Kit + Playbook' },
  { nr: '04', name: 'Brand Experience', line: 'Die Marke kommt in die Welt: Vorlagen, Ideen, Quick Wins und Pläne für Website, Social, Vor Ort, SEO & GEO — entlang eures 90-Tage-Plans.', result: 'Assets, Templates + Launch' },
]
const laufend = [
  { name: 'Brand Monitoring', line: 'Wöchentlicher Blick von außen: Sichtbarkeit, Wettbewerber-Verschiebungen, neue Chancen — mit Alarm, wenn sich etwas bewegt.' },
  { name: 'Brand Score', line: '40 Prüfkriterien in 8 Dimensionen — reproduzierbar gerechnet, nie gefühlt. Der eine Maßstab für jede Marke hier.' },
  { name: 'Brand Benchmark', line: 'Wettbewerber und Vorbilder im selben Raster: Wer steht wo in eurem Markt — und warum?' },
]
const plattform = [
  { icon: 'i-ph-brain', name: 'Remember & Refine', line: 'Wir erinnern uns an eure Guidelines, Strategien und Kennzahlen über Sitzungen hinweg — jedes Update baut auf dem auf, was funktioniert.' },
  { icon: 'i-ph-plugs-connected', name: 'Connect Your Tools', line: 'Eure Strategie wandert dorthin, wo ihr arbeitet: Google Docs, Sheets, Figma — Workflows über euren ganzen Planungs-Stack.' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="@container mx-auto max-w-7xl">
      <BwSiteNav />

      <div class="mx-auto mt-14 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Products</p>
        <h1 class="mt-4 text-balance text-5xl font-extralight leading-tight tracking-tight">Sieben Produkte, ein System.</h1>
        <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Jedes baut auf dem vorherigen auf — von der ersten Entscheidung bis zur wachen Marke.</p>
      </div>

      <!-- Der Aufbau-Pfad: 01–04 -->
      <div class="mx-auto mt-16 max-w-3xl">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Der Aufbau-Pfad</p>
        <div class="mt-4 space-y-4">
          <div v-for="p in path" :key="p.nr" class="bw-card grid gap-x-8 gap-y-3 p-8 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
            <p class="text-3xl font-extralight tracking-tight" style="color: var(--bw-line-strong)">{{ p.nr }}</p>
            <div class="min-w-0">
              <h2 class="text-xl font-medium tracking-tight">{{ p.name }}</h2>
              <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ p.line }}</p>
              <p class="bw-label mt-3" style="color: var(--bw-muted)">Ergebnis: {{ p.result }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Läuft dauerhaft mit: 05–07 -->
      <div class="mt-20">
        <p class="bw-label text-center uppercase tracking-widest" style="color: var(--bw-muted)">Läuft dauerhaft mit</p>
        <div class="mt-4 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @md:grid-cols-3">
          <div v-for="l in laufend" :key="l.name" class="bw-card p-8">
            <h2 class="text-lg font-medium tracking-tight">{{ l.name }}</h2>
            <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ l.line }}</p>
          </div>
        </div>
      </div>

      <!-- Plattform-Fähigkeiten -->
      <div class="mt-20 grid gap-x-6 gap-y-6 lg:grid-cols-2">
        <div v-for="f in plattform" :key="f.name" class="bw-card p-8">
          <UIcon :name="f.icon" class="size-5" style="color: var(--bw-ink-soft)" />
          <h2 class="mt-3 text-lg font-medium tracking-tight">{{ f.name }}</h2>
          <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ f.line }}</p>
        </div>
      </div>

      <!-- Team-Teaser -->
      <NuxtLink to="/team" class="bw-card bw-card--hover mt-20 flex flex-wrap items-center justify-between gap-6 p-8">
        <div class="flex items-center gap-5">
          <div class="flex -space-x-2">
            <span class="rounded-full" style="outline: 2px solid var(--bw-surface)"><BwGeorgeAvatar size="md" /></span>
            <UAvatar text="FF" size="md" style="outline: 2px solid var(--bw-surface)" />
            <UAvatar text="RS" size="md" style="outline: 2px solid var(--bw-surface)" />
            <UAvatar text="WW" size="md" style="outline: 2px solid var(--bw-surface)" />
          </div>
          <div>
            <h2 class="text-lg font-medium tracking-tight">Für jede Aufgabe das richtige Teammitglied</h2>
            <p class="mt-1 text-sm" style="color: var(--bw-ink-soft)">Wir zerlegen euer Projekt in Aufgaben — und jede übernimmt die Spezialistin oder der Spezialist, der sie am besten kann.</p>
          </div>
        </div>
        <p class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">Das Team kennenlernen <UIcon name="i-ph-arrow-right" class="size-3.5" /></p>
      </NuxtLink>

      <BwSiteFooter />
    </div>
  </div>
</template>
