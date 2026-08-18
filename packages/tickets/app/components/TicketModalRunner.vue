<script setup lang="ts">
import type { TicketRow } from '../../shared/types/ticket'

/**
 * Platzhalter für den Ausführen-Bereich im Ticket-Modal — dasselbe Muster wie
 * `TicketModalComments.vue`: der tickets-Layer kennt den runner-Layer NICHT
 * (A14), die APP überschreibt diese Komponente und rendert dort
 * `RunnerRunPanel` mit dem Auftragstext, den sie aus DIESEM Ticket baut.
 *
 * OHNE OVERRIDE RENDERT ER NICHTS, und das ist der Unterschied zum
 * Kommentar-Platzhalter: dort steht ein Hinweis, weil eine leere Überschrift
 * „Kommentare & Aktivität" nach einem Fehler aussieht. Hier gibt es gar keine
 * Überschrift — eine Silo-App ohne runner-Layer (heute `apps/comments`) soll
 * von einem Betreiber-Werkzeug nicht einmal erfahren, dass es existiert.
 *
 * Das `ticket`-Prop steht bewusst schon hier: es ist der Vertrag, den die
 * überschreibende Komponente erfüllt. Ohne ihn müsste die App beim Einbinden
 * raten, was sie bekommt.
 */
defineProps<{ ticket: TicketRow }>()
</script>

<template>
  <!-- Bewusst leer — siehe Kopf. -->
  <span v-if="false" />
</template>
