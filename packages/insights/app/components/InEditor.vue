<script setup lang="ts">
import type { EditorToolbarItem, TabsItem } from '@nuxt/ui'
import type {
  InsightsLocale,
  InsightsPost,
  InsightsReviewIssue,
  InsightsSource,
} from '../../shared/insightsPost'
import {
  INSIGHTS_FORMATS,
  INSIGHTS_LOCALES,
  INSIGHTS_QUOTE_MAX,
  INSIGHTS_STATES,
  insightsReadingMinutes,
  insightsReviewIssues,
} from '../../shared/insightsPost'
import { evidenceIsGrounded } from '../../../core/shared/evidenceGrounding'
import { insightsDay, insightsHost } from '../utils/insightsFormat'

/**
 * PROTOTYP (I0) — DER REDAKTIONS-EDITOR (§9.4).
 *
 * Er ist ein KLICKDUMMY: er speichert nichts, ruft kein Modell und kennt
 * keine Route. Was er zeigt, ist der ABLAUF, an dem die Umsetzung gemessen
 * wird — und die vier Stellen, an denen dieses Produkt anders ist als ein
 * Blog-Editor:
 *
 *  1. **Der Zustand ist die Sicherung, nicht die Disziplin** (§3.2). Der
 *     Übergang nach `review` ist GESPERRT, solange eine der sechs Prüfregeln
 *     offen ist — und die Liste sagt, welche und wo.
 *  2. **Der Beleg wird deterministisch geprüft**, nicht mit KI (§9.4): steht
 *     das Zitat WÖRTLICH in der Quelle? Die Ampel je Quelle ist genau diese
 *     Antwort. Der Riegel liegt seit BI1 I1a im FUNDAMENT
 *     (`core/shared/evidenceGrounding.ts`) und wird von hier gerufen — der
 *     Prototyp hatte ihn noch selbst gebaut, und zwar case-INSENSITIV: „WIR
 *     RÖSTEN SELBST" wäre als Beleg für „wir rösten selbst" durchgegangen.
 *  3. **Die zweite Fassung ist eine Fassung, kein Cache** (§11 Frage 4). Der
 *     Übersetzen-Knopf legt einen ENTWURF an; öffentlich wird er erst mit dem
 *     Häkchen „redigiert". Bis dahin steht über dem Feld, dass er maschinell
 *     ist.
 *  4. **Die Grundsprache wird gespeichert** (Entscheidung 3) — anders als
 *     beim UGC-Muster, wo es keine gespeicherte Ausgangssprache gibt. Ohne
 *     sie wüsste niemand, welche Fassung die redigierte ist.
 *
 * `UEditor` ist gesetzt (CLAUDE.md, „für Editor-Funktionen"), und der
 * Werkzeug-Vorrat ist an `core/shared/markdown.ts` GEKOPPELT: fett, kursiv,
 * Code, h2+h3, Listen, Link, Zitat, Codeblock — mehr kann der Parser nicht,
 * und alles darüber hinaus stünde als roher Text im Beitrag.
 */
const props = defineProps<{
  post: InsightsPost
  /** Der Rohtext je Quelle — nur damit ist die Beleg-Prüfung deterministisch. */
  sourceTexts?: Record<string, string>
  /** Marken-Zeilen, die es gibt (Prüfregel 6). */
  knownBrandIds?: readonly string[]
  /** Verlinkt der Beitrag die Methodik-Seite? (Prüfregel 5.) */
  methodologyLinked?: boolean
  /** Wörter, die der Herabsetzungs-Filter beanstandet (Prüfregel 4). */
  flagWords?: readonly string[]
}>()

const { t, locale } = useI18n()
const toast = useToast()

/* Der Entwurf, an dem gearbeitet wird. Eine KOPIE: der Klickdummy darf die
 * Demo-Daten nicht verändern, sonst „speichert" ein Reload mit. */
const draft = reactive<InsightsPost>({ ...props.post, sources: props.post.sources.map(source => ({ ...source })) })

const stateItems = computed(() => INSIGHTS_STATES.map(state => ({ label: t(`insights.state.${state}`), value: state })))
const formatItems = computed(() => INSIGHTS_FORMATS.map(format => ({ label: t(`insights.format.${format}`), value: format })))
const localeItems = computed(() => INSIGHTS_LOCALES.map(code => ({
  label: t(`insights.list.locale${code === 'de' ? 'De' : 'En'}`),
  value: code,
})))

/* Zwei Reiter: Grundfassung und zweite Fassung. Welche Sprache welcher Reiter
 * ist, hängt an `baseLocale` — nicht an einer festen Reihenfolge. */
