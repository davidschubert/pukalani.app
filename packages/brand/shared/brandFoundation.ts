import { brandListEntries } from './brandSessions'
import { isBrandSlotShareable } from './brandSharing'
import { type BrandSlotValueView, brandSlotValueView } from './brandSlotFormat'
import { type BrandPathKind, type BrandStepKey, type BrandTeamKind, slotById } from './slotRegistry'

/**
 * DER RENDERER DER BRAND FOUNDATION (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.1/§2.2, Paket G1).
 *
 * EINE Quelle, EIN Renderer, ZWEI Ansichten: `/brand/:id/foundation` (privat,
 * Live-Werte) und `/brand/share/:token` (öffentlich, eingefrorener Snapshot)
 * rufen DIESE Funktion. Ein Unterschied zwischen beiden Ansichten ist damit
 * ein Testfall und kein Zufall — deshalb ist die Eingabe wörtlich die Form des
 * `BrandShareSnapshot` und nicht eine bequemere.
 *
 * PUR wie `brandDocument.ts`: kein Appwrite, kein H3, kein i18n. Alles, was
 * ÜBERSETZT werden muss, reist als SCHLÜSSEL (`labelKey`, `titleKey`,
 * `columnKeys`) oder als stabile Id (`element`, `optionIds`) — nie als
 * deutscher Satz. Der Grund ist nicht Reinheit, sondern eine Tatsache des
 * Produkts: die Inhaltssprache der Marke und die Sprache des Handbuchs sind
 * verschieden (die Tagline steht auf Englisch, die Kapitelüberschrift auf
 * Deutsch), und nur die Oberfläche kennt die zweite.
 *
 * ── WAS HIER NIE ERSCHEINT (§2.3/§2.8) ────────────────────────────────────
 * Gefiltert wird nach der REGISTRY, nicht nach dem Inhalt der Eingabe:
 * `isBrandSlotShareable` (= `sessionTravels`, öffentlich UND Festlegung) ist
 * das EINE Tor, durch das jeder Wert muss, bevor irgendein Block ihn sieht.
 * Das ist die Hälfte des Doppelnetzes aus §2.8 — die andere sitzt beim
 * SCHREIBEN in `share.post.ts`. Beide Netze sind nötig, weil jeder heute
 * bestehende Snapshot ALLE bestätigten Werte enthält, Wettbewerber-Namen und
 * Beschwerden eingeschlossen: ein Renderer, der dem Snapshot glaubte, zeigte
 * sie beim ersten Aufruf eines alten Links.
 *
 * ── DIE FORM IST DER ABGENOMMENE KLICKDUMMY ───────────────────────────────
 * Block-Arten und Feldnamen folgen `.playground/app/utils/demoFoundation.ts`
 * (Phase 3, von David gesehen), damit Paket G2 die Komponente `FdChapter.vue`
 * übernehmen kann statt sie nachzubauen. DREI bewusste Abweichungen, jede mit
 * Grund:
 *  1. `label`/`title`/`note` heissen `labelKey`/`titleKey`/`noteKey` — s. o.
 *  2. Der gesperrte Block trägt nur seine Id (`element`); Überschrift, Satz
 *     und Produktname stehen im Locale-Katalog unter
 *     `brand.foundation.visual.<element>`. Fünf deutsche Sätze im Renderer
 *     wären fünf Sätze, die auf der englischen Seite deutsch blieben.
 *  3. NEU ist die Art `choice`: Archetyp und Architektur-Modell sind
 *     GESPEICHERTE Ids (`sage`, `branded-house`). Sie als Text aufzulösen
 *     hiesse, sie in der INHALTSsprache der Marke aufzulösen — der Leser
 *     liest aber in seiner eigenen. Also reisen die Ids, und die Oberfläche
 *     löst sie auf (`brandChoiceDisplayLabel` bzw. `brand.choice.*`).
 *
 * ── WAS NICHT PARSBAR IST, WIRD NICHT VERWORFEN ───────────────────────────
 * Ein Wert kann formfremd sein (ein Mensch hat im Textfeld nachgebessert, ein
 * Bestandswert stammt aus der Zeit vor der Formregel — s. Kopf von
 * `brandSlotFormat.ts`). Dann steht er als `text`-Block da. Ein Handbuch, das
 * eine bestätigte Festlegung verschweigt, weil ihr ein Bindestrich fehlt,
 * wäre schlimmer als eines mit einer ungeordneten Zeile.
 */

// ── Die Blöcke ──────────────────────────────────────────────────────────────

