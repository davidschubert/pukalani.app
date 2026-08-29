<script setup lang="ts">
/** Dokument-Kapitel mit Zustandssprache (§3d-Matrix): Kennzeichen ist
 *  immer Icon + Text, nie nur Farbe. Entwürfe tragen Georges Handschrift. */
const props = defineProps<{
  title: string
  state: 'empty' | 'generating' | 'draft' | 'edited' | 'confirmed' | 'stale'
  staleNote?: string
}>()
defineEmits<{ confirm: [] }>()
const stateMeta = computed(() => ({
  empty: { label: 'Offen', icon: 'i-ph-circle-dashed', cls: '' },
  generating: { label: 'George schreibt …', icon: 'i-ph-circle-notch', cls: '' },
  draft: { label: 'Entwurf von George', icon: 'i-ph-pen-nib', cls: 'bw-state--draft' },
  edited: { label: 'Von dir bearbeitet', icon: 'i-ph-user-focus', cls: 'bw-state--draft' },
  confirmed: { label: 'Bestätigt', icon: 'i-ph-check', cls: 'bw-state--confirmed' },
  stale: { label: 'Veraltet', icon: 'i-ph-clock-counter-clockwise', cls: 'bw-state--stale' },
}[props.state]))
</script>

<template>
  <section class="bw-chapter">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-lg">{{ title }}</h2>
      <span class="bw-state" :class="stateMeta.cls"><UIcon :name="stateMeta.icon" /> {{ stateMeta.label }}</span>
    </div>
    <p v-if="state === 'stale' && staleNote" class="bw-label mb-3" style="color: var(--bw-stale)">
      <UIcon name="i-ph-arrow-elbow-down-right" /> {{ staleNote }}
    </p>
    <div :class="state === 'draft' || state === 'edited' ? 'bw-draft-frame' : ''">
      <slot />
    </div>
    <div v-if="state === 'draft' || state === 'edited'" class="mt-3 flex gap-2">
      <UButton size="sm" color="neutral" variant="outline" icon="i-ph-arrows-clockwise" label="Neu versuchen" />
      <UButton size="sm" icon="i-ph-check" label="Kapitel bestätigen" @click="$emit('confirm')" />
    </div>
  </section>
</template>
