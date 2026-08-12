<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createRecoverySchema, type RecoveryInput } from '../../schemas/auth'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const localePath = useLocalePath()
const loading = ref(false)
const sent = ref(false)
const blockedMessage = ref('')
const { authErrorMessage } = useAuthErrorMessage()

// Seitentitel „Passwort vergessen · <Brand>" — gleiche Kette wie /login (B3-Rest).
useBrandTitle(() => t('auth.forgot.title'))

const schema = computed(() => createRecoverySchema(t))
const sharedEmail = useState('pukalani-auth-email', () => '')
const state = reactive<RecoveryInput>({ email: sharedEmail.value })

async function onSubmit(event: FormSubmitEvent<RecoveryInput>) {
  loading.value = true
  blockedMessage.value = ''
  try {
    await $fetch('/api/auth/recovery', { method: 'POST', body: event.data })
    sent.value = true
  }
  catch (error) {
    // Keine Account-Detail-Leaks — jeder Fehlschlag sieht aus wie ein Versand.
    // AUSNAHME seit G7: die Minuten-Sperre. Sie zählt pro IP und ROUTE, sagt
    // also nichts darüber, ob es diese Adresse gibt — und „Schau in dein
    // Postfach" wäre hier schlicht falsch: es wurde nichts verschickt, und der
    // Nutzer wartet auf eine Mail, die nie kommt.
    if (isRateLimited(error)) blockedMessage.value = authErrorMessage(error, '')
    else sent.value = true
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm space-y-4" data-forgot-password>
    <div class="text-center">
      <UIcon name="i-ph-key" class="mx-auto size-8 text-primary" />
      <h1 class="mt-2 text-xl font-semibold">{{ t('auth.forgot.title') }}</h1>
      <p class="text-sm text-muted">{{ t('auth.forgot.description') }}</p>
    </div>

    <UAlert v-if="blockedMessage" color="error" variant="subtle" :title="blockedMessage" />
    <UAlert v-if="sent" color="success" variant="subtle" :title="t('auth.forgot.success')" />

    <UForm v-else :schema="schema" :validate-on="[]" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField :label="t('auth.fields.email')" name="email" required>
        <UInput v-model="state.email" type="email" size="lg" :placeholder="t('auth.fields.emailPlaceholder')" class="w-full" />
      </UFormField>
      <UButton type="submit" block size="lg" :loading="loading">{{ t('auth.forgot.submit') }}</UButton>
    </UForm>

    <p class="text-center text-sm text-muted">
      <ULink :to="localePath('/login')" class="font-medium text-primary">{{ t('auth.forgot.back') }}</ULink>
    </p>
  </div>
</template>
