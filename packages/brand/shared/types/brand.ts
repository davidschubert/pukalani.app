/**
 * DIE ANTWORT-TYPEN VON `/api/brand/**` — an BEIDEN Enden verlangt.
 *
 * Nitros Routen-Typisierung ist im Repo AUS (CLAUDE.md, TS2589-Strukturfix):
 * `$fetch('/api/brand/…')` liefert `unknown`. Jede Route annotiert deshalb
 * ihren Rückgabetyp aus dieser Datei, und jede Aufrufstelle nennt ihn erneut
 * (`$fetch<BrandProfileListResponse>(…)`). Diese Datei ist der Ort, an dem
 * beide Enden sich treffen — sie ist PURE (keine Appwrite-Typen, kein H3), weil
 * sie im Browser genauso gelesen wird wie im Server.
 *
 * DIE SPEICHERFORM STEHT NICHT HIER. `brand_steps.slots` ist eine
 * MEDIUMTEXT-JSON-Spalte; ihr Inhalt reist als `BrandSlotView` nach draußen —
 * dieselben Felder, aber als GELESENE Form: der Server normalisiert (fehlende
 * Felder werden `null`, unbekannte Slot-Ids fliegen raus), damit der Client nie
 * raten muss, ob ein Feld fehlt oder leer ist.
 *
 * WAS BEWUSST NICHT NACH DRAUSSEN GEHT: Generations-INHALTE (nur Metadaten,
 * Schema-Anhang §2), rohe Share-Token (genau EINMAL, in der Antwort des
 * Veröffentlichens) und der Grund einer Zugangs-Ablehnung (die Routen
 * antworten 404 — Datentür).
 */

import type { BrandGenerationOutcome } from '../brandGeneration'
import type {
  BrandFinding,
  BrandFindingKind,
  BrandFindingStatus,
  BrandReviewStage,
} from '../brandFindings'
import type {
  BrandAcceptanceBlocker,
  BrandConfidence,
  BrandJourneyStep,
  BrandNextSessionRef,
  BrandSessionState,
  BrandStepAcceptance,
  BrandStepState,
  BrandStoredStepState,
} from '../brandJourney'
import type {
  BrandPathKind,
  BrandSessionEffort,
  BrandSessionKind,
  BrandSessionSensitivity,
  BrandStepKey,
  BrandStepProgress,
} from '../slotRegistry'

/** Wem ein Profil gehört (Phase 1 aktiviert nur `user`). */
export type BrandOwnerTypeValue = 'user' | 'community'

/** Die Weiche W4 — `unknown` ist ein echter Zustand, kein fehlender Wert. */
export type BrandSubBrands = 'unknown' | 'yes' | 'no'

/** Die Weiche W3 — deklariert neben `BrandPathKind` in der Registry (s. dort). */
export type { BrandTeamKind } from '../slotRegistry'

/** Rebrand-Verzweigung; `null` auf dem Gründer-Pfad. */
export type BrandRelaunchScope = 'refine' | 'recut'

/**
 * DIE STARTKARTE (Content-Spec §2.1) — die vier Angaben aus Schritt 0, und
 * ausdrücklich nicht mehr („Mehr erhebt Schritt 0 NICHT").
 *
 * Sie ist KEIN Slot: sie steht am Profil (`brand_profiles`, Migration
 * brand-009), nicht in `brand_steps.slots`. Genau deshalb haben die Slots des
 * Bausteins A in der Registry keine `dependencies` — sie schöpfen aus dieser
 * Karte, und die reist über den Generator-Vertrag mit, nicht über die
 * Abhängigkeitsliste.
 *
 * ALLE VIER FELDER SIND ZEICHENKETTEN, NIE `null` oder `undefined`: '' heisst
 * „nicht beantwortet". Eine Bestands-Zeile von vor brand-009 liest genau das,
 * und ein Leser muss nicht zwischen drei Arten von „leer" unterscheiden.
 */
export interface BrandStartCard {
  /** Optional (§2.1) — leer oder eine http(s)-Adresse. */
  websiteUrl: string
  industry: string
  /** „Was ihr macht" — zwei bis drei Sätze. */
  about: string
  /** „Für wen" — ein Satz. */
  audience: string
}

/**
 * WAS VON DER URL-ANALYSE NACH DRAUSSEN GEHT (P2.3) — drei Angaben ÜBER den
 * Fund, nie der Fund selbst.
 *
 * Der gelesene Text bleibt am Server (`brand_profiles.siteAnalysis`): der
 * Client braucht ihn nicht — er zeigt „gelesen am …" und einen Knopf. Ihn
 * mitzuschicken hiesse, 20.000 Zeichen fremden Text in jede Profil-Antwort zu
 * legen, samt allem, was auf dieser fremden Seite stand.
 *
 * `analyzedAt` ist '' , solange nie gelesen wurde — dieselbe Konvention wie in
 * der Startkarte: '' heisst „nicht beantwortet", nicht `null`.
 */
export interface BrandSiteAnalysisView {
  /** Welche Adresse der Zwischenspeicher beschreibt ('' = keiner da). */
  url: string
  /** ISO-Zeitpunkt des Lesens, '' = nie. */
  analyzedAt: string
  /** Wie viel Text dabei herauskam — die einzige Auskunft über den Umfang. */
  textLength: number
  /** Die Startkarte nennt heute eine ANDERE Adresse (`siteAnalysisIsStale`). */
  stale: boolean
}

