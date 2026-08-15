import {
  type ReactionCount,
  type ReactionKey,
  type ReactionSummary,
  REACTION_KEYS,
  toggledChips,
} from '../../../core/shared/reactions'
import type { CommentReactionToggleResponse } from '../../shared/types/comment'

/**
 * DIE CLIENT-SEITE DER ANTWORT-REAKTIONEN (F57, Davids Entscheidung
 * 2026-08-13).
 *
 * ── SIE HOLT NICHTS, SIE BEKOMMT ──────────────────────────────────────────
 * Der Zwilling im posts-Layer (`useReactions`) sammelt Ziel-Ids ein und stellt
 * daraus EINE gebündelte Abfrage. Hier ist selbst das unnötig: die Chips
 * stehen schon in der Antwort von `GET /api/comments`, neben `myVotes` und
 * `myReports` — der Store schiebt sie mit `seedFromList()` herein. Bei 25
 * Antworten sind das null zusätzliche Anfragen statt einer.
 *
 * Der Unterschied zu den Themen ist kein Widerspruch, sondern die jeweils
 * vorhandene Gelegenheit: eine Themen-Seite hat keine Liste, an die man sich
 * hängen könnte, ein Kommentar-Thread schon.
 *
 * EIN KOMMENTAR, DER PER REALTIME HEREINKOMMT, BRAUCHT NICHTS: er ist neu, er
 * hat keine Reaktionen, und `chips.value[id] ?? []` ist für ihn die richtige
 * Antwort. Genau deshalb gibt es hier keinen Nachlade-Pfad und keinen
 * „ungeladen"-Zustand.
 *
 * ── WARUM KEINE REALTIME AUF DEN REAKTIONEN SELBST — bewusst ──────────────
 * Der Thread hat einen Row-Stream für die Kommentare. Die Reaktionen
 * anzuhängen wäre technisch billig und trotzdem falsch: ein eingehendes
 * Ereignis müsste INKREMENTELL auf den richtigen Chip gerechnet werden, und
 * die eigene Handlung käme dabei ZWEIMAL an (einmal als Antwort der Route,
 * einmal als Ereignis) — ohne Abgleich über die Row-Id zählt die eigene
 * Reaktion doppelt. Dazu ist eine Reaktion kein Zustand, auf den jemand
 * WARTET. Die Anzeige fühlt sich trotzdem sofort an, weil das Umschalten
 * OPTIMISTISCH rechnet (`toggledChips`, dieselbe pure Regel wie auf dem
 * Server) und die Antwort den autoritativen Stand nachlegt. Wer Realtime
 * nachrüstet, dockt an `applyServerState()` an und braucht dort die
 * Row-Id-Entdopplung.
 */

/** Ziel-Id → Chips. Über `useState`, damit SSR und Client denselben Stand teilen. */
function reactionState() {
  return useState<Record<string, ReactionCount[]>>('comments:reactions', () => ({}))
}

/** Der in DIESER App erlaubte Satz — kommt vom Server, nie aus der Registry. */
function allowedState() {
  return useState<ReactionKey[]>('comments:reactions:allowed', () => [...REACTION_KEYS])
}

export function useCommentReactions() {
  const chips = reactionState()
  const allowed = allowedState()

  /** Den autoritativen Stand eines Ziels übernehmen. */
  function applyServerState(targetId: string, next: ReactionCount[]) {
    chips.value = { ...chips.value, [targetId]: next }
  }

  /**
   * Den Stand aus einer Kommentar-Liste übernehmen (Store, nach jedem Laden).
   *
   * ZUSAMMENGEFÜHRT, NICHT ERSETZT: „Alle laden" hängt weitere Seiten an, und
   * ein Ersetzen würde die Chips der schon sichtbaren Antworten wegwerfen.
   */
  function seedFromList(summary: ReactionSummary, nextAllowed?: ReactionKey[]) {
    if (Array.isArray(nextAllowed) && nextAllowed.length > 0) allowed.value = nextAllowed
    chips.value = { ...chips.value, ...summary }
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
      const response = await $fetch<CommentReactionToggleResponse>(
        `/api/comments/${targetId}/reactions`,
        { method: 'POST', body: { reaction } },
      )
      applyServerState(response.targetId, response.reactions)
    }
    catch (error) {
      applyServerState(targetId, before)
      throw error
    }
  }

  return { chips, allowed, seedFromList, toggleReaction, applyServerState }
}
