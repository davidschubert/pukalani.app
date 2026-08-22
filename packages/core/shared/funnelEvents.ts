/**
 * Die Ereignisse des Anmelde-Trichters — EINE Liste, an der Code UND Doku
 * hängen (U18, 2026-08-10).
 *
 * WARUM EINE FESTE LISTE UND KEIN FREIER STRING: ein Plausible-Goal wird in
 * der Oberfläche auf den EXAKTEN Namen angelegt. Ein Tippfehler an der
 * Abschussstelle ist deshalb nicht laut, sondern still — das Ereignis läuft in
 * einen Namen, den kein Goal kennt, und der Trichter hat an dieser Stelle
 * einfach eine Null. Die Union unten macht daraus einen Typfehler.
 *
 * WARUM IM CORE UND NICHT IM analytics-LAYER: gefeuert wird aus dem
 * marketing-App und aus dem onboarding-Layer, gemessen wird über den
 * Script-Eintrag des Core (app/plugins/analytics.ts). Der analytics-Layer
 * beantwortet eine andere Frage („welche Site misst dieser Mandanten-Host?")
 * und läuft in `marketing` gar nicht mit.
 *
 * FLACH UND OHNE PFLICHT-EIGENSCHAFTEN: Plausible-CE zählt Goals über den
 * Namen; Eigenschaften sind ein Filter obendrauf. Nur wo genau die
 * Unterscheidung die Frage ist, trägt ein Ereignis welche (`funnel_cta_plan`
 * mit `plan`, die `studio_*`-Punkte mit `source`/`step`/`goal`).
 *
 * ZWEI TRICHTER IN EINER LISTE: der Anmelde-Trichter der Plattform
 * (`funnel_*`) und der Erstgespräch-Trichter der Studio-Site (`studio_*`).
 * Sie führen zu verschiedenen Zielen und werden getrennt ausgewertet — sie
 * teilen sich aber die Sicherung, die diese Datei ist (ein Tippfehler bleibt
 * sonst still, weil kein Goal den Namen kennt).
 */

/** Die sieben Punkte des Anmelde-Trichters, in der Reihenfolge des Weges. */
export const FUNNEL_EVENTS = [
  /** Marketing: Haupt-CTA („Kostenlos starten") in Hero oder Kopfleiste. */
  'funnel_cta_start',
  /** Marketing: CTA einer Preiskarte — Eigenschaft `plan` = personal|pro. */
  'funnel_cta_plan',
  /** Kundenbereich: Registrierung erfolgreich abgeschlossen. */
  'funnel_register_done',
  /** Kundenbereich: die Code-Wand (/start) ohne Code erreicht. */
  'funnel_gate_no_code',
  /** Kundenbereich: Einladungs-Code erfolgreich geprüft. */
  'funnel_code_redeemed',
  /** Kundenbereich: Wizard durch, Community angelegt. */
  'funnel_site_created',
  /** Kundenbereich: Zugang angefragt (/request-access, beide Sprachen). */
  'funnel_request_submitted',

  /* ── Studio-Trichter (pukalani.studio, W1 2026-08-21) ──────────────────
   *
   * Der zweite Trichter dieser Codebasis: von irgendeinem CTA der Studio-Site
   * über den fünfschrittigen Erstgespräch-Wizard bis zur Buchung. Plausible CE
   * hat keine Funnels-Oberfläche — die Trichter-Sicht entsteht aus dem
   * Conversion-VERGLEICH dieser fünf Goals (wo brechen Leute ab: CTA→Start,
   * Start→Schritt 4, Schritt 4→Absenden, Absenden→Buchung).
   *
   * KEINE PERSONENBEZOGENEN DATEN IN DEN EIGENSCHAFTEN. Gemeldet werden
   * ausschliesslich Auswahl-SCHLÜSSEL des Wizards; Name, Unternehmen, E-Mail
   * und die drei Freitextfelder bleiben draußen — sie gehen per Mail und in
   * die Ablage, nie in die Statistik.
   */

  /** Studio: Klick auf einen Wizard-CTA — Eigenschaft `source` (header|hero|band|pricing|contact). */
  'studio_cta_erstgespraech',
  /** Studio: Wizard-Seite aufgeschlagen, Schritt 1 steht. */
  'studio_wizard_start',
  /** Studio: ein Schritt abgeschlossen — Eigenschaft `step` ('1'…'4'). */
  'studio_wizard_step',
  /**
   * Studio: Anfrage abgesendet — Eigenschaften `goal` (Service-Schlüssel,
   * komma-verkettet), `budget` (Spanne) und `timing` (Startzeitpunkt).
   */
  'studio_wizard_submitted',
  /** Studio: Klick auf die cal.com-Buchung der Erfolgsansicht. */
  'studio_booking_click',
] as const

export type FunnelEvent = typeof FUNNEL_EVENTS[number]
