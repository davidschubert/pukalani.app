/**
 * DIE ZUSTANDSMASCHINE DES BRAND-WIZARDS — welcher Baustein ist offen, wer
 * darf hinein, was macht ein Klick daraus (Plan §3e „Serverseitige
 * Zustandsmaschine", Audit 5).
 *
 * PURE, ohne Appwrite und ohne H3 — Muster `resolveThemeSelection`. Der
 * Grund steht im Plan: „die UI erzwingt NICHTS allein". Dieselben Regeln
 * laufen im Browser (Fortschrittsleiste, gesperrte Kapitel) und auf dem
 * Server (jede `/api/brand/**`-Route), und sie sind ohne laufende Instanz
 * prüfbar. Was der Server damit verhindert: kein Überspringen gesperrter
 * Kapitel · kein Bestätigen unvollständiger Pflicht-Slots · keine
 * Manipulation von Fortschritt/Konfidenz über den Client · kein Generieren
 * für nicht freigeschaltete Steps · keine widersprüchlichen optionalen Pfade.
 *
 * ── FÜNF ZUSTÄNDE, EINER MEHR ALS IM SCHEMA ───────────────────────────────
 * `brand_steps.state` kennt vier gespeicherte Werte (locked/open/active/done,
 * Schema-Anhang §2). Hier kommt `skipped` dazu — und zwar NUR als ERGEBNIS,
 * nie als gespeicherter Wert: ob ein Baustein zum Weg gehört, entscheidet die
 * WEICHE auf dem Profil, nicht eine Spalte auf der Zeile. Stünde es in der
 * Zeile, gäbe es zwei Wahrheiten, die auseinanderlaufen können — und der
 * §3e-Vertrag „entfallene Daten werden INAKTIV, nie gelöscht" lebt genau
 * davon, dass die Zeile mit ihren Slots unangetastet liegen bleibt, während
 * die Weiche sie überspringt. Wer Naming später wieder aktiviert, findet
 * seinen Stand vor.
 *
 * ── ZWEI WEICHEN GATEN EINEN BAUSTEIN ─────────────────────────────────────
 * `architecture` läuft nur bei `subBrands === 'yes'` (W4, entschieden am Ende
 * von B). `'unknown'` ist NICHT dasselbe wie `'no'`: der Baustein ist dann
 * nicht abgewählt, sondern unbeantwortet (`junction_undecided`) — die Route
 * holt die Antwort am Ende von B ein, die pure Regel blockiert deswegen aber
 * nicht den ganzen Weg.
 *
 * `naming` läuft, wenn die Marke keinen Namen hat (W2) ODER beim
 * **Neuschnitt** ausdrücklich geöffnet wurde (`relaunchScope: 'recut'` UND
 * `namingOpted`, Katalog §2.2: „Chip, Default nein"). Der **Feinschliff**
 * friert W2 auf „Name vorhanden" ein und hat diese Öffnung bewusst nicht.
 * Ein `relaunchScope` auf dem Gründer-Pfad wird IGNORIERT statt geglaubt
 * (fail-closed gegen widersprüchliche Tatsachen) — ein `hasName: false`
 * öffnet Naming dagegen immer, auch beim Feinschliff: eine namenlose Marke
 * ohne Naming-Baustein wäre eine Sackgasse, und eine Sackgasse ist schlimmer
 * als eine überflüssige Frage.
 *
 * Die Weiche W3 (Solo/Team) gatet KEINEN Baustein — sie tauscht Fassungen und
 * schaltet den optionalen Slot `c.teamFilter` frei (Registry). Sie steht hier
 * trotzdem als Weiche, weil `applyJunctionChange` alle vier an EINER Stelle
 * beantworten soll; ihr Ergebnis ist dann eben „nichts ändert sich am Weg".
 *
 * ── EIN GESPEICHERTES `done` WIRD NICHT NEU BERECHNET ─────────────────────
 * `resolveBrandJourney` LIEST den gespeicherten Zustand und legt nur die
 * Weichen und die Freischaltung darüber. Es rechnet insbesondere ein `done`
 * NICHT gegen die heutige Registry nach — das ist der Migrationsvertrag §3e:
 * „Bestands-Brands gelten weiter als vollständig, der neue Slot erscheint als
 * offen". Ein neu hinzugekommener Pflicht-Slot taucht deshalb in
 * `missingRequired` auf, wirft den Baustein aber nicht zurück.
 * Die STRENGE Prüfung sitzt auf dem Schreibweg: `transitionBrandStep(…,
 * 'complete')` verlangt jeden Pflicht-Slot bestätigt UND eine gesetzte
 * Konfidenz. Lesen ist nachsichtig, Schreiben ist streng — die Umkehrung
 * hiesse, dass ein Katalog-Update Bestandskunden ihren Abschluss nimmt.
 *
 * ── ZURÜCK IST IMMER ERLAUBT ──────────────────────────────────────────────
 * Regel §3b.2: „vorwärts nur sequenziell, jeder ABGESCHLOSSENE Baustein
 * klickbar und änderbar". `canEnterBrandStep` lässt deshalb jeden `done`
 * hinein, auch wenn davor etwas wieder offen ist. Und `reopen` PROPAGIERT
 * NICHT: es markiert nur diesen einen Baustein. Was dadurch weiter unten
 * veraltet, sagt der inputHash (Schema-Anhang §2: „veraltet" ist ABGELEITET,
 * kein Flag) — würde `reopen` alles Nachgelagerte zurücksetzen, verlöre der
 * Mensch für eine Kommakorrektur sein halbes Ergebnis.
 */

