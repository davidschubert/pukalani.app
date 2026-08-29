<script setup lang="ts">
/** Clickdummy: Journal-Detailseite (Phase-2-Vorgeschmack) — der Artikel
 *  als Präsentationsschicht der Knowledge Base: Insight-Kasten mit
 *  Evidence, Brand-Verweise, Quellvideo transparent eingebettet. */
const mentionedBrands = [
  { name: 'Burberry', score: 86 },
  { name: 'Saint Laurent', score: 84 },
  { name: 'Balenciaga', score: 81 },
]
const related = [
  { topic: 'Rebranding', title: 'Was kostet ein Rebranding wirklich?' },
  { topic: 'Visual Identity', title: 'Typografie ist Stimme in Form' },
  { topic: 'Brand Psychology', title: 'Warum jede Kategorie ihre Konventionen hat' },
]
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-4xl">
      <NuxtLink to="/brand/demo/journal" class="bw-label inline-flex items-center gap-1.5" style="color: var(--bw-muted)">
        <UIcon name="i-ph-arrow-left" class="size-4" /> Journal
      </NuxtLink>

      <!-- Kopf -->
      <div class="mt-6 max-w-2xl">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Rebranding · 8 Min Lesezeit</p>
        <h1 class="mt-2 text-4xl leading-tight">Warum Luxusmarken ihre Serifen aufgeben</h1>
        <p class="mt-4 text-lg leading-relaxed" style="color: var(--bw-ink-soft)">Burberry, Saint Laurent, Balenciaga — und plötzlich sehen alle gleich aus. Was hinter der großen Vereinheitlichung steckt, und wann sie ein Fehler ist.</p>
        <div class="mt-6 flex items-center gap-3">
          <UAvatar text="LK" size="md" />
          <p class="bw-label" style="color: var(--bw-muted)">Lena K. · 29. August 2026 · Aktualisiert bei neuen Fällen</p>
        </div>
      </div>

      <!-- Artikel-Körper -->
      <div class="mt-10 max-w-2xl space-y-5 leading-relaxed" style="color: var(--bw-ink-soft)">
        <p>Als Burberry 2018 seine Serifen-Wortmarke gegen eine geometrische Grotesk tauschte, war der Aufschrei groß — und kurz. Innerhalb von drei Jahren folgten Saint Laurent, Balmain, Berluti und ein Dutzend weitere. Die Luxusbranche, deren Kapital jahrzehntelang aus Herkunft und Handschrift bestand, sah plötzlich aus wie ein einziges Tech-Startup.</p>
        <h2 class="pt-2 text-xl" style="color: var(--bw-ink)">Die große Vereinheitlichung</h2>
        <p>Die üblichen Erklärungen — „funktioniert besser auf kleinen Screens", „wirkt moderner" — greifen zu kurz. Der eigentliche Treiber war ein Systemwechsel: Luxusmarken wurden von Produkt-Häusern zu Content-Häusern, und eine neutrale Wortmarke stört keine Kampagne. Das Logo trat zurück, damit das Bild regieren kann.</p>
        <blockquote class="border-l-2 py-1 pl-5 text-lg font-medium" style="border-color: var(--bw-accent); color: var(--bw-ink)">
          Wer schon besitzt, woran man ihn erkennt, riskiert beim radikalen Schnitt am meisten.
        </blockquote>
        <p>Genau hier liegt die Falle: Eigenständigkeit ist Markenkapital. Eine Serifen-Wortmarke mit hundert Jahren Wiedererkennung ist kein Staub, den man abwischt — sie ist ein Vermögenswert, den man abschreibt.</p>
      </div>

      <!-- Insight aus der Knowledge Base -->
      <div class="bw-card mt-8 max-w-2xl p-8">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="bw-label" style="color: var(--bw-muted)">Insight aus der Knowledge Base</p>
          <p class="bw-label" style="color: var(--bw-accent)">Verifiziert · Confidence 0.91</p>
        </div>
        <p class="mt-3 font-medium leading-snug">Radikale Identitätswechsel tragen das höchste Wiedererkennungs-Risiko dort, wo bereits starke eigenständige Markenzeichen existieren.</p>
        <p class="bw-label mt-3" style="color: var(--bw-muted)">3 Quellen · 14 Brand-Fälle · fließt in das Prüfkriterium „Eigenständigkeit" ein</p>
      </div>

      <!-- Weiter im Text -->
      <div class="mt-8 max-w-2xl space-y-5 leading-relaxed" style="color: var(--bw-ink-soft)">
        <h2 class="pt-2 text-xl" style="color: var(--bw-ink)">Wann der Schritt ein Fehler ist</h2>
        <p>Die Rechnung ist einfacher, als sie klingt: Je mehr eigenständige Zeichen eine Marke besitzt — Schrift, Farbe, Muster, Symbol —, desto teurer ist der radikale Schnitt und desto besser fährt sie mit Evolution statt Revolution. Wer dagegen wenig besitzt, kann mit einem klaren Schnitt tatsächlich Kapital aufbauen. Rolex muss nicht innovativ sein; ein junges Label darf nicht vorsichtig sein.</p>
      </div>

      <!-- Erwähnte Brands -->
      <div class="mt-10 max-w-2xl">
        <p class="bw-label" style="color: var(--bw-muted)">Erwähnte Brands</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="b in mentionedBrands" :key="b.name" class="bw-select-card flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-sm">
            {{ b.name }}
            <BwScoreRing :value="b.score" :size="26" class="flex-none" />
          </span>
        </div>
      </div>

      <!-- Quellvideo (Transparenz-Regel) -->
      <div class="bw-card mt-8 flex max-w-2xl items-center gap-4 p-6">
        <span class="grid size-12 flex-none place-items-center rounded-full" style="background: var(--bw-surface)">
          <UIcon name="i-ph-play-fill" class="size-5" style="color: var(--bw-ink-soft)" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="bw-label" style="color: var(--bw-muted)">Weiterschauen · dieser Artikel wurde durch das Video angestoßen</p>
          <p class="mt-1 truncate font-medium">The Futur — Why Luxury Brands Look the Same Now</p>
        </div>
      </div>

      <!-- Verwandte Artikel + CTA -->
      <div class="mt-10 max-w-2xl">
        <p class="bw-label" style="color: var(--bw-muted)">Verwandte Artikel</p>
        <div class="mt-3 space-y-2">
          <div v-for="r in related" :key="r.title" class="bw-card bw-card--hover flex items-center justify-between gap-3 px-5 py-4">
            <div class="min-w-0">
              <p class="bw-label" style="color: var(--bw-muted)">{{ r.topic }}</p>
              <p class="truncate text-sm font-medium">{{ r.title }}</p>
            </div>
            <UIcon name="i-ph-arrow-right" class="size-4 flex-none" style="color: var(--bw-muted)" />
          </div>
        </div>
      </div>

      <div class="bw-card mt-8 flex max-w-2xl flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">Wie eigenständig ist deine Marke? Finde es heraus — mit denselben Kriterien wie in diesem Artikel.</p>
        <UButton icon="i-ph-plus" label="Starte deine Brand" class="rounded-full" />
      </div>
    </div>
  </div>
</template>