/**
 * Der KOPF eines Brandings, so wie ihn Liste und Detailseite brauchen.
 * `progressPct`/`currentStepKey` sind DENORM-Cache (Schema-Anhang §1) — die
 * Autorität sind die Slots, und die Journey rechnet sie im Detail neu.
 */
export interface BrandProfileSummary {
  id: string
  title: string
  contentLocale: string
  ownerType: BrandOwnerTypeValue
  ownerId: string
  pathKind: BrandPathKind
  relaunchScope: BrandRelaunchScope | null
  hasName: boolean
  namingOpted: boolean
  team: BrandTeamKind
  subBrands: BrandSubBrands
  /** Schritt 0 (§2.1). Owner-Daten — der öffentliche Share-Blick sieht sie nie. */
  startCard: BrandStartCard
  /** Stand der URL-Analyse (P2.3) — Metadaten, nie der gelesene Text. */
  siteAnalysis: BrandSiteAnalysisView
  progressPct: number
  currentStepKey: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  /** Abgeleitet aus `brand_shares` — es gibt bewusst kein `visibility`-Feld. */
  hasActiveShare: boolean
}

export interface BrandProfileListResponse {
  profiles: BrandProfileSummary[]
}

/** Die Brand Story am Profil. `stale` ist ABGELEITET, kein gespeichertes Flag. */
export interface BrandStoryView {
  body: string
  generatedAt: string | null
  editedByUser: boolean
  inputHash: string
}

/** Kurzform einer `brand_steps`-Zeile für die Detailantwort. */
export interface BrandStepSummary {
  stepKey: BrandStepKey
  /** Der GESPEICHERTE Zustand. Was gilt, sagt `journey` (dort auch `skipped`). */
  storedState: BrandStoredStepState
  revision: number
  confidence: BrandConfidence | null
  startedAt: string | null
  completedAt: string | null
  activeSeconds: number
}

export interface BrandProfileDetailResponse {
  profile: BrandProfileSummary
  story: BrandStoryView
  /** Die Zustandsmaschine, serverseitig gerechnet (`resolveBrandJourney`). */
  journey: BrandJourneyStep[]
  steps: BrandStepSummary[]
}

/**
 * Nach einer WEICHEN-Änderung: dieselbe Detail-Antwort plus die Bausteine, die
 * dadurch auf oder vom Weg gehen. Die Oberfläche braucht das, um zu sagen „das
 * Kapitel Naming ist jetzt dabei" — die Daten der abgewählten bleiben liegen
 * (§3e), `deactivated` ist also eine ANSAGE, keine Aufräumliste.
 */
export interface BrandProfilePatchResponse extends BrandProfileDetailResponse {
  activated: BrandStepKey[]
  deactivated: BrandStepKey[]
}

/**
 * Antwort der URL-Analyse (`POST /api/brand/profiles/:id/analyze`).
 *
 * DER VOLLTEXT FEHLT HIER ABSICHTLICH: er ist Georges Material, nicht das des
 * Browsers. Was der Mensch sehen soll, ist der BELEG, dass gelesen wurde —
 * Titel und Beschreibung sagen ihm in einer Zeile, ob die richtige Seite
 * erwischt wurde, und `textLength` sagt, ob überhaupt etwas dranstand.
 */
export interface BrandSiteAnalyzeResponse {
  analyzed: true
  title: string
  description: string
  textLength: number
  analyzedAt: string
}

export interface BrandProfileDeleteResponse {
  deleted: true
  /** Was die Kaskade wirklich entfernt hat — für Log und Beweis. */
  removed: { steps: number, messages: number, shares: number, events: number, findings: number }
}

/**
 * Der VERSIONS-VERTRAG eines Slots (Audit 2): erster Entwurf, letzter Entwurf
 * und die bestätigte Fassung stehen NEBENEINANDER — aus ihnen entstehen die
 * zwei beschlossenen Übernahmequoten. Ein einzelnes draft/final könnte sie
 * nach einer Regeneration nicht mehr rechnen.
 */
export interface BrandSlotView {
  firstDraft: string | null
  latestDraft: string | null
  confirmed: string | null
  confidence: BrandConfidence | null
  updatedAt: string | null
}

/** Metadaten EINER Generierung — nie ihr Inhalt (Log-Regel Plan §6). */
export interface BrandGenerationMeta {
  generationId: string
  /** Für WELCHEN Slot — ohne ihn wäre die Historie eines Bausteins nicht auftrennbar. */
  slotId: string
  schemaVersion: number
  promptVersion: string
  model: string
  provider: string
  locale: string
  inputHash: string
  createdAt: string
  /** §3e-Idempotenzschlüssel des Auslösers, sofern einer mitkam. */
  idempotencyKey?: string
  /**
   * `'question'`, wenn dieser Lauf NACHGEFRAGT statt entworfen hat (george-a-4).
   * Fehlt bei jedem Eintrag von vorher und bei jedem Entwurf — der Leser liest
   * „fehlt" als `'draft'`, sonst hätte ein Bestands-Eintrag rückwirkend eine
   * Aussage, die niemand getroffen hat.
   */
  outcome?: BrandGenerationOutcome
}

