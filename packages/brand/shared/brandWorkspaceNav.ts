import type {
  BrandNextSessionRef,
  BrandSessionState,
  BrandStoredStepState,
} from './brandJourney'
import { BRAND_FINDING_REASON_MIN, type BrandFindingStatus } from './brandFindings'
import { type BrandStepKey, slotById, slotsForStep } from './slotRegistry'

/**
 * DIE RECHNUNGEN DER SESSION-NAVIGATION (BW2 Paket 3c-i/3c-ii,
 * docs/archiv/BRAND-WIZARD-SESSIONS.md §5, §5a und §11).
 *
 * PURE — kein Nuxt, kein i18n, kein `$fetch`, wie `brandJourney.ts` und
 * `brandSessions.ts`. Sie beantworten die vier Fragen, die die Werkstatt beim
 * Umschalten zwischen Sessions stellt, und sie sind hier, damit ein Test sie
 * stellen kann, ohne eine 2000-Zeilen-Seite zu montieren:
 *
 *  1. `resolveActiveSession` — WELCHE Session ist gerade offen? Adresse vor
 *     Wegweiser vor erster offener.
 *  2. `countChapterSessions` — die Zähl-Zeile eines EINGEKLAPPTEN Kapitels
 *     („7 von 11 bestätigt · 2 neu besprechen").
 *  3. `chapterEffortMinutes` — der Umfang eines Kapitels („11 Sessions,
 *     ~14 Min"), Summe aus der Registry.
 *  4. `decideAutoAdvance` — DARF jetzt gewechselt werden? Der Auto-Weiter aus
 *     §5, mit allen Sperren an EINER Stelle.
 *  5. `resolveAcceptanceStage` — WAS zeigt die Finale Abnahme unter der Liste?
 *     Blocker, Frage oder „Weiter zu Kapitel …" (§5a Schritte 3 und 4).
 *  6. `restartWordMatches` — ist der Knopf „Bestätigen" im Schutz-Layer frei?
 *  7. `dismissReasonValid` — darf „Ablehnen" abschicken? (Befund-Chips, §8)
 *  8. `countOpenFindings` — wie viele Befunde berühren dieses Kapitel?
 *  9. `acceptTargets` — welches Feld kann man nach dem Annehmen anfassen?
 *
 * ── WARUM DIE ZAHLEN HIER STEHEN UND DIE SÄTZE NICHT ─────────────────────
 * Diese Datei liefert Zahlen und Schlüssel, nie fertige Sätze: „7 von 11
 * bestätigt" ist ein i18n-Text mit Platzhaltern und gehört der Oberfläche.
 * Eine pure Funktion, die Sprache zusammensetzte, wäre in der zweiten Sprache
 * falsch — und im Test grün.
 */

// ── 0 · Die eine Ansicht, die keine Session ist ───────────────────────────

/**
 * DER `?s=`-WERT DER FINALEN ABNAHME (§5a, Paket 3c-ii).
 *
 * Die Abnahme ist eine ANSICHT desselben Route-Records wie die Sessions —
 * `brand/<id>/<kapitel>?s=acceptance`. Sie braucht deshalb einen Wert in
 * derselben Query, und der darf mit keiner Slot-Id kollidieren: Slot-Ids
 * tragen alle einen Punkt (`c.discovery1`), dieser Wert nicht. Der Test nagelt
 * genau das fest — eine künftige Id ohne Punkt würde die Ansicht sonst
 * lautlos verschlucken.
 */
export const BRAND_ACCEPTANCE_VIEW = 'acceptance'

/** Steht in der Adresse die Abnahme-Ansicht statt einer Session? */
export function isAcceptanceView(requested: string | null | undefined): boolean {
  return (requested ?? '').trim() === BRAND_ACCEPTANCE_VIEW
}

// ── 1 · Welche Session ist aktiv? ─────────────────────────────────────────

/**
 * Was die Werkstatt über die Sessions ihres Kapitels weiss. Das ist ABSICHTLICH
 * weniger als `BrandSessionView`: die Wahl der aktiven Session hängt am
 * Zustand und am Vertagen, nicht an Umfang, Vertraulichkeit oder Arbeitsform.
 */
export interface BrandNavSession {
  state: BrandSessionState
  deferred?: boolean
}