const otherLocale = computed<InsightsLocale>(() => (draft.baseLocale === 'de' ? 'en' : 'de'))
const activeTab = ref<'base' | 'translation'>('base')
const tabs = computed<TabsItem[]>(() => [
  { label: `${t('insights.editor.tabBase')} · ${t(`insights.list.locale${draft.baseLocale === 'de' ? 'De' : 'En'}`)}`, value: 'base' },
  { label: `${t('insights.editor.tabTranslation')} · ${t(`insights.list.locale${otherLocale.value === 'de' ? 'De' : 'En'}`)}`, value: 'translation' },
])

const editing = computed<InsightsLocale>(() => (activeTab.value === 'base' ? draft.baseLocale : otherLocale.value))

/* Schreibende Zugriffe auf die richtige Sprachspalte. Ein `v-model` auf einen
 * berechneten Schlüssel wäre kürzer und würde beim Reiterwechsel in die
 * falsche Spalte schreiben, solange Vue den alten Wert noch hält. */
const titleValue = computed({
  get: () => (editing.value === 'de' ? draft.titleDe : draft.titleEn),
  set: (value: string) => { if (editing.value === 'de') draft.titleDe = value; else draft.titleEn = value },
})
const dekValue = computed({
  get: () => (editing.value === 'de' ? draft.dekDe : draft.dekEn),
  set: (value: string) => { if (editing.value === 'de') draft.dekDe = value; else draft.dekEn = value },
})
const bodyValue = computed({
  get: () => (editing.value === 'de' ? draft.bodyDe : draft.bodyEn),
  set: (value: string) => { if (editing.value === 'de') draft.bodyDe = value; else draft.bodyEn = value },
})

/* Der Werkzeug-Vorrat = was `core/shared/markdown.ts` lesen kann. */
const toolbarItems: EditorToolbarItem[] = [
  { kind: 'mark', mark: 'bold', icon: 'i-ph-text-b' },
  { kind: 'mark', mark: 'italic', icon: 'i-ph-text-italic' },
  { kind: 'mark', mark: 'code', icon: 'i-ph-code-simple' },
  { kind: 'heading', level: 2, icon: 'i-ph-text-h-two' },
  { kind: 'heading', level: 3, icon: 'i-ph-text-h-three' },
  { kind: 'bulletList', icon: 'i-ph-list-bullets' },
  { kind: 'orderedList', icon: 'i-ph-list-numbers' },
  { kind: 'link', icon: 'i-ph-link' },
  { kind: 'blockquote', icon: 'i-ph-quotes' },
  { kind: 'codeBlock', icon: 'i-ph-code' },
]
/* Durchgestrichen kennt der Parser nicht — der Editor bietet es gar nicht an. */
const editorStarterKit = { strike: false as const }

// ── Beleg-Prüfung (deterministisch, s. Kopf Nr. 2) ─────────────────────────

const checked = ref<Record<number, boolean>>({})

function quoteGrounded(source: InsightsSource): boolean {
  return evidenceIsGrounded({ quote: source.quote, pageText: props.sourceTexts?.[source.url] ?? '' })
}

function checkEvidence(index: number): void {
  const source = draft.sources[index]
  if (!source) return
  const ok = quoteGrounded(source)
  checked.value = { ...checked.value, [index]: ok }
  toast.add({
    title: ok ? t('insights.editor.evidenceOk') : t('insights.editor.evidenceFail'),
    color: ok ? 'success' : 'error',
    duration: 2500,
  })
}

// ── Die sechs Prüfregeln ───────────────────────────────────────────────────

const issues = computed<InsightsReviewIssue[]>(() => insightsReviewIssues(draft, {
  sourceTexts: props.sourceTexts,
  flagText: text => (props.flagWords ?? []).filter(word => text.toLowerCase().includes(word.toLowerCase())),
  knownBrandIds: props.knownBrandIds,
  methodologyLinked: props.methodologyLinked,
}))

const ISSUE_KEY: Record<string, string> = {
  quote_too_long: 'insights.editor.issue.quoteTooLong',
  quote_not_grounded: 'insights.editor.issue.quoteNotGrounded',
  source_missing_publisher: 'insights.editor.issue.sourceMissingPublisher',
  source_missing_date: 'insights.editor.issue.sourceMissingDate',
  source_missing_license: 'insights.editor.issue.sourceMissingLicense',
  fact_without_source: 'insights.editor.issue.factWithoutSource',
  disparagement: 'insights.editor.issue.disparagement',
  score_without_methodology: 'insights.editor.issue.scoreWithoutMethodology',
  brand_without_entity: 'insights.editor.issue.brandWithoutEntity',
}

