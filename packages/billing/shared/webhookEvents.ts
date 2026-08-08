/**
 * WELCHE STRIPE-EREIGNISSE GEHEN UNS ETWAS AN? — pure Mengen-Wahrheit, die
 * sowohl der billing-Layer (die Webhook-Route filtert damit) als auch die
 * Betreiber-Konsole (`apps/control`, F55: Endpunkt anlegen + Statuskarte)
 * braucht.
 *
 * WARUM DAS IN `shared/` LIEGT UND NICHT IN `server/utils/` (Audit-Befund
 * NOTE 11, 2026-08-08): `apps/control` hat die Konstanten vorher per Pfad aus
 * `packages/billing/server/utils/webhookMapping` gezogen. Für DIESE Datei war
 * das harmlos — sie ist zustandslos —, aber es ist das falsche MUSTER: ein
 * server/utils-Modul wird in jeder App, die den Layer erbt, zusätzlich
 * AUTO-IMPORTIERT. Ein Pfad-Import daneben ergibt eine ZWEITE Modul-Instanz,
 * und sobald ein solches Modul Zustand hält (`stripeSettings.ts` hält einen
 * 30-s-Cache), hätte man zwei davon: einer wird invalidiert, der andere nicht.
 * `shared/` wird nicht auto-importiert — ein Pfad-Import dorthin ist deshalb
 * dieselbe Instanz, und es ist auch das Muster, das die Nachbardateien in
 * `apps/control/server` schon benutzen (`shared/stripeKeys`,
 * `shared/paymentMethods`).
 */

/**
 * Event-Allowlist (B4): alles andere → 200 + no-op.
 *
 * Die drei `async_payment_*`/`expired`-Einträge kamen am 2026-08-02 dazu. Ohne
 * sie endete eine verzögerte Zahlung im Nichts: `completed` erfüllte sofort
 * (siehe `mayFulfillCheckout`), und ob das Geld später ankam oder platzte,
 * erfuhr diese Installation NIE — es gab schlicht keinen Empfänger für die
 * Nachricht.
 */
export const WEBHOOK_ALLOWLIST = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

/**
 * Die NEUN Ereignisse in stabiler Reihenfolge — für das Anlegen des
 * Stripe-Endpunkts und die Anzeige im Dashboard (F55). Ein `Set` hat keine
 * Reihenfolge, die man einem Menschen zeigen möchte; die Liste ist dieselbe
 * Wahrheit, nur sortiert.
 */
export const WEBHOOK_EVENTS: readonly string[] = [...WEBHOOK_ALLOWLIST]

/**
 * WELCHE UNSERER NEUN FEHLEN AM ENDPUNKT? Pure Mengendifferenz — die Frage,
 * die den Testmodus-Fehlstand von 2026-08-02 unbemerkt ließ (drei
 * `checkout.session.*`-Nachzügler fehlten; eine verzögerte Zahlung endete
 * damit im Nichts).
 *
 * BEWUSST NUR IN EINE RICHTUNG: ein Endpunkt, der MEHR abonniert hat, ist
 * kein Befund — die Route beantwortet Unbekanntes mit 200 und tut nichts.
 * Ein Wächter, der Überschuss anmahnt, erzeugt eine rote Meldung ohne
 * Handlung dahinter, und die liest man weg.
 *
 * `enabled_events` kann bei Stripe die Wildcard `*` enthalten („alle
 * Ereignisse"). Dann fehlt nichts.
 */
export function missingWebhookEvents(enabledEvents: readonly string[]): string[] {
  if (enabledEvents.includes('*')) return []
  const have = new Set(enabledEvents)
  return WEBHOOK_EVENTS.filter(name => !have.has(name))
}
