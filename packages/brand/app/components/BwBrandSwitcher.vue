<script setup lang="ts">
/** Brand-Auswahl (Korrekturrunde 3, David): Trigger zeigt NUR den Namen;
 *  ausgeklappt alle Brandings mit Zusatzinfo untereinander, die aktive
 *  mit Haken. "Meine Brands verwalten" lebt hier, nicht in der Topbar. */
defineProps<{
  current: { title: string, path: string }
  others: { title: string, path: string, to: string }[]
}>()
</script>

<template>
  <UPopover :content="{ align: 'start' }">
    <button
      class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-left"
      style="border-color: var(--bw-line-strong); background: var(--bw-surface)"
    >
      <span class="truncate font-semibold">{{ current.title }}</span>
      <UIcon name="i-ph-caret-up-down" class="flex-none" style="color: var(--bw-muted)" />
    </button>

    <template #content>
      <div class="bw-root w-72 rounded-md py-1.5" style="background: var(--bw-surface)">
        <div class="flex items-center justify-between gap-2 px-3 py-2">
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold">{{ current.title }}</span>
            <span class="block truncate text-xs" style="color: var(--bw-muted)">{{ current.path }}</span>
          </span>
          <UIcon name="i-ph-check" class="flex-none" style="color: var(--bw-accent)" />
        </div>
        <NuxtLink
          v-for="o in others" :key="o.title" :to="o.to"
          class="flex items-center justify-between gap-2 px-3 py-2 hover:bg-(--bw-accent-soft)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{{ o.title }}</span>
            <span class="block truncate text-xs" style="color: var(--bw-muted)">{{ o.path }}</span>
          </span>
        </NuxtLink>
        <div class="my-1.5 border-t" style="border-color: var(--bw-line)" />
        <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-(--bw-accent-soft)">
          <UIcon name="i-ph-plus" style="color: var(--bw-muted)" /> Neue Brand anlegen
        </button>
        <NuxtLink to="/" class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-(--bw-accent-soft)">
          <UIcon name="i-ph-squares-four" style="color: var(--bw-muted)" /> Meine Brands verwalten
        </NuxtLink>
      </div>
    </template>
  </UPopover>
</template>
