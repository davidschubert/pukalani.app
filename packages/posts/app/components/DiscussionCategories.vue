<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { normalizeCategoryView, sortCategoriesForView, type CategoryView } from '../../shared/categoryView'
import type { CategoryListResponse, CategoryWithCount } from '../../shared/types/post'

/**
 * Die Kategorien-Ansicht (Sortierung „Categories" aus dem Konzept): eine
 * eigene Tabelle mit Kategorie (Name + Beschreibung) und der Anzahl ihrer
 * Themen.
 *
 * DIE SUCHE HIER IST CLIENT-SEITIG, und das ist eine Entscheidung: es sind
 * höchstens hundert Zeilen, sie liegen bereits vollständig im Speicher, und
 * eine Server-Runde je Tastendruck für ein `includes()` wäre Aufwand ohne
 * Gegenwert. Die TOPIC-Suche läuft dagegen über den Server — dort ist der
 * Bestand unbegrenzt.
 *
 * ── DREI ANSICHTEN, EINE WAHRHEIT (2026-08-18) ────────────────────────────
 * Die Voreinstellung ist die Reihenfolge des OWNERS (im Dashboard gezogen);
 * „Aktivste" und „A–Z" sind Blickwinkel darauf. Die Regel ist pur und
 * getestet (shared/categoryView.ts), sortiert wird HIER und nicht in der
 * Route: so bekommt jeder Crawler und jeder Besucher ohne JavaScript die
 * kuratierte Reihenfolge, und ein Klick kostet keinen Server-Weg.
 *
 * Die Wahl lebt in einem COOKIE und nicht im Konto — dieselbe Reichweite wie
 * Hell/Dunkel (`pukalani-color-mode`), und derselbe Grund: eine
 * Navigationsliste, die je Konto anders steht, nimmt den Mitgliedern das
 * Ortsgedächtnis. Ein Cookie statt localStorage, damit der Server schon beim
 * ersten Rendern dieselbe Reihenfolge kennt — sonst springt die Liste nach
 * der Hydration.
 */
const { t } = useI18n()
const localePath = useLocalePath()

const { data, status } = await useFetch<CategoryListResponse>('/api/posts/categories', {
  query: { counts: '1' },
})

const { categoryName, categoryDescription } = useCategoryText()
const { locale } = useI18n()

const viewCookie = useCookie<string>('pukalani-category-view', {
  default: () => 'recommended',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  path: '/',
})
// Über eine `computed` und nicht direkt am Cookie: ein alter oder von Hand
// gesetzter Wert darf die Liste nicht leeren, sondern fällt auf „Empfohlen".
const view = computed<CategoryView>({
  get: () => normalizeCategoryView(viewCookie.value),
  set: (value) => { viewCookie.value = value },
})

const viewItems = computed(() => [
  { value: 'recommended', label: t('posts.discussions.view.recommended'), icon: 'i-ph-list-dashes' },
  { value: 'active', label: t('posts.discussions.view.active'), icon: 'i-ph-chats-circle' },
  { value: 'az', label: t('posts.discussions.view.az'), icon: 'i-ph-sort-ascending' },
])

const search = ref('')
const rows = computed(() => {
  const all = data.value?.rows ?? []
  const needle = search.value.trim().toLowerCase()
  // Gesucht wird in DER ANGEZEIGTEN Sprache: wer „Allgemein" liest, tippt
  // „allgemein" — nicht den Namen der Grundfassung.
  const gefunden = !needle
    ? all
    : all.filter(entry =>
        categoryName(entry.category).toLowerCase().includes(needle)
        || categoryDescription(entry.category).toLowerCase().includes(needle))
  // Erst filtern, dann sortieren: umgekehrt sortierte man Zeilen, die gleich
  // wieder herausfallen.
  return sortCategoriesForView(gefunden, view.value, entry => categoryName(entry.category), locale.value)
})

const columns = computed<TableColumn<CategoryWithCount>[]>(() => [
  { id: 'category', header: () => t('posts.discussions.col.category') },
  { id: 'topics', header: () => t('posts.discussions.col.topics') },
])

/**
 * Ohne Kategorie steht diese Community still — dieselbe Sackgasse wie in der
 * Themen-Tabelle (DiscussionTopics), nur von der anderen Registerkarte aus
 * gesehen. Der Text sagte das schon; was fehlte, war der Weg dorthin für den,
 * der ihn gehen darf. Wer `posts.manage` nicht hat, behält den erklärenden
 * Satz ohne Knopf — ein Link in eine 403-Seite ist keine Hilfe.
 *
 * ZWEI QUELLEN (N1): Operator-Label ODER Site-Rolle — dieselbe Rechnung wie in
 * DiscussionTopics und wie in der Middleware, die /dashboard/categories
 * bewacht. Die Begründung steht dort ausführlich.
 */
const { user: currentUser } = useCurrentUser()
const { capabilities: siteCaps } = useCommunityRole()
const canManageCategories = computed(() =>
  userHasCapability(currentUser.value, 'posts.manage') || siteCaps.value.has('posts.manage'))
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <UTabs
        v-model="view"
        :items="viewItems"
        :content="false"
        size="sm"
        data-categories-view
      />
      <UInput
        v-model="search"
        icon="i-ph-magnifying-glass"
        size="sm"
        :placeholder="t('posts.discussions.searchCategories')"
        class="max-w-56"
        data-categories-search
      />
    </div>

    <div v-if="status === 'pending' && !data" class="flex justify-center py-16">
      <UIcon name="i-ph-spinner" class="size-6 animate-spin text-muted" />
    </div>

    <UTable v-else :data="rows" :columns="columns" data-discussion-categories>
      <template #category-cell="{ row }">
        <div class="max-w-lg">
          <NuxtLink
            :to="localePath(`/discussions/${row.original.category.slug}`)"
            class="font-medium text-default hover:text-primary hover:underline"
          >
            {{ categoryName(row.original.category) }}
          </NuxtLink>
          <p v-if="categoryDescription(row.original.category)" class="text-sm text-muted">
            {{ categoryDescription(row.original.category) }}
          </p>
        </div>
      </template>

      <template #topics-cell="{ row }">
        <span class="text-sm tabular-nums text-muted">{{ formatCount(row.original.topicCount) }}</span>
      </template>

      <template #empty>
        <CoreEmptyState
          v-if="search.trim()"
          icon="i-ph-magnifying-glass"
          :title="t('posts.discussions.noResultsTitle')"
          :description="t('posts.discussions.noResultsText')"
          :action-label="t('posts.discussions.resetSearch')"
          action-icon="i-ph-arrow-counter-clockwise"
          @action="() => { search = '' }"
        />
        <CoreEmptyState
          v-else
          icon="i-ph-folders"
          :title="t('posts.discussions.emptyCategoriesTitle')"
          :description="t('posts.discussions.emptyCategoriesText')"
          :action-label="canManageCategories ? t('posts.discussions.noCategoryAction') : undefined"
          action-icon="i-ph-folder-plus"
          :action-to="localePath('/dashboard/categories')"
        />
      </template>
    </UTable>
  </div>
</template>
