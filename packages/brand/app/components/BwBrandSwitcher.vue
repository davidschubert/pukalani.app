<script setup lang="ts">
/** Brand-Auswahl oben in der Leiste (Korrekturrunde 1, David): zeigt die
 *  aktuelle Brand, wechselt in andere oder legt eine neue an. */
const props = defineProps<{
  current: { title: string, path: string }
  others: { title: string, to: string }[]
}>()
const items = computed(() => [
  props.others.map(o => ({ label: o.label ?? o.title, icon: 'i-ph-swap', to: o.to })),
  [{ label: 'Neue Brand anlegen', icon: 'i-ph-plus' }],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'start' }">
    <button
      class="mb-5 flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left"
      style="border-color: var(--bw-line-strong); background: var(--bw-surface)"
    >
      <span class="grid size-7 flex-none place-items-center rounded-md text-sm font-semibold" style="background: var(--bw-accent-soft); color: var(--bw-accent)">
        {{ current.title.slice(0, 1) }}
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ current.title }}</span>
        <span class="block truncate text-xs" style="color: var(--bw-muted)">{{ current.path }}</span>
      </span>
      <UIcon name="i-ph-caret-up-down" class="flex-none" style="color: var(--bw-muted)" />
    </button>
  </UDropdownMenu>
</template>
