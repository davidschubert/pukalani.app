<script setup lang="ts">
/** George-Panel: Monogramm statt Porträt, max 2–3 Sätze pro Zug, jeder
 *  Zug endet in Frage oder Schritt (§3d). Kein Lob-Spam, keine Fake-Delays. */
export interface BwMessage { id: string, role: 'george' | 'user', text: string, help?: string }
const props = defineProps<{ messages: BwMessage[] }>()
defineEmits<{ send: [text: string] }>()
const draft = ref('')

/* Runde 55 (David): der Chat ankert UNTEN und wächst nach oben —
 * neue Nachrichten schieben den Verlauf hoch, Blick bleibt beim Composer. */
const scroller = ref<HTMLElement | null>(null)
watch(() => props.messages.length, async () => {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center gap-2.5 border-b px-7 pt-5 pb-3.5" style="border-color: var(--bw-line)">
      <BwGeorgeAvatar />
      <span class="leading-tight">
        <span class="bw-label block">George Wuffwuff</span>
        <span class="bw-label block" style="color: var(--bw-muted)">Dein Markenberater</span>
      </span>
    </div>
    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto px-7 py-5">
      <div class="flex min-h-full flex-col justify-end space-y-4">
      <div v-for="m in messages" :key="m.id" class="bw-msg" :class="m.role === 'user' ? 'bw-msg--user' : ''">
        <BwGeorgeAvatar v-if="m.role === 'george'" size="md" />
        <div class="bw-msg-body">
          <p>{{ m.text }}</p>
          <p v-if="m.help" class="bw-msg-help">{{ m.help }}</p>
        </div>
      </div>
      <slot name="chips" />
      </div>
    </div>
    <form class="flex gap-2 border-t px-7 py-4" style="border-color: var(--bw-line)" @submit.prevent="draft.trim() && ($emit('send', draft), draft = '')">
      <UInput v-model="draft" variant="none" class="flex-1 rounded-full" :ui="{ base: 'rounded-full px-4' }" placeholder="Antwort schreiben — oder George etwas fragen …" size="lg" style="background: var(--bw-surface-hi)" />
      <UButton type="submit" icon="i-ph-paper-plane-right" aria-label="Senden" size="lg" color="neutral" variant="ghost" class="bw-send rounded-full" :disabled="!draft.trim()" />
    </form>
  </div>
</template>
