<script setup lang="ts">
// Zentriertes Layout ohne Navigation — für Login/Register
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <!--
    `pt-16` neben `p-8` ist KEIN Geschmack, sondern Platz für die festen
    Bedienelemente: der Zurück-Link (und im themes-Override zusätzlich das
    Anzeige-Menü) sitzt `fixed` bei `top-4` und ist 32 px hoch, reicht also bis
    48 px hinunter. Die 32 px aus `p-8` liegen darunter. Solange der Inhalt in
    den Bildschirm passt, fällt das nicht auf — ist er höher, läuft
    `justify-center` nach BEIDEN Seiten über, der Anfang steht an der oberen
    Polsterkante und damit UNTER den Bedienelementen. Genau so überlappte auf
    der Registrierung (Hinweisbox + Formular + Passwort-Prüfliste) der
    Markenname das Wort „Startseite" (2026-08-14 auf account.pukalani.app bei
    320 und 390 px gemessen). Die Anmeldung blieb heil, weil sie kurz genug für
    echte Zentrierung ist — beim Ansehen EINER Seite sieht man den Fehler daher
    nicht.
  -->
  <main class="relative flex min-h-screen flex-col items-center justify-center gap-5 p-8 pt-16">
    <UButton
      :to="localePath('/')"
      icon="i-ph-arrow-left"
      color="neutral"
      variant="ghost"
      class="fixed start-4 top-4 z-40"
      data-back-link
    >
      {{ t('ui.backToHome') }}
    </UButton>
    <AuthBrandHeader />
    <slot />
    <ConsentCookieBanner />
  </main>
</template>
