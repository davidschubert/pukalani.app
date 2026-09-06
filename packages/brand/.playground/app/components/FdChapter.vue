<script setup lang="ts">
import type { FdChapterData } from '../utils/demoFoundation'

/**
 * EIN RENDERER, ZWEI ANSICHTEN (Konzept §2.1).
 *
 * Dieselbe Komponente rendert das Kapitel privat (`/brand/demo/foundation`)
 * und öffentlich (`/brand/demo/share`). Der Unterschied ist EIN Prop, kein
 * zweiter Baum — sonst laufen die beiden Ansichten mit der Zeit auseinander,
 * und genau das soll der Prototyp ausschliessen.
 *
 * Was `variant: 'share'` anders macht (und NUR das):
 *  · das gesperrte Kapitel schrumpft auf EINEN Satz — kein Schloss-Zoo, keine
 *    Preisanker beim Fremdleser (§2.6);
 *  · der Vermerk „noch nicht abgenommen" und der Link zur Abnahme entfallen
 *    (im Snapshot steht ohnehin nur Bestätigtes — die SEITE filtert es weg).
 *
 * Der Druck (§2.6 „Print") wohnt unten im `@media print`-Block: Seitenumbruch
 * je Kapitel, Schranken-CTA weg, volle Lesebreite.
 */
const props = withDefaults(defineProps<{
  chapter: FdChapterData
  /** Anzeige-Nummer — die Zählung folgt der REIHENFOLGE, nicht der Registry-Id
   *  (Kapitel 4 „Markenarchitektur" entfällt ohne Lücke, §2.2). */
  index: number
  variant?: 'private' | 'share'
}>(), {
  variant: 'private',
})

const isPrivate = computed(() => props.variant === 'private')
const num = computed(() => String(props.index).padStart(2, '0'))
</script>