/** Die fünf Elemente der visuellen Schranke (§2.5) — Ids, keine Texte. */
export const BRAND_FOUNDATION_VISUAL_ELEMENTS = ['logo', 'color', 'typography', 'imagery', 'motion'] as const
export type BrandFoundationVisualElement = (typeof BRAND_FOUNDATION_VISUAL_ELEMENTS)[number]

/** Ein Block ist die kleinste Darstellungs-Einheit eines Kapitels. */
export type BrandFoundationBlock =
  /** EIN Leitsatz, gross gesetzt (Pitch, Purpose, Tagline, Zeile für die Wand). */
  | { kind: 'lead', text: string, labelKey?: string }
  /**
   * Fliesstext mit optionaler Beschriftung.
   *
   * `markdown` steht NUR an einem Wert, dessen Slot in der Registry
   * `kind: 'richtext'` trägt — heute genau `e.manifesto` (Paket G2). Die
   * Oberfläche schickt einen so markierten Absatz durch den Subset-Parser aus
   * `core/shared/markdown.ts` (vnode-Ausgabe, kein `v-html`, sichere Ziele),
   * jeden anderen als wörtlichen Text. Das Flag ist die einzige Stelle, an der
   * die Herkunft eines Absatzes noch ablesbar ist: nach dem Bauen sind alle
   * Blöcke gleich, und ein Renderer, der ALLES als Markdown läse, machte aus
   * dem Sternchen in einer Tagline eine Kursivierung.
   */
  | { kind: 'text', text: string, labelKey?: string, markdown?: true }
  /** Aufzählung. */
  | { kind: 'list', labelKey?: string, items: string[] }
  /** Karten: Zielgruppen-Segmente, Werte, Boilerplates, Kernbotschaften. */
  | { kind: 'cards', labelKey?: string, items: { title: string, text: string, note?: string }[] }
  /**
   * Ton-Wörter als Chips — je Wort EINE Stimmprobe darunter (§2.2 Kapitel 6).
   * `sample` ist LEER, wo es keine gibt: eine erfundene Probe wäre eine
   * Behauptung darüber, wie die Marke klingt.
   */
  | { kind: 'chips', labelKey?: string, items: { word: string, sample: string }[] }
  /**
   * Do & Don't als Paare (§2.4). Bei ungleich langen Seiten bleibt die andere
   * Hälfte LEER — ein Paar zu erfinden hiesse, der Marke ein Wort in den Mund
   * zu legen, das sie nie gesagt hat.
   */
  | { kind: 'dodont', labelKey?: string, pairs: { doText: string, dontText: string }[] }
  /** Tabelle — die Spaltenköpfe sind Schlüssel, die Zellen sind Markenwerte. */
  | { kind: 'table', labelKey?: string, columnKeys: string[], rows: string[][] }
  /** Gespeicherte Auswahl-Ids (Archetyp, Architektur-Modell) — s. Kopf Nr. 3. */
  | { kind: 'choice', labelKey?: string, slotId: string, optionIds: string[] }
  /** Die sichtbare Schranke (§2.5) — Texte im Katalog, hier nur die Id. */
  | { kind: 'locked', element: BrandFoundationVisualElement }
  /**
   * Farbrampe der gewählten Richtung. G1 erzeugt sie NIE: `result.direction`
   * ist `audience: 'internal'`, bis Paket G4 den Richtungen-Katalog und die
   * Preset-Tokens mitbringt. Die Art steht schon hier, damit die Oberfläche
   * dieselbe Union kennt wie der Klickdummy.
   */
  | { kind: 'swatches', labelKey?: string, items: { hex: string, name: string, role: string }[] }
  /**
   * Der FESTE Rahmen der KI-Regeln (§2.4): „Schreibt in diesem Ton · Vermeidet
   * · Steht für" — gefüllt aus vorhandenen Werten. Keine Generierung, kein
   * Cache; das Kapitel ist so aktuell wie die Werte darüber.
   */
  | { kind: 'aiRules', tone: string[], avoid: string[], stands: string[] }

// ── Die Kapitel ─────────────────────────────────────────────────────────────

/**
 * DIE REIHENFOLGE DER KAPITEL (§2.2) — die Id ist zugleich die Sprungmarke
 * (`#stimme`), und die trägt auch im geteilten Link (§1.5). Sie sind deshalb
 * so unveränderlich wie eine Slot-Id: ein verschickter Tieflink darf nicht
 * ins Leere zeigen.
 */
