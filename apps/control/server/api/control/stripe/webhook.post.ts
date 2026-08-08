import type Stripe from 'stripe'
import { missingWebhookEvents, WEBHOOK_EVENTS } from '../../../../../../packages/billing/shared/webhookEvents'
import { stripeWebhookUrl } from '../../../utils/stripeWebhookEndpoint'

/**
 * DEN WEBHOOK-ENDPUNKT ANLEGEN ODER ERGÄNZEN (F55).
 *
 * DAS SIGNATUR-SECRET GIBT ES GENAU EINMAL. `webhookEndpoints.create`
 * liefert `secret` in der Antwort — danach nie wieder, auch nicht über
 * `retrieve`. Deshalb wird es HIER sofort verschlüsselt mitgespeichert. Wer
 * diesen Ablauf in zwei Schritte zerlegt („erst anlegen, Secret später
 * holen"), hat den Endpunkt und kein Secret; der einzige Ausweg wäre dann,
 * ihn zu löschen und neu anzulegen.
 *
 * ERGÄNZEN IST DER ANDERE FALL: existiert der Endpunkt schon, werden nur die
 * FEHLENDEN Ereignisse nachgetragen (`update`) — und dabei gibt es KEIN neues
 * Secret. Die Antwort sagt das ehrlich (`secretStored: false`), statt einen
 * Erfolg zu behaupten, den man erst beim ersten unbeantworteten Ereignis
 * widerlegt. Genau dieser Fehlstand blieb im Testmodus bis 2026-08-02
 * unbemerkt: drei `checkout.session.*`-Nachzügler fehlten.
 *
 * Ergänzt wird nur NACH OBEN. Ereignisse, die der Endpunkt zusätzlich
 * abonniert hat, bleiben — sie kosten nichts (die Route beantwortet
 * Unbekanntes mit 200) und gehören womöglich einem anderen Verbraucher.
 */
export default defineEventHandler(async (event) => {
  const user = requirePermission(event, 'system.manage')
  await requireBillingEnabled(event)

  const url = stripeWebhookUrl(event)
  if (!url) {
    // Ohne NUXT_PUBLIC_APP_URL wüsste diese Instanz nicht, wohin Stripe
    // liefern soll — und eine geratene URL bekommt man bei Stripe nur mit
    // Löschen wieder los.
    throw createError({ status: 400, statusText: 'App URL not configured', data: { code: 'app_url_missing' } })
  }

  const stripe = await useStripe(event)

  const list = await stripe.webhookEndpoints.list({ limit: 100 })
    .catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.list fehlgeschlagen'))
  const existing = list.data.find((endpoint: Stripe.WebhookEndpoint) => endpoint.url === url) ?? null

  if (!existing) {
    const created = await stripe.webhookEndpoints.create({
      url,
      enabled_events: WEBHOOK_EVENTS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: 'Pukalani — Community-Abos (F55, angelegt aus dem Control-Dashboard)',
    }).catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.create fehlgeschlagen'))

    // NUR HIER kommt das Secret vorbei. Sofort ablegen — und wenn DAS
    // scheitert, ist das kein Teilerfolg, sondern ein Fehler: der Endpunkt
    // steht dann bei Stripe, aber wir könnten seine Signaturen nie prüfen.
    // Der Betreiber muss das erfahren, um ihn zu löschen und neu anzulegen.
    let secretStored = false
    if (created.secret) {
      await saveStripeSettings(event, { webhookSecret: created.secret }, user.$id)
      secretStored = true
    }
    console.info(`[control/stripe/webhook] Endpunkt angelegt (${created.id}) durch ${user.$id}, Secret gespeichert: ${secretStored}`)

    return {
      action: 'created' as const,
      endpointId: created.id,
      url,
      secretStored,
      missingEvents: [] as string[],
    }
  }

  const missing = missingWebhookEvents(existing.enabled_events ?? [])
  if (missing.length === 0) {
    return { action: 'unchanged' as const, endpointId: existing.id, url, secretStored: false, missingEvents: [] as string[] }
  }

  const merged = [...new Set([...(existing.enabled_events ?? []), ...WEBHOOK_EVENTS])]
  await stripe.webhookEndpoints.update(existing.id, {
    enabled_events: merged as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
  }).catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.update fehlgeschlagen'))

  console.info(`[control/stripe/webhook] Endpunkt ${existing.id} um ${missing.length} Ereignis(se) ergänzt durch ${user.$id}`)

  return {
    action: 'events_added' as const,
    endpointId: existing.id,
    url,
    // Ergänzen liefert KEIN neues Secret — das gibt es nur beim Anlegen.
    secretStored: false,
    addedEvents: missing,
    missingEvents: [] as string[],
  }
})