/**
 * DER GESPEICHERTE EINTRAG — Metadaten PLUS Entwurf.
 *
 * Der Schema-Anhang §2 listet unter `generations` nur Metadaten; der Anhang sagt
 * an derselben Stelle aber auch, die Historie „bewahrt Zwischenstände", und das
 * können Metadaten nicht leisten: `model` und `inputHash` bringen keine Fassung
 * zurück. Deshalb trägt der Eintrag den erzeugten TEXT — die letzten zehn
 * behalten ihn, ältere fliegen raus (`packBrandGenerations`), und beim
 * Spalten-Deckel werden die ÄLTESTEN Entwürfe zuerst geleert.
 *
 * Das widerspricht der Log-Regel NICHT: die verbietet Inhalt in LOGS und in
 * `brand_events`, nicht in der Zeile, deren Inhalt es ohnehin ist (derselbe Text
 * steht als `latestDraft` im Slot nebenan).
 */
export interface BrandGenerationEntry extends BrandGenerationMeta {
  /** Fehlt bei Einträgen, deren Entwurf dem Spalten-Deckel gewichen ist. */
  draft?: string
}

export interface BrandGenerationsView {
  /** Die letzten ~10 Generierungen — in der Detailantwort OHNE `draft`. */
  items: BrandGenerationEntry[]
  /** Gesamtzahl — auch die, die aus `items` herausgefallen sind. */
  count: number
}

/**
 * Antwort der Fassungs-Wiederherstellung: dieselben Einträge, aber MIT `draft`
 * — plus der `firstDraft` des Slots als „Erste Fassung". Sie hat keinen
 * Generations-Eintrag (sie kann auch vom Menschen stammen) und reist deshalb
 * als eigenes Feld.
 */
export interface BrandGenerationVersionsResponse {
  slotId: string
  items: BrandGenerationEntry[]
  count: number
  firstDraft: string | null
  latestDraft: string | null
}

/**
 * WOHIN DIESES FELD SPÄTER FLIESST (Plan §3a, „mechanisch, ohne Text") — die
 * transitive Hülle aus `sessionsAffectedBy`, auf zwei Zahlen und die Kapitel
 * eingedampft.
 *
 * Die LISTE der berührten Felder steht bewusst NICHT drin: sie wäre bis zu 29
 * Ids lang, der Mensch bekommt „fliesst später in Mission, Manifest und
 * Taglines" zu lesen, und wer die Einzelfelder braucht (der Impact-Hinweis,
 * Paket 6), rechnet dieselbe pure Funktion im Browser.
 */
export interface BrandSessionAffects {
  /** Wie viele bestätigbare Sessions daran hängen — 0 heisst „nichts". */
  count: number
  /** In welchen Kapiteln, in Registry-Reihenfolge. */
  steps: BrandStepKey[]
}

/**
 * DER STAND EINER SESSION, wie ihn die Werkstatt liest (Plan §5).
 *
 * `accepted` und `deferred` sind in Paket 3a IMMER `undefined`: die
 * Abnahme-Seite und das Vertagen sind Paket 3b, und ein hier erfundenes
 * `false` behauptete eine Entscheidung, die niemand getroffen hat. Sie stehen
 * trotzdem schon im Vertrag, damit die Oberfläche (3c) gegen die endgültige
 * Form gebaut wird.
 */
export interface BrandSessionView {
  state: BrandSessionState
  /** Die Arbeitsform (`ask`/`collect`/`choose`/`derive`/`draft`/`instrument`). */
  kind: BrandSessionKind
  /** Was der Mensch vorher über den Umfang erfährt („~3 Min"). */
  effort: BrandSessionEffort
  /** Was per Share-Link und Export standardmässig nicht reist. */
  sensitivity: BrandSessionSensitivity
  affects: BrandSessionAffects
  /**
   * Im Kapitel-Zusammenhang abgenommen (§5a). IMMER gesetzt, auch als `false`:
   * ein fehlendes Feld hiesse für den Leser „unbekannt", und die Abnahme-Seite
   * hat keinen dritten Zustand.
   */
  accepted: boolean
  /** Auf später vertagt (§3a `answers.allowDefer`). Ebenfalls immer gesetzt. */
  deferred: boolean
  /**
   * Der Schliess-Aufruf ist gelaufen (§7). `false` heisst „fail-soft
   * ausgefallen" — der Prüfblick (§10) holt genau diese Sessions nach.
   */
  reviewed: boolean
  /**
   * Die Notizen des Schliess-Aufrufs (§4), als EIN Text mit Zeilenumbrüchen.
   * NUR wo es welche gibt — ein leeres Feld an 67 Sessions wäre Rauschen.
   */
  notes?: string
  /**
   * Was der Spezialist am Ziel vermisst hat (§7). Er reist mit, weil Paket 5
   * ihn im Log zeigt; SPERREN tut er nichts.
   */
  missing?: string[]
  /** Der Fortschritt einer Sammel-Session: Teil-Id → Antwort. */
  collected?: Record<string, string>
}

