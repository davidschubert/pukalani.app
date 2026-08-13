import {
  SITE_GOAL_IDS,
  SITE_MEMBER_RANGES,
  SITE_PURPOSES,
  type SiteProfile,
} from './onboarding'

/**
 * DER LESER DES MARKT-SIGNALS (U19) — die Auswertung hinter der Karte „Hilf
 * uns, Pukalani zu schärfen".
 *
 * Diese Datei ist der GRUND, warum die Karte überhaupt gebaut werden durfte.
 * Der Wizard hat dieselben drei Fragen jahrelang gestellt und die Antworten NIE
 * gelesen — Davids Entscheidung vom 2026-08-12 macht den Leser deshalb zur
 * Bedingung: Antworten landen im Control Plane, eine Auswertungs-Seite unter
 * admin.pukalani.app zeigt die Verteilungen, David ist der Empfänger.
 *
 * PURE, damit das Zählen ohne Appwrite prüfbar ist: die Route holt Zeilen, DIES
 * hier rechnet, die Seite malt Balken.
 *
 * ── ALLE KATALOG-OPTIONEN ERSCHEINEN, AUCH MIT NULL ─────────────────────────
 * Eine Verteilung, die nur die gewählten Werte zeigt, verschweigt den
 * interessantesten Befund: dass NIEMAND „ich ziehe von woanders um" angeklickt
 * hat, ist eine Aussage über den Markt und keine Leerstelle. Reihenfolge =
 * Katalog-Reihenfolge, nicht Häufigkeit — sonst springen die Balken bei jedem
 * Aufruf und man vergleicht zwei Wochen nicht mehr miteinander.
 *
 * ── DER ANTEIL RECHNET AUF DIE ANTWORTEN, NICHT AUF ALLE ────────────────────
 * `share` ist der Anteil AN DEN BEANTWORTETEN (0…1) — die Form der Antworten.
 * Wie viele überhaupt geantwortet haben, ist eine eigene Zahl (`answered` /
 * `unanswered`) und würde als Nenner jede Verteilung platt drücken, solange die
 * Karte frisch ist. Beide Zahlen stehen auf der Seite; keine ersetzt die andere.
 */

export const MARKET_SIGNAL_QUESTIONS = ['purpose', 'memberRange', 'goal'] as const
export type MarketSignalQuestion = (typeof MARKET_SIGNAL_QUESTIONS)[number]

const OPTIONS: Record<MarketSignalQuestion, readonly string[]> = {
  purpose: SITE_PURPOSES,
  memberRange: SITE_MEMBER_RANGES,
  goal: SITE_GOAL_IDS,
}

export interface MarketSignalOption {
  id: string
  count: number
  /** Anteil an den BEANTWORTETEN dieser Frage, 0…1. */
  share: number
}

export interface MarketSignalDistribution {
  question: MarketSignalQuestion
  answered: number
  unanswered: number
  options: MarketSignalOption[]
}

export interface MarketSignalReport {
  /** Communities, die in die Auswertung eingegangen sind. */
  communities: number
  /** Davon mit mindestens EINER der drei Antworten. */
  answeredAny: number
  distributions: MarketSignalDistribution[]
}

/**
 * PURE: Profile → Verteilungen.
 *
 * Fremde oder kaputte Werte können hier nicht ankommen — `parseSiteProfile`
 * hat sie beim Lesen der Zeile schon gegen die Kataloge geprüft und
 * weggeworfen. Ein Wert ausserhalb des Katalogs würde hier trotzdem nur
 * ignoriert (er zählt als „beantwortet", landet aber in keinem Eimer); das ist
 * die richtige Richtung, denn ein einzelner Ausreisser darf die Auswertung
 * nicht sprengen.
 */
export function tallyMarketSignal(profiles: readonly SiteProfile[]): MarketSignalReport {
  const distributions = MARKET_SIGNAL_QUESTIONS.map((question): MarketSignalDistribution => {
    const counts = new Map<string, number>()
    let answered = 0
    for (const profile of profiles) {
      const value = profile[question]
      if (!value) continue
      answered += 1
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    const options = OPTIONS[question].map((id): MarketSignalOption => {
      const count = counts.get(id) ?? 0
      return { id, count, share: answered > 0 ? count / answered : 0 }
    })
    return { question, answered, unanswered: profiles.length - answered, options }
  })

  const answeredAny = profiles.filter(
    profile => Boolean(profile.purpose || profile.memberRange || profile.goal),
  ).length

  return { communities: profiles.length, answeredAny, distributions }
}
