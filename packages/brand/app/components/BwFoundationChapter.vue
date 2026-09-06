<script setup lang="ts">
import { brandChoiceDisplayLabel } from '../../shared/brandChoiceOptions'
import type { BrandFoundationChapter } from '../../shared/brandFoundation'

/**
 * EIN KAPITEL DER BRAND FOUNDATION (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.2/§2.5/§2.6, Paket G2).
 *
 * ── EIN RENDERER, ZWEI ANSICHTEN (§2.1) ──────────────────────────────────
 * Dieselbe Komponente rendert das Kapitel privat (`/brand/:id/foundation`) und
 * später öffentlich (`/brand/share/:token`, Paket G3). Der Unterschied ist EIN
 * Prop, kein zweiter Baum — sonst laufen die beiden Ansichten mit der Zeit
 * auseinander, und genau das soll die geteilte Regel ausschliessen.
 *
 * Was `variant: 'share'` anders macht (und NUR das):
 *  · das gesperrte Kapitel schrumpft auf EINEN Satz — kein Schloss-Zoo, keine
 *    Preisanker beim Fremdleser (§2.6);
 *  · der Vermerk „noch nicht abgenommen" und der Link zur Abnahme entfallen
 *    (im Snapshot steht ohnehin nur Bestätigtes).
 *
 * ── SIE ÜBERSETZT, DER RENDERER NICHT ────────────────────────────────────
 * `buildBrandFoundation` ist pur und schickt SCHLÜSSEL (`titleKey`,
 * `labelKey`, `columnKeys`) und stabile Ids (`element`, `optionIds`) — hier
 * werden sie zu Text. Der Grund steht im Kopf von `shared/brandFoundation.ts`:
 * die Inhaltssprache der Marke und die Sprache des Handbuchs sind verschieden.
 * Auswahl-Ids löst `brandChoiceDisplayLabel` auf, dieselbe Quelle wie im Log
 * und in `BwSessionBlock` — ein zweiter Katalog wäre ein zweiter Name für
 * denselben Archetyp.
 *
 * ── MARKDOWN NUR, WO ER STEHT ────────────────────────────────────────────
 * Nur ein Absatz mit `markdown` (heute: `e.manifesto`, der einzige
 * `richtext`-Slot) läuft durch `MarkdownContent` — den Subset-Parser aus
 * `core/shared/markdown.ts`: vnode-Ausgabe, kein `v-html`, rohes HTML bleibt
 * Text, Links nur mit sicheren Zielen (§2.8). Jeder andere Wert steht wörtlich
 * da; ALLES als Markdown zu lesen machte aus dem Sternchen einer Tagline eine
 * Kursivierung.
 *
 * Der Druck (§2.6) wohnt unten im `@media print`-Block: Seitenumbruch je
 * Kapitel, keine Knöpfe, Karten als Linien statt als Flächen.
 */
const props = withDefaults(defineProps<{
  chapter: BrandFoundationChapter
  /**
   * Anzeige-Nummer — die Zählung folgt der REIHENFOLGE, nicht der Registry-Id:
   * ein Kapitel ohne Weg (Markenarchitektur, Name) entfällt ohne Lücke (§2.2).
   */
  index: number
  variant?: 'private' | 'share'
  /**
   * Ziel des Vermerks „Zur Abnahme" — die Seite baut es (sie kennt Profil-Id
   * und Locale-Pfad). `null` heisst: kein Sprung anbieten.
   */
  acceptanceTo?: string | null
}>(), {
  variant: 'private',
  acceptanceTo: null,
})

const { t, te, locale } = useI18n()

const isPrivate = computed(() => props.variant === 'private')
const num = computed(() => String(props.index).padStart(2, '0'))

/**
 * Der ERKLÄR-Satz unter der Überschrift. Optional: nur die Kapitel, die sich
 * erklären müssen (die Schranke, der KI-Rahmen), haben einen — `te` fragt,
 * statt einen Schlüssel als Text auszugeben.
 */
const noteKey = computed(() => `brand.foundation.note.${props.chapter.id}`)
const note = computed(() => (te(noteKey.value) ? t(noteKey.value) : ''))

/** Der externe Weg zum Erstgespräch — die Studio-Seite, nicht diese App. */
const CALL_URL = 'https://pukalani.studio/erstgespraech'

/** Auswahl-Ids in der Sprache der OBERFLÄCHE (s. Kopf). */
function choiceLabels(slotId: string, optionIds: readonly string[]): string[] {
  return optionIds.map(id => brandChoiceDisplayLabel(slotId, id, locale.value))
}
</script>