export interface BrandStepDetailResponse {
  profileId: string
  stepKey: BrandStepKey
  storedState: BrandStoredStepState
  revision: number
  confidence: BrandConfidence | null
  inputHash: string
  startedAt: string | null
  completedAt: string | null
  /** Wann dieses Kapitel zuletzt neu begonnen wurde (brand-013) — `null` = nie. */
  restartedAt: string | null
  activeSeconds: number
  slots: Record<string, BrandSlotView>
  /**
   * Der Session-Zustand ALLER Sessions dieses Kapitels — abgeleitet, keine
   * gespeicherte Spalte (`resolveSessionStates`). Gerechnet wird über die
   * Fakten ALLER Kapitel, weil eine Session über Kapitelgrenzen liest.
   */
  sessions: Record<string, BrandSessionView>
  /**
   * DIE OFFENEN BEFUNDE, an denen ein Feld DIESES Kapitels beteiligt ist (§8).
   *
   * Sie reisen mit der Werkstatt mit, damit Paket 5 nur noch rendert: die
   * Chips im Log und an der Bühne lesen dieselbe Liste, die auch die
   * Abnahme-Seite je Block filtert. Leer, solange nichts gefunden wurde — und
   * ebenso, wenn die Befund-Tabelle gerade nicht lesbar ist (fail-soft).
   */
  findings: BrandFindingView[]
  generations: BrandGenerationsView
  progress: BrandStepProgress
  missingRequired: string[]
}

/** Antwort des Autosave — die NORMALISIERTE Serverfassung, nicht das Echo. */
export interface BrandStepSaveResponse {
  revision: number
  slots: Record<string, BrandSlotView>
}

/**
 * Der Rumpf eines 409 (`error.data.reason === 'revision_conflict'`): die
 * AKTUELLE Serverfassung reist mit, damit die UI „Serverfassung laden" anbieten
 * kann, ohne einen zweiten Abruf zu machen (Autosave-Regel §3e: bei 409 NIE
 * automatisch überschreiben).
 */
export interface BrandStepConflictData {
  code: 'revision_conflict'
  revision: number
  slots: Record<string, BrandSlotView>
}

export interface BrandStepCompleteResponse {
  stepKey: BrandStepKey
  storedState: BrandStoredStepState
  journey: BrandJourneyStep[]
  progressPct: number
  currentStepKey: string
}

/**
 * DIE FINALE ABNAHME EINES KAPITELS (Plan §5a) — was die Seite zeigt, in
 * Registry-Reihenfolge und ohne einen einzigen Text, den die Oberfläche selbst
 * erfinden müsste.
 *
 * ── WARUM SO VIEL IN EINER ANTWORT ───────────────────────────────────────
 * Die Seite stellt je Session DREI Dinge nebeneinander (Bereich · Beispiel ·
 * eigene Eingabe) und darüber einen Zähler. Käme das aus drei Abrufen, zeigte
 * sie beim Blättern drei Stände desselben Kapitels — und die Frage „Passt
 * dieses Kapitel?" hinge an einer Zahl aus einem vierten. Ein Abruf, ein
 * Stand, eine Entscheidung.
 *
 * ── SCHLÜSSEL STATT TEXT, ABER BEISPIELE ALS TEXT ────────────────────────
 * `labelKey`/`questionKey`/`exampleKey` sind i18n-Schlüssel: WIE etwas heisst,
 * entscheiden die Locale-Dateien, nicht der Server. Das `example` dagegen ist
 * INHALT aus der Registry (`sessionContent.ts`, Davids Gate) und steht dort in
 * beiden Sprachen — die Oberfläche wählt, der Server schickt beide, weil er
 * die Anzeigesprache des Browsers nicht besser kennt als der Browser selbst.
 */
export interface BrandAcceptanceExample {
  de: string[]
  en: string[]
}

export interface BrandAcceptanceSessionView {
  slotId: string
  kind: BrandSessionKind
  required: boolean
  state: BrandSessionState
  /** Es gibt einen bestätigten Wert (`confirmed` trägt den Text, nicht ein Flag). */
  confirmed: boolean
  accepted: boolean
  deferred: boolean
  /** Kennt diese Session ein Vertagen? (`answers.allowDefer`) */
  allowDefer: boolean
  /** Der bestätigte Wert, VOLLSTÄNDIG — die Seite kürzt nicht (§5a Schritt 1). */
  value: string
  /** Die Notiz des Schliess-Aufrufs (§4) — plus die Gründe abgelehnter Befunde. */
  notes: string
  /** OFFENE Befunde, an denen dieses Feld beteiligt ist (§8, Chips in Paket 5). */
  findings: BrandFindingView[]
  /** `brand.labels.<id>` — kann fehlen; dann gilt `questionKey` (wie in der Werkstatt). */
  labelKey: string
  /** Die Frage in ihrer Pfad-/Team-Fassung — der Rückfall der Beschriftung. */
  questionKey: string
  /** `brand.example.<id>` — nur bei Menschenfragen, sonst `null`. */
  exampleKey: string | null
  /** Das erfundene Vorbild aus einer FREMDEN Branche, je Sprache. */
  example: BrandAcceptanceExample
  affects: BrandSessionAffects
}

export interface BrandStepAcceptanceResponse {
  stepKey: BrandStepKey
  storedState: BrandStoredStepState
  revision: number
  confidence: BrandConfidence | null
  restartedAt: string | null
  /** Registry-Reihenfolge — die Reihenfolge der Blöcke auf der Seite. */
  sessions: BrandAcceptanceSessionView[]
  acceptance: BrandStepAcceptance
}

