/**
 * DIE SLOT-REGISTRY — der Code-Vertrag des P0-Slot-Katalogs (Plan §3e,
 * Inhalte aus docs/plans/BRAND-WIZARD-CONTENT-SPEC.md §§3–11).
 *
 * „Navigation, Fortschritt, Validierung, Abhängigkeiten und Prompt-Aufbau
 * entstehen aus DIESER einen Registry — nicht aus fünf getrennten
 * Regelwerken" (Plan §3e). Diese Datei ist PURE: kein Appwrite, kein H3, kein
 * i18n-Import. Sie beschreibt nur, WELCHE Felder es gibt und wie sie
 * zusammenhängen; WAS drinsteht, entscheiden die Routen, und WIE es heisst,
 * entscheiden die Locale-Dateien (P1c).
 *
 * ── SLOT-IDS SIND UNVERÄNDERLICH ──────────────────────────────────────────
 * Eine Slot-Id wird NIE übersetzt und NIE umbenannt (Plan §3e). Sie steht in
 * `brand_steps.slots` als JSON-Schlüssel jeder Zeile jedes Bestands-Brandings
 * — ein Rename wäre eine stille Datenlöschung. Die Ids sind wörtlich die des
 * Katalogs (`a.pitch`, `b.purpose`, `c.conflictRule`, `d.pairs`,
 * `e.statements`, `ep.taglines`, `f.checks` …).
 *
 * ── MIGRATIONSVERTRAG (Plan §3e „Registry- und Daten-Migration") ───────────
 * `REGISTRY_VERSION` steigt, sobald sich der Katalog ändert; die Version wird
 * je Brand/Step mitgeschrieben. Ein Slot, der nicht mehr gebraucht wird, wird
 * `deactivated: true` gesetzt — NIE aus dem Array entfernt: nur so bleiben
 * Bestandsdaten lesbar und ein Rollback auf die Vorversion möglich. Alle
 * Helfer hier überspringen deaktivierte Slots, `slotById` findet sie aber
 * weiterhin (ein Leser muss alte Daten anzeigen können). Neu HINZUKOMMENDE
 * Pflicht-Slots machen Bestands-Brands nicht unvollständig — diese Regel
 * lebt in `brandJourney.ts` (ein gespeichertes `done` wird nicht neu
 * berechnet), nicht hier.
 *
 * ── DIE ZEHN FELDER ───────────────────────────────────────────────────────
 * `id`            stabile Katalog-Id (s. o.)
 * `stepId`        einer der neun stepKeys des Schema-Anhangs §2
 * `type`          der FÜLLWEG (s. u.)
 * `required`      zählt für „Baustein abgeschlossen" (brandJourney)
 * `schema`        deklarativ `{ kind, maxLength }` — echte Zod-Factories
 *                 kommen mit den Routen (P1b). Der Vertrag hier ist bewusst
 *                 schlank: eine Registry, die Zod importiert, wäre auf dem
 *                 Client eine Bibliothek statt einer Tabelle.
 * `dependencies`  Quell-Slots für den inputHash-Vertrag (s. u.)
 * `questionKey`   i18n-Schlüssel-NAME `brand.q.<id>` (s. u.)
 * `helpKey`       `brand.help.<id>` ODER `null` (s. u.)
 * `editor`        womit der Mensch ihn anfasst
 * `generator`     ob und wie George ihn entwirft
 * `maxLength`     Zeichen-Deckel; `schema.maxLength` ist derselbe Wert
 *                 (`defineSession` setzt beide aus EINER Angabe — sie können
 *                 nicht auseinanderlaufen, der Test prüft es trotzdem)
 *
 * ── FÜLLWEGE (`type`) — die Buchstaben des Katalogs §3 ─────────────────────
 * 'question'    = **F** reine Menschenfrage (Provokation)
 * 'derivation'  = **K** George leitet ab, der Mensch bestätigt/korrigiert
 * 'choice'      = **A** Auswahl/Chips
 * 'stage-edit'  = **K→B** George entwirft, redigiert wird auf der BÜHNE
 * 'special'     = eigenes Instrument; genau EINER: `d.pairs`
 *                 (Paarvergleich, Katalog §12). Die Konfidenz-Weiche ist
 *                 KEIN Slot — sie steht als `brand_steps.confidence` je
 *                 Baustein (Schema-Anhang §2) und wird in `brandJourney.ts`
 *                 geprüft; als 68. Slot wäre sie in der Fortschritts-Formel
 *                 doppelt gezählt.
 *
 * `type` und `generator` sind ZWEI ACHSEN, nicht eine: `b.whyStarted` ist
 * eine Menschenfrage (`'question'`) UND auf dem Gründer-Pfad aus `a.origin`
 * ableitbar (`generator: 'derive'`) — der Katalog sagt dort ausdrücklich
 * „entfällt, wenn a.origin es schon trägt". Eine zusammengelegte Achse
 * zwänge dort entweder eine doppelte Frage oder einen fehlenden Entwurf.
 *
 * ── DEPENDENCIES / inputHash ──────────────────────────────────────────────
 * `dependencies` sind die Slot-Ids, aus deren Ständen der inputHash der
 * letzten Generation gebildet wird (Schema-Anhang §2: „veraltet" ist
 * ABGELEITET — inputHash ≠ aktuell, kein Flag). Sie zeigen deshalb IMMER
 * rückwärts: ein Slot darf nur von Slots abhängen, die in diesem Array VOR
 * ihm stehen. Das macht die Reihenfolge des Arrays zur topologischen
 * Ordnung — Zyklen sind damit strukturell unmöglich statt nur getestet
 * (getestet werden sie zusätzlich, inklusive Gegenprobe).
 *
 * Leere `dependencies` heissen NICHT „hängt von nichts ab": die Slots des
 * Bausteins A schöpfen aus der STARTKARTE (URL, Branche, „was macht ihr",
 * „für wen") und die ist kein Slot — sie steht seit brand-009 auf
 * `brand_profiles` (Katalog §2.1: „Mehr erhebt Schritt 0 NICHT") und reist
 * über den Generator-Vertrag (`BrandGeneratorContext.startCard`) zu George,
 * nicht über diese Liste.
 *
 * IM inputHash STEHT SIE HEUTE NICHT (Stand P2.5): der Hash beschreibt den
 * Stand der Quell-SLOTS, und `collectSlotDependencies` ist seine einzige
 * Quelle. Eine geänderte Startkarte macht einen bestehenden Entwurf also
 * nicht „veraltet" — bekannt und bewusst offen, kein Versehen.
 *
 * ── questionKey / helpKey ─────────────────────────────────────────────────
 * Mechanisch `brand.q.<id>` bzw. `brand.help.<id>` — `defineSession` baut sie,
 * damit kein Tippfehler entstehen kann. `helpKey` ist `null`, wo es KEINEN
 * Lehrblock gibt: ein Schlüssel ohne Übersetzung rendert wörtlich sich
 * selbst (der `legal.imprint`-Fuss von comments.pukalani.app stand vier Tage
 * so da). Wo er gesetzt ist, steht dahinter genau ein Lehrblock aus Katalog
 * §13:
 *
 *   teach.pvm              → b.purpose · b.vision · b.mission
 *                            (+ b.positioningCategory: „Was heisst
 *                            Positionierung?", §3b)
 *   teach.values           → c.candidates · c.final
 *   teach.archetypes       → d.pairs · d.primary (+ d.gapReveal: Selbstbild
 *                            gegen Aussenbild braucht einen Satz Erklärung)
 *   teach.manifesto        → e.statements · e.manifesto
 *   teach.naming.types     → f.nameType
 *   teach.naming.why       → f.taste
 *   teach.naming.trademark → f.checks
 *   (B2-Infografik §12.3)  → b2.model
 *
 * ── PFAD-VARIANTEN ────────────────────────────────────────────────────────
 * Die Weiche W1 („Neue Marke" / „Marken-Relaunch") tauscht bei drei Slots
 * die FRAGEFASSUNG, nicht den Slot. Konvention: `pathVariants` markiert,
 * welche Pfade eine eigene Fassung haben, und der Schlüssel bekommt das
 * Suffix — `brand.q.a.origin.new` / `brand.q.a.origin.relaunch`. Ist für
 * einen Pfad keine Variante vermerkt, gilt der Basis-Schlüssel
 * (`d.gapReveal` hat nur `relaunch: true`: dort heisst er
 * „Aussenbild-Check", auf dem Gründer-Pfad bleibt es der Basis-Text).
 * `questionKeyFor()` ist die EINE Stelle, die das rechnet.
 *
 * ── TEAM-VARIANTEN (Paket 2b, Davids Entscheidung 2026-09-04) ─────────────
 * Dieselbe Mechanik für die Weiche W3 (Solo/Team), aber an EINEM Slot:
 * `c.discovery3` fragt im Team nach der Entscheidungsregel für den Fall, dass
 * der Inhaber nicht im Raum ist (D7 der Content-Spec §6), solo nach dem
 * Verhalten, das niemals geduldet wird (D3). `teamVariant: true` markiert
 * das, und der Schlüssel bekommt IMMER ein Suffix — `brand.q.c.discovery3.solo`
 * bzw. `.team`. IMMER, nicht nur im Team-Fall: ein JSON-Katalog kann unter
 * EINEM Schlüssel nicht gleichzeitig eine Zeichenkette und ein Kind-Objekt
 * halten (dieselbe Grenze wie bei `d.gapReveal`, s. `tests/i18nCatalog.test.ts`),
 * also sind beide Fassungen Kinder.
 * Pfad- und Team-Variante schliessen sich aus: vier Fassungen je Frage wären
 * vier Texte, die niemand mehr gegenliest — `validateSlotRegistry` weist die
 * Kombination ab.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * Die Weiche W3 (Solo/Team) gatet keinen Step, sondern EINEN Slot
 * (`c.teamFilter`). Slot-Bedingungen INNERHALB eines Bausteins modelliert
 * Phase 1 nicht als Prädikat, sondern über `required: false` — sonst könnte
 * ein Solo-Branding den Baustein „Werte" nie abschliessen. Dasselbe gilt für
 * `a.toneAnalysis` (braucht vorhandene Texte, die eine neue Marke nicht hat)
 * und `result.rating` (ausdrücklich freiwillig, Katalog §11). Ein späteres
 * `appliesWhen` kann das verschärfen; ein zu strenges `required` heute wäre
 * eine Sackgasse im Produkt.
 *
 * ── EIN SLOT IST EINE SESSION (BW2 Paket 1, 2026-09-04) ───────────────────
 * Aus `defineSlot` ist `defineSession` geworden, aus `BrandSlot` die
 * vollständige `BrandSessionConfig` (Plan BRAND-WIZARD-SESSIONS.md §3/§3a):
 * Ziel, Eingaben, Verarbeitung, Antwort-Regeln, Output, Qualität,
 * Anti-Muster, Form, Invarianten, Vertraulichkeit, Umfang. `BrandSlot` bleibt
 * als NAME dieses Typs bestehen — die 33 Leser der Registry sprechen weiter
 * von Slots, und ein Rename quer durch App und Routen wäre Bewegung ohne
 * Aussage. Die Ids ändern sich ohnehin NIE (s. o.).
 *
 * Die alten zehn Felder sind unverändert erhalten und stehen zusätzlich in
 * ihrer Session-Fassung (`type` neben `kind`, `dependencies` neben
 * `inputs.slots`, `schema/editor/generator` neben `output.*`). Das ist keine
 * Doppelung aus Bequemlichkeit, sondern der Migrationsweg: Paket 3–7 stellen
 * die Leser nach und nach um, und bis dahin darf keine der beiden Fassungen
 * lügen — `defineSession` baut BEIDE aus EINER Angabe, sie können nicht
 * auseinanderlaufen, und `validateSlotRegistry` prüft es trotzdem.
 *
 * WO DER INHALT LEBT: `goal` und `processing.rules` sind Prompt-TEXT und
 * stehen in `sessionContent.ts` (eigener Pflege-Rhythmus, Davids Inhalts-Gate
 * in Paket 2). Was hier steht, ist die Struktur.
 */

