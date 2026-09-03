import { ID, Query } from 'node-appwrite'
import { createBrandConverseSchema } from '../../../../../../../schemas/brandConverse'
import { techniqueForStep } from '../../../../../../../shared/brandAdvisors'
import {
  type BrandGenerationEventDataMap,
  type BrandGenerationEventName,
  type BrandGenerationFailureCode,
  serializeBrandGenerationEvent,
} from '../../../../../../../shared/brandGeneration'
import { resolveNextQuestion } from '../../../../../../../shared/brandJourney'
import { resolveBrandUiLocale } from '../../../../../../../shared/brandUiLocale'
import { type BrandSlotStateFacts, slotById, slotsForStep } from '../../../../../../../shared/slotRegistry'
import type { BrandConverseSkippedResponse } from '../../../../../../../shared/types/brand'
import {
  BRAND_MESSAGES_TABLE,
  type BrandMessageRow,
  brandDb,
  brandSlotRecordConfirmed,
  brandSlotStoredValue,
  isAppwriteNotFound,
  loadBrandStepContext,
  parseSlotRecords,
  profileFacts,
  profileStartCard,
} from '../../../../../../utils/brandStore'
import { streamAdvisorTurn } from '../../../../../../utils/advisorGenerator'
import { claimBrandConverseKey } from '../../../../../../utils/brandConverse'
import {
  BRAND_CONVERSE_HISTORY_MAX,
  BRAND_CONVERSE_MAX_TOKENS,
  BRAND_CONVERSE_PROMPT_VERSION,
  type BrandConverseHistoryTurn,
  brandConversePrompt,
} from '../../../../../../utils/conversePrompt'
import { georgeSystemPrompt } from '../../../../../../utils/georgePrompt'
import { stripGeorgeTurnMarkers } from '../../../../../../utils/georgeTurn'
import { acquireBrandGenerationLock, readBrandAiEnabled, retainBrandGeneration } from '../../../../../../utils/brandGenerators'
import { bookBrandAiQuota } from '../../../../../../utils/brandAiQuota'
import { recordBrandEvent } from '../../../../../../utils/brandEvents'