import {
  BRAND_STEP_KEYS,
  type BrandPathKind,
  type BrandSlotEditor,
  type BrandSlotStateFacts,
  type BrandStepKey,
  type BrandStepProgress,
  requiredSlotsForStep,
  slotById,
  slotIsFilled,
  slotsForStep,
  stepProgress,
} from './slotRegistry'

/** Die drei Konfidenz-Chips (§3b.8, `brand_steps.confidence`). */
export const BRAND_CONFIDENCE_VALUES = ['fits', 'almost', 'restart'] as const
export type BrandConfidence = (typeof BRAND_CONFIDENCE_VALUES)[number]

/** Vier gespeicherte Zustände + `skipped` als reines Ergebnis (s. Kopf). */
export type BrandStepState = 'locked' | 'open' | 'active' | 'done' | 'skipped'

/** Der gespeicherte Zustand einer `brand_steps`-Zeile (ohne `skipped`). */
export type BrandStoredStepState = Exclude<BrandStepState, 'skipped'>

/** Weichen-Tatsachen vom Profil (Schema-Anhang §1). */
export interface BrandProfileFacts {
  /** W1 */
  pathKind: BrandPathKind
  /** Rebrand-Verzweigung, nur bei `pathKind: 'relaunch'` gültig. */
  relaunchScope?: 'refine' | 'recut' | null
  /** W2 */
  hasName: boolean
  /** W3 — tauscht Fassungen, gatet keinen Baustein. */
  team: 'solo' | 'team'
  /** W4 — `'unknown'` bis zum Ende von B. */
  subBrands: 'unknown' | 'yes' | 'no'
  /**
   * Der Chip „Name auf den Prüfstand?" (Katalog §2.2, Default nein). Öffnet
   * Naming beim Neuschnitt trotz vorhandenem Namen.
   */
  namingOpted?: boolean
}

/** Der gelesene Stand EINER `brand_steps`-Zeile. */
export interface BrandStepFacts {
  stepKey: BrandStepKey
  state: BrandStoredStepState
  confidence?: BrandConfidence | null
  slots?: Readonly<Record<string, BrandSlotStateFacts | undefined>>
}

/** Warum ein Baustein so dasteht — für Log, Test und den Hinweis in der Leiste. */
export type BrandStepStateReason =
  /** Erster Baustein des Weges. */
  | 'entry'
  /** Vorgänger fertig. */
  | 'unlocked'
  | 'in_progress'
  | 'completed'
  /** Vorgänger noch nicht fertig. */
  | 'awaiting_previous'
  /** Weiche abgewählt. */
  | 'junction_off'
  /** Weiche noch unbeantwortet (nur `subBrands: 'unknown'`). */
  | 'junction_undecided'

export interface BrandJourneyStep {
  stepKey: BrandStepKey
  state: BrandStepState
  reason: BrandStepStateReason
  /** Hängt dieser Baustein an einer Weiche? (architecture, naming) */
  optional: boolean
  progress: BrandStepProgress
  /** Pflicht-Slots ohne Bestätigung, in Registry-Reihenfolge. */
  missingRequired: readonly string[]
  confidence: BrandConfidence | null
}

