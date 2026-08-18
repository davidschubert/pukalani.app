import { AppwriteException } from 'node-appwrite'
import { z } from 'zod'

const configSchema = z.object({
  registrationEnabled: z.boolean(),
  commentsEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  // Globales KI-Model-Override (app_config.aiModel, system-016) — leer =
  // zurück auf den Build-Default aus pukalani.ai; OpenRouter-artige Ids (vendor/model).
  // Optional: alte Clients ohne das Feld patchen nur die Flags.
  aiModel: z.string().trim().max(100)
    .regex(/^$|^[\w.-]+\/[\w.:-]+$/, 'Erwartet vendor/model oder leer')
    .optional(),
  /**
   * KI-Schlüssel (2026-08-18). NUR SCHREIBEN: der Wert wandert verschlüsselt
   * in `instance_secrets` (system-036) und kommt nie zurück. Leerer String =
   * ENTFERNEN (dann gilt wieder die Env, falls gesetzt); weggelassen =
   * unverändert. Dieselbe Regel wie überall im Haus — ein PATCH, der
   * ungenannte Felder zurücksetzt, ist ein PUT mit falschem Namen.
   */
  aiKey: z.string().trim().max(400).optional(),
})

/** Produkt-Flags setzen (Upsert der app_config/global-Zeile) + Audit. */
export default defineEventHandler(async (event) => {
  requirePermission(event, 'system.manage')

  const body = await readValidatedBody(event, configSchema.parse)
  // Der Schlüssel gehört NICHT in die app_config-Zeile: die Tabelle ist
  // `read(any)` (system-005) und damit für jeden Besucher lesbar.
  const { aiKey, ...data } = body
  const config = useRuntimeConfig(event)
  const admin = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  try {
    await admin.tablesDB.updateRow({ databaseId, tableId: 'app_config', rowId: 'global', data })
  }
  catch (error) {
    // NUR wenn die Zeile fehlt anlegen — andere Fehler nicht verschlucken
    // (sonst 409 vom Create, der den echten Fehler maskiert).
    if (error instanceof AppwriteException && error.code === 404) {
      await admin.tablesDB.createRow({ databaseId, tableId: 'app_config', rowId: 'global', data })
        .catch(e => { throw toH3Error(e, 'Could not save configuration') })
    }
    else {
      throw toH3Error(error, 'Could not save configuration')
    }
  }

  if (aiKey !== undefined) {
    await writeInstanceSecret(event, 'ai', aiKey, event.context.user?.$id ?? '')
    // Im Protokoll steht NUR die Tatsache, nie der Wert — auch nicht gekürzt:
    // die ersten Zeichen eines Schlüssels sind bereits eine Auskunft.
    await recordAudit(event, {
      action: aiKey ? 'config.ai_key_set' : 'config.ai_key_cleared',
      targetType: 'config',
      targetId: 'ai',
    })
  }

  await recordAudit(event, { action: 'config.updated', targetType: 'config', targetId: 'global', metadata: data })

  return data
})
