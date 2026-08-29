<script setup lang="ts">
/** Gepunktete Sparkline (Iteration 2, superpower-Referenz): Werte als
 *  Punktreihe, der letzte Punkt betont in Accent. Kein Datengrid —
 *  ein Blick, eine Tendenz. */
const props = withDefaults(defineProps<{ values: number[], width?: number, height?: number }>(), { width: 120, height: 26 })
const points = computed(() => {
  const vals = props.values
  if (!vals.length) return []
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const padX = 4
  const padY = 5
  const stepX = vals.length > 1 ? (props.width - padX * 2) / (vals.length - 1) : 0
  return vals.map((v, i) => ({
    x: padX + i * stepX,
    y: props.height - padY - ((v - min) / span) * (props.height - padY * 2),
  }))
})
</script>

<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :style="`width: ${width}px; height: ${height}px`" aria-hidden="true">
    <circle
      v-for="(pt, i) in points" :key="i"
      :cx="pt.x" :cy="pt.y"
      :r="i === points.length - 1 ? 2.4 : 1.5"
      :fill="i === points.length - 1 ? 'var(--bw-accent)' : 'currentColor'"
    />
  </svg>
</template>
