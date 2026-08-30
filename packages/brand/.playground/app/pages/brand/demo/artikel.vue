<script setup lang="ts">
/** Clickdummy: Journal-Detailseite nach dem Muster der OpenAI-Report-
 *  Seiten — zentrierter Kopf mit Datum + CTAs, Teilen-Zeile, sticky
 *  Inhaltsverzeichnis mit Scrollspy, breites Chart, CTA-Banner,
 *  „Mehr lesen". Der TOC ist hier handgebaut; im echten Bau kommt
 *  UContentToc (braucht @nuxt/content). Statisch. */
const toast = useToast()

const toc = [
  { id: 'einfuehrung', label: 'Einführung', children: [
    { id: 'vereinheitlichung', label: 'Die große Vereinheitlichung' },
    { id: 'serifen-kurve', label: 'Serifen in Zahlen' },
  ] },
  { id: 'insight', label: 'Insight aus der Knowledge Base' },
  { id: 'fehler', label: 'Wann der Schritt ein Fehler ist' },
  { id: 'brands', label: 'Erwähnte Brands' },
  { id: 'quelle', label: 'Quellvideo' },
]
const activeId = ref('einfuehrung')
/** Scrollspy: aktiv ist der letzte Abschnitt, dessen Oberkante die
 *  Lese-Linie (oberes Drittel) passiert hat — robust auch bei
 *  Sprüngen, wo ein IntersectionObserver-Band leer bleibt. */
