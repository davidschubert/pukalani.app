/**
 * DIE ERSTEN MINUTEN IN DER NEUEN COMMUNITY (U4 / Trichter-G2, Benchmark-E1).
 *
 * Der Owner klickt „Community öffnen" und landet auf einem Dashboard voller
 * Nullen. Diese Datei ist die REGEL der Startliste, die dort steht: fünf
 * Schritte, ihre Reihenfolge, und wann die Karte verschwindet. Alles pur und
 * unit-getestet — die Route liefert nur die fünf Tatsachen, die Komponente
 * rendert nur das Ergebnis.
 *
 * DIE FÜNF SCHRITTE SIND ENTSCHIEDEN (DECISION-LOG 2026-08-10, Nachtrag
 * Punkt 7): **Beitrag · Farbwelt · Einladen · Startseite · Abo**. Die
 * Reihenfolge ist nicht Geschmack: Ghost misst, dass Branding-Anpasser rund
 * zehnmal besser konvertieren (deshalb steht die Farbwelt VOR dem Einladen,
 * gegen den Trichter-G2-Vorschlag), und der Abo-Punkt macht aus der Liste den
 * Umsatz-Hebel statt einer Fleißaufgabe. Verworfen wurden der G2-Satz ohne Abo
 * und eine Variante mit dem Konto-Handle statt des Abos.
 *
 * KEINE EIGENE TABELLE. Jeder Punkt wird aus Daten BERECHNET, die es ohnehin
 * gibt (Quellen + Kosten stehen an der Route, `server/api/community/
 * getting-started.get.ts`). Eine Fortschritts-Tabelle wäre ein zweiter Ort für
 * eine Wahrheit, die schon existiert — und sie wüsste beim ersten Deploy für
 * keine Bestands-Community etwas.
 *
 * WARUM EIN „AUSBLENDEN" TROTZ SELBST-VERSCHWINDENS: die Liste endet auf
 * „Abo abschließen". Wer das (noch) nicht will, hätte sonst dauerhaft eine
 * Verkaufskarte auf seiner Startseite — genau der Dauer-Banner, den der
 * Testphasen-Hinweis nebenan bewusst vermeidet.
 */

/** Reihenfolge = Anzeige-Reihenfolge. */
export const GETTING_STARTED_STEPS = ['post', 'branding', 'invite', 'homePage', 'plan'] as const

export type GettingStartedStep = typeof GETTING_STARTED_STEPS[number]

/** Die fünf Tatsachen, die die Route ermittelt. */
export type GettingStartedState = Record<GettingStartedStep, boolean>

export interface GettingStartedResponse {
  steps: GettingStartedState
  /** Der Owner hat die Karte für DIESE Community weggeklickt. */
  dismissed: boolean
}

export interface GettingStartedStepView {
  key: GettingStartedStep
  done: boolean
}

export interface GettingStartedView {
  steps: GettingStartedStepView[]
  doneCount: number
  total: number
  allDone: boolean
  /** Karte rendern? (nichts geladen / alles erledigt / weggeklickt ⇒ nein) */
  visible: boolean
}

/**
 * Antwort der Route → Anzeige. `undefined` deckt die drei Fälle ab, in denen
 * es nichts zu zeigen gibt und das KEIN Fehler ist: kein Pool-Mandant (404),
 * Anfrage noch unterwegs, Anfrage fehlgeschlagen.
 */
export function resolveGettingStarted(response: GettingStartedResponse | null | undefined): GettingStartedView {
  const total = GETTING_STARTED_STEPS.length
  if (!response) {
    return { steps: [], doneCount: 0, total, allDone: false, visible: false }
  }
  const steps = GETTING_STARTED_STEPS.map(key => ({ key, done: response.steps[key] === true }))
  const doneCount = steps.filter(step => step.done).length
  const allDone = doneCount === total
  return { steps, doneCount, total, allDone, visible: !allDone && !response.dismissed }
}

/**
 * „Diese Community zahlt." — AUTORITATIV aus `communities.billingStatus`,
 * nicht aus `plan` hergeleitet.
 *
 * Warum das wichtig ist: die Testphase setzt `plan: 'pro'`, und `trialEndsAt`
 * wird beim Kauf nicht geräumt. Wer während der Testphase kauft, bekäme aus
 * jeder Herleitung über Plan/Testphase weiterhin „Abo abschließen" angezeigt —
 * die Liste würde also ausgerechnet dem zahlenden Kunden nachlaufen.
 *
 * 'past_due' zählt bewusst NICHT als erledigt: dort ist ein Abo zwar
 * abgeschlossen, aber nicht in Ordnung, und der Weg zurück führt über
 * denselben Knopf. Dieselbe Strenge wie `shouldLiftBillingSuspension` (F49),
 * das ebenfalls nur bei 'active' aufhebt.
 */
