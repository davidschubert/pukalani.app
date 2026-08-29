<script setup lang="ts">
/** Clickdummy: "Meine Brands" (Dashboard-Modul-Vorschau). */
const newBrandOpen = ref(false)
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Meine Brands</h1>
          <p class="text-sm" style="color: var(--bw-muted)">Jede Brand ist ein eigener Wizard-Lauf — pausiere jederzeit, dein Stand bleibt gespeichert.</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton to="/brand/demo/discover" icon="i-ph-compass" label="Discover" size="lg" color="neutral" variant="ghost" class="rounded-full" />
          <UButton icon="i-ph-plus" label="Neue Brand" size="lg" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" @click="newBrandOpen = true" />
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink to="/brand/demo/werte" class="block">
          <BwBrandCard
            title="Kailua Coffee Co." path="Neugründung" flag="i-circle-flags-us"
            step="Gerade dran: Werte" progress="4 von 7 Entscheidungen" remaining="~20 Min" :pct="57" :activity="[2, 0, 3, 5, 4, 0, 0, 6, 8, 5, 9, 7, 4, 10]" :score="74"
            edited="zuletzt vor 2 Stunden"
          />
        </NuxtLink>
        <NuxtLink to="/brand/demo/archetyp" class="block">
          <BwBrandCard
            title="Schubert UX Studio" path="Rebrand" flag="i-circle-flags-de"
            step="Gerade dran: Archetyp & Stimme" progress="6 von 7 Entscheidungen" remaining="~10 Min" :pct="86" :activity="[8, 6, 9, 4, 0, 2, 5, 3, 6, 0, 1, 4, 7, 12]" :score="87"
            edited="zuletzt gestern"
          />
        </NuxtLink>
      </div>
      <div class="bw-rounded-card mt-10 border border-dashed p-10 text-center" style="border-color: var(--bw-line-strong)">
        <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
        <p class="mt-4 font-medium">So sieht der Leerzustand aus:</p>
        <p class="mt-1 text-sm" style="color: var(--bw-muted)">Lass uns deine erste Brand aufbauen. Du kannst jederzeit pausieren — dein Stand bleibt gespeichert.</p>
        <UButton class="mt-4" icon="i-ph-plus" label="Erste Brand starten" variant="outline" @click="newBrandOpen = true" />
      </div>
    </div>
    <BwNewBrandModal v-model:open="newBrandOpen" />
  </div>
</template>
