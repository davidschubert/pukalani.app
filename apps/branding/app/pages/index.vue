<script setup lang="ts">
/**
 * DIE STARTSEITE VON branding.supply — bewusst DÜNN.
 *
 * Der brand-Layer bringt KEINE `/`-Seite mit, und das ist richtig so: er ist
 * host-agnostisch (Infra-Plan §1 „Nicht betroffen"), eine Startseite ist
 * dagegen die Marke DIESER Domain und gehört deshalb in die App.
 *
 * WAS SIE HEUTE IST: der Einstieg. Sie sagt, was hier passiert, und führt in
 * die Brandings — mehr nicht. Der öffentliche Conversion-Auftritt (Hero,
 * Prozess-Theater, Brand-Check als Lead-Magnet) liegt als abgenommener
 * Klickdummy in `packages/brand/.playground/app/pages/start.vue` und wird
 * eine eigene Runde; ihn hier halbfertig nachzubauen hiesse, zwei Fassungen
 * derselben Seite zu pflegen.
 *
 * KEIN `noindex`: `useLocaleSeoHead()` (app.vue) stempelt nichts, und die
 * Voreinstellung jedes Crawlers ist indexieren. Solange die Beta geschlossen
 * ist, führt die Seite ohnehin nur an ein Zugangs-Gate.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const { isLoggedIn } = useCurrentUser()
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <div class="max-w-2xl">
      <p class="text-sm font-medium uppercase tracking-widest text-muted">
        {{ t('home.eyebrow') }}
      </p>
      <h1 class="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        {{ t('home.title') }}
      </h1>
      <p class="mt-6 text-lg leading-relaxed text-muted">
        {{ t('home.subtitle') }}
      </p>

      <div class="mt-10 flex flex-wrap items-center gap-3">
        <UButton
          :to="localePath('/dashboard/brands')"
          size="lg"
          icon="i-ph-compass"
          :label="t('home.cta.brands')"
        />
        <UButton
          v-if="!isLoggedIn"
          :to="localePath('/login')"
          size="lg"
          color="neutral"
          variant="subtle"
          :label="t('home.cta.login')"
        />
        <!--
          Der dritte Weg, bewusst dezent: der Satz darunter sagt seit jeher,
          dass es einen Code braucht — er nannte nur nie die Stelle, an der man
          ihn loswird. Nur für Gäste, weil ein eingelöster Zugang am Konto
          hängt und die Seite dann nichts mehr zu tun hat.
        -->
        <UButton
          v-if="!isLoggedIn"
          :to="localePath('/invite')"
          size="lg"
          color="neutral"
          variant="ghost"
          :label="t('home.cta.invite')"
        />
      </div>

      <p class="mt-8 text-sm text-muted">
        {{ t('home.beta') }}
      </p>
    </div>
  </UContainer>
</template>
