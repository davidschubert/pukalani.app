<script setup lang="ts">
import type { BwTocLink } from '../../../../../packages/brand/app/components/BwReadingToc.vue'
import { buildBrandFoundation } from '../../../../../packages/brand/shared/brandFoundation'
import {
  KAILUA_COFFEE_EXAMPLE,
  KAILUA_COFFEE_EXAMPLE_META,
} from '../../../../../packages/brand/shared/examples/kailuaCoffee'

/**
 * DAS ÖFFENTLICHE BEISPIEL-BRANDING „Kailua Coffee Co." (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §4 und §5 Paket G5; Davids Go
 * 2026-09-07 „Starte Paket G5").
 *
 * ── SIE ZEIGT NICHT, SIE IST ─────────────────────────────────────────────
 * Die Seite beschreibt das Ergebnis nicht, sie RENDERT es: derselbe Renderer
 * (`buildBrandFoundation`), derselbe Baustein (`BwFoundationChapter`),
 * dasselbe Verzeichnis (`BwReadingToc`) wie die private Leseansicht und die
 * Empfänger-Ansicht eines geteilten Links. Die Eingabe ist ein FESTER
 * Snapshot (`shared/examples/kailuaCoffee.ts`) in der Form, die auch ein
 * eingefrorener Share-Snapshot hat. Damit ist „so sieht euer Ergebnis aus"
 * eine Tatsache und keine Behauptung — und sie veraltet nicht: ändert sich
 * der Renderer, ändert sich diese Seite mit.
 *
 * Kein Abruf, kein Konto, kein Zustand: der Snapshot ist eine Konstante, die
 * Seite rendert vollständig im SSR.
 *
 * ── WARUM `variant="share"` UND NICHT `private` ──────────────────────────
 * Der Fremdleser ist genau der Leser dieser Seite: keine Zähler, kein
 * Vermerk „noch nicht abgenommen" (es gibt hier nichts abzunehmen), kein
 * Preisanker an der visuellen Schranke. Sie schrumpft auf EINEN Satz — genau
 * das, was ein Interessent sehen soll: was das Fundament abdeckt und wo das
 * Brand Design anfängt.
 *
 * ── WAS SIE VON DER SHARE-SEITE UNTERSCHEIDET ────────────────────────────
 * Diese hier ist eine MARKETING-Seite, kein privat verschicktes Dokument:
 *  · Layout `default` der App (BwSiteNav + BwSiteFooter) statt des schlanken
 *    eigenen Rahmens — der Leser soll von hier aus weitergehen können.
 *  · INDEXIERBAR. Kein `noindex`, kein `frame-ancestors 'none'`, kein
 *    `no-store`: hier steht eine erfundene Beispiel-Marke, kein fremdes
 *    Eigentum. (Die App hat keine Sitemap-Erzeugung — nachgesehen; sobald es
 *    eine gibt, gehört diese Route hinein.)
 *  · Ein CTA am Ende. Auf der Empfänger-Ansicht wäre er aufdringlich, hier
 *    ist er der Zweck.
 *
 * ── DER INHALT BLEIBT DEUTSCH, DER RAHMEN NICHT ──────────────────────────
 * Die Marke spricht deutsch (`contentLocale: 'de'`), die Tagline englisch.
 * Kapitelnamen und Beschriftungen folgen dagegen der Sprache der Oberfläche,
 * weil sie als i18n-SCHLÜSSEL aus dem Renderer kommen. Dieselbe Eigenschaft
 * hat jede geteilte Foundation, und sie ist gewollt: die Inhaltssprache einer
 * Marke ist ihre Entscheidung, die Sprache des Handbuchs die des Lesers. Die
 * Zeile „Inhaltssprache DE" im Kopf sagt es, statt es zu verschweigen.
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { isLoggedIn } = useCurrentUser()

/** Einmal gebaut — der Snapshot ist eine Konstante, nichts daran ist reaktiv. */
const chapters = buildBrandFoundation(KAILUA_COFFEE_EXAMPLE).chapters

const brandTitle = KAILUA_COFFEE_EXAMPLE.title
const contentLocale = KAILUA_COFFEE_EXAMPLE.contentLocale.toUpperCase()

