<script setup lang="ts">
/** Neue-Brand-Layer (Runde 60; Zuschnitt Runde 151, David): PROGRESSIVE
 *  Enthüllung statt Formular auf einen Blick. Schritt 1 = NUR die
 *  Weiche (nebeneinander, links/rechts-Entscheidung, gleich lange
 *  Copy); erst nach der Wahl erscheinen die Rahmendaten (Titel +
 *  Sprache, bewusst EIN Schritt) samt CTA. Der Titel kommt NACH der
 *  Weiche, weil sich das Feld anpasst: Neue Marke = optionaler
 *  Arbeitstitel (der echte Name kann im Gespräch entstehen), Relaunch =
 *  die Marke HAT einen Namen.
 *
 *  P1c (2026-08-31): ZWEI BETRIEBSARTEN, damit der Klickdummy unangetastet
 *  bleibt und dieselbe Optik trotzdem echt absenden kann.
 *   - `mode: 'demo'` (Voreinstellung) — der Knopf ist ein Link auf den
 *     Dummy-Pfad; der .playground benutzt die Komponente unverändert weiter.
 *   - `mode: 'live'` — der Knopf sendet `submit` mit der Auswahl, die Seite
 *     legt an (POST /api/brand/profiles) und navigiert. `loading` sperrt ihn
 *     währenddessen.
 *  Nichts an den Dummy-Zweigen wurde geändert: ohne die neuen Props verhält
 *  sich die Komponente Zeichen für Zeichen wie vorher.
 *
 *  EINGELÖST (2026-09-01): die Copy lief über `brand.new.*` — sie war fest
 *  DEUTSCH und stand damit auch auf einer englischen Oberfläche deutsch da.
 *  Der Wortlaut des abgenommenen Klickdummys ist dabei der KANONISCHE: die
 *  zwei Stellen, an denen die Seite `/dashboard/brands/new` kürzer war
 *  (Titel-Platzhalter, Sprach-Hinweis), tragen jetzt den Modal-Text — beide
 *  Oberflächen lesen denselben Schlüssel. Eigennamen bleiben hart:
 *  „Deutsch"/„English" und George. */
export interface BwNewBrandSubmit {
  kind: 'new' | 'rebrand'
  title: string
  lang: 'de' | 'en'
}
withDefaults(defineProps<{
  mode?: 'demo' | 'live'
  /** Ziel im Demo-Modus — bleibt der abgenommene Dummy-Pfad. */
  to?: string
  loading?: boolean
}>(), { mode: 'demo', to: '/brand/demo/werte', loading: false })
defineEmits<{ submit: [payload: BwNewBrandSubmit] }>()
const { t } = useI18n()
const open = defineModel<boolean>('open', { default: false })
const kind = ref<'new' | 'rebrand' | null>(null)
const title = ref('')
const lang = ref<'de' | 'en'>('de')
/* Jedes Öffnen beginnt beim ersten Schritt. */
watch(open, (o) => {
  if (o) {
    kind.value = null
    title.value = ''
  }
})
/* Die Weichen-Ids des Dummys heißen 'new' | 'rebrand', die Schlüssel des
 * Layers 'new' | 'relaunch' (so heißt der Pfad im Datenmodell) — `key`
 * hält die Übersetzung an den Schlüsseln, ohne die abgenommene API zu
 * verschieben. */
const kinds = computed(() => [
  { id: 'new' as const, label: t('brand.new.kind.new.label'), note: t('brand.new.kind.new.note') },
  { id: 'rebrand' as const, label: t('brand.new.kind.relaunch.label'), note: t('brand.new.kind.relaunch.note') },
])
const langs = [
  { id: 'de' as const, label: 'Deutsch', flag: 'i-circle-flags-de' },
  { id: 'en' as const, label: 'English', flag: 'i-circle-flags-us' },
]
</script>

<template>
  <!-- `title` = der NAME des Dialogs (Audit B10). Bei belegtem `content`-Slot
       rendert Nuxt UI ihn visuell versteckt als DialogTitle; ohne ihn kündigt
       ein Screenreader nur „Dialog" an. -->
  <UModal v-model:open="open" :title="t('brand.new.title')">
    <template #content>
      <!-- `bw-overlay` statt Inline-Hintergrund: dieselbe Farbe, aber aus dem
           System und nicht aus einer zweiten Quelle (Audit B9). -->
      <div class="bw-root bw-overlay relative max-h-[85vh] overflow-y-auto p-8">
        <button
          type="button"
          class="absolute right-5 top-5 grid size-8 place-items-center rounded-full transition-colors hover:bg-[var(--bw-line)]"
          :aria-label="t('brand.common.close')"
          @click="open = false"
        >
          <UIcon name="i-ph-x" class="size-4.5" style="color: var(--bw-ink-soft)" />
        </button>
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('brand.new.eyebrow') }}</p>
        <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">{{ t('brand.new.title') }}</h2>

        <!-- Schritt 1: die Weiche, links oder rechts -->
        <div class="mt-5 grid grid-cols-2 gap-2">
          <button
            v-for="k in kinds" :key="k.id"
            class="bw-select-card rounded-2xl px-4 py-4 text-left"
            :class="kind === k.id ? 'bw-select-card--on' : ''"
            @click="kind = k.id"
          >
            <span class="block text-sm font-medium">{{ k.label }}</span>
            <span class="bw-select-note mt-1 block text-sm">{{ k.note }}</span>
          </button>
        </div>

        <!-- Schritt 2 (erscheint erst nach der Wahl): Rahmendaten -->
        <Transition name="bw-sync">
          <div v-if="kind">
            <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ kind === 'new' ? t('brand.new.titleField.new') : t('brand.new.titleField.relaunch') }}</p>
            <UInput
              v-model="title" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
              :placeholder="kind === 'new' ? t('brand.new.titleField.placeholderNew') : t('brand.new.titleField.placeholderRelaunch')"
              style="background: var(--bw-surface)"
            />

            <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ t('brand.new.locale.label') }}</p>
            <div class="mt-2 flex gap-2">
              <button
                v-for="l in langs" :key="l.id"
                class="bw-select-card flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                :class="lang === l.id ? 'bw-select-card--on' : ''"
                @click="lang = l.id"
              >
                <UIcon :name="l.flag" class="size-4.5 flex-none" /> {{ l.label }}
              </button>
            </div>
            <p class="bw-label mt-2" style="color: var(--bw-muted)">{{ t('brand.new.locale.note') }}</p>

            <div class="mt-7 flex justify-end">
              <UButton
                v-if="mode === 'demo'"
                :to="to"
                trailing-icon="i-ph-arrow-right" :label="t('brand.new.submit')" size="lg" class="rounded-full"
              />
              <UButton
                v-else
                :loading="loading"
                trailing-icon="i-ph-arrow-right" :label="t('brand.new.submit')" size="lg" class="rounded-full"
                @click="$emit('submit', { kind, title, lang })"
              />
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </UModal>
</template>
