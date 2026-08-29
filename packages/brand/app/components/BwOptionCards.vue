<script setup lang="ts">
/** Antwort-Karten (Davids Wunsch, Runde 29): reiche Optionen mit Titel +
 *  Beschreibung, „Empfehlung"-Kennzeichen mit aufklappbarer STRATEGISCHER
 *  Begründung (nie Bauchgefühl — der Grund kommt aus der Markenstrategie),
 *  und am Ende immer ein Feld für eine ganz eigene Antwort. */
export interface BwOptionCard {
  id: string
  label: string
  description?: string
  recommended?: boolean
  why?: string
}
defineProps<{ options: BwOptionCard[], ownPlaceholder?: string }>()
const emit = defineEmits<{ pick: [id: string], own: [text: string] }>()
const openWhy = ref<string | null>(null)
const own = ref('')
function toggleWhy(id: string) {
  openWhy.value = openWhy.value === id ? null : id
}
function submitOwn() {
  if (own.value.trim()) {
    emit('own', own.value.trim())
    own.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-stretch gap-2">
    <div
      v-for="o in options" :key="o.id"
      class="rounded-2xl px-4 py-3 text-left"
      style="background: var(--bw-surface-hi); box-shadow: var(--bw-shadow-card)"
    >
      <button class="flex w-full items-start justify-between gap-3 text-left" @click="$emit('pick', o.id)">
        <span class="min-w-0">
          <span class="block text-sm font-medium">
            {{ o.label }}<span v-if="o.recommended" class="bw-pop-chip ml-1.5">Empfehlung</span>
          </span>
          <span v-if="o.description" class="mt-0.5 block text-sm" style="color: var(--bw-ink-soft)">{{ o.description }}</span>
        </span>
        <span
          v-if="o.why"
          class="grid size-7 flex-none place-items-center rounded-full transition-colors hover:bg-[var(--bw-pop)]"
          role="button" tabindex="0"
          :aria-label="`Warum empfiehlt George ${o.label}?`" :aria-expanded="openWhy === o.id"
          @click.stop="toggleWhy(o.id)" @keydown.enter.stop="toggleWhy(o.id)"
        >
          <UIcon name="i-ph-info" class="size-4.5" style="color: var(--bw-muted)" />
        </span>
      </button>
      <p v-if="o.why && openWhy === o.id" class="bw-label mt-2 rounded-xl px-3 py-2.5" style="background: var(--bw-surface); color: var(--bw-ink-soft)">
        {{ o.why }}
      </p>
    </div>
    <form
      class="flex items-center gap-2 rounded-2xl px-2 py-1.5"
      style="background: var(--bw-surface-hi); box-shadow: var(--bw-shadow-card)"
      @submit.prevent="submitOwn"
    >
      <UInput
        v-model="own" variant="none" class="flex-1" :ui="{ base: 'rounded-full' }"
        :placeholder="ownPlaceholder ?? 'Oder etwas ganz Eigenes …'"
      />
      <UButton type="submit" icon="i-ph-arrow-right" aria-label="Eigene Antwort senden" size="sm" color="neutral" variant="ghost" class="rounded-full" :disabled="!own.trim()" />
    </form>
  </div>
</template>