<template>
  <section :id="chapter.anchor" class="fd-chapter scroll-mt-6">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Kapitel {{ num }}</p>
      <span
        v-if="chapter.state === 'pending' && isPrivate"
        class="bw-state bw-state--draft"
      >noch nicht abgenommen</span>
      <span v-else-if="chapter.state === 'locked'" class="bw-state">
        <UIcon name="i-ph-lock-simple" class="size-3.5" />
        folgt in Brand Design
      </span>
    </div>
    <h2 class="mt-1 text-[26px] font-extralight leading-tight tracking-tight">{{ chapter.title }}</h2>
    <p v-if="chapter.note" class="bw-label mt-1.5" style="color: var(--bw-muted)">{{ chapter.note }}</p>

    <!-- GESPERRT BEIM FREMDLESER: ein Satz, kein Angebot (§2.6). -->
    <p v-if="chapter.state === 'locked' && !isPrivate" class="mt-4 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
      Visuelle Identität: folgt in Brand Design.
    </p>

    <div v-else class="mt-5 flex flex-col gap-7">
      <template v-for="(block, i) in chapter.blocks" :key="`${chapter.id}-${i}`">
        <!-- Leitsatz: der eine Satz, der gross stehen darf. -->
        <div v-if="block.kind === 'lead'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <p class="mt-2 text-[22px] font-extralight leading-snug tracking-tight">{{ block.text }}</p>
          <p v-if="block.note" class="bw-label mt-2.5" style="color: var(--bw-muted)">{{ block.note }}</p>
        </div>

        <!-- Fließtext. -->
        <div v-else-if="block.kind === 'text'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <p class="bw-doc-text" :class="block.label ? 'mt-2' : ''">{{ block.text }}</p>
        </div>

        <!-- Aufzählung. -->
        <div v-else-if="block.kind === 'list'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li v-for="item in block.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
              <span class="mt-2 size-1 flex-none rounded-full" style="background: var(--bw-line-strong)" />
              <span class="min-w-0">{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- Karten: Segmente, Werte, Boilerplates. -->
        <div v-else-if="block.kind === 'cards'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <div class="mt-3 flex flex-col gap-3">
            <div v-for="item in block.items" :key="item.title" class="fd-box rounded-2xl px-5 py-4" style="background: var(--bw-surface)">
              <p class="text-sm font-medium">{{ item.title }}</p>
              <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ item.text }}</p>
              <p v-if="item.note" class="bw-label mt-2.5" style="color: var(--bw-muted)">{{ item.note }}</p>
            </div>
          </div>
        </div>

        <!-- TON-WÖRTER MIT PROBE (Boston.gov-Muster, §1.5): ein Chip allein
             sagt nicht, wie er klingt — deshalb steht die Stimmprobe darunter. -->
        <div v-else-if="block.kind === 'chips'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <div class="mt-3 flex flex-col gap-3.5">
            <div v-for="item in block.items" :key="item.word">
              <span class="bw-chip inline-block" style="cursor: default">{{ item.word }}</span>
              <p class="mt-1.5 text-sm italic leading-relaxed" style="color: var(--bw-ink-soft)">{{ item.sample }}</p>
            </div>
          </div>
        </div>

        <!-- Do & Don't — aus Wort-Leitfaden und Tabu-Wörtern (§2.4). -->
        <div v-else-if="block.kind === 'dodont'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <div class="mt-3 flex flex-col gap-2">
            <div
              v-for="pair in block.pairs" :key="pair.doText"
              class="fd-box grid gap-x-4 gap-y-2 rounded-2xl px-5 py-4 sm:grid-cols-2"
              style="background: var(--bw-surface)"
            >
              <p class="flex items-start gap-2 text-sm leading-relaxed">
                <UIcon name="i-ph-check-circle-fill" class="mt-0.5 size-4 flex-none" style="color: var(--bw-accent)" />
                <span class="min-w-0">{{ pair.doText }}</span>
              </p>
              <p class="flex items-start gap-2 text-sm leading-relaxed" style="color: var(--bw-muted)">
                <UIcon name="i-ph-x-circle-fill" class="mt-0.5 size-4 flex-none" style="color: var(--bw-stale)" />
                <span class="min-w-0 line-through">{{ pair.dontText }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Tabelle (Namens-Kandidaten, Prüfung). Waagerecht scrollbar in der
             eigenen Hülle — der Seitenkörper scrollt nie quer. -->
        <div v-else-if="block.kind === 'table'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <div class="mt-2.5 overflow-x-auto">
            <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th
                    v-for="col in block.columns" :key="col"
                    class="bw-label border-b px-0 pb-2 pr-4 font-normal uppercase tracking-wider"
                    style="color: var(--bw-muted); border-color: var(--bw-line)"
                  >{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, r) in block.rows" :key="`row-${r}`">
                  <td
                    v-for="(cell, c) in row" :key="`cell-${r}-${c}`"
                    class="border-b py-2.5 pr-4 align-top leading-relaxed"
                    :style="`border-color: var(--bw-line); color: ${c === 0 ? 'var(--bw-ink)' : 'var(--bw-ink-soft)'}`"
                  >{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DIE SICHTBARE SCHRANKE (§2.5): was dort entsteht, woraus — und
             welches Produkt es liefert. Ehrlich beschriftet statt weggelassen. -->
        <div
          v-else-if="block.kind === 'locked'"
          class="fd-box flex items-start gap-3 rounded-2xl px-5 py-4"
          style="background: var(--bw-surface)"
        >
          <UIcon name="i-ph-lock-simple" class="mt-0.5 size-4 flex-none" style="color: var(--bw-muted)" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium" style="color: var(--bw-ink-soft)">{{ block.title }}</p>
            <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-muted)">{{ block.text }}</p>
          </div>
          <p class="bw-label flex-none max-sm:hidden" style="color: var(--bw-muted)">{{ block.product }}</p>
        </div>

        <!-- Farbrampe der gewählten Richtung. -->
        <div v-else-if="block.kind === 'swatches'">
          <p v-if="block.label" class="bw-label" style="color: var(--bw-muted)">{{ block.label }}</p>
          <div class="mt-3 flex flex-wrap gap-4">
            <div v-for="c in block.items" :key="c.hex" class="flex flex-col gap-1.5">
              <div class="bw-swatch rounded-full" :style="`background: ${c.hex}; width: 2.75rem; height: 2.75rem`" />
              <p class="bw-label" style="color: var(--bw-muted)">{{ c.name }}</p>
              <p class="bw-label" style="color: var(--bw-muted)">{{ c.role }}</p>
            </div>
          </div>
        </div>

        <!-- DER FESTE KI-RAHMEN (§2.4): drei Zeilen, gefüllt aus Ton-Wörtern,
             Tabu-Wörtern und Werten. Keine Generierung, kein Cache. -->
        <div v-else-if="block.kind === 'aiRules'" class="fd-box rounded-2xl px-5 py-5" style="background: var(--bw-surface)">
          <p class="text-sm leading-relaxed">
            <span class="font-medium">Schreibt in diesem Ton:</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.tone.join(' · ') }}.</span>
          </p>
          <p class="mt-2.5 text-sm leading-relaxed">
            <span class="font-medium">Vermeidet:</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.avoid.join(' · ') }}.</span>
          </p>
          <p class="mt-2.5 text-sm leading-relaxed">
            <span class="font-medium">Steht für:</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.stands.join(' · ') }}.</span>
          </p>
          <p v-if="block.note" class="bw-pending mt-4">{{ block.note }}</p>
        </div>
      </template>
    </div>

    <!-- Der Vermerk am offenen Kapitel — NUR privat, und der EINZIGE Knopf im
         Text: korrigiert und abgenommen wird in der Werkstatt, nie hier (§2.6). -->
    <p v-if="chapter.state === 'pending' && isPrivate" class="fd-noprint mt-5 flex flex-wrap items-center gap-2">
      <span class="bw-pending">Dieses Kapitel steht noch nicht fest.</span>
      <NuxtLink to="/brand/demo/werte" class="bw-label underline" style="color: var(--bw-ink-soft)">Zur Abnahme</NuxtLink>
    </p>

    <!-- EIN CTA je Schranken-Kapitel, nicht je Abschnitt — und nur privat. -->
    <div v-if="chapter.state === 'locked' && isPrivate" class="fd-noprint mt-5 flex flex-wrap items-center gap-2">
      <UButton label="Im Brand Design entscheiden" trailing-icon="i-ph-arrow-right" class="rounded-full" />
      <UButton label="Erstgespräch buchen" color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)" />
    </div>
  </section>
</template>

<style scoped>
/* DRUCK (§2.6): Seitenumbruch je Kapitel, keine Knöpfe, keine Karten-Schatten
 * — Papier braucht Linien, keine Tiefe. Die Kopfzeile mit Marke und Stand
 * setzt die Seite (foundation.vue/share.vue), nicht das Kapitel. */
@media print {
  .fd-chapter { break-before: page; break-inside: auto; }
  .fd-chapter:first-child { break-before: auto; }
  .fd-noprint { display: none !important; }
  .fd-box { background: transparent !important; border: 1px solid #ddd; border-radius: 8px; }
}
</style>
