import { z } from 'zod'
import { type ReactionKey, isReactionKey } from '../../core/shared/reactions'

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/**
 * Das Umschalten EINER Reaktion auf eine Antwort (F57, Davids Entscheidung
 * 2026-08-13).
 *
 * DIE ERLAUBNISLISTE IST DIE PURE FUNKTION, nicht eine zweite Aufzaehlung hier:
 * `isReactionKey` ist dieselbe Regel, gegen die die Oberflaeche rendert — und
 * seit dem Umzug nach `core` auch dieselbe, gegen die die Themen-Route prueft.
 * Eine `z.enum`-Kopie waere die Liste, die beim naechsten Emoji vergessen wird.
 * Das Praedikat verengt zugleich den Ausgabetyp auf `ReactionKey` — die Route
 * bekommt also keinen blanken String.
 *
 * KEIN `targetType` UND KEINE `targetId` IM RUMPF, anders als bei den Themen:
 * das Ziel ist der Kommentar aus dem PFAD (`/api/comments/:id/reactions`, wie
 * `/vote`). Eine Id im Rumpf waere eine zweite Wahrheit neben der im Pfad, und
 * die Frage „welche gilt?" beantwortet man dann in jeder Route neu.
 *
 * FAIL-CLOSED: was nicht im Satz steht, ist 400.
 */
export function createReactionToggleSchema(t: TranslateFn = identity) {
  return z.object({
    reaction: z.string().refine((value): value is ReactionKey => isReactionKey(value), {
      message: t('comments.validation.reactionInvalid'),
    }),
  })
}

// Server-seitige Instanz (Fehlertexte = Keys; die UI kennt den Satz ohnehin).
export const reactionToggleSchema = createReactionToggleSchema()
export type ReactionToggleInput = z.infer<typeof reactionToggleSchema>
