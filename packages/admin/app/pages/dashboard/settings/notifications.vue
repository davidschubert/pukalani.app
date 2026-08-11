<script setup lang="ts">
// Settings → Benachrichtigungen: E-Mail-Präferenz. Karte + Inhalt seit AH-2 in
// UserNotificationsPanel (core) — dieselbe Fläche trägt /settings/notifications
// auf account.pukalani.app.
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

// Wie in index.vue: dieser Aufruf stand außerhalb des `<script>`-Blocks und
// wurde deshalb nie ausgeführt.
useHead({ title: () => t('dashboard.settings.notifications') })
</script>

<template>
  <UserNotificationsPanel />
</template>
