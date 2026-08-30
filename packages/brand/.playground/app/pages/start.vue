<script setup lang="ts">
/** Clickdummy: die öffentliche STARTSEITE (Runde 137) — der
 *  Conversion-Einstieg für Ausgeloggte. Aufbau nach der Analyse der
 *  Perplexity-Computer-Landing: Ergebnis+Zeit-Versprechen im Hero,
 *  Prozess-Theater (George bei der Arbeit), Artefakte benennen,
 *  Capability-Karten, AUDIT-FIRST-Lead-Magnet (Brand-Check). Statisch. */
const prozess = [
  { text: 'George liest euren Kontext — Branche, Ziele, Wettbewerb', done: true },
  { text: 'Er stellt die Fragen, die eine gute Agentur stellen würde', done: true },
  { text: 'Jede Empfehlung kommt mit strategischer Begründung', done: true },
  { text: 'Brand Foundation steht — in etwa 45 Minuten', done: false },
]
const artefakte = [
  { name: 'Brand Book', line: '24 Kapitel mit Do & Don\'t — inklusive AI-Guidelines.' },
  { name: 'brand.json', line: 'Stimme, Vokabular, Tabus — maschinenlesbar für jede KI.' },
  { name: 'Design-Tokens', line: 'Farbwelt hell/dunkel, Kontrast-geprüft — CSS, Tailwind, Figma.' },
  { name: 'Pressekit', line: 'Logos, Boilerplate in drei Längen, alles versandfertig.' },
  { name: 'Content-Kompass', line: '3–5 Säulen mit Taktung — nie wieder Posting-Panik.' },
  { name: '90-Tage-Plan', line: 'Was nach dem Branding kommt, Woche für Woche.' },
]
const faehigkeiten = [
  { icon: 'i-ph-chats-circle', name: 'Geführtes Gespräch', line: 'Kein Formular-Marathon: George fragt, ihr entscheidet — pausiert jederzeit, der Stand bleibt.' },
  { icon: 'i-ph-gauge', name: 'Brand Score', line: '40 Prüfkriterien in 8 Dimensionen — reproduzierbar gerechnet, nie gefühlt.' },
  { icon: 'i-ph-sparkle', name: 'Beispiel-Brand', line: 'Kailua Coffee Co. zeigt durch alle sechs Schichten, wie fertig aussieht.' },
  { icon: 'i-ph-compass', name: 'Discover', line: 'Echte Marken, freiwillig öffentlich — mit ihrer ganzen Anatomie.' },
  { icon: 'i-ph-radar', name: 'Brand Monitoring', line: 'Außenbild-Check und KI-Antwort-Radar — eure Marke bleibt deckungsgleich.' },
  { icon: 'i-ph-brain', name: 'George erinnert sich', line: 'Jede Entscheidung baut auf den vorherigen auf — über Sitzungen hinweg.' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="@container mx-auto max-w-7xl">
      <BwSiteNav />

      <!-- Hero: Ergebnis- und Zeitversprechen, EIN primärer CTA -->
      <div class="mx-auto mt-16 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Branding Supply</p>
        <h1 class="mt-5 text-balance text-5xl font-extralight leading-tight tracking-tight sm:text-6xl">Baut eine Marke, die trägt — im Gespräch mit George.</h1>
        <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Euer Markenberater führt euch durch jede Entscheidung: begründet, bewertet, versandfertig — von Purpose bis Monitoring.</p>
        <div class="mt-9 flex flex-wrap items-center justify-center gap-2">
          <UButton label="Starte deine Brand — kostenlos" icon="i-ph-plus" size="lg" class="rounded-full" />
          <UButton label="Zum Brand-Check" size="lg" color="neutral" variant="ghost" class="rounded-full" style="background: var(--bw-surface)" />
        </div>
      </div>

      <!-- Prozess-Theater: George bei der Arbeit -->
      <div class="bw-card mx-auto mt-16 max-w-2xl p-8">
        <div class="flex items-center justify-between gap-3">
          <p class="bw-label" style="color: var(--bw-muted)">George bei der Arbeit</p>
          <BwGeorgeAvatar size="md" />
        </div>
        <ul class="mt-5 space-y-3.5">
          <li v-for="p in prozess" :key="p.text" class="flex items-center gap-3">
            <span class="grid size-5 flex-none place-items-center rounded-full" :style="p.done ? 'background: var(--bw-accent-soft)' : 'background: var(--bw-surface-hi)'">
              <UIcon :name="p.done ? 'i-ph-check' : 'i-ph-circle-notch'" class="size-3" :class="p.done ? '' : 'animate-spin'" :style="p.done ? 'color: var(--bw-accent)' : 'color: var(--bw-muted)'" />
            </span>
            <p class="bw-label" :style="p.done ? '' : 'color: var(--bw-muted)'">{{ p.text }}</p>
          </li>
        </ul>
      </div>

      <!-- Artefakte: was am Ende auf dem Tisch liegt -->
      <div class="mt-24">
        <h2 class="text-center text-3xl font-extralight tracking-tight">Was am Ende auf dem Tisch liegt</h2>
        <p class="bw-label mt-2 text-center" style="color: var(--bw-muted)">Keine Folien — Werkzeuge, mit denen ihr am nächsten Tag arbeitet.</p>
        <div class="mt-10 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @md:grid-cols-3">
          <div v-for="a in artefakte" :key="a.name" class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">{{ a.name }}</p>
            <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ a.line }}</p>
          </div>
        </div>
      </div>

      <!-- Fähigkeiten -->
      <div class="mt-24">
        <h2 class="text-center text-3xl font-extralight tracking-tight">Mehr als ein Generator</h2>
        <p class="bw-label mt-2 text-center" style="color: var(--bw-muted)">Marken sind keine Vorlagen — deshalb baut George keine.</p>
        <div class="mt-10 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @md:grid-cols-3">
          <div v-for="f in faehigkeiten" :key="f.name" class="bw-card p-8">
            <UIcon :name="f.icon" class="size-5" style="color: var(--bw-ink-soft)" />
            <p class="mt-3 font-medium">{{ f.name }}</p>
            <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ f.line }}</p>
          </div>
        </div>
      </div>

      <!-- Brand-Check: Audit-first-Lead-Magnet (Perplexity-Learning) -->
      <div class="bw-card mt-24 grid items-center gap-10 p-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0">
          <p class="bw-label" style="color: var(--bw-muted)">Brand-Check · kostenlos</p>
          <h2 class="mt-3 max-w-lg text-balance text-3xl font-extralight leading-snug tracking-tight">Wie stark ist eure Marke — von außen betrachtet?</h2>
          <p class="mt-4 max-w-lg text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Gebt eure Website an: George analysiert euren Außenauftritt mit denselben 40 Prüfkriterien wie jede Brand hier — und liefert euren Brand Score mit den drei wichtigsten Befunden. Der ehrlichste Einstieg in ein Rebrand.</p>
        </div>
        <div>
          <div class="flex items-center gap-2 rounded-full p-1.5 pl-5" style="background: var(--bw-surface-hi)">
            <span class="bw-label flex-1" style="color: var(--bw-muted)">eure-website.de</span>
            <UButton label="Check starten" size="sm" class="rounded-full" />
          </div>
          <p class="bw-label mt-3 text-center" style="color: var(--bw-muted)">Score + 3 Befunde · keine Anmeldung nötig</p>
        </div>
      </div>

      <!-- Beweis: Beispiel-Brand -->
      <NuxtLink to="/brand/demo/beispiel" class="bw-card bw-card--hover mt-6 grid items-center gap-6 p-8 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div class="bw-tile relative hidden overflow-hidden sm:block" style="aspect-ratio: 1 / 1; background: linear-gradient(165deg, #e8d3b8 0%, #b98a5e 45%, #4a3123 100%)">
          <p class="absolute inset-0 grid place-items-center p-4 text-center text-base font-extralight leading-snug tracking-tight" style="color: #f7f2ea; text-shadow: 0 1px 12px rgb(20 20 20 / 0.3)">Kailua Coffee Co.</p>
        </div>
        <div class="min-w-0">
          <p class="bw-label" style="color: var(--bw-muted)">Der Beweis · Beispiel-Brand</p>
          <h2 class="mt-2 text-2xl font-medium tracking-tight">So sieht fertig aus: Kailua Coffee Co.</h2>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Alle sechs Schichten ausgearbeitet, Brand Score 92, jede Entscheidung mit Begründung — schaut es euch an, bevor ihr startet.</p>
          <p class="bw-label mt-4 inline-flex items-center gap-1.5" style="color: var(--bw-muted)">Beispiel-Brand ansehen <UIcon name="i-ph-arrow-right" class="size-3.5" /></p>
        </div>
      </NuxtLink>

      <!-- Abschluss-CTA -->
      <UPageCTA
        title="Die erste Entscheidung ist die leichteste."
        description="Konto anlegen, Arbeitstitel wählen — George übernimmt. Pausiert jederzeit, euer Stand bleibt gespeichert."
        :links="[
          { label: 'Starte deine Brand — kostenlos', icon: 'i-ph-plus', color: 'neutral' },
          { label: 'Discover ansehen', to: '/brand/demo/discover', color: 'neutral', variant: 'ghost' },
        ]"
        class="bw-card mt-24"
        :ui="{ title: 'text-3xl font-medium tracking-tight sm:text-4xl', description: 'text-base', container: 'py-14 sm:py-16' }"
      />

      <BwSiteFooter />
    </div>
  </div>
</template>
