<script setup lang="ts">
/**
 * `/settings/data` — Datenexport und Konto löschen (Audit-Befund M10).
 *
 * Der Reiter, den es vorher nirgends gab: beides lag unter „Sicherheit". Auf
 * dem Kundenbereich ist die Trennung noch eine Spur wichtiger als im
 * Dashboard — hier steht das KONTO zur Debatte, nicht die Mitgliedschaft in
 * einer Community, und „Konto löschen" heißt an dieser Stelle wirklich alles.
 * Was die Löschung mitnimmt, sagt die Karte selbst (AuthAccountDeleteCard).
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()

useBrandTitle(() => t('onboarding.account.settings.tabs.data'))
</script>

<template>
  <AuthAccountDataPanel />
</template>
