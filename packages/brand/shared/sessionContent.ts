/**
 * DER INHALT EINER SESSION — Ziel, Verarbeitungsregeln, Form, Invarianten
 * (BW2 Paket 1, Plan docs/plans/BRAND-WIZARD-SESSIONS.md §3 + §3a).
 *
 * ── WARUM DER INHALT NEBEN DER TABELLE STEHT UND NICHT DARIN ──────────────
 * `slotRegistry.ts` ist eine TABELLE: eine Zeile je Session, auf einen Blick
 * lesbar, und genau daran hängt ihre Prüfbarkeit („Fehler darin sind
 * Tippfehler"). Der Session-INHALT ist das Gegenteil — fünfzehn Zeilen Prosa je
 * Session, mit einem eigenen Pflege-Rhythmus (Paket 2 ist Davids Inhalts-Gate
 * und fasst NUR diese Datei an, die Struktur bleibt unberührt). Beides in einer
 * Datei hiesse: wer ein `required` sucht, blättert durch 1.000 Zeilen Englisch.
 *
 * `defineSession()` führt beides zu EINER `BrandSessionConfig` zusammen — es
 * gibt also weiterhin genau einen Vertrag je Session, nur zwei Ablagen dafür.
 *
 * ── DIESE DATEI HAT KEINE IMPORTE, UND DAS IST ABSICHT ────────────────────
 * Sie trägt deshalb auch die kleinen Wert-TYPEN der Session-Config
 * (`BrandSessionKind`, `BrandInvariant`, Form, Antwortregeln …), die
 * `slotRegistry.ts` re-exportiert. Andersherum wäre es ein Zyklus: die Registry
 * braucht diese Tabelle zur LAUFZEIT, die Tabelle bräuchte die Typen der
 * Registry. Eine Richtung, keine Ausnahme.
 *
 * ── DIE REGELTEXTE SIND ENGLISCH UND GEHEN WÖRTLICH IN DEN PROMPT ─────────
 * Wie in den Prompt-Dateien (Content-Spec §1.2, „sprachneutral formuliert"):
 * sie beschreiben Verhalten, nicht Text. Was der Mensch liest, steht in den
 * Locale-Katalogen; hier steht, was das Modell tun soll.
 *
 * Sie sind aus `georgePrompt.ts`, `veraPrompt.ts`, `miloPrompt.ts` und
 * `archetypePrompt.ts` WÖRTLICH hierher gezogen — Zeile für Zeile, ohne
 * Umformulierung. `tests/sessionPrompt.test.ts` hält die alten Texte als
 * Fixture dagegen: der gebaute Prompt muss Zeile für Zeile derselbe sein.
 * Wer hier eine Zeile ändert, ändert einen Prompt und muss die Prompt-Fassung
 * (`*_PROMPT_VERSION`) hochzählen.
 *
 * ── WAS IN PAKET 1 NOCH LEER IST ─────────────────────────────────────────
 * `quality`, `antiPatterns`, `examples` und `ladder` sind der INHALT von
 * Paket 2 (Content-Spec §14, Davids Gate) und stehen hier bewusst leer. `goal`
 * dagegen steht JETZT für alle 68 Sessions: eine Session ohne Ziel wäre eine
 * Arbeitseinheit, von der niemand sagen kann, wann sie fertig ist — und der
 * Registry-Test verlangt es. Für die 21 Sessions mit heutigem Entwurfs-Auftrag
 * ist es dessen `TASK:`-Zeile, für die übrigen 47 der Zweck ihres Fragetextes.
 *
 * ── DIESE DATEI LIEGT IM CLIENT-BÜNDEL ───────────────────────────────────
 * `slotRegistry.ts` wird im Browser gelesen (Navigation, Fortschritt), also
 * reisen diese Regeltexte mit — rund 25 KB roh. Das ist der bewusste Preis
 * dafür, dass es EINEN Session-Vertrag gibt und nicht einen für den Server und
 * einen für die Anzeige (Plan §3: „EINE deklarative Beschreibung je Feld, in
 * der Registry"). Wird es je eng, ist die Antwort ein serverseitiger
 * Nachlade-Weg für `processing.rules`, nicht ein zweiter Vertrag.
 */

