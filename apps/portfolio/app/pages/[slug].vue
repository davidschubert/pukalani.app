<script setup lang="ts">
import { pageExcerpt } from '../../../../packages/pages/shared/pageExcerpt'
import type { PublicPage } from '../../../../packages/pages/shared/types/page'

/**
 * App-Override der CMS-Seite des pages-Layers ([slug].vue): identischer
 * Datenweg, aber im SITE-Layout — die Layer-Fassung rendert im Standard-Look
 * der Plattform, und eine öffentliche Rechtsseite dieser Site soll das
 * Syne-Chrome (Header/Footer, dunkle Farbwelt) tragen. Statische Routen
 * (/ux-audit, /nuxt-entwickler-freelancer …) gewinnen weiterhin gegen die
 * dynamische.
 *
 * `key` = voller Pfad: bei einem Slug-Wechsel IM BROWSER (/imprint → /xyz)
 * baut Nuxt die Komponente neu auf, statt sie wiederzuverwenden. Ohne das
 * läuft das `setup` kein zweites Mal — der 404-Wurf unten bliebe aus und die
 * Seite zeigte eine leere Sektion mit dem alten Titel im Tab.
 */
definePageMeta({ layout: 'site', key: route => route.fullPath })

const route = useRoute()
const { locale } = useI18n()
const slug = computed(() => String(route.params.slug ?? ''))

// useRequestFetch statt $fetch: SSR muss den Host-Header weiterreichen
// (dieselbe Falle wie in der Layer-Fassung; im Silo-Betrieb wie $fetch).
const requestFetch = useRequestFetch()
const { data: page, error } = await useAsyncData(
  () => `page-${slug.value}-${locale.value}`,
  // encodeURIComponent: vue-router liefert den Param DEKODIERT — ein `%2F`
  // oder `..` in der Adresse stünde sonst roh im API-Pfad.
  () => requestFetch<PublicPage>(`/api/pages/public/${encodeURIComponent(slug.value)}`, { query: { locale: locale.value } }),
  { watch: [locale] },
)

if (error.value || !page.value) {
  throw createError({ status: 404, statusText: 'Page not found' })
}

useBrandTitle(() => page.value?.title ?? '', {
  description: () => pageExcerpt(page.value?.body ?? ''),
})
</script>

<template>
  <div class="section">
    <article v-if="page" class="container cms-page">
      <header class="page-head">
        <h1>{{ page.title }}</h1>
      </header>
      <div class="prose cms-page__body">
        <MarkdownContent :source="page.body" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.cms-page {
  /* Fließtext-Spalte wie auf den Wissen-Seiten — Rechtstexte sind lang. */
  max-width: 52rem;
}
.cms-page__body {
  margin-top: clamp(1.5rem, 3vw, 2.5rem);
}
/* MarkdownContent rendert in das ungestylte Innere — Grundtypografie im
   Site-Look (scoped :deep, damit nichts in andere Seiten leckt). */
.cms-page__body :deep(h2) {
  font-size: clamp(1.2rem, 2.4vw, 1.6rem);
  margin-top: 2.2rem;
}
.cms-page__body :deep(h3) {
  font-size: 1.05rem;
  margin-top: 1.6rem;
}
.cms-page__body :deep(p),
.cms-page__body :deep(li) {
  color: var(--text-soft);
  margin-top: 0.7rem;
}
.cms-page__body :deep(ul),
.cms-page__body :deep(ol) {
  padding-left: 1.2rem;
}
.cms-page__body :deep(blockquote) {
  margin-top: 1.2rem;
  border-left: 2px solid var(--accent);
  padding-left: 1rem;
  color: var(--text-soft);
}
.cms-page__body :deep(a) {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
