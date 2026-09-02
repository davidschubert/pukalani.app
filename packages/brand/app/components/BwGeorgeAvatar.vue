<script setup lang="ts">
/** Beraterbild (Runde 41, David): Nuxt UI UAvatar ohne Ring. Kopf 3xl,
 *  Nachrichten kleiner (UI-Audit C12).
 *
 *  SEIT DEM SICHTBAREN TEAM (2026-09-01) trägt die Komponente einen NAMEN und
 *  nicht mehr nur George: `src` leer ⇒ Monogramm statt Bild. Nur George hat
 *  heute ein Bild (/george.jpg, dog.ceo-Platzhalter, Davids eigenes folgt) —
 *  welches Teammitglied eines hat, weiss die Berater-Registry
 *  (`brandAdvisors.ts`, Feld `avatar`), nicht diese Komponente. Die Defaults
 *  bleiben Georges, damit jeder bestehende Aufruf ohne Attribute unverändert
 *  aussieht. */
withDefaults(defineProps<{
  size?: 'md' | 'xl' | '3xl'
  /** Bildpfad; leer ⇒ Monogramm. */
  src?: string
  /** Das Monogramm (ein Buchstabe reicht). */
  initial?: string
  alt?: string
}>(), { size: '3xl', src: '/george.jpg', initial: 'G', alt: 'George' })
</script>

<template>
  <UAvatar v-if="src" :src="src" :alt="alt" :size="size" class="flex-none" />
  <UAvatar v-else :text="initial" :alt="alt" :size="size" class="flex-none" />
</template>
