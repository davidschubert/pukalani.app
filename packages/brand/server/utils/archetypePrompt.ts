import { brandChoiceContract, brandChoicePromptRule } from '../../shared/brandChoiceOptions'
import {
  type BrandSlotInstructionOptions,
  GEORGE_PRIMARY_SOURCE_ANSWERS,
  brandSlotInstructionTail,
} from './georgePrompt'

/**
 * DIE AUFTRÄGE DES BAUSTEINS D — Archetyp & Stimme, Content-Spec §7 + §12.
 * GESPROCHEN von George (Eine Stimme, 2026-09-02), die TECHNIK ist Milos
 * (`brandAdvisors.ts` gibt ihm `values` UND `archetype`).
 *
 * ── WARUM ES DIESE DATEI ÜBERHAUPT SCHON GIBT ─────────────────────────────
 * Baustein D war der einzige mit entwerfbaren Slots und ohne Generator:
 * `resolveBrandSlotGenerator('archetype')` fand nichts, „George, entwirf das"
 * endete mit `no_generator`, und der Hinweis „schreib es selbst" ist bei sieben
 * Slots mit `editor: 'none'` keine Alternative, sondern eine Sackgasse — es gibt
 * dort gar kein Feld zum Selberschreiben.
 *
 * ── INTERIM: DAS GESPRÄCH STATT DES PAARVERGLEICHS ────────────────────────
 * INTERIM bis zum Paarvergleich-Instrument (Spec §12.2) — Davids Entscheidung
 * 2026-09-04: George leitet die Archetyp-Kette im GESPRÄCH her statt sie zu
 * BERECHNEN; das Instrument ersetzt diesen Weg, die gespeicherten Werte
 * (stabile Ids aus `brandChoiceOptions.ts`) bleiben kompatibel.
 *
 * Zwei Folgen, die man diesen Aufträgen ansehen muss:
 *
 * 1. `d.pairs` IST LEER UND BLEIBT ES. Er ist laut Registry die Quelle von
 *    `d.primary`/`d.secondary` und steht deshalb als leeres Feld in den
 *    Eingaben. Ein Modell, das eine leere Quelle sieht, liest daraus gern eine
 *    AUSSAGE („sie haben keine Paare gewählt, also ist ihnen das egal").
 *    Deshalb sagen die beiden Aufträge WÖRTLICH, dass dieses Feld noch kein
 *    Instrument hat — die ehrliche Auskunft ist billiger als die Erfindung, die
 *    sonst an ihre Stelle tritt.
 *
 * 2. DIE WAHL GEHÖRT DEM MENSCHEN, NICHT DEM MODELL. Wo zwei Archetypen
 *    ernsthaft in Frage kommen, ist ein Entwurf keine Ableitung mehr, sondern
 *    ein Münzwurf mit Begründung — und im Brand-Dokument sieht man einem
 *    Münzwurf nichts an. Also: RÜCKFRAGE mit `OPTION:`-Zeilen (george-a-11,
 *    seit 2026-09-04), Empfehlung in der Prosa, ein Klick des Menschen. Das ist
 *    genau die Rolle, die der Paarvergleich später präziser ausfüllt.
 *
 * ── WAS AN QUELLEN WIRKLICH ANKOMMT ───────────────────────────────────────
 * Die Eingaben eines Laufs sind die transitive Hülle aus der Registry, nicht
 * die Wunschliste dieser Datei. Für `d.primary` heisst das: `d.pairs` (leer),
 * `d.hypothesis`, `a.pitch`, `a.toneAnalysis`, `a.customerPraise`. Die vier
 * STIMME-Antworten (`d.party`, `d.never`, `d.admired`, `d.emotion`) stehen in
 * der Registry NACH `d.primary` und können dort deshalb gar nicht als
 * Abhängigkeit stehen — die Rückwärts-Regel des Katalogs
 * (`validateSlotRegistry`) verbietet es, und sie umzustellen hiesse, die
 * Reihenfolge des Kapitels für ein Provisorium zu verbiegen.
 *
 * Sie erreichen George trotzdem: über das GESPRÄCH (a-9, der Verlauf des
 * Kapitels reist mit und hat laut Instruktions-Rumpf das Gewicht eines
 * Feldwerts). Die Aufträge nennen sie deshalb als „was sie im Gespräch gesagt
 * haben" und nicht als Feld — eine Aufgabe, die ein Feld verlangt, das nie
 * mitreist, erzeugt eine Rückfrage nach etwas, das schon beantwortet ist. Wenn
 * der Paarvergleich kommt, wandern `d.primary`/`d.secondary` in der Registry
 * ohnehin hinter die Stimme-Fragen, und dieser Absatz fällt mit.
 *
 * Diese Datei ist PUR (kein H3, kein Appwrite, kein i18n) und trägt nur die
 * AUFGABE je Slot. Die Formalien — Quellen-Ehrlichkeit, Leitplanken, Form des
 * Feldwerts, Zug-Vertrag, OPTION-Pflicht — kommen aus
 * `brandSlotInstructionTail` und sind damit wortgleich mit den Bausteinen A–C.
 */

