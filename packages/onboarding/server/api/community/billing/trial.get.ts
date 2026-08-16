/**
 * M13 — das Ende der Testphase, für den EINEN, der etwas tun kann.
 *
 * Antwort: `{ trialEndsAt: string | null }` — das ISO-Datum aus der
 * `communities`-Row, roh. Die Regel, ab wann daraus ein Hinweis wird, steht pur
 * in `packages/control/shared/onboarding.ts` (`trialNotice`); diese Route
 * entscheidet nichts, sie gibt eine Tatsache heraus.
 *
 * KEIN RUF INS CONTROL PLANE: der Wert steckt schon im aufgelösten
 * Mandanten-Kontext (tenantsResolver liest die Row ohnehin, 30 s gecacht). Ein
 * eigener Service-Call pro Dashboard-Aufruf wäre ein HTTP-Hop für ein Datum,
 * das bereits im Speicher liegt.
 *
 * WARUM GEGATED, wo es doch nur ein Datum ist: „diese Community testet noch"
 * bzw. „ihre Testphase ist ausgelaufen" ist eine Aussage über den
 * Vertragszustand des Kunden, und die geht Mitleser nichts an. Deshalb dieselbe
 * Capability wie die Abo-Seite — `community.billing` trägt nur der Owner
 * (Davids Entscheidung 2 vom 2026-07-30).
 *
 * 404 ohne Pool-Mandanten: auf einem Kontroll-Host, im Silo und im Einzelbetrieb
 * gibt es keine Testphase — dieselbe Antwort wie eine Route, die es nicht gibt.
 */
export default defineEventHandler(async (event) => {
  await requireCommunityPermission(event, 'community.billing')

  const tenant = useTenant(event)
  if (tenant?.mode !== 'pool') {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  /**
   * `billingStatus` DANEBEN, aus demselben Kontext und unter derselben
   * Capability — der Wert liegt bereits im Speicher, kostet also keinen
   * zusätzlichen Zugriff (dieselbe Begründung wie oben für `trialEndsAt`).
   *
   * WOZU: „zahlt diese Community?" lässt sich aus `plan` allein NICHT
   * beantworten. Eine Testphase setzt `plan: 'pro'`, ohne dass ein Abo
   * besteht. Genau dafür wurde das Feld eingeführt (U4) — nur las es bis
   * heute niemand, und die Plan-Seite hielt deshalb die Testphase für ein
   * gekauftes Pro und bot es nicht mehr zum Kauf an.
   *
   * Roh durchgereicht ('' | 'active' | 'past_due' | 'canceled'); was daraus
   * folgt, entscheidet die Seite.
   */
  return {
    trialEndsAt: tenant.trialEndsAt ?? null,
    billingStatus: tenant.billingStatus ?? '',
  }
})
