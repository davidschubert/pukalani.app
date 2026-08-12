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
 * Namen; Eigenschaften sind ein Filter obendrauf. Nur `funnel_cta_plan` trägt
 * eine (`plan`), weil dort genau die Unterscheidung die Frage ist.
 */

/** Die sieben Punkte des Trichters, in der Reihenfolge des Weges. */
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
] as const

export type FunnelEvent = typeof FUNNEL_EVENTS[number]