/**
 * Fassung dieser Aufträge. Steigt, sobald sich eine Aufgabe inhaltlich ändert —
 * oder der System-Prompt, mit dem sie gesendet werden.
 *
 * `george-archetype-2` (2026-09-04, noch am selben Tag): Kohärenz-Regel für
 * die beiden Choice-Slots — Prosa und Wert müssen denselben Katalog-Archetyp
 * nennen, informelle Gesprächs-Namen werden hörbar auf den Katalog abgebildet
 * (Live-Fund: Prosa „Handwerker", Feld `sage`).
 *
 * `george-archetype-1` (2026-09-04): erste Fassung, System-Prompt `george-a-11`.
 * Die Zahl trägt bewusst NICHT „interim" im Namen: sie soll sagen, WELCHE
 * Aufträge einen Eintrag erzeugt haben, und der Weg zum Wert ist Teil der
 * Aufgabe. Kommt der Paarvergleich, steigt sie auf `-2`, und ein alter Eintrag
 * bleibt lesbar als das, was er war.
 */
export const ARCHETYPE_PROMPT_VERSION = 'george-archetype-2'

/**
 * DER SATZ ÜBER DAS LEERE PAARVERGLEICH-FELD — wörtlich in beiden
 * Auswahl-Aufträgen (s. Kopf, Punkt 1).
 */
export const ARCHETYPE_PAIRS_PENDING
  = 'The field d.pairs is the pair-comparison instrument and it does not exist yet, so it is empty for '
    + 'everyone. Its emptiness says NOTHING about this brand: do not read it as a refusal, a preference '
    + 'or a gap in their answers, and never mention it to them.'

/**
 * DIE ZWEI-KANDIDATEN-REGEL — die Stelle, an der das Modell NICHT entwirft.
 *
 * Sie steht in beiden Auswahl-Aufträgen wörtlich, weil sie sonst genau dort
 * fehlte, wo sie zählt: bei einer knappen Entscheidung ist der Drang, trotzdem
 * eine zu treffen, am grössten.
 */
export const ARCHETYPE_TWO_CANDIDATES_RULE
  = 'IF TWO ARCHETYPES ARE REALISTICALLY IN PLAY — if you could argue for either one from the same '
    + 'evidence — do NOT draft. Ask instead: use the QUESTION form, name the two in your own words, say '
    + 'which one you lean towards and why in one sentence, and append one OPTION line per archetype so '
    + 'they can pick with a click. Choosing between two defensible readings is theirs to do, not yours.'

/**
 * PROSA UND WERT MEINEN DENSELBEN ARCHETYP (`george-archetype-2`) — Live-Fund
 * 2026-09-04, erster echter Lauf: das Gespräch hatte informelle Namen geprägt
 * („Handwerker", „Gastgeber", beide stehen NICHT im Katalog), die Prosa
 * argumentierte für den Handwerker — und im Feld stand `sage`. Ein Wert, dem
 * die eigene Begründung widerspricht, ist schlimmer als eine Rückfrage.
 */
export const ARCHETYPE_COHERENCE_RULE
  = 'YOUR PROSE AND YOUR DRAFT VALUE MUST NAME THE SAME ARCHETYPE. In the prose, call it by its '
    + 'catalogue name (the labels of the twelve options below) — never argue for one archetype and '
    + 'store another. The conversation may have used informal names that are not in the catalogue (a '
    + 'craftsman, a host): map such a name to the closest catalogue archetype and say the mapping out '
    + 'loud in your BASIS line, e.g. that what you both called the craftsman is the Creator of the '
    + 'catalogue. Never store an informal name.'

