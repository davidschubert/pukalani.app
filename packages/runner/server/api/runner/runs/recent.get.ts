import { Query } from 'node-appwrite'
import { RUNS_TABLE, type RecentRunsResponse, type RunRow } from '../../../../shared/types/runner'

/**
 * Die letzten Läufe über ALLE Subjekte — Board-Seite, für /dashboard/runner.
 *
 * Der Gegenpol zu `runs/index.get.ts`: die fragt bewusst nach EINEM Subjekt
 * (im Ticket-Modal will niemand die Läufe fremder Karten sehen), diese hier
 * beantwortet die andere Frage — „was ist zuletzt gelaufen?". Sie ist deshalb
 * eine eigene Route und kein optionaler Filter: ein Filter, der auch weggelassen
 * werden darf, macht aus der Subjekt-Liste versehentlich einen Vollabzug.
 *
 * Kein Paginieren: 25 Zeilen sind die Frage. Wer weiter zurück will, öffnet
 * das Subjekt.
 */
export default defineEventHandler(async (event): Promise<RecentRunsResponse> => {
  requirePermission(event, 'runner.manage')

  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)

  const runs = await tablesDB.listRows<RunRow>({
    databaseId: config.public.appwriteDatabaseId,
    tableId: RUNS_TABLE,
    queries: [Query.orderDesc('$createdAt'), Query.limit(25)],
  }).catch((error) => {
    throw toH3Error(error, 'Could not load runs')
  })

  return { runs: runs.rows }
})
