import type { MaybeRefOrGetter } from 'vue'
import {
  type BrandAiRejectionCode,
  isBrandAiRejectionCode,
} from '../../shared/brandAiLimits'
import { decodeBrandGenerationChunk } from '../../shared/brandGeneration'
import { isBrandUiLocale } from '../../shared/brandUiLocale'
import { useBrandWorkspaceStore } from '../stores/brandWorkspace'

/**
 * DIE ANTWORT-SEITE DES GESPRÄCHS (P3.2) — der Berater reagiert auf das, was
 * der Mensch getippt hat.
 *
 * Sie ist die kleine Schwester von `useBrandGeneration()` und teilt deren
 * Protokoll, deren Leser (`decodeBrandGenerationChunk`) und deren
 * Store-Aktionen. Was fehlt, ist alles, was mit einem FELD zu tun hat: kein
 * `slot.ready`, keine Entwurfs-Markierung, keine `revision`. Ein Zug ist eine
 * Sprechblase, sonst nichts.
 *
 * ── DREI ARTEN, NICHTS ZU TUN — UND ZWEI DAVON SIND STILL ────────────────
 * 1. `{ conversed: false }` (kein Strom): der Kill-Switch ist aus, der Zug lief
 *    schon oder der Baustein ist gerade belegt. Die Werkstatt verhält sich
 *    exakt wie vor P3.2 — die Antwort steht im Feld, die nächste Frage
 *    erscheint. KEIN Hinweis: es ist nichts schiefgegangen.
 * 2. Ein abgerissener Strom, ein kaputter Anbieter, ein leerer Zug: die
 *    angefangene Sprechblase verschwindet (`endGeorgeMessage` wirft leere Züge
 *    weg), und mehr passiert nicht. Auch hier kein Hinweis — die Antwort des
 *    Menschen ist gespeichert, die Arbeit geht weiter, und ein roter Balken
 *    über eine ausgefallene Reaktion wäre lauter als der Verlust.
 * 3. Die DROSSEL (429) ist die eine Ausnahme. Sie sagt etwas, das der Mensch
 *    sonst selbst herausfinden müsste, nachdem der Berater dreimal geschwiegen
 *    hat: „nicht kaputt, sondern für heute genug". Deshalb reist ihr Grund als
 *    `failureCode` nach oben und wird zu einer ruhigen Zeile.
 *
 * ── DER DOPPEL-SENDE-SCHUTZ STEHT AN ZWEI STELLEN ────────────────────────
 * Hier (`pending` — ein zweiter Aufruf kehrt sofort um) und in der Oberfläche
 * (der Senden-Knopf ist währenddessen aus). Zwei, weil sie verschiedene Dinge
 * tun: der Knopf verhindert den Griff, dieser hier den Wettlauf. Der Server hat
 * noch einen dritten (Idempotenzschlüssel + Baustein-Sperre) — der ist die
 * einzige Sicherung, die auch über zwei Browser-Tabs hinweg greift.
 */

/** Nur die Drossel wird gemeldet; alles andere bleibt still (s. Kopf). */
export type BrandConversationFailure = BrandAiRejectionCode

export interface BrandConverseInput {
  /** Was der Mensch getippt hat. */
  text: string
  /** Der Frage-Slot, dessen Antwort das war — bei einer freien Frage keiner. */
  slotId?: string
  /** Wortlaut dieser Frage, wie er im Panel stand. */
  question?: string
  /** Der Slot, dessen Frage das Panel als nächste zeigt. */
  nextSlotId?: string
  nextQuestion?: string
  /** Lokal übersprungene Slots („Weiß ich nicht") — ohne sie rechnet der Server anders. */
  skipped?: readonly string[]
}

export interface UseBrandConversationOptions {
  /** Vor dem Zug ausführen — die Seite reicht hier `autosave.flush` herein. */
  beforeSend?: () => Promise<void> | void
}

async function envelopeReason(response: Response): Promise<string | null> {
  const body = await response.json().catch(() => null) as { reason?: unknown } | null
  return typeof body?.reason === 'string' ? body.reason : null
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `k${Date.now()}${Math.random().toString(36).slice(2, 10)}`
}