const ARCHETYPE_SLOT_TASKS: Record<string, (options: BrandSlotInstructionOptions) => string[]> = {
  // ── D · die Hypothese aus dem heutigen Auftritt (Spec §12.2 Punkt 1) ────
  'd.hypothesis': options => [
    'TASK: say which archetype speaks out of their appearance TODAY — as a reading, not as a decision.',
    'Work from what is in the inputs: the pitch, the tone analysis of their existing texts and what '
    + 'customers praise them for. Name one or two candidates and, for each, the evidence you read it '
    + 'from — a phrase from their own texts beats an adjective every time.',
    'Two to four sentences. Name the archetype in plain language, the way a person would say it, and '
    + 'stay short: this is the sentence you will say out loud before the choosing starts.',
    'DO NOT DECIDE ANYTHING HERE. This is the step before the choice: it says what their appearance '
    + 'sounds like, not who they are. Never write "you are the Sage" — write what you read and where.',
    'If their appearance pulls in two directions, SAY SO. A mixed appearance is a finding, not a '
    + 'failure — and it is often the most useful sentence in this whole chapter.',
    options.pathKind === 'relaunch'
      ? 'This is a relaunch, so an appearance exists: read it as it is today, including the parts that '
        + 'no longer fit them.'
      : 'This is a new brand, so there may be barely any appearance yet. If the inputs carry no existing '
        + 'texts, say plainly that you can only read their own description so far, and read THAT — do '
        + 'not invent an appearance to have something to analyse.',
  ],

  // ── D · Primär- und Sekundär-Archetyp (INTERIM, s. Kopf) ────────────────
  'd.primary': () => [
    'TASK: propose the PRIMARY archetype of this brand — the one that carries how they behave.',
    ARCHETYPE_PAIRS_PENDING,
    'Derive it from three things, in this order of weight: (1) the hypothesis you drew from their '
    + 'appearance, (2) what they said in this conversation about how their brand behaves at a party, '
    + 'which trait it must never have, which brand personality they admire and what people should feel '
    + 'when dealing with them, (3) the pitch and the tone of their existing texts.',
    'What they SAID about themselves outweighs what you read off their appearance: the appearance is '
    + 'where they are, the answers are where they mean to be. Where the two disagree, follow the '
    + 'answers — the disagreement itself gets its own field later.',
    ARCHETYPE_COHERENCE_RULE,
    ARCHETYPE_TWO_CANDIDATES_RULE,
    'In the BASIS line of your turn, say in one sentence WHY this archetype and which of their own '
    + 'sentences carries it. A choice they cannot trace back to something they said is one they will '
    + 'confirm without believing.',
    'If neither the conversation nor the fields say anything about how this brand behaves, do not pick '
    + 'from the pitch alone: ask.',
  ],
  'd.secondary': () => [
    'TASK: propose the SECONDARY archetype — the one that keeps the primary from becoming a cliché.',
    ARCHETYPE_PAIRS_PENDING,
    'The primary archetype they confirmed is in the inputs. The secondary MUST be a different one: it '
    + 'is the counterweight, the trait that makes the primary bearable and specific. A Sage with a '
    + 'Jester secondary explains without lecturing; a Hero with a Caregiver secondary demands without '
    + 'trampling. Say that relationship in the BASIS line — the pair is the point, not the second name.',
    'Derive it from the same material as the primary: the hypothesis, what they said in this '
    + 'conversation (party behaviour, the trait they never want, the brand personality they admire, the '
    + 'feeling they want to leave behind) and the tone of their texts. Look for the note that the '
    + 'primary does NOT explain — that note is the secondary.',
    ARCHETYPE_COHERENCE_RULE,
    ARCHETYPE_TWO_CANDIDATES_RULE,
    'If the primary archetype is missing from the inputs, do not guess it in order to pick a second '
    + 'one: ask for it instead.',
  ],

  // ── D · Selbstbild gegen Aussenbild (Spec §12.2 Punkt 5) ────────────────
  'd.gapReveal': options => [
    'TASK: put their self-image next to their outside image and name the difference.',
    'Self-image = the archetypes they chose. Outside image = the hypothesis you drew from their '
    + 'appearance. Say in two to four sentences where the two agree and, more importantly, where they '
    + 'do not.',
    'NAME THE DIFFERENCE HONESTLY, NEVER SMOOTH IT OVER. "You want to come across as the Rebel, but '
    + 'your texts sound like the Caregiver" is the sentence this field exists for. Do not soften it '
    + 'into "there are elements of both", do not add a reassuring closing sentence, and do not turn it '
    + 'into advice — the finding is the value here, and it is theirs to act on.',
    'Where they AGREE, say that just as plainly and in one sentence. A confirmed match is a real '
    + 'result, and inventing a gap to have something to report is the same failure as hiding one.',
    'Point at the evidence: which phrase in their texts sounds like the other archetype. A difference '
    + 'without a place to look at is an accusation.',
    options.pathKind === 'relaunch'
      ? 'This is a relaunch: their appearance is years of accumulated decisions, not a mistake. Describe '
        + 'the gap as distance travelled, not as a verdict on their past.'
      : 'This is a new brand: there may be almost no outside image yet. If the hypothesis rests on '
        + 'nothing but their own description, say exactly that in one sentence and stop — a gap you '
        + 'cannot see is one you must not report.',
  ],

  // ── D · Stimme (Spec §7) ────────────────────────────────────────────────
  'd.voiceSamples': () => [
    'TASK: write EXACTLY THREE example sentences in the voice of this brand — three lines, no more and '
    + 'no fewer.',
    'They must be sentences THIS brand would actually say: pick three everyday situations from what you '
    + 'know about them (greeting someone, saying no, explaining a price, delivering bad news, describing '
    + 'what they do) and write one line for each. Three sentences from three different situations are '
    + 'worth more than three variations of the same one.',
    'This is not a slogan collection. No taglines, no headlines, no calls to action — those come later '
    + 'in their own chapter. What belongs here is ordinary speech in an unmistakable voice.',
    'Carry the primary and the secondary archetype AND their values into the sound: the primary sets '
    + 'the attitude, the secondary keeps it from tipping into caricature. If you cannot hear the '
    + 'difference between your three sentences and any competent brand text, they are not there yet.',
    'One line per sentence, no labels, no explanation of the situation — the sentence carries itself. '
    + 'Where you want to say what it is for, say it in the BASIS line of your turn.',
  ],
  'd.toneWords': () => [
    'TASK: name FOUR to SIX tone words for this brand — the words someone would use to describe how it '
    + 'sounds.',
    'Build them from the tone analysis of their existing texts, the archetype they chose and the '
    + 'feeling they want to leave behind. Where the analysis and the archetype disagree, follow the '
    + 'archetype: this is the tone they are going TO, not the one they are coming from.',
    'One adjective or short phrase per line, nothing else — no explanation, no pairs, no "but not ...". '
    + 'They are meant to be read at a glance and used as a checklist against a finished text.',
    'Every word has to EXCLUDE something. "Professional", "authentic", "modern" and "high-quality" '
    + 'exclude nothing — no brand aims to sound unprofessional. If you cannot name a plausible brand '
    + 'that the word rules out, it is the wrong word.',
  ],
  'd.vocabulary': () => [
    'TASK: build their vocabulary list — the words they use and the words they avoid.',
    'START FROM THEIR OWN ANSWER. The words they said they would NEVER use are already in the inputs or '
    + 'in this conversation: take those over unchanged into the avoid side, in their wording, and never '
    + 'argue with them about one. This field is theirs first and yours second.',
    'Then add three to five suggestions per side, derived from the archetype and the tone words: words '
    + 'this voice would reach for, and words that would break it.',
    'One word or short phrase per line. Mark the side at the start of the line, in this shape: '
    + '"- use: <word>" and "- avoid: <word>". Keep the use side first.',
    'Give an avoid word a reason only where it is not obvious, in half a sentence after a dash — their '
    + 'own no-go words need none, and explaining them back to them reads like a correction.',
    'Industry jargon is not automatically a no-go: a word their customers use every day belongs on the '
    + 'use side, even if it sounds technical. What belongs on the avoid side is what sounds like an '
    + 'agency wrote it.',
  ],
}

