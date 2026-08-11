import type { FunnelEvent } from '../../shared/funnelEvents'

/**
 * Ein Trichter-Ereignis an Plausible melden — oder still nichts tun (U18).
 *
 * KEIN EIGENER TRANSPORT. Gemeldet wird ausschließlich über das `plausible()`
 * des EINGEBUNDENEN Scripts. Das ist der ganze Datenschutz-Entwurf dieser
 * Datei: das Script hängt am doppelten Gate aus `app/plugins/analytics.ts`
 * (`pukalani.analytics.enabled` + ggf. `pukalani.consent`), und was dort nicht
 * geladen wurde, gibt es hier auch nicht. Ein eigener `fetch` auf
 * `/api/event` würde genau an diesem Gate vorbei messen.
 *
 * WIE MAN „DAS SCRIPT IST DA" ERKENNT: das v3-Snippet legt `window.plausible`
 * als Warteschlangen-Funktion an, BEVOR die Datei geladen ist — der Aufruf
 * geht also auch beim ersten Klick nicht verloren. Fehlt die Funktion, ist
 * entweder kein Script eingebunden (Kontroll-Hosts, Community ohne Messung,
 * `provider: 'umami'`) oder die Zustimmung steht aus. Beides heißt hier:
 * zurück, ohne Spur.
 *
 * NUR IM BROWSER. Ein Trichter-Punkt ist immer eine HANDLUNG (Klick, Absenden,
 * Ankommen auf einer Seite); im SSR gibt es weder `window` noch einen
 * Handelnden, und ein serverseitiger Zähler würde jeden Crawler mitzählen.
 */
type PlausibleFn = (event: string, options?: { props?: Record<string, string> }) => void

export function useFunnelEvent() {
  /**
   * @param name  Ereignis aus der festen Liste (shared/funnelEvents.ts).
   * @param props Optionale Eigenschaften — nur Zeichenketten, weil Plausible
   *              Eigenschaften als Text führt.
   */
  function trackFunnel(name: FunnelEvent, props?: Record<string, string>): void {
    if (!import.meta.client) return

    const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible
    if (typeof plausible !== 'function') return

    try {
      plausible(name, props ? { props } : undefined)
    }
    catch {
      // Eine Statistik darf keine Handlung kosten: der Klick, an dem dieser
      // Aufruf hängt, muss auch dann durchgehen, wenn das Script hustet.
    }
  }

  return { trackFunnel }
}
