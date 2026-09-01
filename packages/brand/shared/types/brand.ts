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

import type { BrandConfidence, BrandJourneyStep, BrandStoredStepState } from '../brandJourney'
import type { BrandPathKind, BrandStepKey, BrandStepProgress } from '../slotRegistry'

/** Wem ein Profil gehört (Phase 1 aktiviert nur `user`). */
export type BrandOwnerTypeValue = 'user' | 'community'

/** Die Weiche W4 — `unknown` ist ein echter Zustand, kein fehlender Wert. */
export type BrandSubBrands = 'unknown' | 'yes' | 'no'

/** Die Weiche W3. */
export type BrandTeamKind = 'solo' | 'team'

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

export interface BrandProfileDeleteResponse {
  deleted: true
  /** Was die Kaskade wirklich entfernt hat — für Log und Beweis. */
  removed: { steps: number, messages: number, shares: number, events: number }
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

export interface BrandStepDetailResponse {
  profileId: string
  stepKey: BrandStepKey
  storedState: BrandStoredStepState
  revision: number
  confidence: BrandConfidence | null
  inputHash: string
  startedAt: string | null
  completedAt: string | null
  activeSeconds: number
  slots: Record<string, BrandSlotView>
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

export interface BrandMessageView {
  id: string
  stepKey: string
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

/** NEUTRAL: dieselbe Form für falsch, abgelaufen, widerrufen, verbraucht. */
export interface BrandInviteCheckResponse {
  valid: boolean
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
