<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], requiredCapability: 'system.manage' })

interface AppConfig {
  registrationEnabled: boolean
  commentsEnabled: boolean
  maintenanceMode: boolean
  /** Core-KI-Gate (pukalani.ai) aktiv? → Model-Override-Feld einblenden */
  aiEnabled?: boolean
  /** Laufzeit-Override fürs KI-Modell (app_config.aiModel) — leer = Build-Default */
  aiModel?: string
  /** Build-Default (pukalani.ai.model) als Placeholder */
  aiDefaultModel?: string
  /** Woher der benutzte KI-Schlüssel stammt — der WERT kommt nie mit. */
  aiKeySource?: 'settings' | 'env' | 'none'
  /** Ist `NUXT_INSTANCE_SECRETS_KEY` gesetzt? Ohne ihn kein Eingabefeld. */
  aiKeyEditable?: boolean
  /** NUR SCHREIBEN: leer = entfernen, weggelassen = unverändert. */
  aiKey?: string
}

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

useBrandTitle(() => t('admin.config.title'))

const { data, refresh } = await useFetch<AppConfig>('/api/admin/config')

// Edit-Awareness: warnt, wenn ein anderer Admin dieses Formular ebenfalls offen hat.
const { editors } = useEditAwareness('config')

const state = reactive<AppConfig>({ registrationEnabled: true, commentsEnabled: true, maintenanceMode: false, aiModel: '' })
watchEffect(() => {
  if (data.value) Object.assign(state, data.value)
})

/**
 * Der Schlüssel steht NICHT im `state`: der wird aus der Server-Antwort
 * überschrieben, und die trägt (richtigerweise) nie einen Wert. Ein eigenes
 * Feld, das nur beim Speichern mitgeht — leer heisst „nicht angefasst",
 * nicht „löschen". Fürs Löschen gibt es den Knopf daneben, der die Absicht
 * ausspricht.
 */
const aiKeyInput = ref('')
const aiKeyState = computed(() => data.value?.aiKeySource ?? 'none')

/** Entfernen ist eine EIGENE Handlung, kein leeres Feld beim Speichern. */
async function clearAiKey() {
  const ok = await confirm({
    title: t('admin.config.aiKeyClearTitle'),
    description: t('admin.config.aiKeyClearText'),
    confirmLabel: t('admin.config.aiKeyClear'),
    action: () => $fetch('/api/admin/config', { method: 'PATCH', body: { ...state, aiKey: '' } }),
  })
  if (!ok) return
  aiKeyInput.value = ''
  await refresh()
}

const flags = computed(() => [
  { key: 'registrationEnabled' as const, icon: 'i-ph-user-plus' },
  { key: 'commentsEnabled' as const, icon: 'i-ph-chat-circle' },
  { key: 'maintenanceMode' as const, icon: 'i-ph-wrench', warning: true },
])

