import { ID } from 'node-appwrite'
import { createBrandGenerateSchema } from '../../../../../../../schemas/brandGeneration'
import {
  type BrandGenerationCompletedData,
  type BrandGenerationEventDataMap,
  type BrandGenerationEventName,
  type BrandGenerationFailureCode,
  findBrandGenerationByKey,
  packBrandGenerations,
  serializeBrandGenerationEvent,
} from '../../../../../../../shared/brandGeneration'
import { resolveBrandJourney } from '../../../../../../../shared/brandJourney'
import { slotById } from '../../../../../../../shared/slotRegistry'
import type { BrandGenerationEntry } from '../../../../../../../shared/types/brand'
import {
  BRAND_MESSAGES_TABLE,
  BRAND_STEPS_TABLE,
  type BrandSlotRecord,
  brandDb,
  loadBrandStepContext,
  loadStepRow,
  loadStepRows,
  parseGenerations,
  parseSlotRecords,
  profileFacts,
  profileSiteAnalysisText,
  profileStartCard,
  resolveProfileProgress,
  serializeSlotRecords,
  toStepFacts,
  touchProfile,
} from '../../../../../../utils/brandStore'
import {
  type BrandGeneratorContext,
  type BrandGeneratorResult,
  acquireBrandGenerationLock,
  brandGenerationInputHash,
  collectSlotDependencies,
  readBrandAiEnabled,
  resolveBrandSlotGenerator,
  retainBrandGeneration,
} from '../../../../../../utils/brandGenerators'
import { bookBrandAiQuota } from '../../../../../../utils/brandAiQuota'
import { recordBrandEvent } from '../../../../../../utils/brandEvents'

/**
 * DAS §3e-STREAMING-PROTOKOLL, SERVERSEITIG.
 *
 * `POST /api/brand/profiles/:id/steps/:stepKey/generate` antwortet
 * `text/event-stream` und sendet fünf Ereignisse: `generation.started` ·
 * `message.delta` · `slot.ready` · `generation.completed` ·
 * `generation.failed`. Jedes trägt seine `generationId`; die Serialisierung
 * (und die Lese-Seite) liegen als pure Regel in `shared/brandGeneration.ts`.
 *
 * ── ZWEI ARTEN, NEIN ZU SAGEN — UND DER UNTERSCHIED IST ABSICHT ───────────
 * VOR dem Strom wird mit HTTP abgewiesen: kein Beta-Zugang (404, Datentür),
 * fremdes Profil (404), gesperrter Baustein (403), unbekannter/deaktivierter
 * Slot oder ein Slot, den George gar nicht entwirft (400). Das sind Fehler des
 * AUFRUFERS — sie gehören in den Status, nicht in einen Datenstrom, den ein
 * `fetch` ohne Weiteres für einen Erfolg hält.
 *
 * IM Strom wird abgewiesen, was ein ZUSTAND ist: KI abgeschaltet
 * (`ai_disabled`), kein Generator registriert (`no_generator`), hier läuft schon
 * einer (`generation_active`), Anbieter kaputt, abgebrochen, leer. Der Mensch
 * hat den Knopf gedrückt, der Server hat zugehört — er bekommt eine Antwort im
 * selben Kanal, und die Oberfläche macht daraus einen ruhigen Hinweis. Der Stand
 * bleibt in JEDEM dieser Fälle voll bearbeitbar (§9b.5).
 *
 * ── PERSISTENZ VOR `completed` (Plan §6, wörtlich) ────────────────────────
 * Erst `brand_steps.slots` (latestDraft; `firstDraft` nur, wenn noch keiner da
 * war) + Generations-Eintrag + `brand_messages`-Zeile, DANN das
 * `generation.completed`-Frame. Ein Client, der „fertig" gesehen hat, muss den
 * Entwurf nach einem Reload wiederfinden — die andere Reihenfolge verspräche
 * etwas, das ein Absturz eine Zeile später zur Lüge macht.
 *
 * ABBRUCH UND FEHLER LASSEN DEN BISHERIGEN ENTWURF UNANGETASTET: nichts
 * Partielles erreicht `brand_steps`. Deltas fliessen nur in die Oberfläche.
 *
 * ── DIE ZEILE WIRD FRISCH GELESEN, BEVOR GESCHRIEBEN WIRD ─────────────────
 * Zwischen dem Gate und dem Ende des Streams vergehen Sekunden, und der
 * Autosave des Menschen läuft weiter. Geschrieben wird deshalb auf der Fassung,
 * die JETZT in der Tabelle steht — sonst überschriebe der Entwurf still, was
 * der Mensch währenddessen getippt hat.
 *
 * ── DIE `revision` STEIGT, UND DER CLIENT ERFÄHRT DIE NEUE ────────────────
 * Der Entwurf ist eine Änderung wie jede andere. Ohne die neue `revision` im
 * `completed`-Frame liefe der nächste Autosave in einen 409 — also in den
 * Konflikt-Dialog, den niemand ausgelöst hat. `useBrandGeneration()` übernimmt
 * sie deshalb; wer hier ein Feld entfernt, baut den 409 wieder ein.
 *
 * ── LOG-REGEL §6 ──────────────────────────────────────────────────────────
 * Logzeilen und `brand_events` tragen generationId, Slot-Id, Modell, Dauer und
 * Fehlercode — NIE Prompt, NIE Hinweis, NIE erzeugten Text.
 *
 * ── DIE DROSSEL (P2.1) STEHT VOR DEM STROM, UND ZWAR AUS EINEM GRUND ──────
 * Die vier Deckel aus Plan §6 (Burst 2 · 10/Tag je Brand × Slot-Typ · 200/Tag
 * je Konto · Instanz-Deckel) werden gebucht, SOLANGE DIE ANTWORT NOCH KEIN SSE
 * IST — als 429 mit `data.code`. Ein Nein im Strom wäre für einen Deckel die
 * falsche Form: `fetch` hielte die Antwort für einen Erfolg, kein Proxy und
 * kein Log sähe die Ablehnung, und `Retry-After` hätte keinen Platz.
 *
 * DAFÜR WANDERN DREI DINGE VOR DEN `writeHead`: der Kill-Switch, die
 * Generator-Wahl und die Idempotenz-Prüfung. Sie MÜSSEN davor stehen —
 * gebucht werden darf nur, was wirklich Geld kostet:
 *   · `brandAiEnabled` aus (Kill-Switch) ⇒ gar nichts, auch keine Buchung.
 *   · Kein Generator ⇒ nichts zu bezahlen.
 *   · Der Dev-Stub (`chargesQuota: false`) ⇒ er ruft keinen Anbieter.
 *   · Ein Idempotenz-Treffer ⇒ Cache-Treffer, „was nichts kostet, kostet kein
 *     Kontingent" (Plan §6).
 * GEMELDET werden Kill-Switch und fehlender Generator weiterhin IM Strom
 * (`ai_disabled`, `no_generator`) — sie sind Zustände, keine Aufruferfehler,
 * und die Oberfläche macht daraus einen ruhigen Hinweis. Nur der ZEITPUNKT der
 * Prüfung hat sich verschoben, nicht ihre Form.
 */

