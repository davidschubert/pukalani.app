/**
 * WELCHE BEDIENELEMENTE ZEIGT EIN SLOT? — die eine Rechnung hinter der
 * Werkstatt-Bühne (Davids Live-Walkthrough, 2026-09-02).
 *
 * ── WARUM DAS EINE FUNKTION IST UND KEINE FÜNFZEHN `v-if` ─────────────────
 * Bis hierher stand die Sichtbarkeit jedes Elements als eigener Ausdruck im
 * Markup: der Bestätigungs-Knopf hier, das Hinweis-Feld dort, der Entwurfs-
 * Rahmen an dritter Stelle. Solange es nur zwei Zustände gab, ging das gut.
 * Mit dem BESTÄTIGTEN Slot kommt ein dritter dazu, und ab dann ist die Frage
 * nicht mehr „zeige ich X", sondern „welche Elemente gehören zu Zustand Y" —
 * eine Frage, die man EINMAL beantwortet und danach prüfen kann.
 *
 * Der Anlass war ein echter Befund: der Bestätigungs-Knopf wurde nach dem
 * Klick nur ausgegraut, das Feld blieb beschreibbar, und der nächste
 * Tastendruck schrieb still einen neuen `latestDraft` NEBEN die bestätigte
 * Fassung. Der Mensch sah einen Text, das Dokument trug einen anderen —
 * Davids Satz dazu: „wenn confirmed müsste es unmöglich sein zu korrigieren,
 * außer wir klicken auf einen Button Korrigieren".
 *
 * ── DER ZUSTAND IST DREIWERTIG, DIE HERKUNFT IST ES NICHT ─────────────────
 * `state` beantwortet die Frage der AMPEL: leer · ein unbestätigter Wert ·
 * bestätigt. Ob dieser Wert von George kam oder getippt wurde, ist eine ANDERE
 * Frage — sie hängt an `showDraftBadge` (Georges Handschrift, §3b.3) und darf
 * nicht in die Ampel wandern: ein selbst getippter, unbestätigter Text ist
 * genauso „offen" wie ein Entwurf, und eine Ampel, die das unterscheidet,
 * beantwortet zwei Fragen mit einer Farbe.
 *
 * ── DIE FARBEN STEHEN SCHON IM SYSTEM ─────────────────────────────────────
 * Bernstein ist `--bw-draft` (die Familie des DRAFT-BY-GEORGE-Etiketts), Grün
 * ist `--bw-accent`. Beide gibt es in Hell und Dunkel, beide haben eine
 * `-soft`-Fläche. Zwei neue semantische Variablen wären eine zweite Wahrheit
 * über dieselbe Farbe — deshalb kommen hier keine dazu.
 *
 * PURE, ohne Vue und ohne i18n: dasselbe Muster wie `brandSlotReadiness.ts`
 * und `brandJourney.ts`.
 */

/** Die Ampel eines Slots. `draft` = es steht etwas drin, aber unbestätigt. */
export type BrandSlotVisualState = 'empty' | 'draft' | 'confirmed'

export interface BrandSlotControlsInput {
  /** `brand_steps.slots[id].confirmed` trägt Text — der Mensch hat zugestimmt. */
  confirmed: boolean
  /** Steht überhaupt ein Text im Feld (lokal oder vom Server)? */
  hasValue: boolean
  /** Die Markierung aus `georgeDrafts` (§3b.3) — Herkunft, nicht Zustand. */
  isGeorgeDraft: boolean
  /** `slot.editor !== 'none'` — eine Ableitung hat kein Eingabefeld. */
  hasEditor: boolean
  /** `slot.type !== 'special'` — der Paarvergleich ist ein eigenes Instrument. */
  confirmable: boolean
  /** `slot.generator !== 'none'` — eine reine Menschenfrage entwirft niemand. */
  generatable: boolean
  /** Es gab je einen gespeicherten Text (`firstDraft`). */
  hasHistory: boolean
  /** Das Bereitschafts-Gate (`slotReadiness`) sagt: genug Material da. */
  ready: boolean
}