/**
 * DIE KONVERSATIONS-RUNDE (P3.2, Audit-Befund B5b) — der Berater REAGIERT.
 *
 * Bis hierher verschwand jede getippte Antwort ins Feld, und die nächste Frage
 * erschien mechanisch. Das Audit nannte es „Formular-Gefühl statt Gespräch";
 * Davids Leitsatz nennt den Grund: „Die Qualität der Antworten wird durchs
 * INTERVIEW bestimmt." Diese Route ist das Interview: EIN Zug nach der
 * Zug-Regel — würdigen, nachhaken oder respektvoll weitergehen, und dann die
 * nächste offene Frage in eigenen Worten.
 *
 * ── SIE SCHREIBT KEINEN SLOT. GAR KEINEN. ─────────────────────────────────
 * Es gibt in dieser Datei keinen Pfad, der `brand_steps.slots`, `inputHash`,
 * `latestDraft` oder `revision` anfasst — kein `slot.ready`-Frame, kein
 * Generations-Eintrag, keine Fassung. Der ganze Zug IST Nachricht. Die Antwort
 * des Menschen steht längst im Feld (normaler Autosave, vor diesem Aufruf
 * ausgespült); sie hier ein zweites Mal zu schreiben hiesse, zwei Wahrheiten
 * über denselben Text zu führen.
 *
 * ── DIE FRAMES SIND DIE DER GENERIERUNG, UND DAS IST KEINE ANLEIHE ────────
 * `generation.started` · `message.delta` · `generation.completed` /
 * `generation.failed` — dasselbe Protokoll, derselbe Leser
 * (`decodeBrandGenerationChunk`), dieselben Store-Aktionen im Browser. Ein
 * zweites Wire-Format für „Text tröpfelt in eine Sprechblase" hätte einen
 * zweiten Parser und eine zweite Zustandsmaschine gekostet, ohne etwas anderes
 * zu übertragen.
 *
 * `slot.ready` kommt NIE — und genau das ist der Beweis, dass hier kein Feld
 * gefüllt wird. `outcome: 'question'` im Abschluss-Frame sagt dasselbe in der
 * Sprache, die dieser Layer schon hat: „es gibt keinen Slot-Text, kein
 * `slot.ready` und keine Entwurfs-Markierung, nur einen Zug im Verlauf"
 * (`shared/brandGeneration.ts`). Die mitgeschickte `revision` ist die GELESENE
 * des Bausteins, nicht eine neue: sie kann den Autosave nie überholen.
 *
 * ── DER KILL-SWITCH ANTWORTET MIT 200, NICHT MIT EINEM FEHLER ────────────
 * Ist `brandAiEnabled` aus, gibt es kein SSE und keinen Fehler, sondern
 * `{ conversed: false }` — und die Werkstatt verhält sich exakt wie vor P3.2:
 * die Antwort steht im Feld, die nächste Frage erscheint. Ein Strom mit
 * `ai_disabled` wäre hier die falsche Form: bei der GENERIERUNG hat der Mensch
 * einen Knopf gedrückt und erwartet etwas, hier hat er eine Antwort getippt und
 * bekommt sein Formular-Verhalten von gestern. Ein Hinweis dafür wäre Lärm über
 * eine Zusatzleistung, die er nie gesehen hat.
 *
 * Dieselbe Antwort gibt es für einen WIEDERHOLTEN Idempotenzschlüssel und für
 * einen Zug, der an der Baustein-Sperre hängt (`brandConverse.ts`): `conversed:
 * false` heisst „es kommt kein Zug", und WARUM ist Sache des Servers.
 *
 * ── DIE DROSSEL BUCHT — UND ZWAR AUF IHREN EIGENEN EIMER ─────────────────
 * §6 zählt die freie Rückfrage ausdrücklich als Generierung. Gebucht wird
 * deshalb VOR dem Strom (429 mit `data.code`, wie bei der Generierung), aber
 * auf `brand-ai-talk-day:<profileId>` statt auf den Slot-Eimer der Frage — die
 * Begründung steht im Kopf von `shared/brandAiLimits.ts`. Anders als bei einem
 * Entwurf gibt es hier keinen kostenlosen Fall: jeder Zug ist ein echter
 * Anbieter-Aufruf, es gibt keinen Dev-Stub und keinen Cache-Treffer.
 *
 * ── PERSISTENZ VOR `completed`, UND DIE ANTWORT VOR DEM ZUG ──────────────
 * Erst die Nachricht des MENSCHEN, dann der Strom, dann die Nachricht des
 * BERATERS, dann das Abschluss-Frame. Die Reihenfolge ist die Lesbarkeit des
 * Verlaufs: `brand_messages` wird nach `$id` sortiert gelesen, und eine Antwort
 * vor ihrer Frage wäre ein Protokoll, das niemand mehr versteht.
 *
 * Die Nachricht des Menschen ist FAIL-SOFT (ihre Substanz steht im Feld), die
 * des Beraters nicht: sie IST das Ergebnis dieses Laufs, und ein „fertig" für
 * einen Text, den ein Reload nicht mehr findet, wäre eine Lüge — deshalb
 * `persist_failed`.
 *
 * ── LOG-REGEL §6 ─────────────────────────────────────────────────────────
 * Logzeilen und `brand_events` tragen Baustein, Slot-Id, Modell, Dauer und
 * Fehlercode — NIE den getippten Text, NIE den Prompt, NIE die Antwort.
 */

