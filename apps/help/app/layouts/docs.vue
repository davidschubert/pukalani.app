<script setup lang="ts">
import type { DocsNavigation } from '../../shared/types/docs'

// Seitenleiste = Navigation des AKTIVEN Abschnitts (Anleitung | Entwickler)
// in der Sprache der aktuellen Seite.
const route = useRoute()
const { locale } = useI18n()
const fallback = ref<DocsNavigation | null>(null)
const navigation = inject(docsNavigationKey, fallback)
const items = computed(() => docsSectionItems(navigation.value, resolveDocsSection(route.path), locale.value))
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            highlight
            :navigation="items"
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