<template>
  <section :id="chapter.anchor" class="fd-chapter scroll-mt-6">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
        {{ t('brand.foundation.chapterNumber', { num }) }}
      </p>
      <span
        v-if="chapter.state === 'pending' && isPrivate"
        class="bw-state bw-state--draft"
      >{{ t('brand.foundation.pending') }}</span>
      <span v-else-if="chapter.state === 'locked'" class="bw-state">
        <UIcon name="i-ph-lock-simple" class="size-3.5" />
        {{ t('brand.foundation.visual.follows') }}
      </span>
    </div>
    <h2 class="mt-1 text-[26px] font-extralight leading-tight tracking-tight">{{ t(chapter.titleKey) }}</h2>
    <p v-if="note" class="bw-label mt-1.5" style="color: var(--bw-muted)">{{ note }}</p>

    <!-- GESPERRT BEIM FREMDLESER: ein Satz, kein Angebot (§2.6). -->
    <p
      v-if="chapter.state === 'locked' && !isPrivate"
      class="mt-4 text-sm leading-relaxed" style="color: var(--bw-ink-soft)"
    >{{ t('brand.foundation.visual.shareLine') }}</p>

    <div v-else class="mt-5 flex flex-col gap-7">
      <template v-for="(block, i) in chapter.blocks" :key="`${chapter.id}-${i}`">
        <!-- Leitsatz: der eine Satz, der gross stehen darf. -->
        <div v-if="block.kind === 'lead'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <p class="mt-2 text-[22px] font-extralight leading-snug tracking-tight">{{ block.text }}</p>
        </div>

        <!-- Fließtext. Markdown nur mit Marke (s. Kopf). -->
        <div v-else-if="block.kind === 'text'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <MarkdownContent
            v-if="block.markdown"
            :source="block.text" class="bw-doc-text" :class="block.labelKey ? 'mt-2' : ''"
          />
          <p v-else class="bw-doc-text" :class="block.labelKey ? 'mt-2' : ''">{{ block.text }}</p>
        </div>

        <!-- Aufzählung. -->
        <div v-else-if="block.kind === 'list'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li
              v-for="(item, n) in block.items" :key="n"
              class="flex items-start gap-2.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)"
            >
              <span class="mt-2 size-1 flex-none rounded-full" style="background: var(--bw-line-strong)" />
              <span class="min-w-0">{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- Karten: Segmente, Werte, Boilerplates, Kernbotschaften. -->
        <div v-else-if="block.kind === 'cards'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-3 flex flex-col gap-3">
            <div
              v-for="(item, n) in block.items" :key="n"
              class="fd-box rounded-2xl px-5 py-4" style="background: var(--bw-surface)"
            >
              <p class="text-sm font-medium">{{ item.title }}</p>
              <p v-if="item.text" class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ item.text }}</p>
              <p v-if="item.note" class="bw-label mt-2.5" style="color: var(--bw-muted)">{{ item.note }}</p>
            </div>
          </div>
        </div>

        <!-- TON-WÖRTER MIT PROBE (Boston.gov-Muster, §1.5): ein Chip allein
             sagt nicht, wie er klingt — deshalb steht die Stimmprobe darunter. -->
        <div v-else-if="block.kind === 'chips'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-3 flex flex-col gap-3.5">
            <div v-for="(item, n) in block.items" :key="n">
              <span class="bw-chip inline-block" style="cursor: default">{{ item.word }}</span>
              <p
                v-if="item.sample"
                class="mt-1.5 text-sm italic leading-relaxed" style="color: var(--bw-ink-soft)"
              >{{ item.sample }}</p>
            </div>
          </div>
        </div>

        <!-- GESPEICHERTE AUSWAHL (Archetyp, Architektur-Modell): Ids kommen
             herein, Namen gehen hinaus (s. Kopf). -->
        <div v-else-if="block.kind === 'choice'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="(label, n) in choiceLabels(block.slotId, block.optionIds)" :key="n"
              class="bw-chip inline-block" style="cursor: default"
            >{{ label }}</span>
          </div>
        </div>

        <!-- Do & Don't — aus Wort-Leitfaden und Tabu-Wörtern (§2.4). -->
        <div v-else-if="block.kind === 'dodont'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-3 flex flex-col gap-2">
            <div
              v-for="(pair, n) in block.pairs" :key="n"
              class="fd-box grid gap-x-4 gap-y-2 rounded-2xl px-5 py-4 sm:grid-cols-2"
              style="background: var(--bw-surface)"
            >
              <p v-if="pair.doText" class="flex items-start gap-2 text-sm leading-relaxed">
                <UIcon name="i-ph-check-circle-fill" class="mt-0.5 size-4 flex-none" style="color: var(--bw-accent)" />
                <span class="min-w-0">{{ pair.doText }}</span>
              </p>
              <span v-else />
              <p v-if="pair.dontText" class="flex items-start gap-2 text-sm leading-relaxed" style="color: var(--bw-muted)">
                <UIcon name="i-ph-x-circle-fill" class="mt-0.5 size-4 flex-none" style="color: var(--bw-stale)" />
                <span class="min-w-0 line-through">{{ pair.dontText }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Tabelle (Namens-Kandidaten, Prüfung). Waagerecht scrollbar in der
             eigenen Hülle — der Seitenkörper scrollt nie quer. -->
        <div v-else-if="block.kind === 'table'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-2.5 overflow-x-auto">
            <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th
                    v-for="col in block.columnKeys" :key="col"
                    class="bw-label border-b px-0 pb-2 pr-4 font-normal uppercase tracking-wider"
                    style="color: var(--bw-muted); border-color: var(--bw-line)"
                  >{{ t(col) }}</th>
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
            <p class="text-sm font-medium" style="color: var(--bw-ink-soft)">
              {{ t(`brand.foundation.visual.${block.element}.title`) }}
            </p>
            <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-muted)">
              {{ t(`brand.foundation.visual.${block.element}.text`) }}
            </p>
          </div>
          <p class="bw-label flex-none max-sm:hidden" style="color: var(--bw-muted)">
            {{ t('brand.foundation.visual.product') }}
          </p>
        </div>

        <!-- Farbrampe der gewählten Richtung (kommt mit Paket G4). -->
        <div v-else-if="block.kind === 'swatches'">
          <p v-if="block.labelKey" class="bw-label" style="color: var(--bw-muted)">{{ t(block.labelKey) }}</p>
          <div class="mt-3 flex flex-wrap gap-4">
            <div v-for="color in block.items" :key="color.hex" class="flex flex-col gap-1.5">
              <div class="bw-swatch rounded-full" :style="`background: ${color.hex}; width: 2.75rem; height: 2.75rem`" />
              <p class="bw-label" style="color: var(--bw-muted)">{{ color.name }}</p>
              <p class="bw-label" style="color: var(--bw-muted)">{{ color.role }}</p>
            </div>
          </div>
        </div>

        <!-- DER FESTE KI-RAHMEN (§2.4): drei Zeilen, gefüllt aus Ton-Wörtern,
             Tabu-Wörtern und Werten. Keine Generierung, kein Cache. -->
        <div v-else-if="block.kind === 'aiRules'" class="fd-box rounded-2xl px-5 py-5" style="background: var(--bw-surface)">
          <p v-if="block.tone.length" class="text-sm leading-relaxed">
            <span class="font-medium">{{ t('brand.foundation.ai.tone') }}</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.tone.join(' · ') }}</span>
          </p>
          <p v-if="block.avoid.length" class="mt-2.5 text-sm leading-relaxed">
            <span class="font-medium">{{ t('brand.foundation.ai.avoid') }}</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.avoid.join(' · ') }}</span>
          </p>
          <p v-if="block.stands.length" class="mt-2.5 text-sm leading-relaxed">
            <span class="font-medium">{{ t('brand.foundation.ai.stands') }}</span>
            <span style="color: var(--bw-ink-soft)"> {{ block.stands.join(' · ') }}</span>
          </p>
          <p class="bw-pending mt-4">{{ t('brand.foundation.ai.hint') }}</p>
        </div>
      </template>
    </div>

    <!-- Der Vermerk am offenen Kapitel — NUR privat, und der EINZIGE Knopf im
         Text: korrigiert und abgenommen wird in der Werkstatt, nie hier (§2.6). -->
    <p v-if="chapter.state === 'pending' && isPrivate" class="fd-noprint mt-5 flex flex-wrap items-center gap-2">
      <span class="bw-pending">{{ t('brand.foundation.pendingNote') }}</span>
      <NuxtLink
        v-if="acceptanceTo" :to="acceptanceTo"
        class="bw-label underline" style="color: var(--bw-ink-soft)"
      >{{ t('brand.foundation.toAcceptance') }}</NuxtLink>
    </p>

    <!-- EIN CTA-PAAR je Schranken-Kapitel, nicht je Abschnitt — und nur privat.
         OHNE PREISANKER: der Schranken-Text mit Preis ist Davids Gate (Paket
         G4), und ein erfundener Preis wäre teurer als eine fehlende Zahl. -->
    <div v-if="chapter.state === 'locked' && isPrivate" class="fd-noprint mt-5 flex flex-wrap items-center gap-2">
      <UButton
        class="rounded-full" trailing-icon="i-ph-arrow-right" disabled
        :label="t('brand.foundation.visual.ctaDesign')"
      />
      <UButton
        :to="CALL_URL" target="_blank" rel="noopener noreferrer"
        color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)"
        :label="t('brand.foundation.visual.ctaCall')"
      />
      <p class="bw-label basis-full" style="color: var(--bw-muted)">
        {{ t('brand.foundation.visual.product') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
/* DRUCK (§2.6): Seitenumbruch je Kapitel, keine Knöpfe, keine Karten-Flächen
 * — Papier braucht Linien, keine Tiefe. Die Kopfzeile mit Marke und Stand
 * setzt die SEITE, nicht das Kapitel. */
@media print {
  .fd-chapter { break-before: page; break-inside: auto; }
  .fd-chapter:first-child { break-before: auto; }
  .fd-noprint { display: none !important; }
  .fd-box { background: transparent !important; border: 1px solid #ddd; border-radius: 8px; }
}
</style>