export interface BrandActiveSessionInput {
  stepKey: BrandStepKey
  /** `?s=` aus der Adresse — leer, wenn niemand eine Session gewählt hat. */
  requested?: string
  /** Der Wegweiser des Servers (`generation.completed`, Abnehmen, Vertagen). */
  next?: BrandNextSessionRef | null
  /** Der Stand je Session dieses Kapitels (aus der `sessions`-Karte). */
  sessions: Readonly<Record<string, BrandNavSession | undefined>>
}

/** Betretbar heisst: nicht gesperrt. `stale` und `done` darf man wieder öffnen. */
function enterable(session: BrandNavSession | undefined): boolean {
  return session !== undefined && session.state !== 'locked'
}

/**
 * DIE AKTIVE SESSION — Adresse schlägt Wegweiser schlägt erste offene.
 *
 * ── DIE REIHENFOLGE IST EINE RANGFOLGE, KEIN GESCHMACK ───────────────────
 * 1. `?s=` — der Mensch hat geklickt (oder einen Link geöffnet, oder Zurück
 *    gedrückt). Was in der Adresse steht, gewinnt IMMER; sonst risse ein
 *    nachgeladener Wegweiser ihm die Seite unter der Hand weg.
 * 2. `next` — der Server hat gesagt, wo es weitergeht (Auto-Weiter, §5).
 * 3. Die erste OFFENE Session in Registry-Reihenfolge — der Einstieg beim
 *    ersten Betreten eines Kapitels.
 *
 * ── EINE GESPERRTE SESSION GEWINNT NIE ───────────────────────────────────
 * Auch nicht aus der Adresszeile (§5 „Betreten"): sie fällt durch und die
 * Rangfolge läuft weiter. Der Server wiese sie mit 409 `session_locked` ab —
 * ein 409 ist aber eine Auskunft an ein Programm, nicht an einen Menschen
 * (3a-Befund 3).
 *
 * ── VERTAGT WIRD ÜBERSPRUNGEN, ABER NUR EINMAL ───────────────────────────
 * „Auto-Weiter überspringt sie einmal" (§3a): eine vertagte Session ist beim
 * SUCHEN die zweite Wahl — angeklickt oder als `next` genannt wird sie
 * trotzdem geöffnet. Sind alle offenen vertagt, gewinnt die erste von ihnen:
 * eine leere Bühne wäre die schlechtere Antwort auf „ich komme darauf zurück".
 *
 * ── DIE ABNAHME-ANSICHT IST KEINE SESSION, UND DAS MUSS HIER STEHEN ──────
 * `?s=acceptance` beantwortet die Frage mit `null` — „in diesem Augenblick ist
 * KEINE Session offen". Ohne diesen Zweig fiele der Wert durch die Rangfolge
 * und die Rechnung nennte die erste offene Session: die Werkstatt lüde deren
 * Verlauf, George eröffnete sie, und all das UNTER einer Abnahme-Seite, die
 * der Mensch gerade liest. Die Ansicht selbst erkennt die Seite an
 * `isAcceptanceView` — hier steht nur, dass sie keine Session ist.
 */
export function resolveActiveSession(input: BrandActiveSessionInput): string | null {
  const requested = input.requested?.trim() ?? ''
  if (isAcceptanceView(requested)) return null
  const order = slotsForStep(input.stepKey)

  if (requested && enterable(input.sessions[requested])
    && order.some(session => session.id === requested)) {
    return requested
  }

  const next = input.next
  if (next && 'sessionKey' in next && next.stepKey === input.stepKey
    && enterable(input.sessions[next.sessionKey])
    && order.some(session => session.id === next.sessionKey)) {
    return next.sessionKey
  }

  const open = order.filter(session => input.sessions[session.id]?.state === 'open')
  const fresh = open.find(session => !input.sessions[session.id]?.deferred)
  return (fresh ?? open[0])?.id ?? null
}

// ── 2 · Die Zähl-Zeile eines eingeklappten Kapitels ───────────────────────

export interface BrandChapterSessionCounts {
  /** Bestätigt UND aktuell (`done`) — die Zahl vor dem „von". */
  confirmed: number
  /** Alle Sessions des Kapitels; die „Finale Abnahme" zählt NICHT mit (§11). */
  total: number
  /** Bestätigt, aber die Quellen haben sich bewegt — „neu besprechen". */
  stale: number
  /** Auf später vertagt — eigenes Merkzeichen, kein eigener Zähler-Teil. */
  deferred: number
}

