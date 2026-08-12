<script setup lang="ts">
/**
 * Early Access anfragen — die einzige öffentliche Seite des Trichters.
 *
 * Liegt auf dem Kundenbereich-Host (nicht auf der Landingpage), damit das
 * Formular ohne Cross-Origin auskommt: die Marketing-Seite verlinkt hierher.
 *
 * Nach dem Absenden bleibt die Seite bewusst auf einer ruhigen Danke-Ansicht
 * stehen — kein Redirect. Wer gerade seine Adresse hinterlassen hat, will
 * sehen, dass es angekommen ist.
 */
/**
 * DIE ADRESSE IST IN BEIDEN SPRACHEN ENGLISCH (U8, Trichter-Befund M5,
 * 2026-08-11 — die Sprachregel für Pfade).
 *
 * Regel: die öffentliche MARKETING-Seite lokalisiert ihre Pfade (`/produkte` ↔
 * `/products`, `/wechseln` ↔ `/switch`), der KUNDENBEREICH nicht. Er ist
 * Werkzeug-Oberfläche — kurz, stabil, und ein `defineI18nRoute` an jeder Seite
 * wäre dauerhafte Pflegelast. Vorher tat er es genau EINMAL, hier: ein
 * deutscher Nutzer sah `/de/communities` und `/de/anfragen` nebeneinander.
 *
 * DER AUFRUF BLEIBT, WEIL DER ROUTEN-NAME BLEIBT: die Datei heißt weiter
 * `anfragen.vue`, also heißt die Route weiter `anfragen`, und jeder interne
 * Verweis läuft seit AP1 über `localePath({ name: 'anfragen' })` statt über
 * einen Pfad-String (OnboardingFoundingNotice, start/index.vue). Genau dafür
 * gibt es die Namensregel — ein Pfad-Literal hätte hier heute gebrochen.
 * Alt-Adresse `/de/anfragen`: 301 in packages/onboarding/nuxt.config.ts.
 */
definePageMeta({ layout: 'onboarding' })
defineI18nRoute({ paths: { de: '/request-access', en: '/request-access' } })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { trackFunnel } = useFunnelEvent()

const email = ref('')
const note = ref('')
/** Honeypot: für Menschen unsichtbar, für Bots verlockend. */
const website = ref('')
const sending = ref(false)
const sent = ref(false)
const failed = ref(false)

async function submit() {
  if (!email.value.trim() || sending.value) return
  sending.value = true
  failed.value = false
  try {
    await $fetch('/api/onboarding/request', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        note: note.value.trim(),
        locale: locale.value,
        ...(website.value ? { website: website.value } : {}),
      },
    })
    sent.value = true
    // Trichter-Punkt „Zugang angefragt" (U18): der zweite Ausgang neben dem
    // Code — er zählt nur, wenn der Server die Anfrage angenommen hat.
    trackFunnel('funnel_request_submitted')
  }
  catch {
    failed.value = true
  }
  finally {
    sending.value = false
  }
}

useHead({ title: () => t('onboarding.request.title') })
</script>

<template>
  <div class="space-y-8">
    <template v-if="sent">
      <div class="space-y-3">
        <span class="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UIcon name="i-ph-paper-plane-tilt" class="size-6" />
        </span>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t('onboarding.request.doneTitle') }}</h1>
        <p class="text-muted">{{ t('onboarding.request.doneBody') }}</p>
      </div>
      <p class="text-sm text-dimmed">{{ t('onboarding.request.doneHint') }}</p>
    </template>

    <template v-else>
      <div class="space-y-3">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t('onboarding.request.title') }}</h1>
        <p class="text-muted">{{ t('onboarding.request.intro') }}</p>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <UFormField :label="t('onboarding.request.emailLabel')" :description="t('onboarding.request.emailHint')">
          <UInput v-model="email" type="email" required autocomplete="email" size="lg" class="w-full" autofocus />
        </UFormField>

        <UFormField :label="t('onboarding.request.noteLabel')" :description="t('onboarding.request.noteHint')">
          <UTextarea v-model="note" :rows="4" :maxlength="500" class="w-full" :placeholder="t('onboarding.request.notePlaceholder')" />
        </UFormField>

        <!-- Honeypot: aus dem Layout genommen und für Screenreader versteckt -->
        <div class="hidden" aria-hidden="true">
          <label>
            Website
            <input v-model="website" type="text" tabindex="-1" autocomplete="off">
          </label>
        </div>

        <p v-if="failed" class="flex items-start gap-2 text-sm text-error">
          <UIcon name="i-ph-warning-circle" class="mt-0.5 size-4 shrink-0" />
          {{ t('onboarding.request.failed') }}
        </p>

        <UButton type="submit" size="lg" :loading="sending" :disabled="!email.trim()" block>
          {{ t('onboarding.request.submit') }}
        </UButton>

        <p class="text-xs text-dimmed">{{ t('onboarding.request.privacy') }}</p>
      </form>

      <p class="text-sm text-dimmed">
        {{ t('onboarding.request.hasCode') }}
        <NuxtLink :to="localePath('/start')" class="font-medium underline">{{ t('onboarding.request.hasCodeLink') }}</NuxtLink>
      </p>
    </template>
  </div>
</template>
