<script setup lang="ts">
/** Neue-Brand-Layer (Davids Entscheidung, Runde 60): ein kleines Modal
 *  mit den drei unvermeidbaren Angaben — Weiche (Neugründung/Rebrand bzw.
 *  Brandoptimierung — Produktentscheidung 2026-08-30: der zweite Pfad
 *  deckt BEIDE Fälle, die Unterscheidung trifft George im Gespräch),
 *  Arbeitstitel (optional), Inhaltssprache — danach übernimmt George. */
const open = defineModel<boolean>('open', { default: false })
const kind = ref<'new' | 'rebrand' | null>(null)
const title = ref('')
const lang = ref<'de' | 'en'>('de')
const kinds = [
  { id: 'new' as const, label: 'Neugründung', note: 'Es gibt noch nichts — Name, Marke und Auftritt entstehen hier.' },
  { id: 'rebrand' as const, label: 'Rebrand bzw. Brandoptimierung', note: 'Es gibt schon eine Marke — wir schärfen sie (Optimierung) oder schneiden sie neu (Rebrand). Was passt, entscheidet ihr mit George im Gespräch.' },
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
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Neue Brand</p>
        <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">Womit starten wir?</h2>

        <div class="mt-5 flex flex-col gap-2">
          <button
            v-for="k in kinds" :key="k.id"
            class="bw-select-card w-full rounded-2xl px-4 py-3 text-left"
            :class="kind === k.id ? 'bw-select-card--on' : ''"
            @click="kind = k.id"
          >
            <span class="block text-sm font-medium">{{ k.label }}</span>
            <span class="bw-select-note mt-0.5 block text-sm">{{ k.note }}</span>
          </button>
        </div>

        <p class="bw-label mt-6" style="color: var(--bw-muted)">Arbeitstitel (optional)</p>
        <UInput
          v-model="title" variant="none" class="mt-2 w-full" :ui="{ base: 'rounded-full px-4' }"
          placeholder="z. B. Kailua Coffee Co. — lässt sich jederzeit ändern"
          style="background: var(--bw-surface)"
        />

        <p class="bw-label mt-6" style="color: var(--bw-muted)">Inhaltssprache</p>
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
            :to="kind ? '/brand/demo/werte' : undefined" :disabled="!kind"
            trailing-icon="i-ph-arrow-right" label="Los geht's — George übernimmt" size="lg" class="rounded-full"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