export const BRAND_FOUNDATION_CHAPTER_IDS = [
  'story',
  'kontext',
  'purpose',
  'positionierung',
  'architektur',
  'werte',
  'stimme',
  'manifest',
  'messaging',
  'name',
  'visuell',
  'ki-texte',
] as const
export type BrandFoundationChapterId = (typeof BRAND_FOUNDATION_CHAPTER_IDS)[number]

export interface BrandFoundationChapter {
  readonly id: BrandFoundationChapterId
  /** Stabile Sprungmarke — heute identisch mit der Id (s. o.). */
  readonly anchor: string
  readonly titleKey: string
  /**
   * `locked` = die Schranke (§2.5). `pending` erzeugt G1 NICHT: ob ein Kapitel
   * abgenommen ist, weiss nur die private Ansicht (der Snapshot enthält
   * ohnehin nur Bestätigtes) — sie darf den Zustand setzen, der Renderer
   * kennt die Frage nicht.
   */
  readonly state: 'done' | 'pending' | 'locked'
  readonly blocks: readonly BrandFoundationBlock[]
}

export interface BrandFoundationView {
  readonly chapters: readonly BrandFoundationChapter[]
}

/**
 * WELCHES KAPITEL DER WERKSTATT FÜLLT WELCHES KAPITEL DES HANDBUCHS (G2).
 *
 * Die private Ansicht darf sagen „noch nicht abgenommen" (§2.6) — dafür muss
 * sie ein Handbuch-Kapitel auf die Kapitel zurückrechnen, in denen abgenommen
 * WIRD. Der Renderer selbst kann das nicht: er kennt die Abnahme nicht (s.
 * `state` oben), und nach dem Bauen steht an keinem Block mehr, aus welcher
 * Session er kam.
 *
 * GEPFLEGT, nicht gerechnet: eine Ableitung aus den Slot-Ids im Renderer wäre
 * eine zweite Wahrheit, die bei jedem neuen Block still veraltet. Der Test
 * nagelt dafür fest, dass JEDE Kapitel-Id einen Eintrag hat und jeder Eintrag
 * ein echtes Kapitel nennt.
 *
 * ZWEI LEERE EINTRÄGE, beide mit Grund: `story` hängt am Profil (Georges
 * Synthese, sie wird nicht abgenommen), und `visuell` ist die Schranke — sie
 * kann nicht offen sein, weil es dort nichts zu bestätigen gibt.
 */
export const BRAND_FOUNDATION_SOURCE_STEPS: Readonly<
  Record<BrandFoundationChapterId, readonly BrandStepKey[]>
> = {
  story: [],
  kontext: ['context'],
  purpose: ['pvm'],
  positionierung: ['pvm'],
  architektur: ['architecture'],
  werte: ['values'],
  // Ton-Wörter und Stimmproben stehen in `archetype`, der Wort-Leitfaden
  // (`ep.vocabulary`, die Do-Seite) in `verbal`.
  stimme: ['archetype', 'verbal'],
  manifest: ['manifesto'],
  messaging: ['verbal'],
  name: ['naming'],
  visuell: [],
  // Der KI-Rahmen ist eine Zusammenfassung dreier Kapitel — solange eines
  // davon offen ist, kann sich sein Inhalt noch ändern.
  'ki-texte': ['values', 'archetype', 'verbal'],
}

/**
 * DAS ERSTE QUELL-KAPITEL, DAS NOCH NICHT ABGENOMMEN IST — `null`, wenn alle
 * stehen. Es ist zugleich das Sprungziel des Vermerks „Zur Abnahme" (§2.6).
 *
 * Übergeben werden die Kapitel DIESES Brandings; ein Quell-Kapitel, das nicht
 * darin vorkommt, liegt nicht auf dem Weg (übersprungenes Naming) und zählt
 * deshalb NICHT als offen — seine Werte fehlen dem Renderer ohnehin, das
 * Handbuch-Kapitel entfällt dann ganz.
 */
export function brandFoundationPendingStep(
  chapterId: BrandFoundationChapterId,
  steps: readonly { readonly stepKey: BrandStepKey, readonly accepted: boolean }[],
): BrandStepKey | null {
  for (const stepKey of BRAND_FOUNDATION_SOURCE_STEPS[chapterId]) {
    const step = steps.find(candidate => candidate.stepKey === stepKey)
    if (step && !step.accepted) return stepKey
  }
  return null
}

/**
 * Die Eingabe ist die Form des `BrandShareSnapshot` (shared/types/brand.ts) —
 * ein Snapshot passt ohne Umformung hinein, die private Ansicht baut dieselbe
 * Form aus den Live-Werten.
 */
