<script setup lang="ts">
/**
 * `/settings` → Sicherheit: NUR das Passwort (Audit-Befund M10).
 *
 * Der Index-Reiter der Konto-Hülle, wie „Allgemein" im Dashboard. Export und
 * Löschung des Kontos liegen nebenan unter „Daten".
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()

useBrandTitle(() => t('onboarding.account.settings.tabs.security'))
</script>

<template>
  <AuthPasswordChangeForm />
</template>
