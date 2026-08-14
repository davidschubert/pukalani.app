<script setup lang="ts">
/**
 * Der zweite Schritt der Anmeldung (U15 Teil 4).
 *
 * Er erscheint erst, NACHDEM das Passwort saß — die Session existiert an
 * dieser Stelle bereits, sie trägt nur noch nicht den zweiten Faktor. Deshalb
 * ist „Abbrechen" hier ein echtes Abmelden und kein bloßes Zurückblättern:
 * sonst bliebe ein halbes Session-Cookie im Browser liegen.
 */
const props = defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ solved: [], cancel: [] }>()

const { t } = useI18n()
const { authErrorMessage } = useAuthErrorMessage()

const mode = ref<'totp' | 'recovery'>('totp')
const code = ref('')
const busy = ref(false)
const errorMessage = ref<string | null>(null)

const isRecovery = computed(() => mode.value === 'recovery')

function switchMode() {
  mode.value = isRecovery.value ? 'totp' : 'recovery'
  code.value = ''
  errorMessage.value = null
}

async function onSubmit() {
  busy.value = true
  errorMessage.value = null
  try {
    await $fetch('/api/auth/mfa/challenge', {
      method: 'POST',
      body: { mode: mode.value, code: code.value },
    })
    emit('solved')
  }
  catch (error) {
    errorMessage.value = authErrorMessage(error, t('auth.mfa.challenge.failed'))
    code.value = ''
  }
  finally {
    busy.value = false
  }
}

async function onCancel() {
  // Best effort — das Cookie räumt die Route, und selbst wenn nicht, ist die
  // halbe Session für jeden Konto-Zugriff wertlos.
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  emit('cancel')
}
</script>

<template>
  <div class="w-full max-w-sm space-y-4" data-mfa-challenge>
    <div class="text-center">
      <UIcon name="i-ph-shield-check" class="mx-auto size-8 text-primary" />
      <h1 class="mt-2 text-xl font-semibold">{{ t('auth.mfa.challenge.title') }}</h1>
      <p class="text-sm text-muted">
        {{ isRecovery ? t('auth.mfa.challenge.recoveryDescription') : t('auth.mfa.challenge.description') }}
      </p>
    </div>

    <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" data-mfa-error />

    <UForm :state="{ code }" class="space-y-4" @submit="onSubmit">
      <UFormField :label="isRecovery ? t('auth.mfa.fields.recoveryCode') : t('auth.mfa.fields.code')" name="code" required>
        <UInput
          v-model="code"
          size="lg"
          autofocus
          autocomplete="one-time-code"
          :inputmode="isRecovery ? 'text' : 'numeric'"
          :placeholder="isRecovery ? t('auth.mfa.fields.recoveryPlaceholder') : t('auth.mfa.fields.codePlaceholder')"
          class="w-full"
          data-mfa-code
        />
      </UFormField>

      <UButton type="submit" block size="lg" :loading="busy || props.loading" data-mfa-submit>
        {{ t('auth.mfa.challenge.submit') }}
      </UButton>
    </UForm>

    <div class="flex items-center justify-between text-sm">
      <UButton variant="link" color="neutral" class="px-0" data-mfa-switch @click="switchMode">
        {{ isRecovery ? t('auth.mfa.challenge.useTotp') : t('auth.mfa.challenge.useRecovery') }}
      </UButton>
      <UButton variant="link" color="neutral" class="px-0" @click="onCancel">
        {{ t('auth.mfa.challenge.cancel') }}
      </UButton>
    </div>
  </div>
</template>
