/**
 * DER INHALT EINER SESSION — Ziel, Qualität, Anti-Muster, Leiter, Form,
 * Beispiele (BW2 Paket 1 + Paket 2, Plan docs/plans/BRAND-WIZARD-SESSIONS.md
 * §3 + §3a; Inhaltsgrundlage docs/plans/BRAND-WIZARD-CONTENT-SPEC.md).
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
 * DIE BEISPIELE SIND DIE EINE AUSNAHME und liegen ZWEISPRACHIG vor — dasselbe
 * Muster wie die `openers` in `brandAdvisors.ts` und aus demselben Grund: sie
 * sind Text, kein Verhalten. Sie reisen in den Prompt der INHALTSSPRACHE
 * (`sessionInstruction`, Parameter `contentLocale`) UND auf die Abnahme-Seite
 * je Kapitel (Plan §5a: „Beispiel — das Beispiel aus der Session-Config …
 * je Pfad"), wo ein Mensch sie liest. Ein englisches Beispiel unter einer
 * deutschen Eingabe wäre dort eine Zumutung, und eine Wort-für-Wort-Übersetzung
 * wäre keine gute deutsche Zeile — beide Fassungen sind deshalb eigenständig
 * geschrieben.
 *
 * ── WOFÜR DIE BEISPIELE DA SIND UND WOFÜR NICHT ───────────────────────────
 * Für die FORM, nie für den Inhalt (Plan §3a Nr. 3). Deshalb stammt jedes aus
 * einer FREMDEN Branche, und die Branchen wechseln über die Sessions hinweg
 * (Tischlerei, Imkerei, Hundeschule, Orgelbau, Energieberatung …): 68-mal
 * dasselbe Tech-Startup hätte jedem Kunden dieselbe Welt vorgesetzt, und ein
 * Beispiel aus SEINER Branche schreibt das Modell ab. Innerhalb eines Kapitels
 * bleibt es bewusst bei EINEM Beispielbetrieb je Pfad — die Werte-Sessions
 * erzählen dieselbe Hundeschule weiter, weil man an einer fortlaufenden
 * Geschichte sieht, wie aus einem Moment ein Wert und daraus eine Definition
 * wird.
 *
 * ── DIE VERARBEITUNGSREGELN SIND WÖRTLICH DIE ALTEN ───────────────────────
 * `rules`/`pathRules` sind aus `georgePrompt.ts`, `veraPrompt.ts`,
 * `miloPrompt.ts` und `archetypePrompt.ts` WÖRTLICH hierher gezogen — Zeile für
 * Zeile, ohne Umformulierung; Paket 2 hat daran NICHTS geändert.
 * `tests/sessionPrompt.test.ts` hält die alten Texte weiter als Fixture
 * dagegen: jede Zeile von damals (ausser der `TASK:`-Zeile) steht auch im
 * neuen Prompt. Wer hier eine Zeile ändert, ändert einen Prompt und muss die
 * Prompt-Fassung (`*_PROMPT_VERSION`) hochzählen.
 *
 * ── WAS PAKET 2 DAZUGELEGT HAT ───────────────────────────────────────────
 * `quality`, `antiPatterns`, `ladder`, `form`, `examples`, `answers` und
 * `effort` je Session — der Inhalt aus Plan §3a. Weil damit jeder Entwurfs-
 * Auftrag länger geworden ist, sind alle vier Prompt-Fassungen gestiegen
 * (`george-a-12`, `vera-b-3`, `milo-c-3`, `george-archetype-3`).
 *
 * `quality` und `antiPatterns` sind PFLICHTFELDER dieses Typs, nicht optional:
 * eine Session ohne prüfbare Merkmale macht `goalReached` (Plan §7) wieder zu
 * einer Stimmung, und der Compiler ist hier der billigere Wächter als ein Test.
 *
 * ── DIESE DATEI LIEGT IM CLIENT-BÜNDEL ───────────────────────────────────
 * `slotRegistry.ts` wird im Browser gelesen (Navigation, Fortschritt), also
 * reisen diese Texte mit. Das ist der bewusste Preis dafür, dass es EINEN
 * Session-Vertrag gibt und nicht einen für den Server und einen für die
 * Anzeige (Plan §3) — und seit §5a ist es kein reiner Preis mehr: die
 * Abnahme-Seite BRAUCHT Beispiel, Ziel und Bereich im Browser. Wird es je eng,
 * ist die Antwort ein serverseitiger Nachlade-Weg für `processing.rules`
 * (die einzige Gruppe, die nur das Modell liest), nicht ein zweiter Vertrag.
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
 * Die Beispiele EINES Pfades, je Oberflächen-Sprache (s. Kopf). Beide Fassungen
 * sind eigenständig geschrieben, keine Übersetzung voneinander.
 */
export interface BrandSessionExampleSet {
  readonly de: readonly string[]
  readonly en: readonly string[]
}

/**
 * 1–2 erfundene starke Werte je Pfad, IMMER aus einer fremden Branche
 * (Plan §3a Nr. 3) — für die FORM, nie für den Inhalt. Wo es keine gibt: leer.
 */
