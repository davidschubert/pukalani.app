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
 *  OFFEN UND BEWUSST SO: die Copy hier ist fest DEUTSCH — sie stammt aus dem
 *  abgenommenen Klickdummy, und der ist Davids Demo-Anker. Die i18n-fähige
 *  Fassung derselben Anlage ist die SEITE `/dashboard/brands/new`; wer die
 *  Sprachumschaltung auch im Layer braucht, ersetzt hier die Zeichenketten
 *  durch `brand.new.*` (die Schlüssel liegen bereits in beiden Sprachen). */
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
const kinds = [
  { id: 'new' as const, label: 'Neue Marke', note: 'Ihr startet bei null — Name und Marke entstehen im Gespräch.' },
  { id: 'rebrand' as const, label: 'Marken-Relaunch', note: 'Ihr habt schon eine Marke — vom Feinschliff bis zum Neuschnitt.' },
]
const langs = [
  { id: 'de' as const, label: 'Deutsch', flag: 'i-circle-flags-de' },
  { id: 'en' as const, label: 'English', flag: 'i-circle-flags-us' },
]
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="bw-root relative max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <button
          class="absolute right-5 top-5 grid size-8 place-items-center rounded-full transition-colors hover:bg-[var(--bw-line)]"
          aria-label="Schließen"
          @click="open = false"
        >
          <UIcon name="i-ph-x" class="size-4.5" style="color: var(--bw-ink-soft)" />
        </button>
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Neues Branding</p>
        <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">Womit starten wir?</h2>

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
            <p class="bw-label mt-6" style="color: var(--bw-muted)">{{ kind === 'new' ? 'Arbeitstitel (optional)' : 'Wie heißt eure Marke?' }}</p>
            <UInput
              v-model="title" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
              :placeholder="kind === 'new' ? 'z. B. Kailua Coffee Co. — der echte Name kann im Gespräch entstehen' : 'z. B. Kailua Coffee Co.'"
              style="background: var(--bw-surface)"
            />

            <p class="bw-label mt-6" style="color: var(--bw-muted)">Eure Marke spricht</p>
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
            <p class="bw-label mt-2" style="color: var(--bw-muted)">Die Sprache, in der eure Markeninhalte entstehen — nicht die der Oberfläche. Und keine einsame Entscheidung: George übersetzt später alles auf Wunsch in weitere Sprachen, z. B. von Englisch nach Deutsch.</p>

            <div class="mt-7 flex justify-end">
              <UButton
                v-if="mode === 'demo'"
                :to="to"
                trailing-icon="i-ph-arrow-right" label="Los geht's — George übernimmt" size="lg" class="rounded-full"
              />
              <UButton
                v-else
                :loading="loading"
                trailing-icon="i-ph-arrow-right" label="Los geht's — George übernimmt" size="lg" class="rounded-full"
                @click="$emit('submit', { kind, title, lang })"
              />
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </UModal>
</template>
