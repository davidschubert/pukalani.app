<script setup lang="ts">
// Settings → Sessions: eigene aktive Sessions des Users (Core-Komponente)
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { t } = useI18n()

useBrandTitle(() => t('dashboard.settings.sessions'))
</script>

<template>
  <AuthAccountSessionsCard />
</template>
