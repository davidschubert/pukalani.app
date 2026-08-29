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
    <div class="flex items-center gap-2.5 border-b px-8 pt-6 pb-4" style="border-color: var(--bw-line)">
      <BwGeorgeAvatar />
      <span class="leading-tight">
        <span class="block text-xl font-extralight leading-tight">George</span>
        <span class="block text-xl font-extralight leading-tight" style="color: var(--bw-muted)">Markenberater</span>
      </span>
    </div>
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-8 py-6">
      <div v-for="m in messages" :key="m.id" class="bw-msg" :class="m.role === 'user' ? 'bw-msg--user' : ''">
        <BwGeorgeAvatar v-if="m.role === 'george'" />
        <div class="bw-msg-body">
          <p>{{ m.text }}</p>
          <p v-if="m.help" class="bw-msg-help">{{ m.help }}</p>
        </div>
      </div>
      <slot name="chips" />
    </div>
    <form class="flex gap-2 border-t px-8 py-5" style="border-color: var(--bw-line)" @submit.prevent="draft.trim() && ($emit('send', draft), draft = '')">
      <UInput v-model="draft" variant="none" class="flex-1 rounded-full" :ui="{ base: 'rounded-full px-4' }" placeholder="Antwort schreiben — oder George etwas fragen …" size="lg" style="background: var(--bw-surface-hi)" />
      <UButton type="submit" icon="i-ph-paper-plane-right" aria-label="Senden" size="lg" color="neutral" variant="ghost" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </form>
  </div>
</template>