export function useBrandConversation(
  profileId: MaybeRefOrGetter<string>,
  options: UseBrandConversationOptions = {},
) {
  const store = useBrandWorkspaceStore()
  // Die Sprache der SEITE, nicht die des Cookies — dieselbe Begründung wie bei
  // der Generierung (`shared/brandUiLocale.ts`).
  const { locale } = useI18n()

  /** Schreibt der Berater gerade? Daran hängt der Schreibindikator im Panel. */
  const pending = ref(false)
  const failureCode = ref<BrandConversationFailure | null>(null)

  /**
   * KAM ÜBERHAUPT EIN ZUG? — und WELCHE Frage hat er gestellt?
   *
   * Beides braucht die Werkstatt für genau eine Entscheidung: ob unter dem Zug
   * noch die Katalog-Frage stehen soll. Hat der Berater sie gerade in eigenen
   * Worten gestellt, wäre sie ein zweites Mal genau das Formular-Gefühl, gegen
   * das diese Runde gebaut ist.
   *
   * Der Server sagt es im Abschluss-Frame (`slotId`), und er sagt es GENAU
   * dann, wenn er dem Berater den Wortlaut auch wirklich gegeben hat — bei
   * einem überholten Stand steht dort `''`, der Berater hat auf die Frage
   * daneben verwiesen, und die Katalog-Frage gehört sichtbar hin. Aus dem
   * AUSBLEIBEN eines Frames lässt sich das nicht schliessen: „nichts gekommen"
   * ist auch der Zustand eines abgerissenen Stroms.
   */
  const spoke = ref(false)
  const coveredSlotId = ref<string | null>(null)

  let controller: AbortController | null = null

  async function converse(input: BrandConverseInput): Promise<void> {
    if (pending.value) return

    // ERST SPEICHERN, DANN REDEN: der Server baut den Zug aus dem GESPEICHERTEN
    // Stand des Bausteins und rechnet daraus auch, welche Frage als nächste
    // dran ist. Ohne dieses Ausspülen hielte er die gerade gegebene Antwort für
    // noch offen und liesse den Berater dieselbe Frage ein zweites Mal stellen.
    await options.beforeSend?.()

    const stepKey = store.stepKey
    if (!stepKey) return

    controller = new AbortController()
    pending.value = true
    failureCode.value = null
    spoke.value = false
    coveredSlotId.value = null

    let turnId = ''

    try {
      const response = await fetch(
        `/api/brand/profiles/${toValue(profileId)}/steps/${stepKey}/converse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
          body: JSON.stringify({
            text: input.text,
            ...(input.slotId ? { slotId: input.slotId } : {}),
            ...(input.question?.trim() ? { question: input.question.trim() } : {}),
            ...(input.nextSlotId ? { nextSlotId: input.nextSlotId } : {}),
            ...(input.nextQuestion?.trim() ? { nextQuestion: input.nextQuestion.trim() } : {}),
            ...(input.skipped?.length ? { skipped: [...input.skipped] } : {}),
            ...(isBrandUiLocale(locale.value) ? { uiLocale: locale.value } : {}),
            idempotencyKey: newIdempotencyKey(),
          }),
          signal: controller.signal,
        },
      )

      if (!response.ok || !response.body) {
        // Nur die Drossel nennt ihren Grund; jedes andere Nein bleibt still.
        failureCode.value = response.status === 429
          ? (code => (isBrandAiRejectionCode(code) ? code : null))(await envelopeReason(response))
          : null
        return
      }

      // `{ conversed: false }` — kein Strom, kein Zug, kein Hinweis (s. Kopf).
      // Erkannt am Kopf und nicht am Rumpf: den Rumpf zu lesen hiesse, den
      // Strom anzufassen, bevor klar ist, dass es einer ist.
      if (!response.headers.get('content-type')?.includes('text/event-stream')) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const step = decodeBrandGenerationChunk(buffer, decoder.decode(value, { stream: true }))
        buffer = step.buffer
        for (const item of step.events) {
          turnId = item.generationId
          if (item.type === 'generation.started') store.beginGeorgeMessage(item.generationId)
          else if (item.type === 'message.delta') store.appendGeorgeDelta(item.generationId, item.text)
          else if (item.type === 'generation.completed') {
            spoke.value = true
            coveredSlotId.value = item.slotId || null
            // ANTWORT-MÖGLICHKEITEN, falls der Zug eine Wahl anbietet (Davids
            // Anforderung 2026-09-04). VOR dem Abschluss gesetzt, damit der Zug
            // in EINEM Schritt fertig und beknopft wird — sonst rendert die
            // Bühne für einen Wimpernschlag eine Frage ohne ihre Knöpfe.
            if (item.options?.length) store.setGeorgeMessageOptions(item.generationId, item.options)
            store.endGeorgeMessage(item.generationId)
          }
          // `slot.ready` kommt hier NIE — die Route hat keinen Pfad dorthin.
          // Ein Zweig dafür wäre ein Angebot an den nächsten Umbau.
          else store.endGeorgeMessage(item.generationId)
        }
      }

      // Der Strom endete ohne Abschluss-Frame. Die Sprechblase darf nicht mit
      // blinkendem Cursor stehen bleiben; ein Hinweis ist es trotzdem nicht.
      if (turnId) store.endGeorgeMessage(turnId)
    }
    catch {
      // Abbruch UND Netzfehler: die angefangene Blase schliessen, sonst nichts.
      if (turnId) store.endGeorgeMessage(turnId)
    }
    finally {
      controller = null
      pending.value = false
    }
  }

  function stop(): void {
    controller?.abort()
  }

  function dismissFailure(): void {
    failureCode.value = null
  }

  if (import.meta.client) {
    onBeforeUnmount(() => stop())
  }

  /** Beim Baustein-Wechsel beginnt ein neues Gespräch (§3e). */
  function reset(): void {
    spoke.value = false
    coveredSlotId.value = null
    failureCode.value = null
  }

  return { pending, failureCode, spoke, coveredSlotId, converse, stop, dismissFailure, reset }
}