/** Die zwei weichen-abhängigen Bausteine. */
const OPTIONAL_STEPS: readonly BrandStepKey[] = ['architecture', 'naming']

interface StepInclusion {
  included: boolean
  reason: 'junction_off' | 'junction_undecided' | null
}

/**
 * Gehört `naming` zum Weg? (s. Kopf „Zwei Weichen") — eigene Funktion, weil
 * dieselbe Frage an drei Stellen gestellt wird: Journey, Weichen-Wechsel und
 * (später) die Route, die den Chip anbietet.
 */
export function brandNamingIncluded(profile: BrandProfileFacts): boolean {
  if (!profile.hasName) return true
  if (profile.pathKind !== 'relaunch') return false
  return profile.relaunchScope === 'recut' && profile.namingOpted === true
}

function includeStep(profile: BrandProfileFacts, stepKey: BrandStepKey): StepInclusion {
  if (stepKey === 'architecture') {
    if (profile.subBrands === 'yes') return { included: true, reason: null }
    if (profile.subBrands === 'unknown') return { included: false, reason: 'junction_undecided' }
    return { included: false, reason: 'junction_off' }
  }
  if (stepKey === 'naming') {
    return brandNamingIncluded(profile)
      ? { included: true, reason: null }
      : { included: false, reason: 'junction_off' }
  }
  return { included: true, reason: null }
}

/** Die Bausteine, die dieses Profil tatsächlich durchläuft — in Reihenfolge. */
export function includedBrandSteps(profile: BrandProfileFacts): readonly BrandStepKey[] {
  return BRAND_STEP_KEYS.filter(stepKey => includeStep(profile, stepKey).included)
}

/**
 * DIE VORBEDINGUNG DES ABSCHLUSSES — eine Rechnung, zwei Leser.
 *
 * ── WARUM SIE EXPORTIERT IST ──────────────────────────────────────────────
 * Der Server verlangt zum Abschluss BESTÄTIGTE Pflicht-Slots
 * (`transitionBrandStep(…, 'complete')`). Der Browser fragte bis zum
 * 2026-09-02 etwas ANDERES, um die Konfidenz-Weiche zu zeigen: „gibt es noch
 * eine offene FRAGE?" (`resolveNextQuestion === null`). Das sind zwei
 * verschiedene Fragen — `resolveNextQuestion` sieht nur Frage- und
 * Auswahl-Slots und lässt schon einen ENTWURF gelten (`slotIsFilled`), während
 * der Abschluss jeden Pflicht-Slot BESTÄTIGT sehen will, den Entwurfs-Slot der
 * Bühne (`stage-edit`) eingeschlossen.
 *
 * Davids Live-Durchlauf hat den Unterschied sichtbar gemacht: im Baustein
 * `pvm` stand „Passt dieses Kapitel?" mit den drei Optionen, während Mission
 * noch unbestätigt war — „die fragen sind noch nicht einmal alle abgeschlossen
 * … das dürfte an der stelle ja noch überhaupt nicht gefragt werden". Eine
 * Weiche, die vor ihrer eigenen Bedingung erscheint, verspricht einen
 * Abschluss, den die Route danach mit `required_slots_missing` abweist.
 *
 * Deshalb steht die Rechnung GENAU HIER und wird an beiden Enden gelesen: die
 * Route entscheidet damit, der Chat zeigt damit die Weiche — und ein Test
 * nagelt beide aneinander. Eine zweite Formel im Markup wäre exakt der Fehler,
 * den dieser Export beendet.
 *
 * `slotsReady` ist die halbe Abschlussregel: die KONFIDENZ fehlt hier bewusst,
 * denn sie ist das, was die Weiche EINSAMMELT — sie zur Vorbedingung ihrer
 * eigenen Anzeige zu machen, wäre ein Knopf, der sich selbst versteckt.
 */
export interface BrandStepCompletion {
  /** Alle Pflicht-Slots bestätigt — die Bedingung, unter der abgeschlossen wird. */
  slotsReady: boolean
  /** Pflicht-Slots ohne Bestätigung, in Registry-Reihenfolge. */
  missingRequired: readonly string[]
  /** Bestätigte Pflicht-Slots … */
  confirmed: number
  /** … von wie vielen. Zusammen der Zähler des ruhigen Hinweises. */
  total: number
}