const loading = ref(false)
async function save() {
  loading.value = true
  try {
    // Nur die patchbaren Felder senden (aiEnabled/aiDefaultModel sind reine Anzeige)
    await $fetch('/api/admin/config', {
      method: 'PATCH',
      body: {
        registrationEnabled: state.registrationEnabled,
        commentsEnabled: state.commentsEnabled,
        maintenanceMode: state.maintenanceMode,
        aiModel: state.aiModel ?? '',
        // Nur wenn wirklich etwas eingetippt wurde: ein leeres Feld heisst
        // „nicht angefasst". Entfernen ist eine eigene Handlung (clearAiKey).
        ...(aiKeyInput.value.trim() ? { aiKey: aiKeyInput.value.trim() } : {}),
      },
    })
    aiKeyInput.value = ''
    await refresh()
    toast.add({ title: t('admin.config.saved'), color: 'success' })
  }
  catch {
    toast.add({
      title: t('admin.users.actionFailed'),
      description: t('admin.users.actionFailedDesc'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full lg:max-w-2xl">
    <UPageCard :title="t('admin.config.title')" :description="t('admin.config.description')" variant="subtle">
      <UAlert
        v-if="editors.length"
        color="warning"
        variant="subtle"
        icon="i-ph-users-three"
        class="mb-4"
        :title="t('admin.presence.alsoEditing', { names: editors.join(', ') })"
        :description="t('admin.presence.alsoEditingHint')"
      />
      <!-- BEWUSST KEINE UTable (B6): Schalter mit Erklärtext, kein Datensatz —
           dieselbe Bauweise wie die Produkt-Seite nebenan. -->
      <div class="divide-y divide-default">
        <div v-for="flag in flags" :key="flag.key" class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div class="flex items-start gap-3">
            <UIcon :name="flag.icon" class="mt-0.5 size-5 shrink-0" :class="flag.warning ? 'text-warning' : 'text-muted'" />
            <div>
              <p class="text-sm font-medium">{{ t(`admin.config.${flag.key}`) }}</p>
              <p class="text-sm text-muted">{{ t(`admin.config.${flag.key}Desc`) }}</p>
            </div>
          </div>
          <USwitch v-model="state[flag.key]" :color="flag.warning ? 'warning' : 'primary'" />
        </div>
      </div>

      <div v-if="data?.aiEnabled" class="mt-4 border-t border-default pt-4" data-config-ai>
        <div class="flex items-start gap-3">
          <UIcon name="i-ph-sparkle" class="mt-0.5 size-5 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{{ t('admin.config.aiModel') }}</p>
            <p class="text-sm text-muted">{{ t('admin.config.aiModelDesc', { model: data?.aiDefaultModel ?? '' }) }}</p>
            <UInput
              v-model="state.aiModel"
              class="mt-2 w-full"
              :placeholder="data?.aiDefaultModel"
              data-config-ai-model
            />
          </div>
        </div>

        <!-- DER SCHLÜSSEL. Er steht hier und nicht bei den Flags darüber, weil
             er nicht in `app_config` landet: die Tabelle ist `read(any)`
             (system-005). Der Wert wandert verschlüsselt in `instance_secrets`
             (system-036) und kommt NIE zurück — deshalb zeigt das Feld einen
             Zustand statt eines Wertes. -->
        <div class="mt-4 flex items-start gap-3" data-config-ai-key>
          <UIcon name="i-ph-key" class="mt-0.5 size-5 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium">{{ t('admin.config.aiKey') }}</p>
              <UBadge
                :color="aiKeyState === 'none' ? 'warning' : 'success'"
                variant="subtle"
                size="sm"
              >
                {{ t(`admin.config.aiKeySource.${aiKeyState}`) }}
              </UBadge>
            </div>
            <p class="text-sm text-muted">{{ t('admin.config.aiKeyDesc') }}</p>

            <template v-if="data?.aiKeyEditable">
              <UInput
                v-model="aiKeyInput"
                type="password"
                class="mt-2 w-full"
                autocomplete="off"
                :placeholder="t('admin.config.aiKeyPlaceholder')"
                data-config-ai-key-input
              />
              <UButton
                v-if="aiKeyState === 'settings'"
                color="error"
                variant="ghost"
                size="xs"
                icon="i-ph-trash"
                class="mt-2"
                data-config-ai-key-clear
                @click="clearAiKey"
              >
                {{ t('admin.config.aiKeyClear') }}
              </UButton>
            </template>
            <!-- Ohne Umschlag-Schlüssel gibt es kein Feld, und die Seite sagt
                 warum — statt eine Eingabe anzubieten, die beim Speichern 503
                 antwortet. -->
            <UAlert
              v-else
              color="neutral"
              variant="subtle"
              icon="i-ph-info"
              class="mt-2"
              :description="t('admin.config.aiKeyNotEditable')"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <UButton :loading="loading" @click="save">{{ t('admin.config.save') }}</UButton>
      </div>
    </UPageCard>
  </div>
</template>