const stand = computed(() => {
  const value = Date.parse(KAILUA_COFFEE_EXAMPLE_META.standDate)
  return Number.isFinite(value)
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(value)
    : ''
})

const tocLinks = computed<BwTocLink[]>(() => chapters.map((chapter, index) => ({
  id: chapter.anchor,
  text: t(chapter.titleKey),
  // Ein festes Beispiel kennt kein „offen" — nur fertig und die Schranke.
  state: chapter.state === 'locked' ? 'locked' : 'done',
  counter: String(index).padStart(2, '0'),
})))

/**
 * Dasselbe Ziel wie der Haupt-CTA der Startseite (`home.ctaStart`): Gäste in
 * die Einladung, Eingeloggte in ihre Markenliste. Zwei Adressen für denselben
 * Knopf wären zwei Trichter.
 */
const startTarget = computed(() => localePath(isLoggedIn.value ? '/dashboard/brands' : '/invite'))

useSeoMeta({
  title: () => t('example.seoTitle'),
  description: () => t('example.seoDescription'),
  ogTitle: () => t('example.seoTitle'),
  ogDescription: () => t('example.seoDescription'),
})

function print(): void {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div class="fd-example pb-10">
    <div class="mx-auto max-w-5xl">
      <header class="mt-16 border-b pb-10" style="border-color: var(--bw-line)">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
          {{ t('example.eyebrow') }}
        </p>
        <h1 class="mt-4 text-balance text-5xl font-extralight leading-tight tracking-tight sm:text-6xl">
          {{ brandTitle }}
        </h1>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">
          {{ t('example.lead') }}
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p class="bw-label" style="color: var(--bw-muted)">
            {{ t('example.stand', { date: stand }) }}
            <span class="mx-2">·</span>
            {{ t('brand.foundation.contentLocale', { locale: contentLocale }) }}
          </p>
          <UButton
            class="fd-noprint rounded-full" color="neutral" variant="outline" icon="i-ph-printer"
            :label="t('example.print')" style="background: var(--bw-surface-hi)"
            @click="print"
          />
        </div>
      </header>

      <!-- 7 + 3 Spalten wie auf der Empfänger-Ansicht: bei zwei Spalten kürzt
           das Verzeichnis lange Kapitelnamen ab. -->
      <UPage :ui="{ root: 'lg:gap-12', center: 'lg:col-span-7 min-w-0', right: 'lg:col-span-3' }">
        <div class="mt-10 flex flex-col gap-10">
          <BwFoundationChapter
            v-for="(chapter, index) in chapters" :key="chapter.id"
            :chapter="chapter" :index="index" variant="share"
          />
        </div>
        <template #right>
          <UPageAside class="fd-noprint" :ui="{ root: 'py-10 lg:pe-0' }">
            <BwReadingToc :links="tocLinks" :title="t('brand.foundation.toc')" />
          </UPageAside>
        </template>
      </UPage>

      <section class="bw-card fd-noprint mt-20 px-8 py-14 text-center sm:py-16">
        <h2 class="mx-auto max-w-2xl text-balance text-3xl font-medium tracking-tight sm:text-4xl">
          {{ t('example.ctaTitle') }}
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed" style="color: var(--bw-ink-soft)">
          {{ t('example.ctaBody') }}
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <UButton
            :label="t('example.ctaStart')" :to="startTarget"
            size="lg" icon="i-ph-plus" color="neutral" class="rounded-full"
          />
          <UButton
            :label="t('example.ctaHome')" :to="localePath('/')"
            size="lg" color="neutral" variant="ghost" class="rounded-full"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style>
/* Druck: dieselbe Regel wie auf den beiden Foundation-Ansichten — Kopf mit
 * Marke und Stand bleibt, Navigation, Verzeichnis, Knöpfe und CTA gehen weg.
 * Nav und Fuß gehören dem Layout, deshalb sind sie hier über ihre eigenen
 * Klassen nicht erreichbar: `main` ist der einzige Teil, der gedruckt wird. */
@media print {
  .fd-example .fd-noprint { display: none !important; }
}
</style>
