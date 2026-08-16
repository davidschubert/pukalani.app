<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createRegisterFormSchema, type RegisterFormInput } from '../../../schemas/auth'

/**
 * REGISTRIERUNG AUF EINLADUNG (Davids Entscheidung 2026-08-15) — die drei
 * Angaben, mit denen die Einladungs-Seite dieses Formular benutzt.
 *
 * Bewusst hier und nicht als zweites Formular auf `/join`: Passwortregeln,
 * AGB-Gate, Fehlermeldungen und der Trichter-Punkt leben an EINER Stelle. Eine
 * Kopie daneben wäre die Stelle, an der eine Regel künftig fehlt.
 */
const props = defineProps<{
  /**
   * Öffnet die Registrierung auf einer Community mit geschlossener
   * Anmeldung — der Server prüft ihn (`inviteOpensRegistrationFor`) und lässt
   * ihn NUR für die eingeladene Adresse gelten.
   */
  inviteToken?: string
  /**
   * Die eingeladene Adresse. Sie steht fest, weil der Server ohnehin nur sie
   * durchlässt: ein änderbares Feld böte hier eine Eingabe an, die garantiert
   * abgelehnt würde.
   */
  lockedEmail?: string
  /**
   * Wohin nach der Anmeldung. Ohne Angabe gilt wie bisher `?redirect=` bzw.
   * die Startseite — die Einladungs-Seite bleibt dagegen bei sich, dort wartet
   * noch der Klick auf „Einladung annehmen".
   */
  redirectTo?: string
}>()

const { t } = useI18n()
const { afterAuthTarget } = useAuthRedirect()
const appConfig = useAppConfig()
const auth = useAuthStore()
const { authErrorMessage } = useAuthErrorMessage()
/**
 * Trichter-Punkt „registriert" (U18) — NUR auf einem Kontroll-Host.
 *
 * Dieses Formular gehört dem Core und läuft damit auch auf JEDEM
 * Mandanten-Host. Dort misst die Community ihre eigene Plausible-Site; ein
 * Betreiber-Trichter-Ereignis in fremden Kundenzahlen wäre schlicht falsch.
 * Der Trichter, um den es geht, beginnt auf account.pukalani.app.
 */
const { trackFunnel } = useFunnelEvent()
const isControlCenter = useIsControlCenter()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// AGB-Checkbox nur, wenn die App eine termsUrl konfiguriert (config-gated)
const termsUrl = computed(() => appConfig.pukalani?.auth?.termsUrl ?? '')
const requireTerms = computed(() => !!termsUrl.value)
const schema = computed(() => createRegisterFormSchema(t, { requireTerms: requireTerms.value }))

// Eingegebene E-Mail + Name überleben den Wechsel Login ↔ Register ↔ Code
const sharedEmail = useState('pukalani-auth-email', () => '')
const sharedName = useState('pukalani-auth-name', () => '')
const state = reactive<RegisterFormInput>({
  name: sharedName.value,
  // Eine gebundene Einladung schlägt den gemerkten Wert: die Adresse ist hier
  // keine Wahl, sondern eine Tatsache.
  email: props.lockedEmail || sharedEmail.value,
  password: '',
  passwordConfirm: '',
  terms: false,
})
watch(() => state.email, (value) => { sharedEmail.value = value })
watch(() => state.name, (value) => { sharedName.value = value })

