<script setup lang="ts">
// Szene 13 — Call to Adventure (§6.4): tritt durch das Tor. Der erreichte Ort:
// dunkler, warmer Peak mit der puka als Lichtquelle, direkt vor dem Footer.
const { t } = useI18n()
const { start, demo, request } = useProductLinks()

/**
 * DIESER BLOCK MUSSTE MIT (U2): der Hero sagt bei geschlossenem Tor „Zugang
 * anfragen", und 13 Szenen später stand hier weiter „in 60 Sekunden steht
 * deine Community. Kostenlos, ohne Risiko." — dasselbe Versprechen, das
 * Audit-Befund K1 beanstandet hat, nur weiter unten auf derselben Seite. Zwei
 * verschiedene Ansagen auf EINER Seite sind schlechter als jede einzelne.
 *
 * Die Knopf-Beschriftungen kommen aus dem Hero-Block (`marketing.hero.cta*`):
 * es ist derselbe Weg, und sechs Unterseiten teilen sich `hero.ctaPrimary`
 * bereits auf genau diese Weise. Nur der Fließtext ist eigen, weil er hier
 * eine ganze Szene trägt.
 */
const gate = useOnboardingGate()
const lead = computed(() => gate.value.inviteRequired
  ? t('marketing.cta.leadGated')
  : t('marketing.cta.lead'))

const links = computed(() => [
  gate.value.inviteRequired
    ? { to: request, color: 'primary' as const, size: 'xl' as const, label: t('marketing.hero.ctaRequest') }
    : { to: start, color: 'primary' as const, size: 'xl' as const, label: t('marketing.cta.primary') },
  ...(gate.value.inviteRequired
    ? [{
        to: start,
        color: 'neutral' as const,
        variant: 'subtle' as const,
        size: 'xl' as const,
        label: t('marketing.hero.ctaHasCode'),
      }]
    : []),
  {
    to: demo,
    color: 'neutral' as const,
    variant: 'ghost' as const,
    size: 'xl' as const,
    icon: 'i-ph-play-circle',
    label: t('marketing.cta.secondary'),
  },
])
</script>

<template>
  <!--
    Abschluss-CTA der Startseite. Gleicher Bauklotz wie die sieben CTA-Blöcke
    der Unterseiten (`pageCTA`-Vertrag in app/app.config.ts), nur größer: die
    zwei Maß-Abweichungen stehen als Variablen an der Wurzel. Die Polsterung
    UNTEN übernimmt die Refrain-Zeile im `#bottom`-Slot, deshalb bleibt am
    Container nur der Rest-Abstand zu den Knöpfen (Bestand: 1,25rem).
  -->
  <UPageCTA
    id="los-gehts"
    as="section"
    class="cta-section tone-ink [--mkt-cta-py:clamp(4rem,9vw,7rem)] [--mkt-cta-title:clamp(1.9rem,4.5vw,3rem)]"
    :description="lead"
    :links="links"
    :ui="{
      container: 'pb-0 sm:pb-0 lg:pb-0',
      wrapper: 'max-w-[42rem]',
      title: 'tracking-[-0.02em]',
      description: 'mx-auto max-w-[34rem] text-lg/[1.55] sm:text-lg/[1.55]',
      footer: 'mt-8',
    }"
  >
    <template #top>
      <div class="cta-puka puka-glow" data-parallax="0.08" aria-hidden="true" />
    </template>

    <!--
      Das Markenzeichen steht über der Überschrift und ist rein dekorativ
      (`aria-hidden`, es rendert ein <svg>). Es sitzt deshalb IM `#title`-Slot:
      ein <svg> ist Phrasing-Content und in einer <h2> erlaubt, und zwischen
      `#top` (außerhalb des Breiten-Containers) und der Überschrift gibt es
      keinen weiteren Slot.
    -->
    <template #title>
      <PukaMark :size="44" class="mx-auto mb-4 block" />
      {{ t('marketing.cta.title') }}
    </template>

    <template #bottom>
      <!-- Anführungszeichen im i18n-Text (DE „…" · EN “…”), nicht im Markup. -->
      <p class="relative pb-(--mkt-cta-py) pt-5 text-center italic text-primary">
        {{ t('marketing.cta.refrain') }}
      </p>
    </template>
  </UPageCTA>
</template>

<style scoped>
/* Nur noch das Bildmotiv: der Lichtkreis hinter dem Zeichen. */
.cta-puka {
  top: -16rem;
  left: 50%;
  transform: translateX(-50%);
  width: 40rem;
  height: 40rem;
  opacity: 0.5;
}
</style>