export interface BrandFoundationInput {
  readonly title: string
  readonly contentLocale: string
  /** Georges Synthese; `null`/leer ⇒ Kapitel 0 entfällt (nichts wird erzeugt). */
  readonly story: string | null
  readonly chapters: readonly {
    readonly stepKey: BrandStepKey
    readonly slots: readonly { readonly slotId: string, readonly value: string }[]
  }[]
  /**
   * Die beiden Weichen reisen mit, WEIL sie zur Marke gehören — gelesen wird
   * heute keine von beiden: kein Kapitel formuliert je nach Pfad anders. Sie
   * stehen hier, damit ein Kapitel, das das später täte, die Signatur nicht
   * ändern muss.
   */
  readonly pathKind?: BrandPathKind
  readonly team?: BrandTeamKind
}

// ── Schlüssel-Konventionen ──────────────────────────────────────────────────

const LABEL = 'brand.foundation.label'
const COLUMN = 'brand.foundation.column'

function chapterTitleKey(id: BrandFoundationChapterId): string {
  return `brand.foundation.chapter.${id}`
}

// ── Werte lesen ─────────────────────────────────────────────────────────────

/**
 * DAS EINE TOR. Nur reisefähige, nicht leere Werte kommen dahinter — jeder
 * Block-Bauer unten sieht ausschliesslich diese Karte, und keiner von ihnen
 * kann die Frage „darf das hier stehen?" noch einmal falsch beantworten.
 *
 * Der stepKey der Eingabe wird bewusst NICHT geprüft: welchem Kapitel ein
 * Wert gehört, sagt die Registry (`slotById`), nicht die Zeile, in der er
 * eingefroren wurde.
 */
function travellingValues(input: BrandFoundationInput): Map<string, string> {
  const values = new Map<string, string>()
  for (const chapter of input.chapters) {
    for (const slot of chapter.slots) {
      if (!isBrandSlotShareable(slot.slotId)) continue
      const value = slot.value.trim()
      if (value.length === 0) continue
      values.set(slot.slotId, value)
    }
  }
  return values
}

/** Die Lese-Form eines Wertes nach seiner Art — `null`, wenn es ihn nicht gibt. */
function viewOf(values: Map<string, string>, slotId: string): BrandSlotValueView | null {
  const value = values.get(slotId)
  if (value === undefined) return null
  const kind = slotById(slotId)?.schema.kind ?? 'text'
  return brandSlotValueView(kind, value)
}

/** Der rohe Wert — für alles, was als ein Stück Text stehen bleibt. */
function textOf(values: Map<string, string>, slotId: string): string | null {
  return values.get(slotId) ?? null
}

/**
 * Führendes Aufzählungszeichen weg. Dieselbe Zeichenmenge wie
 * `stripListMarker` in `brandSessions.ts` — die ist dort nicht exportiert, und
 * ein Export nur für diesen Fall zöge eine zweite öffentliche Zusage nach
 * sich.
 */
const LIST_MARKER = /^(?:[-–—*•·]\s+|\d{1,2}[.)]\s+)/u

/**
 * EINTRÄGE EINER SATZ-LISTE (gelebte Beispiele, Definitionen, Stimmproben,
 * Namen): eine ZEILE ist ein Eintrag, mehr nicht.
 *
 * Bewusst NICHT `brandListEntries`: das schneidet eine EINZELNE Zeile
 * zusätzlich an Kommas — richtig für „Geduld, Klarheit und Ruhe", falsch für
 * „im März haben wir ein Angebot abgelehnt, und zwar öffentlich". Hier zählt
 * die zweite Sorte.
 */
function sentenceEntries(view: BrandSlotValueView | null): string[] {
  if (!view) return []
  if (view.kind === 'list') return view.items.filter(item => item.length > 0)
  if (view.kind === 'blocks') return view.blocks.map(block => block.body).filter(body => body.length > 0)
  return view.text
    .split('\n')
    .map(line => line.trim().replace(LIST_MARKER, '').trim())
    .filter(line => line.length > 0)
}

/**
 * EINTRÄGE EINER WORT-LISTE (Werte, Ton-Wörter): hier ist die tolerante
 * Lesart des Layers richtig — „Geduld, Unbestechlichkeit und Klarheit" in
 * EINE Zeile getippt sind drei Werte, und genau so tippt ein Mensch in ein
 * Chips-Feld (s. Kopf von `brandListEntries`).
 */
function wordEntries(view: BrandSlotValueView | null, raw: string | null): string[] {
  if (view?.kind === 'list') return view.items.filter(item => item.length > 0)
  return raw ? brandListEntries(raw) : []
}

