import { runnerUpdateSchema } from '../../../../schemas/run'
import { toRunnerPublic } from '../../../../shared/runnerPublic'
import { RUNNERS_TABLE, type RunnerRow, type RunnerUpdatedResponse } from '../../../../shared/types/runner'

/**
 * Einen Rechner stilllegen, wieder aktivieren oder umbenennen — Board-Seite.
 *
 * STILLLEGEN IST DER AUS-SCHALTER DER NAHT (§ 4): `requireRunner` weist einen
 * `status !== 'active'`-Runner ab, und zwar VOR dem Secret-Vergleich. Ein
 * Rechner, dessen Token abhandengekommen ist, wird also hier zugemacht — und
 * nicht dadurch, dass man ihn löscht: seine Läufe bleiben lesbar, und ihre
 * `runnerId` zeigt weiter auf eine Zeile mit Namen.
 *
 * GELÖSCHT WIRD BEWUSST NICHT. Es gäbe nichts zu gewinnen (eine Zeile) und
 * zwei Dinge zu verlieren: die Herkunft alter Läufe und die Gewissheit, dass
 * ein weggeworfenes Secret nirgends mehr passt.
 *
 * `secretHash` steht in KEINEM Zweig — ein Rotieren wäre eine eigene Route mit
 * einer einmaligen Antwort (wie die Registrierung), kein PATCH-Feld.
 */
export default defineEventHandler(async (event): Promise<RunnerUpdatedResponse> => {
  requirePermission(event, 'runner.manage')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ status: 400, statusText: 'Missing id' })

  const body = await readValidatedBody(event, runnerUpdateSchema.parse)

  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)

  const runner = await tablesDB.updateRow<RunnerRow>({
    databaseId: config.public.appwriteDatabaseId,
    tableId: RUNNERS_TABLE,
    rowId: id,
    // Nur gesetzte Felder: ein fehlendes `name` heisst „nicht angefasst", nie ''.
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.name ? { name: body.name } : {}),
    },
  }).catch((error) => {
    throw toH3Error(error, 'Could not update runner')
  })

  return { runner: toRunnerPublic(runner) }
})
