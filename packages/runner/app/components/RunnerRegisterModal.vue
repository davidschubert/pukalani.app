<script setup lang="ts">
import type { RunnerCreatedResponse } from '../../shared/types/runner'

/**
 * Einen Rechner registrieren — und sein Token GENAU EINMAL zeigen.
 *
 * Das ist der ganze Zweck dieses Dialogs: gespeichert wird nur `sha256(secret)`
 * (M9-Muster wie `community_invites.tokenHash`), es gibt danach keinen Weg,
 * das Token noch einmal zu lesen. Deshalb bleibt der Dialog nach dem Anlegen
 * OFFEN und zeigt es, statt sich mit einem Erfolgs-Toast zu schließen — ein
 * Toast verschwindet nach vier Sekunden, und dann ist der Rechner nutzlos
 * registriert.
 */
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ registered: [] }>()

const { t } = useI18n()
const toast = useToast()

const name = ref('')
const kind = ref<'local' | 'ssh'>('local')
const busy = ref(false)
const token = ref('')

const kindItems = computed(() => [
  { label: t('runner.runners.kind.local'), value: 'local' as const },
  { label: t('runner.runners.kind.ssh'), value: 'ssh' as const },
])

watch(open, (value) => {
  if (value) return
  // Beim Schließen alles vergessen — vor allem das Token: es soll nicht beim
  // nächsten Öffnen des Dialogs wieder dastehen.
  name.value = ''
  kind.value = 'local'
  token.value = ''
})

async function submit() {
  if (!name.value.trim()) return
  busy.value = true
  try {
    const response = await $fetch<RunnerCreatedResponse>('/api/runner/runners', {
      method: 'POST',
      body: { name: name.value.trim(), kind: kind.value },
    })
    token.value = response.token
    emit('registered')
  }
  catch {
    toast.add({ title: t('runner.register.failed'), description: t('runner.register.failedHint'), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function copyToken() {
  await navigator.clipboard.writeText(token.value)
  toast.add({ title: t('runner.register.copied'), color: 'success', icon: 'i-ph-clipboard-text' })
}
</script>

<template>
  <UModal v-model:open="open" :title="t('runner.register.title')" :description="t('runner.register.description')">
    <template #body>
      <form v-if="!token" class="space-y-3" @submit.prevent="submit">
        <UFormField :label="t('runner.register.name')">
          <UInput v-model="name" size="sm" class="w-full" :placeholder="t('runner.register.namePlaceholder')" autofocus />
        </UFormField>
        <UFormField :label="t('runner.register.kind')" :help="t('runner.register.kindHelp')">
          <USelect v-model="kind" :items="kindItems" size="sm" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" size="sm" icon="i-ph-plus" :loading="busy" :disabled="!name.trim()" data-runner-register-submit>
            {{ t('runner.register.submit') }}
          </UButton>
        </div>
      </form>

      <div v-else class="space-y-3" data-runner-token>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-ph-key"
          :title="t('runner.register.tokenTitle')"
          :description="t('runner.register.tokenText')"
        />
        <!-- `break-all`, weil das Token ein 64-Zeichen-Hex hinter der Row-Id ist
             und ohne Umbruch aus dem Dialog liefe. -->
        <pre class="max-h-32 overflow-auto rounded-md bg-elevated p-2 font-mono text-xs break-all whitespace-pre-wrap">{{ token }}</pre>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="subtle" size="sm" icon="i-ph-clipboard-text" @click="copyToken">
            {{ t('runner.register.copy') }}
          </UButton>
          <UButton size="sm" @click="() => { open = false }">{{ t('runner.register.done') }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
