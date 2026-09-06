import type {
  MarketAiView,
  MarketCompetitor,
  MarketProfile,
  MarketRunStep,
} from '../marketProfile'

/**
 * DIE ANTWORT-TYPEN DER `/api/market`-ROUTEN (MV1 M2).
 *
 * ── WARUM SIE ÜBERHAUPT EXISTIEREN ────────────────────────────────────────
 * Nitros Routen-Typisierung ist in diesem Repo AUS (CLAUDE.md, Davids
 * Entscheidung 2026-08-14): `$fetch('/api/x')` liefert `unknown`, und jeder
 * gebundene Aufruf nennt seinen Antworttyp SELBST. Diese Datei ist die
 * gemeinsame Wahrheit für beide Enden — Handler-Annotation UND Aufrufstelle.
 *
 * Sie liegt in `shared/types/`, weil der Server sie sonst nicht sieht
 * (Repo-Regel: Domain-Typen nie in `app/types/`).
 */

/** Die Kandidatenliste eines Brandings. */
export interface MarketCompetitorListResponse {
  competitors: MarketCompetitor[]
  /** Wie viele es höchstens sein dürfen (§2.9 Nr. 8) — die UI zeigt „3 von 5". */
  max: number
}

/** Anlegen und Ändern antworten mit dem GESPEICHERTEN Stand, nie mit dem Body. */
export interface MarketCompetitorResponse {
  competitor: MarketCompetitor
}

export interface MarketCompetitorDeleteResponse {
  removed: boolean
}

/**
 * Der Stand eines Brandings: Kandidaten, ihre Marktprofile und die getrennt
 * gehaltene KI-Aussensicht (§7.5 a — nie mit `profiles` vermischt).
 */
export interface MarketOverviewResponse {
  competitors: MarketCompetitor[]
  profiles: MarketProfile[]
  aiViews: MarketAiView[]
  /** Ist die KI zur Laufzeit an? (`app_config.brandAiEnabled`, Kill-Switch.) */
  aiEnabled: boolean
}

/**
 * Das Ergebnis EINES Laufs (§2.11 Nr. 2). Der VERGLEICH steht bewusst nicht
 * darin — er kommt mit M3; M2 liefert Abrufstand und Profile.
 */
export interface MarketRunResponse {
  /** `false`, wenn es nichts zu tun gab (alle Kandidaten schon aktuell). */
  ran: boolean
  /** Je Kandidat der erreichte Stand — auch für die, die nichts zu tun hatten. */
  steps: MarketRunStep[]
  /**
   * Wurde extrahiert? `false` heisst: der Abruf lief, die Auswertung nicht
   * (Kill-Switch oder kein Schlüssel, §2.8 „die Seite meldet: KI ist aus").
   */
  aiEnabled: boolean
  /** Wie viele Kandidaten ein NEUES Marktprofil bekommen haben. */
  extracted: number
  /** Wie viele Kandidaten ihr vorhandenes Profil behalten haben (Idempotenz). */
  reused: number
}
