<script setup lang="ts">
/** Theme-Editor: neues Theme anlegen (dünner Wrapper um CustomizeEditor). */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], requiredCapability: 'system.manage' })

const { t } = useI18n()

useBrandTitle(() => t('themes.customize.create'))
</script>

<template>
  <CustomizeEditor />
</template>
