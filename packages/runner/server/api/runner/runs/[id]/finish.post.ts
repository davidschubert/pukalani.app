import { runFinishSchema } from '../../../../../schemas/run'
import { runTransitionAllowed } from '../../../../../shared/runGuards'
import { RUNS_TABLE, type RunFinishResponse, type RunRow } from '../../../../../shared/types/runner'

/**
 * Der Abschluss — docs/plans/AI-RUNNER.md § 5/§ 7.2 Schritt 9.
 *
 * `succeeded` ist hier eine BEHAUPTUNG DES RUNNERS, keine Messung des
 * Servers: nur der Elternprozess auf dem Mac sieht `permission_denials` und
 * das `post_turn_summary` und kann `needs_input` von echtem Erfolg
 * unterscheiden (§ 11 — ein blockierter Lauf endet in der CLI als „success").
 * Der Server prüft deshalb nur, ob der Übergang überhaupt erlaubt ist.
 */
export default defineEventHandler(async (event): Promise<RunFinishResponse> => {
  const caller = await requireRunner(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ status: 400, statusText: 'Missing id' })

  const body = await readValidatedBody(event, runFinishSchema.parse)

  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const run = await tablesDB.getRow<RunRow>({ databaseId, tableId: RUNS_TABLE, rowId: id }).catch((error) => {
    throw toH3Error(error, 'Could not load run')
  })
  requireOwnRun(caller.$id, run.runnerId)

  /**
   * DECKT AUCH „SCHON ABGEBROCHEN" AB, und das ist der wichtigere Fall: das
   * Board hat gestoppt, der Runner lief noch bis zur nächsten Meldung weiter
   * und will jetzt `succeeded` melden. Aus einem terminalen Zustand führt kein
   * Weg (§ 4) — `cancelled` bleibt stehen. Sonst könnte ein Abbruch im Nachlauf
   * still zurückgenommen werden, und der Bericht behauptete Arbeit, die
   * niemand mehr wollte.
   */
  if (!runTransitionAllowed(run.status, body.status, 'runner')) {
    throw createError({ status: 409, statusText: 'Run cannot be finished', data: { code: 'not_finishable' } })
  }

  // Erst-Wert-Regel wie in `events` (§ 7.2 Schritt 1): stempeln, nie ersetzen.
  const stamps: Record<string, string> = {}
  if (body.sessionId && !run.sessionId) stamps.sessionId = body.sessionId
  if (body.workBranch && !run.workBranch) stamps.workBranch = body.workBranch

  const finished = await tablesDB.updateRow<RunRow>({
    databaseId, tableId: RUNS_TABLE, rowId: id,
    data: {
      ...stamps,
      status: body.status,
      resultJson: body.resultJson,
      error: body.error,
      finishedAt: new Date().toISOString(),
    },
  }).catch((error) => {
    throw toH3Error(error, 'Could not finish run')
  })

  return { run: finished }
})
