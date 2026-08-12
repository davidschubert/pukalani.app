<script setup lang="ts">
/**
 * Settings → Daten: Export und Konto-Löschung (Audit-Befund M10, AH-2).
 *
 * Neuer Reiter, kein neuer Inhalt — beide Karten kommen unverändert von
 * „Sicherheit" herüber. Die Fläche selbst liegt in AuthAccountDataPanel (core),
 * weil `/settings/data` auf account.pukalani.app dieselbe zeigt.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

useBrandTitle(() => t('dashboard.settings.data'))
</script>

<template>
  <AuthAccountDataPanel />
</template>
