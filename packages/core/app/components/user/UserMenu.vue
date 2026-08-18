<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const { logout } = useLogout()
const canSiteDashboard = useCommunityCapability('dashboard.access')

/**
 * Die Rolle steht unter dem Namen (Davids Vorgabe 2026-08-17, Screenshot 2) —
 * dieselbe Zeile wie im Dashboard-Konto-Menü, damit beide Orte dasselbe sagen.
 * Ohne nennbare Rolle bleibt sie weg statt etwas zu behaupten.
 */
const roleLabel = useRoleLabel()

const items = computed<DropdownMenuItem[]>(() => [
  {
    label: auth.user?.name || t('ui.account'),
    avatar: { alt: auth.user?.name || t('ui.account') },
    ...(roleLabel.value ? { description: roleLabel.value } : {}),
    type: 'label',
  },
  { type: 'separator' },
  // Dashboard-Link für jeden mit dashboard.access — per Operator-Label (admin +
  // moderator) ODER Site-Rolle dieses Mandanten (N1);
  // die Route liefert der admin-Layer — Apps ohne ihn haben keine solchen User.
  ...(userHasCapability(auth.user, 'dashboard.access') || canSiteDashboard.value
    ? [{ label: t('ui.adminArea'), icon: 'i-ph-gauge', to: localePath('/dashboard') } satisfies DropdownMenuItem]
    : []),
  {
    label: t('auth.logout'),
    icon: 'i-ph-sign-out',
    onSelect: () => { void logout() },
  },
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton color="neutral" variant="ghost" class="rounded-full p-1" :aria-label="t('ui.userMenu')">
      <UserAvatar size="sm" />
    </UButton>
  </UDropdownMenu>
</template>
