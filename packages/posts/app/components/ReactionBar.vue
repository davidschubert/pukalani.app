<script setup lang="ts">
import { type ReactionKey, REACTION_EMOJI } from '../../shared/reactions'

/**
 * DIE REAKTIONS-LEISTE unter einem Diskussions-Thema (F57 Mechanik 1).
 *
 * Chips (Zeichen + Anzahl, eigene hervorgehoben) und EIN „+"-Knopf mit dem
 * kuratierten Satz. Geklickt wird umgeschaltet — dasselbe Emoji noch einmal
 * nimmt es zurück.
 *
 * ── SIE STEHT NEBEN DEN STIMMEN, NICHT STATT IHRER ────────────────────────
 * Reaktionen sind reiner Ausdruck: sie zählen für KEIN Abzeichen (Konzept
 * Teil 4 Punkt 3) — die einzige Ausnahme ist „erste Reaktion", und die hängt
 * am Geben, nicht am Bekommen. Deshalb steht hier auch keine Summe und kein
 * „Score": eine Gesamtzahl über alle Emojis wäre die zweite Zustimmung, die
 * es nicht geben soll.
 *
 * ── NUR ANGEMELDET, ABER FÜR ALLE SICHTBAR ────────────────────────────────
 * Die Zahlen sieht jeder, der den Beitrag sieht (die Row-Permissions
 * entscheiden das, nicht diese Komponente). Klicken kann nur, wer angemeldet
 * ist — wie beim Stimmen, und aus demselben Grund: eine Reaktion gehört einem
 * Konto.
 */
const props = defineProps<{ targetId: string }>()

const { t } = useI18n()
const toast = useToast()
const { isLoggedIn } = useCurrentUser()
const { chips, allowed, requestReactions, toggleReaction } = useReactions()

const busy = ref(false)

const myChips = computed(() => chips.value[props.targetId] ?? [])
/** Was im „+"-Menü angeboten wird: alles, was ich noch nicht gegeben habe. */
const addable = computed(() => {
  const mine = new Set(myChips.value.filter(chip => chip.mine).map(chip => chip.reaction))
  return allowed.value.filter(key => !mine.has(key))
})

onMounted(() => requestReactions(props.targetId))
watch(() => props.targetId, id => requestReactions(id))

async function toggle(reaction: ReactionKey) {
  if (busy.value || !isLoggedIn.value) return
  busy.value = true
  try {
    await toggleReaction(props.targetId, reaction)
  }
  catch {
    toast.add({
      title: t('posts.reactions.failed'),
      description: t('posts.reactions.failedHint'),
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1" data-post-reactions>
    <UButton
      v-for="chip in myChips"
      :key="chip.reaction"
      size="xs"
      :color="chip.mine ? 'primary' : 'neutral'"
      :variant="chip.mine ? 'soft' : 'ghost'"
      :disabled="!isLoggedIn || busy"
      :aria-label="t(`posts.reactions.name.${chip.reaction}`)"
      :aria-pressed="chip.mine"
      :data-reaction="chip.reaction"
      data-post-reaction-chip
      @click="toggle(chip.reaction)"
    >
      <span aria-hidden="true">{{ REACTION_EMOJI[chip.reaction] }}</span>
      <span class="text-xs font-medium tabular-nums" data-reaction-count>{{ chip.count }}</span>
    </UButton>

    <UPopover v-if="isLoggedIn && addable.length > 0">
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-ph-smiley-plus"
        :disabled="busy"
        :aria-label="t('posts.reactions.add')"
        data-post-reaction-add
      />
      <template #content>
        <div class="flex flex-wrap gap-1 p-2" data-post-reaction-menu>
          <UButton
            v-for="key in addable"
            :key="key"
            size="xs"
            color="neutral"
            variant="ghost"
            :disabled="busy"
            :aria-label="t(`posts.reactions.name.${key}`)"
            :data-reaction-option="key"
            @click="toggle(key)"
          >
            <span aria-hidden="true">{{ REACTION_EMOJI[key] }}</span>
          </UButton>
        </div>
      </template>
    </UPopover>
  </div>
</template>