function issueText(issue: InsightsReviewIssue): string {
  return t(ISSUE_KEY[issue.code] ?? 'insights.editor.issue.quoteNotGrounded', { max: INSIGHTS_QUOTE_MAX, detail: issue.detail ?? '' })
}

function issueWhere(issue: InsightsReviewIssue): string {
  if (!issue.at) return ''
  return t(`insights.editor.at.${issue.at.kind}`, { number: issue.at.index + 1 })
}

// ── Zustands-Übergänge (Klickdummy: sie ändern nur die Anzeige) ────────────

function toReview(): void {
  if (issues.value.length > 0) return
  draft.state = 'review'
}

function publish(): void {
  draft.state = 'published'
  draft.publishedAt = draft.publishedAt || new Date().toISOString().slice(0, 10)
}

/**
 * Der Übersetzen-Knopf. Im Produkt ruft er den REDAKTIONS-Endpunkt (§11
 * Frage 4, Drossel 10/Stunde + 50/Tag je Konto); hier setzt er nur den
 * Stempel, damit der ZUSTAND sichtbar wird: Entwurf da, Häkchen fehlt.
 */
function translate(): void {
  draft.translatedAt = new Date().toISOString().slice(0, 10)
  draft.translationModel = 'demo-modell'
  draft.translationPromptVersion = 'insights-t-1'
  draft.translationReviewed = false
  activeTab.value = 'translation'
}