import type { BrandAdvisorKey } from './brandAdvisors'
import { techniqueForStep } from './brandAdvisors'
import {
  type BrandSessionAnswers,
  type BrandSessionContent,
  type BrandSessionEffort,
  type BrandSessionExamples,
  type BrandSessionForm,
  type BrandSessionKind,
  type BrandSessionLadder,
  type BrandSessionSensitivity,
  type BrandInvariant,
  SESSION_CONTENT,
} from './sessionContent'

export type {
  BrandInvariant,
  BrandInvariantKind,
  BrandSessionAnswers,
  BrandSessionEffort,
  BrandSessionExamples,
  BrandSessionExampleSet,
  BrandSessionForm,
  BrandSessionKind,
  BrandSessionLadder,
  BrandSessionSensitivity,
  BrandSessionSubstance,
} from './sessionContent'

/** Die neun Bausteine (Schema-Anhang §2 `brand_steps.stepKey`), in Reihenfolge. */
export const BRAND_STEP_KEYS = [
  'context',
  'pvm',
  'architecture',
  'values',
  'archetype',
  'manifesto',
  'verbal',
  'naming',
  'result',
] as const
export type BrandStepKey = (typeof BRAND_STEP_KEYS)[number]

/** Füllweg des Slots — die Buchstaben F/K/A/B des Katalogs §3, plus `special`. */
export type BrandSlotType = 'question' | 'derivation' | 'choice' | 'stage-edit' | 'special'

/** Womit der Mensch den Slot anfasst. `none` = nur lesen (berechnete Slots). */
export type BrandSlotEditor = 'chips' | 'text' | 'textarea' | 'stage' | 'cards' | 'none'

/** Ob und wie George entwirft. `none` = reine Menschenfrage bzw. reine Auswahl. */
export type BrandSlotGenerator = 'none' | 'derive' | 'draft' | 'candidates'

/**
 * Speicherform. `richtext` = Markdown und NUR für Langtexte (Plan §3e
 * „Editor- & Inhaltsformat": Markdown nur für Manifest/Brand Story, kein HTML
 * als kanonisches Format).
 */
export type BrandSlotSchemaKind = 'text' | 'richtext' | 'choice' | 'list' | 'structured'

export interface BrandSlotSchema {
  kind: BrandSlotSchemaKind
  maxLength: number
}

/** Welche Pfade eine eigene Fragefassung haben (s. Kopf „Pfad-Varianten"). */
export interface BrandSlotPathVariants {
  new?: boolean
  relaunch?: boolean
}

export type BrandPathKind = 'new' | 'relaunch'

/**
 * Die Weiche W3 (Solo/Team). Sie steht neben `BrandPathKind` und nicht in
 * `shared/types/brand.ts`, weil `questionKeyFor` sie braucht und jene Datei
 * AUS dieser hier importiert — die Gegenrichtung wäre ein Zyklus. Dort wird
 * sie weiter re-exportiert, damit jede Aufrufstelle bleibt, wo sie war.
 */
export type BrandTeamKind = 'solo' | 'team'

/**
 * DER SESSION-VERTRAG (Plan §3 + §3a) — eine deklarative Beschreibung je Feld,
 * PUR (kein i18n, kein H3, kein Appwrite).
 *
 * Die zehn Katalog-Felder von P1b stehen unverändert oben; darunter die
 * Session-Fassung. Beide entstehen aus EINER Angabe (`defineSession`).
 */
export interface BrandSessionConfig {
  readonly id: string
  readonly stepId: BrandStepKey
  readonly type: BrandSlotType
  readonly required: boolean
  readonly schema: BrandSlotSchema
  readonly dependencies: readonly string[]
  readonly questionKey: string
  readonly helpKey: string | null
  readonly editor: BrandSlotEditor
  readonly generator: BrandSlotGenerator
  readonly maxLength: number
  readonly pathVariants?: BrandSlotPathVariants
  /** Eigene Fragefassung je Weiche W3 (Solo/Team) — s. Kopf „Team-Varianten". */
  readonly teamVariant?: true
  /** Migrationsvertrag: nicht mehr gefragt, aber weiter lesbar. Nie löschen. */
  readonly deactivated?: true

