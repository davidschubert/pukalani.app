<script setup lang="ts">
/**
 * Der ehrliche Satz über dem Register-Formular (U2 / Audit-Befund K1;
 * zugesagt in DECISION-LOG 2026-07-27 Punkt 4 und bis heute nicht gebaut).
 *
 * DAS PROBLEM, DAS ER LÖST: der Trichter verspricht Sofortigkeit, führt durch
 * eine vollständige Kontoanlage mit starkem Passwort — und teilt dem Neukunden
 * ERST DANACH mit, dass er ohne Einladungs-Code keine eigene Community
 * bekommt. Der Wizard selbst macht es eine Ebene tiefer längst richtig („der
 * Code wird HIER geprüft, nicht am Ende"); dieser Block wendet dieselbe Regel
 * eine Ebene höher an.
 *
 * ZWEI GRÜNDE, NICHTS ZU ZEIGEN:
 *  1. MANDANTEN-HOST. Die Register-Seite gehört dem Core und wird von jeder
 *     App geerbt — auf `kunde-a.pukalani.app` heißt „registrieren" aber
 *     „dieser Community beitreten". Ein Satz übers Gründen wäre dort schlicht
 *     falsch (N7-Muster: Betreiber-Inhalt gehört nicht auf Kunden-Hosts).
 *  2. OFFENES TOR. Dann stimmt der Satz nicht mehr, und der Schalter im
 *     Betreiber-Dashboard soll wirken, ohne dass jemand Text nachzieht.
 *
 * Beides steht schon fest, wenn diese Komponente rendert: der Tor-Zustand
 * kommt aus dem SSR-Payload (plugins/onboarding-gate.server.ts), und der füllt
 * ihn auf einem Mandanten-Host gar nicht erst — der Startwert dort ist der
 * Fail-safe „Einladung nötig", weshalb der Host-Test hier trotzdem
 * ausdrücklich stehen muss. `useIsTenantHost` rechnet aus derselben Quelle wie
 * die Server-Middleware; SSR und Client kommen zwangsläufig zum selben
 * Ergebnis, es gibt also keinen Hydration-Bruch.
 */
const { t } = useI18n()
const localePath = useLocalePath()

const isTenantHost = useIsTenantHost()
const gate = useOnboardingGate()

const show = computed(() => !isTenantHost && gate.value.inviteRequired)
</script>

<template>
  <!--
    LINK ÜBER DEN ROUTEN-NAMEN, nicht den Pfad: die Zielseite trägt
    defineI18nRoute-Sprachpfade (de /anfragen, en /request-access), und
    localePath('/anfragen') gibt auf EN wörtlich „/anfragen" zurück — eine 404
    (nachgemessen am 2026-08-11, s. Commit dcfb991b).
  -->
  <UAlert
    v-if="show"
    icon="i-ph-info"
    color="neutral"
    variant="subtle"
    :title="t('onboarding.foundingNotice.title')"
    data-founding-notice
  >
    <template #description>
      <p>{{ t('onboarding.foundingNotice.text') }}</p>
      <NuxtLink :to="localePath({ name: 'anfragen' })" class="mt-1 inline-block font-medium underline">
        {{ t('onboarding.foundingNotice.link') }}
      </NuxtLink>
    </template>
  </UAlert>
</template>
