<script setup lang="ts">
/** George als Profilbild (Runde 41, David): Nuxt UI UAvatar ohne Ring.
 *  Dummy-Bild /george.jpg (dog.ceo, Platzhalter) — fürs Produkt kommt
 *  Davids eigenes George-Bild rein. Kopf 3xl, Nachrichten kleiner
 *  (UI-Audit C12). */
withDefaults(defineProps<{ size?: 'md' | 'xl' | '3xl' }>(), { size: '3xl' })
</script>

<template>
  <UAvatar src="/george.jpg" alt="George" :size="size" class="flex-none" />
</template>