/** „Wort — Bedeutung" auseinandernehmen. `null`, wenn die Zeile kein Paar ist. */
function splitLabelled(entry: string): { label: string, body: string } | null {
  const match = entry.match(/^(.{1,60}?)\s*(?:—|–|:|\s-\s)\s*(.+)$/su)
  if (!match) return null
  const label = match[1]!.trim()
  const body = match[2]!.trim()
  if (label.length === 0 || body.length === 0) return null
  return { label, body }
}

/** Vergleichsform eines Wertwortes — Gross/Klein und Schlusspunkt zählen nicht. */
function comparable(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?]+$/u, '')
}

// ── Der Wort-Leitfaden (§2.4) ───────────────────────────────────────────────

interface VocabularySides {
  use: string[]
  avoid: string[]
  /** Zeilen ohne Seiten-Marke — sie gehen nie verloren (s. Kopf). */
  rest: string[]
}

/**
 * Die beiden Seiten des Wort-Leitfadens. Die Form steht in der Session-Regel
 * von `d.vocabulary`/`ep.vocabulary`: „- use: <Wort>" bzw. „- avoid: <Wort>",
 * auf Deutsch „- benutzen:" / „- meiden:".
 *
 * BEIDE Sessions tragen BEIDE Seiten — `ep.vocabulary` ist die aus
 * `d.vocabulary` abgeleitete Alltagsfassung. Die Zuordnung „ep = Do, d =
 * Don't" aus dem Konzept beschreibt die WIRKUNG, nicht das Speicherformat;
 * gelesen wird deshalb, was dasteht.
 */
const VOCABULARY_USE = /^(?:use|benutzen|nutzen|verwenden)\s*:\s*/iu
const VOCABULARY_AVOID = /^(?:avoid|meiden|vermeiden|nie|never)\s*:\s*/iu

function vocabularySides(view: BrandSlotValueView | null): VocabularySides {
  const sides: VocabularySides = { use: [], avoid: [], rest: [] }
  for (const entry of sentenceEntries(view)) {
    if (VOCABULARY_USE.test(entry)) sides.use.push(entry.replace(VOCABULARY_USE, '').trim())
    else if (VOCABULARY_AVOID.test(entry)) sides.avoid.push(entry.replace(VOCABULARY_AVOID, '').trim())
    else sides.rest.push(entry)
  }
  return sides
}

/** Zweite Liste anhängen, ohne Dubletten — der Leitfaden leitet aus dem Tabu ab. */
function mergeWords(first: readonly string[], second: readonly string[]): string[] {
  const seen = new Set(first.map(comparable))
  const merged = [...first]
  for (const word of second) {
    if (seen.has(comparable(word))) continue
    seen.add(comparable(word))
    merged.push(word)
  }
  return merged
}

// ── Kleine Block-Bauer ──────────────────────────────────────────────────────

function leadBlock(text: string | null, labelKey: string): BrandFoundationBlock[] {
  return text ? [{ kind: 'lead', text, labelKey }] : []
}

function textBlock(text: string | null, labelKey: string): BrandFoundationBlock[] {
  return text ? [{ kind: 'text', text, labelKey }] : []
}

/**
 * Beschriftete Blöcke werden Karten (Zielgruppen, Boilerplates,
 * Kernbotschaften). Hält der Wert die Form nicht ein, steht er als EIN
 * Textblock da — nie gar nicht.
 */
function blocksAsCards(
  view: BrandSlotValueView | null,
  labelKey: string,
): BrandFoundationBlock[] {
  if (!view) return []
  if (view.kind === 'text') return textBlock(view.text, labelKey)
  if (view.kind === 'list') return [{ kind: 'list', labelKey, items: view.items }]
  return [{
    kind: 'cards',
    labelKey,
    items: view.blocks.map(block => ({ title: block.label, text: block.body })),
  }]
}

/** Dieselbe Form als Tabelle (Namens-Prüfung, Kriterien). */
function blocksAsTable(
  view: BrandSlotValueView | null,
  labelKey: string,
  columnKeys: readonly string[],
): BrandFoundationBlock[] {
  if (!view) return []
  if (view.kind === 'text') return textBlock(view.text, labelKey)
  if (view.kind === 'list') return [{ kind: 'list', labelKey, items: view.items }]
  return [{
    kind: 'table',
    labelKey,
    columnKeys: [...columnKeys],
    rows: view.blocks.map(block => [block.label, block.body]),
  }]
}

