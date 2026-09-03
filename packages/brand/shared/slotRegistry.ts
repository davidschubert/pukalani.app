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
 *                 (`defineSlot` setzt beide aus EINER Angabe — sie können
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
 * Mechanisch `brand.q.<id>` bzw. `brand.help.<id>` — `defineSlot` baut sie,
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
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * Die Weiche W3 (Solo/Team) gatet keinen Step, sondern EINEN Slot
 * (`c.teamFilter`). Slot-Bedingungen INNERHALB eines Bausteins modelliert
 * Phase 1 nicht als Prädikat, sondern über `required: false` — sonst könnte
 * ein Solo-Branding den Baustein „Werte" nie abschliessen. Dasselbe gilt für
 * `a.toneAnalysis` (braucht vorhandene Texte, die eine neue Marke nicht hat)
 * und `result.rating` (ausdrücklich freiwillig, Katalog §11). Ein späteres
 * `appliesWhen` kann das verschärfen; ein zu strenges `required` heute wäre
 * eine Sackgasse im Produkt.
 */

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

export interface BrandSlot {
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
  /** Migrationsvertrag: nicht mehr gefragt, aber weiter lesbar. Nie löschen. */
  readonly deactivated?: true
}

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
  deactivated?: true
}

/**
 * Baut EINEN Eintrag. Die i18n-Schlüssel und `schema` entstehen aus der Id
 * bzw. aus `kind`/`maxLength` — beides kann deshalb nicht auseinanderlaufen.
 */
