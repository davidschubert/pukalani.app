import {
  type BrandSlotInstructionOptions,
  GEORGE_PRIMARY_SOURCE_ANSWERS,
  brandSlotInstructionTail,
} from './georgePrompt'

/**
 * DIE AUFTRÄGE AUS MILOS TECHNIK (P3.1) — Baustein C · Werte, Content-Spec §6.
 *
 * ── GESPROCHEN WERDEN SIE VON GEORGE (Davids Entscheidung 2026-09-02) ─────
 * Milo ist seit der Eine-Stimme-Entscheidung kein Sprecher mehr, sondern die
 * TECHNIK dieses Kapitels: Werte aus Geschichten, Moment-Beleg-Pflicht, kein
 * Adjektiv ohne Beispiel. Am Inhalt dieser Datei hat das kein Wort geändert.
 *
 * ── DIE EINE TECHNIK, UM DIE ES HIER GEHT ─────────────────────────────────
 * §6 ersetzt die statische Wortliste des Original-Formulars (03 §6, sieben
 * Kategorien zum Ankreuzen) ausdrücklich durch Kandidaten, die AUS DEN
 * ANTWORTEN entstehen. Das ist auch Milos Steckbrief in `brandAdvisors.ts`:
 * „You find values inside stories … you distil the word from the story, never
 * the other way round", und seine Verbotsliste sagt es negativ — „never accept
 * an adjective as a value without an example behind it".
 *
 * Der Auftrag hier setzt das in eine prüfbare FORM um: jeder Kandidat trägt
 * seinen Beleg in derselben Zeile. Ein Wert ohne Beleg ist keine Erkenntnis,
 * sondern ein Wort — und ein Mensch, der „Qualität · Zuverlässigkeit ·
 * Leidenschaft" vorgesetzt bekommt, kann nicht einmal sagen, warum es falsch
 * ist. Mit Beleg kann er widersprechen, und genau darum geht es.
 *
 * ── WARUM DER BELEG IN DIE ZEILE GEHÖRT UND NICHT IN DIE SPRECHBLASE ──────
 * Der nächste Slot (`c.final`) lässt den Menschen auf drei bis fünf eingrenzen
 * — er trifft die Auswahl also an der LISTE, nicht am Chat-Verlauf. Stünde die
 * Herkunft nur in Georges Zug, wäre sie beim Auswählen weg, und die Entscheidung
 * fiele wieder nach Klang. Deshalb ist die Form „Wert — Beleg" Teil des
 * Feldwerts, innerhalb der Listen-Form aus `brandSlotFormat.ts`.
 *
 * Diese Datei ist PUR (kein H3, kein Appwrite, kein i18n); die Formalien kommen
 * aus `brandSlotInstructionTail` und sind damit wortgleich mit den anderen
 * Beratern.
 */

/**
 * Fassung dieser Aufträge. Steigt, sobald sich eine Aufgabe inhaltlich ändert —
 * oder der System-Prompt, mit dem sie gesendet werden (`milo-c-2`, 2026-09-02:
 * Aufgaben unverändert, System-Prompt auf `george-a-5` · Eine Stimme).
 */
export const MILO_PROMPT_VERSION = 'milo-c-2'

/**
 * Wie viele Kandidaten. §6/03 §7 grenzt danach auf 3–5 ein — weniger als fünf
 * Kandidaten wäre keine Auswahl, mehr als sieben keine Liste mehr.
 */
export const MILO_CANDIDATE_RANGE = { min: 5, max: 7 } as const

const MILO_SLOT_TASKS: Record<string, (options: BrandSlotInstructionOptions) => string[]> = {
  'c.candidates': () => [
    `TASK: distil ${MILO_CANDIDATE_RANGE.min} to ${MILO_CANDIDATE_RANGE.max} candidate VALUES out of `
    + 'what this person has told you.',
    'A value is a rule of behaviour that is allowed to cost money — not a poster word. You are looking '
    + 'for the moments where they chose the harder way: that is where a value becomes visible.',
    'Read the moments in the inputs: when the business was at its best, when something felt deeply '
    + 'wrong, what they would never tolerate, how the brand began, what customers praise, what they '
    + 'complain about, and the conviction they would defend even when it costs them.',
    'ONE LINE PER CANDIDATE, in exactly this shape: "- <value in one or two words> — <the moment or '
    + 'statement it comes from, in half a sentence>". The evidence half must be traceable to the inputs: '
    + 'quote or paraphrase what they actually said.',
    'NEVER list a value you cannot point at: no "quality", "reliability", "passion", "innovation", '
    + '"customer focus" or any other word that could stand under any brand in any industry — unless a '
    + 'specific moment in the inputs earns it, and then the line says which moment.',
    'Two candidates may not rest on the same sentence: if you can only find three moments, return three '
    + 'candidates and say in the BASIS line that the material carries no more.',
    'Do not rank them and do not pick a favourite — the choosing is the next step, and it belongs to the '
    + 'person.',
  ],
  'c.definitions': () => [
    'TASK: for each value they chose, write ONE sentence saying what it means HERE — in this brand, not '
    + 'in a dictionary.',
    'ONE LINE PER VALUE, in exactly this shape: "- <value> — <what it means here, in one sentence>".',
    'The sentence has to be behavioural: it says what someone DOES or DOES NOT do because of this value. '
    + '"Honesty means we say no to work we cannot do well" beats "Honesty means being honest".',
    'Build each sentence from the moments they described, not from the word itself — the same moment '
    + 'that made the value a candidate should be recognisable in its definition.',
    'Cover exactly the values in their final selection: no extra ones, none left out. If a chosen value '
    + 'has no moment behind it in the inputs, ask about that one instead of inventing a meaning for it.',
  ],
}

/**
 * DIE INSTRUKTION FÜR EINEN SLOT AUS MILOS BAUSTEIN.
 *
 * Wirft für einen Slot ohne Aufgabe — dieselbe Absicht wie bei George und Vera
 * (die Route macht daraus `provider_error`, der Stand bleibt bearbeitbar).
 */
export function miloSlotInstruction(slotId: string, options: BrandSlotInstructionOptions): string {
  const task = MILO_SLOT_TASKS[slotId]
  if (!task) throw new Error(`Kein Milo-Auftrag für Slot ${slotId}`)

  return [
    ...task(options),
    ...brandSlotInstructionTail(options, { primarySource: GEORGE_PRIMARY_SOURCE_ANSWERS }),
  ].join('\n')
}
