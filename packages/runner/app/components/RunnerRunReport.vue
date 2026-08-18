<script setup lang="ts">
import type { RunRow } from '../../shared/types/runner'

/**
 * Der Abschlussbericht eines Laufs — docs/plans/AI-RUNNER.md § 3.4/§ 9.
 *
 * Branch, Commit, Diffstat, Tests, Dauer, Kosten und Session-Id sind
 * STRUKTURIERTE Daten, keine Fließtext-Nachricht — deshalb eine
 * Beschreibungsliste und kein Kommentar (§ 3.4 begründet, warum der MVP
 * bewusst nicht den comments-Layer in die Betreiber-Konsole zieht).
 *
 * DEFENSIV GEGENÜBER `resultJson`: der Inhalt kommt von einem Programm auf
 * einem fremden Rechner und ist ein Text in einer Datenbankspalte. Lässt er
 * sich nicht lesen, zeigt der Bericht den ROHTEXT — eine leere Karte wäre die
 * schlechteste aller Antworten, gerade wenn ein Lauf schiefging.
 */
const props = defineProps<{ run: RunRow }>()

const { t } = useI18n()

/** Was wir zu lesen versuchen. Alles optional — der Runner darf wachsen. */
interface RunResult {
  commit?: string
  diffstat?: string
  tests?: string
  costUsd?: number
  durationMs?: number
  branch?: string
  /** Das effektiv gefahrene Modell (nach dem Kappen); fehlt bei Alt-Läufen */
  model?: string
  /** Datei-Id des vollen Transkripts im Bucket `runner-files`; fehlt bei Alt-Läufen */
  transcriptFileId?: string
}

const parsed = computed<{ result: RunResult | null, raw: string }>(() => {
  const raw = props.run.resultJson
  if (!raw) return { result: null, raw: '' }
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { result: null, raw }
    return { result: value as RunResult, raw }
  }
  catch {
    return { result: null, raw }
  }
})

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  // Ein verschachteltes Test-Ergebnis lieber als JSON zeigen als gar nicht.
  return value === undefined || value === null ? '' : JSON.stringify(value)
}

const durationText = computed(() => {
  const fromResult = parsed.value.result?.durationMs
  if (typeof fromResult === 'number') return formatDurationMs(fromResult)
  // Rückfall auf die STEMPEL der Zeile (siehe app/utils/runFormat.ts): sie
  // sind da, auch wenn der Runner keine Dauer meldet.
  const ms = runDurationMs(props.run)
  return ms === null ? '' : formatDurationMs(ms)
})

const rows = computed(() => {
  const result = parsed.value.result
  return [
    { key: 'branch', label: t('runner.report.branch'), value: props.run.workBranch || text(result?.branch), mono: true },
    { key: 'commit', label: t('runner.report.commit'), value: text(result?.commit), mono: true },
    { key: 'diffstat', label: t('runner.report.diffstat'), value: text(result?.diffstat), mono: true },
    { key: 'tests', label: t('runner.report.tests'), value: text(result?.tests), mono: false },
    { key: 'duration', label: t('runner.report.duration'), value: durationText.value, mono: false },
    { key: 'cost', label: t('runner.report.cost'), value: typeof result?.costUsd === 'number' ? `$${result.costUsd.toFixed(2)}` : '', mono: false },
    // Das EFFEKTIVE Modell aus dem Bericht des Runners (nach dem Kappen,
    // § 7.2 Schritt 3) — `run.model` ist nur der Wunsch. Rückfall für Läufe
    // von vor diesem Feld.
    { key: 'model', label: t('runner.report.model'), value: typeof result?.model === 'string' && result.model ? result.model : props.run.model, mono: false },
    { key: 'repo', label: t('runner.report.repo'), value: props.run.repoKey, mono: true },
    { key: 'session', label: t('runner.report.session'), value: props.run.sessionId, mono: true },
  ].filter(row => row.value)
})

/**
 * Der Download-Link erscheint NUR, wenn der Bericht eine Transkript-Id trägt —
 * sonst läuft die Route ohnehin in ein 404 (§ 5/§ 9). Ein gewöhnlicher
 * `<a download>` genügt: die Board-Route liefert die Datei als Anhang, es gibt
 * keine getippte Antwort zu binden.
 */
const transcriptHref = computed(() =>
  parsed.value.result?.transcriptFileId ? `/api/runner/runs/${props.run.$id}/transcript` : '',
)
</script>

<template>
  <div class="space-y-3" data-runner-report>
    <!-- Der GRUND zuerst, wenn etwas schiefging: alles andere ist dann Beiwerk -->
    <UAlert
      v-if="run.status === 'failed' && run.error"
      color="error"
      variant="subtle"
      icon="i-ph-x-circle"
      :title="t('runner.report.failed')"
      :description="run.error"
    />
    <UAlert
      v-else-if="run.status === 'needs_input'"
      color="warning"
      variant="subtle"
      icon="i-ph-question"
      :title="t('runner.report.needsInputTitle')"
      :description="t('runner.report.needsInputText')"
    />

    <dl v-if="rows.length" class="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <template v-for="row in rows" :key="row.key">
        <dt class="text-sm text-muted">{{ row.label }}</dt>
        <dd class="min-w-0 break-words text-sm" :class="row.mono ? 'font-mono text-xs' : ''">{{ row.value }}</dd>
      </template>
    </dl>

    <!-- Volles Transkript herunterladen — nur wenn der Runner eins abgelegt hat -->
    <UButton
      v-if="transcriptHref"
      :to="transcriptHref"
      external
      download
      color="neutral"
      variant="subtle"
      size="sm"
      icon="i-ph-download-simple"
      :label="t('runner.report.transcript')"
    />

    <!-- Unlesbares JSON: lieber roh zeigen als schweigen (siehe Kopf) -->
    <div v-if="parsed.raw && !parsed.result">
      <p class="text-sm text-muted">{{ t('runner.report.raw') }}</p>
      <pre class="mt-1 max-h-48 overflow-auto rounded-md bg-elevated p-2 text-xs">{{ parsed.raw }}</pre>
    </div>

    <p v-else-if="!rows.length && run.status !== 'failed'" class="text-sm text-muted">
      {{ t('runner.report.none') }}
    </p>
  </div>
</template>
