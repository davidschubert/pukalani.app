<script setup lang="ts">
/**
 * `/profile` — die PUKALANI-ID (AH-2, Davids URL-Liste vom 2026-08-11).
 *
 * Bild, Name, Bio: das Konto, mit dem jemand überall auftritt, unabhängig von
 * einer einzelnen Community. Die Fläche selbst ist `UserProfilePanel` (core) —
 * dieselbe Komponente, die im Community-Dashboard unter
 * `/dashboard/settings` steht. Davids Vorgabe war EINE Implementierung; wer
 * hier ein Feld ergänzt, ergänzt es dort mit.
 *
 * DER @name IST HIER EINE AUSKUNFT, KEIN FORMULAR. Er gilt pro Community
 * (`community_handles`, eindeutig je `(communityId, handleLower)`) — auf diesem
 * Host gibt es keine, und `/api/handles/me` steht bewusst nicht in
 * `pukalani.tenancy.controlApiPrefixes`. Ein Eingabefeld, das jede Eingabe mit
 * 404 quittiert, wäre eine Attrappe; stattdessen steht hier der Satz, der
 * stimmt, samt Weg dorthin, wo der Name wirklich gesetzt wird. Ein konto-weiter
 * @name wäre eine Datenmodell-Entscheidung (eine zweite Tabelle und eine
 * Regel, was bei Kollisionen mit bestehenden Community-Namen passiert) — die
 * gehört David, nicht dieser Seite.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()

useBrandTitle(() => t('onboarding.account.profile.title'))
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
        {{ t('onboarding.account.profile.heading') }}
      </h1>
      <p class="text-muted">{{ t('onboarding.account.profile.intro') }}</p>
    </div>

    <UserProfilePanel>
      <template #handle>
        <div class="space-y-3" data-account-handle-note>
          <div>
            <p class="text-sm font-medium text-highlighted">{{ t('account.handle.title') }}</p>
            <p class="text-sm text-muted">{{ t('onboarding.account.profile.handleNote') }}</p>
          </div>
          <UButton
            :to="localePath('/communities')"
            size="sm"
            color="neutral"
            variant="subtle"
            icon="i-ph-users-three"
          >
            {{ t('onboarding.account.profile.handleAction') }}
          </UButton>
        </div>
      </template>
    </UserProfilePanel>
  </div>
</template>