/** Antwort von „Abnehmen" und „Vertagen" — der neue Stand DIESER Session. */
export interface BrandSessionAcceptResponse {
  stepKey: BrandStepKey
  sessionKey: string
  revision: number
  accepted: boolean
  deferred: boolean
  acceptance: BrandStepAcceptance
  /** Auto-Weiter: die nächste Session oder die Finale Abnahme. */
  next: BrandNextSessionRef | null
}

/**
 * WAS „NOCHMAL VON VORN" KOSTET (§5a Schritt 1) — der Inhalt des Schutz-Layers.
 *
 * `ack` ist der Hash über GENAU diese Hülle. Der Restart trägt ihn zurück; der
 * Server rechnet neu und weist ohne passenden Wert mit 409 ab — dieselbe
 * Mechanik wie der `impactAck` der Korrektur-Regel (§9). Die Oberfläche
 * erzwingt es damit nie allein.
 */
export interface BrandRestartImpactResponse {
  stepKey: BrandStepKey
  revision: number
  /** Was in DIESEM Kapitel verloren geht — Zahlen, keine Texte. */
  chapter: {
    values: number
    notes: number
    accepted: number
  }
  /** Bestätigte Felder SPÄTERER Kapitel, die daran hängen. */
  downstream: {
    byStep: Partial<Record<BrandStepKey, string[]>>
    count: number
  }
  ack: string
}

// ── Die Korrektur-Regel (BW2 Paket 6, Plan §9) ────────────────────────────

/**
 * WAS DIE KORREKTUR EINES FELDES BERÜHRT (§9 Schritt 1) — die Antwort auf
 * `GET …/sessions/:id/impact`, OHNE KI und ohne einen Schreibvorgang.
 *
 * ── NUR BESTÄTIGTE FELDER ────────────────────────────────────────────────
 * Die Hülle zählt, was schon entschieden ist (`confirmedDependents`). Was
 * ohnehin noch besprochen wird, ist kein Verlust — und eine Warnung, die 29
 * Felder nennt, von denen 26 leer sind, wird beim zweiten Mal weggeklickt.
 *
 * ── `direct` UND `transitive` ÜBERLAPPEN SICH ────────────────────────────
 * Wie bei `sessionsAffectedBy`: `direct` ist die Teilmenge derer, die
 * unmittelbar aus diesem Feld schöpfen, `transitive` ist die ganze Hülle.
 * `count` ist ihre Länge — die Zahl im Satz „berührt {count} bestätigte
 * Felder in {steps} Kapiteln".
 *
 * `ack` bindet Feld, `revision` und die sortierte Hülle zusammen; der PATCH
 * trägt ihn als `impactAck` zurück, und ohne ihn antwortet der Server 409
 * `impact_unacknowledged` (Muster `restart_unacknowledged`).
 */
export interface BrandSessionImpactResponse {
  slotId: string
  stepKey: BrandStepKey
  revision: number
  /** Bestätigte Felder, die UNMITTELBAR aus diesem schöpfen. */
  direct: string[]
  /** Die ganze bestätigte Hülle, in Registry-Reihenfolge. */
  transitive: string[]
  /** Dieselbe Hülle je Kapitel — leere Kapitel kommen nicht vor. */
  byStep: Partial<Record<BrandStepKey, string[]>>
  count: number
  ack: string
}

/** Der Rumpf eines 409 `restart_unacknowledged` — die Hülle reist mit. */
export interface BrandRestartConflictData {
  code: 'restart_unacknowledged'
  impact: BrandRestartImpactResponse
}

export interface BrandStepRestartResponse {
  stepKey: BrandStepKey
  storedState: BrandStoredStepState
  revision: number
  restartedAt: string
  /** Die erste Session des Kapitels — George eröffnet sie. */
  next: BrandNextSessionRef | null
  progressPct: number
  currentStepKey: string
}

// ── Der Spezialist beim Schliessen (BW2 Paket 4, Plan §4/§7/§8) ────────────

/**
 * WAS DER SPEZIALIST GEANTWORTET HAT (§7, wörtlich).
 *
 * Sie ist das Ergebnis EINES Aufrufs, nicht der gespeicherte Stand: was davon
 * an der Session hängen bleibt, sind `goalReached`, `missing` und die Notizen
 * (`slots[id].review` bzw. `.notes`); die Befunde ziehen in ihre eigene
 * Tabelle um, weil sie einen Status haben und kapitelübergreifend sind.
 *
 * `goalReached: false` SPERRT NICHTS (§7): die Bestätigung des Menschen gilt.
 * George sagt im nächsten Zug einmal, was fehlt, und bietet an nachzulegen.
 */
export interface BrandSessionReview {
  goalReached: boolean
  /** Was fehlt, wenn nicht (max. 3). */
  missing: string[]
  /** 0–3 Notizen in der Inhaltssprache. */
  notes: string[]
  findings: BrandFinding[]
  /** Vorschlag für die nächste offene Session — ungeprüft, `pickNextSession` entscheidet. */
  nextSession: string | null
  /** Nur im `correct`-Modus (Paket 6): welche veralteten Felder wirklich getroffen sind. */
  affected?: string[]
}

