/**
 * „HILF UNS, PUKALANI ZU SCHÄRFEN" — DIE MARKT-SIGNAL-KARTE (U19).
 *
 * Der Wizard fragte einmal sechs Dinge, bevor irgendetwas passiert war. U12
 * hat das auf drei Pflichtantworten gekürzt (Name/Adresse · Kategorie · Vibe);
 * Größe, Zweck und Ziel sind dabei ERSATZLOS weggefallen. Der Benchmark-Befund
 * E5 empfahl nicht, sie zu streichen, sondern sie zu VERSCHIEBEN: hinter den
 * Aha-Moment, freiwillig, von Leuten, die schon investiert sind.
 *
 * DIESE DATEI IST DIE REGEL: wann die Karte erscheint, wann sie für immer
 * verschwindet, und was „schon beantwortet" heißt. Alles pur und unit-getestet
 * — die Route ermittelt nur Tatsachen, die Komponente rendert nur das Ergebnis.
 *
 * ── DIE LEHRE AUS DEM WIZARD ────────────────────────────────────────────────
 * Die alten sechs Antworten wurden ERHOBEN UND NIE GELESEN — das war der
 * eigentliche Fehler, nicht ihre Zahl. Diese Karte wird deshalb nur zusammen
 * mit ihrem LESER gebaut (Davids Entscheidung 2026-08-12): der Auswertungs-Seite
 * unter admin.pukalani.app. Wer die Karte ändert, prüft, ob die Seite es noch
 * zeigt.
 *
 * ── WARUM DIE ANTWORTEN IN `communities.profile` LANDEN ─────────────────────
 * Sie sind schon dort: `SiteProfile` (packages/control/shared/onboarding.ts)
 * trägt `purpose`/`memberRange`/`goal` seit jeher als optionale Felder,
 * `parseSiteProfile` liest sie, und die Bestands-Communities aus der Zeit VOR
 * U12 haben dort echte Werte stehen. Eine neue Tabelle hätte denselben Wert an
 * einem zweiten Ort geführt und die Auswertung gezwungen, zwei Quellen zu
 * vereinigen. **Es braucht deshalb KEINE Migration.**
 */

import type { TenantProfileSignal } from '../../core/shared/types/tenant'

/**
 * „Diese Community hat das Signal schon gegeben." — WAHR, sobald EINE der drei
 * Antworten steht.
 *
 * WARUM NICHT „alle drei": Teilantworten sind ausdrücklich erlaubt. Wer zwei
 * Fragen beantwortet und die dritte übergeht, hat eine Entscheidung getroffen;
 * ihn beim nächsten Aufruf erneut anzusprechen, wäre genau die Aufdringlichkeit,
 * die E5 vermeiden will. Die Karte fragt EINMAL.
 *
 * NEBENWIRKUNG MIT ABSICHT: Communities aus der Zeit vor U12 tragen alle drei
 * Antworten aus dem alten Wizard — sie gelten damit als beantwortet und werden
 * nie gefragt. Richtig so, sie haben das Signal bereits gegeben.
 */
export function profileSignalAnswered(signal: TenantProfileSignal | undefined): boolean {
  if (!signal) return false
  return Boolean(signal.purpose || signal.memberRange || signal.goal)
}

/**
 * Der Merker für „Später" und „Nicht mehr fragen" liegt in den KONTO-prefs —
 * dasselbe Muster wie `GETTING_STARTED_PREF_KEY` nebenan und aus demselben
 * Grund: es braucht dafür keine Spalte, keine Tabelle und keine Service-Naht.
 *
 * Er trägt die communityId, weil sich im Pool ALLE Communities eines Kontos
 * dieselben prefs teilen: wer in Community A „nicht mehr fragen" klickt, soll
 * in seiner nächsten, frisch angelegten Community trotzdem gefragt werden.
 *
 * EIN Schlüssel für BEIDE Knöpfe, nicht zwei: „Später" und „Nie" sind dieselbe
 * Aussage mit unterschiedlicher Frist. Form: kommaseparierte Paare
 * `communityId:bis`, wobei `bis` ein Millisekunden-Zeitstempel oder das Wort
 * `never` ist. Bewusst keine JSON-Struktur — prefs sind ein flaches
 * Key-Value-Objekt, und eine kurze Liste bleibt darin lesbar.
 */
export const PROFILE_SIGNAL_PREF_KEY = 'profileSignalPostponed'

/** „Später" blendet die Karte 30 Tage aus. */
export const PROFILE_SIGNAL_SNOOZE_DAYS = 30

const SNOOZE_MS = PROFILE_SIGNAL_SNOOZE_DAYS * 24 * 60 * 60 * 1000

/** Wie viele Communities der Merker behält (ältester Eintrag fällt raus). */
const MAX_REMEMBERED = 50

const NEVER = 'never'

export type ProfileSignalPostponeMode = 'later' | 'never'

