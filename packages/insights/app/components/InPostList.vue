<script setup lang="ts">
import type {
  InsightsFormat,
  InsightsLocale,
  InsightsPost,
  InsightsSort,
  InsightsTopicKey,
} from '../../shared/insightsPost'
import {
  INSIGHTS_FORMATS,
  INSIGHTS_SORTS,
  INSIGHTS_SORTS_AVAILABLE,
  INSIGHTS_TOPICS,
  insightsFilterPosts,
  insightsSortPosts,
} from '../../shared/insightsPost'

/**
 * PROTOTYP (I0) — DIE JOURNAL-LISTE (§9.5, Vorlage: der Klickdummy
 * `brand/.playground/app/pages/brand/demo/journal.vue`).
 *
 * ── DIE ANSICHT STEHT IN DER ADRESSE (`?display=`) ───────────────────────
 * Raster oder Liste ist eine TEILBARE Entscheidung — dieselbe Lösung wie in
 * der Discover-Galerie. Der Wert wird beim Rendern GELESEN (auch auf dem
 * Server) und beim Umschalten per `router.replace` zurückgeschrieben; ein
 * Zustand nur im Speicher wäre nach dem Weiterschicken des Links weg.
 * WICHTIG für die Hydration: kein anderer Zweig auf dem Server als im
 * Browser — deshalb kommt der Anfangswert aus der Query und nicht aus einem
 * `onMounted`.
 *
 * ── „MEISTGELESEN" IST SICHTBAR GESPERRT ────────────────────────────────
 * Die Zahl käme aus Plausible, und das ist auf branding.supply erst mit BS1
 * R2c eingeschaltet (§11 Frage 3: „erst Text, dann Schalter"). Die Option
 * steht deshalb IN der Leiste, deaktiviert, mit dem Grund darunter — eine
 * unsichtbare Sperre erklärt sich nie, und eine stille Ersatz-Sortierung wäre
 * eine Zahl, die niemand gemessen hat.
 */
const props = withDefaults(defineProps<{
  posts: readonly InsightsPost[]
  locale: InsightsLocale
  /** Adresse je Beitrag — der Layer kennt die Routen der App nicht. */
  resolveHref: (post: InsightsPost) => string
  /** Farbwelt je Beitrag; gehört dem brand-Layer (s. InPostCard). */
  resolveGradient?: (post: InsightsPost) => readonly [string, string]
}>(), {
  resolveGradient: () => ['#e6e2da', '#8f867a'] as const,
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const activeFormat = ref<InsightsFormat | 'all'>('all')
const activeTopic = ref<InsightsTopicKey | 'all'>('all')
const activeLocale = ref<InsightsLocale | 'all'>('all')
const activeSort = ref<InsightsSort>('newest')

const display = ref<'grid' | 'list'>(route.query.display === 'list' ? 'list' : 'grid')
watch(display, (value) => {
  void router.replace({ query: { ...route.query, display: value } })
})

const formatItems = computed(() => [
  { label: t('insights.format.all'), value: 'all' },
  ...INSIGHTS_FORMATS.map(format => ({ label: t(`insights.format.${format}`), value: format })),
])
const localeItems = computed(() => [
  { label: t('insights.list.localeAll'), value: 'all' },
  { label: t('insights.list.localeDe'), value: 'de' },
  { label: t('insights.list.localeEn'), value: 'en' },
])
const sortItems = computed(() => INSIGHTS_SORTS.map(sort => ({
  label: t(`insights.list.sort${sort.charAt(0).toUpperCase()}${sort.slice(1)}`),
  value: sort,
  // Gesperrt statt versteckt (s. Kopf).
  disabled: !INSIGHTS_SORTS_AVAILABLE.includes(sort),
})))

const visible = computed(() => insightsSortPosts(
  insightsFilterPosts(props.posts, {
    format: activeFormat.value,
    topic: activeTopic.value,
    locale: activeLocale.value,
  }),
  activeSort.value,
))
</script>

<template>
  <div>
    <!-- Werkzeugleiste: Themen (Chips) · Format · Sprache · Sortierung · Ansicht -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="bw-select-card rounded-full px-4 py-2 text-sm"
        :class="activeTopic === 'all' ? 'bw-select-card--on' : ''"
        @click="activeTopic = 'all'"
      >{{ t('insights.list.topicAll') }}</button>
      <button
        v-for="topic in INSIGHTS_TOPICS" :key="topic.key"
        class="bw-select-card rounded-full px-4 py-2 text-sm"
        :class="activeTopic === topic.key ? 'bw-select-card--on' : ''"
        @click="activeTopic = activeTopic === topic.key ? 'all' : topic.key"
      >{{ topic.label }}</button>

      <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
        <USelect
          v-model="activeFormat" :items="formatItems" value-key="value"
          color="neutral" variant="ghost" class="w-40 justify-between rounded-full text-sm"
          :ui="{ base: 'px-4 py-2' }" style="background: var(--bw-surface-hi)"
        />
        <USelect
          v-model="activeLocale" :items="localeItems" value-key="value"
          color="neutral" variant="ghost" class="w-40 justify-between rounded-full text-sm"
          :ui="{ base: 'px-4 py-2' }" style="background: var(--bw-surface-hi)"
        />
        <USelect
          v-model="activeSort" :items="sortItems" value-key="value"
          color="neutral" variant="ghost" class="w-48 justify-between rounded-full text-sm"
          :ui="{ base: 'px-4 py-2' }" style="background: var(--bw-surface-hi)"
        />
        <div class="flex items-center gap-1 rounded-full p-1" style="background: var(--bw-surface-hi)">
          <button
            class="grid size-8 place-items-center rounded-full transition-colors"
            :style="display === 'grid' ? 'background: var(--bw-ink); color: var(--bw-paper)' : 'color: var(--bw-muted)'"
            :aria-label="t('insights.list.viewGrid')" @click="display = 'grid'"
          ><UIcon name="i-ph-squares-four" class="size-4" /></button>
          <button
            class="grid size-8 place-items-center rounded-full transition-colors"
            :style="display === 'list' ? 'background: var(--bw-ink); color: var(--bw-paper)' : 'color: var(--bw-muted)'"
            :aria-label="t('insights.list.viewList')" @click="display = 'list'"
          ><UIcon name="i-ph-list-bullets" class="size-4" /></button>
        </div>
      </div>
    </div>

    <p class="bw-label mt-3 flex flex-wrap items-center gap-x-3 gap-y-1" style="color: var(--bw-muted)">
      <span>{{ t('insights.list.count', { count: visible.length }) }}</span>
      <span>{{ t('insights.list.sortMostReadHint') }}</span>
    </p>

    <!-- Leerer Zustand: der Core-Baustein, nie eine leere Fläche. -->
    <CoreEmptyState
      v-if="visible.length === 0"
      class="mt-10"
      icon="i-ph-newspaper"
      :title="t('insights.list.emptyTitle')"
      :description="t('insights.list.emptyDescription')"
    />

    <div v-else-if="display === 'grid'" class="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      <InPostCard
        v-for="post in visible" :key="post.slug"
        :post="post" :locale="locale" :to="resolveHref(post)"
        :gradient="resolveGradient(post)" display="grid"
      />
    </div>

    <div v-else class="mt-10">
      <InPostCard
        v-for="post in visible" :key="post.slug"
        :post="post" :locale="locale" :to="resolveHref(post)"
        :gradient="resolveGradient(post)" display="list"
      />
    </div>
  </div>
</template>