export function brandStepCompletion(
  stepKey: BrandStepKey,
  slots: Readonly<Record<string, BrandSlotStateFacts | undefined>> = {},
): BrandStepCompletion {
  const required = requiredSlotsForStep(stepKey)
  const missingRequired = required.filter(slot => !slots[slot.id]?.confirmed).map(slot => slot.id)
  return {
    slotsReady: missingRequired.length === 0,
    missingRequired,
    confirmed: required.length - missingRequired.length,
    total: required.length,
  }
}

/**
 * DIE GEORDNETE STEP-LISTE mit Zustand und Begründung.
 *
 * Sequenziell: ein Baustein wird `open`, wenn der Vorgänger `done` ist. Ein
 * ÜBERSPRUNGENER Baustein reicht das Weiterkommen durch — er ist kein
 * Hindernis, sondern gar nicht auf dem Weg.
 *
 * Ein gespeichertes `done` wird nie herabgestuft (s. Kopf): steht ein früherer
 * Baustein wieder offen, bleibt der spätere trotzdem fertig. `reopen`
 * propagiert nicht, und deshalb darf die Anzeige es auch nicht tun.
 */
export function resolveBrandJourney(
  profile: BrandProfileFacts,
  stepFacts: readonly BrandStepFacts[] = [],
): readonly BrandJourneyStep[] {
  const factsByStep = new Map(stepFacts.map(facts => [facts.stepKey, facts]))
  let previousDone = true
  let firstOnPath = true

  return BRAND_STEP_KEYS.map((stepKey): BrandJourneyStep => {
    const inclusion = includeStep(profile, stepKey)
    const facts = factsByStep.get(stepKey)
    const slots = facts?.slots ?? {}
    const base = {
      stepKey,
      optional: OPTIONAL_STEPS.includes(stepKey),
      progress: stepProgress(stepKey, slots),
      missingRequired: brandStepCompletion(stepKey, slots).missingRequired,
      confidence: facts?.confidence ?? null,
    }

    if (!inclusion.included) {
      // Daten bleiben liegen (§3e) — der Weg geht daran vorbei, ohne zu stocken.
      return { ...base, state: 'skipped', reason: inclusion.reason ?? 'junction_off' }
    }

    const stored = facts?.state ?? 'open'
    const wasFirst = firstOnPath
    firstOnPath = false

    if (stored === 'done') {
      // Die Sperre hängt IMMER nur am unmittelbaren Vorgänger, nie an der
      // ganzen Kette: wird ein früherer Baustein wieder geöffnet (`reopen`),
      // bleibt dieser hier fertig UND der nächste offen. Alles andere hiesse,
      // dass eine Kommakorrektur in „Kontext" den halben Weg zusperrt —
      // genau das, was „reopen propagiert nicht" ausschliesst.
      previousDone = true
      return { ...base, state: 'done', reason: 'completed' }
    }
    if (!previousDone) {
      return { ...base, state: 'locked', reason: 'awaiting_previous' }
    }
    previousDone = false
    if (stored === 'active') return { ...base, state: 'active', reason: 'in_progress' }
    return { ...base, state: 'open', reason: wasFirst ? 'entry' : 'unlocked' }
  })
}

export type BrandStepEntryDenial = 'unknown_step' | 'locked' | 'skipped'

export interface BrandStepEntryDecision {
  allowed: boolean
  reason: BrandStepEntryDenial | null
}

/**
 * DARF DIESER BAUSTEIN GEÖFFNET WERDEN? Vorwärts nur in `open`/`active`,
 * zurück in `done` IMMER (Regel §3b.2). Ein übersprungener Baustein ist
 * NICHT erreichbar — er wird über die Weiche geöffnet
 * (`applyJunctionChange`), nicht über die Adresszeile.
 */
export function canEnterBrandStep(
  journey: readonly BrandJourneyStep[],
  stepKey: string,
): BrandStepEntryDecision {
  const step = journey.find(entry => entry.stepKey === stepKey)
  if (!step) return { allowed: false, reason: 'unknown_step' }
  if (step.state === 'locked') return { allowed: false, reason: 'locked' }
  if (step.state === 'skipped') return { allowed: false, reason: 'skipped' }
  return { allowed: true, reason: null }
}

export type BrandStepAction =
  | { kind: 'start' }
  | { kind: 'confirmSlot', slotId: string }
  | { kind: 'setConfidence', confidence: BrandConfidence }
  | { kind: 'complete' }
  | { kind: 'reopen' }

