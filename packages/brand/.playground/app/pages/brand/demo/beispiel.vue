<script setup lang="ts">
/** Clickdummy: die VOLLSTÄNDIGE Beispiel-Brand (Kailua Coffee Co.) —
 *  das Referenz-Ergebnis durch alle sechs Schichten. Zeigt jedem
 *  Nutzer, was am Ende der Reise steht. Statisch. */
const dims = [
  { label: 'Eigenständigkeit', value: 91 },
  { label: 'Visuelle Identität', value: 93 },
  { label: 'Konsistenz', value: 95 },
  { label: 'Markenerlebnis', value: 90 },
  { label: 'Positionierung & Klarheit', value: 94 },
  { label: 'Emotionale Wirkung', value: 92 },
  { label: 'Anpassungsfähigkeit', value: 91 },
  { label: 'Handwerk', value: 90 },
]
function tone(v: number): string {
  return v >= 90 ? 'var(--bw-accent)' : v >= 50 ? 'var(--bw-draft)' : 'var(--bw-stale)'
}
const werte = [
  { wort: 'Klartext', regel: 'Wir sagen Preise, Herkunft und Grenzen, bevor jemand fragt.' },
  { wort: 'Handwerk', regel: 'Lieber eine Röstung perfekt als fünf Sorten mittelmäßig.' },
  { wort: 'Nähe', regel: 'Unsere Gäste kennen den Namen der Person, die ihre Bohnen geröstet hat.' },
]
const palette = [
  { hex: '#4a3123', name: 'Roast', rolle: 'Grund & Text' },
  { hex: '#b98a5e', name: 'Crema', rolle: 'Wärme & Flächen' },
  { hex: '#e8d3b8', name: 'Milk', rolle: 'Helle Flächen' },
  { hex: '#2f4a3a', name: 'Palm', rolle: 'Akzent & Signal' },
  { hex: '#f7f2ea', name: 'Paper', rolle: 'Papier & Ruhe' },
]
const saeulen = [
  { name: 'Herkunft erzählen', takt: '1×/Woche' },
  { name: 'Handwerk zeigen', takt: '2×/Woche' },
  { name: 'Haltung vertreten', takt: '2×/Monat' },
  { name: 'Einladen', takt: '1×/Woche' },
]
const fakten = [
  'Kailua Coffee Co. röstet auf Oʻahu, Hawaii — Anbau, Röstung und Ausschank aus einer Hand.',
  'Gegründet 2026; eine Röstung pro Saison statt Sortenvielfalt.',
  'Alle Preise und Herkünfte sind öffentlich einsehbar.',
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="mx-auto max-w-7xl">
      <div class="mx-auto max-w-4xl">
      <p class="bw-label" style="color: var(--bw-muted)">Beispiel-Branding · so sieht ein fertiges Ergebnis aus</p>

      <!-- Hero -->
      <div class="bw-grain-hero mt-4 p-10" style="--hero-a: #e8d3b8; --hero-b: #b98a5e; --hero-c: #4a3123">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="min-w-0">
            <p class="bw-label uppercase tracking-widest" style="color: rgb(247 242 234 / 0.7)">Kailua Coffee Co.</p>
            <p class="mt-4 max-w-xl text-3xl font-extralight leading-snug tracking-tight">One honest, quiet moment a day.</p>
            <p class="mt-4 max-w-xl text-sm leading-relaxed" style="color: rgb(247 242 234 / 0.85)">Kaffee mit nachvollziehbarer Herkunft — Anbau, Röstung, Ausschank aus einer Hand.</p>
            <p class="bw-label mt-6" style="color: rgb(247 242 234 / 0.6)">Der Weise · Rest Schöpfer — ruhig, fundiert, gerade heraus · EN · Oʻahu</p>
            <p class="bw-label mt-1" style="color: rgb(247 242 234 / 0.6)">Stil: Warm · Editorial — Positionierung: Premium · lokal</p>
          </div>
          <div class="bw-on-dark flex flex-none flex-col items-center gap-1 rounded-2xl px-4 py-3" style="background: rgb(20 20 20 / 0.35)">
            <BwScoreRing :value="92" :size="80" label="Brand Score" />
            <p class="bw-label" style="color: rgb(247 242 234 / 0.7)">Herausragend</p>
          </div>
        </div>
      </div>

      <!-- Brand Foundation -->
      <div class="mt-8">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Foundation</p>
        <div class="mt-3 grid gap-4 lg:grid-cols-2">
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Purpose</p>
            <p class="mt-3 leading-relaxed" style="color: var(--bw-ink-soft)">Es gibt uns, damit vielbeschäftigte Menschen auf Oʻahu einen ehrlichen, ruhigen Moment am Tag bekommen — eine Tasse, deren Anbau, Röstung und Ausschank Menschen mit Namen verantworten.</p>
            <p class="bw-label mt-4" style="color: var(--bw-muted)">Anti-Purpose: nie der schnellste Coffee-to-go der Straße sein.</p>
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
            <p class="bw-label" style="color: var(--bw-muted)">Archetyp & Stimme</p>
            <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Der Weise mit einem Rest Schöpfer: erklärt gern, ohne zu dozieren. Ruhig, fundiert, gerade heraus — sagt „unsere Bohnen" statt „Premium-Arabica-Selektion". Benutzt: ehrlich, langsam, von Hand. Meidet: Genuss-Erlebnis, Auszeit, Deluxe.</p>
          </div>
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Manifest (Auszug)</p>
            <p class="mt-3 text-sm italic leading-relaxed" style="color: var(--bw-ink-soft)">„Wir glauben, dass Kaffee kein Treibstoff ist, sondern eine Pause. Dass man wissen darf, woher er kommt und wer ihn gemacht hat. Und dass ein ruhiger Moment am Tag kein Luxus ist — sondern das Mindeste."</p>
          </div>
        </div>
      </div>

      <!-- Brand Language -->
      <div class="mt-8">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Language</p>
        <div class="mt-3 grid gap-4 lg:grid-cols-2">
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Tagline & Messaging</p>
            <p class="mt-3 text-lg font-medium">One honest, quiet moment a day.</p>
            <p class="mt-3 text-sm" style="color: var(--bw-ink-soft)"><span class="bw-label" style="color: var(--bw-muted)">Elevator Pitch · </span>Wir sind eine Rösterei mit Ausschank auf Oʻahu: eine Röstung pro Saison, Herkunft mit Namen, Preise ohne Sternchen. Wer bei uns Kaffee trinkt, weiß, was er in der Hand hält.</p>
          </div>
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Name & Prüfung</p>
            <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Kailua Coffee Co. — Ortsname als Herkunftsversprechen, international aussprechbar. Domain und Social Handles frei, keine Kollision in der ersten Marken-Recherche.</p>
            <p class="bw-label mt-3" style="color: var(--bw-accent)">Geprüft · 08/2026</p>
          </div>
        </div>
      </div>

      <!-- Brand Design -->
      <div class="mt-8">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Design</p>
        <div class="mt-3 grid gap-4 lg:grid-cols-2">
          <div class="bw-card p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Farbwelt</p>
            <div class="mt-4 space-y-2.5">
              <div v-for="c in palette" :key="c.hex" class="flex items-center gap-3">
                <div class="bw-swatch flex-none rounded-full" :style="`background: ${c.hex}; width: 2rem; height: 2rem`" />
                <p class="bw-label w-14" style="color: var(--bw-muted)">{{ c.name }}</p>
                <p class="bw-label" style="color: var(--bw-muted)">{{ c.hex }}</p>
                <p class="ml-auto text-sm" style="color: var(--bw-ink-soft)">{{ c.rolle }}</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="bw-card p-8">
              <p class="bw-label" style="color: var(--bw-muted)">Typografie</p>
              <p class="mt-2 text-4xl font-extralight leading-none tracking-tight">Aa</p>
              <p class="mt-3 text-sm" style="color: var(--bw-ink-soft)">Überschrift: eine warme Serif (ruhig, buchhaft). Text: humanistische Grotesk. Mono für Herkunft, Preise und Etiketten — die Röster-Handschrift.</p>
            </div>
            <div class="bw-card p-8">
              <p class="bw-label" style="color: var(--bw-muted)">Logo · Bildsprache · Motion</p>
              <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Wortmarke mit Wellenpunkt über dem i. Fotografie: Tageslicht, Hände, Herkunft — nie Stock-Lächeln. Motion: ruhig (200 ms), das Logo bewegt sich nicht.</p>
              <p class="bw-label mt-4 leading-relaxed" style="color: var(--bw-muted)">Visual DNA · Contemporary · Minimal · Organic · Serif + Grotesk · Earthy · Editorial · Spacious · Paper + Grain · Calm · Warm</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Brand Book & Kit + Experience -->
      <div class="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Book & Kit</p>
          <div class="bw-card mt-3 p-8">
            <ul class="space-y-3 text-sm" style="color: var(--bw-ink-soft)">
              <li><span class="bw-label" style="color: var(--bw-muted)">Book · </span>24 Kapitel mit Do & Don't, inkl. AI-Guidelines (KI darf erklären, nie „Deluxe" sagen).</li>
              <li><span class="bw-label" style="color: var(--bw-muted)">Tokens · </span>hell/dunkel, Kontrast-geprüft — CSS, Tailwind, Figma.</li>
              <li><span class="bw-label" style="color: var(--bw-muted)">brand.json · </span>Stimme, Vokabular, Tabus — maschinenlesbar.</li>
              <li><span class="bw-label" style="color: var(--bw-muted)">Pressekit · </span>Logos, Boilerplate in 3 Längen, Gründerfoto.</li>
            </ul>
          </div>
        </div>
        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Experience</p>
          <div class="bw-card mt-3 p-8">
            <p class="bw-label" style="color: var(--bw-muted)">Content-Kompass</p>
            <div class="mt-3 space-y-2">
              <div v-for="sl in saeulen" :key="sl.name" class="flex items-baseline justify-between gap-3">
                <p class="text-sm font-medium">{{ sl.name }}</p>
                <p class="bw-label" style="color: var(--bw-muted)">{{ sl.takt }}</p>
              </div>
            </div>
            <p class="bw-label mt-5" style="color: var(--bw-muted)">Zitierfähige Fakten (SEO & GEO)</p>
            <ul class="mt-2 space-y-1.5 text-sm" style="color: var(--bw-ink-soft)">
              <li v-for="f in fakten" :key="f">{{ f }}</li>
            </ul>
            <p class="bw-label mt-5" style="color: var(--bw-muted)">Vor Ort · Bewertungs-Stimme (Beispiel)</p>
            <p class="mt-2 text-sm italic" style="color: var(--bw-ink-soft)">„Danke dir, Keanu — die Röstung dieser Saison ist kräftiger, stimmt. Komm Donnerstag vorbei, da brühen wir sie langsamer."</p>
          </div>
        </div>
      </div>

      <!-- Score + Monitoring -->
      <div class="mt-8 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div class="bw-card p-8">
          <div class="flex items-baseline justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">Brand Score</p>
            <p class="bw-label" style="color: var(--bw-muted)">Alle Schichten bewertet</p>
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
        <div class="bw-card p-8">
          <div class="flex items-baseline justify-between gap-3">
            <p class="bw-label" style="color: var(--bw-muted)">Brand Monitoring</p>
            <p class="bw-label" style="color: var(--bw-accent)">Aktiv</p>
          </div>
          <BwSparkline :values="[86, 87, 88, 88, 90, 90, 91, 92, 92, 92]" :width="200" :height="36" class="mt-4" style="color: var(--bw-line-strong)" />
          <p class="mt-3 text-sm" style="color: var(--bw-ink-soft)">Außenbild deckungsgleich; KI-Assistenten nennen Herkunft und Ort korrekt. Letzte Prüfung: diese Woche.</p>
        </div>
      </div>

      <div class="bw-card mt-8 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">So sieht ein fertiges Branding aus — deins beginnt mit einem Gespräch.</p>
        <UButton icon="i-ph-plus" label="Starte dein Branding" class="rounded-full" />
      </div>
      </div>
      <BwSiteFooter />
    </div>
  </div>
</template>
