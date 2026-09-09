<script setup lang="ts">
import type { InsightsLocale, InsightsPost } from '../../../../../shared/insightsPost'
import { DEMO_GRADIENTS, DEMO_POSTS } from '../../../utils/demoInsights'

/**
 * SCREEN 1 — DIE JOURNAL-LISTE (Plan §9.5, Adresse `/insights`).
 *
 * Sie zeigt ALLE VIER Formate in einer Liste — das ist die Entscheidung, die
 * hier zur Abnahme steht: Insights ist EIN Bereich mit vier Formaten und
 * nicht vier Bereiche. Der Filter trennt sie, die Liste nicht.
 *
 * ── WAS DAVID HIER PRÜFEN SOLL ──────────────────────────────────────────
 *  · Die Werkzeugleiste: Themen als Chips, Format/Sprache/Sortierung als
 *    Auswahl, Raster/Liste rechts (und in der Adresse, `?display=list`).
 *  · „Meistgelesen" ist SICHTBAR gesperrt, mit dem Grund darunter.
 *  · Der englische Beitrag „Why good names are uncomfortable" trägt auf der
 *    deutschen Oberfläche den Hinweis „Nur auf English" — und verschwindet,
 *    sobald man den Sprachfilter auf Deutsch stellt. Das ist die Sicherung
 *    aus §3.2 („eine unredigierte Fassung ist nie öffentlich"), von aussen
 *    gesehen.
 *
 * OHNE `BwSiteFooter`: dessen Punkte („About", „Team") sind Seiten der
 * branding-App und im Playground nicht vorhanden — der Fuss stünde hier mit
 * zwei toten Links da, und genau die hat Davids 404-Audit vom 2026-09-03
 * beseitigt. Ein Prototyp soll das nicht wieder vorführen.
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()

const readerLocale = computed<InsightsLocale>(() => (locale.value === 'de' ? 'de' : 'en'))

/** Im Produkt: `/insights/<slug>` · `/brands/<slug>` · `/duels/…` · `/rankings/…`. */
function resolveHref(post: InsightsPost): string {
  if (post.format === 'profile') return localePath('/insights/demo/profil')
  if (post.format === 'duel') return localePath('/insights/demo/duell')
  if (post.format === 'ranking') return localePath('/insights/demo/ranking')
  return localePath('/insights/demo/artikel')
}

/** Die Farbwelt gehört dem brand-Layer; hier eine Nachschlagetabelle. */
function resolveGradient(post: InsightsPost): readonly [string, string] {
  const brandId = post.brandRefs[0]?.brandId ?? ''
  return DEMO_GRADIENTS[brandId] ?? ['#e6e2da', '#8f867a']
}
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <InDemoNav />
    <div class="mx-auto max-w-7xl">
      <div class="mb-2 text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Insights</p>
        <h1 class="mt-1 text-4xl leading-tight">
          {{ locale === 'de' ? 'Markenwissen, das trägt' : 'Brand knowledge that holds' }}
        </h1>
      </div>
      <p class="bw-label text-center" style="color: var(--bw-muted)">
        {{ locale === 'de'
          ? 'Markenprofile, Duelle, Artikel und Rankings — verknüpft statt verbloggt.'
          : 'Brand profiles, duels, articles and rankings — linked, not blogged.' }}
      </p>

      <div class="mt-8">
        <InPostList
          :posts="DEMO_POSTS"
          :locale="readerLocale"
          :resolve-href="resolveHref"
          :resolve-gradient="resolveGradient"
        />
      </div>

      <p class="bw-pending mt-12 text-center">
        {{ t('insights.article.byline') }} · Prototyp I0 — alle Marken erfunden, keine fremden Logos.
      </p>
    </div>
  </div>
</template>
