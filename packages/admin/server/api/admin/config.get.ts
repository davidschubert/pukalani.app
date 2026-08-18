import { toPublicAppConfig } from '../../../../core/shared/types/config'

/**
 * Aktuelle Produkt-Flags (Admin-Ansicht) + Core-KI-Zustand: aiEnabled
 * (Gate pukalani.ai), aiModel (Laufzeit-Override aus app_config, leer = Default),
 * aiDefaultModel (Build-Default als UI-Placeholder).
 *
 * SEIT 2026-08-18 auch der ZUSTAND DES SCHLÜSSELS, und das ist der eigentliche
 * Grund für die Erweiterung: `aiEnabled` meldete bisher nur das Config-Gate.
 * Auf `platform` stand damit „KI an, hier dein Modell", während JEDE
 * KI-Funktion still nicht lief, weil kein `NUXT_AI_KEY` gesetzt war — das
 * F44-Muster in der Betreiber-Oberfläche selbst.
 *
 * `aiKeySource` sagt WOHER der benutzte Schlüssel kommt ('settings' = über
 * diese Seite eingetragen, 'env' = Server-Env, 'none' = keiner). Der WERT
 * verlässt den Server nie — er ginge sonst in den __NUXT__-Payload der Seite.
 *
 * Auch hier nur die client-sichtbare Teilmenge (Audit-Befund K5): die Antwort
 * landet über useFetch im __NUXT__-Payload von /dashboard/admin/config, und das
 * signierte `entitlementsDoc` hat dort — wie überall im Client — keinen Leser.
 */
export default defineEventHandler(async (event) => {
  requirePermission(event, 'system.manage')
  const [flags, ai, stored] = await Promise.all([
    getAppConfig(event),
    getEffectiveAiConfig(event),
    readInstanceSecret(event, 'ai'),
  ])
  const envKey = Boolean(useRuntimeConfig(event).aiKey)
  return {
    ...toPublicAppConfig(flags),
    aiEnabled: ai.enabled,
    // Leer, wenn kein Override aktiv ist — das UI zeigt dann den Placeholder
    aiModel: ai.model === ai.defaultModel ? '' : ai.model,
    aiDefaultModel: ai.defaultModel,
    // 'settings' schlägt 'env' — dieselbe Rangfolge, nach der auch aufgelöst
    // wird (resolveAiKey), damit die Anzeige nicht etwas anderes behauptet als
    // benutzt wird.
    aiKeySource: (stored ? 'settings' : envKey ? 'env' : 'none') as 'settings' | 'env' | 'none',
    // Ohne Umschlag-Schlüssel bleibt das Feld zu — die Seite sagt es dann auch.
    aiKeyEditable: instanceSecretsConfigured(event),
  }
})
