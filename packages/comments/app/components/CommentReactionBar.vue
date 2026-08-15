<script setup lang="ts">
import type { ReactionKey } from '../../../core/shared/reactions'

/**
 * DIE REAKTIONS-LEISTE UNTER EINER ANTWORT (F57, Davids Entscheidung
 * 2026-08-13 „Ja, nachbauen").
 *
 * Nur die ANBINDUNG: das Aussehen liegt in `CoreReactionBar`, damit Themen und
 * Antworten dieselbe Leiste zeigen, ohne dass dieser Layer den posts-Layer
 * kennen muss (A14). Was hier steht, ist genau das, was eine Antwort von einem
 * Thema unterscheidet — die Route und der Zustand.
 *
 * ── WER DARF KLICKEN: ANGEMELDET UND SCHREIBBAR ───────────────────────────
 * `canWrite` aus `useCommentPolicy()` kommt dazu, anders als bei den Themen:
 * eine Community kann das Kommentieren abschalten (`commentsEnabled`), und
 * dann ist auch die Emoji-Leiste zu — die Route weist sie mit demselben
 * `assertCommentsWritable` ab, das jede andere schreibende Kommentar-Aktion
 * trägt. Ein Knopf, der garantiert 403 bekommt, gehört nicht angezeigt.
 *
 * Ein GAST-Kommentar bekommt trotzdem eine Leiste: er ist sichtbarer Inhalt
 * wie jeder andere, und die Reaktion gehört dem, der sie gibt. Nur reagieren
 * kann ein Gast nicht — dafür braucht es ein Konto.
 */
const props = defineProps<{ targetId: string }>()

const { t } = useI18n()
const toast = useToast()
const { isLoggedIn } = useCurrentUser()
const { canWrite } = useCommentPolicy()
const { chips, allowed, toggleReaction } = useCommentReactions()

const busy = ref(false)

/**
 * Kein Laden, kein `onMounted`: die Chips kommen mit der Kommentar-Liste
 * (`GET /api/comments` → Store → `seedFromList`). Ein fehlender Eintrag heißt
 * „keine Reaktionen" und nicht „noch nicht geladen" — deshalb ist `?? []` hier
 * die vollständige Antwort und nicht ein Platzhalter.
 */
const myChips = computed(() => chips.value[props.targetId] ?? [])
const canReact = computed(() => isLoggedIn.value && canWrite.value)

async function toggle(reaction: ReactionKey) {
  if (busy.value || !canReact.value) return
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
    scope="comment"
    :chips="myChips"
    :allowed="allowed"
    :can-react="canReact"
    :busy="busy"
    @toggle="toggle"
  />
</template>
