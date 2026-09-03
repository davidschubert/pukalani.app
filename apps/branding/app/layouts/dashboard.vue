<script setup lang="ts">
/**
 * DAS `dashboard`-LAYOUT, DAS DER brand-LAYER ANFORDERT — hier in der App,
 * nicht im Layer, und bewusst DÜNN.
 *
 * WARUM ES DIESE DATEI GIBT: `packages/brand/app/pages/dashboard/brands/*`
 * schreibt `definePageMeta({ layout: 'dashboard' })`. Dieses Layout gehört dem
 * `admin`-Layer — auf `portfolio` war es da, auf branding.supply ist es das
 * nicht. Ohne Ersatz ist das kein kosmetischer Mangel, sondern ROT: der
 * Typecheck kennt nur die Layout-Namen der montierten Layer und lehnt
 * `'dashboard'` ab (TS2322, gemessen 2026-08-31), und zur Laufzeit meldet Nuxt
 * `NUXT_E4001 Invalid layout dashboard selected`.
 *
 * WARUM NICHT `admin` MITNEHMEN: siehe Git-Historie dieser Datei — die
 * Betreiber-Shell samt changelog-Tabellen und themes-Kopplung wäre drei Layer
 * für eine Konsole ohne Inhalte. Das bleibt Davids Produkt-Entscheidung.
 *
 * WAS ES TUT: durchreichen an das App-`default`-Layout — seit dem
 * 2026-09-03 trägt DAS die Wizard-Nav (`BwSiteNav`) und den Fuß; eine
 * eigene Fassung hier wäre die zweite Wahrheit über dieselbe Kopfzeile.
 */
</script>

<template>
  <NuxtLayout name="default">
    <slot />
  </NuxtLayout>
</template>
