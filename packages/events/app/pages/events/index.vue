<script setup lang="ts">
/**
 * Default-Seite des Layers — öffentlich (Gäste lesen, Mitglieder sagen zu).
 */
const { t } = useI18n()
const localePath = useLocalePath()

useBrandTitle(() => t('events.list.title'))

/**
 * DER EINSTIEG IN DIE VERWALTUNG (F58, 2026-08-16) — wie bei den Kursen gab es
 * ihn hier GAR NICHT: Anlegen und Bearbeiten lebten ausschließlich unter
 * /dashboard/events, und von der Terminliste führte kein Weg dorthin.
 *
 * `useCapability` deckt BEIDE Quellen ab (Operator-Label ODER Rolle in dieser
 * Community) — dieselbe Rechnung, die `requireCommunityPermission` auf der
 * Route macht; in einer Silo-App gibt es keine Community-Rolle.
 *
 * „Verwalten" steht neben „Neuer Termin", weil die Liste hier nur zeigt, was
 * VERÖFFENTLICHT ist: Entwürfe und ausgeblendete Termine findet man nur im
 * Dashboard wieder.
 */
const canManage = useCapability('events.manage')
</script>

<template>
  <UContainer class="max-w-5xl py-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold">{{ t('events.list.title') }}</h1>
        <p class="mt-1 text-sm text-muted">{{ t('events.list.description') }}</p>
      </div>
      <div v-if="canManage" class="flex shrink-0 items-center gap-2" data-testid="events-manage-actions">
        <UButton
          :to="localePath('/dashboard/events')"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-ph-sliders-horizontal"
          data-testid="events-manage"
        >
          {{ t('events.list.manage') }}
        </UButton>
        <UButton
          :to="localePath({ path: '/dashboard/events', query: { new: '1' } })"
          size="sm"
          icon="i-ph-plus"
          data-testid="events-create"
        >
          {{ t('events.list.create') }}
        </UButton>
      </div>
    </div>

    <EventList class="mt-6" />
  </UContainer>
</template>