/** Eine gespeicherte Befund-Zeile, wie die Oberfläche sie liest (Paket 5 rendert sie). */
export interface BrandFindingView {
  id: string
  kind: BrandFindingKind
  status: BrandFindingStatus
  /** Beteiligte Felder — bei `conflict` genau zwei. */
  slots: string[]
  why: string
  suggestion: string
  /** Das Kapitel der Quell-Session — die Kapitel-Sperre der Abnahme. */
  stepKey: BrandStepKey
  /** Die Session, deren Schliess-Aufruf ihn erzeugt hat. */
  sourceSession: string
  dismissReason: string
  createdAt: string
  resolvedAt: string | null
  /** Wann George ihn im Gespräch ausgesprochen hat — `null` = noch nie (§8). */
  mentionedAt: string | null
}

export interface BrandFindingsResponse {
  findings: BrandFindingView[]
}

/**
 * DIE ANTWORT DES SCHLIESS-AUFRUFS.
 *
 * `reviewed: false` heisst fail-soft (§7): der Wert steht, aber es gibt keine
 * Befunde und keine Notizen — der Prüfblick (§10, Paket 7) holt genau diese
 * Sessions nach. `review` trägt dann die leere Form, nie `null`: ein Leser,
 * der zwischen „nichts gefunden" und „nicht gelaufen" unterscheiden will,
 * liest `reviewed`, und ein zweiter Weg dafür wäre einer zu viel.
 */
export interface BrandSessionCloseResponse {
  stepKey: BrandStepKey
  sessionKey: string
  review: BrandSessionReview
  /** Die OFFENEN Befunde, an denen ein Feld dieses Kapitels beteiligt ist. */
  findings: BrandFindingView[]
  /** Auto-Weiter: der geprüfte Vorschlag, sonst die Grundfassung. */
  next: BrandNextSessionRef | null
  revision: number
  reviewed: boolean
  /** Welche Stufe die Befunde geschrieben hat — `null`, wenn keine lief. */
  reviewedBy: BrandReviewStage | null
  /**
   * NUR NACH EINER KORREKTUR (§9, `correct`-Modus): wie die mechanisch
   * veralteten Felder aufgeteilt wurden.
   *
   * `restamped` sind die, für die der Server den Quell-Hash neu gesetzt hat —
   * sie sind wieder `done`. `affected` bleiben `stale` und haben je einen
   * Befund bekommen. Fehlt das Feld ganz, war es eine gewöhnliche
   * Bestätigung; `affected` gleich der ganzen Hülle heisst fail-closed (kein
   * Urteil, also bleibt alles zum Ansehen stehen).
   */
  correction?: {
    affected: string[]
    restamped: string[]
  }
}

// ── Das Dokument und der Prüfblick (BW2 Paket 7, Plan §10) ────────────────

/**
 * EIN KAPITEL IM DOKUMENT — dieselbe Form wie auf der Finalen Abnahme, nur
 * neunmal.
 *
 * ── WARUM DIESELBEN `sessions` WIE IN DER KAPITEL-ABNAHME ────────────────
 * Das Dokument IST die Finale Abnahme der Ebene 1 (§10: „dieselbe Seite wie
 * §5a, nur über alle Kapitel"). Eine eigene, schlankere Zeilenform hätte
 * zwangsläufig eine zweite Antwort auf „was steht in diesem Feld" — und
 * spätestens beim ersten veralteten Wert liefen die beiden Seiten
 * auseinander. Das Beispiel reist trotzdem mit: die Oberfläche entscheidet, ob
 * sie es zeigt (im Dokument nicht — dort steht die Marke, nicht die Lehre).
 *
 * ÜBERSPRUNGENE Kapitel stehen gar nicht erst drin (§10): das Dokument ist
 * das, was diese Marke ist, nicht das, was sie hätte sein können.
 */
export interface BrandDocumentChapter {
  stepKey: BrandStepKey
  /** Der GELTENDE Zustand aus `resolveBrandJourney` (ohne `skipped`, s. o.). */
  state: BrandStepState
  /** Der GESPEICHERTE Zustand der Zeile — die Abnahme-Seite liest ihn so. */
  storedState: BrandStoredStepState
  /** Für „Gilt weiter" und jede andere Handlung an einer Zeile dieses Kapitels. */
  revision: number
  restartedAt: string | null
  acceptance: BrandStepAcceptance
  sessions: BrandAcceptanceSessionView[]
}

/**
 * WAS DER PRÜFBLICK VORFINDET (§10 „Nachholung aller Sessions mit
 * `reviewed: false`").
 *
 * `unreviewed` sind die bestätigten Sessions OHNE Urteil — fail-soft
 * ausgefallene Schliess-Aufrufe (§7). Sie stehen in REGISTRY-Reihenfolge, weil
 * der Deckel die ersten zehn nimmt und die frühen Felder die sind, an denen
 * der Rest hängt.
 *
 * `lastRunAt`/`lastRunRevisionKey` fehlen, solange in DIESEM Prozess kein
 * Prüfblick lief (s. `claimBrandDocumentReview` — der Merker ist bewusst
 * prozess-lokal). Sie sind eine Auskunft, keine Zusage: der Knopf bleibt
 * klickbar, und der Server entscheidet beim Klick.
 */
export interface BrandDocumentReviewState {
  unreviewed: string[]
  lastRunAt?: string
  lastRunRevisionKey?: string
}