function defineSlot(definition: BrandSlotDefinition): BrandSlot {
  const slot: BrandSlot = {
    id: definition.id,
    stepId: definition.stepId,
    type: definition.type,
    required: definition.required,
    schema: { kind: definition.kind, maxLength: definition.maxLength },
    dependencies: definition.dependencies ?? [],
    questionKey: `brand.q.${definition.id}`,
    helpKey: definition.help ? `brand.help.${definition.id}` : null,
    editor: definition.editor,
    generator: definition.generator,
    maxLength: definition.maxLength,
    ...(definition.pathVariants ? { pathVariants: definition.pathVariants } : {}),
    ...(definition.deactivated ? { deactivated: definition.deactivated } : {}),
  }
  return slot
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
  defineSlot({ id: 'a.pitch', stepId: 'context', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'derive' }),
  defineSlot({ id: 'a.category', stepId: 'context', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'derive' }),
  defineSlot({ id: 'a.competitors', stepId: 'context', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft' }),
  defineSlot({ id: 'a.audienceSketch', stepId: 'context', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft' }),
  // Nicht Pflicht: eine neue Marke hat keine Texte, die man analysieren könnte.
  defineSlot({ id: 'a.toneAnalysis', stepId: 'context', type: 'derivation', required: false, kind: 'text', maxLength: LONG, editor: 'none', generator: 'derive' }),
  // W1 tauscht die Fassung: Ursprungsgeschichte (neu) bzw. R1–R4 (Relaunch, Katalog §2.3).
  defineSlot({ id: 'a.origin', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: LONG, editor: 'textarea', generator: 'none', pathVariants: { new: true, relaunch: true } }),
  defineSlot({ id: 'a.customerPraise', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'a.complaints', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'a.oneThing', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'a.challenge', stepId: 'context', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'a.facts', stepId: 'context', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'chips', generator: 'none' }),

  // ── B · Purpose · Vision · Mission + Positionierung (Katalog §5) — 10 ───
  // ABWEICHUNG von der Zählung „B: 8": der Katalog führt
  // `b.purpose / b.vision / b.mission` in EINER Tabellenzeile, es sind aber
  // DREI stabile Slot-Ids mit je eigenem Entwurf und eigener Konfidenz
  // (Abdeckungs-Matrix §15, Formular 02 §6/§8/§10 — drei getrennte
  // „Draft + Konfidenz"-Paare). Eine gemeinsame Id wäre im Speicher ein
  // Klumpen, den man nicht einzeln neu entwerfen kann.
  defineSlot({ id: 'b.whyStarted', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'derive', dependencies: ['a.origin'], pathVariants: { new: true, relaunch: true } }),
  defineSlot({ id: 'b.worldLoses', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'b.conviction', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'b.tenYears', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'b.legacy', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'b.purpose', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.pitch', 'b.whyStarted', 'b.worldLoses', 'b.conviction'] }),
  defineSlot({ id: 'b.vision', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.oneThing', 'b.tenYears', 'b.legacy'] }),
  defineSlot({ id: 'b.mission', stepId: 'pvm', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', help: true, dependencies: ['a.pitch', 'a.audienceSketch', 'a.oneThing', 'a.customerPraise', 'b.purpose'] }),
  defineSlot({ id: 'b.positioningCategory', stepId: 'pvm', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'derive', help: true, dependencies: ['a.pitch', 'a.category', 'a.competitors'] }),
  defineSlot({ id: 'b.positioningFirstChoice', stepId: 'pvm', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),

  // ── B2 · Markenarchitektur (Katalog §5a, nur bei W4 = ja) — 5 ───────────
  // `required: true` INNERHALB des Bausteins; ob er überhaupt läuft,
  // entscheidet die Weiche in brandJourney.ts.
  defineSlot({ id: 'b2.visibility', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSlot({ id: 'b2.roleOfMaster', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSlot({ id: 'b2.namingPattern', stepId: 'architecture', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'text', generator: 'none' }),
  defineSlot({ id: 'b2.model', stepId: 'architecture', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'cards', generator: 'derive', help: true, dependencies: ['a.category', 'b.positioningCategory', 'b2.visibility', 'b2.roleOfMaster', 'b2.namingPattern'] }),
  defineSlot({ id: 'b2.rule', stepId: 'architecture', type: 'stage-edit', required: true, kind: 'text', maxLength: SHORT, editor: 'stage', generator: 'draft', dependencies: ['b2.model', 'b2.namingPattern'] }),

  // ── C · Werte (Katalog §6) — 9 ──────────────────────────────────────────
  // ABWEICHUNG von der Zählung „C: 7": `c.discovery1–3` sind DREI Ids. Die
  // KI wählt drei aus dem Sieben-Pool (§6) — welche, steht im gefüllten
  // Slot; eine gemeinsame Id könnte nicht sagen, welche Frage beantwortet
  // wurde. Dieselbe Auflösung wie bei `e.warmup1/2`.
  defineSlot({ id: 'c.discovery1', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'c.discovery2', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'c.discovery3', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'c.candidates', stepId: 'values', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'candidates', help: true, dependencies: ['a.origin', 'a.customerPraise', 'a.complaints', 'b.conviction', 'c.discovery1', 'c.discovery2', 'c.discovery3'] }),
  defineSlot({ id: 'c.final', stepId: 'values', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'none', help: true, dependencies: ['c.candidates'] }),
  defineSlot({ id: 'c.definitions', stepId: 'values', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['c.discovery1', 'c.discovery2', 'c.discovery3', 'c.final'] }),
  defineSlot({ id: 'c.livedExamples', stepId: 'values', type: 'question', required: true, kind: 'list', maxLength: LONG, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),
  defineSlot({ id: 'c.conflictRule', stepId: 'values', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),
  // Nur die Team-Fassung stellt diese Frage (W3) — deshalb nicht Pflicht.
  defineSlot({ id: 'c.teamFilter', stepId: 'values', type: 'question', required: false, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', dependencies: ['c.final'] }),

  // ── D · Archetyp & Stimme (Katalog §7 + §12) — 12 ───────────────────────
  // ABWEICHUNG von der Zählung „D: 11": `d.primary/d.secondary` stehen im
  // Katalog in einer Zeile, sind aber zwei berechnete Werte („Der Weise ·
  // Rest Schöpfer", §12.2) und damit zwei Ids.
  defineSlot({ id: 'd.hypothesis', stepId: 'archetype', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'none', generator: 'derive', dependencies: ['a.pitch', 'a.toneAnalysis', 'a.customerPraise'] }),
  defineSlot({ id: 'd.pairs', stepId: 'archetype', type: 'special', required: true, kind: 'structured', maxLength: LONG, editor: 'cards', generator: 'none', help: true, dependencies: ['d.hypothesis'] }),
  defineSlot({ id: 'd.primary', stepId: 'archetype', type: 'derivation', required: true, kind: 'choice', maxLength: SHORT, editor: 'none', generator: 'derive', help: true, dependencies: ['d.pairs'] }),
  defineSlot({ id: 'd.secondary', stepId: 'archetype', type: 'derivation', required: true, kind: 'choice', maxLength: SHORT, editor: 'none', generator: 'derive', dependencies: ['d.pairs'] }),
  defineSlot({ id: 'd.gapReveal', stepId: 'archetype', type: 'derivation', required: true, kind: 'text', maxLength: SHORT, editor: 'none', generator: 'derive', help: true, dependencies: ['d.hypothesis', 'd.primary', 'd.secondary'], pathVariants: { relaunch: true } }),
  defineSlot({ id: 'd.party', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'd.never', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'd.admired', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'd.emotion', stepId: 'archetype', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'd.voiceSamples', stepId: 'archetype', type: 'choice', required: true, kind: 'list', maxLength: LONG, editor: 'cards', generator: 'draft', dependencies: ['c.final', 'd.primary', 'd.secondary', 'd.party', 'd.emotion'] }),
  defineSlot({ id: 'd.toneWords', stepId: 'archetype', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'derive', dependencies: ['a.toneAnalysis', 'd.primary', 'd.emotion'] }),
  // F→K: der Mensch nennt die NIE-Wörter, George ergänzt Benutzen/Meiden.
  defineSlot({ id: 'd.vocabulary', stepId: 'archetype', type: 'question', required: true, kind: 'list', maxLength: LONG, editor: 'textarea', generator: 'derive', dependencies: ['d.primary', 'd.toneWords'] }),

  // ── E · Manifest (Katalog §8) — 6 ───────────────────────────────────────
  // ABWEICHUNG von der Katalog-Auflistung: `e.compositionTone / e.length /
  // e.usage` sind hier EIN strukturierter Slot `e.composition`. Die drei
  // Chips (Ton, Länge, Verwendung) konfigurieren GEMEINSAM genau eine
  // Komposition und werden nie einzeln neu entworfen; drei Ids hiessen drei
  // inputHash-Quellen für dasselbe Ereignis.
  defineSlot({ id: 'e.warmup1', stepId: 'manifesto', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'e.warmup2', stepId: 'manifesto', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'e.statements', stepId: 'manifesto', type: 'stage-edit', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'draft', help: true, dependencies: ['b.purpose', 'b.vision', 'b.mission', 'c.final', 'c.definitions', 'd.primary', 'd.toneWords', 'e.warmup1', 'e.warmup2'] }),
  defineSlot({ id: 'e.composition', stepId: 'manifesto', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'chips', generator: 'none' }),
  // Der EINE Markdown-Slot (Plan §3e „Editor- & Inhaltsformat").
  defineSlot({ id: 'e.manifesto', stepId: 'manifesto', type: 'stage-edit', required: true, kind: 'richtext', maxLength: LONG, editor: 'stage', generator: 'draft', help: true, dependencies: ['d.toneWords', 'e.statements', 'e.composition'] }),
  defineSlot({ id: 'e.anchorLine', stepId: 'manifesto', type: 'choice', required: true, kind: 'text', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['e.manifesto'] }),

  // ── E+ · Verbale Identität (Katalog §9) — 5 ─────────────────────────────
  defineSlot({ id: 'ep.taglines', stepId: 'verbal', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'cards', generator: 'candidates', dependencies: ['b.purpose', 'b.positioningFirstChoice', 'c.final', 'd.primary', 'e.anchorLine'] }),
  defineSlot({ id: 'ep.boilerplates', stepId: 'verbal', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['a.pitch', 'b.purpose', 'b.vision', 'b.mission', 'b.positioningCategory', 'd.toneWords'] }),
  defineSlot({ id: 'ep.keyMessages', stepId: 'verbal', type: 'stage-edit', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'draft', dependencies: ['a.audienceSketch', 'b.mission', 'c.final', 'd.toneWords'] }),
  defineSlot({ id: 'ep.vocabulary', stepId: 'verbal', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'stage', generator: 'derive', dependencies: ['d.toneWords', 'd.vocabulary'] }),
  defineSlot({ id: 'ep.distinctiveAsset', stepId: 'verbal', type: 'choice', required: true, kind: 'text', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['e.anchorLine'] }),

  // ── F · Name (Katalog §10, nur per W2/Neuschnitt) — 8 ───────────────────
  defineSlot({ id: 'f.nameType', stepId: 'naming', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'none', help: true }),
  defineSlot({ id: 'f.taste', stepId: 'naming', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none', help: true }),
  defineSlot({ id: 'f.noGos', stepId: 'naming', type: 'question', required: true, kind: 'text', maxLength: SHORT, editor: 'textarea', generator: 'none' }),
  defineSlot({ id: 'f.candidates', stepId: 'naming', type: 'derivation', required: true, kind: 'list', maxLength: LONG, editor: 'cards', generator: 'candidates', dependencies: ['a.category', 'a.audienceSketch', 'a.competitors', 'b.purpose', 'c.final', 'd.primary', 'd.emotion', 'f.nameType', 'f.taste', 'f.noGos'] }),
  defineSlot({ id: 'f.shortlist', stepId: 'naming', type: 'choice', required: true, kind: 'list', maxLength: SHORT, editor: 'chips', generator: 'none', dependencies: ['f.candidates'] }),
  defineSlot({ id: 'f.checks', stepId: 'naming', type: 'derivation', required: true, kind: 'structured', maxLength: LONG, editor: 'stage', generator: 'derive', help: true, dependencies: ['f.shortlist'] }),
  defineSlot({ id: 'f.criteria', stepId: 'naming', type: 'choice', required: true, kind: 'structured', maxLength: LONG, editor: 'chips', generator: 'none', dependencies: ['f.shortlist', 'f.checks'] }),
  defineSlot({ id: 'f.decision', stepId: 'naming', type: 'choice', required: true, kind: 'structured', maxLength: SHORT, editor: 'cards', generator: 'none', dependencies: ['f.shortlist', 'f.checks', 'f.criteria'] }),

  // ── Ergebnis (Katalog §11) — 2 ──────────────────────────────────────────
  defineSlot({ id: 'result.direction', stepId: 'result', type: 'choice', required: true, kind: 'choice', maxLength: SHORT, editor: 'cards', generator: 'none', dependencies: ['d.primary', 'd.toneWords', 'e.anchorLine'] }),
  // „freiwillige Abschlussfrage" (Katalog §11) — nie Pflicht.
  defineSlot({ id: 'result.rating', stepId: 'result', type: 'choice', required: false, kind: 'choice', maxLength: SHORT, editor: 'chips', generator: 'none' }),
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
  })

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
 * Der i18n-Schlüssel der FRAGE für einen Pfad. Ohne Pfad-Variante der
 * Basis-Schlüssel, sonst mit Suffix — die eine Stelle, die die Konvention
 * `brand.q.<id>.<pfad>` kennt (s. Kopf „Pfad-Varianten").
 */
export function questionKeyFor(slot: BrandSlot, pathKind: BrandPathKind): string {
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
