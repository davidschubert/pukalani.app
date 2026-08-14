import { z } from 'zod'
import { type ReactionKey, type ReactionTargetType, REACTION_TARGET_TYPES, isReactionKey } from '../shared/reactions'

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/**
 * Das Umschalten EINER Reaktion (F57 Mechanik 1).
 *
 * DIE ERLAUBNISLISTE IST DIE PURE FUNKTION, nicht eine zweite Aufzaehlung hier:
 * `isReactionKey` ist dieselbe Regel, gegen die die Oberflaeche rendert. Eine
 * `z.enum`-Kopie waere die Liste, die beim naechsten Emoji vergessen wird.
 * Das Praedikat verengt zugleich den Ausgabetyp auf `ReactionKey` — die Route
 * bekommt also keinen blanken String.
 *
 * FAIL-CLOSED: was nicht im Satz steht, ist 400. Auch der `targetType` wird
 * geprueft, obwohl es heute nur einen gibt — sonst schriebe ein erfundener Typ
 * Zeilen, die spaeter niemand mehr zuordnen kann.
 */
export function createReactionToggleSchema(t: TranslateFn = identity) {
  return z.object({
    targetType: z.enum(REACTION_TARGET_TYPES as unknown as [ReactionTargetType, ...ReactionTargetType[]], {
      message: t('posts.validation.reactionTargetInvalid'),
    }),
    targetId: z.string().min(1).max(36),
    reaction: z.string().refine((value): value is ReactionKey => isReactionKey(value), {
      message: t('posts.validation.reactionInvalid'),
    }),
  })
}

// Server-seitige Instanz (Fehlertexte = Keys; die UI kennt den Satz ohnehin).
export const reactionToggleSchema = createReactionToggleSchema()