export default defineEventHandler(async (event): Promise<BrandConverseSkippedResponse | undefined> => {
  const started = Date.now()
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow } = await loadBrandStepContext(event, userId)

  const parsed = createBrandConverseSchema().safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ status: 400, statusText: 'Invalid converse payload', data: { code: 'invalid_body' } })
  }
  const body = parsed.data

  // Der Slot ist hier nur ein ETIKETT für die Verlaufs-Zeile — geschrieben wird
  // er nicht. Trotzdem wird er geprüft: eine Zeile, die auf einen fremden
  // Baustein zeigt, wäre ein Verlauf, den kein Leser mehr zuordnen kann.
  if (body.slotId) {
    const slot = slotById(body.slotId)
    if (!slot || slot.stepId !== stepKey) {
      throw createError({ status: 400, statusText: 'Unknown slot', data: { code: 'unknown_slot' } })
    }
  }

  /**
   * WELCHE FRAGE IST DRAN — gerechnet aus der REGISTRY und dem gespeicherten
   * Stand, nie aus dem Rumpf. Der Client steuert genau eine Sache bei, die der
   * Server nicht haben kann: den lokal übersprungenen Rest („Weiß ich nicht"),
   * und der kann nur absagen, nie umordnen.
   */
  const records = parseSlotRecords(stepRow.slots)
  const skipped = new Set(body.skipped ?? [])
  const facts: Record<string, BrandSlotStateFacts> = {}
  for (const slot of slotsForStep(stepKey)) {
    facts[slot.id] = {
      hasValue: brandSlotStoredValue(records[slot.id]).length > 0 || skipped.has(slot.id),
      confirmed: brandSlotRecordConfirmed(records[slot.id]),
    }
  }
  const next = resolveNextQuestion(stepKey, facts)
  // Der Wortlaut zählt NUR, wenn er zu der Frage gehört, die der Server selbst
  // als nächste sieht. Sonst bekommt der Berater gesagt, dass er keine erfinden
  // darf (`nextQuestionKnown: false`) — die Reihenfolge gehört der Registry.
  const nextQuestion = next && body.nextSlotId === next.slotId ? (body.nextQuestion ?? '').trim() : ''

  /**
   * WELCHE FRAGE DIESER ZUG STELLT — für die Oberfläche, nicht für den Prompt.
   *
   * Sie reist als `slotId` in den Frames, und die Werkstatt entscheidet daran
   * die eine Sache, die sie sonst raten müsste: ob unter dem Zug noch die
   * Katalog-Frage stehen soll. Hat der Berater sie gerade selbst gestellt, wäre
   * sie eine Wiederholung; hat er (Wortlaut fehlt, Kapitel fertig) auf sie
   * verwiesen oder gar keine gestellt, steht hier `''` und die Katalog-Frage
   * bleibt sichtbar. Aus dem AUSBLEIBEN eines Frames wäre das nicht zu lesen.
   */
  const askedSlotId = nextQuestion ? (next?.slotId ?? '') : ''

  const aiEnabled = await readBrandAiEnabled(event)
  if (!aiEnabled) return { conversed: false }

  const turnId = ID.unique()

  /**
   * DIESELBE SPERRE WIE DIE GENERIERUNG, und das mit Absicht: in EINEM
   * Baustein spricht der Berater zu einer Zeit. Wer antwortet, während George
   * noch an einem Entwurf schreibt, bekommt keinen zweiten Zug in dieselbe
   * Spalte — seine Antwort ist trotzdem gespeichert und die nächste Frage steht
   * da. Sie wird VOR der Buchung gezogen: ein Zug, der ohnehin nicht läuft,
   * darf kein Kontingent verbrauchen.
   */
  const lock = acquireBrandGenerationLock(profile.$id, stepKey, turnId)
  if (!lock) return { conversed: false }

  /**
   * Ein wiederholter Zug kostet kein zweites Mal (s. `brandConverse.ts`) — und
   * zwar NACH der Sperre: ein Schlüssel, der schon an einer belegten Sperre
   * verbraucht würde, wäre beim nächsten ehrlichen Versuch aufgebraucht. Der
   * gleichzeitige Doppelklick fällt ohnehin schon der Sperre zum Opfer; dieser
   * Schlüssel fängt den NACHZÜGLER, der kommt, wenn alles längst durch ist.
   */
  if (!claimBrandConverseKey(userId, body.idempotencyKey)) {
    lock.release()
    return { conversed: false }
  }

  const burst = retainBrandGeneration(userId)
  const rejection = await bookBrandAiQuota(event, {
    userId,
    profileId: profile.$id,
    kind: 'talk',
  })
  if (rejection) {
    burst.release()
    lock.release()
    logEvent('info', 'brand.converse_throttled', { stepKey, code: rejection.code })
    setHeader(event, 'Retry-After', rejection.retryAfterSec)
    throw createError({
      status: 429,
      statusText: 'Brand conversation limit reached',
      data: { code: rejection.code },
    })
  }

  const { tablesDB, databaseId } = brandDb(event)

  /**
   * DER VERLAUF, DEN DER BERATER SIEHT: die letzten Nachrichten dieses
   * Bausteins. Gelesen wird ABSTEIGEND mit Limit und danach umgedreht — die
   * andere Richtung müsste die ganze Historie holen, um die letzten sechs zu
   * finden.
   *
   * FAIL-SOFT: ein unlesbarer Verlauf kostet den Zug nicht. Der Berater
   * antwortet dann ohne Gedächtnis, und das ist immer noch besser als gar keine
   * Reaktion — die Werte des Bausteins reisen ohnehin mit.
   */
  const history: BrandConverseHistoryTurn[] = []
  try {
    const res = await tablesDB.listRows<BrandMessageRow>({
      databaseId,
      tableId: BRAND_MESSAGES_TABLE,
      queries: [
        Query.equal('profileId', profile.$id),
        Query.equal('stepKey', stepKey),
        Query.orderDesc('$id'),
        Query.limit(BRAND_CONVERSE_HISTORY_MAX),
      ],
    })
    for (const row of [...res.rows].reverse()) {
      history.push({
        role: row.role === 'user' || row.role === 'system' ? row.role : 'george',
        body: row.body,
      })
    }
  }
  catch (error) {
    if (!isAppwriteNotFound(error)) {
      logEvent('warn', 'brand.converse_history_failed', {
        stepKey,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * DIE ANTWORT DES MENSCHEN WIRD ZUERST GESCHRIEBEN — vor dem Strom, damit sie
   * im Verlauf VOR der Reaktion steht (Sortierung nach `$id`).
   *
   * FAIL-SOFT, aus demselben Grund wie bei der Generierung: ihre SUBSTANZ steht
   * im Feld und ist über den Autosave längst gespeichert. Die Zeile hier ist das
   * Protokoll des Gesagten, nicht der Inhalt — und sie ist bewusst eine ZWEITE
   * Fassung: ändert der Mensch das Feld später, bleibt hier stehen, was er
   * damals geschrieben hat. Genau das macht die Reaktion des Beraters
   * nachvollziehbar.
   */
  let userMessageId: string | null = null
  try {
    const row = await tablesDB.createRow({
      databaseId,
      tableId: BRAND_MESSAGES_TABLE,
      rowId: ID.unique(),
      data: {
        profileId: profile.$id,
        stepKey,
        role: 'user',
        body: body.text,
        // `kind: 'answer'` ist additiv neben 'draft'/'question' aus der
        // Generierung. Ohne `slotId` war es eine freie Frage.
        parts: JSON.stringify({ kind: 'answer', ...(body.slotId ? { slotId: body.slotId } : {}) }),
        generationId: turnId,
      },
    })
    userMessageId = row.$id
  }
  catch (error) {
    logEvent('warn', 'brand.converse_user_message_failed', {
      stepKey,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const res = event.node.res
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    // Ohne diesen Kopf puffert nginx den Strom (s. generate.post.ts).
    'X-Accel-Buffering': 'no',
  })

  function send<N extends BrandGenerationEventName>(type: N, data: BrandGenerationEventDataMap[N]): void {
    if (res.writableEnded) return
    res.write(serializeBrandGenerationEvent(type, data))
  }

  // Gibt `undefined` zurück, damit die Ausgänge `return fail(…)` schreiben
  // können: der Rückgabetyp des Handlers ist die Kill-Switch-Antwort ODER
  // nichts, und `void` ist in einer Union kein gültiger Teilnehmer.
  function fail(code: BrandGenerationFailureCode): undefined {
    send('generation.failed', { generationId: turnId, code })
    logEvent('warn', 'brand.converse_failed', { stepKey, code, ms: Date.now() - started })
    void recordBrandEvent(event, {
      type: 'conversation.failed',
      profileId: profile.$id,
      userId,
      payload: { stepKey, code },
    })
    res.end()
    return undefined
  }

  const abort = new AbortController()
  event.node.req.on('close', () => abort.abort())

  try {
    // `slotId` ist hier die FRAGE, die dieser Zug stellt — nie ein Feld, das er
    // füllt. `''` heisst: er stellt keine aus dem Katalog (s. `askedSlotId`).
    send('generation.started', { generationId: turnId, slotId: askedSlotId, stepKey })

    // Die TECHNIK des Kapitels, nicht sein Sprecher: gesprochen wird jeder Zug
    // von George (Davids Eine-Stimme-Entscheidung 2026-09-02).
    const technique = techniqueForStep(stepKey)
    const uiLocale = resolveBrandUiLocale(body.uiLocale, profile.contentLocale)

    const system = georgeSystemPrompt({
      locale: uiLocale,
      contentLocale: profile.contentLocale,
      pathKind: profileFacts(profile).pathKind,
      technique,
    })

    const prompt = brandConversePrompt(
      { hasNextQuestion: Boolean(next), nextQuestionKnown: nextQuestion.length > 0 },
      {
        startCard: profileStartCard(profile),
        slots: slotsForStep(stepKey).map(slot => ({
          slotId: slot.id,
          value: brandSlotStoredValue(records[slot.id]),
        })),
        history,
        answeredQuestion: body.question ?? '',
        text: body.text,
        nextQuestion,
      },
    )

    let turn: Awaited<ReturnType<typeof streamAdvisorTurn>>
    try {
      turn = await streamAdvisorTurn({
        event,
        system,
        prompt,
        maxTokens: BRAND_CONVERSE_MAX_TOKENS,
        signal: abort.signal,
        onDelta: (text: string) => { send('message.delta', { generationId: turnId, text }) },
      })
    }
    catch (error) {
      logEvent('error', 'brand.converse_provider_error', {
        stepKey,
        // Die MELDUNG des Anbieters, nicht der Prompt und nicht die Antwort.
        message: error instanceof Error ? error.message : String(error),
      })
      return fail('provider_error')
    }

    if (turn.aborted || abort.signal.aborted) return fail('aborted')

    // Ein Konversations-Zug kennt keine Marker — hätte das Modell trotzdem
    // welche gesetzt (es schreibt in anderen Zügen mit `BASIS:`/`ASK:`), fielen
    // sie hier weg statt in den Verlauf zu wandern.
    const message = stripGeorgeTurnMarkers(turn.text).trim()
    if (!message) return fail('empty_result')

    let messageId: string
    try {
      const row = await tablesDB.createRow({
        databaseId,
        tableId: BRAND_MESSAGES_TABLE,
        rowId: ID.unique(),
        data: {
          profileId: profile.$id,
          stepKey,
          role: 'george',
          body: message,
          // Dieselbe `generationId` wie die Antwort, auf die sie reagiert — so
          // gehören Frage und Reaktion im Verlauf sichtbar zusammen.
          parts: JSON.stringify({ kind: 'reply', ...(body.slotId ? { slotId: body.slotId } : {}) }),
          generationId: turnId,
        },
      })
      messageId = row.$id
    }
    catch (error) {
      logEvent('error', 'brand.converse_persist_failed', {
        stepKey,
        message: error instanceof Error ? error.message : String(error),
      })
      return fail('persist_failed')
    }

    send('generation.completed', {
      generationId: turnId,
      slotId: askedSlotId,
      // GELESEN, nicht erhöht: dieser Zug hat nichts geschrieben, was eine neue
      // Fassung rechtfertigte.
      revision: stepRow.revision ?? 0,
      messageId,
      model: turn.model,
      promptVersion: BRAND_CONVERSE_PROMPT_VERSION,
      createdAt: new Date().toISOString(),
      reused: false,
      // Kein Feldwert — dieselbe Bedeutung wie bei einer Rückfrage.
      outcome: 'question',
    })
    logEvent('info', 'brand.converse_completed', {
      stepKey,
      slotId: body.slotId ?? '',
      model: turn.model,
      provider: turn.provider,
      hasNextQuestion: Boolean(next),
      ms: Date.now() - started,
    })
    void recordBrandEvent(event, {
      type: 'conversation.turn',
      profileId: profile.$id,
      userId,
      // KENNZAHLEN, kein Inhalt: „wie oft antwortet jemand ohne Frage-Slot"
      // (freie Fragen) ist die Zahl, an der man merkt, ob das Panel als
      // Gespräch verstanden wird.
      payload: {
        stepKey,
        slotId: body.slotId ?? '',
        free: !body.slotId,
        answered: userMessageId !== null,
        model: turn.model,
        ms: Date.now() - started,
      },
    })
    res.end()
  }
  finally {
    lock.release()
    burst.release()
  }
})
