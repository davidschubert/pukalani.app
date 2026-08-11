<script setup lang="ts">
/**
 * `/settings/sessions` — die eigenen angemeldeten Geräte.
 *
 * DIESELBE Karte wie im Dashboard (AuthAccountSessionsCard, core). Sie zeigt
 * die Sitzungen des KONTOS, und genau deshalb gehört sie hierher: eine Sitzung
 * auf `account.pukalani.app` beenden zu können, ohne vorher in irgendeine
 * Community springen zu müssen, war der Grund für diesen Bereich.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()

useBrandTitle(() => t('onboarding.account.settings.tabs.sessions'))
</script>

<template>
  <AuthAccountSessionsCard />
</template>
