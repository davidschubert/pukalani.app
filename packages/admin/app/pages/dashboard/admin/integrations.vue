<script setup lang="ts">
import type { IntegrationId, IntegrationsResponse } from '../../../../shared/types/integrations'

/**
 * INTEGRATIONEN — die Zugänge dieser Instanz zu fremden Diensten
 * (Davids Entscheidung 2026-08-18).
 *
 * ── WARUM NICHT „APIs" ────────────────────────────────────────────────────
 * Hier liegen keine Schnittstellen, sondern ZUGÄNGE zu ihnen. „Integrationen"
 * trägt ausserdem, was zum Schlüssel gehört (Modell, Absender, Endpoint) —
 * und Pfad wie Beschriftung stimmen in beiden Sprachen überein, wie es die
 * Regel aus dem Kategorien-Kopf verlangt (U8/G4: der Pfad benennt, was im
 * Menü steht).
 *
 * ── EIN FELD ZEIGT EINEN ZUSTAND, KEINEN WERT ─────────────────────────────
 * Der Server gibt nie einen Schlüssel heraus (er läge sonst im
 * __NUXT__-Payload dieser Seite). Sichtbar ist die HERKUNFT: hier hinterlegt ·
 * aus der Server-Umgebung · keiner. Ein leeres Eingabefeld heisst „nicht
 * angefasst"; Entfernen ist ein eigener Knopf, weil es eine eigene Absicht ist.
 *
 * ── DIE UNBEWEGLICHEN STEHEN MIT DA ───────────────────────────────────────
 * Appwrite-Key, Umschlag, Control-Plane, Redis: die KÖNNEN nicht hierher, man
 * braucht sie, um an die verschlüsselte Zeile zu kommen. Sie werden trotzdem
 * genannt — eine Übersicht, die „alle Zugänge" verspricht und die Hälfte
 * verschweigt, schickt beim nächsten Suchen in die Irre.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], requiredCapability: 'system.manage' })

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
useBrandTitle(() => t('admin.integrations.title'))

const { data, refresh } = await useFetch<IntegrationsResponse>('/api/admin/integrations')

/** Je Dienst ein eigenes Eingabefeld — sie werden auch einzeln gespeichert. */
const inputs = reactive<Record<string, string>>({})
const busy = ref<IntegrationId | ''>('')

async function save(id: IntegrationId) {
  const value = (inputs[id] ?? '').trim()
  if (!value || busy.value) return
  busy.value = id
  try {
    await $fetch('/api/admin/integrations', { method: 'PATCH', body: { id, value } })
    inputs[id] = ''
    await refresh()
    toast.add({ title: t('admin.integrations.saved'), color: 'success' })
  }
  catch {
    toast.add({ title: t('admin.integrations.saveFailed'), description: t('admin.integrations.saveFailedHint'), color: 'error' })
  }
  finally {
    busy.value = ''
  }
}

async function clear(id: IntegrationId) {
  const ok = await confirm({
    title: t('admin.integrations.clearTitle'),
    description: t('admin.integrations.clearText', { env: envName(id) }),
    confirmLabel: t('admin.integrations.clear'),
    action: () => $fetch('/api/admin/integrations', { method: 'PATCH', body: { id, value: '' } }),
  })
  if (!ok) return
  inputs[id] = ''
  await refresh()
}

const envName = (id: IntegrationId) => data.value?.items.find(i => i.id === id)?.envName ?? ''
const badgeColor = (source: string) => (source === 'none' ? 'warning' : 'success')
</script>

<template>
  <UDashboardPanel id="admin-integrations">
    <template #header>
      <UDashboardNavbar :title="t('admin.integrations.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-2xl space-y-4">
        <p class="text-sm text-muted">{{ t('admin.integrations.description') }}</p>

        <UAlert
          v-if="data && !data.editable"
          color="neutral"
          variant="subtle"
          icon="i-ph-info"
          :description="t('admin.integrations.notEditable')"
        />

        <CoreEmptyState
          v-if="data && data.items.length === 0"
          icon="i-ph-plugs"
          :title="t('admin.integrations.emptyTitle')"
          :description="t('admin.integrations.emptyText')"
        />

        <UCard v-for="item in data?.items ?? []" :key="item.id" :data-integration="item.id">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold">{{ t(`admin.integrations.service.${item.id}`) }}</h3>
                <UBadge :color="badgeColor(item.source)" variant="subtle" size="sm">
                  {{ t(`admin.integrations.source.${item.source}`) }}
                </UBadge>
              </div>
              <p class="mt-1 text-sm text-muted">{{ t(`admin.integrations.serviceDesc.${item.id}`) }}</p>
            </div>
          </div>

          <template v-if="data?.editable">
            <UInput
              v-model="inputs[item.id]"
              type="password"
              autocomplete="off"
              class="mt-3 w-full"
              :placeholder="t('admin.integrations.placeholder')"
              :data-integration-input="item.id"
            />
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <UButton
                size="xs"
                :loading="busy === item.id"
                :disabled="!(inputs[item.id] ?? '').trim()"
                :data-integration-save="item.id"
                @click="save(item.id)"
              >
                {{ t('admin.integrations.save') }}
              </UButton>
              <UButton
                v-if="item.source === 'settings'"
                size="xs"
                color="error"
                variant="ghost"
                icon="i-ph-trash"
                :data-integration-clear="item.id"
                @click="clear(item.id)"
              >
                {{ t('admin.integrations.clear') }}
              </UButton>
              <span class="text-xs text-dimmed">{{ t('admin.integrations.envHint', { env: item.envName }) }}</span>
            </div>
          </template>
        </UCard>

        <!-- Die Unbeweglichen: genannt, damit niemand sie hier sucht. -->
        <UCard v-if="data?.bootstrap?.length">
          <h3 class="font-semibold">{{ t('admin.integrations.bootstrapTitle') }}</h3>
          <p class="mt-1 text-sm text-muted">{{ t('admin.integrations.bootstrapText') }}</p>
          <ul class="mt-3 space-y-1">
            <li v-for="name in data.bootstrap" :key="name" class="font-mono text-xs text-dimmed">{{ name }}</li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
