<script setup lang="ts">
import { pageExcerpt } from '../../shared/pageExcerpt'
import type { PublicPage } from '../../shared/types/page'

/**
 * Öffentliche Inhaltsseite unter sprechendem Pfad (/imprint, /terms …).
 * Dynamische Route mit NIEDRIGER Priorität — statische App-Routen (/login,
 * /dashboard …) gewinnen. Nur veröffentlichte Seiten; sonst 404.
 *
 * `key` = voller Pfad: bei einem Slug-Wechsel IM BROWSER (/imprint → /xyz)
 * baut Nuxt die Komponente neu auf, statt sie wiederzuverwenden. Ohne das
 * läuft das `setup` kein zweites Mal — der 404-Wurf unten bliebe aus und die
 * Seite zeigte den alten Inhalt bzw. eine leere Sektion.
 */
definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const { locale } = useI18n()
const slug = computed(() => String(route.params.slug ?? ''))

// useRequestFetch statt $fetch: der SSR-interne Aufruf MUSS den Host-Header
// (= Tenant) der eingehenden Anfrage weiterreichen, sonst löst die Tenant-
// Middleware im Pool keinen Mandanten auf und JEDE Inhaltsseite wäre 404 —
// genau so auf demo.pukalani.app gefunden (Morgenlicht-Seed, 2026-07-26).
// Im Silo-Betrieb verhält sich useRequestFetch wie $fetch.
const requestFetch = useRequestFetch()
const { data: page, error } = await useAsyncData(
  () => `page-${slug.value}-${locale.value}`,
  // encodeURIComponent: vue-router liefert den Param DEKODIERT — ein `%2F`
  // oder `..` in der Adresse stünde sonst roh im API-Pfad.
  () => requestFetch<PublicPage>(`/api/pages/public/${encodeURIComponent(slug.value)}`, { query: { locale: locale.value } }),
  { watch: [locale] },
)

if (error.value || !page.value) {
  // status/statusText ist der Projektvertrag (CLAUDE.md, Audit-Befund K8)
  throw createError({ status: 404, statusText: 'Page not found' })
}

// „<Seitenname> · <Brand>" + Beschreibung aus dem ersten Textabsatz der Seite
// (Audit-Befunde S8/S5) — geteilte Links waren vorher markenlos und nackt.
useBrandTitle(() => page.value?.title ?? '', {
  description: () => pageExcerpt(page.value?.body ?? ''),
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article v-if="page" class="mx-auto max-w-3xl space-y-3">
      <h1 class="text-2xl font-bold">{{ page.title }}</h1>
      <MarkdownContent :source="page.body" />
    </article>
  </UContainer>
</template>