/**
 * DER ZÄHLER JE KAPITEL (§11).
 *
 * `stale` steht NEBEN `confirmed` und nicht darin: „7 von 11 bestätigt · 2 neu
 * besprechen" sagt zwei Dinge über zwei verschiedene Mengen. Zöge man die
 * veralteten mit in die 7, verschwände genau die Arbeit aus der Zeile, auf die
 * sie hinweisen soll.
 *
 * Gezählt werden ALLE Sessions des Kapitels, nicht nur die Pflicht-Sessions:
 * die Zeile beantwortet „wie viel ist hier noch zu tun", und ein optionales
 * Feld, das jemand ausgefüllt hat, ist getane Arbeit. Fehlt eine Session in
 * der Karte (frisch geladenes Kapitel), zählt sie als offen — nie als fertig.
 */
export function countChapterSessions(
  stepKey: BrandStepKey,
  sessions: Readonly<Record<string, BrandNavSession | undefined>>,
): BrandChapterSessionCounts {
  const order = slotsForStep(stepKey)
  let confirmed = 0
  let stale = 0
  let deferred = 0
  for (const session of order) {
    const state = sessions[session.id]
    if (state?.state === 'done') confirmed += 1
    else if (state?.state === 'stale') stale += 1
    if (state?.deferred) deferred += 1
  }
  return { confirmed, total: order.length, stale, deferred }
}

/**
 * DER UMFANG EINES KAPITELS — Summe der Registry-Minuten (§3a Nr. 8).
 *
 * Aus der REGISTRY, nicht aus der Antwort: der Umfang ist eine Eigenschaft des
 * Katalogs und ändert sich nicht mit dem Fortschritt. Ein Abruf dafür wäre eine
 * Anfrage für eine Zahl, die schon im Bündel steht.
 */
export function chapterEffortMinutes(stepKey: BrandStepKey): number {
  return slotsForStep(stepKey).reduce((sum, session) => sum + session.effort.minutes, 0)
}

// ── 3 · Auto-Weiter: darf jetzt gewechselt werden? ────────────────────────

export interface BrandAutoAdvanceInput {
  /** Die Session, aus der der Auslöser kam (bestätigt, vertagt, Zug beendet). */
  from: string
  /** Was in DIESEM Augenblick offen ist — der Mensch darf überstimmt haben. */
  active: string
  /** Der Wegweiser aus der Antwort; `null` heisst „bleib, wo du bist". */
  next: BrandNextSessionRef | null
  /** Läuft gerade ein Strom (Zug oder Entwurf)? */
  streaming: boolean
  /** Steht noch eine Speicherung aus? */
  savePending: boolean
  /** Steht ein 409 offen? */
  conflict: boolean
}

export type BrandAutoAdvance =
  | { kind: 'stay' }
  | { kind: 'session', stepKey: BrandStepKey, sessionKey: string }
  /** Kapitelende — der Sprung auf die Abnahme-Seite kommt mit Paket 3c-ii. */
  | { kind: 'acceptance', stepKey: BrandStepKey }

const STAY: BrandAutoAdvance = { kind: 'stay' }

/**
 * DIE EINE ENTSCHEIDUNG „JETZT WEITER?" (§5, Entscheidung 2).
 *
 * ── VIER SPERREN, UND JEDE HAT IHREN VORFALL ─────────────────────────────
 * 1. **Der Mensch hat überstimmt.** Zwischen Auslöser und Antwort liegt ein
 *    Netz-Roundtrip; wer in dieser Zeit eine andere Session anklickt, will
 *    dorthin. Ein Sprung danach risse ihm die Seite weg — deshalb `from`
 *    UND `active`, und nicht nur „wohin".
 * 2. **Ein laufender Strom.** Ein Session-Wechsel tauscht den Verlauf aus;
 *    eine Blase, die dabei weiterschreibt, schreibt in ein fremdes Gespräch.
 * 3. **Eine ausstehende Speicherung.** Der Wechsel lädt den Baustein neu,
 *    und ein nicht ausgespülter Tastendruck liefe danach in einen 409 —
 *    dieselbe `revision`-Falle wie beim Marken-Wechsel (Audit A3).
 * 4. **Ein offener Konflikt.** Solange der Mensch nicht entschieden hat,
 *    welche Fassung gilt, wird gar nichts bewegt.
 *
 * `next` auf die EIGENE Session ist ebenfalls `stay`: der Server nennt sie,
 * solange ihr Wert noch nicht steht (ein Entwurf auf der Bühne etwa). Ein
 * „Wechsel" auf sich selbst wäre ein zweiter Eröffnungszug für dasselbe Feld.
 */
