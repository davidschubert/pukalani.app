import { brandChoiceContract, brandChoicePromptRule } from '../../shared/brandChoiceOptions'
import {
  type BrandSlotInstructionOptions,
  GEORGE_PRIMARY_SOURCE_ANSWERS,
  brandSlotInstructionTail,
} from './georgePrompt'

/**
 * DIE AUFTRÄGE AUS VERAS TECHNIK (P3.1) — Baustein B (Purpose · Vision ·
 * Mission + Positionierung) und B2 (Markenarchitektur), Content-Spec §5/§5a.
 *
 * ── GESPROCHEN WERDEN SIE VON GEORGE (Davids Entscheidung 2026-09-02) ─────
 * Seit der Eine-Stimme-Entscheidung ist Vera keine Sprecherin mehr, sondern die
 * TECHNIK dieser beiden Kapitel: ihre Wettbewerbs-Schärfe, ihre
 * Provokationsfragen, ihr Prüfstein. Am Inhalt dieser Datei hat das kein Wort
 * geändert — nur die Facetten-Schicht des System-Prompts (`georgePrompt.ts`)
 * sagt jetzt „so arbeitest du hier" statt „so heisst du hier".
 *
 * Diese Datei ist PUR (kein H3, kein Appwrite, kein i18n) und trägt nur die
 * AUFGABE je Slot. Die Formalien — Quellen-Ehrlichkeit, Leitplanken, Form des
 * Feldwerts, Zug-Vertrag — kommen aus `brandSlotInstructionTail` und sind damit
 * wortgleich mit Georges Baustein A; wer sie hier nachbaute, hätte irgendwann
 * zwei Fassungen derselben Sicherung.
 *
 * ── WARUM DIE PRIMÄRE QUELLE EINE ANDERE IST ──────────────────────────────
 * Baustein A schöpft aus der STARTKARTE (seine Slots haben keine
 * `dependencies`). Ab Baustein B liegen ANTWORTEN vor — fünf beantwortete
 * Provokationsfragen für den Purpose, drei für die Vision. Ein Purpose, der aus
 * vier Startkarten-Zeilen gebaut wird, wäre genau die Behauptung, die Regel 4
 * verbietet, und Veras Prüfstein („könnte das jeder Wettbewerber sagen?")
 * fiele automatisch durch. Deshalb `GEORGE_PRIMARY_SOURCE_ANSWERS`.
 *
 * ── DIE FORMELN SIND GERÜSTE, KEINE SCHABLONEN ────────────────────────────
 * §5 verlangt „drei Statements nach den 02-Templates" und der Lehrblock
 * teach.pvm sagt, was die drei unterscheidet: Purpose = WARUM, Vision = WOHIN,
 * Mission = WIE. Die Formel steht deshalb in jedem Auftrag WÖRTLICH, mit einem
 * ausdrücklichen Zusatz: sie ist ein Gerüst, kein Lückentext. Ein Modell, das
 * die Formel abschreibt, liefert „Wir existieren, um X für Y zu tun" — ein
 * Satz, dessen Bauplan man ihm ansieht, und den kein Mensch je vorlesen würde.
 *
 * ── VERAS PRÜFSTEIN STEHT IN JEDEM PVM-AUFTRAG ────────────────────────────
 * „Could any competitor in this industry say exactly this?" ist ihre
 * Interview-Technik (`brandAdvisors.ts`) und zugleich die Qualitätsschwelle
 * von §5. Sie steht in der Facetten-Schicht des System-Prompts — und ZUSÄTZLICH
 * hier, als Prüfung am fertigen Satz. Die Schicht sagt, wie GEFRAGT wird; das
 * hier sagt, was ABGEGEBEN wird.
 */

/**
 * Fassung dieser Aufträge. Steigt, sobald sich eine Aufgabe inhaltlich ändert —
 * oder der System-Prompt, mit dem sie gesendet werden.
 *
 * `vera-b-2` (2026-09-02): die Aufgaben sind unverändert, der SYSTEM-Prompt
 * nicht (`george-a-5`, Eine Stimme). Ein Eintrag aus `vera-b-1` stammt aus
 * einem Lauf, in dem sich das Modell als Vera vorgestellt hat; beide für
 * vergleichbar zu erklären, wäre genau die Sorte stille Unwahrheit, gegen die
 * es diese Zahl gibt.
 */
export const VERA_PROMPT_VERSION = 'vera-b-2'

/** Der Satz, der jeden PVM-Entwurf tragen muss — Veras Schwelle, wörtlich. */
export const VERA_COMPETITOR_TEST
  = 'Before you write it down, hold the sentence against one test: could any competitor in this industry '
    + 'say exactly this, word for word? If yes, it is not their sentence yet — write the version only this '
    + 'brand can say, using something concrete from the inputs.'

/** Was in KEINEN der drei Sätze gehört (Content-Spec §5, Lehrblock teach.pvm). */
const PVM_BANNED
  = 'Banned: "world-class", "innovative", "passionate", "leading", "synergy", "holistic", "solutions" as a '
    + 'noun, and any sentence built only from such words. No superlatives you cannot back with something '
    + 'in the inputs.'

