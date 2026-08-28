<script setup lang="ts">
/** Clickdummy: "Meine Brands" (Dashboard-Modul-Vorschau). */
</script>

<template>
  <div class="bw-root min-h-dvh px-6 py-10">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Meine Brands</h1>
          <p class="text-sm" style="color: var(--bw-muted)">Jede Brand ist ein eigener Wizard-Lauf — pausiere jederzeit, dein Stand bleibt gespeichert.</p>
        </div>
        <UButton icon="i-ph-plus" label="Neue Brand" size="lg" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink to="/brand/demo/werte" class="block">
          <BwBrandCard
            title="Kailua Coffee Co." path="Neugründung · Inhalt: EN"
            step="Gerade dran: Werte" progress="4 von 7 Grundlagen geklärt" remaining="~20 Minuten"
            edited="zuletzt vor 2 Stunden"
          />
        </NuxtLink>
        <NuxtLink to="/brand/demo/archetyp" class="block">
          <BwBrandCard
            title="Schubert UX Studio" path="Rebrand · Inhalt: DE"
            step="Gerade dran: Archetyp & Stimme" progress="6 von 7 Grundlagen geklärt" remaining="~10 Minuten"
            edited="zuletzt gestern"
          />
        </NuxtLink>
      </div>
      <div class="mt-10 rounded-lg border border-dashed p-8 text-center" style="border-color: var(--bw-line-strong)">
        <p class="font-medium">So sieht der Leerzustand aus:</p>
        <p class="mt-1 text-sm" style="color: var(--bw-muted)">Lass uns deine erste Brand aufbauen. Du kannst jederzeit pausieren — dein Stand bleibt gespeichert.</p>
        <UButton class="mt-4" icon="i-ph-plus" label="Erste Brand starten" variant="outline" />
      </div>
    </div>
  </div>
</template>
