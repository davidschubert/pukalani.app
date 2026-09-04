<script setup lang="ts">
/**
 * DIE ABOUT-SEITE — „Wer wir sind", herausgelöst aus /team (Davids
 * Entscheidung 2026-09-04: About und Team sind zwei Seiten).
 *
 * Bis dahin zeigte der Nav-Punkt „About" auf /team, und dort stand der
 * Selbstbeweis-Block ÜBER den Team-Karten — zwei Aussagen auf einer Seite.
 * Hier steht nur noch die erste: warum es Branding Supply gibt und dass wir
 * unsere Produkte zuerst auf uns selbst angewendet haben (Wortlaut
 * unverändert aus der abgenommenen Runde 163 — die Schlüssel sind von
 * `team.*` nach `about.*` umgezogen, nicht neu geschrieben).
 *
 * Wie die Startseite und /team: in der APP, nicht im Layer — der brand-Layer
 * ist host-agnostisch, die Selbstdarstellung gehört der Marke dieser Domain.
 */

const { t } = useI18n()
const localePath = useLocalePath()

useHead({ title: computed(() => t('about.title')) })
</script>

<template>
  <div class="pb-10">
    <div class="@container mx-auto max-w-7xl">
      <!-- Wer wir sind: der Selbstbeweis (Dummy-Wortlaut, Runde 163) -->
      <div class="mx-auto mt-14 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('about.eyebrow') }}</p>
        <h1 class="mt-4 text-balance text-5xl font-extralight leading-tight tracking-tight">{{ t('about.title') }}</h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('about.intro1') }}</p>
        <p class="mx-auto mt-4 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('about.intro2') }}</p>
        <p class="bw-label mx-auto mt-6 max-w-2xl leading-relaxed" style="color: var(--bw-muted)">{{ t('about.fingerprint') }}</p>
      </div>

      <!-- Weiter zu den Menschen bzw. in den Wizard — dieselbe CTA-Karte wie
           auf /team, plus der Weg zur neuen Team-Seite. -->
      <div class="bw-card mt-16 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">{{ t('team.ctaText') }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <UButton :label="t('about.teamLink')" :to="localePath('/team')" color="neutral" variant="ghost" class="rounded-full" />
          <UButton :label="t('team.ctaButton')" :to="localePath('/invite')" class="rounded-full" />
        </div>
      </div>
    </div>
  </div>
</template>