  /** Die Arbeitsform dieser Session — mechanisch aus `type` (s. `sessionKindFor`). */
  readonly kind: BrandSessionKind
  /** ZIEL — ein Satz, was am Ende feststehen muss (Prompt-Text, englisch). */
  readonly goal: string
  /**
   * Die Teile einer `collect`-Session, in Frage-Reihenfolge (Locale-Schlüssel
   * `brand.q.<id>.<part>`). Für jede andere Art leer — `collect` ist der
   * EINZIGE Typ mit Teilen (Plan §3).
   */
  readonly parts: readonly string[]

  /** EINGABEN — was die Session lesen darf. */
  readonly inputs: {
    /** Bestätigte Werte anderer Sessions — dieselbe Liste wie `dependencies`. */
    readonly slots: readonly string[]
    /** Die Nicht-Slot-Quellen (bis BW2 implizit). */
    readonly startCard: boolean
    readonly siteAnalysis: boolean
    /** Notizen früherer Sessions dieses Kapitels mitlesen? (Paket 4) */
    readonly notes: 'chapter' | 'none'
  }

  /** VERARBEITUNG — wie Antworten eingeordnet werden. */
  readonly processing: {
    /** Wörtlich in den Prompt (`sessionInstruction`). */
    readonly rules: readonly string[]
    /** Regeln, die nur auf EINEM Pfad gelten (Weiche W1). */
    readonly pathRules: { readonly new: readonly string[], readonly relaunch: readonly string[] }
    /** Welche Kollegin hinter George steht — aus `techniqueForStep(stepId)`. */
    readonly technique: BrandAdvisorKey
  }

  /** ANTWORT-REGELN — was bei dünn / „weiss nicht" / vertagt passiert. */
  readonly answers: BrandSessionAnswers

  /** OUTPUT — der Feldwert nach Schema, plus die Tiefe des Schliess-Aufrufs. */
  readonly output: {
    readonly schema: BrandSlotSchema
    readonly editor: BrandSlotEditor
    readonly generator: BrandSlotGenerator
    /** Muss der Spezialist beim Schliessen gegen das Dokument prüfen? (Paket 4) */
    readonly review: 'full' | 'light'
  }

  /** 3–5 prüfbare Merkmale eines GUTEN Werts — je eines mit Ja/Nein zu beantworten. */
  readonly quality: readonly string[]
  /** Was der Spezialist zurückweist, je Feld (2–3 konkrete Muster). */
  readonly antiPatterns: readonly string[]
  /**
   * 1–2 erfundene starke Werte je Pfad, FREMDE Branche, JE SPRACHE.
   * Zweisprachig, weil sie nicht nur in den Prompt reisen, sondern auf der
   * Abnahme-Seite (Plan §5a) ein Mensch sie liest — Begründung in
   * `sessionContent.ts`.
   */
  readonly examples: BrandSessionExamples
  /** Die Interviewführung dieser einen Session (leer bei derive/draft/instrument). */
  readonly ladder: BrandSessionLadder
  /** Regeln, die der WERT selbst einhalten muss. */
  readonly form: BrandSessionForm
  /** Deterministische Prüfungen beim Bestätigen (`evaluateInvariants`). */
  readonly invariants: readonly BrandInvariant[]
  /** Was per Share-Link und Export standardmässig NICHT reist. */
  readonly sensitivity: BrandSessionSensitivity
  /** Was der Mensch vorher über den Umfang erfährt. */
  readonly effort: BrandSessionEffort
}

/**
 * DER ALTE NAME DESSELBEN TYPS. 33 Leser sprechen von Slots; ein Rename quer
 * durch App, Routen und Tests wäre Bewegung ohne Aussage (s. Kopf).
 */
export type BrandSlot = BrandSessionConfig

/**
 * Fassung des Katalogs. Steigt bei JEDER Änderung an Ids, `required`,
 * `dependencies` oder Limits — sie wird je Brand/Step mitgeschrieben und
 * entscheidet, welcher Upcaster alte Slot-Daten liest (Plan §3e).
 */
export const REGISTRY_VERSION = 1

/** Zeichen-Deckel eines einzelnen Slots (Schema-Anhang §2: „einzelner Slot-Text ≤ 20k"). */
export const BRAND_SLOT_MAX_LENGTH = 20_000

/** Deckel der gesamten `slots`-Spalte EINER Baustein-Zeile (Schema-Anhang §2). */
export const BRAND_STEP_SLOTS_MAX_LENGTH = 200_000

/** Kurztexte, Auswahlen, einzelne Sätze. */
const SHORT = 2_000
/** Listen, Steckbriefe, Bühnen-Dokumente, Manifest. */
const LONG = BRAND_SLOT_MAX_LENGTH

interface BrandSlotDefinition {
  id: string
  stepId: BrandStepKey
  type: BrandSlotType
  required: boolean
  kind: BrandSlotSchemaKind
  maxLength: number
  editor: BrandSlotEditor
  generator: BrandSlotGenerator
  dependencies?: readonly string[]
  /** true ⇒ `helpKey` wird gesetzt (Lehrblock-Zuordnung s. Kopf). */
  help?: boolean
  pathVariants?: BrandSlotPathVariants
  /** Eigene Fragefassung je Weiche W3 (Solo/Team) — s. Kopf „Team-Varianten". */
  teamVariant?: true
  deactivated?: true
}

/**
 * DIE ARBEITSFORM AUS DEM FÜLLWEG — mechanisch, ohne gepflegte zweite Liste
 * (Plan §3: „`kind` passt zum `type`-Erbe").
 *
 * EINE Ausnahme, und sie ist die Antwort auf einen offenen Punkt aus BW1:
 * `a.facts` steht im Katalog als `choice` (drei Auswahlfelder), ist aber in
 * Wahrheit eine MEHRTEILIGE Sammlung — Teamgrösse, Alter, Märkte, nacheinander
 * gefragt und zu EINEM strukturierten Wert zusammengelegt (`parts`). Der
 * `type` bleibt trotzdem `choice`: er beschreibt, WOMIT der Mensch antwortet
 * (Chips), und ihn zu ändern zöge REGISTRY_VERSION und die Upcaster mit.
 */
export function sessionKindFor(slot: { id: string, type: BrandSlotType }): BrandSessionKind {
  if (slot.id === 'a.facts') return 'collect'
  switch (slot.type) {
    case 'question': return 'ask'
    case 'choice': return 'choose'
    case 'derivation': return 'derive'
    case 'stage-edit': return 'draft'
    case 'special': return 'instrument'
  }
}

/**
 * DIE VORGABEN JE ARBEITSFORM — Platzhalter aus Paket 1, gepflegt in Paket 2.
 *
 * Sie stehen als TABELLE und nicht 68-mal von Hand: 68 vollständige Datensätze
 * wären 68 Chancen, einen Wert zu vergessen, und ein vergessener Deckel fällt
 * an einem Gespräch auf, das nicht aufhört zu fragen.
 *
 * ── DIE MINUTEN SIND IN PAKET 2b HALBIERT (Davids Entscheidung 2026-09-04) ─
 * Die Summe der alten Schätzungen ergab 154 Min im Basispfad — gegen die
 * Kommunikationslinie „~45 Minuten" (Content-Spec §16). Entschieden ist
 * „halbieren und in Kapitel-Etappen kommunizieren": der Basispfad liegt jetzt
 * bei ~77 Min, der Vollpfad bei ~95 Min, und `tests/slotRegistry.test.ts`
 * nagelt die Spanne fest. `turns` sind NICHT halbiert — sie sind der Deckel
 * der Leiter, nicht die Uhr, und müssen zu `answers.maxProbes` passen
 * (Eröffnung + Nachfragen, ebenfalls geprüft).
 */
const KIND_DEFAULTS: Readonly<Record<BrandSessionKind, {
  answers: BrandSessionAnswers
  effort: BrandSessionEffort
  review: 'full' | 'light'
}>> = {
  ask: {
    answers: { minSubstance: 'medium', maxProbes: 2, allowUnknown: true, allowDefer: false },
    effort: { minutes: 1, turns: 4 },
    review: 'full',
  },
  collect: {
    answers: { minSubstance: 'medium', maxProbes: 2, allowUnknown: true, allowDefer: false },
    effort: { minutes: 3, turns: 6 },
    review: 'full',
  },
  choose: {
    answers: { minSubstance: 'short', maxProbes: 0, allowUnknown: false, allowDefer: false },
    effort: { minutes: 1, turns: 2 },
    // Eine Wahl aus einer GESCHLOSSENEN Menge kann dem Dokument nicht
    // widersprechen, ohne dass es die Menge selbst täte — der teure Blick
    // über alle Kapitel wäre hier bezahlte Gewissheit.
    review: 'light',
  },
  derive: {
    answers: { minSubstance: 'short', maxProbes: 1, allowUnknown: false, allowDefer: false },
    effort: { minutes: 1, turns: 2 },
    review: 'full',
  },
  draft: {
    answers: { minSubstance: 'short', maxProbes: 1, allowUnknown: false, allowDefer: false },
    effort: { minutes: 2, turns: 3 },
    review: 'full',
  },
  instrument: {
    answers: { minSubstance: 'short', maxProbes: 0, allowUnknown: false, allowDefer: false },
    effort: { minutes: 3, turns: 1 },
    review: 'full',
  },
}