/** Die sechs Arbeitsformen einer Session (Plan §3). */
export type BrandSessionKind =
  /** F: eine Menschenfrage — George fragt, hört, spiegelt. */
  | 'ask'
  /** F, mehrteilig: sammelt N Teile nacheinander (heute nur `a.facts`). */
  | 'collect'
  /** A: Auswahl aus Registry-Optionen, ggf. mit Empfehlung. */
  | 'choose'
  /** K: George leitet ab, der Mensch bestätigt oder korrigiert. */
  | 'derive'
  /** K→B: George entwirft, redigiert wird auf der Bühne. */
  | 'draft'
  /** Eigenes Werkzeug (`d.pairs`); interim läuft es als `derive`. */
  | 'instrument'

/**
 * MINDEST-SUBSTANZ IN DREI STUFEN (Plan §16, stillschweigend angenommen):
 * 68 Zeichen-Zahlen ohne Massstab pflegt niemand. Wer für eine einzelne
 * Session eine Zahl braucht, ergänzt sie dort; die Stufe bleibt der Default.
 */
export type BrandSessionSubstance = 'short' | 'medium' | 'long'

/** Was bei dünnen, überlangen oder ausbleibenden Antworten gilt (Plan §3). */
export interface BrandSessionAnswers {
  readonly minSubstance: BrandSessionSubstance
  /** Wie oft George nachfragt, bevor er den Stand annimmt. */
  readonly maxProbes: 0 | 1 | 2
  /** Ist „weiss ich nicht" eine gültige Antwort? (dann: Hypothese anbieten) */
  readonly allowUnknown: boolean
  /**
   * VERTAGEN als vierter Ausgang (Plan §3a): manche Sessions brauchen jemanden,
   * der gerade nicht am Tisch sitzt. Ohne diesen Ausgang erfindet der Mensch
   * eine Antwort, um weiterzukommen.
   */
  readonly allowDefer: boolean
}

/** Regeln, die der WERT selbst einhalten muss (Plan §3a Nr. 5). */
export interface BrandSessionForm {
  /** `'fromTeam'` = folgt der Weiche W3 (Solo/Team), wo die Person nicht fest ist. */
  readonly person: 'we' | 'I' | 'brand' | 'none' | 'fromTeam'
  readonly tense: 'present' | 'future' | 'any'
  /** Wortdeckel, enger als der Zeichen-Deckel. `null` = keiner. */
  readonly maxWords: number | null
  /** Was im Wert nie vorkommen darf (Markenname im Purpose, Zahlen in der Vision …). */
  readonly forbidden: readonly string[]
}

/** Die Interviewführung DIESER einen Session (Plan §3a Nr. 4). */
export interface BrandSessionLadder {
  /** Womit George öffnet — die Absicht, nicht der Wortlaut (der steht im Locale-Katalog). */
  readonly opening: string
  /** Nachfrage 1 und 2, je nachdem WIE dünn die Antwort war. */
  readonly probes: readonly string[]
  /** Umdeutung, wenn die Antwort in ein bekanntes Anti-Muster fällt. */
  readonly reframes: readonly string[]
}

/**
 * 1–2 erfundene starke Werte je Pfad, IMMER aus einer fremden Branche
 * (Plan §3a Nr. 3) — für die FORM, nie für den Inhalt. Wo es keine gibt: leer.
 */
export interface BrandSessionExamples {
  readonly new: readonly string[]
  readonly relaunch: readonly string[]
}

/** Was der Mensch vorher über den Umfang erfährt (Plan §3a Nr. 8). */
export interface BrandSessionEffort {
  readonly minutes: 1 | 2 | 3 | 5 | 10
  /** George hört auf zu bohren, wenn diese Zahl erreicht ist. */
  readonly turns: number
}

