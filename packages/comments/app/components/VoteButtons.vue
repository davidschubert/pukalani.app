<script setup lang="ts">
import { LIKE_LIMIT_REACHED } from '../../../core/shared/likeAllowance'
import type { Comment } from '../../shared/types/comment'

const props = defineProps<{ comment: Comment }>()

const { t } = useI18n()
// Store der umgebenden CommentSection (ein Store pro Target, Phase 25)
const store = inject(commentStoreKey)!
const toast = useToast()
const { isLoggedIn } = useCurrentUser()
const policy = useCommentPolicy()

const myVote = computed(() => store.myVote(props.comment.$id))
const disabled = computed(() => !isLoggedIn.value || props.comment.status === 'deleted' || !policy.canWrite.value)

async function vote(value: 1 | -1) {
  if (disabled.value) return
  try {
    // Optimistic im Store — Zähler springen sofort, Rollback bei Fehler
    await store.vote(props.comment.$id, value)
  }
  catch (error) {
    /**
     * Der Zähler springt durch den Rollback sichtbar zurück — ohne Erklärung
     * sieht das nach einem zweiten Fehler aus.
     *
     * DAS TAGES-LIMIT (F57 Mechanik 3) bekommt seine EIGENE Erklärung: der
     * Rollback ist dort richtig (die Stimme steht wirklich nicht), aber „prüf
     * die Verbindung und stimm noch einmal ab" führte in die Irre — es lag
     * nicht an der Verbindung, und noch einmal geht es erst morgen.
     */
    const reason = (error as { data?: { reason?: string } })?.data?.reason
    toast.add(reason === LIKE_LIMIT_REACHED
      ? { title: t('comments.item.likeLimitReached'), description: t('comments.item.likeLimitReachedHint'), color: 'warning' }
      : { title: t('comments.item.voteError'), description: t('comments.item.voteErrorHint'), color: 'error' })
  }
}
</script>

<template>
  <div class="flex items-center" data-vote-buttons>
    <UButton
      icon="i-ph-arrow-up"
      size="xs"
      :color="myVote === 1 ? 'primary' : 'neutral'"
      :variant="myVote === 1 ? 'soft' : 'ghost'"
      :disabled="disabled"
      :aria-label="t('comments.item.upvote')"
      @click="vote(1)"
    />
    <span class="min-w-6 text-center text-xs font-semibold tabular-nums" data-score>{{ comment.score }}</span>
    <UButton
      icon="i-ph-arrow-down"
      size="xs"
      :color="myVote === -1 ? 'primary' : 'neutral'"
      :variant="myVote === -1 ? 'soft' : 'ghost'"
      :disabled="disabled"
      :aria-label="t('comments.item.downvote')"
      @click="vote(-1)"
    />
  </div>
</template>
