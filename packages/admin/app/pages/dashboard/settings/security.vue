<script setup lang="ts">
/**
 * Settings → Sicherheit: Passwort und Zwei-Faktor (U15 Teil 4).
 *
 * Datenexport und Konto-Löschung standen bis zum Audit-Befund M10 (AH-2) hier
 * mit drin. Sie sind auf den Reiter „Daten" gezogen (settings/data.vue →
 * AuthAccountDataPanel); die Begründung steht im Kopf jener Komponente.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

useBrandTitle(() => t('dashboard.settings.security'))
</script>

<template>
  <div class="space-y-6">
    <AuthPasswordChangeForm />
    <AuthTwoFactorCard />
  </div>
</template>