/**
 * Was per Share-Link und Export standardmässig NICHT reist (Plan §3a Nr. 7).
 * Ein Kunde, der seine Marke teilt, teilt nicht seine Beschwerden.
 */
export type BrandSessionSensitivity = 'public' | 'internal' | 'private'

/**
 * DETERMINISTISCHE PRÜFUNGEN, IM CODE (Plan §3a Nr. 6).
 *
 * Eine Regel, die ein Test prüfen kann, wird nicht der KI überlassen — sie ist
 * billiger, schneller und lügt nie. Geprüft wird beim Bestätigen
 * (`transitionBrandStep`), ein Verstoss ist `invariant_violated`.
 */
export type BrandInvariantKind = 'subsetOf' | 'memberOf' | 'sentenceOf' | 'count' | 'mentionsNone'

export interface BrandInvariant {
  readonly kind: BrandInvariantKind
  /** Quell-Slot — MUSS in der Registry VOR dieser Session stehen. */
  readonly of?: string
  readonly min?: number
  readonly max?: number
  readonly terms?: readonly string[]
}

/**
 * DIE ÜBERSCHREIBBAREN FELDER je Session. Alles, was hier fehlt, bekommt den
 * mechanischen Default aus `defineSession()` — 68 vollständige Datensätze von
 * Hand wären 68 Chancen, einen Default zu vergessen.
 */
export interface BrandSessionContent {
  /** ZIEL — ein Satz, was am Ende feststehen muss. Pflicht für jede Session. */
  readonly goal: string
  /** Wie Antworten eingeordnet werden — wörtlich in den Prompt. */
  readonly rules?: readonly string[]
  /** Regeln, die NUR auf einem Pfad gelten (heute: `d.hypothesis`, `d.gapReveal`). */
  readonly pathRules?: { readonly new?: readonly string[], readonly relaunch?: readonly string[] }
  /** Die Teile einer `collect`-Session, in Frage-Reihenfolge. */
  readonly parts?: readonly string[]
  /** Liest diese Session die Startkarte als primäre Quelle? (Default: Baustein A) */
  readonly startCard?: boolean
  /** Nennt der Auftrag den Website-Text? (Default: nein) */
  readonly siteAnalysis?: boolean
  readonly sensitivity?: BrandSessionSensitivity
  readonly allowDefer?: boolean
  readonly invariants?: readonly BrandInvariant[]
  readonly form?: Partial<BrandSessionForm>
}

// ── Regeltexte, die MEHRERE Sessions teilen ────────────────────────────────
// Sie stehen hier und nicht bei den Sessions, weil sie wörtlich in mehreren
// Aufträgen vorkommen: zwei Fassungen desselben Prüfsteins wären zwei
// Qualitätsschwellen, und die Abweichung sähe man nur am Ergebnis.

/** Veras Schwelle, wörtlich — der Satz, der jeden PVM-Entwurf tragen muss. */
export const VERA_COMPETITOR_TEST
  = 'Before you write it down, hold the sentence against one test: could any competitor in this industry '
    + 'say exactly this, word for word? If yes, it is not their sentence yet — write the version only this '
    + 'brand can say, using something concrete from the inputs.'

/** Was in KEINEN der drei PVM-Sätze gehört (Content-Spec §5, Lehrblock teach.pvm). */
export const PVM_BANNED
  = 'Banned: "world-class", "innovative", "passionate", "leading", "synergy", "holistic", "solutions" as a '
    + 'noun, and any sentence built only from such words. No superlatives you cannot back with something '
    + 'in the inputs.'

/**
 * Wie viele Werte-Kandidaten. §6/03 §7 grenzt danach auf 3–5 ein — weniger als
 * fünf Kandidaten wäre keine Auswahl, mehr als sieben keine Liste mehr.
 */
