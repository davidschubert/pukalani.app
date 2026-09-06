<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'
import type { BrandDocumentChapter } from '../../shared/types/brand'

/**
 * DAS INHALTSVERZEICHNIS von „Euer Branding" (Davids Wunsch 2026-09-05: „bau
 * das Inhaltsverzeichnis auch in die echte Dokument-Seite ein"). Vorbild und
 * abgenommene Form: `FdToc` im Playground — dieselbe Mechanik, hier aber an
 * den ECHTEN Kapiteln (`BrandDocumentChapter`) statt am Dummy.
 *
 * ES ERSETZT DEN „STAND" und ist zugleich einer: `UContentToc` bringt
 * Sprungmarken UND die Hervorhebung des sichtbaren Kapitels (`useScrollspy`
 * beobachtet die Elemente mit den `links[].id` — hier die `<section
 * :id="chapter.stepKey">` der Seite). Der `link`-Slot trägt zusätzlich Glyphe
 * und Abnahme-Zähler, also genau das, was die frühere Liste zeigte.
 *
 * DIE HÜLLE (`UPageAside`) LIEGT NICHT HIER, sondern bei der Seite — wie beim
 * Vorbild: sie unterscheidet sich je Ort (in der scrollenden Workspace-Spalte
 * `static`, am Seitenrand einer Leseansicht `sticky`), und eine Komponente,
 * die ihren eigenen Platz bestimmt, ist an zweiter Stelle nicht mehr
 * brauchbar.
 *
 * ZWEI DINGE, die man nicht „vereinfachen" darf (beide im Playground live
 * erwischt):
 *  1. EINZEILIGE Einträge — die Hervorhebungs-Linie rechnet mit der festen
 *     Zeilenhöhe des Vorbilds (1,75 rem je Link); ein zweizeiliger Eintrag
 *     setzt sie an den falschen Eintrag. Deshalb steht der Zähler rechts in
 *     der KURZFORM `7/11`: die Langform (`brand.acceptance.counter`, „7 von 11
 *     abgenommen") bricht in dieser Spalte um.
 *  2. `@move` scrollt SELBST: `UContentToc` schiebt den Hash nur in den
 *     Router, und der scrollt das FENSTER — hier scrollt aber die Bühne
 *     (`main.bw-stage`). `scrollIntoView` findet den nächsten scrollenden
 *     Vorfahren und trifft damit beides.
 *
 * VORAUSSETZUNG in der App: `ui: { content: true }` (s. nuxt.config des
 * Layers) — ohne den Schalter registriert Nuxt UI `UContentToc` gar nicht.
 */
const props = defineProps<{
  chapters: BrandDocumentChapter[]
}>()

const { t } = useI18n()

interface BwDocumentTocLink extends ContentTocLink {
  state: BrandDocumentChapter['state']
  storedState: BrandDocumentChapter['storedState']
  counter: string
}

const links = computed<BwDocumentTocLink[]>(() => props.chapters.map(chapter => ({
  // Die Sprungmarke IST der Kapitel-Schlüssel — die Seite stempelt ihn als
  // `id` an ihre Abschnitte; ein zweiter Anker-Begriff wäre eine zweite
  // Wahrheit.
  id: chapter.stepKey,
  depth: 2,
  text: t(`brand.steps.${chapter.stepKey}`),
  state: chapter.state,
  storedState: chapter.storedState,
  counter: `${chapter.acceptance.accepted}/${chapter.acceptance.total}`,
})))

function scrollToChapter(id: string): void {
  document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

/**
 * Haken · Halbkreis · Schloss · Kreis — dieselbe Reihenfolge wie überall im
 * Wizard: der GESPEICHERTE Zustand („abgenommen") schlägt den geltenden, denn
 * er ist die Tatsache, an der die Finale Abnahme hängt.
 */
function glyph(link: BwDocumentTocLink): { name: string, style: string } {
  if (link.storedState === 'done') return { name: 'i-ph-check-circle-fill', style: 'color: var(--bw-accent)' }
  if (link.state === 'active') return { name: 'i-ph-circle-half-fill', style: 'color: var(--bw-ink)' }
  if (link.state === 'locked') return { name: 'i-ph-lock-simple', style: 'color: var(--bw-muted)' }
  return { name: 'i-ph-circle', style: 'color: var(--bw-muted)' }
}
</script>

<template>
  <UContentToc
    :title="t('brand.document.toc')"
    :links="links"
    color="neutral"
    highlight
    highlight-color="neutral"
    default-open
    :ui="{
      root: 'static max-h-none mx-0 px-0 sm:mx-0 sm:px-0 bg-transparent backdrop-blur-none',
      container: 'pt-0 sm:pt-0 lg:py-0 pb-0 sm:pb-0 border-0',
      trigger: 'bw-label uppercase tracking-wider font-normal',
      title: 'text-(--bw-muted)',
      link: 'rounded-md',
      list: 'border-(--bw-line)',
      indicatorActive: 'bg-(--bw-ink)',
    }"
    @move="scrollToChapter"
  >
    <template #link="{ link }">
      <span class="flex w-full min-w-0 items-center gap-2">
        <UIcon :name="glyph(link).name" class="size-4 flex-none" :style="glyph(link).style" />
        <span class="min-w-0 flex-1 truncate">{{ link.text }}</span>
        <span class="bw-label flex-none tabular-nums" style="color: var(--bw-muted)">{{ link.counter }}</span>
      </span>
    </template>
  </UContentToc>
</template>
