<script setup lang="ts">
/** George-Panel: Monogramm statt Porträt, max 2–3 Sätze pro Zug, jeder
 *  Zug endet in Frage oder Schritt (§3d). Kein Lob-Spam, keine Fake-Delays. */
export interface BwMessage { id: string, role: 'george' | 'user', text: string, help?: string }
defineProps<{ messages: BwMessage[] }>()
defineEmits<{ send: [text: string] }>()
const draft = ref('')
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center gap-2.5 border-b px-6 pt-2 pb-3.5" style="border-color: var(--bw-line)">
      <span class="bw-msg-mark">G</span>
      <span class="leading-tight">
        <span class="block text-sm font-semibold">George</span>
        <span class="block text-xs" style="color: var(--bw-muted)">Persönlicher Markenberater</span>
      </span>
    </div>
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
      <div v-for="m in messages" :key="m.id" class="bw-msg" :class="m.role === 'user' ? 'bw-msg--user' : ''">
        <span v-if="m.role === 'george'" class="bw-msg-mark" aria-hidden="true">G</span>
        <div class="bw-msg-body">
          <p>{{ m.text }}</p>
          <p v-if="m.help" class="bw-msg-help">{{ m.help }}</p>
        </div>
      </div>
      <slot name="chips" />
    </div>
    <form class="flex gap-2 border-t px-6 py-4" style="border-color: var(--bw-line)" @submit.prevent="draft.trim() && ($emit('send', draft), draft = '')">
      <UInput v-model="draft" class="flex-1" placeholder="Antwort schreiben — oder George etwas fragen …" size="lg" />
      <UButton type="submit" icon="i-ph-paper-plane-right" aria-label="Senden" size="lg" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </form>
  </div>
</template>