export interface BrandDocumentResponse {
  profileId: string
  title: string
  /** Die Kapitel des WEGES, in Registry-Reihenfolge. */
  chapters: BrandDocumentChapter[]
  /** ALLE offenen Befunde des Brandings — kapitelübergreifend, wie die Tabelle. */
  findings: BrandFindingView[]
  review: BrandDocumentReviewState
}

/**
 * DIE ANTWORT DES PRÜFBLICKS (§10) — er läuft NUR auf Klick (§16), nie von
 * selbst.
 *
 * `ran: false` heisst „derselbe Dokument-Stand wurde in diesem Prozess schon
 * geprüft": kein Aufruf, kein Geld, und trotzdem die volle Auskunft (die
 * Befunde kommen aus der Tabelle, `caughtUp` aus dem gemerkten Lauf). Das ist
 * dieselbe Arbeitsteilung wie beim Kapitel-Blick: der Riegel spart den Aufruf,
 * nicht die Antwort.
 *
 * `stillUnreviewed` ist der Rest hinter dem Deckel (`BRAND_DOCUMENT_CATCHUP_MAX`)
 * — er verschwindet nicht, er wartet auf den nächsten Klick.
 */
export interface BrandDocumentReviewResponse {
  ran: boolean
  /** Sessions, deren Urteil dieser Lauf nachgeholt hat. */
  caughtUp: string[]
  /** Sessions, die ungeprüft bleiben — Deckel oder fail-soft ausgefallen. */
  stillUnreviewed: string[]
  /** ALLE offenen Befunde nach diesem Lauf. */
  findings: BrandFindingView[]
  /** Wer den DOKUMENT-Blick geschrieben hat — `null`, wenn keine Stufe durchkam. */
  reviewedBy: BrandReviewStage | null
  /**
   * Der Stand, für den dieser Lauf gilt (Idempotenz-Schlüssel, §10) — und zwar
   * der NACH der Nachholung: sie schreibt (`reviewed`, Notizen) und bewegt
   * damit die `revision` der berührten Kapitel. Der nächste Klick rechnet
   * genau diesen Schlüssel, und nur so hält der Riegel gegen den Doppelklick.
   */
  revisionKey: string
}

/** Die Antwort des KAPITEL-Modus (§5a) — nur Befunde, kein Urteil, kein Wegweiser. */
export interface BrandStepReviewResponse {
  stepKey: BrandStepKey
  revision: number
  reviewed: boolean
  reviewedBy: BrandReviewStage | null
  findings: BrandFindingView[]
}

/** Die Antwort auf „annehmen"/„ablehnen" (§8). */
export interface BrandFindingDecisionResponse {
  finding: BrandFindingView
  /**
   * Die neue Fassung der QUELL-Kapitel-Zeile, wenn der Ablehnungs-Grund als
   * Notiz dort gelandet ist — sonst die unveränderte. Die Abnahme-Seite führt
   * ihre `revision` selbst und muss sie übernehmen.
   */
  revision: number
}

/** Der Rumpf eines 400 `acceptance_incomplete` (`complete`). */
export interface BrandAcceptanceConflictData {
  code: 'acceptance_incomplete'
  blockers: BrandAcceptanceBlocker[]
  missing: string[]
}

export interface BrandMessageView {
  id: string
  stepKey: string
  /**
   * DIE SESSION, IN DER DIESER ZUG ENTSTAND (brand-011). `''` heisst
   * „Kapitel-Verlauf aus der Zeit vor BW2" — und ist damit ein Wert, keine
   * Lücke: solche Zeilen zählen zum Verlauf der ERSTEN Session ihres Kapitels.
   */
  sessionKey: string
  role: 'george' | 'user' | 'system'
  body: string
  parts: unknown
  generationId: string | null
  createdAt: string
}

export interface BrandMessagesResponse {
  messages: BrandMessageView[]
  /** Weiterreichen als `?cursor=` — `null` heißt „Ende". */
  cursor: string | null
  hasMore: boolean
}

/**
 * DIE EINE NICHT-STRÖMENDE ANTWORT DER KONVERSATIONS-ROUTE (P3.2).
 *
 * `conversed: false` heisst „es kommt kein Zug" — mehr sagt sie bewusst nicht.
 * Dahinter stehen drei Fälle, die für die Oberfläche denselben Handgriff haben
 * (nämlich keinen): der KI-Kill-Switch ist aus, der Zug wurde schon einmal
 * geschickt, oder im Baustein läuft gerade ein anderer Zug. In allen dreien
 * verhält sich die Werkstatt exakt wie vor P3.2.
 *
 * Der Client erkennt sie am `Content-Type`: kein `text/event-stream`, also kein
 * Strom. Ein Fehler wäre die falsche Form — hier ist nichts schiefgegangen.
 */
export interface BrandConverseSkippedResponse {
  conversed: false
  /**
   * NUR beim Eröffnungszug (Paket 3a): diese Session hat ihren ersten Zug
   * schon. Der Client ruft die Eröffnung bei JEDEM Öffnen — ohne dieses
   * „schon passiert" bekäme eine Session bei jedem Blick einen neuen ersten
   * Satz, und der Eimer bezahlte ihn.
   *
   * Es steht NEBEN `conversed: false` und ersetzt es nicht: für die Werkstatt
   * ist beides derselbe Handgriff (keiner), und ein zweiter Antwort-Typ
   * zwänge sie, zwei Formen zu unterscheiden, die dasselbe bedeuten.
   */
  skipped?: true
}

