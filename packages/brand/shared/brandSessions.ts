import { brandGenerationHashInput } from './brandGeneration'
import {
  BRAND_SLOTS,
  type BrandInvariant,
  type BrandSessionConfig,
  type BrandSessionSubstance,
  type BrandSlotStateFacts,
  type BrandStepKey,
} from './slotRegistry'

/**
 * DIE DREI REINEN RECHNUNGEN ÜBER DEM SESSION-VERTRAG (BW2 Paket 1,
 * docs/plans/BRAND-WIZARD-SESSIONS.md §9 und §3a Nr. 6).
 *
 * PURE — kein Appwrite, kein H3, kein i18n, wie `slotRegistry.ts` und
 * `brandJourney.ts`. Dieselben Regeln laufen im Browser (Impact-Hinweis,
 * Warteschlange „neu besprechen") und auf dem Server (409 beim Bestätigen).
 *
 *  1. `sessionsAffectedBy` — die UMKEHRUNG der Abhängigkeiten. Die Registry
 *     sagt, woraus eine Session schöpft; diese Rechnung sagt, WER an ihr
 *     hängt. Ohne sie ist „diese Änderung berührt 14 bestätigte Felder" eine
 *     gepflegte Liste, und eine gepflegte Liste ist irgendwann falsch.
 *  2. `computeSourcesHash` — „veraltet" für ALLE Feldarten, nicht nur für
 *     generierte. Bis BW2 war der `inputHash` einer GENERATION die einzige
 *     Antwort darauf; ein Frage-Feld wie `c.livedExamples` hängt an `c.final`
 *     und merkte eine Änderung nie.
 *  3. `evaluateInvariants` — was ein Test prüfen kann, wird nicht der KI
 *     überlassen. Sie ist billiger, schneller und lügt nie.
 *  4. `nextCollectPart` (Paket 3a) — welcher Teil einer Sammel-Session gerade
 *     dran ist. Ebenfalls Rechnung statt Modell: der Text gehört dem Teil, der
 *     gefragt wurde.
 *
 * ── FAIL-OPEN IST HIER DIE RICHTIGE RICHTUNG ──────────────────────────────
 * Alle drei rechnen mit `BrandSlotStateFacts`, und dessen `value` ist
 * OPTIONAL (s. dort). Fehlt er, prüft `evaluateInvariants` NICHTS und
 * `computeSourcesHash` rechnet mit leeren Zeichenketten. Eine Sperre, die
 * zuschlägt, weil eine Aufrufstelle einen Wert nicht mitgibt, hielte einen
 * Menschen von seinem eigenen Feld fern — und dem 409 sähe niemand an, dass
 * er ein Verdrahtungsfehler ist.
 */

// ── 1 · Wer hängt an dieser Session? ───────────────────────────────────────

export interface BrandSessionsAffected {
  /** Sessions, deren `inputs.slots` DIREKT auf diese Id zeigen. */
  readonly direct: readonly string[]
  /**
   * Die volle Hülle: direkt UND über Zwischenschritte, in Registry-Reihenfolge.
   *
   * `direct` ist ihre Teilmenge und nicht ihr Gegenstück — die beiden Mengen
   * ÜBERLAPPEN sich zwangsläufig (`b.mission` hängt an `a.pitch` direkt UND
   * über `b.purpose`). Eine Spalte „nur indirekt" wäre deshalb keine
   * Aufteilung, sondern eine dritte Zahl, die niemand addieren kann; die
   * Anhang-A-Spalte „berührt" ist genau diese Länge hier.
   */
  readonly transitive: readonly string[]
  /** Dieselbe Hülle, gruppiert je Kapitel — leere Kapitel kommen nicht vor. */
  readonly byStep: Readonly<Partial<Record<BrandStepKey, readonly string[]>>>
}

/**
 * DIE UMKEHRUNG (§9). Deaktivierte Sessions zählen NIE mit: sie werden nicht
 * mehr gefragt, also berührt eine Korrektur sie auch nicht — sie im
 * Impact-Hinweis zu zeigen hiesse, einem Menschen Arbeit anzukündigen, die
 * niemand mehr macht.
 *
 * `sessions` ist überschreibbar, damit der Beweis eine MUTIERTE Registry
 * vorlegen kann (eine erfundene Abhängigkeit muss die Hülle vergrössern) —
 * dieselbe Begründung wie bei `dependencyClosure`/`validateSlotRegistry`.
 */