export const MILO_CANDIDATE_RANGE = { min: 5, max: 7 } as const

/** Der Satz über das leere Paarvergleich-Feld — wörtlich in beiden Auswahl-Aufträgen. */
export const ARCHETYPE_PAIRS_PENDING
  = 'The field d.pairs is the pair-comparison instrument and it does not exist yet, so it is empty for '
    + 'everyone. Its emptiness says NOTHING about this brand: do not read it as a refusal, a preference '
    + 'or a gap in their answers, and never mention it to them.'

/** Die Zwei-Kandidaten-Regel — die Stelle, an der das Modell NICHT entwirft. */
export const ARCHETYPE_TWO_CANDIDATES_RULE
  = 'IF TWO ARCHETYPES ARE REALISTICALLY IN PLAY — if you could argue for either one from the same '
    + 'evidence — do NOT draft. Ask instead: use the QUESTION form, name the two in your own words, say '
    + 'which one you lean towards and why in one sentence, and append one OPTION line per archetype so '
    + 'they can pick with a click. Choosing between two defensible readings is theirs to do, not yours.'

/** Prosa und Wert meinen denselben Archetyp (`george-archetype-2`, Live-Fund 2026-09-04). */
export const ARCHETYPE_COHERENCE_RULE
  = 'YOUR PROSE AND YOUR DRAFT VALUE MUST NAME THE SAME ARCHETYPE. In the prose, call it by its '
    + 'catalogue name (the labels of the twelve options below) — never argue for one archetype and '
    + 'store another. The conversation may have used informal names that are not in the catalogue (a '
    + 'craftsman, a host): map such a name to the closest catalogue archetype and say the mapping out '
    + 'loud in your BASIS line, e.g. that what you both called the craftsman is the Creator of the '
    + 'catalogue. Never store an informal name.'

/**
 * DIE 68 SESSIONS. Reihenfolge wie im Katalog — die Registry prüft, dass hier
 * genau ihre Ids stehen (kein verwaister Eintrag, keine Session ohne Ziel).
 */
