<script setup lang="ts">
/** Clickdummy: "Meine Brands" (Dashboard-Modul-Vorschau). */
const newBrandOpen = ref(false)
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="@container mx-auto max-w-7xl">
      <div>
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold">Brandings</h1>
        <p class="mt-1 text-sm" style="color: var(--bw-muted)">Jedes Branding ist ein eigener Wizard-Lauf — pausiere jederzeit, dein Stand bleibt gespeichert.</p>
      </div>
      <div class="grid gap-x-6 gap-y-20 @sm:grid-cols-2 @md:grid-cols-4">
        <NuxtLink to="/brand/demo/werte" class="block">
          <BwBrandCard
            title="Kailua Coffee Co." path="Neue Marke" flag="i-circle-flags-us"
            :gradient="['#e8d3b8', '#b98a5e', '#4a3123']"
            step="Gerade dran: Werte" progress="4 von 7 Entscheidungen" remaining="~20 Min" :pct="57" :activity="[2, 0, 3, 5, 4, 0, 0, 6, 8, 5, 9, 7, 4, 10]" :score="74"
            edited="zuletzt vor 2 Stunden"
          />
        </NuxtLink>
        <NuxtLink to="/brand/demo/archetyp" class="block">
          <BwBrandCard
            title="Schubert UX Studio" path="Marken-Relaunch" flag="i-circle-flags-de"
            :gradient="['#e2e4ea', '#8a93ad', '#2b3148']"
            step="Gerade dran: Archetyp & Stimme" progress="6 von 7 Entscheidungen" remaining="~10 Min" :pct="86" :activity="[8, 6, 9, 4, 0, 2, 5, 3, 6, 0, 1, 4, 7, 12]" :score="87"
            edited="zuletzt gestern"
          />
        </NuxtLink>
      </div>
      <!-- Beispiel-Brand-Teaser + Leerzustand nebeneinander (Runde 134) -->
      <div class="mt-20 grid items-stretch gap-6 lg:grid-cols-2">
      <NuxtLink to="/brand/demo/beispiel" class="bw-card bw-card--hover grid items-center gap-6 p-8 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div class="bw-tile relative hidden overflow-hidden sm:block" style="aspect-ratio: 1 / 1; background: linear-gradient(165deg, #e8d3b8 0%, #b98a5e 45%, #4a3123 100%)">
          <p class="absolute inset-0 grid place-items-center p-4 text-center text-base font-extralight leading-snug tracking-tight" style="color: #f7f2ea; text-shadow: 0 1px 12px rgb(20 20 20 / 0.3)">Kailua Coffee Co.</p>
        </div>
        <div class="min-w-0">
          <p class="bw-label" style="color: var(--bw-muted)">Beispiel-Branding · mit George gebaut</p>
          <h2 class="mt-2 text-2xl font-medium tracking-tight">So sieht fertig aus: Kailua Coffee Co.</h2>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed" style="color: var(--bw-ink-soft)">Eine vollständige Referenz durch alle sechs Schichten — Purpose, Werte und Stimme, Tagline und Namens-Prüfung, Farbwelt und Typografie, Book & Kit, Content-Kompass und aktives Monitoring. Brand Score 92, jede Entscheidung mit Begründung.</p>
          <p class="bw-label mt-5 inline-flex items-center gap-1.5" style="color: var(--bw-muted)">Beispiel-Branding ansehen <UIcon name="i-ph-arrow-right" class="size-3.5" /></p>
        </div>
      </NuxtLink>

      <div class="bw-rounded-card flex flex-col items-center justify-center border border-dashed p-10 text-center" style="border-color: var(--bw-line-strong)">
        <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
        <p class="mt-4 font-medium">So sieht der Leerzustand aus:</p>
        <p class="mt-1 text-sm" style="color: var(--bw-muted)">Lass uns dein erstes Branding aufbauen. Du kannst jederzeit pausieren — dein Stand bleibt gespeichert.</p>
        <UButton class="mt-4" icon="i-ph-plus" label="Erstes Branding starten" variant="outline" @click="newBrandOpen = true" />
      </div>
      </div>
      </div>
      <BwSiteFooter />
    </div>
    <BwNewBrandModal v-model:open="newBrandOpen" />
  </div>
</template>
