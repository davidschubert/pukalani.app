import type Stripe from 'stripe'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { missingWebhookEvents, WEBHOOK_EVENTS } from '../../../../../../packages/billing/shared/webhookEvents'
import { stripeModeFromKey } from '../../../../../../packages/billing/shared/stripeKeys'
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
 * DARAUS FOLGT DIE VORPRÜFUNG (Audit-Befund MEDIUM 1, 2026-08-08): ob diese
 * Instanz überhaupt ablegen KANN, wird VOR dem `create` gefragt, nicht danach.
 * Vorher legte die Route bei fehlendem NUXT_BILLING_SETTINGS_KEY erst den
 * Endpunkt an und scheiterte dann am Speichern — das Secret war damit für
 * immer verloren, und die Oberfläche meldete „konnte nicht eingerichtet
 * werden", obwohl bei Stripe sehr wohl etwas entstanden war. Scheitert das
 * Speichern TROTZDEM (Appwrite-Aussetzer im falschen Moment), sagt die Antwort
 * genau das (`secret_not_stored`) und nennt die Endpunkt-Id, damit der
 * Betreiber sie bei Stripe löschen kann.
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
 *
 * NEU ANLEGEN (`recreate: true`, MEDIUM 2) ist der Ausweg aus „Endpunkt da,
 * Secret unbekannter Herkunft": alter Endpunkt weg, neuer hin, frisches Secret
 * abgelegt. Die Reihenfolge ist LÖSCHEN, DANN ANLEGEN — nicht umgekehrt. Zwei
 * Endpunkte auf derselben URL lieferten jedes Ereignis doppelt, und zwar
 * still; ein fehlgeschlagenes `create` nach erfolgreichem `del` sieht man
 * dagegen sofort (die Karte sagt „fehlt") und heilt mit einem zweiten Klick.
 */
const schema = z.object({
  /**
   * Bestehenden Endpunkt löschen und neu anlegen. ERSETZT DAS SECRET — bis
   * das neue abgelegt ist, sind unterwegs befindliche Zustellungen des alten
   * Endpunkts wertlos. Deshalb verlangt die Oberfläche eine ausdrückliche
   * Bestätigung.
   */
  recreate: z.boolean().optional(),
}).strict()

/**
 * Kann diese Instanz Geheimnisse ablegen? Wenn nicht, hier abbrechen — VOR
 * jedem Stripe-Aufruf, der ein Secret erzeugt oder eines entwertet.
 */
function requireSecretStorage(event: H3Event): void {
  if (stripeSettingsStorageAvailable(event)) return
  throw createError({
    status: 503,
    statusText: 'Secret storage not configured',
    data: { code: 'encryption_unconfigured' },
  })
}

export default defineEventHandler(async (event) => {
  const user = requirePermission(event, 'system.manage')
  await requireBillingEnabled(event)

  const body = schema.parse(await readBody(event).catch(() => ({})) ?? {})

  const url = stripeWebhookUrl(event)
  if (!url) {
    // Ohne NUXT_PUBLIC_APP_URL wüsste diese Instanz nicht, wohin Stripe
    // liefern soll — und eine geratene URL bekommt man bei Stripe nur mit
    // Löschen wieder los.
    throw createError({ status: 400, statusText: 'App URL not configured', data: { code: 'app_url_missing' } })
  }

  const stripe = await useStripe(event)
  const mode = stripeModeFromKey((await resolveStripeSecretKey(event)).value)

  const list = await stripe.webhookEndpoints.list({ limit: 100 })
    .catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.list fehlgeschlagen'))
  let existing = list.data.find((endpoint: Stripe.WebhookEndpoint) => endpoint.url === url) ?? null

  let replacedEndpointId = ''
  if (existing && body.recreate) {
    // Erst die Speicherbarkeit fragen: einen funktionierenden Endpunkt zu
    // löschen, um dann am fehlenden Schlüssel zu scheitern, wäre der
    // schlechteste Ausgang dieser Route.
    requireSecretStorage(event)
    replacedEndpointId = existing.id
    await stripe.webhookEndpoints.del(existing.id)
      .catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.del fehlgeschlagen'))
    existing = null
  }

  if (!existing) {
    requireSecretStorage(event)

    const created = await stripe.webhookEndpoints.create({
      url,
      enabled_events: WEBHOOK_EVENTS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: 'Pukalani — Community-Abos (F55, angelegt aus dem Control-Dashboard)',
    }).catch((error: unknown) => toStripeSafeError(error, 'webhookEndpoints.create fehlgeschlagen'))

    // NUR HIER kommt das Secret vorbei. Sofort ablegen — und wenn DAS
    // scheitert, ist das kein Teilerfolg, sondern ein Fehler MIT ADRESSE: der
    // Endpunkt steht bei Stripe, seine Signaturen wären nie prüfbar, und der
    // Betreiber braucht die Id, um ihn dort zu löschen.
    let secretStored = false
    if (created.secret) {
      try {
        await saveStripeSettings(event, { webhookSecret: created.secret }, user.$id)
        secretStored = true
      }
      catch (error) {
        console.error(`[control/stripe/webhook] Endpunkt ${created.id} angelegt, Secret NICHT gespeichert:`, error)
        throw createError({
          status: 500,
          statusText: 'Webhook created but secret not stored',
          data: { code: 'secret_not_stored', endpointId: created.id },
        })
      }
    }

    // Die Herkunfts-Marke (MEDIUM 2) ist Diagnose, kein Geldweg: sie darf
    // nicht scheitern lassen, was gerade gelungen ist.
    await rememberStripeWebhookEndpointId(event, created.id, user.$id)

    console.info(`[control/stripe/webhook] Endpunkt angelegt (${created.id}) durch ${user.$id}, Secret gespeichert: ${secretStored}`)
    await recordAudit(event, {
      action: replacedEndpointId ? 'stripe.webhook_recreated' : 'stripe.webhook_created',
      targetType: 'stripe_webhook',
      targetId: created.id,
      metadata: { mode, secretStored, ...(replacedEndpointId ? { replacedEndpointId } : {}) },
    })

    return {
      action: (replacedEndpointId ? 'recreated' : 'created') as 'created' | 'recreated',
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
  await recordAudit(event, {
    action: 'stripe.webhook_events_added',
    targetType: 'stripe_webhook',
    targetId: existing.id,
    metadata: { mode, addedEvents: missing },
  })

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
