import type { MaybeRefOrGetter } from 'vue'
import { useBrandWorkspaceStore, brandErrorReason } from '../stores/brandWorkspace'
import type { BrandStepDetailResponse, BrandStepSaveResponse } from '../../shared/types/brand'

/**
 * DER AUTOSAVE-TAKT (Plan §3e „Autosave-Client-Regel", wörtlich):
 * ~750 ms nach der letzten Änderung, ZUSÄTZLICH bei Blur und VOR interner
 * Navigation · nur GEÄNDERTE Slots · der Request trägt die GELESENE
 * `revision` · die Antwort setzt neue `revision` + normalisierte Slots · bei
 * 409 wird NIE überschrieben · bei Verbindungsverlust bleibt die Eingabe im
 * offenen Tab und wird nach Wiederverbindung erneut gespeichert.
 *
 * Die RECHNUNG dahinter liegt in `shared/brandAutosaveDiff.ts` (pure,
 * getestet); hier steht nur die Zeitsteuerung und der Transport.
 *
 * ── DER 409 TRÄGT SEINE DATEN NICHT MIT (Befund P1c) ──────────────────────
 * Die PATCH-Route legt der Ablehnung `{ code, revision, slots }` bei, und
 * `BrandStepConflictData` beschreibt genau das. Beim CLIENT kommt davon nichts
 * an: der zentrale Fehler-Handler (`packages/core/server/error.ts`) hebt
 * AUSSCHLIESSLICH `data.code` als `reason` ins Envelope und lässt die restliche
 * `data` bewusst draußen (keine Appwrite-Details). Deshalb holt dieser Code die
 * Serverfassung mit EINEM zusätzlichen GET nach, statt sie aus dem Fehler zu
 * lesen. Das kostet einen Roundtrip im seltensten Fall und ist die einzige
 * Variante, die ohne Eingriff in den Core auskommt; die Alternative wäre, den
 * Konflikt als 200 mit Sonder-Rumpf zu beantworten — dann wäre eine Ablehnung
 * keine Ablehnung mehr.
 *
 * ── EIN LAUF ZUR ZEIT ─────────────────────────────────────────────────────
 * Zwei gleichzeitige PATCH desselben Bausteins erzeugten einen 409 GEGEN SICH
 * SELBST (der zweite trägt die `revision` von vor dem ersten). Läuft schon
 * einer, wird der nächste gemerkt und danach nachgeholt.
 */

/** §3e: „Autosave ~750 ms nach letzter Änderung". */
export const BRAND_AUTOSAVE_DELAY_MS = 750