async function onSubmit(event: FormSubmitEvent<RegisterFormInput>) {
  loading.value = true
  errorMessage.value = null
  try {
    // passwordConfirm/terms sind reine UI-Validierung — der Server bekommt sie nicht
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        name: event.data.name,
        email: event.data.email,
        password: event.data.password,
        // Nur gesetzt, wenn die Seite eine Einladung trägt. Der Server prüft
        // ihn selbst; hier wird nichts entschieden, nur weitergereicht.
        ...(props.inviteToken ? { inviteToken: props.inviteToken } : {}),
      },
    })
    await auth.refresh()
    if (isControlCenter) trackFunnel('funnel_register_done')
    await navigateTo(props.redirectTo || afterAuthTarget())
  }
  catch (error) {
    // Server weg ≠ gesperrt ≠ Account existiert ≠ Registrierung zu — ehrliche
    // Meldung je nach Ursache. Netzwerk und Sperre beantwortet der geteilte
    // Helfer (G7), den Rest nur dieses Formular.
    const status = (error as { statusCode?: number }).statusCode
    let fallback = t('auth.register.failed')
    if (status === 403) fallback = t('auth.register.disabled')
    else if (status === 409) fallback = t('auth.register.emailExists')
    else if (status === 422) fallback = t('auth.register.emailNotAllowed')
    errorMessage.value = authErrorMessage(error, fallback)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4" data-register-form>
    <div class="text-center">
      <UIcon name="i-ph-user-circle-plus" class="mx-auto size-8 text-primary" />
      <h1 class="mt-2 text-xl font-semibold">{{ t('auth.register.title') }}</h1>
      <p class="text-sm text-muted">{{ t('auth.register.description') }}</p>
    </div>

    <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />

    <UForm :schema="schema" :validate-on="[]" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField :label="t('auth.fields.name')" name="name" required>
        <UInput v-model="state.name" size="lg" :placeholder="t('auth.fields.namePlaceholder')" class="w-full" />
      </UFormField>

      <UFormField
        :label="t('auth.fields.email')"
        name="email"
        required
        :description="lockedEmail ? t('auth.register.invitedEmailNote') : undefined"
      >
        <UInput
          v-model="state.email"
          type="email"
          size="lg"
          :readonly="Boolean(lockedEmail)"
          :placeholder="t('auth.fields.emailPlaceholder')"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="t('auth.fields.password')" name="password" required>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          size="lg"
          :placeholder="t('auth.fields.passwordHint')"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-ph-eye-slash' : 'i-ph-eye'"
              :aria-label="t('auth.fields.togglePassword')"
              tabindex="-1"
              @click="() => { showPassword = !showPassword }"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField :label="t('auth.fields.passwordConfirm')" name="passwordConfirm" required>
        <UInput
          v-model="state.passwordConfirm"
          :type="showPasswordConfirm ? 'text' : 'password'"
          size="lg"
          :placeholder="t('auth.fields.passwordConfirmPlaceholder')"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPasswordConfirm ? 'i-ph-eye-slash' : 'i-ph-eye'"
              :aria-label="t('auth.fields.togglePassword')"
              tabindex="-1"
              @click="() => { showPasswordConfirm = !showPasswordConfirm }"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Passwort-Stärke-Indikator (unter dem zweiten Passwortfeld) -->
      <AuthPasswordStrengthMeter :password="state.password" :password-confirm="state.passwordConfirm" />

      <UFormField v-if="requireTerms" name="terms">
        <UCheckbox v-model="state.terms" :label="t('auth.register.termsLabel')" />
      </UFormField>

      <UButton type="submit" block size="lg" :loading="loading">{{ t('auth.register.submit') }}</UButton>
    </UForm>

    <!--
      Social-Login BEWUSST unter dem Formular (U14): das AGB-Häkchen gilt für
      JEDEN Weg ins Konto, nicht nur für den mit Passwort. Stünde der
      Google-Knopf oben, wäre er die Hintertür um genau diese Zusage herum;
      gesperrt neben der Checkbox ist der Zusammenhang sichtbar.
      Der Server kann die Zustimmung nicht nachprüfen — er bekommt sie auch
      beim Passwort-Weg nicht (`terms` ist reine UI-Validierung, s. onSubmit).
      Damit ist der Google-Weg genauso streng wie der bestehende, und nicht
      strenger vorgetäuscht.
    -->
    <AuthOauthButtons
      separator="before"
      :disabled="requireTerms && !state.terms"
      :disabled-hint="t('auth.register.termsLabel')"
    />

    <p v-if="termsUrl" class="text-center">
      <ULink :to="termsUrl" target="_blank" class="text-sm text-muted hover:text-primary">
        {{ t('auth.register.termsLink') }}
      </ULink>
    </p>
  </div>
</template>