export type BrandTransitionErrorCode =
  | 'step_locked'
  | 'step_skipped'
  | 'not_started'
  | 'already_done'
  | 'not_done'
  | 'unknown_slot'
  | 'slot_foreign'
  | 'invalid_confidence'
  | 'required_slots_missing'
  | 'confidence_missing'

export type BrandStepTransition =
  | { ok: true, step: BrandStepFacts, changed: boolean }
  | { ok: false, code: BrandTransitionErrorCode, missing?: readonly string[] }

/**
 * Ein Baustein, der gerade bearbeitet werden darf, ist `active`. Alles andere
 * bekommt hier seinen eigenen Ablehnungsgrund — die Route macht daraus ein
 * `data.code` (createError-Regel), nie eine Ausnahme: eine Ablehnung ist ein
 * ERGEBNIS dieser Regel, kein Programmfehler.
 */
function requireActive(step: BrandStepFacts): BrandTransitionErrorCode | null {
  switch (step.state) {
    case 'active': return null
    case 'open': return 'not_started'
    case 'locked': return 'step_locked'
    case 'done': return 'already_done'
  }
}

/**
 * DER SCHREIBWEG. Nimmt den gelesenen Stand und eine Handlung, gibt den neuen
 * Stand ODER ein Fehler-Objekt zurück (keine Exception). Mutiert nichts.
 *
 * `changed: false` sagt „richtig, aber nichts zu tun" — die Route schreibt
 * dann nicht (No-op-Regel des Schema-Anhangs §2: Speichern ohne Änderung
 * erhöht keine `revision`).
 *
 * Ein `skipped` kann hier nie ankommen: `BrandStepFacts.state` ist der
 * GESPEICHERTE Zustand, und `skipped` ist nur ein Ergebnis (s. Kopf). Die
 * Route prüft die Weiche mit `canEnterBrandStep`, bevor sie hierher kommt.
 */
export function transitionBrandStep(step: BrandStepFacts, action: BrandStepAction): BrandStepTransition {
  switch (action.kind) {
    case 'start': {
      if (step.state === 'locked') return { ok: false, code: 'step_locked' }
      if (step.state === 'done') return { ok: false, code: 'already_done' }
      if (step.state === 'active') return { ok: true, step, changed: false }
      return { ok: true, step: { ...step, state: 'active' }, changed: true }
    }

    case 'confirmSlot': {
      const denial = requireActive(step)
      if (denial) return { ok: false, code: denial }
      const slot = slotById(action.slotId)
      if (!slot || slot.deactivated) return { ok: false, code: 'unknown_slot' }
      if (slot.stepId !== step.stepKey) return { ok: false, code: 'slot_foreign' }
      const previous = step.slots?.[slot.id]
      if (previous?.confirmed) return { ok: true, step, changed: false }
      return {
        ok: true,
        changed: true,
        step: {
          ...step,
          slots: { ...step.slots, [slot.id]: { ...previous, hasValue: true, confirmed: true } },
        },
      }
    }

    case 'setConfidence': {
      const denial = requireActive(step)
      if (denial) return { ok: false, code: denial }
      // Die Konfidenz kommt vom Client — sie wird geprüft, nicht geglaubt.
      if (!BRAND_CONFIDENCE_VALUES.includes(action.confidence)) {
        return { ok: false, code: 'invalid_confidence' }
      }
      if (step.confidence === action.confidence) return { ok: true, step, changed: false }
      return { ok: true, step: { ...step, confidence: action.confidence }, changed: true }
    }

    case 'complete': {
      const denial = requireActive(step)
      if (denial) return { ok: false, code: denial }
      // DIESELBE Rechnung, die im Browser über die Weiche entscheidet — nicht
      // eine zweite Formel mit demselben Ergebnis (s. `brandStepCompletion`).
      const completion = brandStepCompletion(step.stepKey, step.slots ?? {})
      if (!completion.slotsReady) {
        return { ok: false, code: 'required_slots_missing', missing: completion.missingRequired }
      }
      if (!step.confidence) return { ok: false, code: 'confidence_missing' }
      return { ok: true, step: { ...step, state: 'done' }, changed: true }
    }

    case 'reopen': {
      if (step.state !== 'done') return { ok: false, code: 'not_done' }
      // Slots UND Konfidenz bleiben stehen: „Nochmal von vorn" ist eine
      // Vertiefungsrunde (§3b.8), kein Löschknopf. Und es propagiert nicht
      // nach unten (s. Kopf).
      return { ok: true, step: { ...step, state: 'active' }, changed: true }
    }
  }
}