const VERA_SLOT_TASKS: Record<string, (options: BrandSlotInstructionOptions) => string[]> = {
  // ── B · Purpose · Vision · Mission ──────────────────────────────────────
  'b.whyStarted': () => [
    'TASK: turn what this person already told you about the beginning of this brand into ONE sentence '
    + 'about why that still matters TODAY.',
    'This is a DERIVATION, not a new question: the substance must be traceable to their own origin story '
    + 'in the inputs. Keep their words where they carry meaning, drop the anecdote, keep the reason.',
    'One sentence, at most two. Present tense — the question is not how it began, but what of it still '
    + 'holds.',
    'If the origin story in the inputs is empty or says nothing about a reason, do not construct one: '
    + 'ask instead.',
  ],
  'b.purpose': () => [
    'TASK: draft the PURPOSE of this brand — the WHY. The reason it exists beyond making money.',
    'Formula as a scaffold, never as a fill-in-the-blanks: "We exist so that <who> <what changes for '
    + 'them>." It has to read like a sentence a founder would say out loud, not like a filled-in '
    + 'template — if your draft still looks like the formula, rewrite it.',
    'One sentence, two at the very most. Present tense. It names a change in the world, not a product '
    + 'and not a revenue goal.',
    'Build it from what they answered: why they started, what the world would lose, and the conviction '
    + 'they would defend even when it costs them. Those three answers are the substance — the pitch is '
    + 'only there to keep you honest about what they actually do.',
    VERA_COMPETITOR_TEST,
    PVM_BANNED,
  ],
  'b.vision': () => [
    'TASK: draft the VISION of this brand — the WHERE TO. The world once they have succeeded.',
    'Formula as a scaffold, never as a fill-in-the-blanks: "In ten years, <what looks different in the '
    + 'world because they existed>." A picture, not a target figure: no market share, no revenue, no '
    + 'headcount.',
    'One sentence, two at the very most. Write it as a state that HAS arrived, not as an intention: "X '
    + 'is normal" beats "we want X to become normal".',
    'Build it from their ten-year answer and their legacy answer. It may sit far out and still has to '
    + 'give direction today.',
    VERA_COMPETITOR_TEST,
    PVM_BANNED,
  ],
  'b.mission': () => [
    'TASK: draft the MISSION of this brand — the HOW. What they do every day to get towards the vision.',
    'Formula as a scaffold, never as a fill-in-the-blanks: "We <do what> for <whom>, so that <what '
    + 'result>." Concrete enough that a new colleague could act on it tomorrow.',
    'One sentence, two at the very most. Present tense, active voice, no conditional.',
    'Build it from the pitch, the audience sketch, the one thing they do differently, what customers '
    + 'praise them for — and keep it under the purpose you already drafted: the mission is the how of '
    + 'THAT why, not a second why.',
    VERA_COMPETITOR_TEST,
    PVM_BANNED,
  ],
  'b.positioningCategory': () => [
    'TASK: propose the CATEGORY this brand plays in — the shelf people mentally put it on.',
    'This is not the same as their industry: the industry is what they do, the category is what they are '
    + 'compared against. "Roastery" is an industry; "speciality coffee for cafés" is a category.',
    'Derive it from the pitch, the normalised category and the competitor profiles in the inputs — the '
    + 'competitors are the strongest evidence of which shelf they are already on.',
    'Narrow beats broad: a category nobody else claims is worth more than one everybody claims. But do '
    + 'not invent a category that only exists in this sentence — people have to already look for it.',
  ],

  // ── B2 · Markenarchitektur (Content-Spec §5a) ───────────────────────────
  'b2.model': () => [
    'TASK: propose the brand ARCHITECTURE model for this brand.',
    'Decide from their three answers in the inputs: whether the other brands should visibly belong to the '
    + 'main brand, whether the main brand should lend them trust, and how they are allowed to be named. '
    + 'Those three answers together point at exactly one of the four models.',
    'In the BASIS line of your turn, say in one sentence WHY this model and what it costs them — every '
    + 'model buys a different kind of trust and every model has a price.',
    'If the three answers contradict each other, or if two of them are empty, do not pick the middle '
    + 'ground: ask instead.',
  ],
  'b2.rule': () => [
    'TASK: write the NAMING RULE that follows from the architecture model they chose.',
    'One rule, said plainly enough that someone naming the next product can apply it without asking: what '
    + 'the name must contain, what it must not, and who decides.',
    'Then two or three concrete examples FROM THEIR OWN CONTEXT — real offerings, product areas or '
    + 'audiences named in the inputs, not "Brand Product A". If the inputs carry no such offering, use '
    + 'their own words for what they do and say in the BASIS line that the examples are illustrative.',
    'At most four sentences in total, examples included.',
  ],
}

/**
 * DIE INSTRUKTION FÜR EINEN SLOT AUS VERAS BAUSTEINEN.
 *
 * Wirft für einen Slot ohne Aufgabe — dieselbe Absicht wie bei George: ein
 * stiller Allzweck-Text wäre ein Entwurf ohne Auftrag, und die Route macht aus
 * dem Wurf `provider_error`, während der Stand bearbeitbar bleibt (§9b.5).
 */
export function veraSlotInstruction(slotId: string, options: BrandSlotInstructionOptions): string {
  const task = VERA_SLOT_TASKS[slotId]
  if (!task) throw new Error(`Kein Vera-Auftrag für Slot ${slotId}`)

  // Die legale Menge einer Auswahl steht WÖRTLICH im Prompt (s.
  // `brandChoiceOptions.ts`) — „choose one of the common models" bringt
  // „Hybrid" zurück, und ein fünftes Modell im Brand-Dokument rechnet niemand
  // mehr zurück.
  const contract = brandChoiceContract(slotId)

  return [
    ...task(options),
    ...brandSlotInstructionTail(options, {
      primarySource: GEORGE_PRIMARY_SOURCE_ANSWERS,
      ...(contract ? { valueRules: brandChoicePromptRule(contract) } : {}),
    }),
  ].join('\n')
}