/** Lesezeit beim „Speichern" — nie beim Lesen (§9.3). */
const readingMinutes = computed(() => insightsReadingMinutes(draft.baseLocale === 'de' ? draft.bodyDe : draft.bodyEn))
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <div class="min-w-0 space-y-4">
      <!-- Kopfzeile: Format · Grundsprache · Zustand -->
      <div class="bw-card p-6">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.editor.format') }}</p>
            <USelect v-model="draft.format" :items="formatItems" value-key="value" class="mt-1 w-44" />
          </div>
          <div>
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.editor.baseLocale') }}</p>
            <USelect v-model="draft.baseLocale" :items="localeItems" value-key="value" class="mt-1 w-40" />
          </div>
          <div class="ml-auto flex items-center gap-2">
            <span
              v-for="state in stateItems" :key="state.value"
              class="bw-label rounded-full px-3 py-1"
              :style="draft.state === state.value
                ? 'background: var(--bw-ink); color: var(--bw-paper)'
                : 'background: var(--bw-surface); color: var(--bw-muted)'"
            >{{ state.label }}</span>
          </div>
        </div>
        <p class="bw-pending mt-3">{{ t('insights.editor.baseLocaleNote') }}</p>
      </div>

      <!-- Zwei Sprach-Reiter -->
      <div class="bw-card p-6">
        <UTabs v-model="activeTab" :items="tabs" :content="false" size="sm" />

        <!-- Der Stempel über der zweiten Fassung, solange sie maschinell ist. -->
        <UAlert
          v-if="activeTab === 'translation' && draft.translatedAt && !draft.translationReviewed"
          class="mt-4" icon="i-ph-robot" color="warning" variant="subtle"
          :title="t('insights.editor.machineNote', { date: insightsDay(draft.translatedAt, locale) })"
        />

        <div class="mt-4 space-y-3">
          <UFormField :label="t('insights.editor.titleField')">
            <UInput v-model="titleValue" class="w-full" />
          </UFormField>
          <UFormField :label="t('insights.editor.dekField')">
            <UTextarea v-model="dekValue" :rows="2" class="w-full" />
          </UFormField>
          <UFormField :label="t('insights.editor.bodyField')">
            <UEditor
              v-slot="{ editor }"
              v-model="bodyValue"
              content-type="markdown"
              :starter-kit="editorStarterKit"
              :image="false"
              :mention="false"
              class="w-full rounded-md border border-default"
              :ui="{ base: 'px-3 py-2', content: 'min-h-48' }"
            >
              <UEditorToolbar :editor="editor" :items="toolbarItems" class="border-b border-default px-1.5 py-1" />
            </UEditor>
          </UFormField>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <UButton
            v-if="activeTab === 'translation'"
            :label="t('insights.editor.translate')" icon="i-ph-translate"
            color="neutral" variant="ghost" class="rounded-full" style="background: var(--bw-surface)"
            @click="translate"
          />
          <UCheckbox
            v-if="activeTab === 'translation' && draft.translatedAt"
            v-model="draft.translationReviewed"
            :label="t('insights.editor.translationReviewed')"
          />
          <p class="bw-label ml-auto" style="color: var(--bw-muted)">
            {{ t('insights.editor.readingMinutes', { count: readingMinutes }) }}
          </p>
        </div>
      </div>

      <!-- Quellen-Panel mit Beleg-Ampel -->
      <div class="bw-card p-6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.editor.sourcesPanel') }}</p>
          <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.sources.lead', { max: INSIGHTS_QUOTE_MAX }) }}</p>
        </div>
        <ul class="mt-4 space-y-4">
          <li v-for="(source, index) in draft.sources" :key="index" class="border-b pb-4 last:border-0" style="border-color: var(--bw-line)">
            <div class="flex flex-wrap items-center gap-2">
              <span class="bw-label" style="color: var(--bw-muted)">{{ index + 1 }}</span>
              <span class="bw-label" style="color: var(--bw-ink-soft)">{{ insightsHost(source.url) }}</span>
              <span class="bw-label" style="color: var(--bw-muted)">{{ source.publisher }} {{ source.date }}</span>
              <UButton
                :label="t('insights.editor.checkEvidence')" size="xs" color="neutral" variant="ghost"
                class="ml-auto rounded-full" style="background: var(--bw-surface)"
                @click="checkEvidence(index)"
              />
              <!-- Die Ampel: geprüft und wahr · geprüft und falsch · ungeprüft. -->
              <span
                class="bw-label inline-flex items-center gap-1"
                :style="checked[index] === undefined
                  ? 'color: var(--bw-muted)'
                  : (checked[index] ? 'color: var(--bw-accent)' : 'color: var(--bw-stale)')"
              >
                <UIcon
                  :name="checked[index] === undefined ? 'i-ph-circle-dashed' : (checked[index] ? 'i-ph-check-circle-fill' : 'i-ph-x-circle-fill')"
                  class="size-4"
                />
                {{ checked[index] === undefined
                  ? t('insights.editor.evidenceUnchecked')
                  : (checked[index] ? t('insights.editor.evidenceOk') : t('insights.editor.evidenceFail')) }}
              </span>
            </div>
            <UTextarea v-model="source.quote" :rows="2" class="mt-2 w-full" :maxlength="INSIGHTS_QUOTE_MAX" />
          </li>
        </ul>
      </div>
    </div>

    <!-- Rechte Spalte: die sechs Regeln und die Übergänge -->
    <aside class="space-y-4">
      <div class="bw-card p-6">
        <p class="bw-label" style="color: var(--bw-muted)">{{ t('insights.editor.rules') }}</p>

        <p v-if="issues.length === 0" class="mt-3 flex items-center gap-2 text-sm" style="color: var(--bw-accent)">
          <UIcon name="i-ph-check-circle-fill" class="size-4" />
          {{ t('insights.editor.rulesOk') }}
        </p>

        <template v-else>
          <p class="mt-3 flex items-center gap-2 text-sm" style="color: var(--bw-stale)">
            <UIcon name="i-ph-warning-circle-fill" class="size-4" />
            {{ t('insights.editor.rulesBlocked', { count: issues.length }) }}
          </p>
          <ul class="mt-3 space-y-2">
            <li v-for="(issue, index) in issues" :key="index" class="text-sm leading-snug" style="color: var(--bw-ink-soft)">
              {{ issueText(issue) }}
              <span v-if="issueWhere(issue)" class="bw-label block" style="color: var(--bw-muted)">{{ issueWhere(issue) }}</span>
            </li>
          </ul>
        </template>

        <div class="mt-5 flex flex-col gap-2">
          <UButton
            :label="t('insights.editor.toReview')" icon="i-ph-arrow-right"
            :disabled="issues.length > 0 || draft.state !== 'draft'"
            class="rounded-full" @click="toReview"
          />
          <UButton
            :label="t('insights.editor.publish')" icon="i-ph-check"
            :disabled="draft.state !== 'review'"
            color="neutral" variant="ghost" class="rounded-full" style="background: var(--bw-surface)"
            @click="publish"
          />
          <slot name="preview" :draft="draft" />
        </div>
      </div>

      <div class="bw-card p-6">
        <UFormField :label="t('insights.editor.noteInternal')">
          <UTextarea v-model="draft.noteInternal" :rows="3" class="w-full" />
        </UFormField>
      </div>
    </aside>
  </div>
</template>
