<script setup lang="ts">
/** George als Chihuahua-Terrier (Davids Wunsch, Runde 39): gezeichneter
 *  Linien-Kopf auf der Empfehlungs-Farbe (--bw-pop). Der SVG-Platzhalter
 *  kann später 1:1 gegen ein echtes Avatarbild getauscht werden. */
</script>

<template>
  <span class="bw-msg-mark" aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none" stroke="var(--bw-ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-full p-1">
      <!-- Ohren -->
      <path d="M9.5 13.5 L5.5 3.5 L14 8.5" />
      <path d="M22.5 13.5 L26.5 3.5 L18 8.5" />
      <!-- Kopf -->
      <path d="M9.5 13.5 C7.5 16 7 19.5 8.5 22.5 C10.5 26.5 21.5 26.5 23.5 22.5 C25 19.5 24.5 16 22.5 13.5 C20.5 11 11.5 11 9.5 13.5 Z" />
      <!-- Augen -->
      <circle cx="12.7" cy="17.3" r="0.8" fill="var(--bw-ink)" stroke="none" />
      <circle cx="19.3" cy="17.3" r="0.8" fill="var(--bw-ink)" stroke="none" />
      <!-- Nase + Schnauze -->
      <path d="M15 21 Q16 21.8 17 21" />
      <circle cx="16" cy="19.6" r="0.9" fill="var(--bw-ink)" stroke="none" />
    </svg>
  </span>
</template>
