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
 * WARUM NICHT EINFACH `admin` MITNEHMEN: `admin` bringt die Betreiber-
 * Navigation und die changelog-Tabelle mit (admin-001…003) — der Infra-Plan §3
 * nennt für die Instanz `branding` ausdrücklich NUR `system-001…038` +
 * `brand-001…008`. Dazu koppelt die Dashboard-Shell des Layers über
 * `DashboardUserMenu` an `useTheme()` aus dem `themes`-Layer; aus einem
 * zusätzlichen Layer würden also drei, und branding.supply hätte eine
 * Betreiber-Konsole, für die es weder Betreiber-Inhalte noch Module gibt (der
 * brand-Layer registriert KEIN `pukalani.admin.modules`-Modul).
 *
 * WAS ES TUT: es reicht an das `default`-Layout des Core durch — dieselbe
 * Kopf-/Fusszeile wie der Rest der Site, dieselbe Marke, dasselbe Konto-Menü,
 * keine zweite Wahrheit. Der Vollbild-Workspace des Wizards ist davon
 * unberührt: der läuft über das layer-eigene Layout `brand-workspace`.
 *
 * UMKEHRBAR: wer branding.supply später doch eine echte Dashboard-Shell geben
 * will, nimmt `admin` (+ `themes`) ins Site-Manifest auf und LÖSCHT diese
 * Datei — sie würde das Layer-Layout sonst überlagern (App schlägt Layer).
 * Das ist eine Produkt-Entscheidung (Betreiber-Shell auf einer Kunden-Domain?)
 * und gehört zu David, nicht in einen Nebensatz dieses Umzugs.
 */
</script>

<template>
  <NuxtLayout name="default">
    <slot />
  </NuxtLayout>
</template>
