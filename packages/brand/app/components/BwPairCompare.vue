<script setup lang="ts">
/** Archetyp-Paarvergleich (§3c-Visuals): Bild-Karten statt Adjektivliste.
 *  Im Dummy: typografische Karten mit Stimmung + Beispielmarken. */
defineProps<{
  a: { id: string, motto: string, mood: string, brands: string }
  b: { id: string, motto: string, mood: string, brands: string }
}>()
defineEmits<{ pick: [id: string] }>()
</script>

<template>
  <div class="bw-pair">
    <button v-for="card in [a, b]" :key="card.id" class="bw-pair-card" @click="$emit('pick', card.id)">
      <p class="text-lg font-semibold leading-snug">„{{ card.motto }}"</p>
      <p class="mt-2 text-sm" style="color: var(--bw-ink-soft)">{{ card.mood }}</p>
      <p class="mt-3 text-xs uppercase tracking-wider" style="color: var(--bw-muted)">wie {{ card.brands }}</p>
    </button>
  </div>
</template>
