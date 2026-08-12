/**
 * AUTOMATISCHES NACHPRÜFEN, SOLANGE DIE SEITE OFFEN IST (U16, Wettbewerb E6.4).
 *
 * Es ist ausdrücklich KEIN Hintergrund-Job und kein zweiter Ablauf neben dem
 * „Prüfen"-Knopf — der bleibt (der Audit lobt ihn ausdrücklich, Circle, Mighty,
 * Bettermode und Heartbeat machen es genauso). Das hier erspart nur das
 * KLICKEN beim Warten: der Owner hat gerade seine DNS-Einträge angelegt, sieht
 * „wir warten auf deine Einträge" und müsste sonst alle paar Minuten selbst
 * drücken.
 *
 * VIER REGELN, und jede hat einen Grund:
 *  1. **Nur solange etwas offen ist** (`active`) — sobald die Domain aktiv ist
 *     oder die Seite gar keine Domain kennt, hört es auf. Ein Takt, der
 *     ewig weiterläuft, ist eine Anfrage-Quelle ohne Zweck.
 *  2. **Pause bei `document.hidden`.** Ein weggeschalteter Tab braucht keinen
 *     frischen Stand; jeder Lauf kostet DNS-Abfragen, einen ploi-Aufruf und
 *     eine HTTPS-Probe auf der Kundendomain.
 *  3. **Beim Zurückkommen sofort einmal** — der Fall, für den das Ganze
 *     gebaut ist: der Owner war beim Domain-Anbieter und kommt zurück. Mit
 *     MINDESTABSTAND (`intervalMs`), sonst löst jedes Tab-Wechseln eine
 *     Prüfung aus (dasselbe Muster wie `accountVerifyDue`, G5).
 *  4. **Nie zwei gleichzeitig**, und ein Fehlschlag ist still: ein
 *     automatischer Lauf, der alle 30 s eine Fehlermeldung einblendet, wäre
 *     schlimmer als gar keiner. Die Meldung gehört dem Knopf.
 *
 * Bewusst OHNE Realtime: es gibt nichts zu abonnieren — die Wahrheit liegt im
 * DNS der Welt, nicht in einer Zeile, die jemand schreibt.
 */
export interface DomainAutoCheckOptions {
  /**
   * Soll gerade nachgeprüft werden? (Domain eingetragen UND noch nicht aktiv.)
   *
   * Als GETTER, nicht als `Ref`: der Aufrufer hat dort ein `computed`, und ein
   * `ComputedRef` ist nur lesbar — als `Ref<boolean>` deklariert würde das im
   * strict-Modus zur Typreibung an der Aufrufstelle. Ein Getter passt auf
   * beides.
   */
  active: () => boolean
  /** Der bestehende Prüf-Aufruf. Muss selbst still sein — kein Toast. */
  run: () => Promise<void>
  /** Abstand zwischen zwei Läufen. */
  intervalMs?: number
}

export function useDomainAutoCheck(options: DomainAutoCheckOptions): void {
  const intervalMs = options.intervalMs ?? 30_000
  // SSR hat weder Timer noch Sichtbarkeit — und ein Prüf-Lauf beim
  // Seitenaufbau wäre eine Nebenwirkung des blossen Renderns.
  if (import.meta.server) return

  let timer: ReturnType<typeof setInterval> | null = null
  let running = false
  let lastRunAt = 0

  async function tick(): Promise<void> {
    if (!options.active() || running) return
    if (document.hidden) return
    if (Date.now() - lastRunAt < intervalMs) return
    running = true
    lastRunAt = Date.now()
    try {
      await options.run()
    }
    catch {
      // Still: der automatische Lauf darf nie eine Meldung erzeugen.
    }
    finally {
      running = false
    }
  }

  function onVisibility(): void {
    if (!document.hidden) void tick()
  }

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    // Der Takt läuft durchgehend; ob er etwas TUT, entscheidet `tick()`.
    // Ein Start/Stopp am `active`-Wechsel wäre eine zweite Zustandsmaschine
    // für dieselbe Frage.
    timer = setInterval(() => void tick(), intervalMs)
    // Die erste Messung macht die Seite selbst (`load()`); der Takt setzt
    // deshalb hier schon die Uhr, damit er nicht sofort hinterherschiebt.
    lastRunAt = Date.now()
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
