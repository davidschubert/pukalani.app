/**
 * WANN DARF LEAFLET SICH VERMESSEN? — eine Antwort für alle Karten des Hauses
 * (Sitzungs-Dialog, Mitglieder-Weltkarte, Mitglieder-Mini-Karte).
 *
 * ── Das Problem ────────────────────────────────────────────────────────────
 * Leaflet misst seinen Container GENAU EINMAL, beim Anlegen. Steht der zu
 * diesem Zeitpunkt auf (fast) null — Dialog-Transition läuft noch, das
 * Dashboard-Panel legt sein Layout noch, der Tab ist im Hintergrund —, dann
 * ist die Karte DAUERHAFT kaputt: am 2026-08-23 nachgemessen bleibt die
 * Kachel-Ebene bei drei Kacheln stehen, und zwar auch nach `invalidateSize()`,
 * nach echten Größenänderungen des Containers und nach einem Fenster-Resize.
 * Die Karte hat dann ihre volle Breite und trotzdem fast nur graue Fläche.
 * Man kann diesen Zustand nicht reparieren — man muss ihn vermeiden.
 *
 * ── Der erste Reflex, der auch falsch war ──────────────────────────────────
 * Naheliegend ist eine Warteschleife über `requestAnimationFrame`, bis die
 * Maße echt sind. Genau die stand hier und war der zweite Fehler: **in einer
 * nicht sichtbaren Seite feuert rAF nicht** (Hintergrund-Tab, verstecktes
 * Fenster). Die Schleife hängt dort nicht kurz, sondern bis zum
 * Sichtbarwerden — und weil sie VOR dem Anlegen steht, entsteht die Karte in
 * der Zwischenzeit gar nicht. Gemessen: Container vorhanden,
 * `leaflet-container`-Klasse nie gesetzt, null Kacheln, bis zum Neuladen.
 *
 * ── Die Regel ──────────────────────────────────────────────────────────────
 * Nicht warten, sondern BEOBACHTEN. Ein `ResizeObserver` meldet sich, sobald
 * der Container echte Maße hat — auch dann, wenn das erst beim Sichtbarwerden
 * eines Hintergrund-Tabs passiert, und ohne dass irgendwo eine Schleife läuft.
 * Erst dann wird die Karte angelegt; jede spätere Größenänderung zieht nur
 * noch `invalidateSize()` nach.
 *
 * Ein Container, der NIE sichtbar wird, bekommt damit auch nie eine Karte —
 * das ist die richtige Sparsamkeit und kein Verlust: zu sehen gäbe es dort
 * ohnehin nichts.
 */

/**
 * Ab dieser Kantenlänge gilt ein Container als „echt sichtbar". 50 px ist
 * bewusst großzügig gewählt: im Fehlerfall wurden 0 und 2 px gemessen, eine
 * echte Karte ist immer ein Vielfaches davon. Die Zahl muss keine Grenze
 * genau treffen, sondern zwei Welten auseinanderhalten.
 */
const VISIBLE_MIN_PX = 50

export interface MapContainerHandlers {
  /**
   * Läuft GENAU EINMAL, sobald der Container zum ersten Mal echte Maße hat.
   * Hier gehört das Anlegen der Karte hin — vorher wäre sie unrettbar.
   */
  onFirstVisible: () => void
  /** Jede weitere Größenänderung danach. Hier gehört `invalidateSize()` hin. */
  onResize?: () => void
}

/**
 * Beobachtet einen Karten-Container und ruft die Handler nach der Regel oben.
 *
 * @returns Aufräum-Funktion — gehört in dieselbe Hand wie `map.remove()`.
 */
export function observeMapContainer(el: HTMLElement, handlers: MapContainerHandlers): () => void {
  let started = false
  const observer = new ResizeObserver(() => {
    // Absichtlich die LIVE-Maße lesen und nicht die des Eintrags: der Eintrag
    // beschreibt den Moment der Änderung, uns interessiert der Jetzt-Zustand.
    if (el.clientWidth < VISIBLE_MIN_PX || el.clientHeight < VISIBLE_MIN_PX) return
    if (!started) {
      started = true
      handlers.onFirstVisible()
      return
    }
    handlers.onResize?.()
  })
  observer.observe(el)
  return () => observer.disconnect()
}
