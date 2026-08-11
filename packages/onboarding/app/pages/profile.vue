<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * `/profile` — die HÜLLE der Pukalani-ID (AH-2, um AH-3 erweitert).
 *
 * Bis AH-3 war das eine einzelne Seite. Jetzt ist es dieselbe Bauform wie
 * `/settings`: eine Reiter-Reihe, die Kinder rendern über `<NuxtPage/>`, und
 * der ERSTE Reiter liegt auf der Hülle selbst (`/profile`, `exact`) statt auf
 * `/profile/index` — damit die Adresse, die in Menüs und Lesezeichen steht,
 * echten Inhalt hat und keine Weiterleitung bezahlt.
 *
 * ZWEI REITER: „Profil" (wer du bist) und „Aktivität" (was du getan hast).
 * Beides ist konto-weit und gilt über alle Communities — genau deshalb steht
 * es hier und nicht im Community-Dashboard.
 *
 * DEN TITEL SETZEN DIE KINDER, nicht diese Hülle — wie in `/settings`. Ein
 * Titel an der Hülle stünde über beiden Reitern und wäre auf einem davon
 * immer falsch.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()

const links = computed<NavigationMenuItem[]>(() => [
  { label: t('onboarding.account.profile.tabs.profile'), icon: 'i-ph-user-circle', to: localePath('/profile'), exact: true },
  { label: t('onboarding.account.profile.tabs.activity'), icon: 'i-ph-clock-counter-clockwise', to: localePath('/profile/activity') },
])
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
        {{ t('onboarding.account.profile.heading') }}
      </h1>
      <p class="text-muted">{{ t('onboarding.account.profile.intro') }}</p>
    </div>

    <UNavigationMenu :items="links" highlight class="-mx-1" />

    <div class="flex w-full flex-col gap-4 sm:gap-6">
      <NuxtPage />
    </div>
  </div>
</template>