export function useBrandAutosave(profileId: MaybeRefOrGetter<string>) {
  const store = useBrandWorkspaceStore()

  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let rerun = false
  /**
   * WIE OFT DER LETZTE VERSUCH SCHEITERTE (2026-09-03, Davids Live-Fund):
   * der `error`-Zustand SAGTE „wir versuchen es erneut", aber nichts
   * versuchte es — nur das `online`-Ereignis und weiteres Tippen. Ein PATCH,
   * der in einen Deploy-Reload läuft (502 von nginx, während pm2 die App
   * neu lädt), blieb damit für immer als „Nicht gespeichert" stehen, obwohl
   * der Server zwei Sekunden später wieder da war. Jetzt gilt der Text:
   * Wiederholung mit Backoff (4 s verdoppelnd, Deckel 60 s) — die Eingabe
   * liegt ja weiter in `pendingSlots`, ein Versuch kostet einen Request.
   */
  let errorRetries = 0

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  /** Nach dem Tippen: entprellt. */
  function schedule(): void {
    if (import.meta.server) return
    cancel()
    timer = setTimeout(() => { void flush() }, BRAND_AUTOSAVE_DELAY_MS)
  }

  async function loadConflictVersion(id: string): Promise<void> {
    if (!store.stepKey) return
    try {
      const detail = await $fetch<BrandStepDetailResponse>(
        `/api/brand/profiles/${id}/steps/${store.stepKey}`,
      )
      store.applyConflict({ revision: detail.revision, slots: detail.slots })
    }
    catch {
      // Die Serverfassung ist nicht lesbar — der Konflikt gilt trotzdem, und
      // zwar mit dem, was wir haben. Alles andere hiesse: nach einem
      // gescheiterten Nachschlag doch überschreiben.
      store.applyConflict({ revision: store.revision, slots: store.serverSlots })
    }
  }

  function isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  }

  /** Sofort speichern (Blur, Navigation, Bestätigen). */
  async function flush(): Promise<void> {
    cancel()
    if (import.meta.server) return
    if (running) { rerun = true; return }
    if (!store.stepKey || !store.autosaveAllowed || !store.hasPendingWork) return

    const id = toValue(profileId)
    // Der ABGESCHICKTE Wert wird festgehalten: die Antwort trägt keine
    // Konfidenz, und nur wer weiss, was er gesendet hat, kann sie hinterher
    // als gespeichert verbuchen (s. `applySaveResponse`).
    const sentConfidence = store.pendingConfidence
    const body = {
      // Die GELESENE Fassung — nicht die, die gerade entsteht.
      revision: store.revision,
      slots: store.pendingSlots,
      ...(sentConfidence ? { confidence: sentConfidence } : {}),
    }

    running = true
    store.mark('start')
    try {
      const response = await $fetch<BrandStepSaveResponse>(
        `/api/brand/profiles/${id}/steps/${store.stepKey}`,
        { method: 'PATCH', body },
      )
      store.applySaveResponse(response, sentConfidence)
      errorRetries = 0
    }
    catch (error) {
      const status = (error as { status?: number, statusCode?: number }).status
        ?? (error as { statusCode?: number }).statusCode
        ?? null
      const reason = brandErrorReason(error)
      if (reason === 'slot_confirmed') {
        // BACKSTOP, kein Konflikt: die Werkstatt lässt an einem bestätigten
        // Slot gar nicht erst tippen (`brandSlotControls`). Kommt es doch dazu
        // — ein zweiter Tab hat inzwischen bestätigt —, wäre ein
        // Wiederholungsversuch ewig: der Server sagt endgültig Nein, und der
        // 409-Dialog fragte nach einer Entscheidung, die es nicht gibt. Also
        // die Serverfassung holen; sie IST die bestätigte Wahrheit, und der
        // Slot steht danach sichtbar im bestätigten Zustand.
        if (store.stepKey) await store.loadStep(id, store.stepKey)
      }
      else if (status === 409 || reason === 'revision_conflict') {
        await loadConflictVersion(id)
      }
      else if (status === null || isOffline()) {
        // Kein HTTP-Status heisst: die Anfrage hat den Server nie erreicht.
        // Die Eingabe bleibt stehen, der `online`-Horcher holt sie nach.
        store.mark('offline')
      }
      else {
        store.mark('error')
        // s. `errorRetries` — der Zustandstext verspricht die Wiederholung.
        // ABER: nur, was vorbeigehen KANN, wird wiederholt (5xx, 429). Ein
        // 400 ist ein endgültiges Nein zur GLEICHEN Eingabe — die Schleife
        // hämmerte sonst für immer denselben Fehler (live erwischt beim
        // step_locked-Befund, Davids Durchspiel-Audit 2026-09-03); dort
        // bleibt der Fehlerzustand stehen, bis Tippen oder `online` einen
        // NEUEN Versuch mit neuem Inhalt auslösen.
        if (status === 429 || (status !== null && status >= 500)) {
          errorRetries += 1
          cancel()
          timer = setTimeout(() => { void flush() }, Math.min(4_000 * 2 ** (errorRetries - 1), 60_000))
        }
      }
    }
    finally {
      running = false
      if (rerun) {
        rerun = false
        schedule()
      }
    }
  }

  function onOnline(): void {
    if (store.syncState === 'offline' || store.syncState === 'error') void flush()
  }

  if (import.meta.client) {
    onMounted(() => window.addEventListener('online', onOnline))
    onBeforeUnmount(() => {
      window.removeEventListener('online', onOnline)
      cancel()
    })
    // §3e „vor interner Navigation": der Wechsel des Bausteins passiert im
    // selben Tab und würde die offene Eingabe sonst mitnehmen.
    onBeforeRouteLeave(async () => {
      await flush()
    })
  }

  return { schedule, flush, cancel }
}
