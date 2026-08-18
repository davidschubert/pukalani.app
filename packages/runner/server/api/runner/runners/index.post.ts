import { randomBytes } from 'node:crypto'
import { ID } from 'node-appwrite'
import { runnerCreateSchema } from '../../../../schemas/run'
import { toRunnerPublic } from '../../../../shared/runnerPublic'
import { RUNNERS_TABLE, type RunnerCreatedResponse, type RunnerRow } from '../../../../shared/types/runner'

/**
 * Einen Rechner registrieren — NEU GEGENÜBER § 5 des Konzepts.
 *
 * ABWEICHUNG, BEWUSST: der ursprüngliche Schnitt listet vier Board-Routen und
 * fünf Runner-Routen, aber keine Registrierung — das Konzept beschreibt die
 * NAHT (wie Board und Runner reden), und wie der erste Runner zu seinem Secret
 * kommt, war darin schlicht nicht gestellt. Ohne diese Route bliebe nur „Zeile
 * von Hand in Appwrite anlegen und den Hash selbst ausrechnen"; ein
 * Betriebsschritt, den man von Hand macht, macht man irgendwann falsch (und
 * ein falsch gehashtes Secret ist von aussen nicht von einem Tippfehler zu
 * unterscheiden — die Naht antwortet auf JEDEN Fehlweg 401). § 5 des
 * Konzepts ist entsprechend ergänzt.
 *
 * DAS TOKEN ERSCHEINT GENAU EINMAL — hier, in dieser Antwort. Gespeichert wird
 * nur `sha256(secret)`; es gibt danach keinen Weg, es noch einmal zu lesen
 * (M9-Muster wie `community_invites.tokenHash`). Wer es verliert, registriert
 * einen neuen Rechner und legt den alten stilltrocken.
 */
export default defineEventHandler(async (event): Promise<RunnerCreatedResponse> => {
  requirePermission(event, 'runner.manage')
  const body = await readValidatedBody(event, runnerCreateSchema.parse)

  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)

  // 32 Byte aus dem CSPRNG = 64 Hex-Zeichen. Nicht kürzer: der Hash ist
  // unsalted (er muss bei jedem Poll billig nachrechenbar sein), also ist die
  // Länge des Secrets die einzige Verteidigung gegen Offline-Rechnen.
  const secret = randomBytes(32).toString('hex')

  const runner = await tablesDB.createRow<RunnerRow>({
    databaseId: config.public.appwriteDatabaseId,
    tableId: RUNNERS_TABLE,
    rowId: ID.unique(),
    data: {
      name: body.name,
      kind: body.kind,
      secretHash: hashRunnerSecret(secret),
      // Füllt der Rechner selbst beim ersten Heartbeat (§ 8.1: Anzeige-Kopie).
      capabilitiesJson: '',
      lastSeenAt: null,
      status: 'active',
    },
  }).catch((error) => {
    throw toH3Error(error, 'Could not register runner')
  })

  setResponseStatus(event, 201)
  // `<rowId>.<secret>` — die Id vorn erlaubt der Naht den direkten Row-Lookup
  // statt eines Scans über alle Runner (server/utils/runnerAuth.ts).
  return { runner: toRunnerPublic(runner), token: `${runner.$id}.${secret}` }
})