let ticking = false
function updateActive(): void {
  const line = window.innerHeight * 0.35
  let current = 'einfuehrung'
  document.querySelectorAll<HTMLElement>('[data-toc]').forEach((el) => {
    if (el.getBoundingClientRect().top <= line) current = el.id
  })
  activeId.value = current
}
let suppressUntil = 0
function onScroll(): void {
  if (ticking || Date.now() < suppressUntil) return
  ticking = true
  requestAnimationFrame(() => {
    updateActive()
    ticking = false
  })
}
onMounted(() => {
  updateActive()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
function jumpTo(id: string): void {
  activeId.value = id
  suppressUntil = Date.now() + 1500
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
async function share(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.add({ title: 'Link kopiert', duration: 2000 })
  }
  catch {
    toast.add({ title: 'Kopieren nicht möglich', duration: 2000 })
  }
}

/** Dummy-Daten: Anteil Serifen-Wortmarken unter den 100 größten
 *  Luxusmarken (redaktionell erhoben). */
const chartYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const chartValues = [71, 69, 66, 62, 55, 49, 43, 38, 32, 27, 22, 18]
const chartW = 640
const chartH = 220
const padL = 42
const padR = 16
const padT = 12
const padB = 28
const chartPoints = computed(() => chartValues.map((v, i) => {
  const x = padL + i * ((chartW - padL - padR) / (chartValues.length - 1))
  const y = padT + (1 - v / 80) * (chartH - padT - padB)
  return { x, y, v, year: chartYears[i] }
}))
const chartPath = computed(() => chartPoints.value.map(p => `${p.x},${p.y}`).join(' '))

const mentionedBrands = [
  { name: 'Burberry', score: 86 },
  { name: 'Saint Laurent', score: 84 },
  { name: 'Balenciaga', score: 81 },
]
const more = [
  { topic: 'Rebranding', title: 'Was kostet ein Rebranding wirklich?', a: '#efe6db', b: '#a89684' },
  { topic: 'Visual Identity', title: 'Typografie ist Stimme in Form', a: '#dbe9ec', b: '#7fb0ba' },
  { topic: 'Brand Psychology', title: 'Warum jede Kategorie ihre Konventionen hat', a: '#e8d3b8', b: '#b98a5e' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-7xl">
      <BwSiteNav />

      <!-- Zentrierter Kopf -->
      <div class="mx-auto mt-6 max-w-3xl text-center">
        <p class="bw-label" style="color: var(--bw-muted)">29. August 2026 · Rebranding · 8 Min Lesezeit</p>
        <h1 class="mt-5 text-balance text-4xl font-extralight leading-tight tracking-tight sm:text-5xl">Warum Luxusmarken ihre Serifen aufgeben</h1>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
          <UButton label="Starte deine Brand" icon="i-ph-plus" class="rounded-full" />
          <UButton to="/brand/demo/journal" label="Alle Artikel" color="neutral" variant="ghost" class="rounded-full" style="background: var(--bw-surface)" />
        </div>
      </div>

      <!-- Teilen-Zeile -->
      <div class="mx-auto mt-12 max-w-4xl">
        <USeparator :ui="{ border: 'border-(--bw-line)' }" />
        <button class="bw-label mt-4 inline-flex items-center gap-1.5" style="color: var(--bw-muted)" @click="share">
          <UIcon name="i-ph-link" class="size-4" /> Teilen
        </button>
      </div>

      <!-- Zweispalter: TOC + Artikel -->
      <div class="mx-auto mt-10 grid max-w-4xl gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <!-- Inhaltsverzeichnis (sticky, Scrollspy) -->
        <nav class="hidden self-start lg:sticky lg:top-10 lg:block" aria-label="Inhalt">
          <ul class="space-y-2.5">
            <li v-for="s in toc" :key="s.id">
              <button
                class="bw-label block text-left transition-colors"
                :style="`color: ${activeId === s.id ? 'var(--bw-ink)' : 'var(--bw-muted)'}`"
                @click="jumpTo(s.id)"
              >{{ s.label }}</button>
              <ul v-if="s.children" class="mt-2 space-y-2 pl-3">
                <li v-for="c in s.children" :key="c.id">
                  <button
                    class="bw-label block text-left transition-colors"
                    :style="`color: ${activeId === c.id ? 'var(--bw-ink)' : 'var(--bw-muted)'}`"
                    @click="jumpTo(c.id)"
                  >{{ c.label }}</button>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <!-- Artikel -->
        <article class="min-w-0">
          <section id="einfuehrung" data-toc class="scroll-mt-10">
            <h2 class="text-2xl font-medium tracking-tight">Einführung</h2>
            <p class="mt-4 text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Burberry, Saint Laurent, Balenciaga — und plötzlich sehen alle gleich aus. Was hinter der großen Vereinheitlichung steckt, und wann sie ein Fehler ist.</p>
            <div class="mt-5 flex items-center gap-3">
              <UAvatar text="LK" size="md" />
              <p class="bw-label" style="color: var(--bw-muted)">Lena K. · Aktualisiert bei neuen Fällen</p>
            </div>
          </section>

          <section id="vereinheitlichung" data-toc class="mt-12 scroll-mt-10 space-y-5 leading-relaxed" style="color: var(--bw-ink-soft)">
            <h3 class="text-xl" style="color: var(--bw-ink)">Die große Vereinheitlichung</h3>
            <p>Als Burberry 2018 seine Serifen-Wortmarke gegen eine geometrische Grotesk tauschte, war der Aufschrei groß — und kurz. Innerhalb von drei Jahren folgten Saint Laurent, Balmain, Berluti und ein Dutzend weitere. Die Luxusbranche, deren Kapital jahrzehntelang aus Herkunft und Handschrift bestand, sah plötzlich aus wie ein einziges Tech-Startup.</p>
            <p>Die üblichen Erklärungen — „funktioniert besser auf kleinen Screens", „wirkt moderner" — greifen zu kurz. Der eigentliche Treiber war ein Systemwechsel: Luxusmarken wurden von Produkt-Häusern zu Content-Häusern, und eine neutrale Wortmarke stört keine Kampagne. Das Logo trat zurück, damit das Bild regieren kann.</p>
            <blockquote class="border-l-2 py-1 pl-5 text-lg font-medium" style="border-color: var(--bw-accent); color: var(--bw-ink)">
              Wer schon besitzt, woran man ihn erkennt, riskiert beim radikalen Schnitt am meisten.
            </blockquote>
          </section>

          <!-- Breites Chart -->
          <section id="serifen-kurve" data-toc class="mt-12 scroll-mt-10">
            <p class="text-lg font-medium">Serifen-Wortmarken unter den 100 größten Luxusmarken</p>
            <p class="bw-label mt-1" style="color: var(--bw-muted)">Anteil in Prozent · 2015–2026 · redaktionell erhoben</p>
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="mt-5 w-full" role="img" aria-label="Linienchart: Anteil der Serifen-Wortmarken fällt von 71 Prozent (2015) auf 18 Prozent (2026)">
              <g v-for="v in [0, 20, 40, 60, 80]" :key="v">
                <line :x1="padL" :x2="chartW - padR" :y1="padT + (1 - v / 80) * (chartH - padT - padB)" :y2="padT + (1 - v / 80) * (chartH - padT - padB)" stroke="var(--bw-line)" stroke-width="1" />
                <text :x="padL - 8" :y="padT + (1 - v / 80) * (chartH - padT - padB) + 3" text-anchor="end" font-size="10" font-family="'Geist Mono', monospace" fill="var(--bw-muted)">{{ v }}</text>
              </g>
              <polyline :points="chartPath" fill="none" stroke="var(--bw-accent)" stroke-width="1.5" />
              <g v-for="p in chartPoints" :key="p.year">
                <circle :cx="p.x" :cy="p.y" r="3.5" fill="var(--bw-accent-soft)" stroke="var(--bw-accent)" stroke-width="1.5" />
                <text v-if="p.year % 2 === 1 || p.year === 2026" :x="p.x" :y="chartH - 8" text-anchor="middle" font-size="10" font-family="'Geist Mono', monospace" fill="var(--bw-muted)">{{ p.year }}</text>
              </g>
            </svg>
          </section>

          <!-- Insight aus der Knowledge Base -->
          <section id="insight" data-toc class="mt-12 scroll-mt-10">
            <div class="bw-card p-8">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="bw-label" style="color: var(--bw-muted)">Insight aus der Knowledge Base</p>
                <p class="bw-label" style="color: var(--bw-accent)">Verifiziert · Confidence 0.91</p>
              </div>
              <p class="mt-3 font-medium leading-snug">Radikale Identitätswechsel tragen das höchste Wiedererkennungs-Risiko dort, wo bereits starke eigenständige Markenzeichen existieren.</p>
              <p class="bw-label mt-3" style="color: var(--bw-muted)">3 Quellen · 14 Brand-Fälle · fließt in das Prüfkriterium „Eigenständigkeit" ein</p>
            </div>
          </section>

          <section id="fehler" data-toc class="mt-12 scroll-mt-10 space-y-5 leading-relaxed" style="color: var(--bw-ink-soft)">
            <h2 class="text-2xl font-medium tracking-tight" style="color: var(--bw-ink)">Wann der Schritt ein Fehler ist</h2>
            <p>Die Rechnung ist einfacher, als sie klingt: Je mehr eigenständige Zeichen eine Marke besitzt — Schrift, Farbe, Muster, Symbol —, desto teurer ist der radikale Schnitt und desto besser fährt sie mit Evolution statt Revolution. Wer dagegen wenig besitzt, kann mit einem klaren Schnitt tatsächlich Kapital aufbauen. Rolex muss nicht innovativ sein; ein junges Label darf nicht vorsichtig sein.</p>
          </section>

          <section id="brands" data-toc class="mt-12 scroll-mt-10">
            <p class="bw-label" style="color: var(--bw-muted)">Erwähnte Brands</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-for="b in mentionedBrands" :key="b.name" class="bw-select-card flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-sm">
                {{ b.name }}
                <BwScoreRing :value="b.score" :size="26" class="flex-none" />
              </span>
            </div>
          </section>

          <section id="quelle" data-toc class="mt-10 scroll-mt-10">
            <div class="bw-card flex items-center gap-4 p-6">
              <span class="grid size-12 flex-none place-items-center rounded-full" style="background: var(--bw-surface)">
                <UIcon name="i-ph-play-fill" class="size-5" style="color: var(--bw-ink-soft)" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="bw-label" style="color: var(--bw-muted)">Weiterschauen · dieser Artikel wurde durch das Video angestoßen</p>
                <p class="mt-1 truncate font-medium">The Futur — Why Luxury Brands Look the Same Now</p>
              </div>
            </div>
          </section>
        </article>
      </div>

      <!-- CTA-Banner -->
      <UPageCTA
        title="Wie eigenständig ist deine Marke?"
        description="Finde es heraus — mit denselben 40 Prüfkriterien wie in diesem Artikel. George führt dich durch, Entscheidung für Entscheidung."
        :links="[
          { label: 'Starte deine Brand', icon: 'i-ph-plus', color: 'neutral' },
          { label: 'Beispiel-Brand ansehen', to: '/brand/demo/beispiel', color: 'neutral', variant: 'ghost' },
        ]"
        class="bw-card mx-auto mt-20 max-w-5xl"
        :ui="{ title: 'text-3xl font-medium tracking-tight sm:text-4xl', description: 'text-base', container: 'py-14 sm:py-16' }"
      />

      <!-- Mehr lesen -->
      <div class="mx-auto mt-16 max-w-5xl">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-medium">Mehr lesen</h2>
          <NuxtLink to="/brand/demo/journal" class="bw-label" style="color: var(--bw-muted)">Alles anzeigen</NuxtLink>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div v-for="m in more" :key="m.title" class="bw-card bw-card--hover overflow-hidden">
            <div class="h-28" :style="`background: linear-gradient(135deg, ${m.b}, ${m.a})`" />
            <div class="p-5">
              <p class="bw-label" style="color: var(--bw-muted)">{{ m.topic }}</p>
              <p class="mt-1.5 text-sm font-medium leading-snug">{{ m.title }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="bw-pending mt-16 text-center">Dummy — Chart-Daten redaktionell erfunden; im echten Bau kommt der TOC aus @nuxt/content (UContentToc).</p>
    </div>
  </div>
</template>