export interface BrandSlotControls {
  state: BrandSlotVisualState
  /** Darf getippt werden? Ein bestätigter Slot ist zu — das ist die ganze Regel. */
  editable: boolean
  /** „Entwurf von George" (Herkunft) — fällt mit der Bestätigung weg. */
  showDraftBadge: boolean
  /** „Bestätigt" (Zustand) — steht an derselben Stelle wie das Entwurfs-Etikett. */
  showConfirmedBadge: boolean
  showConfirm: boolean
  confirmEnabled: boolean
  /** „Korrigieren" — die EINZIGE Tür zurück in den offenen Zustand. */
  showRevise: boolean
  showReadinessNote: boolean
  showGenerate: boolean
  showHint: boolean
  showVersions: boolean
  /**
   * Darf eine frühere Fassung ZURÜCKGEHOLT werden? Auf einem bestätigten Slot
   * nicht: das Wiederherstellen schreibt eine gewöhnliche lokale Eingabe, und
   * die weist der Server jetzt mit `slot_confirmed` ab. Ein Knopf, der einen
   * Konflikt erzeugt, den der Mensch nicht ausgelöst hat, ist schlechter als
   * ein sichtbar abgeschalteter — die LISTE bleibt deshalb lesbar, nur die
   * Übernahme ruht bis „Korrigieren".
   */
  canRestoreVersion: boolean
  /**
   * Zählt dieser Slot in den Kapitel-Balken? Nur, was der Mensch überhaupt
   * bestätigen KANN — eine Ableitung ohne Feld wäre ein Nenner, den niemand
   * bewegen kann, und der Balken bliebe für immer unter 100 %.
   */
  countsForProgress: boolean
}

/**
 * DIE ZUSTANDS-ENTSCHEIDUNG. Bestätigt schlägt alles: kein Tippen, kein
 * Entwerfen, kein Hinweis, kein Wiederherstellen — nur „Korrigieren".
 *
 * Umgekehrt ist der offene Zustand exakt das bisherige Verhalten; wer diese
 * Funktion mit `confirmed: false` füttert, bekommt die Werkstatt von vorher.
 */
export function brandSlotControls(input: BrandSlotControlsInput): BrandSlotControls {
  const countsForProgress = input.confirmable && input.hasEditor
  const showVersions = input.generatable && input.hasHistory

  if (input.confirmed) {
    return {
      state: 'confirmed',
      editable: false,
      // Die Bestätigung ist die Übernahme: ab hier ist es SEIN Text, auch wenn
      // George ihn geschrieben hat. Beide Etiketten nebeneinander behaupteten
      // zwei Dinge gleichzeitig.
      showDraftBadge: false,
      showConfirmedBadge: true,
      showConfirm: countsForProgress,
      confirmEnabled: false,
      showRevise: countsForProgress,
      // Was fehlt, um zu entwerfen, ist gegenstandslos, solange nicht entworfen
      // werden darf.
      showReadinessNote: false,
      showGenerate: false,
      showHint: false,
      showVersions,
      canRestoreVersion: false,
      countsForProgress,
    }
  }

  return {
    state: input.hasValue ? 'draft' : 'empty',
    editable: input.hasEditor,
    showDraftBadge: input.isGeorgeDraft,
    showConfirmedBadge: false,
    showConfirm: countsForProgress,
    // Einen leeren Slot zu bestätigen lehnt die Route mit `slot_empty` ab —
    // der Knopf sagt es vorher.
    confirmEnabled: input.hasValue,
    showRevise: false,
    // Entweder steht da, WAS fehlt, oder es stehen die Werkzeuge da. Beides
    // nebeneinander wäre ein Knopf neben seiner eigenen Absage.
    showReadinessNote: input.generatable && !input.ready,
    showGenerate: input.generatable && input.ready,
    showHint: input.generatable && input.ready,
    showVersions,
    canRestoreVersion: true,
    countsForProgress,
  }
}

/** Der Balken EINES Kapitels: bestätigte Entscheidungen von allen möglichen. */
export interface BrandChapterProgress {
  confirmed: number
  total: number
  pct: number
}

/**
 * DER KAPITEL-BALKEN IST NICHT DER GESAMT-BALKEN (zwei Balken, zwei Fragen).
 *
 * Unten in der Leiste steht der Weg durch das ganze Branding; hier steht „wie
 * weit bin ich in DIESEM Kapitel". Gezählt wird deshalb ausschliesslich, was
 * auf dieser Seite sichtbar ist — inklusive der optionalen Slots, denn der
 * Mensch sieht sie und würde einen Balken nicht verstehen, der sie
 * unterschlägt (`stepProgress` zählt bewusst nur die PFLICHT-Slots und
 * beantwortet damit die andere Frage: „darf ich abschliessen").
 */
export function brandChapterProgress(
  controls: readonly BrandSlotControls[],
): BrandChapterProgress {
  const relevant = controls.filter(entry => entry.countsForProgress)
  const confirmed = relevant.filter(entry => entry.state === 'confirmed').length
  return {
    confirmed,
    total: relevant.length,
    pct: relevant.length === 0 ? 0 : Math.round((confirmed / relevant.length) * 100),
  }
}