const EMPTY_STRINGS: readonly string[] = []
const EMPTY_EXAMPLES: BrandSessionExamples = {
  new: { de: EMPTY_STRINGS, en: EMPTY_STRINGS },
  relaunch: { de: EMPTY_STRINGS, en: EMPTY_STRINGS },
}
const EMPTY_LADDER: BrandSessionLadder = { opening: '', probes: EMPTY_STRINGS, reframes: EMPTY_STRINGS }

/**
 * Baut EINEN Eintrag. Die i18n-Schlüssel und `schema` entstehen aus der Id
 * bzw. aus `kind`/`maxLength` — beides kann deshalb nicht auseinanderlaufen.
 *
 * SEIT BW2 baut sie die volle `BrandSessionConfig`: Struktur aus der Zeile
 * hier, Inhalt aus `SESSION_CONTENT[id]`, alles Übrige aus den Vorgaben je
 * Arbeitsform. Fehlt der Inhalts-Eintrag, bleibt `goal` leer — und genau das
 * lässt `validateSlotRegistry` rot werden, statt eine Session ohne Ziel still
 * durchzulassen.
 */
function defineSession(definition: BrandSlotDefinition): BrandSessionConfig {
  const content: BrandSessionContent | undefined = SESSION_CONTENT[definition.id]
  const kind = sessionKindFor({ id: definition.id, type: definition.type })
  const defaults = KIND_DEFAULTS[kind]
  const dependencies = definition.dependencies ?? []
  const schema: BrandSlotSchema = { kind: definition.kind, maxLength: definition.maxLength }

  return {
    id: definition.id,
    stepId: definition.stepId,
    type: definition.type,
    required: definition.required,
    schema,
    dependencies,
    questionKey: `brand.q.${definition.id}`,
    helpKey: definition.help ? `brand.help.${definition.id}` : null,
    editor: definition.editor,
    generator: definition.generator,
    maxLength: definition.maxLength,
    ...(definition.pathVariants ? { pathVariants: definition.pathVariants } : {}),
    ...(definition.teamVariant ? { teamVariant: definition.teamVariant } : {}),
    ...(definition.deactivated ? { deactivated: definition.deactivated } : {}),

    kind,
    goal: content?.goal ?? '',
    parts: content?.parts ?? EMPTY_STRINGS,
    inputs: {
      slots: dependencies,
      // Nur Baustein A schöpft aus der Startkarte — seine Slots haben genau
      // deshalb keine `dependencies` (s. Kopf). Ab B sind die ANTWORTEN die
      // primäre Quelle und die Karte nur noch Hintergrund.
      startCard: content?.startCard ?? definition.stepId === 'context',
      siteAnalysis: content?.siteAnalysis ?? false,
      notes: 'chapter',
    },
    processing: {
      rules: content?.rules ?? EMPTY_STRINGS,
      pathRules: {
        new: content?.pathRules?.new ?? EMPTY_STRINGS,
        relaunch: content?.pathRules?.relaunch ?? EMPTY_STRINGS,
      },
      // WIE hier gefragt wird, sagt das Beraterteam und nicht diese Zeile —
      // eine zweite gepflegte Zuordnung liefe irgendwann auseinander.
      technique: techniqueForStep(definition.stepId).key,
    },
    answers: content?.answers ? { ...defaults.answers, ...content.answers } : defaults.answers,
    output: {
      schema,
      editor: definition.editor,
      generator: definition.generator,
      review: defaults.review,
    },
    quality: content?.quality ?? EMPTY_STRINGS,
    antiPatterns: content?.antiPatterns ?? EMPTY_STRINGS,
    examples: content?.examples ?? EMPTY_EXAMPLES,
    ladder: content?.ladder ?? EMPTY_LADDER,
    form: {
      person: 'fromTeam',
      tense: 'any',
      maxWords: null,
      forbidden: EMPTY_STRINGS,
      ...content?.form,
    },
    invariants: content?.invariants ?? [],
    sensitivity: content?.sensitivity ?? 'public',
    effort: content?.effort ?? defaults.effort,
  }
}

/**
 * DER KATALOG. Reihenfolge = Reihenfolge der Bausteine und innerhalb eines
 * Bausteins die des Content-Katalogs; sie ist zugleich die topologische
 * Ordnung der `dependencies` (s. Kopf) und die Reihenfolge, in der
 * `resolveNextQuestion` fragt.
 */