export interface BrandNextQuestion {
  slotId: string
  questionKey: string
  helpKey: string | null
  type: 'question' | 'choice'
  editor: BrandSlotEditor
}

/**
 * WAS FRAGT GEORGE ALS NÄCHSTES? — Grundfassung: der erste offene
 * Pflicht-Slot vom Typ Frage oder Auswahl, in Registry-Reihenfolge.
 *
 * Ableitungen und Bühnen-Entwürfe stehen bewusst NICHT drin: die entwirft
 * George von sich aus, sie sind keine Frage an den Menschen.
 *
 * Die ADAPTIVE Wahl („die nächste Frage nach höchstem Informationswert",
 * §3b) kommt später und ersetzt genau diesen Rumpf — sie liefert denselben
 * Rückgabetyp, damit die Aufrufstellen (Chat-Zug, Prompt-Aufbau,
 * Fortschritts-Hinweis) unverändert bleiben. `null` heisst „nichts mehr zu
 * fragen": dann fehlt zum Abschluss höchstens noch die Konfidenz.
 */
export function resolveNextQuestion(
  stepKey: BrandStepKey,
  slotStates: Readonly<Record<string, BrandSlotStateFacts | undefined>> = {},
): BrandNextQuestion | null {
  const next = slotsForStep(stepKey).find(slot =>
    slot.required
    && (slot.type === 'question' || slot.type === 'choice')
    && !slotIsFilled(slotStates[slot.id]),
  )
  if (!next) return null
  return {
    slotId: next.id,
    questionKey: next.questionKey,
    helpKey: next.helpKey,
    type: next.type as 'question' | 'choice',
    editor: next.editor,
  }
}

export type BrandJunctionChange =
  | { junction: 'subBrands', value: BrandProfileFacts['subBrands'] }
  | { junction: 'hasName', value: boolean }
  | { junction: 'namingOpted', value: boolean }
  | { junction: 'relaunchScope', value: BrandProfileFacts['relaunchScope'] }
  | { junction: 'team', value: BrandProfileFacts['team'] }

export interface BrandJunctionEffect {
  /** Das Profil NACH der Änderung. */
  profile: BrandProfileFacts
  /** Bausteine, die neu auf dem Weg liegen (waren `skipped`). */
  activated: readonly BrandStepKey[]
  /** Bausteine, die vom Weg verschwinden. Ihre Daten bleiben INAKTIV (§3e). */
  deactivated: readonly BrandStepKey[]
  changed: boolean
}

/**
 * EINE WEICHE UMLEGEN — als reine Abbildung: altes Profil + Änderung ⇒ neues
 * Profil plus die Liste der Bausteine, die dadurch auf oder vom Weg gehen.
 *
 * Diese Funktion LÖSCHT NICHTS und schreibt nichts; das ist Aufgabe der
 * Route, und ihre Aufgabe ist dort ausdrücklich, NICHT zu löschen (§3e:
 * „entfallene Daten werden INAKTIV, nie gelöscht — wer Naming später wieder
 * aktiviert, findet seinen Stand vor"). Die `deactivated`-Liste ist deshalb
 * eine Ansage an die Oberfläche, keine Aufräumliste.
 *
 * `team` steht mit in der Liste, obwohl es keinen Baustein bewegt (s. Kopf):
 * eine Weiche, die man an einer anderen Stelle beantworten müsste, würde
 * irgendwann an beiden Stellen anders behandelt.
 */
export function applyJunctionChange(
  profile: BrandProfileFacts,
  change: BrandJunctionChange,
): BrandJunctionEffect {
  const before = new Set(includedBrandSteps(profile))
  const next: BrandProfileFacts = { ...profile, [change.junction]: change.value }
  const after = new Set(includedBrandSteps(next))

  const activated = BRAND_STEP_KEYS.filter(stepKey => after.has(stepKey) && !before.has(stepKey))
  const deactivated = BRAND_STEP_KEYS.filter(stepKey => before.has(stepKey) && !after.has(stepKey))

  return {
    profile: next,
    activated,
    deactivated,
    changed: profile[change.junction] !== change.value,
  }
}