export const SESSION_CONTENT: Readonly<Record<string, BrandSessionContent>> = {
  // ── A · Kontext ─────────────────────────────────────────────────────────
  'a.pitch': {
    goal: 'draft the elevator pitch for this brand.',
    rules: [
      'Work from the start card: "what they do" and "who it is for" are the person\'s own words — keep their '
      + 'substance, sharpen the wording.',
      'Two to three sentences, plain language, no superlatives and no marketing noise. '
      + 'Say what they do, who it is for, and what makes it different.',
    ],
  },
  'a.category': {
    goal: 'name the industry / category this brand plays in, normalised to a term the industry itself uses.',
    rules: [
      'The start card carries their own answer to "industry" — normalise THAT, do not replace it with a '
      + 'category you would have picked.',
      'One line, at most five words. "Software agency for online shops" — not "we build stuff".',
    ],
  },
  'a.competitors': {
    goal: 'write 3-5 short competitor profiles.',
    siteAnalysis: true,
    rules: [
      'USE ONLY names that appear literally in the inputs below — named by the person or linked from their '
      + 'own site. Do NOT invent competitors, do NOT add companies you happen to know, do NOT guess from the '
      + 'industry named in the start card. If fewer than three names are given, return only those and say '
      + 'nothing about the missing ones. If no name is given at all, return a single entry saying that no '
      + 'competitor was named yet.',
      'One line per competitor, in this shape: "- <name> - strong: <one point> - weak: <one point>".',
      // B6: „steht nicht in den Eingaben" war als Steckbrief-Inhalt wertlos — der
      // Mensch bekam drei Zeilen Füllung. Eine GEKENNZEICHNETE Annahme ist eine
      // Aussage, die er prüfen kann; ein erfundener NAME bleibt verboten, weil er
      // sich nicht prüfen, sondern nur glauben lässt.
      'A point you can only infer — rather than read in the inputs — is allowed, but it must be marked in '
      + 'the line itself, in this shape: "- <name> - assumption, please verify: <the point>". Never write '
      + 'filler such as "not stated in the inputs": either say something checkable, or leave the point out.',
    ],
  },
  'a.audienceSketch': {
    goal: 'sketch the audience of this brand.',
    rules: [
      'The start card\'s "who it is for" is the seed — unfold it, do not overwrite it.',
      'One block per audience, at most three blocks. Use these labels: "Who", "What they want", '
      + '"What holds them back". Concrete over demographic: what these people are trying to get done.',
    ],
  },
  'a.toneAnalysis': {
    goal: 'analyse the tone of the existing texts contained in the inputs below.',
    siteAnalysis: true,
    rules: [
      'Name three to five tonal traits and quote a short phrase from the inputs for each one. '
      + 'If the inputs contain no existing brand texts, say exactly that in one sentence and stop — '
      + 'do not analyse a tone you cannot see, and do not describe how the brand SHOULD sound.',
    ],
  },
  'a.origin': {
    goal: 'capture why this brand was started — or, on a relaunch, what about the current brand must '
      + 'survive the relaunch.',
  },
  'a.customerPraise': {
    goal: 'capture the sentence their happiest customers say about them, in the words the customers use.',
  },
  'a.complaints': {
    goal: 'capture the complaints and negative feedback this brand actually gets, unvarnished.',
    sensitivity: 'internal',
  },
  'a.oneThing': {
    goal: 'capture the one thing they wish every customer knew about them.',
  },
  'a.challenge': {
    goal: 'capture the biggest obstacle standing in front of this brand right now.',
    sensitivity: 'internal',
  },
  'a.facts': {
    goal: 'collect the plain facts of this brand: how big the team is, how long it has existed and which '
      + 'markets it serves.',
    // Drei Teile, nicht vier: der Content-Spec §4 nennt „Zahlen: Teamgrösse,
    // Alter, Märkte", die Frage im Katalog stellt genau diese drei.
    parts: ['teamSize', 'age', 'markets'],
    sensitivity: 'internal',
    allowDefer: true,
  },

  // ── B · Purpose · Vision · Mission ──────────────────────────────────────
  'b.whyStarted': {
    goal: 'turn what this person already told you about the beginning of this brand into ONE sentence '
      + 'about why that still matters TODAY.',
    rules: [
      'This is a DERIVATION, not a new question: the substance must be traceable to their own origin story '
      + 'in the inputs. Keep their words where they carry meaning, drop the anecdote, keep the reason.',
      'One sentence, at most two. Present tense — the question is not how it began, but what of it still '
      + 'holds.',
      'If the origin story in the inputs is empty or says nothing about a reason, do not construct one: '
      + 'ask instead.',
    ],
  },
  'b.worldLoses': {
    goal: 'capture what the world would lose if this brand shut down tomorrow — impact, not revenue.',
  },
  'b.conviction': {
    goal: 'capture the belief that drives this company — the one they would defend even when it costs them.',
  },
  'b.tenYears': {
    goal: 'capture what looks different in the world ten years from now because this brand existed.',
  },
  'b.legacy': {
    goal: 'capture what people should be saying about this brand in twenty years.',
  },
  'b.purpose': {
    goal: 'draft the PURPOSE of this brand — the WHY. The reason it exists beyond making money.',
    rules: [
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
  },
  'b.vision': {
    goal: 'draft the VISION of this brand — the WHERE TO. The world once they have succeeded.',
    rules: [
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
  },
  'b.mission': {
    goal: 'draft the MISSION of this brand — the HOW. What they do every day to get towards the vision.',
    rules: [
      'Formula as a scaffold, never as a fill-in-the-blanks: "We <do what> for <whom>, so that <what '
      + 'result>." Concrete enough that a new colleague could act on it tomorrow.',
      'One sentence, two at the very most. Present tense, active voice, no conditional.',
      'Build it from the pitch, the audience sketch, the one thing they do differently, what customers '
      + 'praise them for — and keep it under the purpose you already drafted: the mission is the how of '
      + 'THAT why, not a second why.',
      VERA_COMPETITOR_TEST,
      PVM_BANNED,
    ],
  },
  'b.positioningCategory': {
    goal: 'propose the CATEGORY this brand plays in — the shelf people mentally put it on.',
    rules: [
      'This is not the same as their industry: the industry is what they do, the category is what they are '
      + 'compared against. "Roastery" is an industry; "speciality coffee for cafés" is a category.',
      'Derive it from the pitch, the normalised category and the competitor profiles in the inputs — the '
      + 'competitors are the strongest evidence of which shelf they are already on.',
      'Narrow beats broad: a category nobody else claims is worth more than one everybody claims. But do '
      + 'not invent a category that only exists in this sentence — people have to already look for it.',
    ],
  },
  'b.positioningFirstChoice': {
    goal: 'capture for whom this brand is the FIRST choice inside its category, and against whom.',
  },

  // ── B2 · Markenarchitektur ──────────────────────────────────────────────
  'b2.visibility': {
    goal: 'settle whether the other brands should visibly belong to the main brand or stand on their own.',
  },
  'b2.roleOfMaster': {
    goal: 'settle whether the main brand lends the other brands its trust, or leaves them free to reach '
      + 'audiences the main brand cannot.',
  },
  'b2.namingPattern': {
    goal: 'settle how the other brands are allowed to be named — as "Brand Product" or with names of '
      + 'their own.',
  },
  'b2.model': {
    goal: 'propose the brand ARCHITECTURE model for this brand.',
    rules: [
      'Decide from their three answers in the inputs: whether the other brands should visibly belong to the '
      + 'main brand, whether the main brand should lend them trust, and how they are allowed to be named. '
      + 'Those three answers together point at exactly one of the four models.',
      'In the BASIS line of your turn, say in one sentence WHY this model and what it costs them — every '
      + 'model buys a different kind of trust and every model has a price.',
      'If the three answers contradict each other, or if two of them are empty, do not pick the middle '
      + 'ground: ask instead.',
    ],
  },
  'b2.rule': {
    goal: 'write the NAMING RULE that follows from the architecture model they chose.',
    rules: [
      'One rule, said plainly enough that someone naming the next product can apply it without asking: what '
      + 'the name must contain, what it must not, and who decides.',
      'Then two or three concrete examples FROM THEIR OWN CONTEXT — real offerings, product areas or '
      + 'audiences named in the inputs, not "Brand Product A". If the inputs carry no such offering, use '
      + 'their own words for what they do and say in the BASIS line that the examples are illustrative.',
      'At most four sentences in total, examples included.',
    ],
  },

  // ── C · Werte ───────────────────────────────────────────────────────────
  'c.discovery1': {
    goal: 'capture a moment when this business was at its best, told as a scene and not as an adjective.',
  },
  'c.discovery2': {
    goal: 'capture a moment when something felt deeply wrong in this business, told as a scene.',
  },
  'c.discovery3': {
    goal: 'capture the behaviour this brand would never tolerate, not even from its best-paying client.',
  },
  'c.candidates': {
    goal: `distil ${MILO_CANDIDATE_RANGE.min} to ${MILO_CANDIDATE_RANGE.max} candidate VALUES out of `
      + 'what this person has told you.',
    rules: [
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
  },
  'c.final': {
    goal: 'settle the three to five values this brand would defend even when they cost it something.',
    // Die Frage im Katalog sagt „three to five" und der Wert ist eine LISTE
    // (eine Zeile je Wert, `brandSlotFormat.ts`) — damit ist die Zahl zählbar.
    invariants: [{ kind: 'count', min: 3, max: 5 }],
  },
  'c.definitions': {
    goal: 'for each value they chose, write ONE sentence saying what it means HERE — in this brand, not '
      + 'in a dictionary.',
    rules: [
      'ONE LINE PER VALUE, in exactly this shape: "- <value> — <what it means here, in one sentence>".',
      'The sentence has to be behavioural: it says what someone DOES or DOES NOT do because of this value. '
      + '"Honesty means we say no to work we cannot do well" beats "Honesty means being honest".',
      'Build each sentence from the moments they described, not from the word itself — the same moment '
      + 'that made the value a candidate should be recognisable in its definition.',
      'Cover exactly the values in their final selection: no extra ones, none left out. If a chosen value '
      + 'has no moment behind it in the inputs, ask about that one instead of inventing a meaning for it.',
    ],
  },
  'c.livedExamples': {
    goal: 'capture one real example per chosen value where this brand already lived it.',
  },
  'c.conflictRule': {
    goal: 'settle which of the chosen values wins when two of them collide, and why.',
    allowDefer: true,
  },
  'c.teamFilter': {
    goal: 'settle which value is the non-negotiable filter when this brand hires someone.',
    allowDefer: true,
  },

  // ── D · Archetyp & Stimme ───────────────────────────────────────────────
  'd.hypothesis': {
    goal: 'say which archetype speaks out of their appearance TODAY — as a reading, not as a decision.',
    siteAnalysis: true,
    rules: [
      'Work from what is in the inputs: the pitch, the tone analysis of their existing texts and what '
      + 'customers praise them for. Name one or two candidates and, for each, the evidence you read it '
      + 'from — a phrase from their own texts beats an adjective every time.',
      'Two to four sentences. Name the archetype in plain language, the way a person would say it, and '
      + 'stay short: this is the sentence you will say out loud before the choosing starts.',
      'DO NOT DECIDE ANYTHING HERE. This is the step before the choice: it says what their appearance '
      + 'sounds like, not who they are. Never write "you are the Sage" — write what you read and where.',
      'If their appearance pulls in two directions, SAY SO. A mixed appearance is a finding, not a '
      + 'failure — and it is often the most useful sentence in this whole chapter.',
    ],
    pathRules: {
      relaunch: [
        'This is a relaunch, so an appearance exists: read it as it is today, including the parts that '
        + 'no longer fit them.',
      ],
      new: [
        'This is a new brand, so there may be barely any appearance yet. If the inputs carry no existing '
        + 'texts, say plainly that you can only read their own description so far, and read THAT — do '
        + 'not invent an appearance to have something to analyse.',
      ],
    },
  },
  'd.pairs': {
    goal: 'settle which archetype of each pair feels more like this brand.',
  },
  'd.primary': {
    goal: 'propose the PRIMARY archetype of this brand — the one that carries how they behave.',
    rules: [
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
  },
  'd.secondary': {
    goal: 'propose the SECONDARY archetype — the one that keeps the primary from becoming a cliché.',
    rules: [
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
  },
  'd.gapReveal': {
    goal: 'put their self-image next to their outside image and name the difference.',
    rules: [
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
    ],
    pathRules: {
      relaunch: [
        'This is a relaunch: their appearance is years of accumulated decisions, not a mistake. Describe '
        + 'the gap as distance travelled, not as a verdict on their past.',
      ],
      new: [
        'This is a new brand: there may be almost no outside image yet. If the hypothesis rests on '
        + 'nothing but their own description, say exactly that in one sentence and stop — a gap you '
        + 'cannot see is one you must not report.',
      ],
    },
  },
  'd.party': {
    goal: 'capture how this brand would behave as a person at a party.',
  },
  'd.never': {
    goal: 'capture the one trait this brand must never have.',
  },
  'd.admired': {
    goal: 'capture a brand whose personality they admire and what exactly it is about that brand.',
  },
  'd.emotion': {
    goal: 'capture what people should feel when they interact with this brand.',
  },
  'd.voiceSamples': {
    goal: 'write EXACTLY THREE example sentences in the voice of this brand — three lines, no more and '
      + 'no fewer.',
    rules: [
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
  },
  'd.toneWords': {
    goal: 'name FOUR to SIX tone words for this brand — the words someone would use to describe how it '
      + 'sounds.',
    siteAnalysis: true,
    rules: [
      'Build them from the tone analysis of their existing texts, the archetype they chose and the '
      + 'feeling they want to leave behind. Where the analysis and the archetype disagree, follow the '
      + 'archetype: this is the tone they are going TO, not the one they are coming from.',
      'One adjective or short phrase per line, nothing else — no explanation, no pairs, no "but not ...". '
      + 'They are meant to be read at a glance and used as a checklist against a finished text.',
      'Every word has to EXCLUDE something. "Professional", "authentic", "modern" and "high-quality" '
      + 'exclude nothing — no brand aims to sound unprofessional. If you cannot name a plausible brand '
      + 'that the word rules out, it is the wrong word.',
    ],
  },
  'd.vocabulary': {
    goal: 'build their vocabulary list — the words they use and the words they avoid.',
    rules: [
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
  },

  // ── E · Manifest ────────────────────────────────────────────────────────
  'e.warmup1': {
    goal: 'capture what makes them angry about their own industry.',
  },
  'e.warmup2': {
    goal: 'capture what they wish more people understood about their work.',
  },
  'e.statements': {
    goal: 'draft the statement openers the manifesto will be built from.',
  },
  'e.composition': {
    goal: 'settle the tone, the length and the intended use of the manifesto.',
  },
  'e.manifesto': {
    goal: 'draft the manifesto of this brand from the confirmed statements and the chosen composition.',
  },
  'e.anchorLine': {
    goal: 'settle which single line of the manifesto is the one they would put on a wall.',
    // Der Wähler zeigt Zeilen des Manifests — der gewählte Satz MUSS deshalb
    // darin vorkommen (Plan §3a: „e.anchorLine ist ein Satz aus e.manifesto").
    invariants: [{ kind: 'sentenceOf', of: 'e.manifesto' }],
  },

  // ── E+ · Verbale Identität ──────────────────────────────────────────────
  'ep.taglines': {
    goal: 'propose tagline candidates and settle on the one that carries this brand.',
  },
  'ep.boilerplates': {
    goal: 'draft the three boilerplates of this brand: the one-line bio, the short paragraph and the '
      + 'full paragraph.',
  },
  'ep.keyMessages': {
    goal: 'draft the key messages of this brand, one set per audience.',
  },
  'ep.vocabulary': {
    goal: 'derive the words this brand uses and the words it avoids, as one list for everyday writing.',
  },
  'ep.distinctiveAsset': {
    goal: 'settle which line becomes the verbal signature of this brand.',
  },

  // ── F · Name & Prüfung ──────────────────────────────────────────────────
  'f.nameType': {
    goal: 'settle which kind of name fits this brand.',
  },
  'f.taste': {
    goal: 'capture three to five brand names they love, from any industry, and why each one works for them.',
  },
  'f.noGos': {
    goal: 'capture the words, styles and lengths that are off-limits for this name.',
  },
  'f.candidates': {
    goal: 'propose name candidates that fit the chosen name type, their taste and their no-gos.',
  },
  'f.shortlist': {
    goal: 'settle which name candidates make the shortlist.',
  },
  'f.checks': {
    goal: 'derive the availability checks for the shortlisted names.',
  },
  'f.criteria': {
    goal: 'rate the shortlisted names against the eight criteria.',
  },
  'f.decision': {
    goal: 'settle their top three names, in order.',
  },

  // ── Ergebnis ────────────────────────────────────────────────────────────
  'result.direction': {
    goal: 'settle which direction fits this brand.',
  },
  'result.rating': {
    goal: 'capture how helpful this result was — voluntary, and never pressed for.',
  },
}
