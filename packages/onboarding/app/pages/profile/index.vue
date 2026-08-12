<script setup lang="ts">
/**
 * `/profile` — die PUKALANI-ID (AH-2, Davids URL-Liste vom 2026-08-11).
 *
 * Bild, Name, Bio, @name: das Konto, mit dem jemand überall auftritt,
 * unabhängig von einer einzelnen Community. Die Fläche selbst ist
 * `UserProfilePanel` (core) — dieselbe Komponente, die im Community-Dashboard
 * unter `/dashboard/settings` steht. Davids Vorgabe war EINE Implementierung;
 * wer hier ein Feld ergänzt, ergänzt es dort mit.
 *
 * ── SEIT AH-7 STEHT HIER DAS ECHTE FORMULAR ──────────────────────────────
 * Bis zum 2026-08-11 war der @name an dieser Stelle nur eine AUSKUNFT samt
 * Weg ins Dashboard: er galt pro Community (`community_handles`), und auf
 * diesem Host gibt es keine. Mit Davids Entscheidung „eine Pukalani-ID, EIN
 * Handle, überall" (DECISION-LOG 2026-08-11, Punkt 11) ist der Name genau das
 * geworden, was diese Seite ohnehin verwaltet — eine Eigenschaft des Kontos.
 * Der Slot-Ersatztext ist damit ersatzlos entfallen; der Standard-Inhalt des
 * Panels IST das Formular.
 *
 * Seit AH-3 ist das ein KIND von `profile.vue` (Reiter-Hülle) — Überschrift
 * und Reiter stehen dort, hier nur noch der Inhalt.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()

useBrandTitle(() => t('onboarding.account.profile.title'))
</script>

<template>
  <UserProfilePanel />
</template>
