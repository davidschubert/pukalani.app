<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * `/settings` — die KONTO-Einstellungen des Kundenbereichs (AH-2).
 *
 * Dieselbe Bauform wie die Dashboard-Hülle
 * (packages/admin/app/pages/dashboard/settings.vue): eine Reiter-Reihe, die
 * Kinder rendern über `<NuxtPage/>`. Und dieselben INHALTE — jeder Reiter
 * rendert genau die Komponente, die auch im Dashboard steht. Zwei Hüllen, eine
 * Implementierung; was hier steht, sind Wege, keine Formulare.
 *
 * VIER REITER, und der vierte ist neu: „Daten" (Export + Konto löschen) lag
 * unter „Sicherheit" (Audit-Befund M10). Beide Hüllen haben den Schnitt mit
 * AH-2 gleichzeitig bekommen — eine Trennung, die nur an einem der beiden Orte
 * gilt, ist keine.
 *
 * WARUM DER ERSTE REITER AUF `/settings` SELBST LIEGT (und nicht auf
 * `/settings/security`): dieselbe Antwort wie im Dashboard, wo „Allgemein" auf
 * `/dashboard/settings` liegt. So hat die Adresse, die in Menüs und
 * Lesezeichen steht, echten Inhalt — eine Hülle, die auf ihr eigenes Kind
 * weiterleitet, ist ein Umweg, den jeder Aufruf bezahlt.
 *
 * KEINE Reiter-REGISTRY (`pukalani.admin.settingsTabs`) wie im Dashboard: die
 * beschickt die Community-Hülle mit fremden Layern und filtert über Ort ×
 * Capability × Produkt. Hier gibt es weder Community noch Rolle, gegen die zu
 * filtern wäre. Wenn mit AH-3 das Konto-Billing dazukommt, ist das die Stelle,
 * an der die Frage neu zu stellen ist — nicht vorher.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()

const links = computed<NavigationMenuItem[]>(() => [
  { label: t('onboarding.account.settings.tabs.security'), icon: 'i-ph-shield', to: localePath('/settings'), exact: true },
  { label: t('onboarding.account.settings.tabs.sessions'), icon: 'i-ph-devices', to: localePath('/settings/sessions') },
  { label: t('onboarding.account.settings.tabs.notifications'), icon: 'i-ph-bell', to: localePath('/settings/notifications') },
  { label: t('onboarding.account.settings.tabs.data'), icon: 'i-ph-database', to: localePath('/settings/data') },
])
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
        {{ t('onboarding.account.settings.heading') }}
      </h1>
      <p class="text-muted">{{ t('onboarding.account.settings.intro') }}</p>
    </div>

    <UNavigationMenu :items="links" highlight class="-mx-1" />

    <!-- Dieselben Abstände wie in der Dashboard-Hülle: die Karten sind dort
         Geschwister eines flex-Containers, und AuthAccountDataPanel verlässt
         sich darauf (es bringt bewusst keinen eigenen Wrapper mit). -->
    <div class="flex w-full flex-col gap-4 sm:gap-6">
      <NuxtPage />
    </div>
  </div>
</template>
