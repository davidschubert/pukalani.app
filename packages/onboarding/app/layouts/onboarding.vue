<script setup lang="ts">
/**
 * Layout des Setup-Flows: eine Bühne, keine Navigation.
 *
 * Bewusst KEINE Community-Nav und kein Zurück-Link wie im auth-Layout — wer
 * hier ist, hat genau eine Aufgabe.
 *
 * WAS ES SEIT U1 (2026-08-10) TROTZDEM GIBT: ein Konto-Menü. Der alte
 * Kommentar hier versprach den Ausgang „Konto-Menü, sobald es mehrere
 * Communities gibt" — bis dahin stand oben rechts nur die E-Mail-Adresse als
 * TOTER TEXT. Wer sich mit dem falschen Konto angemeldet hatte oder ohne
 * Einladungs-Code vor der Code-Wand stand, konnte sich aus dieser Bühne weder
 * abmelden noch irgendwohin klicken. Der Ausgang gehört nicht an eine
 * Bedingung, sondern an jede Seite, die eine Anmeldung voraussetzt.
 *
 * Der Menü-Auslöser trägt die ADRESSE (nicht den Namen): sie beantwortet die
 * Frage, die man an dieser Stelle stellt — „bin ich hier mit dem richtigen
 * Konto?".
 */
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const auth = useAuthStore()
const { logout } = useLogout()

/**
 * „Meine Communities" steht nur da, wenn es welche gibt — und das weiß dieses
 * Layout nicht. Es bleibt deshalb bei den zwei Einträgen, die IMMER stimmen:
 * die Adresse als Beschriftung und der Weg hinaus. (`/communities` würde einen
 * Nutzer ohne Community sofort wieder hierher werfen, communities.vue:52-56 —
 * das wäre ein Ausgang, der im Kreis führt.)
 */
const items = computed<DropdownMenuItem[]>(() => [
  { label: auth.user?.email ?? '', type: 'label' },
  { type: 'separator' },
  {
    label: t('auth.logout'),
    icon: 'i-ph-sign-out',
    onSelect: () => { void logout() },
  },
])
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="flex items-center justify-between px-4 py-3 sm:px-6">
      <span class="flex items-center gap-2 font-semibold tracking-tight">
        <span class="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <UIcon name="i-ph-sun-horizon" class="size-4" />
        </span>
        Pukalani
      </span>
      <UDropdownMenu v-if="auth.user" :items="items">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-ph-caret-down"
          class="max-w-[14rem]"
          :aria-label="t('onboarding.layout.accountMenu')"
          :title="auth.user.email"
        >
          <span class="truncate">{{ auth.user.email }}</span>
        </UButton>
      </UDropdownMenu>
    </header>

    <main class="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <slot />
    </main>

    <p class="pb-8 text-center text-xs text-dimmed">
      {{ t('onboarding.layout.footer') }}
    </p>
  </div>
</template>