/**
 * DIE INSTRUKTION FÜR EINEN SLOT AUS BAUSTEIN D.
 *
 * Wirft für einen Slot ohne Aufgabe — dieselbe Absicht wie bei George, Vera und
 * Milo: ein stiller Allzweck-Text wäre ein Entwurf ohne Auftrag, und die Route
 * macht aus dem Wurf `provider_error`, während der Stand bearbeitbar bleibt
 * (§9b.5).
 */
export function archetypeSlotInstruction(slotId: string, options: BrandSlotInstructionOptions): string {
  const task = ARCHETYPE_SLOT_TASKS[slotId]
  if (!task) throw new Error(`Kein Archetyp-Auftrag für Slot ${slotId}`)

  // Die legale Menge einer Auswahl steht WÖRTLICH im Prompt (s.
  // `brandChoiceOptions.ts`) — hier sind es die zwölf Archetypen der Spec
  // §12.1. Ohne sie erfindet ein Modell den dreizehnten, und im Brand-Dokument
  // ist er von den zwölf echten nicht zu unterscheiden.
  const contract = brandChoiceContract(slotId)

  return [
    ...task(options),
    ...brandSlotInstructionTail(options, {
      // Ab Baustein B sind die ANTWORTEN die primäre Quelle, die Startkarte ist
      // Hintergrund — in D gilt das doppelt: ein Archetyp aus vier
      // Startkarten-Zeilen wäre geraten.
      primarySource: GEORGE_PRIMARY_SOURCE_ANSWERS,
      ...(contract ? { valueRules: brandChoicePromptRule(contract) } : {}),
    }),
  ].join('\n')
}