export function hasActiveCommunitySubscription(billingStatus: string | null | undefined): boolean {
  return billingStatus === 'active'
}

/**
 * „Es ist jemand eingeladen." — erledigt, sobald die Community außer dem Owner
 * noch jemanden erreicht: ein weiteres Mitglied MIT Zugang oder eine offene
 * (nicht abgelaufene) Einladung.
 *
 * PUR SEIT U9 (vorher stand die Rechnung in der Route): dieselbe
 * Team-Auskunft speist jetzt auch die Mitglieder-Kachel der Übersicht
 * (`resolveCommunityTeamSnapshot`), und eine Regel, die zwei Leser hat, gehört
 * an EINE Stelle.
 *
 * `null` = keine Auskunft ⇒ ERLEDIGT. Die Richtung ist dieselbe wie bei den
 * anderen Punkten: ein technischer Fehler darf keine Aufgabe erfinden, die
 * niemand erledigen kann. Die KACHEL entscheidet bei `null` andersherum
 * (sie entfällt) — beide Male ist die ehrlichere Antwort gemeint, nur zeigt
 * eine Aufgabenliste sie anders als eine Zahl.
 */
export function teamHasReach(snapshot: { members: number, invites: number } | null): boolean {
  if (!snapshot) return true
  return snapshot.members > 1 || snapshot.invites > 0
}

/**
 * „Die gesäte Startseite wurde angefasst."
 *
 * Es gibt keine Saat-Markierung an der Zeile (und es soll auch keine geben —
 * das wäre eine Spalte für eine Frage, die die Zeitstempel schon beantworten).
 * Appwrite setzt `$updatedAt` bei der Anlage gleich `$createdAt`; jede
 * Bearbeitung hebt ihn.
 *
 * TOLERANZ von 5 s, weil die Saat zwei Zeilen schreibt (de + en, M4) und ein
 * Speichervorgang serverseitig Millisekunden auseinanderliegen kann — ohne sie
 * hakte der Punkt sich in Grenzfällen selbst ab, ohne dass jemand etwas
 * geschrieben hat.
 */
export function homePageEdited(createdAt: string | undefined, updatedAt: string | undefined, toleranceMs = 5_000): boolean {
  if (!createdAt || !updatedAt) return false
  const created = Date.parse(createdAt)
  const updated = Date.parse(updatedAt)
  if (Number.isNaN(created) || Number.isNaN(updated)) return false
  return updated - created > toleranceMs
}

/**
 * Der „Ausblenden"-Merker liegt in den KONTO-prefs, und die sind im Pool für
 * ALLE Communities dieselben — deshalb trägt der Wert die communityId und
 * nicht bloß `true`. Wer die Liste in Community A wegklickt, soll sie in
 * Community B trotzdem bekommen.
 *
 * Form: kommaseparierte Ids. Bewusst keine JSON-Struktur — prefs sind ein
 * flaches Key-Value-Objekt, und eine Liste kurzer Ids bleibt lesbar.
 */
export const GETTING_STARTED_PREF_KEY = 'gettingStartedDismissed'

/** Wie viele Communities der Merker behält (ältester Eintrag fällt raus). */
const MAX_REMEMBERED = 50

function parseDismissed(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',').map(entry => entry.trim()).filter(Boolean)
}

export function communityDismissedGettingStarted(prefValue: unknown, communityId: string): boolean {
  if (!communityId) return false
  return parseDismissed(prefValue).includes(communityId)
}

/**
 * Neuer prefs-Wert nach einem Klick auf „Ausblenden". Idempotent (zweimal
 * klicken ändert nichts) und gedeckelt, damit ein Konto mit vielen
 * Communities die prefs nicht unbegrenzt wachsen lässt.
 */
export function withCommunityDismissed(prefValue: unknown, communityId: string): string {
  const existing = parseDismissed(prefValue).filter(entry => entry !== communityId)
  return [...existing, communityId].slice(-MAX_REMEMBERED).join(',')
}