export interface BrandSessionExamples {
  readonly new: BrandSessionExampleSet
  readonly relaunch: BrandSessionExampleSet
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
 *
 * `goal`, `quality` und `antiPatterns` sind Pflicht (s. Kopf).
 */
export interface BrandSessionContent {
  /** ZIEL — ein Satz, was am Ende feststehen muss. Pflicht für jede Session. */
  readonly goal: string
  /** 3–5 PRÜFBARE Merkmale eines guten Werts — je eines mit Ja/Nein zu beantworten. */
  readonly quality: readonly string[]
  /** 2–3 konkrete Muster, die der Spezialist zurückweist. */
  readonly antiPatterns: readonly string[]
  /** Die Interviewführung — nur bei `ask`/`collect`/`choose`. */
  readonly ladder?: BrandSessionLadder
  /** Beispiele je Pfad und Sprache (s. Kopf). */
  readonly examples?: BrandSessionExamples
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
  /** Abweichungen von den Antwort-Regeln der Arbeitsform. */
  readonly answers?: Partial<BrandSessionAnswers>
  /** Abweichender Umfang — sonst gilt der Wert der Arbeitsform. */
  readonly effort?: BrandSessionEffort
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
 * KURZFORM FÜR DEN REGELFALL: je Pfad EIN Beispiel, je Sprache eines.
 *
 * Zwei Beispiele sind erlaubt (Plan §3a Nr. 3) und stehen dann als volles
 * Objekt da — die Kurzform deckt den Normalfall, damit 68 Einträge nicht aus
 * 340 Zeilen Klammern bestehen.
 */
function pathExamples(
  fresh: { de: string, en: string },
  relaunch: { de: string, en: string },
): BrandSessionExamples {
  return {
    new: { de: [fresh.de], en: [fresh.en] },
    relaunch: { de: [relaunch.de], en: [relaunch.en] },
  }
}

/**
 * DIE 68 SESSIONS. Reihenfolge wie im Katalog — die Registry prüft, dass hier
 * genau ihre Ids stehen (kein verwaister Eintrag, keine Session ohne Ziel).
 */
export const SESSION_CONTENT: Readonly<Record<string, BrandSessionContent>> = {
  // ── A · Kontext ─────────────────────────────────────────────────────────
  // Beispiel-Betriebe dieses Kapitels: Tischlerei / Physiotherapie und was der
  // jeweiligen Frage am besten steht — Baustein A fragt breit, also darf er
  // auch breit zeigen.
  'a.pitch': {
    goal: 'draft the elevator pitch of this brand: what they do, who it is for, and what is different '
      + 'about it, in two or three sentences.',
    quality: [
      'Someone from outside the industry understands it after reading it once.',
      'It names who it is for, not only what is made.',
      'It carries at least one detail that comes from this brand and not from its industry.',
      'No sentence of it could be moved to a competitor page unchanged.',
    ],
    antiPatterns: [
      'A list of services instead of a sentence about what the customer gets.',
      'Superlatives with nothing behind them: leading, innovative, world-class.',
      'Trade jargon that only insiders can decode.',
    ],
    form: { person: 'we', tense: 'present', maxWords: 60 },
    examples: pathExamples(
      {
        de: 'Wir bauen Einbauschränke für Altbauwohnungen mit schiefen Wänden — vor Ort eingemessen statt '
          + 'aus dem Katalog. Für Leute, die ihre Wohnung behalten und trotzdem Platz brauchen.',
        en: 'We build fitted cupboards for old flats with crooked walls, measured on site instead of ordered '
          + 'from a catalogue. For people who want to keep the flat and still find room for their things.',
      },
      {
        de: 'Wir sind eine Physiotherapie für Menschen nach einer Knie-Operation. Wir nehmen uns 45 Minuten '
          + 'statt 20 und sprechen direkt mit der Klinik, die operiert hat.',
        en: 'We are a physiotherapy practice for people recovering from knee surgery. We take 45 minutes '
          + 'instead of 20 and talk directly to the clinic that did the operation.',
      },
    ),
    rules: [
      'Work from the start card: "what they do" and "who it is for" are the person\'s own words — keep their '
      + 'substance, sharpen the wording.',
      'Two to three sentences, plain language, no superlatives and no marketing noise. '
      + 'Say what they do, who it is for, and what makes it different.',
    ],
  },
  'a.category': {
    goal: 'name the industry / category this brand plays in, normalised to a term the industry itself uses.',
    quality: [
      'Five words at most.',
      'It is a term the person would find in a trade directory.',
      'It excludes at least half of what a word like "agency" or "shop" would include.',
      'It says what they DO — the shelf they are compared on comes later.',
    ],
    antiPatterns: [
      'A slogan in place of a category: "we make things people love".',
      'A word so broad that every company fits: services, consulting, solutions.',
      'An invented category nobody is looking for.',
    ],
    form: { person: 'none', tense: 'present', maxWords: 5 },
    examples: pathExamples(
      { de: 'Imkerei mit Direktvermarktung', en: 'Beekeeping with direct sales' },
      { de: 'Steuerkanzlei für Handwerksbetriebe', en: 'Tax practice for skilled trades' },
    ),
    rules: [
      'The start card carries their own answer to "industry" — normalise THAT, do not replace it with a '
      + 'category you would have picked.',
      'One line, at most five words. "Software agency for online shops" — not "we build stuff".',
    ],
  },
  'a.competitors': {
    goal: 'write 3-5 short competitor profiles.',
    quality: [
      'Every name in the list appears literally in the inputs.',
      'Each line carries one strength and one weakness, both of them things a customer would notice.',
      'Anything you could only infer is marked as an assumption in the line itself.',
      'The weakness is a fact about the offer, not a judgement about the company.',
    ],
    antiPatterns: [
      'Invented competitors that merely sound plausible for the industry.',
      'Filler such as "not stated in the inputs" instead of a point.',
      'A strength and a weakness that are the same sentence in two moods.',
    ],
    form: { person: 'none', tense: 'present' },
    examples: pathExamples(
      {
        de: '- Backhaus Merten — stark: sechs Filialen, alle am Bahnhof — schwach: eine Teiglinie für alles, '
          + 'kein Sauerteig',
        en: '- Merten Bakeries — strong: six shops, all next to the station — weak: one dough line for '
          + 'everything, no sourdough',
      },
      {
        de: '- Velo Grün — stark: Termin am selben Tag — schwach: repariert nur Räder, die sie selbst '
          + 'verkauft haben',
        en: '- Velo Grün — strong: same-day appointments — weak: only repairs bikes they sold themselves',
      },
    ),
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
    goal: 'sketch the audience of this brand: who they are, what they want, and what holds them back.',
    quality: [
      'Each block says what these people are trying to get done, not how old they are.',
      'What holds them back is a real obstacle, not their ignorance of this brand.',
      'Three blocks at most — a brand that serves everyone serves nobody.',
      'Someone who takes the calls would recognise these people from the description.',
    ],
    antiPatterns: [
      'Demographics standing in for a need: "women, 30 to 45, urban".',
      'An audience described as "everyone who needs what we do".',
      '"They do not know us yet" as the obstacle.',
    ],
    form: { person: 'none', tense: 'present' },
    examples: pathExamples(
      {
        de: '## Wer\nEltern beim ersten Kind, ohne Familie in der Stadt\n\n## Was sie wollen\nJemanden, der '
          + 'nachts ans Telefon geht\n\n## Was sie bremst\nSie wissen nicht, was die Kasse zahlt',
        en: '## Who\nFirst-time parents with no family in the city\n\n## What they want\nSomebody who picks '
          + 'up the phone at night\n\n## What holds them back\nThey do not know what the insurance covers',
      },
      {
        de: '## Wer\nErwachsene, die mit 40 wieder anfangen zu klettern\n\n## Was sie wollen\nEinen Abend, '
          + 'an dem sie nicht die Schlechtesten sind\n\n## Was sie bremst\nDie Angst, vor Zwanzigjährigen '
          + 'zu scheitern',
        en: '## Who\nAdults taking up climbing again at 40\n\n## What they want\nAn evening where they are '
          + 'not the worst in the room\n\n## What holds them back\nThe fear of failing in front of '
          + 'twenty-year-olds',
      },
    ),
    rules: [
      'The start card\'s "who it is for" is the seed — unfold it, do not overwrite it.',
      'One block per audience, at most three blocks. Use these labels: "Who", "What they want", '
      + '"What holds them back". Concrete over demographic: what these people are trying to get done.',
    ],
  },
  'a.toneAnalysis': {
    goal: 'analyse the tone of the existing texts contained in the inputs below.',
    quality: [
      'Every trait carries a short phrase quoted from their own texts.',
      'Three to five traits, no more.',
      'It describes how they sound TODAY, not how they ought to sound.',
      'A reader could find the quoted phrase on their site.',
    ],
    antiPatterns: [
      'A trait with no quote behind it.',
      'Advice about how the brand should sound instead of a reading of how it does.',
      'A tone analysis written although no existing text was given.',
    ],
    form: { person: 'none', tense: 'present', maxWords: 70 },
    examples: pathExamples(
      {
        de: 'Sachlich und knapp — „Wir brennen zweimal, bei 1240 Grad." Viel Handwerk, keine Werbung. '
          + 'Distanziert: die Seite sagt nirgends „du" oder „ihr".',
        en: 'Plain and short — "we fire twice, at 1240 degrees". A lot of craft, no advertising. Distant: '
          + 'the site never addresses anyone directly.',
      },
      {
        de: 'Feierlich bis pathetisch — „Wo Sonne und Schiefer sich begegnen." Traditionsschwer, ohne eine '
          + 'einzige Jahreszahl oder einen Preis.',
        en: 'Solemn to the point of pathos — "where sun and slate meet". Heavy with tradition, without a '
          + 'single year or price anywhere.',
      },
    ),
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
    quality: [
      'It names a concrete trigger: a moment, a job, a person, a year.',
      'It says which problem was unbearable enough to act on.',
      'It is told as something that happened, not as a mission statement.',
      'On a relaunch it names one thing that must stay and one that goes, each with a reason.',
    ],
    antiPatterns: [
      'A founding myth polished into marketing: "we saw an opportunity in a growing market".',
      'A curriculum vitae instead of a reason.',
      'On a relaunch: "everything has to change", without one thing worth keeping.',
    ],
    ladder: {
      opening: 'the smallest concrete thing — the moment or the job that started it.',
      probes: [
        'what happened right before that, and what was the last straw?',
        'who else was in the room, and what did they say?',
      ],
      reframes: [
        'if the answer is a market opportunity, ask what personally annoyed them about the way it was done before',
        'if the answer is a career history, ask which single job made them think: never again like that',
      ],
    },
    answers: { minSubstance: 'long', maxProbes: 2 },
    effort: { minutes: 5, turns: 4 },
    examples: pathExamples(
      {
        de: 'Nach zwölf Jahren im Reitstall habe ich zum dritten Mal einen Sattel abgenommen, der ein Pferd '
          + 'wundgescheuert hat, weil er von der Stange war. Danach habe ich angefangen, selbst zu messen.',
        en: 'After twelve years in the stable I took off the third saddle that had rubbed a horse raw '
          + 'because it came off the shelf. That was when I started measuring and building them myself.',
      },
      {
        de: 'Bleiben muss der Name und das gelbe Klavier auf dem Schild — daran erkennen uns die Eltern seit '
          + '1994. Weg muss das Wort „Konservatorium": es schreckt genau die Erwachsenen ab, die abends '
          + 'anfangen wollen.',
        en: 'The name stays, and the yellow piano on the sign — parents have recognised us by it since 1994. '
          + 'What goes is the word "conservatory": it scares off exactly the adults who want to start in '
          + 'the evening.',
      },
    ),
  },
  'a.customerPraise': {
    goal: 'capture the sentence their happiest customers say about them, in the words the customers use.',
    quality: [
      'It is one sentence a customer actually said, in that customer\'s words.',
      'It is specific enough that another company could not have received it.',
      'It praises a behaviour or a moment, not a product feature.',
      'It could be printed with quotation marks around it.',
    ],
    antiPatterns: [
      'A summary of feedback: "customers value our reliability".',
      'A review rewritten in company voice.',
      'A star rating with no sentence in it.',
    ],
    ladder: {
      opening: 'one sentence, verbatim, the way a customer said it.',
      probes: [
        'when did you last hear it, and what had just happened?',
        'who said it, and what were they reacting to?',
      ],
      reframes: [
        'if the answer summarises many customers, ask for the last single person who said something',
        'if the answer is a feature, ask for the moment where that feature mattered to someone',
      ],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: '„Ihr habt als Einzige die Kiste mit dem Geschirr meiner Mutter nicht gestapelt — ich hatte das '
          + 'nur einmal gesagt."',
        en: '"You were the only ones who did not stack the box with my mother\'s china. I only mentioned it once."',
      },
      {
        de: '„Bei euch fragt mich jemand, ob ich das schon mal genommen habe. Sonst bekomme ich nur die '
          + 'Schachtel über den Tresen."',
        en: '"Here somebody asks whether I have taken this before. Everywhere else I just get the box handed '
          + 'over the counter."',
      },
    ),
  },
  'a.complaints': {
    goal: 'capture the complaints and negative feedback this brand actually gets, unvarnished.',
    quality: [
      'It quotes or paraphrases a complaint that was really made.',
      'It is uncomfortable enough that no marketing page would print it.',
      'It says what triggered the complaint, not only the mood it arrived in.',
      'It does not excuse itself in the same breath.',
    ],
    antiPatterns: [
      'A humblebrag: "we are sometimes too thorough".',
      '"We have no complaints."',
      'A complaint blamed entirely on the customer.',
    ],
    ladder: {
      opening: 'the last complaint they actually received, in the words it arrived in.',
      probes: [
        'what had happened right before that call or that mail?',
        'is that a one-off, or does it come back every few months?',
      ],
      reframes: [
        'if the answer is a humblebrag, ask what the angriest customer of the last year said',
        'if the answer is "none", ask what people quietly stop doing instead of complaining',
      ],
    },
    sensitivity: 'internal',
    examples: pathExamples(
      {
        de: '„Ihr habt den Termin zweimal verschoben, und beide Male musste ich selbst nachfragen."',
        en: '"You moved the appointment twice, and both times I had to ask before anyone told me."',
      },
      {
        de: '„Am Ende waren es 900 Euro mehr als im Kostenvoranschlag, und vorher hat niemand Bescheid gesagt."',
        en: '"The final bill was 900 euros over the estimate, and nobody warned us before the work was done."',
      },
    ),
  },
  'a.oneThing': {
    goal: 'capture the one thing they wish every customer knew about them.',
    quality: [
      'It is one thing, not a list.',
      'It is something customers demonstrably do not know today.',
      'Knowing it would change a decision a customer makes.',
      'It is checkable, not a claim about attitude.',
    ],
    antiPatterns: [
      'A slogan: "that we really care".',
      'Three things joined by commas.',
      'Something their own front page already says.',
    ],
    ladder: {
      opening: 'the one sentence they wish every customer already knew.',
      probes: [
        'what do people get wrong about you again and again?',
        'what would be different for a customer who knew it before the first call?',
      ],
      reframes: [
        'if the answer is a claim about attitude, ask for the fact behind it',
        'if there are three, ask which one costs them the most misunderstandings',
      ],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: 'Dass wir eine Sohle auch dann noch retten, wenn zwei andere Werkstätten schon abgelehnt haben.',
        en: 'That we still save a sole after two other workshops have turned it down.',
      },
      {
        de: 'Dass wir Berufskleidung reparieren statt sie zu ersetzen — das steht auf keinem unserer Angebote.',
        en: 'That we repair workwear instead of replacing it — it is on none of our quotes.',
      },
    ),
  },
  'a.challenge': {
    goal: 'capture the biggest obstacle standing in front of this brand right now.',
    quality: [
      'It names one obstacle, and it is the one actually in the way this month.',
      'It is specific enough to say what would have to change.',
      'It is honest about their own part in it.',
      'It is more than "we need more customers".',
    ],
    antiPatterns: [
      '"The economy" or "the market", with nothing in it they control.',
      'A goal dressed up as an obstacle: "growing to ten people".',
      'A list of five problems.',
    ],
    ladder: {
      opening: 'the one thing that is actually in the way right now.',
      probes: [
        'what did it stop you from doing in the last four weeks?',
        'what would have to be true for it to be gone?',
      ],
      reframes: [
        'if the answer is the market, ask what they would change tomorrow if they could',
        'if the answer is a goal, ask what stands between them and it',
      ],
    },
    sensitivity: 'internal',
    examples: pathExamples(
      {
        de: 'Wir sind vier Monate im Jahr ausgebucht und acht Monate leer — die Ausbilder kann ich aber nur '
          + 'ganzjährig halten.',
        en: 'We are booked out four months a year and empty the other eight — but I can only keep instructors '
          + 'on a full-year contract.',
      },
      {
        de: 'Unsere Stammkunden sind mit uns alt geworden. Die Vierzigjährigen kennen uns nur vom Etikett im '
          + 'Getränkemarkt.',
        en: 'Our regulars have grown old with us. People in their forties only know us from the label in the '
          + 'supermarket.',
      },
    ),
  },
  'a.facts': {
    goal: 'collect the plain facts of this brand: how big the team is, how long it has existed and which '
      + 'markets it serves.',
    quality: [
      'Every part carries a number or a plain "not yet".',
      'The team size counts the people who actually work in it, freelancers named as such.',
      'The age is a year, not "for a long time".',
      'The markets are named places or channels where money actually came in.',
    ],
    antiPatterns: [
      '"A small, dedicated team" instead of a number.',
      '"Since forever" instead of a year.',
      '"Worldwide" for a business that ships inside one country.',
    ],
    ladder: {
      opening: 'three quick facts, one at a time: team, age, markets.',
      probes: [
        'does that number include freelancers and part-timers?',
        'in which of those markets did you actually sell something last year?',
      ],
      reframes: [
        'if a number is missing, offer the range you can read from the inputs and ask for a yes or no',
        'if the answer is "worldwide", ask for the three places the money really comes from',
      ],
    },
    // Drei Teile, nicht vier: der Content-Spec §4 nennt „Zahlen: Teamgrösse,
    // Alter, Märkte", die Frage im Katalog stellt genau diese drei.
    parts: ['teamSize', 'age', 'markets'],
    sensitivity: 'internal',
    // Vertagen, weil die Zahlen oft im Steuerbüro oder beim Partner liegen —
    // ohne diesen Ausgang schätzt jemand, und eine geschätzte Teamgrösse steht
    // danach als Tatsache im Dokument.
    answers: { minSubstance: 'short', maxProbes: 1, allowDefer: true },
    effort: { minutes: 2, turns: 3 },
    examples: pathExamples(
      {
        de: 'Team: 3 fest, 2 auf Saison · Seit: 2021 · Märkte: Landkreis und Wochenmarkt in der Stadt',
        en: 'Team: 3 permanent, 2 seasonal · Since: 2021 · Markets: the county and the city farmers market',
      },
      {
        de: 'Team: 11 Angestellte, davon 4 in Teilzeit · Seit: 1978 · Märkte: Deutschland und Österreich, '
          + 'Versand ab Werk',
        en: 'Team: 11 employees, 4 of them part-time · Since: 1978 · Markets: Germany and Austria, shipped '
          + 'from the works',
      },
    ),
  },

