import type { IntegrationsResponse, IntegrationState } from '../../../shared/types/integrations'
import { BOOTSTRAP_SECRETS, integrationSource } from '../../../shared/types/integrations'

/**
 * WELCHE DIENSTE DIESE INSTANZ BENUTZT — und woher ihr Zugang kommt
 * (Davids Entscheidung 2026-08-18: „Integrationen").
 *
 * DER WERT VERLÄSST DEN SERVER NIE. Gemeldet wird ausschliesslich die
 * HERKUNFT ('settings' | 'env' | 'none') — er ginge sonst in den
 * __NUXT__-Payload dieser Seite, und damit wäre die Verschlüsselung in der
 * Datenbank eine Verkleidung.
 *
 * ── WAS ANGEBOTEN WIRD, ENTSCHEIDET DIE INSTANZ ───────────────────────────
 * Eine Zeile erscheint nur, wenn der Dienst hier überhaupt läuft: die KI
 * hinter `pukalani.ai.enabled`, die Statistik hinter der Analytics-Config,
 * die Konsolen-KI nur dort, wo der tickets-Layer montiert ist. Eine Zeile für
 * einen Dienst, den diese Instanz nicht kennt, wäre ein Feld ins Leere — und
 * genau die Sorte Angebot, die man später für kaputt hält.
 *
 * ── DIE UNBEWEGLICHEN STEHEN TROTZDEM DA ──────────────────────────────────
 * `NUXT_APPWRITE_KEY`, der Umschlag, der Control-Plane-Schlüssel, Redis: sie
 * KÖNNEN nicht hierher (man braucht sie, um an diese Zeile zu kommen). Sie
 * werden trotzdem gelistet — mit dem Hinweis, dass sie in die Server-Env
 * gehören. Eine Seite, die „alle Zugänge" verspricht und die Hälfte
 * verschweigt, schickt beim nächsten Suchen in die Irre.
 */
export default defineEventHandler(async (event): Promise<IntegrationsResponse> => {
  requirePermission(event, 'system.manage')

  const runtime = useRuntimeConfig(event)
  const appConfig = useAppConfig() as {
    pukalani?: { ai?: { enabled?: boolean }, analytics?: { enabled?: boolean } }
  }

  const items: IntegrationState[] = []

  // ── KI (OpenRouter o. ä.) ────────────────────────────────────────────────
  if (appConfig.pukalani?.ai?.enabled) {
    items.push({
      id: 'ai',
      envName: 'NUXT_AI_KEY',
      source: integrationSource(await readInstanceSecret(event, 'ai'), runtime.aiKey),
    })
  }

  // ── Statistik (Plausible) ────────────────────────────────────────────────
  if (appConfig.pukalani?.analytics?.enabled) {
    items.push({
      id: 'analytics',
      envName: 'NUXT_ANALYTICS_STATS_API_KEY',
      source: integrationSource(await readInstanceSecret(event, 'analytics'), runtime.analyticsStatsApiKey),
    })
  }

  // ── KI der Konsole (eigenes Kontingent für die Ticket-Triage) ───────────
  // `ticketsAiKey` existiert im runtimeConfig nur dort, wo der tickets-Layer
  // montiert ist — die Anwesenheit des Schlüssels IST also die Prüfung, ob
  // diese Instanz den Dienst überhaupt kennt.
  if ('ticketsAiKey' in runtime) {
    items.push({
      id: 'tickets-ai',
      envName: 'NUXT_TICKETS_AI_KEY',
      source: integrationSource(
        await readInstanceSecret(event, 'tickets-ai'),
        runtime.ticketsAiKey as string,
      ),
    })
  }

  return {
    items,
    // Ohne Umschlag bleibt jedes Feld zu — die Seite sagt dann warum.
    editable: instanceSecretsConfigured(event),
    /** Nur die NAMEN, nie ein Wert: was hier steht, gehört in die Server-Env. */
    bootstrap: [...BOOTSTRAP_SECRETS],
  }
})