export function sessionsAffectedBy(
  sessionId: string,
  sessions: readonly BrandSessionConfig[] = BRAND_SLOTS,
): BrandSessionsAffected {
  const active = sessions.filter(session => !session.deactivated)

  const direct: string[] = []
  const hull = new Set<string>()
  const queue: string[] = [sessionId]
  const walked = new Set<string>([sessionId])

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const session of active) {
      if (!session.inputs.slots.includes(current)) continue
      if (current === sessionId) direct.push(session.id)
      if (hull.has(session.id)) continue
      hull.add(session.id)
      // `walked` terminiert AUCH bei einem versehentlichen Zyklus — die
      // Rückwärts-Regel des Katalogs schliesst ihn strukturell aus, aber ein
      // Helfer, der bei fehlerhaften Daten hängt, wäre ein Ausfall statt
      // eines roten Tests.
      if (walked.has(session.id)) continue
      walked.add(session.id)
      queue.push(session.id)
    }
  }

  const transitive = active.filter(session => hull.has(session.id)).map(session => session.id)
  const byStep: Partial<Record<BrandStepKey, string[]>> = {}
  for (const session of active) {
    if (!hull.has(session.id)) continue
    ;(byStep[session.stepId] ??= []).push(session.id)
  }

  return { direct, transitive, byStep }
}

// ── 2 · Ist dieser Stand noch der, aus dem der Wert entstand? ──────────────

/**
 * Der zweite Platz der kanonischen Zeichenkette. Bei einer GENERATION steht
 * dort die Inhaltssprache; hier ist es dieser feste Marker — dieselbe Funktion,
 * zwei Fragen, und die Hashes dürfen sich nicht zufällig treffen.
 */
export const BRAND_SOURCES_HASH_SCOPE = 'sources'

/**
 * DIE KANONISCHE ZEICHENKETTE ÜBER DEN QUELL-WERTEN einer Session (§9).
 *
 * Sie benutzt WÖRTLICH denselben Bauer wie der `inputHash` der Generationen
 * (`brandGenerationHashInput`) — inklusive seiner Trennung mit U+0000 und
 * seiner Registry-Fassung im Kopf. Eine zweite Hash-Regel wäre eine zweite
 * Antwort auf „hat sich die Quelle geändert", und die Abweichung sähe man erst
 * an einem Feld, das sich für aktuell hält.
 *
 * Der Server hasht sie wie dort mit sha256 (`brandGenerationInputHash`); die
 * interessante Aussage hängt vollständig an der Zeichenkette, und `node:crypto`
 * hat in `shared/` nichts verloren (es läge im Client-Bündel).
 *
 * REIHENFOLGE-UNABHÄNGIG gegenüber den Fakten, aber NICHT gegenüber der
 * Registry: gelaufen wird über `config.inputs.slots`, nicht über die Schlüssel
 * des Fakten-Objekts. Ein Slot ohne Fakten geht als LEERE Zeichenkette ein —
 * sonst hätten „Quelle fehlt" und „Quelle ist leer" denselben Hash, und ein
 * nachgetragener Wert bewegte ihn nicht.
 */
export function computeSourcesHash(
  config: BrandSessionConfig,
  slotFacts: Readonly<Record<string, BrandSlotStateFacts | undefined>> = {},
): string {
  return brandGenerationHashInput(
    config.id,
    BRAND_SOURCES_HASH_SCOPE,
    config.inputs.slots.map(slotId => ({ slotId, value: slotFacts[slotId]?.value ?? '' })),
  )
}

// ── 3 · Die deterministischen Prüfungen ───────────────────────────────────

export type BrandInvariantResult =
  | { readonly ok: true }
  | { readonly ok: false, readonly code: 'invariant_violated', readonly invariant: BrandInvariant }

/** Listen-Einträge eines Werts — die Form aus `brandSlotFormat.ts` (`- <eintrag>`). */
function listEntries(value: string): string[] {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => (line.startsWith('- ') ? line.slice(2).trim() : line))
    .filter(line => line.length > 0)
}

/**
 * Vergleichsform: Leerraum zusammengezogen, kleingeschrieben, Satzzeichen am
 * Ende weg. Ein Wert, der sich nur in einem Punkt unterscheidet, ist derselbe
 * Wert — und eine Invariante, die daran scheitert, hielte einen Menschen von
 * seinem eigenen Feld fern.
 */
function comparable(value: string): string {
  return value.replace(/\s+/g, ' ').trim().replace(/[.,;:!?—–-]+$/u, '').trim().toLowerCase()
}

