<script setup lang="ts">
/**
 * Die Benachrichtigungs-Fläche des KONTOS — Karte samt Überschrift (AH-2).
 *
 * Der Inhalt (UserNotificationSettings) war immer schon eine Komponente; die
 * Karte drumherum stand im Seiten-Markup von
 * packages/admin/app/pages/dashboard/settings/notifications.vue. Seit es die
 * zweite Hülle auf account.pukalani.app gibt, wäre sie dort ein zweites Mal
 * abgeschrieben worden — inklusive der beiden i18n-Schlüssel, die schon einmal
 * jemand ändern wird.
 */
const { t } = useI18n()
</script>

<template>
  <UPageCard :title="t('notifications.email.title')" :description="t('notifications.email.description')" variant="subtle">
    <UserNotificationSettings />
  </UPageCard>
</template>
