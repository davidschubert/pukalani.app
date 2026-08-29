<script setup lang="ts">
/** "Meine Brands"-Karte (§3d): ruhig, kein Datengrid. */
defineProps<{
  title: string
  path: string
  step: string
  progress: string
  remaining: string
  edited: string
}>()
</script>

<template>
  <div class="bw-root bw-card bw-card--hover p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold">{{ title }}</h3>
        <p class="text-xs" style="color: var(--bw-muted)">{{ path }}</p>
      </div>
      <UDropdownMenu :items="[[{ label: 'Umbenennen', icon: 'i-ph-pencil-simple' }, { label: 'Teilen', icon: 'i-ph-share-network' }, { label: 'Löschen', icon: 'i-ph-trash' }]]">
        <UButton icon="i-ph-dots-three" color="neutral" variant="ghost" size="sm" aria-label="Aktionen" />
      </UDropdownMenu>
    </div>
    <p class="mt-4 text-sm" style="color: var(--bw-ink-soft)">{{ step }}</p>
    <p class="text-sm" style="color: var(--bw-muted)">{{ progress }} · noch {{ remaining }}</p>
    <div class="mt-4 flex items-center justify-between">
      <span class="text-xs" style="color: var(--bw-muted)">{{ edited }}</span>
      <UButton size="sm" trailing-icon="i-ph-arrow-right" label="Weiterarbeiten" />
    </div>
  </div>
</template>