function checkOne(
  invariant: BrandInvariant,
  value: string,
  slotFacts: Readonly<Record<string, BrandSlotStateFacts | undefined>>,
): boolean {
  const source = invariant.of === undefined ? undefined : slotFacts[invariant.of]?.value
  // FAIL-OPEN: ohne Quelle gibt es nichts zu vergleichen (s. Kopf).
  const needsSource = invariant.kind !== 'count' && invariant.kind !== 'mentionsNone'
  if (needsSource && !source?.trim()) return true

  /** Vergleichsformen der Quell-Einträge, leere weggeworfen. */
  const sourceTerms = (): string[] =>
    listEntries(source ?? '').map(comparable).filter(entry => entry.length > 0)

  switch (invariant.kind) {
    case 'count': {
      const count = listEntries(value).length
      if (invariant.min !== undefined && count < invariant.min) return false
      if (invariant.max !== undefined && count > invariant.max) return false
      return true
    }
    case 'memberOf': {
      const allowed = listEntries(source!).map(comparable)
      return allowed.includes(comparable(value))
    }
    case 'subsetOf': {
      const allowed = new Set(listEntries(source!).map(comparable))
      return listEntries(value).every(entry => allowed.has(comparable(entry)))
    }
    case 'sentenceOf': {
      // Der Wert muss WÖRTLICH im Quelltext vorkommen — der Wähler zeigt
      // dessen Zeilen, also ist alles andere eine Neuerfindung.
      return comparable(source!).includes(comparable(value))
    }
    case 'mentionsNone': {
      const haystack = comparable(value)
      // `terms` sind die FESTEN Verbote, `of` die aus einer anderen Session
      // (Paket 2b): `d.secondary` darf nicht derselbe Archetyp sein wie
      // `d.primary`, und dafür braucht es keine eigene Invarianten-Art —
      // „nennt das hier nicht" ist genau die Frage. Ohne Quelle bleibt die
      // Liste leer, die Prüfung also offen (s. Kopf).
      const terms = [
        ...(invariant.terms ?? []).map(comparable),
        ...sourceTerms(),
      ].filter(term => term.length > 0)
      return terms.every(term => !haystack.includes(term))
    }
    case 'mentionsFrom': {
      const terms = sourceTerms()
      // Eine Quelle, aus der nichts Vergleichbares übrig bleibt, prüft nichts.
      if (terms.length === 0) return true
      const haystack = comparable(value)
      const hits = terms.filter(term => haystack.includes(term)).length
      return invariant.min === undefined ? hits === terms.length : hits >= invariant.min
    }
  }
}

/**
 * ALLE INVARIANTEN EINER SESSION gegen einen Wert (§3a Nr. 6). Der ERSTE
 * Verstoss gewinnt — der Mensch soll eine Sache reparieren, nicht eine Liste.
 *
 * Ein leerer Wert ist IMMER in Ordnung: „bestätige nichts" ist die Sache der
 * Route (`required_slots_missing`), nicht die einer Formregel.
 */
export function evaluateInvariants(
  config: BrandSessionConfig,
  value: string | undefined,
  slotFacts: Readonly<Record<string, BrandSlotStateFacts | undefined>> = {},
): BrandInvariantResult {
  if (!value?.trim()) return { ok: true }
  for (const invariant of config.invariants) {
    if (!checkOne(invariant, value, slotFacts)) {
      return { ok: false, code: 'invariant_violated', invariant }
    }
  }
  return { ok: true }
}

// ── 4 · Die Sammel-Session: welcher Teil ist dran? ────────────────────────

/**
 * DER NÄCHSTE OFFENE TEIL einer `collect`-Session (BW2 §6, Paket 3a) — pur,
 * ohne KI und ohne Route.
 *
 * `collect` sammelt ihre Teile NACHEINANDER, einen je Zug (heute nur
 * `a.facts`: Teamgrösse, Alter, Märkte). Welcher gerade offen ist, ergibt sich
 * aus der REGISTRY-Reihenfolge der Teile und dem bisher Gesammelten — nicht
 * aus einer Zählung von Zügen und schon gar nicht aus einer KI-Einordnung: der
 * Text, den der Mensch schreibt, gehört dem Teil, der gerade gefragt wurde,
 * und mehr Wahrheit gibt es darüber nicht.
 *
 * `null` heisst „alle Teile beantwortet" — dann schreibt die Route den
 * strukturierten Wert und hört auf zu fragen.
 *
 * Leerraum zählt NICHT als Antwort: ein Teil, in dem nur Leerzeichen stehen,
 * ist offen. Sonst schöbe ein versehentlich leerer Zug den Fortschritt vor.
 */
export function nextCollectPart(
  config: BrandSessionConfig,
  collected: Readonly<Record<string, string | undefined>> = {},
): string | null {
  return config.parts.find(part => !collected[part]?.trim()) ?? null
}

/**
 * MINDEST-SUBSTANZ IN WÖRTERN — die drei Stufen aus `sessionContent.ts` als
 * Zahl, die im Prompt stehen kann (Plan §16).
 *
 * Die Stufen sind der Pflege-Massstab (68 Zahlen von Hand pflegt niemand); der
 * PROMPT braucht trotzdem etwas Greifbares, sonst heisst „thin" für jedes
 * Modell etwas anderes. Die Zahlen sind bewusst grob und mit „roughly"
 * eingeleitet: eine harte Grenze machte aus dem Gespräch eine Zeichenzählung.
 *
 *  short  ≈ 12  ein Halbsatz reicht (Auswahl, Bestätigung, eine Jahreszahl)
 *  medium ≈ 40  zwei bis drei Sätze — die Menschenfragen des Katalogs
 *  long   ≈ 100 eine Geschichte mit Szene (heute von keiner Session verlangt,
 *               die Stufe gibt es trotzdem, weil die Config sie kennt)
 */
export const BRAND_SUBSTANCE_MIN_WORDS: Readonly<Record<BrandSessionSubstance, number>> = {
  short: 12,
  medium: 40,
  long: 100,
}
