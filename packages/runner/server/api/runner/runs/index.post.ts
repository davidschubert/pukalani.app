import { ID } from 'node-appwrite'
import { createRunSchema } from '../../../../schemas/run'
import { permissionModeAllowed } from '../../../../shared/runGuards'
import { RUNNERS_TABLE, RUNS_TABLE, type RunRow, type RunnerRow } from '../../../../shared/types/runner'

/**
 * Einen Lauf anlegen — docs/plans/AI-RUNNER.md § 5, Board-Seite.
 *
 * Der Lauf wird hier nur HINGELEGT; abgeholt wird er vom Runner
 * (`runs/claim`). Es gibt bewusst keinen Weg, einem Rechner einen Lauf
 * aufzudrängen: der Rechner entscheidet, wann er arbeitet.
 *
 * ER ENTSTEHT ALS `draft`, NICHT ALS `queued` (Paket 3, Änderung gegenüber
 * dem ursprünglichen § 5). Grund ist ein Wettrennen, das man nur EINMAL
 * beobachtet: Anhänge brauchen eine `runId` und können erst NACH dieser Zeile
 * hochgeladen werden — ein `queued`-Lauf ist aber binnen Sekunden geclaimt,
 * und der Runner zieht sein Material genau einmal (§ 7.2 Schritt 4). Der
 * Auftrag liefe dann mit halben Anhängen los, ohne dass irgendwo ein Fehler
 * stünde. Freigegeben wird deshalb ausdrücklich, mit `runs/:id/queue`.
 */
export default defineEventHandler(async (event): Promise<RunRow> => {
  const user = requirePermission(event, 'runner.manage')
  const body = await readValidatedBody(event, createRunSchema.parse)

  /**
   * DIE SPERRE AUS § 8.2, SERVERSEITIG. Sie steht hier und nicht nur in der
   * Oberfläche, weil eine ausgegraute Schaltfläche keine Sicherung ist — der
   * Aufrufer dieser Route ist HTTP, nicht ein Formular. Der Runner prüft
   * dasselbe noch einmal (§ 8.1: die Grenze liegt auf dem Mac).
   */
  if (!permissionModeAllowed(body.permissionMode, body.promptTrusted)) {
    throw createError({
      status: 400,
      statusText: 'Permission mode not allowed for an untrusted prompt',
      data: { code: 'mode_not_allowed_untrusted' },
    })
  }

  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  /**
   * Ein GEZIELTER Lauf braucht einen Rechner, der ihn holen kann. Ohne diese
   * Prüfung landet er als `queued` in einer Schlange, aus der ihn niemand
   * nimmt (`claim` filtert auf `runnerId ∈ {'', eigene Id}`) — er sähe
   * „gleich geht's los" aus und wartet auf einen Rechner, den es nicht gibt.
   * `runnerId: ''` (beliebiger) bleibt bewusst ungeprüft.
   */
  if (body.runnerId) {
    const runner = await tablesDB.getRow<RunnerRow>({
      databaseId, tableId: RUNNERS_TABLE, rowId: body.runnerId,
    }).catch(() => null)
    if (!runner || runner.status !== 'active') {
      throw createError({ status: 400, statusText: 'Runner unavailable', data: { code: 'runner_unavailable' } })
    }
  }

  const run = await tablesDB.createRow<RunRow>({
    databaseId, tableId: RUNS_TABLE, rowId: ID.unique(),
    // ALLE Spalten explizit (Muster `createRow<TenantRow>`): eine neue Spalte
    // soll hier einen Fehler erzeugen und eine Entscheidung erzwingen, statt
    // still auf ihrem Default zu landen.
    data: {
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      runnerId: body.runnerId,
      // Heute immer 'claude-code' (§ 2) — die Spalte spart später eine Migration.
      executor: 'claude-code',
      // Siehe Kopf: freigegeben wird mit `runs/:id/queue`, wenn die Anhänge liegen.
      status: 'draft',
      repoKey: body.repoKey,
      baseBranch: body.baseBranch,
      // Kommt vom RUNNER, sobald die CLI ihn vergeben hat (§ 7.2) — nie von hier.
      workBranch: '',
      model: body.model,
      permissionMode: body.permissionMode,
      // headless (MVP, § 3.3); der interaktive Weg kommt nach dem MVP (§ 7.3).
      interactive: false,
      promptSource: body.promptSource,
      promptTrusted: body.promptTrusted,
      testCommands: body.testCommands.length ? JSON.stringify(body.testCommands) : '',
      // Füllt `runs/:id/files` — solange der Lauf `draft` ist (§ 6).
      attachmentsJson: '',
      maxBudgetUsd: body.maxBudgetUsd,
      // Die Session-Id würfelt der RUNNER vor dem Start und meldet sie sofort
      // (§ 7.2 Schritt 1) — hier steht sie noch nicht fest.
      sessionId: '',
      // Ein frischer Lauf knüpft an nichts an — Fortsetzungen entstehen NUR
      // über `runs/:id/resume` (§ 9), nie hier.
      resumeSessionId: '',
      claimedAt: null,
      startedAt: null,
      finishedAt: null,
      resultJson: '',
      error: '',
      createdBy: user.$id,
    },
  }).catch((error) => {
    throw toH3Error(error, 'Could not create run')
  })

  setResponseStatus(event, 201)
  return run
})