/** Was der Entwurf höchstens sein darf — die Registry sagt es je Slot. */
function clampDraft(draft: string, maxLength: number): string {
  const trimmed = draft.trim()
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

export default defineEventHandler(async (event) => {
  const started = Date.now()
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow } = await loadBrandStepContext(event, userId)

  // ── HTTP-Gates: Fehler des Aufrufers (s. Kopf) ───────────────────────────
  const parsed = createBrandGenerateSchema().safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ status: 400, statusText: 'Invalid generation payload', data: { code: 'invalid_body' } })
  }
  const body = parsed.data

  const candidate = slotById(body.slotId)
  if (!candidate || candidate.deactivated) {
    throw createError({ status: 400, statusText: 'Unknown slot', data: { code: 'unknown_slot' } })
  }
  // Ab hier ist der Slot bekannt. Eine eigene Konstante statt fortlaufender
  // `!`-Behauptungen: die Verengung eines `const` überlebt den Sprung in eine
  // Closure (`fail`, `persist`) nicht zuverlässig, und ein `!` wäre genau dort
  // eine Behauptung ohne Beweis.
  const slot = candidate
  if (slot.stepId !== stepKey) {
    throw createError({ status: 400, statusText: 'Slot belongs to another step', data: { code: 'slot_foreign' } })
  }
  if (slot.generator === 'none') {
    // Eine reine Menschenfrage hat keinen Entwurf — und ein Knopf, der trotzdem
    // einen erzeugte, machte aus einer Frage eine Vorlage.
    throw createError({ status: 400, statusText: 'Slot is not generated', data: { code: 'slot_not_generated' } })
  }

  /**
   * ── WAS VOR DEM STROM FESTSTEHEN MUSS (s. Kopf) ──────────────────────────
   * Kill-Switch, Generator-Wahl und Idempotenz-Prüfung — die drei Fragen, die
   * entscheiden, ob dieser Lauf überhaupt etwas KOSTET. Gemeldet werden sie
   * unverändert im Strom; hier wird nur gerechnet, nicht gesendet.
   *
   * Die Werte stammen aus DERSELBEN `stepRow`-Aufnahme, die der Strom ohnehin
   * benutzt — vorgezogen wird die Rechnung, nicht die Wahrheit.
   */
  const aiEnabled = await readBrandAiEnabled(event)
  const choice = aiEnabled ? resolveBrandSlotGenerator(stepKey) : null

  const records = parseSlotRecords(stepRow.slots)
  const dependencies = collectSlotDependencies(slot.id, records)
  const inputHash = brandGenerationInputHash(slot.id, profile.contentLocale, dependencies)
  const stored = parseGenerations(stepRow.generations)
  const reused = findBrandGenerationByKey(stored.items, body.idempotencyKey)

  const generationId = ID.unique()

  /**
   * DIE SPERRE WIRD VOR DER BUCHUNG GEZOGEN, obwohl sie erst im Strom gemeldet
   * wird: ein Lauf, der ohnehin an `generation_active` scheitert, darf kein
   * Kontingent verbrauchen. Ohne Kill-Switch und ohne Generator wird sie gar
   * nicht erst gezogen — sonst bliebe sie auf den beiden Ausgängen liegen, die
   * gleich danach kommen.
   */
  const lock = aiEnabled && choice
    ? acquireBrandGenerationLock(profile.$id, stepKey, generationId)
    : null

  /**
   * KONTINGENT KOSTET NUR EIN ECHTER ANBIETER-LAUF: kein Dev-Stub
   * (`chargesQuota: false`), kein Cache-Treffer, kein Lauf, den der
   * Kill-Switch verhindert, und keiner, der an der Sperre hängen bleibt.
   *
   * BELEGT WIRD DER BURST-PLATZ VOR DER BUCHUNG, nicht danach — die Begründung
   * steht in `brandAiQuota.ts` (zwischen Zählen und Belegen lägen sonst drei
   * `await`). Ein Nein gibt ihn sofort wieder frei.
   */
  const charges = Boolean(choice?.chargesQuota) && !reused?.draft && Boolean(lock)
  const burst = charges ? retainBrandGeneration(userId) : null
  if (charges) {
    const rejection = await bookBrandAiQuota(event, {
      userId,
      profileId: profile.$id,
      slotId: slot.id,
    })
    if (rejection) {
      burst?.release()
      lock?.release()
      logEvent('info', 'brand.generation_throttled', { slotId: slot.id, stepKey, code: rejection.code })
      setHeader(event, 'Retry-After', rejection.retryAfterSec)
      // Der GRUND reist mit: `data.code` wird vom zentralen Fehler-Handler als
      // `reason` ins Envelope gehoben, und die Werkstatt sagt „gleich wieder"
      // oder „morgen wieder" — nicht dasselbe für beides.
      throw createError({
        status: 429,
        statusText: 'Brand generation limit reached',
        data: { code: rejection.code },
      })
    }
  }

  // ── Ab hier läuft der Strom ──────────────────────────────────────────────
  const res = event.node.res
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    // Ohne diesen Kopf puffert nginx den Strom und der Mensch sieht am Ende
    // alles auf einmal — das Streaming wäre dann reine Zierde.
    'X-Accel-Buffering': 'no',
  })

  function send<N extends BrandGenerationEventName>(type: N, data: BrandGenerationEventDataMap[N]): void {
    if (res.writableEnded) return
    res.write(serializeBrandGenerationEvent(type, data))
  }

  function fail(code: BrandGenerationFailureCode): void {
    send('generation.failed', { generationId, code })
    logEvent('warn', 'brand.generation_failed', {
      generationId, slotId: slot.id, stepKey, code, ms: Date.now() - started,
    })
    void recordBrandEvent(event, {
      type: 'generation.failed',
      profileId: profile.$id,
      userId,
      payload: { slotId: slot.id, stepKey, code },
    })
    res.end()
  }

  if (!aiEnabled) return fail('ai_disabled')
  if (!choice) return fail('no_generator')

  if (!lock) return fail('generation_active')

  // Der Abbruch hat zwei Auslöser: der Mensch drückt „Stopp" (der Client bricht
  // den fetch ab, die Verbindung schliesst) oder das Netz fällt weg. Beide
  // enden hier — der Generator hört auf, nichts wird gespeichert.
  const abort = new AbortController()
  event.node.req.on('close', () => abort.abort())

  try {
    send('generation.started', { generationId, slotId: slot.id, stepKey })
    void recordBrandEvent(event, {
      type: 'generation.requested',
      profileId: profile.$id,
      userId,
      payload: { slotId: slot.id, stepKey, hasHint: Boolean(body.hint) },
    })

    // WIEDERVERWENDUNG statt zweitem KI-Aufruf: derselbe Idempotenzschlüssel,
    // derselbe Entwurf. Ein doppelt abgeschickter Knopfdruck (Doppelklick,
    // Wiederholung nach Netzhänger) kostet so kein Kontingent — „was nichts
    // kostet, kostet kein Kontingent" (Plan §6). Entschieden wurde das schon
    // oben (`charges`), damit dieser Fall gar nicht erst gebucht wird.
    if (reused?.draft) {
      send('message.delta', { generationId, text: reused.draft })
      send('slot.ready', { generationId, slotId: slot.id, draft: reused.draft })
      send('generation.completed', {
        generationId,
        slotId: slot.id,
        revision: stepRow.revision ?? 0,
        messageId: null,
        model: reused.model,
        promptVersion: reused.promptVersion,
        createdAt: reused.createdAt,
        reused: true,
      })
      res.end()
      return
    }

    const context: BrandGeneratorContext = {
      event,
      stepKey,
      slot,
      locale: profile.contentLocale,
      pathKind: profileFacts(profile).pathKind,
      // Die STARTKARTE aus dem PROFIL (§2.1) — sie geht NICHT in den
      // `inputHash`: der beschreibt den Stand der Quell-SLOTS, und dafür ist
      // `collectSlotDependencies` die einzige Quelle. Eine Änderung an der
      // Karte macht einen Entwurf deshalb heute nicht „veraltet".
      startCard: profileStartCard(profile),
      // Der gelesene Website-Text (P2.3) — leer, solange niemand „Website
      // lesen" gedrückt hat. Er geht wie die Startkarte NICHT in den
      // `inputHash` (Begründung im Vertrag, `brandGenerators.ts`).
      siteAnalysis: profileSiteAnalysisText(profile),
      hint: body.hint ?? '',
      dependencies,
      signal: abort.signal,
      onDelta: (text: string) => { send('message.delta', { generationId, text }) },
    }

    let result: BrandGeneratorResult
    try {
      result = await choice.generator(context)
    }
    catch (error) {
      logEvent('error', 'brand.generation_provider_error', {
        generationId,
        slotId: slot.id,
        // Die MELDUNG des Anbieters, nicht der Prompt und nicht die Antwort.
        message: error instanceof Error ? error.message : String(error),
      })
      return fail('provider_error')
    }

    if (result.aborted || abort.signal.aborted) return fail('aborted')

    const draft = clampDraft(result.draft, slot.maxLength)
    if (!draft) return fail('empty_result')

    send('slot.ready', { generationId, slotId: slot.id, draft })

    const completed = await persist({
      draft,
      inputHash,
      generationId,
      result,
      entryBase: {
        slotId: slot.id,
        schemaVersion: 1,
        locale: profile.contentLocale,
        idempotencyKey: body.idempotencyKey,
      },
    })
    if (!completed) return fail('persist_failed')

    send('generation.completed', completed)
    logEvent('info', 'brand.generation_completed', {
      generationId,
      slotId: slot.id,
      stepKey,
      model: result.model,
      provider: result.provider,
      ms: Date.now() - started,
    })
    void recordBrandEvent(event, {
      type: 'generation.completed',
      profileId: profile.$id,
      userId,
      payload: { slotId: slot.id, stepKey, model: result.model, ms: Date.now() - started },
    })
    res.end()
  }
  finally {
    lock.release()
    // Der Burst-Platz gehört diesem Lauf, nicht seinem Ausgang: Erfolg,
    // Anbieterfehler und Abbruch geben ihn gleichermassen frei.
    burst?.release()
  }

  /**
   * Schreiben, in dieser Reihenfolge: frische Zeile lesen → Slot + Historie
   * fortschreiben → `brand_messages` → Fortschritts-Cache. Erst danach darf der
   * Aufrufer `generation.completed` senden.
   *
   * Scheitert etwas, gibt es `null` — und der Aufrufer meldet `persist_failed`
   * statt eines Abschlusses, den niemand wiederfindet.
   */
  async function persist(input: {
    draft: string
    inputHash: string
    generationId: string
    result: { model: string, provider: string, promptVersion: string }
    entryBase: {
      slotId: string
      schemaVersion: number
      locale: string
      idempotencyKey: string | undefined
    }
  }): Promise<BrandGenerationCompletedData | null> {
    try {
      const fresh = await loadStepRow(event, profile.$id, stepKey) ?? stepRow
      const records = parseSlotRecords(fresh.slots)
      const now = new Date().toISOString()

      const before: BrandSlotRecord = records[input.entryBase.slotId] ?? {}
      const next: Record<string, BrandSlotRecord> = {
        ...records,
        [input.entryBase.slotId]: {
          ...before,
          // Der ERSTE Wert bleibt für immer stehen — aus dem Verhältnis von
          // `firstDraft` zu `confirmed` entstehen die beiden Übernahmequoten
          // (Audit 2). Eine Regeneration darf ihn nicht mitziehen.
          firstDraft: before.firstDraft ?? input.draft,
          latestDraft: input.draft,
          updatedAt: now,
        },
      }

      const history = parseGenerations(fresh.generations)
      const entry: BrandGenerationEntry = {
        generationId: input.generationId,
        slotId: input.entryBase.slotId,
        schemaVersion: input.entryBase.schemaVersion,
        promptVersion: input.result.promptVersion,
        model: input.result.model,
        provider: input.result.provider,
        locale: input.entryBase.locale,
        inputHash: input.inputHash,
        createdAt: now,
        ...(input.entryBase.idempotencyKey ? { idempotencyKey: input.entryBase.idempotencyKey } : {}),
        draft: input.draft,
      }
      const packed = packBrandGenerations([...history.items, entry], history.count + 1)

      const revision = (fresh.revision ?? 0) + 1
      const { tablesDB, databaseId } = brandDb(event)
      await tablesDB.updateRow({
        databaseId,
        tableId: BRAND_STEPS_TABLE,
        rowId: fresh.$id,
        data: {
          slots: serializeSlotRecords(next),
          generations: packed.json,
          inputHash: input.inputHash,
          revision,
        },
      })

      // Georges Zug im Verlauf — dieselbe `generationId` wie die Slot-Generation
      // (§3e: „Chat-Nachricht und Slot-Generation referenzieren dieselbe
      // generationId").
      let messageId: string | null = null
      try {
        const message = await tablesDB.createRow({
          databaseId,
          tableId: BRAND_MESSAGES_TABLE,
          rowId: ID.unique(),
          data: {
            profileId: profile.$id,
            stepKey,
            role: 'george',
            body: input.draft,
            parts: JSON.stringify({ kind: 'draft', slotId: input.entryBase.slotId }),
            generationId: input.generationId,
          },
        })
        messageId = message.$id
      }
      catch (error) {
        // Der VERLAUF ist die Beilage, der ENTWURF ist die Sache. Eine
        // fehlgeschlagene Nachricht darf einen gespeicherten Entwurf nicht zu
        // `persist_failed` machen — der Mensch verlöre Text, um eine Zeile im
        // Chat zu retten.
        logEvent('warn', 'brand.generation_message_failed', {
          generationId: input.generationId,
          message: error instanceof Error ? error.message : String(error),
        })
      }

      // Der Fortschritts-Cache am Profil zieht mit (ein Entwurf zählt schon —
      // `stepProgress` rechnet mit `hasValue`, nicht mit `confirmed`).
      const mergedRows = (await loadStepRows(event, profile.$id)).map(row => (row.$id === fresh.$id
        ? { ...row, slots: JSON.stringify(next) }
        : row))
      const progress = resolveProfileProgress(
        resolveBrandJourney(profileFacts(profile), toStepFacts(mergedRows)),
      )
      await touchProfile(event, profile.$id, {
        progressPct: progress.progressPct,
        currentStepKey: progress.currentStepKey,
      })

      return {
        generationId: input.generationId,
        slotId: input.entryBase.slotId,
        revision,
        messageId,
        model: input.result.model,
        promptVersion: input.result.promptVersion,
        createdAt: now,
        reused: false,
      }
    }
    catch (error) {
      logEvent('error', 'brand.generation_persist_failed', {
        generationId: input.generationId,
        slotId: input.entryBase.slotId,
        message: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }
})
