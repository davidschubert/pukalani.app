<script setup lang="ts">
/**
 * Settings → Allgemein: die Profil-Fläche des Kontos.
 *
 * Seit AH-2 (2026-08-11) steht hier NUR noch der Aufruf: die Anordnung der
 * beiden Karten lebt in `UserProfilePanel` (core), weil dieselbe Fläche auch
 * `/profile` auf account.pukalani.app trägt. Davids Vorgabe: EINE
 * Implementierung — was hier steht, steht dort, und umgekehrt.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

/**
 * Der Titel stand bis AH-2 UNTERHALB des schliessenden script-Tags — also im
 * Niemandsland zwischen den SFC-Blöcken, wo der Compiler ihn stillschweigend
 * verwirft. Die Seite lief, der Tab hieß nur nie „Allgemein". Genau so
 * entstehen titellose Seiten, ohne dass Lint, Typecheck oder Test etwas melden.
 *
 * (Der Tag selbst gehört übrigens nicht in diesen Kommentar: der SFC-Parser
 * sucht ihn TEXTUELL und würde den Block hier beenden — beim Schreiben dieser
 * Zeile prompt passiert.)
 */
useHead({ title: () => t('dashboard.settings.general') })
</script>

<template>
  <UserProfilePanel />
</template>
