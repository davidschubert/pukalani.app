import type { MaybeRefOrGetter } from 'vue'
import {
  type BrandGenerationFailureCode,
  decodeBrandGenerationChunk,
} from '../../shared/brandGeneration'
import { useBrandWorkspaceStore } from '../stores/brandWorkspace'

/**
 * DER STREAMING-CLIENT (§3e) — er hört zu, während George schreibt.
 *
 * `fetch` + `ReadableStream`, nicht `EventSource`: ein `EventSource` kann nur
 * GET und trüge weder Rumpf noch Abbruch. Gelesen wird mit
 * `decodeBrandGenerationChunk()` aus `shared/` — derselben puren Regel, mit der
 * der Server schreibt.
 *
 * ── VIER ZUSTÄNDE, UND KEIN FÜNFTER ───────────────────────────────────────
 * `idle → streaming → done | failed`. Was schiefging, steht in `failureCode`
 * und ist entweder einer der Server-Codes oder `request_rejected` (ein Gate hat
 * schon vor dem Strom mit HTTP abgewiesen). Die Oberfläche macht daraus einen
 * ruhigen Hinweis — `ai_disabled` und `no_generator` sind BETRIEBSZUSTÄNDE, kein
 * Unglück: der Stand bleibt voll bearbeitbar (§9b.5), und ein Fehler-Toast
 * behauptete das Gegenteil.
 *
 * ── ERST SPEICHERN, DANN GENERIEREN ───────────────────────────────────────
 * Der Server baut den Prompt aus den GESPEICHERTEN Quell-Slots. Läuft noch eine
 * entprellte Eingabe, entwürfe George aus einem Stand, den der Mensch gerade
 * überholt hat. Deshalb `beforeGenerate` — die Seite reicht `autosave.flush`
 * herein.
 *
 * ── DIE NEUE `revision` WIRD ÜBERNOMMEN, UND ZWAR HIER ────────────────────
 * Die Route hat den Entwurf schon geschrieben (Persistenz vor `completed`,
 * Plan §6) und damit `brand_steps.revision` erhöht. Ohne `applyGenerationRevision`
 * schickte der nächste Autosave die ALTE Fassung — und der Mensch bekäme den
 * 409-Konfliktdialog für eine Änderung, die er selbst ausgelöst hat.
 *
 * ── DER ENTWURF IST EINE LOKALE EINGABE ───────────────────────────────────
 * `slot.ready` schreibt in `localEdits`, MARKIERT als Georges Entwurf
 * (§3b.3) — nicht in `serverSlots`. Zwei Fassungen bleiben zwei Fassungen: der
 * 409-Vertrag hängt genau daran, und ein Entwurf, der sich als Serverfassung
 * ausgäbe, machte den nächsten echten Konflikt unauflösbar.
 */

export type BrandGenerationStatus = 'idle' | 'streaming' | 'done' | 'failed'

/** Server-Codes plus der eine Fall, den es nur beim Client gibt. */
export type BrandGenerationClientFailure = BrandGenerationFailureCode | 'request_rejected'

export interface UseBrandGenerationOptions {
  /** Vor dem Start ausführen — die Seite reicht hier `autosave.flush` herein. */
  beforeGenerate?: () => Promise<void> | void
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `k${Date.now()}${Math.random().toString(36).slice(2, 10)}`
}

export function useBrandGeneration(
  profileId: MaybeRefOrGetter<string>,
  options: UseBrandGenerationOptions = {},
) {
  const store = useBrandWorkspaceStore()

  const status = ref<BrandGenerationStatus>('idle')
  const activeSlotId = ref<string | null>(null)
  const failureCode = ref<BrandGenerationClientFailure | null>(null)

  let controller: AbortController | null = null

  const streaming = computed(() => status.value === 'streaming')

  /** Läuft für DIESEN Slot gerade etwas? Die Knöpfe der anderen bleiben aktiv. */
  function isStreamingSlot(slotId: string): boolean {
    return streaming.value && activeSlotId.value === slotId
  }

  function stop(): void {
    controller?.abort()
  }

  async function generate(slotId: string, hint = ''): Promise<void> {
    // Eine Generierung zur Zeit — dieselbe Regel wie auf dem Server
    // (`generation_active`), nur früher und ohne Roundtrip.
    if (streaming.value) return

    await options.beforeGenerate?.()

    const stepKey = store.stepKey
    if (!stepKey) return

    controller = new AbortController()
    status.value = 'streaming'
    activeSlotId.value = slotId
    failureCode.value = null

    let generationId = ''

    try {
      const response = await fetch(
        `/api/brand/profiles/${toValue(profileId)}/steps/${stepKey}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
          body: JSON.stringify({
            slotId,
            ...(hint.trim() ? { hint: hint.trim() } : {}),
            // Ein Schlüssel je Knopfdruck: wiederholt der Client denselben
            // Aufruf (Netzhänger), liefert der Server den bereits erzeugten
            // Entwurf zurück, statt ein zweites Mal zu generieren.
            idempotencyKey: newIdempotencyKey(),
          }),
          signal: controller.signal,
        },
      )

      if (!response.ok || !response.body) {
        // Ein Gate hat vor dem Strom abgewiesen (400/403/404). Der GRUND bleibt
        // beim Server — die Oberfläche sagt nur, dass es gerade nicht geht.
        status.value = 'failed'
        failureCode.value = 'request_rejected'
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const step = decodeBrandGenerationChunk(buffer, decoder.decode(value, { stream: true }))
        buffer = step.buffer
        for (const item of step.events) {
          generationId = item.generationId
          if (item.type === 'generation.started') {
            store.beginGeorgeMessage(item.generationId)
          }
          else if (item.type === 'message.delta') {
            store.appendGeorgeDelta(item.generationId, item.text)
          }
          else if (item.type === 'slot.ready') {
            store.applyGeorgeDraft(item.slotId, item.draft, item.generationId)
          }
          else if (item.type === 'generation.completed') {
            store.applyGenerationRevision(item.revision)
            store.endGeorgeMessage(item.generationId)
            status.value = 'done'
          }
          else {
            store.endGeorgeMessage(item.generationId)
            failureCode.value = item.code
            status.value = 'failed'
          }
        }
      }

      // Der Strom endete ohne Abschluss-Frame (Server weg, Proxy dazwischen).
      // Das ist ein Fehlschlag und wird auch so genannt — ein hängendes
      // „schreibt gerade …" wäre die schlechtere Lüge.
      if (status.value === 'streaming') {
        if (generationId) store.endGeorgeMessage(generationId)
        status.value = 'failed'
        failureCode.value = 'provider_error'
      }
    }
    catch {
      // Abbruch UND Netzfehler landen hier. Beide lassen den bisherigen Entwurf
      // unangetastet (§3e) — geschrieben hat der Server ohnehin nichts.
      if (generationId) store.endGeorgeMessage(generationId)
      status.value = 'failed'
      failureCode.value = controller?.signal.aborted ? 'aborted' : 'provider_error'
    }
    finally {
      controller = null
      activeSlotId.value = null
    }
  }

  /** Den Hinweis wegräumen, sobald der Mensch ihn gesehen hat. */
  function dismissFailure(): void {
    failureCode.value = null
    if (status.value === 'failed') status.value = 'idle'
  }

  if (import.meta.client) {
    onBeforeUnmount(() => stop())
  }

  return { status, streaming, activeSlotId, failureCode, isStreamingSlot, generate, stop, dismissFailure }
}
