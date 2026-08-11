<script setup lang="ts">
/**
 * `/settings/notifications` — E-Mail-Präferenz des Kontos.
 *
 * Die Einstellung ist konto-weit (`prefs.emailNotifications`, nicht pro
 * Community) und war bisher nur über das Dashboard EINER Community erreichbar.
 * Für jemanden, der von einer Community zu viele Mails bekommt, war das ein
 * Umweg über genau die Community, aus der er weniger hören wollte.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()

useBrandTitle(() => t('onboarding.account.settings.tabs.notifications'))
</script>

<template>
  <UserNotificationsPanel />
</template>
