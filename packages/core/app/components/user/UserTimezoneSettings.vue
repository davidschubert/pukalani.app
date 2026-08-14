<script setup lang="ts">
/**
 * Zeitzone des Kontos (U15 Teil 5) — EIN Auswahlfeld, mehr nicht.
 *
 * Sie ist reine ANZEIGE: `prefs.timezone` entscheidet, in welcher Zone
 * `useFormatDate()` rechnet. Ohne Wahl bleibt alles wie bisher (Zone der
 * Laufzeit) — deswegen steht „Automatisch" an erster Stelle und ist der
 * Default.
 *
 * ZWEI ENTSCHEIDUNGEN, DIE MAN SONST WIEDER AUFMACHT:
 *
 * (1) `'auto'` IST EIN UI-WERT, KEIN GESPEICHERTER. Abgelegt wird `''`. Die
 *     Auswahlliste braucht aber einen wahrheitsfähigen Wert je Eintrag —
 *     leere Strings sind in Nuxt UIs Auswahlfeldern schon einmal zur Falle
 *     geworden (USelectItem verbietet sie ganz). Umgesetzt wird an genau zwei
 *     Zeilen (`toStored`/`toChoice`), nicht verstreut.
 *
 * (2) DIE „JETZT"-ZEILE STEHT IN `<ClientOnly>`. Sie zeigt eine laufende Uhr;
 *     SSR schriebe die Server-Sekunde ins HTML und der Browser eine andere
 *     beim Hydrieren — ein Mismatch, der nichts mit der Einstellung zu tun
 *     hätte. Die EINSTELLUNG selbst erzeugt keinen: sie kommt aus dem
 *     SSR-Payload (s. useAccountTimezone).
 */
import { AUTOMATIC_TIMEZONE, groupTimezonesByRegion, supportedTimezones } from '../../../shared/timezone'
import { formatTime } from '../../utils/format'

const AUTO_CHOICE = 'auto'

const { t, locale, locales } = useI18n()
const toast = useToast()
const auth = useAuthStore()
const { timezone } = useAccountTimezone()

const loading = ref(false)

function toChoice(stored: string): string {
  return stored === AUTOMATIC_TIMEZONE ? AUTO_CHOICE : stored
}
function toStored(choice: string): string {
  return choice === AUTO_CHOICE ? AUTOMATIC_TIMEZONE : choice
}

const choice = ref(toChoice(timezone.value))
watch(timezone, value => { choice.value = toChoice(value) })

/**
 * „Automatisch" zuerst, danach je Region eine Überschrift (`type: 'label'`)
 * und darunter ihre Zonen. Die Gruppierung ist eine pure Rechnung in
 * shared/timezone.ts — hier entstehen nur die Beschriftungen. 400+ Zonen
 * flach untereinander findet niemand; die Suche des Feldes bleibt der
 * schnelle Weg.
 *
 * WÄHREND EINER SUCHE FALLEN DIE ÜBERSCHRIFTEN WEG. Nuxt UI behandelt
 * `type: 'label'` als STRUKTUR und filtert sie NIE mit (`isStructural` in
 * SelectMenu.vue) — die Suche nach „Berlin" zeigte sonst sechs leere
 * Regions-Zeilen über dem einen Treffer. Beim Bauen gesehen, nicht vermutet.
 */
const searchTerm = ref('')

const items = computed(() => {
  const entries: Array<{ label: string, value?: string, type?: 'label' }> = [
    { label: t('account.timezone.automatic'), value: AUTO_CHOICE },
  ]
  const searching = searchTerm.value.trim().length > 0
  for (const group of groupTimezonesByRegion(supportedTimezones())) {
    if (!searching) entries.push({ label: group.region, type: 'label' })
    for (const zone of group.zones) {
      entries.push({ label: zone.replace(/_/g, ' '), value: zone })
    }
  }
  return entries
})

const language = computed(() => {
  const entries = locales.value as Array<{ code: string, language?: string }>
  return entries.find(entry => entry.code === locale.value)?.language ?? locale.value
})

// Laufende Uhr — nur im Browser (s. Kopf). 30 s reichen für eine Minutenanzeige.
const now = ref(Date.now())
onMounted(() => {
  now.value = Date.now()
  const timer = setInterval(() => { now.value = Date.now() }, 30_000)
  onScopeDispose(() => clearInterval(timer))
})

/** Die Zone, die die Anzeige NACH dem Speichern benutzen würde. */
const previewZone = computed(() => {
  const stored = toStored(choice.value)
  return stored || Intl.DateTimeFormat().resolvedOptions().timeZone
})

const previewTime = computed(() => formatTime(now.value, language.value, previewZone.value))

async function save() {
  loading.value = true
  try {
    await $fetch('/api/auth/timezone', {
      method: 'PUT',
      body: { timezone: toStored(choice.value) },
    })
    // Prefs neu ziehen, damit jede Datums-Anzeige im Tab sofort mitzieht.
    await auth.refresh()
    toast.add({ title: t('account.timezone.saved'), color: 'success' })
  }
  catch {
    toast.add({
      title: t('account.timezone.saveFailed'),
      description: t('account.timezone.saveFailedDescription'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4" data-timezone-settings>
    <UFormField :label="t('account.timezone.label')" :help="t('account.timezone.help')">
      <USelectMenu
        v-model="choice"
        v-model:search-term="searchTerm"
        :items="items"
        value-key="value"
        class="w-full"
        :placeholder="t('account.timezone.placeholder')"
        data-timezone-select
      />
    </UFormField>

    <ClientOnly>
      <p class="text-sm text-muted" data-timezone-preview>
        {{ t('account.timezone.now', { time: previewTime, zone: previewZone }) }}
      </p>
    </ClientOnly>

    <div class="flex justify-end">
      <UButton :loading="loading" data-timezone-save @click="save">
        {{ t('account.timezone.save') }}
      </UButton>
    </div>
  </div>
</template>
