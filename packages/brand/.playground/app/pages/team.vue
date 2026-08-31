<script setup lang="ts">
/** Clickdummy: Team-Seite (Runde 160, Davids Idee) — die
 *  spezialisierten Agenten sind PERSONEN mit Namen, Jobtitel,
 *  Abgrenzung, Skills und Persönlichem. George bekommt Kolleginnen
 *  und Kollegen; Profilbilder folgen (Platzhalter: Initialen). */
const team = [
  {
    initials: 'GW', name: 'George Wuffwuff', title: 'Markenberater · Brand Wizard',
    desc: 'Führt euch durch Foundation und Language — er stellt die Fragen, begründet jede Empfehlung und behält den roten Faden. Was Gestaltung ist, gibt er an Frida ab.',
    skills: ['Markenstrategie', 'Archetypen', 'Purpose & Werte', 'Naming'],
    personal: 'Chihuahua mit Terrier-Anteil · Kiel · sammelt Manifeste, schwimmt in der Förde',
  },
  {
    initials: 'FF', name: 'Frida Fellini', title: 'Design Directorin · Brand Design',
    desc: 'Übersetzt eure Foundation in Visual DNA und drei Moodboard-Richtungen — und verfeinert mit euch, bis es sitzt. Strategie-Fragen reicht sie an George zurück.',
    skills: ['Visual DNA', 'Moodboards', 'Farbwelten', 'Typografie'],
    personal: 'Pudel · Mailand/Hamburg · fotografiert Hauswände, hasst Stock-Lächeln',
  },
  {
    initials: 'RS', name: 'Rex Setter', title: 'Produktioner · Brand Book & Kit',
    desc: 'Setzt alles Beschlossene in Werkzeuge: Book, Tokens, brand.json, Pressekit, Playbook. Er erfindet nichts Neues — er macht das Entschiedene versandfertig.',
    skills: ['Brand Books', 'Design-Tokens', 'brand.json', 'Pressekits'],
    personal: 'Irish Setter · Leipzig · Buchdruck-Nerd, sortiert Schrauben nach Größe',
  },
  {
    initials: 'KA', name: 'Kira Apport', title: 'Content-Strategin · Brand Experience',
    desc: 'Bringt die Marke in die Welt: Content-Kompass, Templates, Quick Wins, Launch — immer entlang des 90-Tage-Plans. Bewertet nicht, was Ada gehört.',
    skills: ['Content-Säulen', 'SEO & GEO', 'Launch-Pläne', 'Templates'],
    personal: 'Labrador · Köln · apportiert Deadlines, läuft Halbmarathon',
  },
  {
    initials: 'WW', name: 'Wanda Wachsam', title: 'Monitoring-Analystin · Brand Monitoring',
    desc: 'Schaut wöchentlich von außen auf eure Marke: Sichtbarkeit, KI-Antworten, Wettbewerber-Bewegungen. Schlägt nur an, wenn es etwas zu melden gibt.',
    skills: ['Außenbild-Checks', 'KI-Antwort-Radar', 'Alerts', 'Trend-Signale'],
    personal: 'Schäferhündin · Wien · Nachtschichten, Fernglas-Sammlung',
  },
  {
    initials: 'AP', name: 'Ada Prüfstein', title: 'Score-Prüferin · Brand Score',
    desc: 'Rechnet den Brand Score — 40 Prüfkriterien, 8 Dimensionen, jede Wertung mit Begründung. Unbestechlich: Sie bewertet auch unsere eigenen Beispiel-Marken.',
    skills: ['Prüfkriterien', 'Reproduzierbarkeit', 'Begründungen', 'Bänder'],
    personal: 'Dackel · Zürich · misst alles zweimal, spielt Schach gegen sich selbst',
  },
  {
    initials: 'SS', name: 'Scout Schnüffler', title: 'Research-Analyst · Brand Benchmark',
    desc: 'Findet Wettbewerber und Vorbilder in eurem Markt und legt sie ins selbe Raster. Er sammelt Belege — Schlüsse zieht ihr mit George.',
    skills: ['Wettbewerbs-Research', 'Benchmarks', 'Quellen-Belege', 'Markt-Raster'],
    personal: 'Beagle · Berlin · verliert nie eine Spur, außer beim Bällchen',
  },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="@container mx-auto max-w-7xl">
      <BwSiteNav />

      <div class="mx-auto mt-14 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Team</p>
        <h1 class="mt-4 text-balance text-5xl font-extralight leading-tight tracking-tight">Das Team hinter eurer Marke.</h1>
        <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Wir zerlegen euer Projekt in Aufgaben — und jede übernimmt das Teammitglied, das sie am besten kann.</p>
      </div>

      <div class="mt-14 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @md:grid-cols-3">
        <div v-for="m in team" :key="m.name" class="bw-card flex flex-col p-8">
          <div class="flex items-center gap-4">
            <BwGeorgeAvatar v-if="m.initials === 'GW'" size="xl" />
            <UAvatar v-else :text="m.initials" size="xl" />
            <div class="min-w-0">
              <h2 class="truncate text-lg font-medium tracking-tight">{{ m.name }}</h2>
              <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ m.title }}</p>
            </div>
          </div>
          <p class="mt-4 flex-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ m.desc }}</p>
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span v-for="s in m.skills" :key="s" class="bw-label rounded-full px-2.5 py-1" style="background: var(--bw-surface-hi)">{{ s }}</span>
          </div>
          <p class="bw-label mt-4 leading-relaxed" style="color: var(--bw-muted)">{{ m.personal }}</p>
        </div>
      </div>

      <div class="bw-card mt-16 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">Das Team steht bereit — die erste Frage stellt George.</p>
        <UButton label="Starte deine Brand" class="rounded-full" />
      </div>

      <BwSiteFooter />
    </div>
  </div>
</template>