/**
 * WOHIN ES DANACH WEITERGEHT (Auto-Weiter, Plan §5) — die nächste offene
 * Pflicht-Session ODER, am Kapitelende, die Finale Abnahme.
 *
 * Der Typ und die Rechnung dazu (`resolveNextStop`) stehen in
 * `shared/brandJourney.ts`: er ist eine Aussage der ZUSTANDSMASCHINE und
 * gehört dorthin, wo sie lebt. Hier steht nur der Name, unter dem ihn die
 * Antwort-Typen kennen — die Warteschlange „neu besprechen" (`stale`) füllt
 * dasselbe Feld später mit Paket 6.
 */
export type { BrandNextSessionRef } from '../brandJourney'

/** Jede Antwort der Konversations-Route, die KEIN Strom ist. */
export type BrandConverseResponse = BrandConverseSkippedResponse

/** NEUTRAL: dieselbe Form für falsch, abgelaufen, widerrufen, verbraucht. */
export interface BrandInviteCheckResponse {
  valid: boolean
}

/**
 * DIE WARTELISTE — bewusst NICHT neutral, und das ist kein Widerspruch zu den
 * zwei Antworten darüber.
 *
 * Der Einladungs-Code ist ein GEHEIMNIS: jede Auskunft über ihn hilft dem, der
 * rät. Hier steht die EIGENE Adresse im Rumpf — sie ist kein Geheimnis vor dem,
 * der sie gerade eingetippt hat. Über FREMDE Adressen sagt die Antwort nichts,
 * was ein Rater nicht selbst herausfände — die Drossel (`brand:waitlist`,
 * 5/min) ist die Grenze, nicht die Sprachlosigkeit.
 *
 * ── ZWEI ZUSTÄNDE, UND `duplicate` IST KEINER DAVON MEHR ──────────────────
 * Seit dem Double-Opt-in zählt eine Zeile erst nach dem Klick im Postfach; die
 * Frage „stand die Adresse schon da?" hat für das Formular damit aufgehört,
 * eine Frage zu sein. Was es wissen muss, ist, WAS ALS NÄCHSTES PASSIERT:
 *  · `mail_sent` — im Postfach liegt ein Bestätigungs-Link (neue Adresse ODER
 *    eine unbestätigte, die einen frischen Link bekommt: für den Menschen davor
 *    ist beides derselbe Satz, und genau deshalb ist es auch dieselbe Antwort —
 *    ein Unterschied wäre ein Enumerations-Leck).
 *  · `already_confirmed` — diese Adresse ist bestätigt, es geht KEINE Mail mehr
 *    raus. Das darf sie erfahren: sie hat sich gerade selbst eingetippt.
 *
 * `ok` ist immer `true`: die Route antwortet 200 oder wirft (400 bei kaputtem
 * Rumpf, 503 bei defekter Ablage oder ausgefallener Mail). Ein `ok: false` gäbe
 * es nie.
 */
export interface BrandWaitlistResponse {
  ok: true
  state: 'mail_sent' | 'already_confirmed'
}

/**
 * DER KLICK AUS DER MAIL. Auch hier keine Neutralität nötig: wer den Token hat,
 * hat die Mail — und die ging an genau diese Adresse.
 *
 * `already_confirmed` ist der DEFENSIVE Zweig: das Bestätigen löscht den Hash
 * aus der Zeile, ein zweiter Klick auf denselben Link findet also gar nichts
 * mehr und endet in 400. Der Zustand steht trotzdem im Vertrag, weil die Zeile
 * auf einem anderen Weg (Betreiber-Hand, künftiger Import) mit Hash UND Status
 * 'confirmed' dastehen könnte — dann ist „schon bestätigt" die ehrliche
 * Auskunft und kein Fehler.
 *
 * Abgewiesen wird mit einem Status, nicht mit einem dritten Wort: 400
 * `token_invalid` (unbekannt), 410 `token_expired` (Frist vorbei — die Zeile
 * bleibt `pending`, ein neuer Eintrag erneuert den Link).
 */
export interface BrandWaitlistConfirmResponse {
  ok: true
  state: 'confirmed' | 'already_confirmed'
}

/** Ebenso neutral — `false` sagt nie, WORAN es lag. */
export interface BrandInviteRedeemResponse {
  redeemed: boolean
}

/** Der eingefrorene Inhalt einer Veröffentlichung (nie Chats/Entwürfe). */
export interface BrandShareChapter {
  stepKey: BrandStepKey
  slots: { slotId: string, value: string }[]
}

export interface BrandShareSnapshot {
  schemaVersion: number
  title: string
  contentLocale: string
  story: string
  chapters: BrandShareChapter[]
  presetId: string
  presetVersion: string
}

/** Der rohe Token steht GENAU EINMAL hier — danach nur noch sein Hash. */
export interface BrandSharePublishResponse {
  shareId: string
  token: string
  publishedAt: string
  expiresAt: string
}

export interface BrandShareRevokeResponse {
  revoked: number
}

export interface BrandShareViewResponse {
  snapshot: BrandShareSnapshot
  publishedAt: string
  expiresAt: string
}