  // ── B · Purpose · Vision · Mission ──────────────────────────────────────
  // Beispiel-Betriebe: Buchbinderei / Optiker für die Fragen, Kaffeerösterei /
  // Pflegedienst für die drei Sätze — der Purpose-Beispielsatz steht neben
  // seinem Vision- und Mission-Pendant, sonst lernt man die Unterschiede nicht.
  'b.whyStarted': {
    goal: 'turn what this person already told you about the beginning of this brand into ONE sentence '
      + 'about why that still matters TODAY.',
    quality: [
      'One sentence, two at the very most.',
      'It says why it matters today, not how it began.',
      'The reason is traceable to something they already said.',
      'It stays true when the founding anecdote is removed.',
    ],
    antiPatterns: [
      'The founding anecdote retold in place of the reason.',
      'A purpose statement smuggled in early: "we exist to change the world of ...".',
      'A reason any company in the industry could claim.',
    ],
    ladder: {
      opening: 'the reason inside their own origin story, offered back in one sentence.',
      probes: ['is that still the reason, or has it shifted since?'],
      reframes: ['if it comes back as an anecdote, ask what of it is still true on an ordinary Tuesday'],
    },
    form: { person: 'we', tense: 'present', maxWords: 30 },
    examples: pathExamples(
      {
        de: 'Weil Reparieren immer noch billiger und schöner ist als neu kaufen — nur weiß das kaum jemand.',
        en: 'Because mending is still cheaper and better looking than buying new — and almost nobody knows it.',
      },
      {
        de: 'Weil eine Brille ein medizinisches Gerät ist, das jemand den ganzen Tag im Gesicht trägt.',
        en: 'Because a pair of glasses is a medical device somebody wears on their face all day.',
      },
    ),
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
    quality: [
      'It names something concrete that would stop happening.',
      'It is about people outside the company.',
      'It is not measured in revenue or in jobs.',
      'Someone who never heard of this brand would still see the loss.',
    ],
    antiPatterns: [
      'The revenue answer: "our customers would have to go elsewhere".',
      'An answer about the team losing their jobs.',
      'A claim of being irreplaceable with nothing behind it.',
    ],
    ladder: {
      opening: 'what would stop happening if they closed tomorrow.',
      probes: [
        'who would notice first, and what would they do instead?',
        'would somebody else simply take it over, or would it really stop?',
      ],
      reframes: [
        'if the answer is about turnover, ask who would be left without something',
        'if the answer is "someone else would do it", ask what would then be done WORSE',
      ],
    },
    examples: pathExamples(
      {
        de: 'Dann gäbe es im Ort keinen Platz mehr, an dem jemand einem Zwölfjährigen zeigt, wie man einen '
          + 'Toaster aufschraubt.',
        en: 'There would be no place left in town where somebody shows a twelve-year-old how to open a toaster.',
      },
      {
        de: 'Zwölf Dorfkirchen hier hätten niemanden mehr, der ihre Orgeln stimmt, ohne sie vorher umzubauen.',
        en: 'Twelve village churches would have nobody left who tunes their organs without rebuilding them first.',
      },
    ),
  },
  'b.conviction': {
    goal: 'capture the belief that drives this company — the one they would defend even when it costs them.',
    quality: [
      'It is a belief someone could openly disagree with.',
      'It has already cost them something, and they can say what.',
      'It is stated as a claim about the world, not about themselves.',
      'It fits into one sentence.',
    ],
    antiPatterns: [
      'A belief nobody would contradict: "quality matters".',
      'A list of value words instead of a conviction.',
      'A conviction that has never cost anything.',
    ],
    ladder: {
      opening: 'the belief they would defend even when it costs them.',
      probes: [
        'when did holding it last cost you money or a customer?',
        'who in your industry would openly disagree with it?',
      ],
      reframes: [
        'if nobody could disagree, ask for the version their competitor would refuse to sign',
        'if it is a list of values, ask which one they have already paid for',
      ],
    },
    examples: pathExamples(
      {
        de: 'Rohmilch gehört in Käse. Pasteurisieren macht ihn sicher und gleichzeitig belanglos — das hat '
          + 'uns schon zwei Supermärkte gekostet.',
        en: 'Raw milk belongs in cheese. Pasteurising makes it safe and meaningless at once — that has '
          + 'already cost us two supermarket listings.',
      },
      {
        de: 'Wer Angst vor dem Kreisverkehr hat, braucht keine dreißig Übungsstunden, sondern einen '
          + 'Fahrlehrer, der nicht schreit.',
        en: 'Somebody afraid of a roundabout does not need thirty more lessons, they need an instructor who '
          + 'does not shout.',
      },
    ),
  },
  'b.tenYears': {
    goal: 'capture what looks different in the world ten years from now because this brand existed.',
    quality: [
      'It describes a state of the world, not a company milestone.',
      'Somebody could tell whether it has arrived or not.',
      'It is bigger than this brand and still connected to it.',
      'It contains no target figures.',
    ],
    antiPatterns: [
      'A growth plan: "three locations, twenty employees".',
      'A world so large the brand plays no part in it.',
      'The mission repeated in the future tense.',
    ],
    ladder: {
      opening: 'what looks different in the world in ten years because they existed.',
      probes: [
        'who would notice that change without ever hearing your name?',
        'what is ordinary by then that is unusual today?',
      ],
      reframes: [
        'if the answer is a growth plan, ask what that growth would make possible for other people',
        'if the answer is a better world in general, ask which corner of it they can actually touch',
      ],
    },
    examples: pathExamples(
      {
        de: 'In den Neubaugebieten hier stehen dann Bäume, die 2040 noch Schatten werfen — nicht die drei '
          + 'Sorten, die im Container am billigsten sind.',
        en: 'By then the new housing estates here have trees that will still give shade in 2040 — not the '
          + 'three varieties that are cheapest in a pot.',
      },
      {
        de: 'Eine Stadtbibliothek ist dann selbstverständlich der Ort, an dem einem jemand beim Antrag hilft, '
          + 'nicht nur beim Buch.',
        en: 'By then a public library is obviously the place where somebody helps you with a form, not only '
          + 'with a book.',
      },
    ),
  },
  'b.legacy': {
    goal: 'capture what people should be saying about this brand in twenty years.',
    quality: [
      'It is a sentence somebody else would say, in that person\'s words.',
      'It names something they did, not something they were.',
      'It survives the founder leaving.',
      'It is modest enough to be believable.',
    ],
    antiPatterns: [
      'A eulogy for the founder rather than for the brand.',
      'A superlative: "the best in the region".',
      'The ten-year answer said again.',
    ],
    ladder: {
      opening: 'the sentence people should be saying about them in twenty years.',
      probes: [
        'who says it — a customer, a colleague, a competitor?',
        'what did you have to do so that they could say it?',
      ],
      reframes: [
        'if it is about the founder, ask what should be said about the workshop after they stop',
        'if it is a superlative, ask what somebody would point at as proof',
      ],
    },
    examples: pathExamples(
      {
        de: '„Bei denen konnte man mitsingen, ohne vorher Noten lesen zu können — und es klang trotzdem gut."',
        en: '"You could sing with them without reading music first, and it still sounded good."',
      },
      {
        de: '„Die haben das Geländer gemacht, das seit vierzig Jahren hält, und man sieht keine einzige '
          + 'Schweißnaht."',
        en: '"They made the railing that has held for forty years, and you cannot see a single weld."',
      },
    ),
  },
  'b.purpose': {
    goal: 'draft the PURPOSE of this brand — the WHY. The reason it exists beyond making money.',
    quality: [
      'One sentence.',
      'It names why the world is better, not what the company sells.',
      'No competitor in this industry could say it word for word.',
      'No product, service or feature is mentioned in it.',
      'A founder could say it out loud without wincing.',
    ],
    antiPatterns: [
      'A sentence assembled from quality, passion and innovation.',
      'The formula left visible: "we exist so that customers get value".',
      'A growth or revenue goal in disguise.',
    ],
    form: {
      person: 'we',
      tense: 'present',
      maxWords: 25,
      forbidden: ['the brand name', 'product or service names', 'numbers and targets'],
    },
    examples: pathExamples(
      {
        de: 'Damit niemand mehr glaubt, guter Kaffee sei eine Frage der Maschine und nicht der Bohne.',
        en: 'So that nobody keeps believing good coffee is a question of the machine rather than the bean.',
      },
      {
        de: 'Damit alt werden zu Hause nicht davon abhängt, ob die Familie in der Nähe wohnt.',
        en: 'So that growing old at home does not depend on whether your family lives nearby.',
      },
    ),
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
    quality: [
      'One sentence describing a state that HAS arrived.',
      'It contains no figure, market share or headcount.',
      'A stranger could tell whether the world is there yet.',
      'It reaches further than a plan and still points at today.',
    ],
    antiPatterns: [
      'A target: "market leader in the region by 2035".',
      'An intention instead of a picture: "we want X to become normal".',
      'A world so vague that this brand is not in it.',
    ],
    form: {
      person: 'none',
      tense: 'present',
      maxWords: 25,
      forbidden: ['numbers, market shares and headcounts', 'the words "we want" and "we will"'],
    },
    examples: pathExamples(
      {
        de: 'Ein Haus aus Holz zu bauen ist hier so normal wie eines aus Stein — und niemand fragt mehr, ob '
          + 'das hält.',
        en: 'Building a house out of wood is as ordinary here as building one out of stone, and nobody asks '
          + 'any more whether it lasts.',
      },
      {
        de: 'Ein Tier zum Arzt zu bringen ist kein Kraftakt mehr, weil die Praxis dorthin kommt, wo das Tier '
          + 'lebt.',
        en: 'Taking an animal to the vet is no longer an ordeal, because the practice comes to where the '
          + 'animal lives.',
      },
    ),
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
    quality: [
      'One sentence: what they do, for whom, to what end.',
      'Concrete enough that a new colleague could act on it tomorrow.',
      'It sits under the purpose instead of repeating it.',
      'Active voice, present tense, no conditional.',
    ],
    antiPatterns: [
      'A second purpose: another sentence beginning "we exist to".',
      'A list of services.',
      'A sentence whose only verb is "provide" or "offer".',
    ],
    form: { person: 'we', tense: 'present', maxWords: 30 },
    examples: pathExamples(
      {
        de: 'Wir lesen, was wir verkaufen, und legen jedem Kind das Buch in die Hand, das es tatsächlich zu '
          + 'Ende liest.',
        en: 'We read what we sell, and we put into every child\'s hands the book they will actually finish.',
      },
      {
        de: 'Wir passen Hörgeräte in der Wohnung der Kundin an, damit sie dort funktionieren, wo sie '
          + 'getragen werden.',
        en: 'We fit hearing aids in the customer\'s own living room, so that they work where they are '
          + 'actually worn.',
      },
    ),
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
    quality: [
      'It names the shelf they are compared on, not the trade they practise.',
      'Somebody is already looking for that category.',
      'It excludes at least half of the industry.',
      'It can be said in five words.',
    ],
    antiPatterns: [
      'The industry repeated as a category.',
      'A category that exists only inside this one sentence.',
      'A category so broad that every competitor is on the same shelf.',
    ],
    ladder: {
      opening: 'name the shelf, say in one sentence why, then append the alternatives as options.',
      probes: ['who would you be compared against on that shelf?'],
      reframes: ['if they take the broadest option, ask which half of it they would rather not be measured against'],
    },
    form: { person: 'none', tense: 'present', maxWords: 5 },
    examples: pathExamples(
      {
        de: 'Naturseifen für empfindliche Haut — nicht „Kosmetik"',
        en: 'Natural soap for sensitive skin — not "cosmetics"',
      },
      {
        de: 'Breitensport für späte Anfänger — nicht „Leistungssport"',
        en: 'Community sport for late starters — not "competitive sport"',
      },
    ),
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
    quality: [
      'It names one group for whom they are the first call.',
      'It names who they are the first choice AGAINST.',
      'The group is small enough to be recognisable.',
      'Somebody in that group would agree with the description.',
    ],
    antiPatterns: [
      '"Everyone who values quality."',
      'A first choice with no competitor named.',
      'A group defined by budget alone.',
    ],
    ladder: {
      opening: 'for whom, inside that category, they are the first call — and instead of whom.',
      probes: [
        'who do those people call if not you, and why do they call you first?',
        'which kind of job would you rather send on to somebody else?',
      ],
      reframes: [
        'if the answer is "everyone", ask who has called twice this year and why',
        'if no competitor is named, ask who else was on the list the last time they were chosen',
      ],
    },
    examples: pathExamples(
      {
        de: 'Für Hausbesitzer mit Reetdach, die schon einmal Pfusch bezahlt haben — gegen die großen '
          + 'Bedachungsfirmen, die Reet nebenbei mitnehmen.',
        en: 'For owners of a thatched roof who have already paid for a botched job — against the big roofing '
          + 'firms that carry thatch as a sideline.',
      },
      {
        de: 'Für Gastwirte, die ein ganzes Tier abnehmen können — gegen den Großhandel, der nur Teilstücke '
          + 'liefert.',
        en: 'For restaurant owners who can take a whole animal — against the wholesalers who only deliver cuts.',
      },
    ),
  },

