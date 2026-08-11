<script setup lang="ts">
/**
 * Settings → Sicherheit: NUR noch das Passwort (Audit-Befund M10, AH-2).
 *
 * Datenexport und Konto-Löschung standen bis dahin hier mit drin. Sie sind auf
 * den neuen Reiter „Daten" gezogen (settings/data.vue → AuthAccountDataPanel);
 * die Begründung steht im Kopf dieser Komponente.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

useHead({ title: () => t('dashboard.settings.security') })
</script>

<template>
  <AuthPasswordChangeForm />
</template>
