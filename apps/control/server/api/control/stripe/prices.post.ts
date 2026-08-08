import { syncStripePriceCatalog } from '../../../utils/stripePrices'

/**
 * DIE VIER PLAN-PREISE BEI STRIPE ANLEGEN/ABGLEICHEN (F55) — derselbe Lauf,
 * den `scripts/stripe/ensure-prices.mjs` im Terminal macht, aus demselben
 * Katalog (packages/control/shared/stripePriceCatalog.ts) und mit derselben
 * puren Entscheidung (`decideStripePriceAction`).
 *
 * KEIN BODY, keine Beträge von außen. Die Beträge stehen im Katalog, und das
 * ist der Punkt: eine Route, die einen Betrag entgegennimmt, ist eine Route,
 * mit der man sich vertippt. Preis ÄNDERN ist eine andere Handlung und hat
 * eine andere Route (`/api/control/billing/prices` POST) — mit engen Grenzen
 * und einem einzelnen Ziel.
 *
 * Idempotent: ein zweiter Klick meldet überall `skipped`.
 */
export default defineEventHandler(async (event) => {
  const user = requirePermission(event, 'system.manage')
  await requireBillingEnabled(event)

  const stripe = await useStripe(event)
  const report = await syncStripePriceCatalog(stripe)
    .catch((error: unknown) => toStripeSafeError(error, 'Preis-Abgleich fehlgeschlagen'))

  const changed = report.results.filter(result => result.outcome !== 'skipped')
  if (changed.length > 0) {
    console.info(`[control/stripe/prices] ${changed.length} Preis(e) angelegt/umgezogen durch ${user.$id} (livemode=${report.livemode}): ${changed.map(r => `${r.lookupKey}:${r.outcome}`).join(', ')}`)
  }

  return report
})
