<script setup lang="ts">
/** Linien-Illustrationen (Iteration 2): handgezeichnete Strich-Motive
 *  in currentColor — heute nur 'journey' (der Weg zur Marke, für
 *  Leerzustände), weitere Varianten docken hier an. */
withDefaults(defineProps<{ variant?: 'journey' }>(), { variant: 'journey' })
</script>

<template>
  <svg
    v-if="variant === 'journey'"
    viewBox="0 0 220 80" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Startpunkt -->
    <circle cx="12" cy="66" r="3" fill="currentColor" stroke="none" />
    <!-- gepunkteter Weg -->
    <path d="M18 65 C 60 62, 66 30, 108 32 S 168 44, 194 20" stroke-dasharray="0.1 7" />
    <!-- Zwischenstationen -->
    <circle cx="108" cy="32" r="2.2" fill="currentColor" stroke="none" opacity="0.55" />
    <!-- Fahne am Ziel -->
    <path d="M196 18 V 44" />
    <path d="M196 18 l 16 4.5 -16 5.5 Z" fill="currentColor" stroke="none" />
  </svg>
</template>
