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
 * ── WARUM DER @name EIN SLOT IST ──────────────────────────────────────────
 * Ein @name gilt PRO COMMUNITY (Tabelle `community_handles`, eindeutig je
 * `(communityId, handleLower)`) — es gibt keinen konto-weiten. Auf einem
 * Kontroll-Host gibt es aber gar keine Community, und `/api/handles/me` steht
 * dort bewusst nicht in `pukalani.tenancy.controlApiPrefixes`: die Route würde
 * ohne Mandanten-Kontext antworten müssen, und der Präfix nähme `/api/handles/
 * search` gleich mit — eine ungescopte Namensliste über den ganzen Pool.
 *
 * Ohne Slot stünde dort ein Eingabefeld, das jede Eingabe mit 404 quittiert.
 * Der Standard-Inhalt bleibt deshalb das echte Formular (Dashboard, Mandanten-
 * Host); wer die Fläche ohne Community rendert, ERSETZT den Slot durch seine
 * eigene Erklärung. Ein Slot und kein Prop, weil der Ersatztext dann dem Layer
 * gehört, der ihn erklären kann — der Core weiß nichts von `/communities`.
 */
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <UPageCard :title="t('account.profile.title')" :description="t('account.profile.description')" variant="subtle">
      <UserProfileForm />
    </UPageCard>

    <!-- Der @name steht neben dem Profil, weil er dasselbe beantwortet: „wie
         trete ich hier auf". Eigene Karte, weil er anders als Name und Bio
         PRO COMMUNITY gilt und nur alle 30 Tage änderbar ist. -->
    <UPageCard variant="subtle">
      <slot name="handle">
        <UserHandleForm />
      </slot>
    </UPageCard>
  </div>
</template>