  // ── B2 · Markenarchitektur ──────────────────────────────────────────────
  // Beispiel-Betriebe: Obstbrand-Destillerie / Sanitätshaus — beide haben
  // mehrere Angebote unter einem Dach, und daran sieht man die vier Modelle.
  'b2.visibility': {
    goal: 'settle whether the other brands should visibly belong to the main brand or stand on their own.',
    quality: [
      'The answer is a decision, not a preference.',
      'It says what the CUSTOMER should see, not what the ownership looks like.',
      'It gives one reason.',
      'It holds for all the sub-brands, or it names the exception.',
    ],
    antiPatterns: [
      '"It depends", without naming what it depends on.',
      'An answer about internal ownership instead of what a customer sees.',
      'Both at once — "visible but independent" — with no rule for the conflict.',
    ],
    ladder: {
      opening: 'what a customer should see on the product: the main brand, or not.',
      probes: ['what should somebody assume about the main brand when they meet the product first?'],
      reframes: ['if the answer is "it depends", take the case that comes up most often and decide that one'],
    },
    // Vertagen, weil die Architektur oft zu zweit entschieden wird — hier
    // erfindet sonst eine Person eine Festlegung für alle.
    answers: { minSubstance: 'short', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Sichtbar. Wer den Quittenbrand kauft, soll wissen, dass er vom selben Hof kommt wie der Most.',
        en: 'Visible. Whoever buys the quince spirit should know it comes from the same farm as the juice.',
      },
      {
        de: 'Eigenständig. Die Reha-Marke darf nicht nach Sanitätshaus aussehen, sonst kommt kein '
          + 'Sportverein auf uns zu.',
        en: 'On their own. The rehab brand must not look like a medical supplies shop, or no sports club '
          + 'will ever call us.',
      },
    ),
  },
  'b2.roleOfMaster': {
    goal: 'settle whether the main brand lends the other brands its trust, or leaves them free to reach '
      + 'audiences the main brand cannot.',
    quality: [
      'It names what the main brand gives the others: trust, reach, or nothing.',
      'It also names what the main brand costs them.',
      'It is honest about the audiences the main brand cannot reach.',
      'It is one decision, not two options side by side.',
    ],
    antiPatterns: [
      '"Both", with no rule for the case where they collide.',
      'An answer that only lists the advantages of the main brand.',
      'A statement about reporting lines instead of about customers.',
    ],
    ladder: {
      opening: 'whether the main brand lends trust here, or gets in the way.',
      probes: ['which customers would be put off if the main brand were on it?'],
      reframes: ['if the answer is "both", ask which of the two they would give up if forced'],
    },
    // INTERN (Paket-2-Zusatz zu den drei aus Plan §3a Nr. 7): die ehrliche
    // Antwort lautet oft „unsere Hauptmarke schreckt genau diese Kundschaft ab".
    // Das ist eine Selbstauskunft über den eigenen Ruf — kein Satz, den ein
    // Share-Link einem Fremden zeigen soll. Die ENTSCHEIDUNG daraus
    // (`b2.model`, `b2.rule`) bleibt öffentlich: sie ist das Ergebnis.
    sensitivity: 'internal',
    answers: { minSubstance: 'short', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Vertrauen leihen. Wer unseren Most kennt, probiert auch den Brand — ohne den Hofnamen stünde '
          + 'er im Regal wie jeder andere.',
        en: 'Lend trust. People who know our juice will try the spirit — without the farm name it would sit '
          + 'on the shelf like any other.',
      },
      {
        de: 'Freilassen. Die Reha-Marke erreicht junge Sportler, die bei „Sanitätshaus Krause" gar nicht '
          + 'erst anrufen.',
        en: 'Set them free. The rehab brand reaches young athletes who would never call a shop named '
          + '"Krause Medical Supplies".',
      },
    ),
  },
  'b2.namingPattern': {
    goal: 'settle how the other brands are allowed to be named — as "Brand Product" or with names of '
      + 'their own.',
    quality: [
      'It is a pattern somebody could apply to the next product without asking.',
      'It says what is NOT allowed as well as what is.',
      'It fits the visibility decision they already made.',
      'It works for a product nobody has thought of yet.',
    ],
    antiPatterns: [
      'A list of existing product names instead of a rule.',
      'A rule with an exception for every name that already exists.',
      '"Case by case."',
    ],
    ladder: {
      opening: 'how the next product may be named — the pattern, not the examples.',
      probes: ['does that rule still work for a product in a completely different field?'],
      reframes: ['if the answer is a list of names, ask what those names have in common'],
    },
    answers: { minSubstance: 'short', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Immer der Hofname vorn, dann die Frucht: „Lindenhof Quitte", „Lindenhof Schlehe". Keine '
          + 'Fantasienamen.',
        en: 'Always the farm name first, then the fruit: "Lindenhof Quince", "Lindenhof Sloe". No invented '
          + 'names.',
      },
      {
        de: 'Eigene Namen sind erlaubt, aber nie mit unserem Kürzel davor — sonst hält es jeder für eine '
          + 'Eigenmarke.',
        en: 'Names of their own are allowed, but never with our initials in front — otherwise everyone reads '
          + 'it as a store brand.',
      },
    ),
  },
  'b2.model': {
    goal: 'propose the brand ARCHITECTURE model for this brand.',
    quality: [
      'The model follows from their three answers, and the reason says how.',
      'The BASIS line names what this model costs them.',
      'It is one of the four models, called by its catalogue name.',
      'It would still hold for a product they have not invented yet.',
    ],
    antiPatterns: [
      'A fifth, invented model, or a "hybrid" that avoids the decision.',
      'A model chosen because it is the most common one.',
      'A recommendation with no price named.',
    ],
    ladder: {
      opening: 'name the model, say why and what it costs, then append the four as options.',
      probes: ['does that still work if you add a product in a different field?'],
      reframes: ['if they want a hybrid, ask which of the four a customer would see first'],
    },
    examples: pathExamples(
      {
        de: 'Branded House — alles läuft unter dem Hofnamen, weil der Hof selbst das Versprechen ist.',
        en: 'Branded house — everything runs under the farm name, because the farm itself is the promise.',
      },
      {
        de: 'Endorsed — die Reha-Marke tritt eigenständig auf und trägt klein „vom Sanitätshaus Krause".',
        en: 'Endorsed — the rehab brand stands on its own and carries a small "from Krause Medical Supplies".',
      },
    ),
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
    quality: [
      'Somebody naming the next product could apply it without asking.',
      'It says what the name must contain, what it must not, and who decides.',
      'It carries two or three examples from their own context.',
      'Four sentences at most, examples included.',
    ],
    antiPatterns: [
      'A rule illustrated with "Brand Product A".',
      'A rule that contradicts the architecture model they chose.',
      'A rule with nobody named as the decider.',
    ],
    form: { person: 'we', tense: 'present', maxWords: 80 },
    examples: pathExamples(
      {
        de: 'Jeder neue Brand heißt „Lindenhof" plus die Frucht. Keine Fantasienamen, keine Jahreszahl im '
          + 'Namen. Über Ausnahmen entscheidet Marie, nicht die Etikettendruckerei.',
        en: 'Every new spirit is called "Lindenhof" plus the fruit. No invented names, no year in the name. '
          + 'Marie decides on exceptions, not the label printer.',
      },
      {
        de: 'Untermarken tragen einen eigenen Namen und in der Fußzeile immer „vom Sanitätshaus Krause". '
          + 'Nie das Kürzel im Namen selbst. Jeden neuen Namen gibt die Geschäftsführung frei.',
        en: 'Sub-brands carry a name of their own and always the line "from Krause Medical Supplies" in the '
          + 'footer. Never the initials in the name itself. The managing directors sign off every new name.',
      },
    ),
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
  // EIN Betrieb je Pfad durch das ganze Kapitel (Hundeschule / Reiterhof): an
  // einer fortlaufenden Geschichte sieht man, wie aus einem Moment ein Wert,
  // daraus eine Definition und daraus eine Konfliktregel wird. Getrennte
  // Branchen je Session hätten dieselben fünf Zeilen zusammenhanglos gezeigt.
  'c.discovery1': {
    goal: 'capture a moment when this business was at its best, told as a scene and not as an adjective.',
    quality: [
      'It is one scene with a place, a time and people in it.',
      'Something was decided or done, not only felt.',
      'A listener could say what was at stake.',
      'No other company could tell this scene.',
    ],
    antiPatterns: [
      'An adjective instead of a scene: "when we are at our best we are reliable".',
      'A whole period: "the first year was great".',
      'A customer testimonial retold as their own memory.',
    ],
    ladder: {
      opening: 'one day when the business was at its best — as a scene, not as a summary.',
      probes: [
        'what happened first, and what did you do next?',
        'who else was there, and what did they say afterwards?',
      ],
      reframes: [
        'if the answer is an adjective, ask for the day that made them use that word',
        'if it is a whole period, ask for the single moment inside it they remember best',
      ],
    },
    answers: { minSubstance: 'long' },
    effort: { minutes: 3, turns: 4 },
    examples: pathExamples(
      {
        de: 'Ein Hund kam nach zwei abgebrochenen Kursen zu uns. In der vierten Stunde hat er zum ersten Mal '
          + 'von allein Blickkontakt gehalten, und die Besitzerin hat auf dem Platz geweint.',
        en: 'A dog came to us after two abandoned courses. In the fourth session he held eye contact by '
          + 'himself for the first time, and his owner stood there and cried.',
      },
      {
        de: 'Nach dem Gewitter stand die halbe Schulklasse durchnässt in der Halle. Der Stallmeister hat den '
          + 'Unterricht abgesagt und stattdessen alle beim Trockenreiben mitmachen lassen.',
        en: 'After the thunderstorm half a school group stood soaked in the arena. The stable master called '
          + 'off the lesson and had everybody help rub the horses down instead.',
      },
    ),
  },
  'c.discovery2': {
    goal: 'capture a moment when something felt deeply wrong in this business, told as a scene.',
    quality: [
      'It is a scene, and the discomfort has a cause somebody could name.',
      'They say what they did about it, or that they did nothing.',
      'It is about their own work, not about a difficult customer.',
      'It still bothers them.',
    ],
    antiPatterns: [
      'A complaint about a customer.',
      'An abstract grievance about the industry.',
      'A scene in which they were only the victim.',
    ],
    ladder: {
      opening: 'a day when something felt deeply wrong — the scene, not the lesson.',
      probes: [
        'what exactly made it feel wrong: what was done, or how it was done?',
        'what did you do afterwards?',
      ],
      reframes: [
        'if the answer blames a customer, ask what they themselves would do differently today',
        'if the answer stays abstract, ask when they last felt it in the room',
      ],
    },
    answers: { minSubstance: 'long' },
    effort: { minutes: 3, turns: 4 },
    examples: pathExamples(
      {
        de: 'Wir haben einen Kurs mit zwölf Hunden angenommen, weil die Gruppe voll bezahlt war. Nach der '
          + 'zweiten Stunde hat kein Hund mehr etwas gelernt, und ich wusste vorher, dass es zu viele sind.',
        en: 'We took a course with twelve dogs because the group was fully paid. After the second session no '
          + 'dog was learning anything, and I had known beforehand that it was too many.',
      },
      {
        de: 'Wir haben ein lahmes Pferd noch eine Woche im Unterricht gelassen, weil der Ersatz gefehlt hat. '
          + 'Gesagt hat das niemand — bemerkt haben es alle.',
        en: 'We kept a lame horse in lessons for another week because we had no replacement. Nobody said it '
          + 'out loud, and everybody noticed.',
      },
    ),
  },
  'c.discovery3': {
    goal: 'capture the behaviour this brand would never tolerate, not even from its best-paying client.',
    quality: [
      'It names a behaviour, not a type of person.',
      'It has been refused at least once, and they can say when.',
      'It would still be refused from the best-paying client.',
      'It is specific enough to recognise while it is happening.',
    ],
    antiPatterns: [
      'A no-go so extreme that nobody would ever ask for it.',
      'A preference dressed up as a principle: "we do not like rush jobs".',
      'A behaviour they have in fact tolerated.',
    ],
    ladder: {
      opening: 'the behaviour they would refuse even from their best-paying client.',
      probes: [
        'when did you last say no to it, and what did it cost?',
        'has anybody ever asked you for exactly that?',
      ],
      reframes: [
        'if the no-go is illegal anyway, ask for the one that is legal and still unacceptable',
        'if it has never been tested, ask what they came closest to tolerating',
      ],
    },
    examples: pathExamples(
      {
        de: 'Wer seinen Hund vor uns am Halsband hochreißt, kommt nicht in den Kurs zurück — auch wenn er '
          + 'den ganzen Block bezahlt hat.',
        en: 'Anybody who yanks their dog up by the collar in front of us does not come back to the course, '
          + 'even if they paid for the whole block.',
      },
      {
        de: 'Wir schreiben kein Pferd gesund, damit es verkauft werden kann. Das hat uns zwei Einstaller '
          + 'gekostet.',
        en: 'We will not sign a horse off as sound so that it can be sold. That has cost us two boarders.',
      },
    ),
  },
  'c.candidates': {
    goal: `distil ${MILO_CANDIDATE_RANGE.min} to ${MILO_CANDIDATE_RANGE.max} candidate VALUES out of `
      + 'what this person has told you.',
    quality: [
      'Every candidate carries the moment it comes from, in the same line.',
      'No two candidates rest on the same sentence.',
      'A word that could stand under any brand appears only where a specific moment earns it.',
      'The list is unranked and has no favourite.',
    ],
    antiPatterns: [
      'Poster words with no moment behind them.',
      'A ranking, or a candidate marked as the obvious one.',
      'A value invented to round the list up to seven.',
    ],
    form: { person: 'none', tense: 'present' },
    examples: pathExamples(
      {
        de: '- Geduld — der Kurs wurde wiederholt, statt den Hund weiterzuschieben\n'
          + '- Unbestechlichkeit — Kursplatz gekündigt, obwohl der ganze Block bezahlt war',
        en: '- Patience — the course was repeated instead of pushing the dog along\n'
          + '- Incorruptibility — a place was cancelled although the whole block had been paid',
      },
      {
        de: '- Ehrlichkeit — kein Pferd wird für den Verkauf gesundgeschrieben\n'
          + '- Verlässlichkeit — bei Sturm wird abgesagt, nicht geritten',
        en: '- Honesty — no horse is signed off as sound to make a sale\n'
          + '- Reliability — in a storm the lesson is cancelled, not ridden',
      },
    ),
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
    quality: [
      'Between three and five values.',
      'Each one has already cost them something.',
      'Dropping one of them would change how a decision is made.',
      'No two of them mean the same thing.',
    ],
    antiPatterns: [
      'Six or more, because none of them could be dropped.',
      'A value kept because it looks good on a wall.',
      'Two words for the same behaviour, such as honesty and transparency.',
    ],
    ladder: {
      opening: 'narrow the candidates to three to five, and say which of them have a price.',
      probes: ['which of these would you still hold in the worst month of the year?'],
      reframes: ['if six or more survive, ask which one they have never actually paid for'],
    },
    form: { person: 'none', tense: 'present' },
    // Die Frage im Katalog sagt „three to five" und der Wert ist eine LISTE
    // (eine Zeile je Wert, `brandSlotFormat.ts`) — damit ist die Zahl zählbar.
    invariants: [{ kind: 'count', min: 3, max: 5 }],
    examples: pathExamples(
      {
        de: '- Geduld\n- Unbestechlichkeit\n- Klarheit',
        en: '- Patience\n- Incorruptibility\n- Clarity',
      },
      {
        de: '- Ehrlichkeit\n- Verlässlichkeit\n- Ruhe\n- Sorgfalt',
        en: '- Honesty\n- Reliability\n- Calm\n- Care',
      },
    ),
  },
  'c.definitions': {
    goal: 'for each value they chose, write ONE sentence saying what it means HERE — in this brand, not '
      + 'in a dictionary.',
    quality: [
      'One line per chosen value, none missing and none added.',
      'Each sentence says what somebody DOES or does not do.',
      'The moment behind the value is recognisable in the sentence.',
      'It could be read out on a first working day without embarrassment.',
    ],
    antiPatterns: [
      'A dictionary definition: "honesty means being honest".',
      'A sentence that names an attitude but no action.',
      'A definition for a value they did not choose.',
    ],
    form: { person: 'we', tense: 'present' },
    examples: pathExamples(
      {
        de: '- Geduld — wir wiederholen eine Übung so lange, wie der Hund braucht, und rechnen die Stunde '
          + 'nicht doppelt ab.',
        en: '- Patience — we repeat an exercise for as long as the dog needs, and we do not charge the hour '
          + 'twice.',
      },
      {
        de: '- Verlässlichkeit — bei Sturm sagen wir ab und geben den Termin kostenfrei zurück, auch wenn '
          + 'die Halle frei wäre.',
        en: '- Reliability — in a storm we cancel and refund the slot, even when the indoor arena would be '
          + 'free.',
      },
    ),
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
    quality: [
      'One real example per chosen value.',
      'Each example carries a date, a place or a person.',
      'It shows the value costing something.',
      'It happened — it is not what they would do.',
    ],
    antiPatterns: [
      'A hypothetical: "we would always ...".',
      'The same story used for two values.',
      'An example in which the value cost nothing.',
    ],
    ladder: {
      opening: 'one thing that really happened, per value.',
      probes: [
        'when was that, and who was involved?',
        'what did it cost you that time?',
      ],
      reframes: [
        'if the example is hypothetical, ask for the last time it really happened',
        'if one value has no story, say so plainly and ask whether it belongs on the list',
      ],
    },
    answers: { minSubstance: 'long' },
    effort: { minutes: 5, turns: 5 },
    examples: pathExamples(
      {
        de: '- Unbestechlichkeit — im März haben wir Familie K. den Kursplatz gekündigt und 240 Euro '
          + 'zurückgezahlt.',
        en: '- Incorruptibility — in March we cancelled the K. family\'s place and refunded 240 euros.',
      },
      {
        de: '- Ruhe — im Juli haben wir das Turnier abgesagt, weil zwei Pferde husteten; das Nenngeld ging '
          + 'zurück.',
        en: '- Calm — in July we called off the show because two horses had a cough, and the entry fees went '
          + 'back.',
      },
    ),
  },
  'c.conflictRule': {
    goal: 'settle which of the chosen values wins when two of them collide, and why.',
    quality: [
      'It names two of their own values by name.',
      'It says which one wins, without "it depends".',
      'The case it describes has happened, or could happen next month.',
      'A colleague could apply it without asking.',
    ],
    antiPatterns: [
      '"They never conflict."',
      'A rule that resolves the conflict by doing both.',
      'A conflict between a value and something that is not a value, such as time or money.',
    ],
    ladder: {
      opening: 'the case where two of their values collide — and which one wins.',
      probes: [
        'which two rub against each other most often in practice?',
        'who decides when it happens on a Friday afternoon?',
      ],
      reframes: [
        'if the answer is "they never conflict", offer the pair you can see colliding and ask whether that is right',
        'if the answer does both, ask what happens when there is no time for both',
      ],
    },
    // ÖFFENTLICH, obwohl es nach Innenpolitik klingt: die Konfliktregel steht
    // ausdrücklich im Ergebnis-Dokument (Content-Spec §11, „Werte inkl.
    // Konfliktregel"). Sie ist das ERGEBNIS des Kapitels, nicht sein Rohmaterial.
    answers: { minSubstance: 'medium', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Geduld gegen Klarheit: Wenn ein Hund den Kurs nicht schafft, gewinnt Klarheit — wir sagen es '
          + 'nach der dritten Stunde, statt weiter Geduld zu verkaufen.',
        en: 'Patience against clarity: when a dog is not going to manage the course, clarity wins — we say '
          + 'so after the third session instead of selling more patience.',
      },
      {
        de: 'Verlässlichkeit gegen Ehrlichkeit: Ist ein Pferd nicht fit, gewinnt Ehrlichkeit — wir sagen den '
          + 'zugesagten Termin ab.',
        en: 'Reliability against honesty: if a horse is not fit, honesty wins — we cancel the lesson we '
          + 'promised.',
      },
    ),
  },
  'c.teamFilter': {
    goal: 'settle which value is the non-negotiable filter when this brand hires someone.',
    quality: [
      'It names exactly one of their chosen values.',
      'It says what would disqualify somebody, not what would be nice to have.',
      'It has already decided a hire or a parting.',
      'It can be applied on a trial day, not only to a CV.',
    ],
    antiPatterns: [
      'All the values at once as the filter.',
      'A skill requirement instead of a value.',
      'A filter nobody has ever failed.',
    ],
    ladder: {
      opening: 'the one value that decides a hire, and what would fail it.',
      probes: [
        'what would somebody have to do on a trial day for you to say no?',
        'has anybody ever failed on exactly that?',
      ],
      reframes: [
        'if all the values are named, ask which one they could not train into somebody',
        'if the answer is a skill, ask what they would forgive in skill and never in behaviour',
      ],
    },
    // Vertagen: die Frage betrifft Menschen, die gerade nicht am Tisch sitzen
    // (Mitinhaberin, Werkstattleitung) — eine allein erfundene Einstellungsregel
    // ist die schlechteste Sorte Festlegung.
    answers: { minSubstance: 'short', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Geduld. Wer am Probetag die Leine strafft, sobald es hektisch wird, passt nicht zu uns — '
          + 'Fachwissen bringen wir bei.',
        en: 'Patience. Anybody who tightens the lead on their trial day as soon as things get hectic does '
          + 'not fit here — knowledge we can teach.',
      },
      {
        de: 'Ehrlichkeit. Wer einen Fehler im Stall nicht meldet, weil er klein aussieht, ist raus.',
        en: 'Honesty. Anybody who hides a small mistake in the stable because it looks harmless is out.',
      },
    ),
  },

  // ── D · Archetyp & Stimme ───────────────────────────────────────────────
  // EIN Betrieb je Pfad durch das Kapitel (Schmiede / Reisebüro): Hypothese,
  // Primär, Sekundär und Abweichung sind nur zusammen zu lesen.
  'd.hypothesis': {
    goal: 'say which archetype speaks out of their appearance TODAY — as a reading, not as a decision.',
    quality: [
      'It names one or two archetypes by their catalogue name.',
      'Each one carries a phrase from their own texts as evidence.',
      'It reads as a reading of the appearance, never as a decision about them.',
      'A mixed appearance is named as a finding instead of being smoothed over.',
    ],
    antiPatterns: [
      '"You are the Sage" — a verdict instead of a reading.',
      'An archetype with no phrase behind it.',
      'An appearance invented because no texts were given.',
    ],
    form: { person: 'none', tense: 'present', maxWords: 70 },
    examples: pathExamples(
      {
        de: 'Aus euren Texten spricht vor allem der Schöpfer: „Wir schmieden jedes Stück einzeln, auch wenn '
          + 'es zehnmal dasselbe ist." Daneben klingt der Weise durch, wo ihr das Material erklärt.',
        en: 'What speaks out of your texts is mostly the Creator: "we forge each piece on its own, even when '
          + 'it is the same one ten times". The Sage shows through where you explain the material.',
      },
      {
        de: 'Euer Auftritt zieht in zwei Richtungen: „Weltweit zu Hause" klingt nach dem Entdecker, die '
          + 'Seite mit den Stornobedingungen nach dem Herrscher.',
        en: 'Your appearance pulls two ways: "at home anywhere in the world" sounds like the Explorer, while '
          + 'the cancellation page sounds like the Ruler.',
      },
    ),
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
    goal: 'settle which archetype of each pair feels more like this brand, until a first and a second '
      + 'place stand.',
    quality: [
      'Every pair was decided, none skipped.',
      'Each winner is one of the twelve catalogue archetypes.',
      'The result has a first and a second place with a countable margin.',
      'The decisions came from their own sense, not from a brand they admire.',
    ],
    antiPatterns: [
      'A pair answered with "both".',
      'A choice justified by a famous brand instead of by their own feeling.',
      'The result read as a personality test about the founder.',
    ],
    // KEINE BEISPIELE, und das ist kein Vergessen: der Wert entsteht im
    // Instrument (Karte gegen Karte), nicht in einem Feld, das jemand füllt.
    // Ein erfundenes Ergebnis zeigte keine FORM, sondern nur ein Resultat — und
    // ein Resultat vor der Wahl ist genau die Verankerung, die §12.1 verbietet
    // (deshalb stehen dort auch keine Beispielmarken auf den Karten).
  },
  'd.primary': {
    goal: 'propose the PRIMARY archetype of this brand — the one that carries how they behave.',
    quality: [
      'It names exactly one of the twelve catalogue archetypes.',
      'The prose and the stored value name the same archetype.',
      'The BASIS line quotes one of their own sentences as the reason.',
      'Where their answers and their appearance disagree, the answers win and the text says so.',
    ],
    antiPatterns: [
      'An informal name stored instead of a catalogue archetype.',
      'A draft where two archetypes are equally defensible.',
      'A choice derived from the pitch alone.',
    ],
    examples: pathExamples(
      {
        de: 'Der Schöpfer — „auch wenn es zehnmal dasselbe ist" ist euer Satz, nicht der eines Zulieferers.',
        en: 'The Creator — "even when it is the same one ten times" is your sentence, not a supplier\'s.',
      },
      {
        de: 'Der Fürsorgliche — ihr habt dreimal gesagt, dass ihr sonntags ans Telefon geht, wenn jemand am '
          + 'Flughafen strandet.',
        en: 'The Caregiver — you said three times that you answer the phone on a Sunday when somebody is '
          + 'stranded at an airport.',
      },
    ),
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
    quality: [
      'It is a different archetype from the primary.',
      'The BASIS line says what the pair does: how the second keeps the first bearable.',
      'It explains a note in their answers that the primary does not.',
      'It is a catalogue name, not an informal one.',
    ],
    antiPatterns: [
      'The same archetype as the primary, in other words.',
      'A second name with no relationship to the first.',
      'A secondary guessed while the primary is missing.',
    ],
    examples: pathExamples(
      {
        de: 'Der Weise als Zweiter — er hält den Schöpfer vom Schwärmen ab: ihr erklärt, warum Damast '
          + 'bricht, bevor ihr ihn verkauft.',
        en: 'The Sage second — it keeps the Creator from mere enthusiasm: you explain why damascus breaks '
          + 'before you sell it.',
      },
      {
        de: 'Der Entdecker als Zweiter — er hält den Fürsorglichen davon ab, betulich zu werden.',
        en: 'The Explorer second — it keeps the Caregiver from turning fussy.',
      },
    ),
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
    quality: [
      'It says in one sentence where the two agree.',
      'It names the difference plainly, without softening it.',
      'It points at the phrase in their texts that sounds like the other archetype.',
      'It gives no advice — the finding is the value.',
    ],
    antiPatterns: [
      'A reassuring closing sentence.',
      '"There are elements of both."',
      'A gap invented because a finding was expected.',
    ],
    examples: pathExamples(
      {
        de: 'Ihr wollt als Schöpfer gelesen werden, eure Seite klingt aber an drei Stellen nach dem '
          + 'Herrscher: „Wir liefern ausschließlich an Fachbetriebe."',
        en: 'You want to be read as the Creator, but in three places your site sounds like the Ruler: "we '
          + 'supply exclusively to trade customers".',
      },
      {
        de: 'Selbstbild und Außenbild treffen sich beim Fürsorglichen — nur eure Preisliste spricht wie ein '
          + 'Herrscher: „Umbuchungen sind ausgeschlossen."',
        en: 'Self-image and outside image meet at the Caregiver — only your price list speaks like a Ruler: '
          + '"rebooking is excluded".',
      },
    ),
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
    quality: [
      'It describes behaviour, not adjectives.',
      'A stranger could act it out.',
      'It also says what that person does NOT do at the party.',
      'It is one person, not a committee.',
    ],
    antiPatterns: [
      'Three adjectives: open, friendly, honest.',
      'A description of the founder rather than of the brand.',
      'A guest everybody likes and nobody remembers.',
    ],
    ladder: {
      opening: 'the brand as a person at a party — what they do in the first ten minutes.',
      probes: [
        'who do they end up talking to, and about what?',
        'what do they never do at that party?',
      ],
      reframes: [
        'if the answer is adjectives, ask what that person actually does when they arrive',
        'if the person is likeable to everybody, ask who at that party would find them annoying',
      ],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: 'Steht am Rand, redet mit einem Menschen zwei Stunden über dessen Küchenmesser und geht früh.',
        en: 'Stands at the edge, talks to one person about their kitchen knife for two hours, and leaves early.',
      },
      {
        de: 'Merkt sich, wer keinen Alkohol trinkt, und holt ungefragt Wasser — hält aber keine Rede.',
        en: 'Notices who is not drinking and fetches water unasked — but never makes a speech.',
      },
    ),
  },
  'd.never': {
    goal: 'capture the one trait this brand must never have.',
    quality: [
      'It is one trait, and this brand could plausibly drift into it.',
      'It excludes something — some respectable brand somewhere has that trait.',
      'It is more than the opposite of a virtue.',
      'They can name a sentence they would refuse to write because of it.',
    ],
    antiPatterns: [
      'A trait nobody wants: dishonest, unprofessional, arrogant.',
      'The exact opposite of a value they already named.',
      'A list of five traits.',
    ],
    ladder: {
      opening: 'the one trait this brand must never have.',
      probes: [
        'where do you feel yourselves drifting towards it?',
        'which sentence would you refuse to write because of it?',
      ],
      reframes: ['if the trait is one nobody wants, ask which respectable trait would still be wrong for them'],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: 'Belehrend. Wir erklären das Material, aber wir sagen niemandem, dass er das falsche Messer benutzt.',
        en: 'Preachy. We explain the material, but we never tell anybody they are using the wrong knife.',
      },
      {
        de: 'Aufgeregt. Kein „nur noch zwei Plätze frei" — dafür rufen die Leute uns nicht an.',
        en: 'Breathless. No "only two seats left" — that is not what people call us for.',
      },
    ),
  },
  'd.admired': {
    goal: 'capture a brand whose personality they admire and what exactly it is about that brand.',
    quality: [
      'It names one brand and one thing about it.',
      'The thing named is a behaviour, not a logo or a budget.',
      'It also says what they would NOT copy from that brand.',
      'The brand comes from another industry, or they say why it does not.',
    ],
    antiPatterns: [
      'A famous name with "they just do everything right".',
      'Admiration for a marketing budget instead of a behaviour.',
      'A competitor named as a template to copy.',
    ],
    ladder: {
      opening: 'one brand whose personality they admire, and the exact thing about it.',
      probes: [
        'what does that brand DO that you noticed?',
        'what about them would be wrong for you?',
      ],
      reframes: ['if the answer is a logo or a budget, ask what that brand does that a small company could do too'],
    },
    examples: pathExamples(
      {
        de: 'Eine kleine Outdoor-Marke aus Schweden: Sie legt seit Jahren dieselbe Reparaturanleitung bei, '
          + 'statt jedes Jahr eine neue Kampagne zu machen. Ihre Umweltpredigt wäre uns aber zu viel.',
        en: 'A small outdoor brand from Sweden: they have enclosed the same repair instructions for years '
          + 'instead of running a new campaign each season. Their environmental preaching would be too much '
          + 'for us, though.',
      },
      {
        de: 'Eine Kaffeerösterei in Hamburg: Sie schreibt auf jede Tüte, was der Bauer bekommen hat. Ihr '
          + 'Ton wäre uns aber zu belehrend.',
        en: 'A coffee roastery in Hamburg: they print on every bag what the farmer was paid. Their tone '
          + 'would be too preachy for us, though.',
      },
    ),
  },
  'd.emotion': {
    goal: 'capture what people should feel when they interact with this brand.',
    quality: [
      'It is one feeling, in a word a person would actually use.',
      'It says at which moment that feeling should arrive.',
      'A different feeling would be plausible here — so this one is a choice.',
      'It is a feeling, not a judgement about the company.',
    ],
    antiPatterns: [
      '"Trust", with no moment attached.',
      'Three feelings at once.',
      'A judgement in place of a feeling: "they should think we are professional".',
    ],
    ladder: {
      opening: 'the one feeling people should leave with, and at which moment.',
      probes: [
        'at which point in dealing with you should that feeling arrive?',
        'which feeling would be wrong here, even though others in your industry aim for it?',
      ],
      reframes: [
        'if the answer is "trust", ask what has to happen before somebody feels it',
        'if there are three, ask which one they would keep if they had to drop the others',
      ],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: 'Erleichterung — in dem Moment, in dem jemand merkt, dass das Messer noch zu retten ist.',
        en: 'Relief — at the moment somebody realises the knife can still be saved.',
      },
      {
        de: 'Ruhe. Wenn die Bestätigung kommt, soll niemand mehr das Kleingedruckte suchen.',
        en: 'Calm. When the confirmation arrives, nobody should still be looking for the small print.',
      },
    ),
  },
  'd.voiceSamples': {
    goal: 'write EXACTLY THREE example sentences in the voice of this brand — three lines, no more and '
      + 'no fewer.',
    quality: [
      'Exactly three lines, from three different everyday situations.',
      'Each one is ordinary speech, not a slogan.',
      'The primary sets the attitude, the secondary keeps it from tipping into caricature.',
      'You could tell them apart from any competent brand text.',
    ],
    antiPatterns: [
      'Three variations of the same sentence.',
      'Taglines or headlines instead of speech.',
      'A call to action.',
    ],
    ladder: {
      opening: 'three sentences in their voice, then let them pick or correct.',
      probes: ['which of the three sounds least like you, and what is wrong with it?'],
      reframes: ['if all three feel right, ask which one they would actually send tomorrow'],
    },
    form: { person: 'we', tense: 'present' },
    examples: pathExamples(
      {
        de: '- Das Messer ist zu retten, aber der Griff muss neu.\n'
          + '- Vor Ostern schaffen wir das nicht — ehrlich gesagt frühestens im Mai.\n'
          + '- 180 Euro, weil der Stahl von Hand geschmiedet ist und nicht gefräst.',
        en: '- The knife can be saved, but the handle has to be new.\n'
          + '- We will not manage it before Easter — honestly, May at the earliest.\n'
          + '- 180 euros, because the steel is forged by hand and not milled.',
      },
      {
        de: '- Ihr Flug ist verschoben, wir haben schon umgebucht.\n'
          + '- Das Hotel ist gut, aber laut — sagen wir lieber jetzt als hinterher.\n'
          + '- Der Preis steigt am Freitag, deshalb melden wir uns heute.',
        en: '- Your flight has moved, we have already rebooked you.\n'
          + '- The hotel is good but noisy — better said now than afterwards.\n'
          + '- The price goes up on Friday, which is why we are calling today.',
      },
    ),
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
    quality: [
      'Four to six words, one per line, nothing else on the line.',
      'Every word excludes a plausible brand.',
      'Together they describe a voice, not a mood.',
      'They can be held against a finished text as a checklist.',
    ],
    antiPatterns: [
      'Professional, authentic, modern, high-quality — words that exclude nothing.',
      'Explanations or "but not ..." on the line.',
      'Words that describe the industry instead of the voice.',
    ],
    ladder: {
      opening: 'offer four to six words and say which came from their texts and which from the archetype.',
      probes: ['which of these words would you cross out first?'],
      reframes: ['if a word excludes nothing, name a brand it would also fit and ask whether that is right'],
    },
    form: { person: 'none', tense: 'present' },
    examples: pathExamples(
      {
        de: '- karg\n- geduldig\n- werkstattnah\n- unbeeindruckt',
        en: '- spare\n- patient\n- workshop-plain\n- unimpressed',
      },
      {
        de: '- nüchtern\n- vorausschauend\n- warm ohne Zucker\n- knapp',
        en: '- sober\n- one step ahead\n- warm without sugar\n- brief',
      },
    ),
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
    quality: [
      'Their own never-words are carried over unchanged, in their wording.',
      'Every line carries one word and its side.',
      'The use side contains words their customers actually say.',
      'A reason is given only where the avoidance is not obvious.',
    ],
    antiPatterns: [
      'Arguing with one of their own no-go words.',
      'A trade term banned only because it sounds technical.',
      'A list with none of their own words in it.',
    ],
    ladder: {
      opening: 'the words they would never use — in their wording, unchanged.',
      probes: ['which word in your own texts makes you wince when you read it back?'],
      reframes: ['if a term is banned only for sounding technical, ask whether their customers use it every day'],
    },
    answers: { minSubstance: 'short' },
    examples: pathExamples(
      {
        de: '- use: geschmiedet\n- use: Werkstatt\n- avoid: Premium\n'
          + '- avoid: Manufaktur — steht inzwischen auf jeder Tiefkühlpizza',
        en: '- use: forged\n- use: workshop\n- avoid: premium\n'
          + '- avoid: artisanal — it is on frozen pizza now',
      },
      {
        de: '- use: umgebucht\n- use: Rückflug\n- avoid: Traumreise\n- avoid: unschlagbar',
        en: '- use: rebooked\n- use: return flight\n- avoid: dream holiday\n- avoid: unbeatable',
      },
    ),
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
  // EIN Betrieb je Pfad (Energieberatung / Fitnessstudio) — Warmup, Statements,
  // Manifest und Ankerzeile bauen aufeinander auf, das Beispiel ebenso.
  'e.warmup1': {
    goal: 'capture what makes them angry about their own industry.',
    quality: [
      'It names something concrete that happens in their industry.',
      'The anger is aimed at a practice, not at customers.',
      'Somebody in the industry would object to hearing it said out loud.',
      'They themselves do it differently, and can say how.',
    ],
    antiPatterns: [
      'Anger at customers for not paying enough.',
      'A complaint about regulation nobody in the room controls.',
      'A grievance they are guilty of themselves.',
    ],
    ladder: {
      opening: 'what makes them angry about their own industry.',
      probes: [
        'when did you last see it happen?',
        'do you do it differently — and how exactly?',
      ],
      reframes: [
        'if the anger is aimed at customers, ask what the industry has taught those customers',
        'if it is about rules, ask what colleagues do that they would never do',
      ],
    },
    examples: pathExamples(
      {
        de: 'Dass Angebote absichtlich unvergleichbar gemacht werden — drei Seiten Positionen, damit niemand '
          + 'den Preis pro Fenster ausrechnen kann.',
        en: 'That quotes are made deliberately incomparable — three pages of line items so nobody can work '
          + 'out the price per window.',
      },
      {
        de: 'Jahresverträge, die sich verlängern, wenn man die Kündigung um zwei Tage verpasst. Das ist kein '
          + 'Geschäftsmodell, das ist eine Falle.',
        en: 'Annual contracts that renew if you miss the notice period by two days. That is not a business '
          + 'model, it is a trap.',
      },
    ),
  },
  'e.warmup2': {
    goal: 'capture what they wish more people understood about their work.',
    quality: [
      'It names one misunderstanding, not a general lack of appreciation.',
      'It is something they could show, not only claim.',
      'Knowing it would change what a customer asks for.',
      'It is not a complaint about price.',
    ],
    antiPatterns: [
      '"That good work costs money."',
      'A lecture about the whole industry.',
      'Something their own website already explains well.',
    ],
    ladder: {
      opening: 'what they wish more people understood about the work.',
      probes: [
        'what do people ask for that they would not ask for if they knew?',
        'how would you show it in two minutes?',
      ],
      reframes: ['if the answer is about price, ask what exactly the price pays for that nobody sees'],
    },
    examples: pathExamples(
      {
        de: 'Dass die Dämmung nicht das Erste ist. Bei den meisten Häusern bringt die eingestellte Heizung '
          + 'im ersten Winter mehr als eine Fassade für 20.000 Euro.',
        en: 'That insulation is not the first step. In most houses, setting the heating properly does more '
          + 'in the first winter than a façade costing 20,000 euros.',
      },
      {
        de: 'Dass die ersten sechs Wochen nichts mit Muskeln zu tun haben, sondern damit, ob jemand '
          + 'überhaupt wiederkommt.',
        en: 'That the first six weeks have nothing to do with muscle and everything to do with whether '
          + 'somebody comes back at all.',
      },
    ),
  },
  'e.statements': {
    goal: 'draft the statement openers the manifesto will be built from — one line per opener, filled '
      + 'from what they have already said.',
    quality: [
      'Every statement takes a side somebody could refuse.',
      'Each one is traceable to an answer they gave.',
      'They are sentences somebody would say, not headlines.',
      'The strongest ones stand out without needing a marker.',
    ],
    antiPatterns: [
      'Statements everybody in the industry would sign.',
      'A statement that only praises the brand.',
      'A filled-in opener with nothing behind it.',
    ],
    form: { person: 'we', tense: 'present' },
    effort: { minutes: 10, turns: 4 },
    examples: pathExamples(
      {
        de: '- Wir glauben, dass die billigste Kilowattstunde die ist, die niemand braucht.\n'
          + '- Wir weigern uns, eine Fassade zu empfehlen, bevor die Heizung eingestellt ist.',
        en: '- We believe the cheapest kilowatt hour is the one nobody needs.\n'
          + '- We refuse to recommend a façade before the heating has been set up properly.',
      },
      {
        de: '- Wir glauben, dass Wiederkommen wichtiger ist als Fortschritt.\n'
          + '- Wir weigern uns, Verträge zu verlängern, die niemand nutzt.',
        en: '- We believe coming back matters more than progress.\n'
          + '- We refuse to renew a contract nobody is using.',
      },
    ),
  },
  'e.composition': {
    goal: 'settle the tone, the length and the intended use of the manifesto.',
    quality: [
      'Tone, length and use are each decided, none left open.',
      'The use names a place where it will really be read.',
      'The length fits that place.',
      'The tone is one of the offered ones, not a mixture.',
    ],
    antiPatterns: [
      '"All of them" as the intended use.',
      'A tone chosen because it sounds impressive.',
      'A length nobody will read where it is meant to appear.',
    ],
    ladder: {
      opening: 'settle tone, length and use — say which one you would take and why.',
      probes: ['where exactly will this be read first?'],
      reframes: ['if every use is ticked, ask which one it has to work for on day one'],
    },
    examples: pathExamples(
      {
        de: 'Ton: nüchtern · Länge: kurz, unter 120 Wörtern · Verwendung: die erste Seite des Beratungsberichts',
        en: 'Tone: sober · Length: short, under 120 words · Use: the first page of the advisory report',
      },
      {
        de: 'Ton: direkt · Länge: mittel · Verwendung: das Plakat im Eingang und die Seite „Über uns"',
        en: 'Tone: direct · Length: medium · Use: the poster in the entrance and the About page',
      },
    ),
  },
  'e.manifesto': {
    goal: 'draft the manifesto of this brand from the confirmed statements and the chosen composition.',
    quality: [
      'It takes a side that would put some readers off.',
      'Every line can be read aloud without wincing.',
      'It is built from the statements they marked, not from new material.',
      'It ends without a call to action.',
    ],
    antiPatterns: [
      'A mission statement stretched over ten lines.',
      'A manifesto that could hang in any company of this industry.',
      'A closing sales line.',
    ],
    form: { person: 'we', tense: 'present' },
    effort: { minutes: 5, turns: 3 },
    examples: pathExamples(
      {
        de: 'Die billigste Kilowattstunde ist die, die niemand braucht.\nDeshalb rechnen wir, bevor wir '
          + 'bauen.\nUnd sagen ab, wenn sich das Gerüst nicht lohnt.',
        en: 'The cheapest kilowatt hour is the one nobody needs.\nSo we do the arithmetic before we '
          + 'build.\nAnd we say no when the scaffolding is not worth it.',
      },
      {
        de: 'Der beste Trainingsplan ist der, den jemand im November noch macht.\nWir zählen keine '
          + 'Anmeldungen.\nWir zählen, wer wiederkommt.',
        en: 'The best training plan is the one somebody still follows in November.\nWe do not count '
          + 'sign-ups.\nWe count who comes back.',
      },
    ),
  },
  'e.anchorLine': {
    goal: 'settle which single line of the manifesto is the one they would put on a wall.',
    quality: [
      'It is one line from the manifesto, word for word.',
      'It stands alone without the lines around it.',
      'It is short enough to repeat from memory.',
      'It says something, not merely something pleasant.',
    ],
    antiPatterns: [
      'A new line written for the occasion.',
      'The most general line of the manifesto.',
      'Two lines joined into one.',
    ],
    ladder: {
      opening: 'pick the one line they would put on a wall — from the manifesto itself.',
      probes: ['which line would you still want to say in five years?'],
      reframes: ['if they want to write a new one, point back to the manifesto and ask which line comes closest'],
    },
    // Der Wähler zeigt Zeilen des Manifests — der gewählte Satz MUSS deshalb
    // darin vorkommen (Plan §3a: „e.anchorLine ist ein Satz aus e.manifesto").
    invariants: [{ kind: 'sentenceOf', of: 'e.manifesto' }],
    examples: pathExamples(
      {
        de: 'Die billigste Kilowattstunde ist die, die niemand braucht.',
        en: 'The cheapest kilowatt hour is the one nobody needs.',
      },
      {
        de: 'Wir zählen, wer wiederkommt.',
        en: 'We count who comes back.',
      },
    ),
  },

  // ── E+ · Verbale Identität ──────────────────────────────────────────────
  // Dieselben zwei Betriebe wie in E: die verbale Identität ist die Fortsetzung
  // des Manifests, und ein Wechsel der Branche verschenkte genau diesen Bezug.
  'ep.taglines': {
    goal: 'propose tagline candidates and settle on the one that carries this brand.',
    quality: [
      'Seven words at most.',
      'It says something only this brand could claim.',
      'It works without the logo next to it.',
      'It can be said out loud without a second look.',
    ],
    antiPatterns: [
      'A category description: "your partner for X".',
      'A rhyme that means nothing.',
      'A line that would fit the competitor after swapping one word.',
    ],
    ladder: {
      opening: 'offer the candidates, name the one you would take and say why.',
      probes: ['which of these would you actually say on the phone?'],
      reframes: ['if they like the one that describes the category, ask what it says that a competitor could not'],
    },
    form: { person: 'none', tense: 'present', maxWords: 7 },
    examples: pathExamples(
      {
        de: 'Erst rechnen, dann bauen.',
        en: 'Do the arithmetic before the building.',
      },
      {
        de: 'Wir zählen die Wiederkommer.',
        en: 'We count the ones who return.',
      },
    ),
  },
  'ep.boilerplates': {
    goal: 'draft the three boilerplates of this brand: the one-line bio, the short paragraph and the '
      + 'full paragraph.',
    quality: [
      'Three lengths: a bio under 160 characters, a short paragraph, a full paragraph.',
      'Each one works alone — the short one is not the long one cut off.',
      'The bio says what they do and for whom, and nothing else.',
      'None of the three uses a superlative.',
    ],
    antiPatterns: [
      'The same text three times at three lengths.',
      'A bio that only names the industry.',
      'A press-release voice nobody speaks.',
    ],
    form: { person: 'we', tense: 'present' },
    effort: { minutes: 5, turns: 3 },
    examples: pathExamples(
      {
        de: '## Bio\nEnergieberatung für Altbauten in Ostwestfalen — wir rechnen, bevor jemand baut.',
        en: '## Bio\nEnergy advice for older houses in East Westphalia — we do the arithmetic before '
          + 'anybody builds.',
      },
      {
        de: '## Bio\nStudio für Erwachsene, die spät anfangen. Wir zählen, wer wiederkommt.',
        en: '## Bio\nA gym for adults starting late. We count who comes back.',
      },
    ),
  },
  'ep.keyMessages': {
    goal: 'draft the key messages of this brand, one set per audience.',
    quality: [
      'One set per audience from the audience sketch, none invented.',
      'Each message answers something that audience really worries about.',
      'Three messages per audience at most.',
      'No message repeats the tagline.',
    ],
    antiPatterns: [
      'The same three messages for every audience.',
      'A set for an audience that is not in the sketch.',
      'A feature list disguised as a message.',
    ],
    form: { person: 'we', tense: 'present' },
    effort: { minutes: 5, turns: 3 },
    examples: pathExamples(
      {
        de: '## Hausbesitzer über 60\n- Sie müssen nicht ausziehen, wir arbeiten in bewohnten Häusern.\n'
          + '- Wir sagen Ihnen vorher, was sich nicht lohnt.',
        en: '## Homeowners over 60\n- You do not have to move out, we work in occupied houses.\n'
          + '- We tell you in advance what is not worth doing.',
      },
      {
        de: '## Wiedereinsteiger ab 40\n- In den ersten sechs Wochen zählt nur, dass ihr wiederkommt.\n'
          + '- Kein Vertrag, der sich von selbst verlängert.',
        en: '## People starting again after 40\n- For the first six weeks the only thing that counts is that '
          + 'you come back.\n- No contract that renews itself.',
      },
    ),
  },
  'ep.vocabulary': {
    goal: 'derive the words this brand uses and the words it avoids, as one list for everyday writing.',
    quality: [
      'Their own never-words are carried over unchanged.',
      'Every entry names its side.',
      'It is usable while writing, not only while reviewing.',
      'It adds words to the use side, not only bans.',
    ],
    antiPatterns: [
      'A ban list with nothing on the use side.',
      'Their words rewritten into other wording.',
      'Entries that merely repeat the tone words.',
    ],
    form: { person: 'none', tense: 'present' },
    examples: pathExamples(
      {
        de: '- use: Heizkurve\n- use: Bestandsaufnahme\n- avoid: Sanierungsstau\n- avoid: energetisch optimiert',
        en: '- use: heating curve\n- use: survey\n- avoid: renovation backlog\n- avoid: energy-optimised',
      },
      {
        de: '- use: wiederkommen\n- use: Probemonat\n- avoid: Bikinifigur\n- avoid: Transformation',
        en: '- use: come back\n- use: trial month\n- avoid: beach body\n- avoid: transformation',
      },
    ),
  },
  'ep.distinctiveAsset': {
    goal: 'settle which line becomes the verbal signature of this brand.',
    quality: [
      'It is one line that is already confirmed elsewhere in the foundation.',
      'It could be recognised without the brand name next to it.',
      'It survives being repeated for years.',
      'It is not a description of what they sell.',
    ],
    antiPatterns: [
      'A newly invented line.',
      'A line that only works next to the logo.',
      'A seasonal campaign slogan.',
    ],
    ladder: {
      opening: 'confirm the one line that becomes the verbal signature.',
      probes: ['would you still want to say it in five years?'],
      reframes: ['if they want a new line, ask what the anchor line is missing'],
    },
    examples: pathExamples(
      {
        de: 'Die billigste Kilowattstunde ist die, die niemand braucht.',
        en: 'The cheapest kilowatt hour is the one nobody needs.',
      },
      {
        de: 'Wir zählen, wer wiederkommt.',
        en: 'We count who comes back.',
      },
    ),
  },

  // ── F · Name & Prüfung ──────────────────────────────────────────────────
  // EIN Betrieb je Pfad (mobile Fahrradwerkstatt / Zahnarztpraxis): Typ,
  // Geschmack, No-Gos, Kandidaten, Shortlist, Prüfung, Kriterien und
  // Entscheidung sind EINE Kette — die Beispiele tragen dieselben Namen durch,
  // sonst zeigt die Shortlist Namen, die nie Kandidaten waren.
  'f.nameType': {
    goal: 'settle which kind of name fits this brand.',
    quality: [
      'It is one of the nine catalogue types.',
      'The reason names what that type buys and what it costs.',
      'It fits the no-gos already given.',
      'It leaves room for more than three candidates.',
    ],
    antiPatterns: [
      'A type chosen because famous brands use it.',
      'Two types at once.',
      'A descriptive type chosen while the no-gos rule out every describing word.',
    ],
    ladder: {
      opening: 'name the type you would take, say what it buys and what it costs, then offer the types.',
      probes: ['is there a type you would rule out straight away?'],
      reframes: ['if they pick a descriptive name, say plainly what that costs in protectability'],
    },
    examples: pathExamples(
      {
        de: 'Erfundener Name — kurz, schützbar, sagt nichts über Fahrräder und passt auch noch, wenn ihr '
          + 'später Lastenräder vermietet.',
        en: 'An invented name — short, protectable, says nothing about bicycles, and still fits if you rent '
          + 'out cargo bikes later.',
      },
      {
        de: 'Gründername bleibt, aber ohne Titel: „Praxis Ehlerding" statt „Zahnarztpraxis Dr. med. dent. '
          + 'Ehlerding".',
        en: 'The founder name stays, but without the titles: "Ehlerding Practice" instead of "Dental Surgery '
          + 'Dr Ehlerding".',
      },
    ),
  },
  'f.taste': {
    goal: 'capture three to five brand names they love, from any industry, and why each one works for them.',
    quality: [
      'Three to five names, each with a reason.',
      'The reason is about the name itself: sound, length, image.',
      'At least one comes from outside their own industry.',
      'A pattern is visible across the reasons.',
    ],
    antiPatterns: [
      'Names loved because the company behind them is successful.',
      'A list with no reasons.',
      'Nothing but competitor names.',
    ],
    ladder: {
      opening: 'three to five names they love, each with the reason.',
      probes: [
        'what do those names have in common when you say them out loud?',
        'which of them would you never have dared to choose yourselves?',
      ],
      reframes: ['if the reason is the company, ask what they would think of the name if the company were unknown'],
    },
    examples: pathExamples(
      {
        de: 'Mirabell — weich, zwei Silben, erklärt nichts. Kolibri — man sieht sofort ein Bild. Anker — '
          + 'kurz und am Telefon sofort verstanden.',
        en: 'Mirabelle — soft, two syllables, explains nothing. Colibri — you see a picture at once. Anchor '
          + '— short and understood on the phone straight away.',
      },
      {
        de: 'Klar, weil es ein einziges Wort ist. Nordlicht, weil es die Gegend mitnimmt, ohne sie zu '
          + 'buchstabieren. Hain, weil man es nach einmal Hören schreiben kann.',
        en: 'Clear, because it is a single word. Northlight, because it carries the region without spelling '
          + 'it out. Grove, because you can spell it after hearing it once.',
      },
    ),
  },
  'f.noGos': {
    goal: 'capture the words, styles and lengths that are off-limits for this name.',
    quality: [
      'It names words, styles or lengths that are out, each with a reason.',
      'At least one no-go is about language or region, not taste.',
      'It is short enough to leave a brainstorm room to work.',
      'Somebody else could apply it to a new candidate without asking.',
    ],
    antiPatterns: [
      'A no-go list so long that nothing is left.',
      '"Nothing boring" as a rule.',
      'No-gos with no reason, which nobody can apply to a name they have not seen.',
    ],
    ladder: {
      opening: 'the words, styles and lengths that are out — and why each one.',
      probes: [
        'is there a word that means something else in a language your customers speak?',
        'how long may it be before it stops working on a van door?',
      ],
      reframes: ['if the list rules out everything, ask which three of them are truly non-negotiable'],
    },
    // Vertagen: No-Gos hängen oft an Menschen, die nicht am Tisch sitzen
    // (Partnerin, Familienname, ein Wort aus der Sprache der Kundschaft) — und
    // ein erfundenes Verbot verengt danach jeden Kandidaten.
    answers: { minSubstance: 'short', allowDefer: true },
    examples: pathExamples(
      {
        de: 'Kein „bike", kein „e-", nichts mit Bindestrich. Höchstens drei Silben — der Name muss auf den '
          + 'Anhänger passen.',
        en: 'No "bike", no "e-", nothing with a hyphen. Three syllables at most — it has to fit on the trailer.',
      },
      {
        de: 'Nichts mit „dental" oder „smile". Kein Wort, das man buchstabieren muss, wenn ältere Patienten '
          + 'anrufen.',
        en: 'Nothing with "dental" or "smile". No word that has to be spelled out when an older patient calls.',
      },
    ),
  },
  'f.candidates': {
    goal: 'propose name candidates that fit the chosen name type, their taste and their no-gos.',
    quality: [
      'Each candidate carries the name type it belongs to.',
      'None of them breaks a stated no-go.',
      'The candidates come from more than one route, not from one word varied.',
      'Each one can be said on the phone without spelling it out.',
    ],
    antiPatterns: [
      'Ten variations of a single word.',
      'Candidates that break the no-gos "as an idea".',
      'A list in which every name is descriptive.',
    ],
    form: { person: 'none', tense: 'present' },
    effort: { minutes: 3, turns: 2 },
    examples: pathExamples(
      {
        de: '- Kolben — erfunden\n- Nabe — beschreibend, aus dem Handwerk\n- Sattelfest — zusammengesetzt',
        en: '- Piston — invented\n- Hub — descriptive, from the trade\n- Saddlefast — compound',
      },
      {
        de: '- Ehlerding — Gründername\n- Hain — abstrakt\n- Nordlicht — bildhaft',
        en: '- Ehlerding — founder name\n- Grove — abstract\n- Northlight — evocative',
      },
    ),
  },
  'f.shortlist': {
    goal: 'settle which name candidates make the shortlist.',
    quality: [
      'Every entry comes from the candidate list.',
      'Between three and six names.',
      'Each survivor has been said out loud at least once.',
      'None of them breaks a no-go.',
    ],
    antiPatterns: [
      'A new name appearing for the first time at the shortlist stage.',
      'A shortlist of one.',
      'Names kept because they are hard to give up rather than because they work.',
    ],
    ladder: {
      opening: 'narrow the candidates down to the ones worth checking.',
      probes: ['say each one on the phone — which of them needs spelling?'],
      reframes: ['if a new name appears here, put it back into the candidate list first'],
    },
    form: { person: 'none', tense: 'present' },
    // KEINE `subsetOf f.candidates`-INVARIANTE, und das ist eine Entscheidung:
    // eine Kandidaten-ZEILE trägt laut Content-Spec §10 mehr als den Namen (sie
    // ist „je Namenstyp beschriftet", also „- Kolben — erfunden"). `subsetOf`
    // vergleicht ganze Zeilen; die Shortlist-Zeile „- Kolben" käme darin nie
    // vor, und ein 409 hielte den Menschen von seiner eigenen Auswahl fern.
    // Wenn Paket 3 die Kandidaten in ein Feld mit getrennter Typ-Spalte legt,
    // gehört die Invariante nachgetragen.
    examples: pathExamples(
      {
        de: '- Kolben\n- Nabe\n- Sattelfest',
        en: '- Piston\n- Hub\n- Saddlefast',
      },
      {
        de: '- Ehlerding\n- Hain\n- Nordlicht',
        en: '- Ehlerding\n- Grove\n- Northlight',
      },
    ),
  },
  'f.checks': {
    goal: 'derive the availability checks for the shortlisted names.',
    quality: [
      'Every shortlisted name has its own block, none missing.',
      'Domain and handle results are stated as indicators, never as legal facts.',
      'A foreign-language finding names the language and the meaning.',
      'Nothing is claimed that was not actually checked.',
    ],
    antiPatterns: [
      'A trademark verdict: "this name is free".',
      'A check reported for a name that is not on the shortlist.',
      'An availability claim with no source behind it.',
    ],
    form: { person: 'none', tense: 'present' },
    effort: { minutes: 5, turns: 2 },
    examples: pathExamples(
      {
        de: '## Kolben\nDomain: kolben.de vergeben, kolben-rad.de frei · Handles: ungeprüft, Suchlink '
          + 'unten · Marke: DPMA-Suche noch offen · Fremdsprache: keine Auffälligkeit',
        en: '## Piston\nDomain: piston.de taken, piston-bikes.de free · Handles: unverified, search link '
          + 'below · Trademark: DPMA search still open · Other languages: nothing conspicuous',
      },
      {
        de: '## Hain\nDomain: hain.de vergeben, praxis-hain.de frei · Handles: ungeprüft · Marke: geführte '
          + 'Suche noch offen · Fremdsprache: keine Auffälligkeit',
        en: '## Grove\nDomain: grove.de taken, praxis-grove.de free · Handles: unverified · Trademark: '
          + 'guided search still open · Other languages: nothing conspicuous',
      },
    ),
  },
  'f.criteria': {
    goal: 'rate the shortlisted names against the eight criteria.',
    quality: [
      'Only two or three finalists are rated.',
      'Every one of the eight criteria carries a rating, none skipped.',
      'A weak rating stays weak instead of being argued away.',
      'The ratings together point at a name rather than at a tie.',
    ],
    antiPatterns: [
      'All eight criteria rated high for the favourite.',
      'A criterion skipped because it is inconvenient.',
      'Ten names rated instead of three.',
    ],
    ladder: {
      opening: 'rate two or three finalists against the eight criteria, one criterion at a time.',
      probes: ['which criterion did you rate highest — would a stranger agree?'],
      reframes: ['if every criterion is high, ask where the name is weakest; every name is weak somewhere'],
    },
    effort: { minutes: 3, turns: 3 },
    examples: pathExamples(
      {
        de: '## Kolben\nSprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: gut · Passend: '
          + 'mittel · Erweiterbar: gut · Frei: offen · Zeitlos: gut',
        en: '## Piston\nSayable: good · Spellable: good · Memorable: medium · Protectable: good · Fitting: '
          + 'medium · Extendable: good · Available: open · Timeless: good',
      },
      {
        de: '## Hain\nSprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: mittel · Passend: '
          + 'gut · Erweiterbar: gut · Frei: offen · Zeitlos: gut',
        en: '## Grove\nSayable: good · Spellable: good · Memorable: medium · Protectable: medium · Fitting: '
          + 'good · Extendable: good · Available: open · Timeless: good',
      },
    ),
  },
  'f.decision': {
    goal: 'settle their top three names, in order — first choice first, then the two fallbacks.',
    quality: [
      'Exactly three names, in order.',
      'Every one of them comes from the shortlist.',
      'The reason for first place is supported by one of the criteria.',
      'Second and third are real fallbacks, not filler.',
    ],
    antiPatterns: [
      'A single name with no fallbacks.',
      'A ranking that contradicts the criteria ratings.',
      'A name that never was on the shortlist.',
    ],
    ladder: {
      opening: 'settle the top three, in order, with a reason for first place.',
      probes: ['if the trademark check kills number one, is number two really your next choice?'],
      reframes: ['if only one name is named, ask which two they could live with'],
    },
    form: { person: 'none', tense: 'present' },
    // DIE WERT-FORM IST EINE LISTE (Paket-1-Befund (b), jetzt entschieden):
    // „top three, in order" ist kein Einzelwert, also kein `memberOf`. Der Wert
    // ist die übliche Listen-Form „- Name" je Zeile, und die REIHENFOLGE der
    // Zeilen IST die Rangfolge — deshalb `subsetOf` (jede Zeile muss aus der
    // Shortlist stammen) und nicht `count`: die Zahl drei steht in den
    // Qualitätsmerkmalen, weil ein 409 auf „nur zwei Namen gefunden" niemandem
    // hilft. Anders als bei `f.shortlist` trägt die Quelle hier nur den Namen.
    invariants: [{ kind: 'subsetOf', of: 'f.shortlist' }],
    examples: pathExamples(
      {
        de: '- Kolben\n- Sattelfest\n- Nabe',
        en: '- Piston\n- Saddlefast\n- Hub',
      },
      {
        de: '- Hain\n- Ehlerding\n- Nordlicht',
        en: '- Grove\n- Ehlerding\n- Northlight',
      },
    ),
  },

  // ── Ergebnis ────────────────────────────────────────────────────────────
  'result.direction': {
    goal: 'settle which direction fits this brand.',
    quality: [
      'One of the offered directions is chosen, not a mixture.',
      'The reason refers to the archetype or the tone words, not to a colour preference.',
      'It is a direction for the brand, not for one page.',
      'They could explain the choice to somebody who was not in the room.',
    ],
    antiPatterns: [
      'A choice made on colour taste alone.',
      'A mixture of two directions.',
      'The direction that looks the most expensive.',
    ],
    ladder: {
      opening: 'show the directions, name the one that follows from their archetype and tone, and say why.',
      probes: ['which of these would still feel right on an invoice?'],
      reframes: ['if the choice is about colour only, ask which one sounds like their tone words'],
    },
    examples: pathExamples(
      {
        de: 'Die ruhige Richtung — sie passt zu „karg" und „geduldig"; die kontrastreiche wirkt wie ein '
          + 'Angebot im Schaufenster.',
        en: 'The quiet direction — it matches "spare" and "patient"; the high-contrast one looks like an '
          + 'offer in a shop window.',
      },
      {
        de: 'Die warme Richtung, weil unsere Leute wiederkommen sollen und nicht angetrieben werden wollen.',
        en: 'The warm direction, because our people are meant to come back, not to be pushed.',
      },
    ),
  },
  'result.rating': {
    goal: 'capture how helpful this result was — voluntary, and never pressed for.',
    quality: [
      'It is their own answer, given without being pressed.',
      'A low rating is recorded as it stands.',
      'Skipping it is a valid outcome and ends the session.',
    ],
    antiPatterns: [
      'Asking again after a skip.',
      'Reading the rating as a confirmation of the result.',
      'Framing the question so that a low answer feels rude.',
    ],
    ladder: {
      opening: 'ask once, plainly, and accept a skip as an answer.',
      // KEINE Nachfragen und keine Umdeutung — beides wäre hier Druck. Die
      // Frage ist ausdrücklich freiwillig (Content-Spec §11), und eine
      // freiwillige Frage, die zweimal gestellt wird, ist keine mehr.
      probes: [],
      reframes: [],
    },
    answers: { maxProbes: 0, allowUnknown: true },
    effort: { minutes: 1, turns: 1 },
    // KEINE BEISPIELE: eine Beispiel-Bewertung („4 von 5") zeigt keine Form,
    // sondern nur eine Zahl — und eine gezeigte Zahl ist ein Anker auf genau
    // die Antwort, die hier unverfälscht gebraucht wird.
  },
}
