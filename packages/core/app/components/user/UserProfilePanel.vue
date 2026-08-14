<script setup lang="ts">
/**
 * DIE EINE PROFIL-FLÄCHE — Bild, Name, Bio, @name (AH-2, 2026-08-11).
 *
 * WARUM ES SIE GIBT: dieselbe Fläche steht ab jetzt an ZWEI Orten — im
 * Konto-Reiter des Community-Dashboards (`/dashboard/settings`) und auf der
 * Pukalani-ID des Kundenbereichs (`/profile` auf account.pukalani.app). Davids
 * Vorgabe dazu war eindeutig: EINE Implementierung. Zwei Kopien liefen
 * garantiert auseinander, und zwar an der unauffälligsten Stelle — ein neues
 * Feld im Formular, das nur an einem der beiden Orte auftaucht.
 *
 * Die BAUSTEINE (UserProfileForm, UserHandleForm) gab es schon; was hier
 * entsteht, ist ihre ANORDNUNG: zwei Karten, in dieser Reihenfolge, mit diesen
 * Überschriften. Genau die war bisher im Seiten-Markup von
 * packages/admin/app/pages/dashboard/settings/index.vue eingebacken.
 *
 * ── DER @name IST SEIT AH-7 ÜBERALL DASSELBE FORMULAR ─────────────────────
 * Bis zum 2026-08-11 galt ein @name PRO COMMUNITY, und auf einem Kontroll-Host
 * gab es keine — dort stand deshalb ein Ersatztext im Slot `handle` statt eines
 * Eingabefelds, das jede Eingabe mit 404 quittiert hätte.
 *
 * Mit AH-7 (Davids Entscheidung: eine Pukalani-ID, EIN Handle, überall) ist
 * dieser Unterschied ersatzlos weg: `account_handles` ist global, die Route
 * `/api/account/handle` steht in `pukalani.tenancy.controlApiPrefixes` und
 * antwortet auf jedem Host. Der Slot BLEIBT trotzdem — als Öffnung, nicht als
 * Notlösung: eine App, die den @namen gar nicht anbieten will (oder ihn anders
 * erklären muss), ersetzt ihn, ohne dass diese Anordnung sich ändert. Der
 * Standard-Inhalt ist jetzt an BEIDEN Orten das echte Formular.
 */
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <UPageCard :title="t('account.profile.title')" :description="t('account.profile.description')" variant="subtle">
      <UserProfileForm />
    </UPageCard>

    <!-- Der @name steht neben dem Profil, weil er dasselbe beantwortet: „wie
         trete ich auf". Eigene Karte, weil er anders als Name und Bio
         eindeutig sein muss und nur alle 30 Tage änderbar ist. -->
    <UPageCard variant="subtle">
      <slot name="handle">
        <UserHandleForm />
      </slot>
    </UPageCard>

    <!-- Die Zeitzone steht hier, weil sie dieselbe Frage beantwortet wie Name
         und Bio: „wie sieht mein Konto mich". Sie ist reine Anzeige und
         gehört deshalb NICHT zu den Benachrichtigungen (U15 Teil 5). -->
    <UPageCard :title="t('account.timezone.title')" :description="t('account.timezone.description')" variant="subtle">
      <UserTimezoneSettings />
    </UPageCard>
  </div>
</template>
