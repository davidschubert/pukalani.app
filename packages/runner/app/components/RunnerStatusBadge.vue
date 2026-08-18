<script setup lang="ts">
import type { RunStatus } from '../../shared/types/runner'

/**
 * Der Zustand eines Laufs als Pille — die EINE Stelle, an der ein Status zu
 * Farbe, Zeichen und Wort wird.
 *
 * Bewusst eine eigene Komponente: derselbe Status erscheint an vier Orten
 * (Läufe-Tabelle, Lauf-Bereich, Verlaufsliste, Bericht). Vier Kopien einer
 * Farbtabelle laufen auseinander, sobald ein Zustand dazukommt — `draft` war
 * genau so ein Zustand.
 */
const props = defineProps<{ status: RunStatus }>()

const { t } = useI18n()

const META: Record<RunStatus, { color: 'neutral' | 'info' | 'success' | 'warning' | 'error', icon: string }> = {
  draft: { color: 'neutral', icon: 'i-ph-pencil-simple' },
  queued: { color: 'neutral', icon: 'i-ph-hourglass' },
  claimed: { color: 'info', icon: 'i-ph-handshake' },
  running: { color: 'info', icon: 'i-ph-play-circle' },
  succeeded: { color: 'success', icon: 'i-ph-check-circle' },
  // WARNUNG, nicht Erfolg: eine Rückfrage ist ein Lauf, der etwas von einem
  // Menschen will (§ 4) — grün wäre hier eine Lüge.
  needs_input: { color: 'warning', icon: 'i-ph-question' },
  failed: { color: 'error', icon: 'i-ph-x-circle' },
  cancelled: { color: 'neutral', icon: 'i-ph-prohibit' },
}

const meta = computed(() => META[props.status])
</script>

<template>
  <UBadge :color="meta.color" :icon="meta.icon" variant="subtle" size="sm" :data-run-status="status">
    {{ t(`runner.status.${status}`) }}
  </UBadge>
</template>
