<script setup lang="ts">
/** Antwort-Chips: Empfehlung-zuerst; "Weiß ich nicht" hängt als
 *  Ghost-Chip IMMER hinten dran (Interaktionsregel 5). */
defineProps<{
  options: { id: string, label: string, recommended?: boolean }[]
  multi?: boolean
  selected?: string[]
  showDontKnow?: boolean
}>()
defineEmits<{ pick: [id: string], dontKnow: [] }>()
</script>

<template>
  <div class="flex flex-col items-stretch gap-2">
    <button
      v-for="o in options" :key="o.id" class="bw-chip text-left"
      :class="selected?.includes(o.id) ? 'bw-chip--selected' : ''"
      @click="$emit('pick', o.id)"
    >
      {{ o.label }}<span v-if="o.recommended" class="bw-pop-chip ml-1.5">Empfehlung</span>
    </button>
    <button v-if="showDontKnow !== false" class="bw-chip bw-chip--ghost" @click="$emit('dontKnow')">
      Weiß ich nicht
    </button>
  </div>
</template>
