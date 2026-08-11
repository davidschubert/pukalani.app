<script setup lang="ts">
/**
 * „Deine Daten" — Export und Konto-Löschung an EINER Stelle (Audit-Befund M10,
 * umgesetzt mit AH-2 am 2026-08-11).
 *
 * WAS SICH GEÄNDERT HAT: beide Karten standen unter „Sicherheit", zusammen mit
 * der Passwort-Änderung. Das ist die falsche Schublade — ein Datenexport ist
 * keine Sicherheits-Einstellung, und die Löschung des Kontos schon gar nicht:
 * wer sein Passwort ändern will, soll die endgültige Löschen-Karte nicht als
 * Nachbarn haben, und wer seine Daten sucht, sucht sie nicht unter „Sicherheit".
 * Seither: „Sicherheit" = nur noch das Passwort, „Daten" = diese Fläche.
 *
 * KEIN WRAPPER-ELEMENT (Fragment mit zwei Wurzeln), und das ist Absicht: die
 * Abstände zwischen den Karten kommen aus der Hülle (`flex flex-col gap-…`),
 * an beiden Orten. Ein `<div class="space-y-4">` hier würde die Karten in der
 * Dashboard-Hülle enger stellen als vorher — die Fläche soll umziehen, nicht
 * anders aussehen.
 */
</script>

<template>
  <AuthAccountDataExport />
  <AuthAccountDeleteCard />
</template>