export function decideAutoAdvance(input: BrandAutoAdvanceInput): BrandAutoAdvance {
  if (input.conflict || input.streaming || input.savePending) return STAY
  if (input.from !== input.active) return STAY
  const next = input.next
  if (!next) return STAY
  if ('acceptance' in next) return { kind: 'acceptance', stepKey: next.stepKey }
  if (next.sessionKey === input.from) return STAY
  return { kind: 'session', stepKey: next.stepKey, sessionKey: next.sessionKey }
}

// ── 4 · Die Finale Abnahme: was steht unter der Liste? ────────────────────

export interface BrandAcceptanceStageInput {
  /** `acceptance.ready` — nichts mehr offen (abgenommen · aktuell · konfliktfrei). */
  ready: boolean
  /** Der GESPEICHERTE Zustand der Kapitel-Zeile. */
  storedState: BrandStoredStepState
}

export type BrandAcceptanceStage =
  /** Es steht noch etwas im Weg — die Blocker-Liste, keine Frage. */
  | 'blocked'
  /** „Passt dieses Kapitel?" mit den drei Antworten (§5a Schritt 4). */
  | 'question'
  /** Schon abgeschlossen — „Weiter zu Kapitel …". */
  | 'done'

/**
 * DIE WEICHE ERSCHEINT ERST, WENN SIE HÄLT (§5a Schritt 3).
 *
 * ── WARUM `done` VOR `ready` GEPRÜFT WIRD ────────────────────────────────
 * Ein abgeschlossenes Kapitel ist weiterhin `ready` — seine Werte sind ja
 * abgenommen. Stünde die Frage trotzdem da, liefe „Passt" in ein
 * `already_done` der Route: genau der Blindgänger, den die Bühne bis 3c-i mit
 * einer zweiten Bedingung am Klick abfangen musste (`store.currentJourneyStep
 * ?.state === 'done'`). Die Bedingung gehört in die ANZEIGE, nicht in den
 * Klick — ein Knopf, der garantiert eine Absage kassiert, ist kein Angebot.
 *
 * ── WARUM DER STAND UND NICHT DIE GERECHNETE JOURNEY ─────────────────────
 * Die Abnahme-Antwort trägt `storedState` (die Zeile selbst), nicht den
 * gerechneten Zustand. Das ist hier die richtige Quelle: gefragt ist „wurde
 * dieses Kapitel schon abgeschlossen", und das ist eine Tatsache der Zeile.
 */
export function resolveAcceptanceStage(input: BrandAcceptanceStageInput): BrandAcceptanceStage {
  if (input.storedState === 'done') return 'done'
  return input.ready ? 'question' : 'blocked'
}

/**
 * DAS GETIPPTE WORT IM SCHUTZ-LAYER (§5a Schritt 2) — Reibung gegen den
 * Fehlklick, und ausdrücklich NUR das.
 *
 * Der SERVER prüft das Wort nie; er prüft `acknowledge` und den `impactAck`.
 * Diese Rechnung entscheidet allein, ob der Knopf „Bestätigen" freigegeben
 * ist. Grosszügig, wo Grosszügigkeit nichts kostet (führende Leerzeichen,
 * Grossschreibung), streng beim Rest: ein leeres Erwartungswort gibt NIE frei
 * — sonst öffnete ein fehlender Locale-Schlüssel den löschenden Weg mit einem
 * leeren Feld.
 */
export function restartWordMatches(input: string, word: string): boolean {
  const expected = word.trim().toLowerCase()
  if (!expected) return false
  return input.trim().toLowerCase() === expected
}

// ── 5 · Der Merker für den Eröffnungszug ──────────────────────────────────

export interface BrandOpeningInput {
  sessionKey: string
  /** Sessions, die in DIESEM Besuch schon eröffnet wurden. */
  opened: ReadonlySet<string>
  /** Trägt der geladene Verlauf schon einen Zug des Beraters? */
  hasAdvisorTurn: boolean
  /** Läuft gerade ein Zug? */
  streaming: boolean
}

/**
 * BRAUCHT DIESE SESSION EINEN ERÖFFNUNGSZUG? (§6)
 *
 * Die Route ist selbst idempotent (`skipped: true`, wenn schon ein Zug des
 * Beraters existiert) — dieser Merker spart trotzdem den Weg dorthin: ohne ihn
 * schickte jedes Hin- und Herklicken zwischen zwei Sessions eine Anfrage, die
 * garantiert nichts tut. Zwei Bedingungen, weil sie verschiedene Zeiträume
 * meinen: `opened` ist DIESER Besuch, `hasAdvisorTurn` ist der gespeicherte
 * Verlauf von gestern.
 */
