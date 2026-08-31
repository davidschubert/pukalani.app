<script setup lang="ts">
/**
 * DER VOLLBILD-WORKSPACE (Plan §3e „Routen & Layout", ENTSCHIEDEN).
 *
 * Er ist bewusst DÜNN: die drei Zonen, ihre Nähte und das Responsive-Verhalten
 * leben in `BwWorkspace` (abgenommener Klickdummy) — hier steht nur, was ein
 * LAYOUT beitragen muss und eine Komponente nicht kann: die Seite füllt den
 * Bildschirm (`100dvh`, nicht `100vh` — die mobile Adressleiste), der äussere
 * Rahmen scrollt NIE (§3e: „Bühne und Chat scrollen, der äussere Workspace
 * nie"), und die Sicherheitsabstände des Geräts (`env(safe-area-inset-*)`)
 * werden respektiert.
 *
 * KEINE Dashboard-Sidebar, und das ist die Begründung aus dem Plan: sie würde
 * mit Fortschritt, Bühne und George VIER konkurrierende Spalten bilden.
 *
 * Im `.playground` gibt es kein `NuxtLayout` (app.vue rendert nur `NuxtPage`),
 * dieses Layout ist dort also folgenlos — die Seite bringt ihren Rahmen über
 * `BwWorkspace` selbst mit.
 */
</script>

<template>
  <div class="bw-workspace-layout">
    <slot />
  </div>
</template>

<style scoped>
.bw-workspace-layout {
  height: 100dvh;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  flex-direction: column;
}

.bw-workspace-layout > :deep(*) {
  min-height: 0;
  flex: 1 1 auto;
}
</style>