/** Auswahl-Ids eines Slots — leer, wenn der Wert fehlt (s. Kopf Nr. 3). */
function choiceBlock(
  values: Map<string, string>,
  labelKey: string,
  slotIds: readonly string[],
): BrandFoundationBlock[] {
  const primary = slotIds[0]
  if (primary === undefined) return []
  const optionIds = slotIds.map(slotId => values.get(slotId)).filter((value): value is string => Boolean(value))
  if (optionIds.length === 0) return []
  return [{ kind: 'choice', labelKey, slotId: primary, optionIds }]
}

// ── Die Kapitel-Bauer ───────────────────────────────────────────────────────

/**
 * Kapitel 0 — die Brand Story. Der erste Absatz trägt als Leitsatz, der Rest
 * ist Fliesstext; ohne Story entfällt das Kapitel (§2.2: „kein Erzeugen beim
 * Lesen").
 */
function storyBlocks(story: string | null): BrandFoundationBlock[] {
  const paragraphs = (story ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(part => part.length > 0)
  if (paragraphs.length === 0) return []
  const [first, ...rest] = paragraphs
  return [
    { kind: 'lead', text: first! },
    ...rest.map((text): BrandFoundationBlock => ({ kind: 'text', text })),
  ]
}

/** Kapitel 5 — je Wert Definition und gelebtes Beispiel (§2.2). */
function valueBlocks(values: Map<string, string>): BrandFoundationBlock[] {
  const chosen = wordEntries(viewOf(values, 'c.final'), textOf(values, 'c.final'))
  const definitions = sentenceEntries(viewOf(values, 'c.definitions'))
  const examples = sentenceEntries(viewOf(values, 'c.livedExamples'))

  const byWord = (entries: readonly string[]): Map<string, string> => {
    const map = new Map<string, string>()
    for (const entry of entries) {
      const pair = splitLabelled(entry)
      if (pair) map.set(comparable(pair.label), pair.body)
    }
    return map
  }
  const definitionOf = byWord(definitions)
  const exampleOf = byWord(examples)
  const usedDefinitions = new Set<string>()
  const usedExamples = new Set<string>()

  const cards = chosen.map((word) => {
    const key = comparable(word)
    const definition = definitionOf.get(key)
    const example = exampleOf.get(key)
    if (definition !== undefined) usedDefinitions.add(key)
    if (example !== undefined) usedExamples.add(key)
    return { title: word, text: definition ?? '', ...(example ? { note: example } : {}) }
  })

  const blocks: BrandFoundationBlock[] = []
  if (cards.length > 0) blocks.push({ kind: 'cards', labelKey: `${LABEL}.values`, items: cards })

  // WAS SICH NICHT ZUORDNEN LIESS, BLEIBT SICHTBAR: eine Definition zu einem
  // Wort, das nicht in der Endauswahl steht (oder eine Zeile ohne Bindestrich),
  // ist eine bestätigte Festlegung — sie verschwindet nicht, nur weil die
  // Zuordnung nicht aufging.
  const leftover = (entries: readonly string[], used: Set<string>): string[] =>
    entries.filter((entry) => {
      const pair = splitLabelled(entry)
      return !pair || !used.has(comparable(pair.label))
    })

  const restDefinitions = cards.length > 0 ? leftover(definitions, usedDefinitions) : definitions
  const restExamples = cards.length > 0 ? leftover(examples, usedExamples) : examples
  if (restDefinitions.length > 0) {
    blocks.push({ kind: 'list', labelKey: `${LABEL}.definitions`, items: restDefinitions })
  }
  if (restExamples.length > 0) {
    blocks.push({ kind: 'list', labelKey: `${LABEL}.livedExamples`, items: restExamples })
  }

  blocks.push(...textBlock(textOf(values, 'c.conflictRule'), `${LABEL}.conflictRule`))
  blocks.push(...textBlock(textOf(values, 'c.teamFilter'), `${LABEL}.teamFilter`))
  return blocks
}

/** Kapitel 6 — Archetyp, Ton-Wörter mit Probe, Do & Don't (§2.2/§2.4). */
function voiceBlocks(values: Map<string, string>, guide: VocabularySides): BrandFoundationBlock[] {
  const blocks: BrandFoundationBlock[] = []
  blocks.push(...choiceBlock(values, `${LABEL}.archetype`, ['d.primary', 'd.secondary']))
  blocks.push(...textBlock(textOf(values, 'd.emotion'), `${LABEL}.emotion`))

  const toneWords = wordEntries(viewOf(values, 'd.toneWords'), textOf(values, 'd.toneWords'))
  const samples = sentenceEntries(viewOf(values, 'd.voiceSamples'))
  if (toneWords.length > 0) {
    blocks.push({
      kind: 'chips',
      labelKey: `${LABEL}.toneWords`,
      items: toneWords.map((word, index) => ({ word, sample: samples[index] ?? '' })),
    })
  }
  // Mehr Proben als Ton-Wörter: die übrigen stehen für sich. Eine Probe ist
  // ein bestätigter Satz der Marke — sie fällt nicht weg, weil die Chip-Reihe
  // kürzer ist.
  const restSamples = toneWords.length > 0 ? samples.slice(toneWords.length) : samples
  if (restSamples.length > 0) {
    blocks.push({ kind: 'list', labelKey: `${LABEL}.voiceSamples`, items: restSamples })
  }

  const pairCount = Math.max(guide.use.length, guide.avoid.length)
  if (pairCount > 0) {
    blocks.push({
      kind: 'dodont',
      labelKey: `${LABEL}.doDont`,
      pairs: Array.from({ length: pairCount }, (_unused, index) => ({
        doText: guide.use[index] ?? '',
        dontText: guide.avoid[index] ?? '',
      })),
    })
  }
  if (guide.rest.length > 0) {
    blocks.push({ kind: 'list', labelKey: `${LABEL}.vocabulary`, items: guide.rest })
  }
  return blocks
}

/** Kapitel 9 — Top drei und die Prüf-Tabelle (§2.2). */
function nameBlocks(values: Map<string, string>): BrandFoundationBlock[] {
  const blocks: BrandFoundationBlock[] = []
  const decision = viewOf(values, 'f.decision')
  if (decision) {
    if (decision.kind === 'blocks') {
      blocks.push(...blocksAsTable(decision, `${LABEL}.nameDecision`, [`${COLUMN}.name`, `${COLUMN}.note`]))
    }
    else {
      const names = sentenceEntries(decision)
      // Die Reihenfolge IST die Aussage („Erstwahl zuerst", Session-Ziel von
      // `f.decision`) — deshalb eine Tabelle mit Rang und nicht eine Liste.
      if (names.length > 0) {
        blocks.push({
          kind: 'table',
          labelKey: `${LABEL}.nameDecision`,
          columnKeys: [`${COLUMN}.rank`, `${COLUMN}.name`],
          rows: names.map((name, index) => [String(index + 1), name]),
        })
      }
    }
  }
  blocks.push(...blocksAsTable(
    viewOf(values, 'f.checks'),
    `${LABEL}.nameChecks`,
    [`${COLUMN}.name`, `${COLUMN}.check`],
  ))
  blocks.push(...blocksAsTable(
    viewOf(values, 'f.criteria'),
    `${LABEL}.nameCriteria`,
    [`${COLUMN}.name`, `${COLUMN}.criteria`],
  ))
  return blocks
}

/** Kapitel 8 — Tagline, Boilerplates, Kernbotschaften (§2.2). */
function messagingBlocks(values: Map<string, string>): BrandFoundationBlock[] {
  const blocks: BrandFoundationBlock[] = []
  const taglines = sentenceEntries(viewOf(values, 'ep.taglines'))
  if (taglines.length === 1) blocks.push({ kind: 'lead', text: taglines[0]!, labelKey: `${LABEL}.tagline` })
  else if (taglines.length > 1) blocks.push({ kind: 'list', labelKey: `${LABEL}.tagline`, items: taglines })

  blocks.push(...blocksAsCards(viewOf(values, 'ep.boilerplates'), `${LABEL}.boilerplates`))
  blocks.push(...blocksAsCards(viewOf(values, 'ep.keyMessages'), `${LABEL}.keyMessages`))
  blocks.push(...textBlock(textOf(values, 'ep.distinctiveAsset'), `${LABEL}.distinctiveAsset`))
  return blocks
}

/** Kapitel 7 — Manifest als Fliesstext, Zeile für die Wand hervorgehoben. */
function manifestoBlocks(values: Map<string, string>): BrandFoundationBlock[] {
  const manifesto = textOf(values, 'e.manifesto')
  const blocks: BrandFoundationBlock[] = (manifesto ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(part => part.length > 0)
    // `e.manifesto` ist der EINZIGE `richtext`-Slot der Registry (s. Flag am
    // `text`-Block) — nur seine Absätze reisen als Markdown.
    .map((text): BrandFoundationBlock => ({ kind: 'text', text, markdown: true }))
  blocks.push(...leadBlock(textOf(values, 'e.anchorLine'), `${LABEL}.anchorLine`))
  blocks.push(...textBlock(textOf(values, 'e.composition'), `${LABEL}.composition`))
  return blocks
}

/** Kapitel 10 — die Schranke. Sie steht IMMER (§2.5), auch ohne einen Wert. */
function visualBlocks(): BrandFoundationBlock[] {
  return BRAND_FOUNDATION_VISUAL_ELEMENTS.map((element): BrandFoundationBlock => ({ kind: 'locked', element }))
}

// ── Die Regel ───────────────────────────────────────────────────────────────

/**
 * DIE FOUNDATION AUS BESTÄTIGTEN WERTEN (§2.2).
 *
 * Ein Kapitel ohne einen einzigen Block entfällt OHNE LÜCKE — die
 * Markenarchitektur eines Brandings ohne Untermarken, das Namens-Kapitel einer
 * Marke, die ihren Namen behält. Zwei Ausnahmen, beide begründet: Kapitel 10
 * steht immer (die Schranke IST der Inhalt), und Kapitel 11 steht, sobald es
 * eine seiner Quellen gibt.
 */
export function buildBrandFoundation(input: BrandFoundationInput): BrandFoundationView {
  const values = travellingValues(input)
  const guide = ((): VocabularySides => {
    const everyday = vocabularySides(viewOf(values, 'ep.vocabulary'))
    const source = vocabularySides(viewOf(values, 'd.vocabulary'))
    return {
      use: mergeWords(everyday.use, source.use),
      avoid: mergeWords(everyday.avoid, source.avoid),
      rest: mergeWords(everyday.rest, source.rest),
    }
  })()
  const toneWords = wordEntries(viewOf(values, 'd.toneWords'), textOf(values, 'd.toneWords'))
  const brandValues = wordEntries(viewOf(values, 'c.final'), textOf(values, 'c.final'))

  // Das Kapitel steht, sobald es EINE seiner Quellen gibt (§2.2 Kapitel 11) —
  // gefragt wird nach dem SLOT, nicht nach dem Parse-Ergebnis: ein Wort-
  // Leitfaden ohne Seiten-Marken ist trotzdem eine Festlegung, und ein Rahmen
  // mit zwei von drei Zeilen ist brauchbarer als gar keiner.
  const hasAiSource = ['d.toneWords', 'd.vocabulary', 'ep.vocabulary', 'c.final']
    .some(slotId => values.has(slotId))
  const aiRules: BrandFoundationBlock[] = hasAiSource
    ? [{ kind: 'aiRules', tone: toneWords, avoid: guide.avoid, stands: brandValues }]
    : []

  const draft: { id: BrandFoundationChapterId, blocks: BrandFoundationBlock[], state?: 'locked' }[] = [
    { id: 'story', blocks: storyBlocks(input.story) },
    {
      id: 'kontext',
      blocks: [
        ...leadBlock(textOf(values, 'a.pitch'), `${LABEL}.pitch`),
        ...textBlock(textOf(values, 'a.category'), `${LABEL}.category`),
        ...blocksAsCards(viewOf(values, 'a.audienceSketch'), `${LABEL}.audience`),
      ],
    },
    {
      id: 'purpose',
      blocks: [
        ...leadBlock(textOf(values, 'b.purpose'), `${LABEL}.purpose`),
        ...textBlock(textOf(values, 'b.vision'), `${LABEL}.vision`),
        ...textBlock(textOf(values, 'b.mission'), `${LABEL}.mission`),
      ],
    },
    {
      id: 'positionierung',
      blocks: [
        ...textBlock(textOf(values, 'b.positioningCategory'), `${LABEL}.positioningCategory`),
        ...leadBlock(textOf(values, 'b.positioningFirstChoice'), `${LABEL}.firstChoice`),
      ],
    },
    {
      id: 'architektur',
      blocks: [
        ...choiceBlock(values, `${LABEL}.model`, ['b2.model']),
        ...textBlock(textOf(values, 'b2.rule'), `${LABEL}.namingRule`),
      ],
    },
    { id: 'werte', blocks: valueBlocks(values) },
    { id: 'stimme', blocks: voiceBlocks(values, guide) },
    { id: 'manifest', blocks: manifestoBlocks(values) },
    { id: 'messaging', blocks: messagingBlocks(values) },
    { id: 'name', blocks: nameBlocks(values) },
    { id: 'visuell', blocks: visualBlocks(), state: 'locked' },
    { id: 'ki-texte', blocks: aiRules },
  ]

  return {
    chapters: draft
      .filter(chapter => chapter.blocks.length > 0)
      .map(chapter => ({
        id: chapter.id,
        anchor: chapter.id,
        titleKey: chapterTitleKey(chapter.id),
        state: chapter.state ?? 'done',
        blocks: chapter.blocks,
      })),
  }
}
