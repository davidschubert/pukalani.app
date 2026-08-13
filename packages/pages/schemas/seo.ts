import { z } from 'zod'
import { MAX_SEO_DESCRIPTION } from '../../core/shared/communitySeo'

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/**
 * DEN SUCHEINTRAG EINER COMMUNITY SPEICHERN (U15 Teil 2).
 *
 * Die Regel selbst (was eine gespeicherte Zeile BEDEUTET) steht in
 * `core/shared/communitySeo.ts`; hier steht, was überhaupt hinein darf. Beides
 * kennt dieselbe Grenze — die Route prüft beim SCHREIBEN, die Auflösungsregel
 * kappt noch einmal beim LESEN. Das ist keine Doppelung aus Vorsicht: eine
 * Zeile kann auch aus der Konsole oder einem Nachrüst-Skript stammen, und wer
 * nur beim Schreiben prüft, verlässt sich darauf, dass es nie einen anderen
 * Schreiber gab.
 *
 * ── BEIDE FELDER SIND PFLICHT, UND DAS IST ABSICHT ────────────────────────
 * Ein PATCH mit nur einem Feld wäre bequemer und wäre falsch: die Seite hat
 * EINEN Speichern-Knopf für beide Einstellungen, und die Route schreibt die
 * ganze Zeile (`updateRow`, sonst `createRow`). Optionale Felder hiessen, dass
 * ein fehlendes Feld irgendetwas bedeutet — „unverändert" oder „leer" —, und
 * die Antwort darauf hinge davon ab, ob die Zeile schon existiert. Ein
 * ausgelassenes `noindex` würde dann je nach Vorgeschichte den Schalter
 * umlegen oder nicht. Der Aufrufer schickt beides, weil er beides anzeigt.
 *
 * (Der Gegenfall steht in CLAUDE.md bei `neutral` im Branding-PATCH: DORT ist
 * ein optionales Feld richtig, weil zwei Deployments — platform und control —
 * unterschiedlich alt sein können und ein Pflichtfeld jedes Umfärben mit 400
 * beantwortet hätte. Hier gibt es keine Naht und keinen zweiten Dienst.)
 *
 * ── WAS HIER NICHT GEPRÜFT WIRD ───────────────────────────────────────────
 * Die FORM des Textes. Eine Beschreibung ist Fliesstext; es gibt kein Muster,
 * gegen das man sie halten könnte. Zeilenumbrüche und doppelte Leerzeichen
 * lehnt das Schema deshalb nicht ab, sondern die Regel räumt sie weg
 * (`normalizeSeoDescription`) — ein Formular, das einen Absatz mit einer
 * Fehlermeldung quittiert, statt ihn glattzuziehen, wäre Schikane.
 */
export function createCommunitySeoSchema(t: TranslateFn = identity) {
  return z.object({
    metaDescription: z.string()
      .trim()
      .max(MAX_SEO_DESCRIPTION, t('pages.seo.validation.descriptionMax')),
    noindex: z.boolean(),
  }).strict()
}

// Server-seitige Instanz (Fehlertexte = Keys; die UI validiert mit t()) —
// dasselbe Muster wie `communityNavigationSchema` daneben.
export const communitySeoSchema = createCommunitySeoSchema()