function parsePostponed(value: unknown): Map<string, string> {
  const entries = new Map<string, string>()
  if (typeof value !== 'string' || !value) return entries
  for (const raw of value.split(',')) {
    const entry = raw.trim()
    if (!entry) continue
    // Von RECHTS trennen: eine Row-Id enthält zwar keinen Doppelpunkt, aber
    // ein kaputter Bestandswert soll hier nicht zu einem stillen Fehlgriff
    // führen — der letzte Doppelpunkt trennt immer die Frist ab.
    const cut = entry.lastIndexOf(':')
    if (cut <= 0) continue
    const communityId = entry.slice(0, cut)
    const until = entry.slice(cut + 1)
    if (!communityId || !until) continue
    entries.set(communityId, until)
  }
  return entries
}

/**
 * „Der Owner will die Karte gerade nicht sehen."
 *
 * Ein unlesbarer oder abgelaufener Eintrag heißt NICHT verschoben — die Karte
 * kommt dann wieder. Das ist die richtige Richtung: die Karte ist freiwillig
 * und harmlos, ein kaputter Merker darf das Signal nicht für immer verschlucken
 * (anders als bei einer Aufgabenliste, wo Fail-soft in die Gegenrichtung zeigt).
 */
export function communityPostponedProfileSignal(
  prefValue: unknown,
  communityId: string,
  now: number = Date.now(),
): boolean {
  if (!communityId) return false
  const until = parsePostponed(prefValue).get(communityId)
  if (!until) return false
  if (until === NEVER) return true
  const parsed = Number(until)
  return Number.isFinite(parsed) && parsed > now
}

/**
 * Neuer prefs-Wert nach „Später" bzw. „Nicht mehr fragen". Idempotent (zweimal
 * klicken ändert nur die Frist) und gedeckelt, damit ein Konto mit vielen
 * Communities die prefs nicht unbegrenzt wachsen lässt.
 */
export function withCommunityPostponed(
  prefValue: unknown,
  communityId: string,
  mode: ProfileSignalPostponeMode,
  now: number = Date.now(),
): string {
  const entries = parsePostponed(prefValue)
  entries.delete(communityId)
  entries.set(communityId, mode === 'never' ? NEVER : String(now + SNOOZE_MS))
  return [...entries.entries()]
    .slice(-MAX_REMEMBERED)
    .map(([id, until]) => `${id}:${until}`)
    .join(',')
}

/**
 * Was die Route dem Browser sagt. `visible` ist die FERTIGE Antwort — die
 * Komponente rechnet nichts nach.
 */
export interface ProfileSignalResponse {
  visible: boolean
}

/**
 * ── DIE ERSCHEINUNGS-BEDINGUNG ──────────────────────────────────────────────
 *
 * `hasOwnContent` = „diese Community hat eigenen Inhalt" — dieselbe Tatsache,
 * die auch der erste Punkt der Willkommens-Checkliste (AP2/U4) benutzt, aus
 * demselben core-Vertrag (`communityHasAuthoredContent`), inklusive derselben
 * Ausnahme: der vom Wizard gesäte Beispiel-Beitrag zählt NICHT.
 *
 * WARUM NICHT DER CHECKLISTEN-ZUSTAND SELBST, obwohl die Aufgabe danach fragt —
 * zwei Messungen haben es ausgeschlossen:
 *
 * 1. **„teilweise abgehakt" ist ab Minute eins wahr.** Der Wizard setzt den
 *    Vibe, und der Vibe IST `communities.theme` — der Punkt „Farbwelt" steht
 *    also schon abgehakt da, bevor der Owner das Dashboard zum ersten Mal
 *    sieht. Eine Bedingung „mindestens ein Punkt erledigt" wäre gar keine
 *    Bedingung, sondern eine Zusicherung.
 * 2. **Die Checklisten-Route antwortet nach dem Wegklicken mit lauter
 *    Unwahrheiten.** Sie steigt bei `dismissed` früh aus und meldet alle fünf
 *    Punkte als `false` (bewusst — sie soll dem, der sie weggeklickt hat, nicht
 *    bei jedem Seitenaufruf drei Abfragen und einen Control-Ruf kosten). Wer
 *    die Checkliste ausblendet, wäre damit für die Markt-Frage FÜR IMMER
 *    unsichtbar — und das sind gerade die entschlossenen Owner, deren Antwort
 *    am meisten wert ist.
 *
 * Bleibt der erste Punkt der Checkliste als das, was er ohnehin ist: der
 * Aha-Moment. Wer den ersten eigenen Beitrag geschrieben hat, hat etwas
 * investiert — genau die Person, die E5 fragen will. EINE Zählabfrage mit
 * `limit(1)`, kein zweites Datenmodell, keine Community-Alterrechnung (die
 * bräuchte eine zweite Wahrheitsquelle für eine Karte, die freiwillig ist).
 *
 * Die „ODER nach N Tagen"-Alternative ist damit BEWUSST WEGGELASSEN: eine
 * Community ohne einen einzigen eigenen Beitrag hat kein Signal, das der
 * Produktentwicklung hilft — sie hat ein Aktivierungsproblem, und dafür ist die
 * Checkliste da.
 */
export function resolveProfileSignalVisibility(input: {
  answered: boolean
  postponed: boolean
  hasOwnContent: boolean
}): ProfileSignalResponse {
  return { visible: !input.answered && !input.postponed && input.hasOwnContent }
}