export function needsOpeningTurn(input: BrandOpeningInput): boolean {
  if (!input.sessionKey || input.streaming) return false
  if (input.opened.has(input.sessionKey)) return false
  return !input.hasAdvisorTurn
}

// ── 6 · Die Befund-Chips (BW2 Paket 5, §8) ────────────────────────────────

/**
 * DARF „ABLEHNEN" ABSCHICKEN? (§8 „mit Grund, eine Zeile, landet in den
 * Notizen".)
 *
 * Dieselbe Grenze wie im Zod-Schema der Route (`BRAND_FINDING_REASON_MIN`) —
 * hier, damit der Knopf zu bleibt, statt in ein 400 zu laufen. Sie ist
 * ausdrücklich KEINE Qualitätsprüfung: der Grund wird als Notiz an die
 * Quell-Session gehängt, und eine leere Notiz behauptete eine Begründung, die
 * nie gegeben wurde.
 *
 * Der SERVER bleibt der Prüfer; diese Rechnung entscheidet allein über die
 * Freigabe des Knopfes — dieselbe Arbeitsteilung wie `restartWordMatches`.
 */
export function dismissReasonValid(reason: string): boolean {
  return reason.trim().length >= BRAND_FINDING_REASON_MIN
}

/**
 * WIE VIELE BEFUNDE BERÜHREN DIESES KAPITEL? (§8, Zähler in Leiste und Log.)
 *
 * ── GEZÄHLT WIRD ÜBER DIE SLOTS, NICHT ÜBER `stepKey` ────────────────────
 * Dieselbe Regel wie in `blockingFindingSlots`: der Stempel am Befund sagt,
 * aus welchem Kapitel er STAMMT — betroffen ist aber jedes Kapitel, dessen
 * Feld beteiligt ist. Ein Konflikt zwischen B und C zählt in beiden.
 *
 * Gezählt werden BEFUNDE, nicht Felder: ein Konflikt, der zwei Felder
 * DESSELBEN Kapitels verbindet, ist EIN offener Punkt, kein zweiter Anlass.
 * Und ausdrücklich alle drei Arten — der Zähler ist eine Auskunft, keine
 * Sperre (die kennt nur `conflict`, §5a Schritt 3).
 */
export function countOpenFindings(
  findings: readonly { status: BrandFindingStatus, slots: readonly string[] }[],
  stepKey: BrandStepKey,
): number {
  const inStep = new Set(slotsForStep(stepKey).map(slot => slot.id))
  let open = 0
  for (const finding of findings) {
    if (finding.status !== 'open') continue
    if (finding.slots.some(slotId => inStep.has(slotId))) open += 1
  }
  return open
}

/**
 * WELCHES FELD KANN MAN NACH DEM ANNEHMEN ANFASSEN? (§8: „accepted ⇒ Korrektur
 * eines der Felder".)
 *
 * Ein `conflict` trägt ZWEI Felder — dann muss der Mensch wählen, und die
 * Oberfläche fragt ihn („Welches Feld anfassen?"). Ein `gap` trägt eines, dann
 * gibt es nichts zu fragen und der Sprung geht direkt. Die Zahl der Rückgaben
 * ist damit die ganze Antwort auf „braucht es eine Auswahl".
 *
 * ── UNBEKANNTE IDS FALLEN RAUS, UND ZWAR HIER ────────────────────────────
 * Die Slot-Ids eines Befunds kommen aus einer MODELL-Antwort. Der
 * Schliess-Aufruf prüft sie (`brandFindingIsUsable`), eine ältere Zeile aus
 * einer früheren Registry-Fassung kann trotzdem auf ein Feld zeigen, das es
 * nicht mehr gibt — ein Sprung dorthin landete auf einer leeren Bühne. Zu
 * wenig anzubieten ist die richtige Richtung; steht am Ende gar nichts, ist
 * der Befund nur noch Text (annehmen geht, springen nicht).
 *
 * Doppelte Ids werden zusammengefasst: zweimal dasselbe Feld ist keine Wahl.
 */
export function acceptTargets(finding: { slots: readonly string[] }): string[] {
  const seen = new Set<string>()
  const targets: string[] = []
  for (const slotId of finding.slots) {
    if (seen.has(slotId) || !slotById(slotId)) continue
    seen.add(slotId)
    targets.push(slotId)
  }
  return targets
}