export const BRAND_SLOTS: readonly BrandSlot[] = [
  // ── A · Kontext (Katalog §4) — 11 Slots ─────────────────────────────────
  // Alle A-Slots ohne `dependencies`: sie schöpfen aus der Startkarte, und
  // die ist kein Slot (s. Kopf).
  defineSession({ id: 'a.pitch', stepId: 'context', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'derive' }),
  defineSession({ id: 'a.category', stepId: 'context', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'derive' }),
  defineSession({ id: 'a.competitors', stepId: 'context', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft' }),
  defineSession({ id: 'a.audienceSketch', stepId: 'context', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft' }),
  // Nicht Pflicht: eine neue Marke hat keine Texte, die man analysieren könnte.
  defineSession({ id: 'a.toneAnalysis', stepId: 'context', type: 'derivation', required: false, kind: 'text', maxLength: LONG, editor: 'none', generator: 'derive' }),
  // W1 tauscht die Fassung: Ursprungsgeschichte (neu) bzw. R1–R4 (Relaunch, Katalog §2.3).
  defineSession({ id: 'a.origin', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: LONG, editor: 'textarea', generator: 'none', pathVariants: { new: true, relaunch: true } }),
  defineSession({ id: 'a.customerPraise', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'a.complaints', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'a.oneThing', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'a.challenge', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'a.facts', stepId: 'context', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'chips', generator: 'none' }),

  // ── B · Purpose · Vision · Mission + Positionierung (Katalog §5) — 10 ───
  // ABWEICHUNG von der Zählung „B: 8": der Katalog führt
  // `b.purpose / b.vision / b.mission` in EINER Tabellenzeile, es sind aber
  // DREI stabile Slot-Ids mit je eigenem Entwurf und eigener Konfidenz
  // (Abdeckungs-Matrix §15, Formular 02 §6/§8/§10 — drei getrennte
  // „Draft + Konfidenz"-Paare). Eine gemeinsame Id wäre im Speicher ein
  // Klumpen, den man nicht einzeln neu entwerfen kann.
  defineSession({ id: 'b.whyStarted', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'derive', dependencies: ['a.origin'], pathVariants: { new: true, relaunch: true } }),
  defineSession({ id: 'b.worldLoses', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'b.conviction', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'b.tenYears', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'b.legacy', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'b.purpose', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.pitch', 'b.whyStarted', 'b.worldLoses', 'b.conviction'] }),
  defineSession({ id: 'b.vision', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.oneThing', 'b.tenYears', 'b.legacy'] }),
  defineSession({ id: 'b.mission', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.pitch', 'a.audienceSketch', 'a.oneThing', 'a.customerPraise', 'b.purpose'] }),
  defineSession({ id: 'b.positioningCategory', stepId: 'pvm', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'derive', help: true, dependencies: ['a.pitch', 'a.category', 'a.competitors'] }),
  defineSession({ id: 'b.positioningFirstChoice', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),

  // ── B2 · Markenarchitektur (Katalog §5a, nur bei W4 = ja) — 5 ───────────
  // `required: true` INNERHALB des Bausteins; ob er überhaupt läuft,
  // entscheidet die Weiche in brandJourney.ts.
  defineSession({ id: 'b2.visibility', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSession({ id: 'b2.roleOfMaster', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSession({ id: 'b2.namingPattern', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSession({ id: 'b2.model', stepId: 'architecture', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'cards', generator: 'derive', help: true, dependencies: ['a.category', 'b.positioningCategory', 'b2.visibility', 'b2.roleOfMaster', 'b2.namingPattern'] }),
  defineSession({ id: 'b2.rule', stepId: 'architecture', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', dependencies: ['b2.model', 'b2.namingPattern'] }),

  // ── C · Werte (Katalog §6) — 9 ──────────────────────────────────────────
  // ABWEICHUNG von der Zählung „C: 7": `c.discovery1–3` sind DREI Ids. Die
  // KI wählt drei aus dem Sieben-Pool (§6) — welche, steht im gefüllten
  // Slot; eine gemeinsame Id könnte nicht sagen, welche Frage beantwortet
  // wurde. Dieselbe Auflösung wie bei `e.warmup1/2`.
  defineSession({ id: 'c.discovery1', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'c.discovery2', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'c.discovery3', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', teamVariant: true }),
  defineSession({ id: 'c.candidates', stepId: 'values', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'candidates', help: true, dependencies: ['a.origin', 'a.customerPraise', 'a.complaints', 'b.conviction', 'c.discovery1', 'c.discovery2', 'c.discovery3'] }),
  defineSession({ id: 'c.final', stepId: 'values', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'none', help: true, dependencies: ['c.candidates'] }),
  defineSession({ id: 'c.definitions', stepId: 'values', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['c.discovery1', 'c.discovery2', 'c.discovery3', 'c.final'] }),
  defineSession({ id: 'c.livedExamples', stepId: 'values', type: 'question', required: true, kind: 'list', maxLength: LONG, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),
  defineSession({ id: 'c.conflictRule', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),
  // Nur die Team-Fassung stellt diese Frage (W3) — deshalb nicht Pflicht.
  defineSession({ id: 'c.teamFilter', stepId: 'values', type: 'question', required: false, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),

  // ── D · Archetyp & Stimme (Katalog §7 + §12) — 12 ───────────────────────
  // ABWEICHUNG von der Zählung „D: 11": `d.primary/d.secondary` stehen im
  // Katalog in einer Zeile, sind aber zwei berechnete Werte („Der Weise ·
  // Rest Schöpfer", §12.2) und damit zwei Ids.
  defineSession({ id: 'd.hypothesis', stepId: 'archetype', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'none', generator: 'derive', dependencies: ['a.pitch', 'a.toneAnalysis', 'a.customerPraise'] }),
  defineSession({ id: 'd.pairs', stepId: 'archetype', type: 'special', required: true, kind: 'structured', maxLength: LONG, editor: 'cards', generator: 'none', help: true, dependencies: ['d.hypothesis'] }),
  defineSession({ id: 'd.primary', stepId: 'archetype', type: 'derivation', required: true, kind: 'choice', maxLength: SHORT, editor: 'none', generator: 'derive', help: true, dependencies: ['d.pairs'] }),
  defineSession({ id: 'd.secondary', stepId: 'archetype', type: 'derivation', required: true, kind: 'choice', maxLength: SHORT, editor: 'none', generator: 'derive', dependencies: ['d.pairs'] }),
  defineSession({ id: 'd.gapReveal', stepId: 'archetype', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'none', generator: 'derive', help: true, dependencies: ['d.hypothesis', 'd.primary', 'd.secondary'], pathVariants: { relaunch: true } }),
  defineSession({ id: 'd.party', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'd.never', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'd.admired', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'd.emotion', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'd.voiceSamples', stepId: 'archetype', type: 'choice', required: true, kind: 'list', maxLength: LONG, editor: 'cards', generator: 'draft', dependencies: ['c.final', 'd.primary', 'd.secondary', 'd.party', 'd.emotion'] }),
  defineSession({ id: 'd.toneWords', stepId: 'archetype', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'derive', dependencies: ['a.toneAnalysis', 'd.primary', 'd.emotion'] }),
  // F→K: der Mensch nennt die NIE-Wörter, George ergänzt Benutzen/Meiden.
  defineSession({ id: 'd.vocabulary', stepId: 'archetype', type: 'question', required: true, kind: 'list', maxLength: LONG, editor: 'textarea', generator: 'derive', dependencies: ['d.primary', 'd.toneWords'] }),

  // ── E · Manifest (Katalog §8) — 6 ───────────────────────────────────────
  // ABWEICHUNG von der Katalog-Auflistung: `e.compositionTone / e.length /
  // e.usage` sind hier EIN strukturierter Slot `e.composition`. Die drei
  // Chips (Ton, Länge, Verwendung) konfigurieren GEMEINSAM genau eine
  // Komposition und werden nie einzeln neu entworfen; drei Ids hiessen drei
  // inputHash-Quellen für dasselbe Ereignis.
  defineSession({ id: 'e.warmup1', stepId: 'manifesto', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'e.warmup2', stepId: 'manifesto', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'e.statements', stepId: 'manifesto', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft', help: true, dependencies: ['b.purpose', 'b.vision', 'b.mission', 'c.final', 'c.definitions', 'd.primary', 'd.toneWords', 'e.warmup1', 'e.warmup2'] }),
  defineSession({ id: 'e.composition', stepId: 'manifesto', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'chips', generator: 'none' }),
  // Der EINE Markdown-Slot (Plan §3e „Editor- & Inhaltsformat").
  defineSession({ id: 'e.manifesto', stepId: 'manifesto', type: 'stage-edit', required: true, kind: 'richtext', maxLength: LONG, editor: 'stage', generator: 'draft', help: true, dependencies: ['d.toneWords', 'e.statements', 'e.composition'] }),
  defineSession({ id: 'e.anchorLine', stepId: 'manifesto', type: 'choice', required: true, kind: 'text', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['e.manifesto'] }),

  // ── E+ · Verbale Identität (Katalog §9) — 5 ─────────────────────────────
  defineSession({ id: 'ep.taglines', stepId: 'verbal', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'cards', generator: 'candidates', dependencies: ['b.purpose', 'b.positioningFirstChoice', 'c.final', 'd.primary', 'e.anchorLine'] }),
  defineSession({ id: 'ep.boilerplates', stepId: 'verbal', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['a.pitch', 'b.purpose', 'b.vision', 'b.mission', 'b.positioningCategory', 'd.toneWords'] }),
  defineSession({ id: 'ep.keyMessages', stepId: 'verbal', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['a.audienceSketch', 'b.mission', 'c.final', 'd.toneWords'] }),
  defineSession({ id: 'ep.vocabulary', stepId: 'verbal', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'derive', dependencies: ['d.toneWords', 'd.vocabulary'] }),
  defineSession({ id: 'ep.distinctiveAsset', stepId: 'verbal', type: 'choice', required: true, kind: 'text', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['e.anchorLine'] }),

  // ── F · Name (Katalog §10, nur per W2/Neuschnitt) — 8 ───────────────────
  defineSession({ id: 'f.nameType', stepId: 'naming', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'none', help: true }),
  defineSession({ id: 'f.taste', stepId: 'naming', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', help: true }),
  defineSession({ id: 'f.noGos', stepId: 'naming', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSession({ id: 'f.candidates', stepId: 'naming', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'cards', generator: 'candidates', dependencies: ['a.category', 'a.audienceSketch', 'a.competitors', 'b.purpose', 'c.final', 'd.primary', 'd.emotion', 'f.nameType', 'f.taste', 'f.noGos'] }),
  defineSession({ id: 'f.shortlist', stepId: 'naming', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['f.candidates'] }),
  defineSession({ id: 'f.checks', stepId: 'naming', type: 'derivation', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'derive', help: true, dependencies: ['f.shortlist'] }),
  defineSession({ id: 'f.criteria', stepId: 'naming', type: 'choice', required: true, kind: 'structured', maxLength: LONG, editor: 'chips', generator: 'none', dependencies: ['f.shortlist', 'f.checks'] }),
  defineSession({ id: 'f.decision', stepId: 'naming', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'cards', generator: 'none', dependencies: ['f.shortlist', 'f.checks', 'f.criteria'] }),

  // ── Ergebnis (Katalog §11) — 2 ──────────────────────────────────────────
  defineSession({ id: 'result.direction', stepId: 'result', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'cards', generator: 'none', dependencies: ['d.primary', 'd.toneWords', 'e.anchorLine'] }),
  // „freiwillige Abschlussfrage" (Katalog §11) — nie Pflicht.
  defineSession({ id: 'result.rating', stepId: 'result', type: 'choice', required: false, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'none' }),
]

const SLOTS_BY_ID = new Map<string, BrandSlot>(BRAND_SLOTS.map(slot => [slot.id, slot]))

/** Findet AUCH deaktivierte Slots — ein Leser muss Altdaten anzeigen können. */
export function slotById(slotId: string): BrandSlot | undefined {
  return SLOTS_BY_ID.get(slotId)
}

/** Alle aktiven Slots eines Bausteins, in Katalog-Reihenfolge. */
export function slotsForStep(stepKey: BrandStepKey): readonly BrandSlot[] {
  return BRAND_SLOTS.filter(slot => slot.stepId === stepKey && !slot.deactivated)
}

/** Die Pflicht-Slots eines Bausteins — die Menge, die der Katalog verlangt. */
export function requiredSlotsForStep(stepKey: BrandStepKey): readonly BrandSlot[] {
  return slotsForStep(stepKey).filter(slot => slot.required)
}

/**
 * KANN EIN MENSCH DIESEN SLOT ÜBERHAUPT BESTÄTIGEN?
 *
 * ── WARUM ES DIESE FRAGE GEBEN MUSS (Audit-Befund A4, 2026-09-02) ─────────
 * Der Katalog beschreibt den SOLL-Zustand, die Werkstatt das GEBAUTE. Genau
 * ein Slot fällt heute auseinander: `d.pairs` (Katalog §12, `type: 'special'`)
 * ist ein eigenes Instrument — der Paarvergleich — und das gibt es noch nicht
 * (P4). Er trägt weder Feld noch Bestätigung, `brandSlotControls` sagt das
 * ausdrücklich. `brandStepCompletion` zählte ihn trotzdem als Pflicht: im
 * Baustein `archetype` konnte `slotsReady` deshalb NIE wahr werden, die
 * Konfidenz-Weiche erschien nie, und der Baustein war eine stumme Sackgasse —
 * im Browser wie in der Route, die dieselbe Rechnung liest.
 *
 * DIE ANTWORT IST EINE REGEL, KEIN `required: false` IM KATALOG. Der Katalog
 * bleibt wahr (der Paarvergleich IST eine Pflicht-Entscheidung); was das Gate
 * verlangen darf, ist die Teilmenge, die ein Mensch auch bedienen kann.
 * Bekommt `d.pairs` sein Instrument, wechselt er den `type` und steht ohne
 * weiteres Zutun wieder im Gate — ein `required`-Wechsel im Katalog hätte
 * dagegen REGISTRY_VERSION und die Upcaster mitgezogen.
 *
 * Die BEDIEN-Rechnung liest dieselbe Regel (`brandSlotControls`, Eingabe
 * `confirmable`): Abschluss-Menge und Bedien-Menge meinen damit dasselbe.
 */
export function slotIsConfirmable(slot: BrandSlot): boolean {
  return slot.type !== 'special'
}

/** Der Nenner beider Fortschritts-Formeln: Pflicht UND bestätigbar. */
export function confirmableRequiredSlotsForStep(stepKey: BrandStepKey): readonly BrandSlot[] {
  return requiredSlotsForStep(stepKey).filter(slotIsConfirmable)
}

/**
 * Alle Slots, aus denen dieser Slot (transitiv) schöpft — die Menge, über die
 * der inputHash gebildet wird. Ohne den Slot selbst, in stabiler
 * Katalog-Reihenfolge.
 *
 * Terminiert auch bei einem versehentlich eingebauten Zyklus (`seen`-Menge),
 * statt in die Endlosschleife zu laufen; die Registry-Invarianten schliessen
 * Zyklen zusätzlich strukturell aus (s. Kopf) — aber ein Helfer, der bei
 * fehlerhaften Daten hängt, wäre ein Ausfall statt eines roten Tests. Genau
 * dafür ist `slots` überschreibbar: der Beweis kann ihm eine zyklische Liste
 * vorlegen, ohne die echte Registry zu beschädigen.
 */
export function dependencyClosure(slotId: string, slots: readonly BrandSlot[] = BRAND_SLOTS): readonly string[] {
  const lookup = slots === BRAND_SLOTS ? SLOTS_BY_ID : new Map(slots.map(slot => [slot.id, slot]))
  const seen = new Set<string>()
  const walk = (id: string): void => {
    for (const dependencyId of lookup.get(id)?.dependencies ?? []) {
      if (seen.has(dependencyId)) continue
      seen.add(dependencyId)
      walk(dependencyId)
    }
  }
  walk(slotId)
  return slots.filter(slot => seen.has(slot.id)).map(slot => slot.id)
}

/** Die erlaubten Minuten-Stufen (Plan §3a Nr. 8) — als Liste, nicht als Union-Cast. */
const BRAND_EFFORT_MINUTES: readonly number[] = [1, 2, 3, 5, 10]

/**
 * Die Felder einer Session, die ein MENSCH zu sehen bekommt — Info-Modal und
 * Abnahme-Seite (Plan §5a). `processing.rules` steht bewusst NICHT darin: die
 * liest nur das Modell, und die Formeln dort tragen Platzhalter in spitzen
 * Klammern.
 */
function humanReadableTexts(slot: BrandSlot): readonly (readonly [string, readonly string[]])[] {
  return [
    ['goal', [slot.goal]],
    ['quality', slot.quality],
    ['antiPatterns', slot.antiPatterns],
    ['ladder', [slot.ladder.opening, ...slot.ladder.probes, ...slot.ladder.reframes]],
    ['examples', [
      ...slot.examples.new.de, ...slot.examples.new.en,
      ...slot.examples.relaunch.de, ...slot.examples.relaunch.en,
    ]],
  ]
}

/**
 * DIE INVARIANTEN DES KATALOGS als prüfbare Funktion (statt als Prosa im
 * Test): sie nimmt eine BELIEBIGE Slot-Liste, damit der Beweis mutierte
 * Fassungen vorlegen kann — eine Prüfung, die nur die richtige Registry
 * kennt, ist immer grün und beweist nichts.
 *
 * Gibt die Befunde als Zeilen zurück, leeres Array = in Ordnung.
 */
export function validateSlotRegistry(slots: readonly BrandSlot[] = BRAND_SLOTS): readonly string[] {
  const problems: string[] = []
  const seenIds = new Set<string>()
  const position = new Map<string, number>()
  const perStepLength = new Map<BrandStepKey, number>()

  slots.forEach((slot, index) => {
    if (seenIds.has(slot.id)) problems.push(`doppelte Slot-Id: ${slot.id}`)
    seenIds.add(slot.id)
    position.set(slot.id, index)
  })

  slots.forEach((slot, index) => {
    if (!(BRAND_STEP_KEYS as readonly string[]).includes(slot.stepId)) {
      problems.push(`${slot.id}: unbekannter stepId "${slot.stepId}"`)
    }
    if (slot.questionKey !== `brand.q.${slot.id}`) {
      problems.push(`${slot.id}: questionKey folgt nicht brand.q.<id>`)
    }
    if (slot.helpKey !== null && slot.helpKey !== `brand.help.${slot.id}`) {
      problems.push(`${slot.id}: helpKey folgt nicht brand.help.<id>`)
    }
    if (slot.schema.maxLength !== slot.maxLength || slot.maxLength <= 0) {
      problems.push(`${slot.id}: schema.maxLength und maxLength laufen auseinander`)
    }
    if (slot.maxLength > BRAND_SLOT_MAX_LENGTH) {
      problems.push(`${slot.id}: maxLength ${slot.maxLength} > ${BRAND_SLOT_MAX_LENGTH} (Schema-Anhang §2)`)
    }
    if (!slot.deactivated) {
      perStepLength.set(slot.stepId, (perStepLength.get(slot.stepId) ?? 0) + slot.maxLength)
    }
    for (const dependencyId of slot.dependencies) {
      const dependencyIndex = position.get(dependencyId)
      if (dependencyIndex === undefined) {
        problems.push(`${slot.id}: Abhängigkeit "${dependencyId}" existiert nicht`)
        continue
      }
      // Rückwärts-Regel: sie ist zugleich die Zyklen-Freiheit (s. Kopf).
      if (dependencyIndex >= index) {
        problems.push(`${slot.id}: Abhängigkeit "${dependencyId}" steht nicht VOR dem Slot`)
      }
    }

    // ── Der Session-Vertrag (BW2 §3/§3a) ───────────────────────────────────
    if (slot.goal.trim().length === 0) {
      problems.push(`${slot.id}: leeres goal — jede Session braucht ein Ziel`)
    }
    if (slot.kind !== sessionKindFor(slot)) {
      problems.push(`${slot.id}: kind "${slot.kind}" passt nicht zum type "${slot.type}"`)
    }
    // `collect` ist der EINZIGE Typ mit Teilen (Plan §3).
    if (slot.kind === 'collect' && slot.parts.length === 0) {
      problems.push(`${slot.id}: kind "collect" ohne parts`)
    }
    if (slot.kind !== 'collect' && slot.parts.length > 0) {
      problems.push(`${slot.id}: parts sind nur bei kind "collect" erlaubt`)
    }
    if (slot.inputs.slots !== slot.dependencies) {
      problems.push(`${slot.id}: inputs.slots und dependencies sind nicht dieselbe Liste`)
    }
    if (slot.output.schema.kind !== slot.schema.kind || slot.output.schema.maxLength !== slot.maxLength) {
      problems.push(`${slot.id}: output.schema und schema laufen auseinander`)
    }
    if (slot.output.editor !== slot.editor || slot.output.generator !== slot.generator) {
      problems.push(`${slot.id}: output.editor/generator laufen auseinander`)
    }
    // ── Der INHALT der Session (BW2 Paket 2) ───────────────────────────────
    // Die Zahlen stehen im Plan §3a: „3–5 Qualitätskriterien, 2–3 Anti-Muster".
    // Sie sind hier eine SPANNE und keine Untergrenze, weil beides schadet: ein
    // Kriterium zu wenig macht `goalReached` zur Stimmung, zehn machen aus dem
    // Prompt eine Prüfliste, die das Modell überfliegt.
    if (slot.quality.length < 3 || slot.quality.length > 5) {
      problems.push(`${slot.id}: ${slot.quality.length} Qualitätsmerkmale — verlangt sind 3 bis 5`)
    }
    if (slot.antiPatterns.length < 2) {
      problems.push(`${slot.id}: weniger als zwei Anti-Muster`)
    }
    // Die Leiter ist die INTERVIEWFÜHRUNG — sie gehört zu den Sessions, in denen
    // ein Mensch gefragt wird, und zu keiner anderen. Eine Eröffnung an einer
    // Ableitung wäre eine Anweisung, die nie jemand ausführt.
    const asksSomeone = slot.kind === 'ask' || slot.kind === 'collect' || slot.kind === 'choose'
    if (asksSomeone && slot.ladder.opening.trim().length === 0) {
      problems.push(`${slot.id}: kind "${slot.kind}" ohne Eröffnung in der Leiter`)
    }
    if (!asksSomeone && slot.ladder.opening.trim().length > 0) {
      problems.push(`${slot.id}: kind "${slot.kind}" braucht keine Leiter — hier fragt niemand`)
    }
    // BEISPIELE SIND PFLICHT, WO GEORGE ETWAS HINLEGT (Plan §3a Nr. 3 + §5a):
    // ein Entwurf ohne Formvorbild fällt auf den Durchschnitt des Modells
    // zurück, und die Abnahme-Seite hätte an genau diesen Zeilen nichts zu
    // zeigen. Beide Pfade, beide Sprachen — ein Beispiel, das nur eine Sprache
    // hat, fehlt der Hälfte der Kundschaft.
    const drafts = slot.kind === 'derive' || slot.kind === 'draft' || slot.generator === 'candidates'
    if (drafts && !slot.deactivated) {
      for (const pathKind of ['new', 'relaunch'] as const) {
        for (const locale of ['de', 'en'] as const) {
          if (slot.examples[pathKind][locale].length === 0) {
            problems.push(`${slot.id}: kein Beispiel für Pfad "${pathKind}" in "${locale}"`)
          }
        }
      }
    }
    if (!BRAND_EFFORT_MINUTES.includes(slot.effort.minutes) || slot.effort.turns <= 0) {
      problems.push(`${slot.id}: unbrauchbarer Umfang (${slot.effort.minutes} min, ${slot.effort.turns} Züge)`)
    }
    // DIE LEITER UND IHR DECKEL DÜRFEN SICH NICHT WIDERSPRECHEN (Paket 2b,
    // Audit Teil 3 Nr. 1). Bei `maxProbes: 0` ist jede aufgeschriebene
    // Nachfrage tot — der alte Stand schrieb 14-mal die beste Frage der
    // Session auf und verbot sie im selben Atemzug.
    if (slot.answers.maxProbes < slot.ladder.probes.length) {
      problems.push(
        `${slot.id}: ${slot.ladder.probes.length} Nachfragen in der Leiter, `
        + `aber maxProbes ${slot.answers.maxProbes}`,
      )
    }
    // Und der Zug-Deckel muss die Leiter tragen: Eröffnung plus Nachfragen.
    // NUR bei `ask` und `choose`: bei `collect` zählen die Züge die TEILE
    // (a.facts fragt drei Zahlen nacheinander), bei `instrument` ist das ganze
    // Werkzeug EIN Zug — dort bedeutet die Zahl etwas anderes.
    const countsProbeTurns = slot.kind === 'ask' || slot.kind === 'choose'
    if (countsProbeTurns && slot.effort.turns < 1 + slot.answers.maxProbes) {
      problems.push(
        `${slot.id}: ${slot.effort.turns} Züge tragen keine Eröffnung `
        + `plus ${slot.answers.maxProbes} Nachfragen`,
      )
    }
    // Vier Fragefassungen je Slot (Pfad × Weiche W3) liest niemand mehr gegen.
    if (slot.teamVariant && slot.pathVariants) {
      problems.push(`${slot.id}: teamVariant und pathVariants zugleich`)
    }
    // SPITZE KLAMMERN NUR IN DEN VERARBEITUNGSREGELN (die Formeln brauchen ihre
    // Platzhalter, „We exist so that <who> …"). Alles andere hier liest ein
    // MENSCH — im Info-Modal der Session und auf der Abnahme-Seite —, und dort
    // ist eine spitze Klammer entweder HTML oder ein Rest aus einer Schablone.
    for (const [label, texts] of humanReadableTexts(slot)) {
      for (const text of texts) {
        if (/[<>]/.test(text)) problems.push(`${slot.id}: spitze Klammern in ${label}`)
      }
    }

    // Eine Invariante darf nur auf einen Slot zeigen, der VOR ihr steht —
    // sonst prüfte sie beim Bestätigen gegen einen Wert, den es noch gar
    // nicht geben kann.
    for (const invariant of slot.invariants) {
      if (invariant.of === undefined) continue
      const sourceIndex = position.get(invariant.of)
      if (sourceIndex === undefined) {
        problems.push(`${slot.id}: Invariante zeigt auf unbekannten Slot "${invariant.of}"`)
        continue
      }
      if (sourceIndex >= index) {
        problems.push(`${slot.id}: Invariante zeigt auf "${invariant.of}", der nicht VOR dem Slot steht`)
      }
    }
  })

  // Ein verwaister Inhalts-Eintrag ist ein Tippfehler in einer Id — und
  // stünde sonst als „Ziel, das nie gelesen wird" auf Dauer in der Datei.
  if (slots === BRAND_SLOTS) {
    for (const contentId of Object.keys(SESSION_CONTENT)) {
      if (!seenIds.has(contentId)) {
        problems.push(`sessionContent kennt "${contentId}", die Registry nicht`)
      }
    }
  }

  for (const stepKey of BRAND_STEP_KEYS) {
    if (!slots.some(slot => slot.stepId === stepKey && !slot.deactivated)) {
      problems.push(`Baustein "${stepKey}" hat keinen aktiven Slot`)
    }
    const stepLength = perStepLength.get(stepKey) ?? 0
    if (stepLength > BRAND_STEP_SLOTS_MAX_LENGTH) {
      problems.push(`Baustein "${stepKey}": Summe maxLength ${stepLength} > ${BRAND_STEP_SLOTS_MAX_LENGTH}`)
    }
  }

  return problems
}

/**
 * Der Stand EINES Slots, so weit die Fortschritts-Rechnung ihn braucht
 * (Vollform in `brand_steps.slots`, Schema-Anhang §2).
 */
export interface BrandSlotStateFacts {
  /** Ein Wert liegt vor — Georges Entwurf zählt schon. */
  hasValue?: boolean
  /** Der Mensch hat ihn bestätigt. */
  confirmed?: boolean
  /**
   * DER GELTENDE WERT — nur dort gesetzt, wo jemand ihn braucht (BW2 Paket 1).
   *
   * Er ist OPTIONAL und bleibt es: `toSlotFacts` füllt ihn heute nicht, und
   * alle Bestands-Aufrufer reichen weiter nur die zwei Flags. Die Folge ist
   * ausdrücklich FAIL-OPEN — ohne Wert prüft `evaluateInvariants` nichts und
   * `computeSourcesHash` rechnet mit leeren Zeichenketten. Das ist richtig
   * herum: eine Invariante, die mangels Wert zuschlägt, hielte einen Menschen
   * von seinem eigenen Feld fern, weil eine Aufrufstelle etwas nicht mitgibt.
   * Verdrahtet wird der Wert mit Paket 6 (`sourcesHash` beim Bestätigen).
   */
  value?: string
  /**
   * DER STAND DER QUELLEN BEIM BESTÄTIGEN (`computeSourcesHash`, Paket 6).
   *
   * FEHLT er, gilt die Session als AKTUELL und nie als veraltet — das ist der
   * Migrationsvertrag §3e in einer Zeile: jedes Bestands-Branding hat ihn
   * nicht, und ein Deploy, der alle 68 Felder bernstein färbt, nimmt einem
   * fertigen Kunden sein Ergebnis.
   */
  sourcesHash?: string
}

export interface BrandStepProgress {
  requiredTotal: number
  requiredFilled: number
  /** Ganzzahlige Prozent (0–100) — die Form von `brand_profiles.progressPct`. */
  pct: number
}

/**
 * DIE EHRLICHE FORTSCHRITTS-FORMEL (Plan §3b): gefüllte Pflicht-Slots ÷
 * Pflicht-Slots — nicht „Frage 12 von 40".
 *
 * GEFÜLLT ist schon der ENTWURF (`hasValue`), nicht erst die Bestätigung:
 * der Balken soll sich bewegen, wenn George etwas hinlegt. Der ABSCHLUSS
 * eines Bausteins verlangt dagegen `confirmed` (`transitionBrandStep`) — das
 * sind bewusst zwei verschiedene Fragen, und wer sie zusammenzieht, macht
 * entweder den Fortschritt träge oder den Abschluss zu billig.
 *
 * Deaktivierte Slots zählen weder oben noch unten (Migrationsvertrag), und
 * seit A4 auch kein Slot, den niemand bedienen kann (`slotIsConfirmable`):
 * ein Nenner, der sich nicht bewegen lässt, hielte den Balken für immer unter
 * 100 % — dieselbe Menge wie beim Abschluss, damit Balken und Weiche nicht
 * zwei verschiedene Dinge behaupten.
 */
export function stepProgress(
  stepKey: BrandStepKey,
  slotStates: Readonly<Record<string, BrandSlotStateFacts | undefined>>,
): BrandStepProgress {
  const required = confirmableRequiredSlotsForStep(stepKey)
  const requiredFilled = required.filter(slot => slotIsFilled(slotStates[slot.id])).length
  // Ein Baustein ohne Pflicht-Slots ist fertig, sobald man ihn betritt —
  // 0/0 als 0 % anzuzeigen wäre eine Sackgasse im Balken.
  const pct = required.length === 0 ? 100 : Math.round((requiredFilled / required.length) * 100)
  return { requiredTotal: required.length, requiredFilled, pct }
}

/** Gefüllt = Entwurf ODER Bestätigung (s. `stepProgress`). */
export function slotIsFilled(state: BrandSlotStateFacts | undefined): boolean {
  return Boolean(state && (state.hasValue || state.confirmed))
}

/**
 * Der i18n-Schlüssel der FRAGE für einen Pfad — und, wo es eine Team-Fassung
 * gibt, für die Weiche W3. Ohne Variante der Basis-Schlüssel, sonst mit
 * Suffix: die eine Stelle, die die Konventionen `brand.q.<id>.<pfad>` und
 * `brand.q.<id>.<solo|team>` kennt (s. Kopf).
 *
 * `team` ist OPTIONAL und fällt auf `'solo'` zurück: eine Aufrufstelle, die
 * die Weiche nicht kennt, bekommt die Fassung für den Einzelnen — nie einen
 * Schlüssel, den der Katalog nicht führt.
 */
export function questionKeyFor(
  slot: BrandSlot,
  pathKind: BrandPathKind,
  team: BrandTeamKind = 'solo',
): string {
  if (slot.teamVariant) return `${slot.questionKey}.${team === 'team' ? 'team' : 'solo'}`
  return slot.pathVariants?.[pathKind] ? `${slot.questionKey}.${pathKind}` : slot.questionKey
}

/**
 * Der i18n-Schlüssel der BEISPIEL-ANTWORT einer Menschenfrage — dieselbe
 * Pfad-Konvention wie `questionKeyFor`, nur unter `brand.example.<id>`. Sie
 * steht GRAU im Antwortfeld des Berater-Chats (Platzhalter, nie ein Wert):
 * eine Mustervorlage senkt die Hürde vor der leeren Zeile, ohne etwas zu
 * beantworten. Nur `type: 'question'` wird so gefragt; Auswahl-Slots haben
 * Chips statt Freitext und darum keinen Beispiel-Schlüssel.
 */
export function exampleKeyFor(slot: BrandSlot, pathKind: BrandPathKind): string {
  const base = `brand.example.${slot.id}`
  return slot.pathVariants?.[pathKind] ? `${base}.${pathKind}` : base
}

/**
 * DER i18n-SCHLÜSSEL EINES TEILS einer `collect`-Session — die dritte
 * Konvention neben `brand.q.<id>` und `brand.example.<id>`.
 *
 * ── WARUM NICHT `brand.q.<id>.<teil>` ─────────────────────────────────────
 * Weil ein verschachtelter JSON-Katalog unter EINEM Schlüssel nicht
 * gleichzeitig eine Zeichenkette und ein Kind-Objekt halten kann — dieselbe
 * Grenze, an der schon `d.gapReveal` steht (s. `tests/i18nCatalog.test.ts`).
 * `brand.q.a.facts` IST heute die Frage („Ein paar schnelle Zahlen: …"), die
 * die Werkstatt als Feld-Etikett und als Frage rendert; sie in ein Objekt zu
 * verwandeln, hiesse, an dieser Stelle wörtlich `brand.q.a.facts` in die
 * Oberfläche zu schreiben.
 *
 * Also ein eigener Namensraum, wie bei den Beispielantworten auch. Die Frage
 * bleibt die KLAMMER über den Teilen („ein paar schnelle Zahlen"), die Teile
 * sind die drei Einzelfragen, die Paket 3 nacheinander stellt.
 */
export function partKeyFor(slot: BrandSlot, part: string): string {
  return `brand.part.${slot.id}.${part}`
}

/**
 * DIE KURZE BESCHRIFTUNG EINES TEILS — `brand.partLabel.<id>.<part>` (Paket 3a).
 *
 * `partKeyFor` liefert die FRAGE („Wie viele Leute arbeiten mit — feste und
 * freie zusammen?"); der zusammengelegte Wert einer Sammel-Session braucht
 * daneben ein ETIKETT („Team"). Zwei Schlüssel und nicht einer, weil beides
 * gleichzeitig gebraucht wird: die Frage im Chat, das Etikett im gespeicherten
 * Wert — und der ist ein `structured`-Wert aus beschrifteten Blöcken
 * (`brandSlotFormat.ts`), den ein Mensch später im Dokument liest.
 *
 * Er steht in der INHALTSSPRACHE der Marke, nicht in der Sprache der Seite:
 * der Wert gehört dem Dokument, nicht der Oberfläche.
 */
export function partLabelKeyFor(slot: BrandSlot, part: string): string {
  return `brand.partLabel.${slot.id}.${part}`
}
