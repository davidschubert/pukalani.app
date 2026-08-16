<script setup lang="ts">
import type { TopicBacklink, TopicBacklinksResponse } from '../../shared/types/post'

/**
 * „VERLINKT VON …" — die Themen, die auf DIESES Thema zeigen (F57).
 *
 * ── SIE LÄDT SICH SELBST, UND ZWAR NACH ───────────────────────────────────
 * Eigener Abruf statt eines Feldes an der Themen-Antwort: Rückverweise sind
 * nachrangig. Sie stehen unter dem Beitrag, niemand wartet auf sie, und die
 * allermeisten Themen haben keine — sie hätten jeden Themen-Aufbau um zwei
 * Abfragen verteuert, damit die wenigen Fälle sofort dastehen. Dasselbe
 * Muster wie bei den Reaktionen.
 *
 * ── OHNE RÜCKVERWEISE STEHT HIER NICHTS ───────────────────────────────────
 * Kein leerer Zustand, keine Überschrift auf Vorrat: „Verlinkt von" mit einer
 * leeren Liste darunter wäre ein Versprechen, das die Seite nicht einlöst.
 * Der Abschnitt erscheint, wenn es etwas zu zeigen gibt.
 *
 * ── LADEN WIRD NICHT ANGEZEIGT ────────────────────────────────────────────
 * Bewusst kein Skelett: die Liste sitzt unterhalb des Beitrags, ein
 * aufblitzender Platzhalter dort zöge den Blick auf etwas, das meistens leer
 * bleibt. Sie erscheint, wenn sie da ist.
 */
const props = defineProps<{ targetId: string }>()

const { t } = useI18n()
// Der Server liefert den nackten Pfad (`/discussions/…`); der Locale-Prefix
// gehört an die Anzeige — ohne ihn springt ein Klick auf `/de/*` in die
// englische Fassung. Dieselbe Kette wie in `DiscussionTopics.vue`.
const localePath = useLocalePath()

const backlinks = ref<TopicBacklink[]>([])

async function load(id: string) {
  if (!id) return
  // Fail-soft: ein misslungener Abruf kostet eine Nebenangabe, nie das Thema.
  const res = await $fetch<TopicBacklinksResponse>('/api/posts/discussions/backlinks', {
    query: { targetId: id },
  }).catch(() => null)
  backlinks.value = res?.backlinks ?? []
}

onMounted(() => load(props.targetId))
watch(() => props.targetId, (id) => {
  backlinks.value = []
  void load(id)
})
</script>

<template>
  <div v-if="backlinks.length > 0" class="mt-4 border-t border-default pt-3" data-topic-backlinks>
    <p class="text-xs font-medium text-muted">
      {{ t('posts.discussions.backlinks.title') }}
    </p>
    <ul class="mt-1 space-y-1">
      <li v-for="entry in backlinks" :key="entry.$id" class="text-sm">
        <ULink :to="localePath(entry.path)" class="text-primary underline underline-offset-2">
          {{ entry.title }}
        </ULink>
      </li>
    </ul>
  </div>
</template>
