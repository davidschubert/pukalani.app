<script setup lang="ts">
import { parseTicketChecklist } from '../../../../packages/tickets/app/utils/ticketMarkdown'
import type { TicketFilesResponse, TicketFileRow, TicketRow } from '../../../../packages/tickets/shared/types/ticket'
import type { RunAttachmentSource } from '../../../../packages/runner/shared/types/runner'

/**
 * DIE VERDRAHTUNG (A14): dieser Override füllt den Platzhalter
 * `TicketModalRunner` des tickets-Layers mit dem Lauf-Bereich des
 * runner-Layers. Nur DIESE App darf das — `tickets` kennt `runner` nicht und
 * `runner` kennt `tickets` nicht (docs/plans/AI-RUNNER.md § 3.1); beide treffen
 * sich erst hier, wo die Site ihre Produkte komponiert. Dasselbe Muster ist für
 * `TicketModalComments` vorgesehen.
 *
 * Die Aufgabe der Komponente ist genau eine: aus einem TICKET einen AUFTRAG
 * machen — und die Frage nach der Herkunft des Textes beantworten.
 */
const props = defineProps<{ ticket: TicketRow }>()

const { t } = useI18n()

/**
 * DER AUFTRAG. Titel als Überschrift, dann die Beschreibung, dann die noch
 * OFFENEN Punkte der Checkliste.
 *
 * DIE BESCHREIBUNG WIRD ROH ÜBERNOMMEN: sie IST Markdown (das Modal
 * bearbeitet sie mit `UEditor`, `content-type="markdown"`), und ein Agent
 * liest Markdown besser als jede Umformung. Sie hier durch den HTML-Renderer
 * zu schicken hiesse, Struktur wegzuwerfen und Tags einzuführen.
 *
 * ERLEDIGTE Punkte bleiben draussen: sie sind Vergangenheit, und im Auftrag
 * würden sie wie Arbeit aussehen. Ist die ganze Checkliste abgehakt, fehlt der
 * Abschnitt.
 *
 * TESTBEFEHLE STEHEN BEWUSST NICHT HIER: die wählt das Formular des
 * Lauf-Bereichs, und sie reisen als eigenes Feld (`testCommands`). Zweimal
 * dieselbe Angabe — einmal als Fliesstext, einmal als Liste — wäre eine
 * Einladung, dass beide auseinanderlaufen.
 */
const promptSource = computed(() => {
  const lines: string[] = [`# ${props.ticket.title}`, '']

  const description = props.ticket.description.trim()
  if (description) lines.push(description, '')

  const open = parseTicketChecklist(props.ticket.checklist).filter(item => !item.done)
  if (open.length) {
    lines.push('## Checkliste', '')
    for (const item of open) lines.push(`- [ ] ${item.text}`)
    lines.push('')
  }

  return lines.join('\n')
})

/**
 * DIE HERKUNFTS-REGEL AUS § 8.2, und sie ist der Grund, warum dieser Override
 * überhaupt eine Entscheidung trifft:
 *
 * `feedbackId !== ''` heisst, dass dieses Ticket aus einer Rückmeldung
 * entstanden ist (`createTicketFromFeedback`) — und Rückmeldungen nimmt
 * `feedback/index.post.ts` BEWUSST auch von Gästen an. Im Beschreibungstext
 * kann dann fremder Text stehen, und fremder Text in einem Agenten-Auftrag ist
 * ein Prompt-Injection-Pfad. Dass ein Mensch auf „Übernehmen" geklickt hat,
 * ist kein Schutz: er liest nicht jede Zeile.
 *
 * Folge: `promptTrusted: false` ⇒ nur `plan` und `acceptEdits` (das Formular
 * zeigt nur die zwei, die Route weist die anderen ab, und der Runner prüft es
 * ein drittes Mal). Das RAHMEN des fremden Textes als Zitat in `prompt.md`
 * macht der RUNNER — hier wird nur die Herkunft gemeldet, nicht der Text
 * umgebaut.
 */
const promptTrusted = computed(() => props.ticket.feedbackId === '')

/**
 * Die Anhänge des Tickets als LAZY Quellen: geladen wird eine Datei erst,
 * wenn wirklich ein Lauf startet. Sonst zöge jedes Öffnen einer Karte mit drei
 * Screenshots drei Downloads nach sich — für einen Knopf, den man selten
 * drückt.
 *
 * Der Lauf bekommt eine KOPIE in seinen eigenen Bucket (§ 6): der Runner hat
 * nur ein Bearer-Secret und käme an die Ticket-Route (`tickets.manage`,
 * Session) gar nicht heran.
 */
const files = ref<TicketFileRow[]>([])
watch(() => props.ticket.$id, async (id) => {
  files.value = []
  /**
   * NICHT AUF DEM SERVER. Der Bereich hängt in einem Modal, das erst auf Klick
   * öffnet — SSR hat hier nichts zu holen. Und ein `$fetch` im SSR reicht die
   * Session-Cookies nicht weiter (das tut nur `useFetch`): die Antwort wäre
   * ein 401, der Fehlerzweig setzte die Liste leer, und weil die Ticket-Id
   * sich beim Hydrieren nicht ändert, bliebe sie es. Ein Lauf ohne Anhänge,
   * ohne dass irgendwo etwas schiefging.
   */
  if (import.meta.server || !id) return
  try {
    const response = await $fetch<TicketFilesResponse>(`/api/tickets/${id}/files`)
    files.value = response.files
  }
  catch {
    // Fail-soft: ohne Anhänge starten ist besser als gar nicht starten können.
    files.value = []
  }
}, { immediate: true })

const attachments = computed<RunAttachmentSource[]>(() => files.value.map(file => ({
  name: file.name,
  blob: () => $fetch<Blob>(`/api/tickets/files/${file.fileId}`, { responseType: 'blob' }),
})))
</script>

<template>
  <section>
    <h3 class="mb-1 flex items-center gap-1.5 text-sm font-semibold">
      <UIcon name="i-ph-rocket-launch" class="size-4" />
      {{ t('control.ticketRunner.title') }}
    </h3>
    <p class="mb-3 text-xs text-muted">{{ t('control.ticketRunner.hint') }}</p>
    <RunnerRunPanel
      subject-type="ticket"
      :subject-id="ticket.$id"
      :prompt-source="promptSource"
      :prompt-trusted="promptTrusted"
      :attachments="attachments"
    />
  </section>
</template>
