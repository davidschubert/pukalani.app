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
 * WAS ES TUT (Davids Entscheidung 2026-09-03: „auf der Branding-Übersicht
 * bitte die richtige Navbar — dieselbe wie ganz oben im Wizard, eingesetzt,
 * nicht drübergelegt"): es rendert `BwSiteNav` IM FLUSS über dem Inhalt —
 * dieselbe Leiste wie im Werkstatt-Kopf (`BwWorkspace`) und auf /team, statt
 * der Core-Kopfzeile, die hier vorher durchgereicht wurde. Der `px-6`-Wirt
 * gehört dazu: die Leiste zieht sich mit `-mx-6` bündig an die Kanten
 * (dasselbe Muster wie team.vue). `bw-root` macht den Rahmen zum Token-Wirt
 * und malt den Seiten-Grund.
 */
</script>

<template>
  <div class="bw-root min-h-dvh px-6">
    <BwSiteNav />
    <slot />
  </div>
</template>
