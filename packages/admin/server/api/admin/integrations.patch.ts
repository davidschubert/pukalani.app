import { z } from 'zod'
import { INTEGRATION_IDS } from '../../../shared/types/integrations'

/**
 * EINEN Zugang setzen oder entfernen.
 *
 * IMMER NUR EINEN: die Seite hat je Dienst einen eigenen Speichern-Knopf, und
 * ein Sammel-PATCH über alle Dienste könnte bei einem Fehler in der Mitte
 * einen halben Zustand hinterlassen — bei Geheimnissen die schlechteste Sorte
 * Überraschung. Ein Aufruf, ein Dienst, ein Ergebnis.
 *
 * LEERER WERT = ENTFERNEN, und das muss ausgesprochen werden: das Formular
 * schickt ein leeres Feld NICHT mit (leer heisst dort „nicht angefasst"),
 * sondern nur der Entfernen-Knopf schickt ''.
 *
 * Das Protokoll hält die TATSACHE fest, nie den Wert — auch nicht gekürzt:
 * die ersten Zeichen eines Schlüssels sind bereits eine Auskunft.
 */
const bodySchema = z.object({
  id: z.enum(INTEGRATION_IDS),
  value: z.string().trim().max(400),
})

export default defineEventHandler(async (event) => {
  requirePermission(event, 'system.manage')

  const { id, value } = await readValidatedBody(event, bodySchema.parse)

  await writeInstanceSecret(event, id, value, event.context.user?.$id ?? '')

  await recordAudit(event, {
    action: value ? 'integration.key_set' : 'integration.key_cleared',
    targetType: 'integration',
    targetId: id,
  })

  return { ok: true, id, source: value ? 'settings' as const : 'none' as const }
})
