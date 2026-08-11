<script setup lang="ts">
/**
 * Eintritt in den Setup-Flow (SAAS-ROADMAP #1).
 *
 * Schritt 0 ist das Early-Access-Tor: der Einladungs-Code wird HIER geprüft,
 * nicht am Ende. Sieben Schritte auszufüllen und dann abgewiesen zu werden
 * wäre die schlechteste mögliche erste Erfahrung mit dem Produkt.
 *
 * Die Prüfung ist nicht verbrauchend (POST /api/onboarding/precheck) — der
 * Code wird erst beim Anlegen der Community eingelöst.
 *
 * SEIT U2 IST DIESER SCHRITT BEDINGT (Davids Entscheidung 1 vom 2026-08-10):
 * der Betreiber kann das Tor im Dashboard abschalten, und dann gibt es hier
 * nichts zu tun. Die WAHRHEIT bleibt der Server (site.post.ts im Control
 * Plane) — diese Seite liest denselben Zustand nur, um niemanden vor ein Feld
 * zu stellen, das keine Wirkung mehr hat.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const draft = useOnboardingDraft()
const { trackFunnel } = useFunnelEvent()

/**
 * Der Zustand kommt aus dem SSR-Payload, nicht aus einem Client-Zweig: bei
 * offenem Tor ist die Weiterleitung schon die Server-Antwort, es blitzt also
 * keine Code-Wand auf. Fehlt die Auskunft, gilt die Einladungs-Variante.
 */
const gate = useOnboardingGate()

if (!gate.value.inviteRequired) {
  // `replace`: die übersprungene Wand darf nicht im Verlauf liegen — der
  // Zurück-Knopf aus Schritt 1 gehört auf die Seite DAVOR, nicht in ein Tor,
  // das sofort wieder weiterleitet.
  await navigateTo(localePath('/start/community'), { replace: true })
}

/**
 * Der Code kann aus DREI Quellen kommen, in dieser Reihenfolge:
 *  1. `?code=` — der Direktlink aus der Einladungs-Mail. Er hat Vorrang, weil
 *     er der frischeste ist (eine Erinnerung ERSETZT den alten Code).
 *  2. der gespeicherte Entwurf — wer den Wizard verlassen hat, tippt nicht neu.
 *  3. leer — dann tippt der Eingeladene ihn ab.
 */
const route = useRoute()
const codeFromLink = typeof route.query.code === 'string' ? route.query.code.trim() : ''
const code = ref(codeFromLink || draft.value.inviteCode || '')
const checking = ref(false)
const rejected = ref(false)
/**
 * Der Code ist GÜLTIG und gehört dieser Adresse — sie ist nur noch nicht
 * bestätigt (Sicherheits-Audit 2026-08-02: ein an eine Adresse gebundener Code
 * verlangt jetzt den Nachweis, dass sie einem gehört). Eigener Zustand statt
 * `rejected`, weil hier nichts falsch ist: es fehlt ein Klick im Postfach.
 */
const needsVerification = ref(false)

// Kam der Code per Link, muss niemand auf „Weiter" drücken — das ist der
// „direkt loslegen"-Teil, den die Mail verspricht.
onMounted(() => {
  // Steht das Tor offen, ist diese Seite auf dem Weg nach draußen (die
  // Weiterleitung oben läuft) — dann gibt es weder etwas zu prüfen noch einen
  // Trichter-Punkt zu zählen: `funnel_gate_no_code` misst eine WAND, und die
  // steht gerade nicht (U18/U2).
  if (!gate.value.inviteRequired) return

  if (codeFromLink) {
    void submit()
    return
  }
  /**
   * Trichter-Punkt „vor der Wand" (U18): hier steht, wer sich registriert hat
   * und KEINEN Code mitbringt. Gezählt wird das ANKOMMEN, nicht ein
   * Fehlversuch — der Verlust passiert genau in dem Moment, in dem die Wand
   * das erste Mal zu sehen ist. Ein bereits GESPEICHERTER Entwurfs-Code zählt
   * dabei nicht als „mit Code": er ist ungeprüft und stammt aus einem früheren
   * Anlauf, der genauso an dieser Wand endete.
   */
  trackFunnel('funnel_gate_no_code')
})

async function submit() {
  if (!code.value.trim() || checking.value) return
  checking.value = true
  rejected.value = false
  needsVerification.value = false
  try {
    const result = await $fetch<{ codeValid?: boolean, codeReason?: 'email_unverified' }>('/api/onboarding/precheck', {
      method: 'POST',
      body: { code: code.value.trim() },
    })
    if (!result.codeValid) {
      // Der EINE Grund, den die Vorprüfung nennen darf (s. control/api/
      // onboarding/precheck.post.ts) — alles andere bleibt ein stummes Nein.
      if (result.codeReason === 'email_unverified') needsVerification.value = true
      else rejected.value = true
      return
    }
    draft.value.inviteCode = code.value.trim()
    // Trichter-Punkt „Tor offen" (U18) — der Code ist geprüft, aber noch nicht
    // eingelöst; verbraucht wird er erst beim Anlegen.
    trackFunnel('funnel_code_redeemed')
    await navigateTo(localePath('/start/community'))
  }
  catch {
    rejected.value = true
  }
  finally {
    checking.value = false
  }
}

useHead({ title: () => t('onboarding.gate.title') })
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
        {{ t('onboarding.gate.heading', { name: auth.user?.name || t('onboarding.gate.fallbackName') }) }}
      </h1>
      <p class="text-muted">{{ t('onboarding.gate.intro') }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <UFormField :label="t('onboarding.gate.codeLabel')" :description="t('onboarding.gate.codeHint')">
        <UInput
          v-model="code"
          :placeholder="t('onboarding.gate.codePlaceholder')"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          size="lg"
          class="w-full font-mono"
          :aria-invalid="rejected"
          aria-describedby="code-error"
        />
      </UFormField>

      <p v-if="rejected" id="code-error" class="flex items-start gap-2 text-sm text-error">
        <UIcon name="i-ph-warning-circle" class="mt-0.5 size-4 shrink-0" />
        {{ t('onboarding.gate.rejected') }}
      </p>

      <AuthEmailVerifyRequired v-if="needsVerification" :title="t('onboarding.gate.verifyFirst')" />

      <UButton type="submit" size="lg" :loading="checking" :disabled="!code.trim()" block>
        {{ t('onboarding.gate.submit') }}
      </UButton>
    </form>

    <!--
      DER RÜCKWEG (U1, 2026-08-10). Der Satz stand hier als reiner Text: keine
      Adresse, kein Knopf, kein Link — wer keinen Code hatte, saß in einer
      Seite fest, aus der nichts herausführte. Der Link ist exakt das
      Spiegelbild von `anfragen.vue` („Du hast schon einen Code? Hier
      einlösen"), damit die beiden Seiten aufeinander zeigen statt aneinander
      vorbei.

      ÜBER DEN ROUTEN-NAMEN, nicht den Pfad: die Zielseite trägt
      defineI18nRoute-Sprachpfade (de /anfragen, en /request-access), und
      localePath('/anfragen') gibt auf EN wörtlich „/anfragen" zurück — eine
      404 (am 2026-08-11 im Worktree nachgemessen, beide Locales).
    -->
    <p class="text-sm text-dimmed">
      {{ t('onboarding.gate.noCode') }}
      <NuxtLink :to="localePath({ name: 'anfragen' })" class="font-medium underline">{{ t('onboarding.gate.noCodeLink') }}</NuxtLink>
    </p>
  </div>
</template>
