<script setup lang="ts">
import type { ReactionKey } from '../../../core/shared/reactions'

/**
 * DIE REAKTIONS-LEISTE UNTER EINEM DISKUSSIONS-THEMA (F57 Mechanik 1).
 *
 * Seit dem 2026-08-14 nur noch die ANBINDUNG: das Aussehen (Chips, „+"-Menue,
 * Hervorhebung der eigenen) liegt in `CoreReactionBar`, weil die Antworten im
 * comments-Layer dieselbe Leiste zeigen und `comments` diesen Layer nicht
 * kennen darf (A14). Was hier bleibt, ist genau das, was das THEMA von einer
 * Antwort unterscheidet: die Route, ueber die umgeschaltet wird, und der
 * Zustand, den `useReactions()` dafuer haelt.
 *
 * Reaktionen stehen NEBEN den Stimmen, nicht statt ihrer: sie zaehlen fuer
 * KEIN Abzeichen (Konzept Teil 4 Punkt 3) — die einzige Ausnahme ist „erste
 * Reaktion", und die haengt am Geben, nicht am Bekommen.
 */
const props = defineProps<{ targetId: string }>()

const { t } = useI18n()
const toast = useToast()
const { isLoggedIn } = useCurrentUser()
const { chips, allowed, requestReactions, toggleReaction } = useReactions()

const busy = ref(false)

const myChips = computed(() => chips.value[props.targetId] ?? [])

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
      title: t('reactions.failed'),
      description: t('reactions.failedHint'),
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <CoreReactionBar
    scope="post"
    :chips="myChips"
    :allowed="allowed"
    :can-react="isLoggedIn"
    :busy="busy"
    @toggle="toggle"
  />
</template>
