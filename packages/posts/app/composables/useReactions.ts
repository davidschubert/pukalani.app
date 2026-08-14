import {
  type ReactionCount,
  type ReactionKey,
  REACTION_KEYS,
  toggledChips,
} from '../../shared/reactions'
import type { ReactionToggleResponse, ReactionsResponse } from '../../shared/types/post'

/**
 * DIE CLIENT-SEITE DER EMOJI-REAKTIONEN (F57 Mechanik 1).
 *
 * ── EINE ABFRAGE JE SEITE, NICHT EINE JE KARTE ────────────────────────────
 * Jede `ReactionBar` meldet beim Einhängen nur ihre Ziel-Id an; die Abfrage
 * selbst wird bis zum Ende des Ticks GESAMMELT und dann EINMAL gestellt. Bei
 * 25 Themen sind das 1 Anfrage statt 25 — und zwar ohne dass die Karten
 * voneinander wissen müssten. Die Alternative (jede Karte holt sich ihre
 * eigenen Zahlen) ist genau die N+1-Falle, die dieser Layer an anderer Stelle
 * schon einmal bezahlt hat.
 *
 * ── WARUM HIER (NOCH) KEINE REALTIME HÄNGT — bewusste Entscheidung ────────
 * Technisch wäre es billig: die Zeilen haben Leser (Row-Permissions), also
 * veröffentlicht Appwrite Ereignisse, und `useRealtimeRows` multiplext über
 * denselben Socket. Dagegen sprechen zwei Dinge, die zusammen den Ausschlag
 * geben:
 *  - Ein eingehendes Ereignis müsste INKREMENTELL auf den richtigen Chip
 *    gerechnet werden. Die eigene Handlung kommt dabei ZWEIMAL an (einmal als
 *    Antwort der Route, einmal als Ereignis) — ohne Abgleich über die Row-Id
 *    zählt die eigene Reaktion doppelt, und das ist genau die Sorte Fehler,
 *    die man erst in Gesellschaft bemerkt.
 *  - Eine Reaktion ist kein Zustand, auf den jemand WARTET. Anders als eine
 *    neue Antwort oder eine Sofort-Abmeldung verliert niemand etwas, wenn die
 *    Zahl erst beim nächsten Aufschlagen stimmt.
 * Die Anzeige fühlt sich trotzdem sofort an, weil das Umschalten OPTIMISTISCH
 * rechnet (`toggledChips`, dieselbe pure Regel wie auf dem Server) und die
 * Antwort den autoritativen Stand nachlegt. Wer Realtime nachrüstet, dockt an
 * `applyServerState()` an und braucht dort die Row-Id-Entdopplung.
 */

/** Ziel-Id → Chips. Über `useState`, damit SSR und Client denselben Stand teilen. */
function reactionState() {
  return useState<Record<string, ReactionCount[]>>('posts:reactions', () => ({}))
}

/** Der in DIESER App erlaubte Satz — kommt vom Server, nie aus der Registry. */
function allowedState() {
  return useState<ReactionKey[]>('posts:reactions:allowed', () => [...REACTION_KEYS])
}

/**
 * Die Sammelstelle. MODULWEIT und damit ausdrücklich nur für den Browser
 * gedacht: auf dem Server teilten sich sonst zwei gleichzeitige Requests eine
 * Warteschlange. Betreten wird sie deshalb ausschließlich aus `onMounted`.
 */
const pending = new Set<string>()
let scheduled: ReturnType<typeof setTimeout> | null = null

export function useReactions() {
  const chips = reactionState()
  const allowed = allowedState()

  /** Den autoritativen Stand eines Ziels übernehmen. */
  function applyServerState(targetId: string, next: ReactionCount[]) {
    chips.value = { ...chips.value, [targetId]: next }
  }

  async function flush() {
    scheduled = null
    const ids = [...pending]
    pending.clear()
    if (ids.length === 0) return

    try {
      const response = await $fetch<ReactionsResponse>('/api/posts/discussions/reactions', {
        query: { targetIds: ids.join(',') },
      })
      allowed.value = response.allowed
      /**
       * AUCH DIE LEEREN ZIELE EINTRAGEN — sonst gilt „noch nicht geladen" und
       * „hat keine Reaktionen" als derselbe Zustand, und die Leiste bliebe auf
       * einem reaktionslosen Beitrag für immer im Ladezustand.
       */
      const merged = { ...chips.value }
      for (const id of ids) merged[id] = response.reactions[id] ?? []
      chips.value = merged
    }
    catch {
      // Reaktionen sind Beiwerk: eine gescheiterte Abfrage darf die Seite
      // nicht stören. Beim nächsten Aufschlagen wird es erneut versucht.
    }
  }

  /** Ein Ziel anmelden — gebündelt wird für uns. */
  function requestReactions(targetId: string) {
    if (!targetId || !import.meta.client) return
    if (chips.value[targetId]) return
    pending.add(targetId)
    if (scheduled === null) scheduled = setTimeout(flush, 0)
  }

  /**
   * Umschalten — optimistisch, dann autoritativ.
   *
   * Schlägt der Aufruf fehl, wird der VORHERIGE Stand zurückgelegt: eine
   * Anzeige, die eine nicht gespeicherte Reaktion behält, ist schlimmer als
   * gar keine Reaktion (der Nutzer glaubt, er hätte reagiert).
   */
  async function toggleReaction(targetId: string, reaction: ReactionKey): Promise<void> {
    const before = chips.value[targetId] ?? []
    applyServerState(targetId, toggledChips(before, reaction, allowed.value))

    try {
      const response = await $fetch<ReactionToggleResponse>('/api/posts/discussions/reactions', {
        method: 'POST',
        body: { targetType: 'post', targetId, reaction },
      })
      applyServerState(response.targetId, response.reactions)
    }
    catch (error) {
      applyServerState(targetId, before)
      throw error
    }
  }

  return { chips, allowed, requestReactions, toggleReaction, applyServerState }
}
