<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet'
import type { MemberLocationGroup } from '../../shared/membersMap'

/**
 * DIE WELTKARTE DER MITGLIEDER (Etappe 2, 2026-08-23).
 *
 * Das Leaflet-Muster ist DASSELBE wie im Sitzungs-Dialog
 * (packages/core/app/components/SessionDetailsModal.vue) und aus denselben
 * Gründen — hier steht nur, was ANDERS ist und warum:
 *
 *  - **Dynamischer Import** von Leaflet UND seinem CSS: window-abhängig (nie
 *    SSR) und schwer genug, dass es niemand bezahlen soll, der die
 *    Mitgliederliste ansieht. Erst hier geht eine Anfrage an OpenStreetMap.
 *  - **Init erst bei echter Container-Höhe**: initialisiert Leaflet in einem
 *    0-Pixel-Container, vermisst es sich und rendert eine falsche Zoom-Stufe.
 *  - **`map.remove()`** beim Verlassen: sonst bleiben Instanz und
 *    Fenster-Listener zurück.
 *  - **divIcon statt Standard-Marker**: dessen PNG-Pfade rät Leaflet aus der
 *    CSS-URL und sie brechen im Bundle regelmässig.
 *
 * ── WAS HIER ANDERS IST ────────────────────────────────────────────────────
 *
 * 1. **`scrollWheelZoom` IST AN.** Im Dialog war es aus, weil man dort die
 *    Seite scrollt und in einer kleinen Karte hängenbliebe. Das hier ist die
 *    Hauptfläche der Seite — eine grosse Karte, die auf das Mausrad nicht
 *    reagiert, wirkt kaputt.
 *
 * 2. **Die Welt kachelt nicht** (`noWrap` + `maxBounds`). Ohne das zeichnet
 *    Leaflet Europa beliebig oft nebeneinander, und beim Herausziehen steht
 *    dasselbe Mitglied fünfmal auf dem Schirm — auf einer Karte, die zählt,
 *    ist das keine Kosmetik.
 *
 * 3. **`fitBounds` statt eines festen Zooms.** „Weltkarte" heisst: alle sollen
 *    drauf sein. Sind alle in einer Stadt, wäre eine Totale der Erde eine
 *    leere Fläche mit einem Punkt; sind sie über drei Kontinente verteilt,
 *    passte kein fester Zoom. Ohne Mitglieder bleibt es bei der Totale (Zoom
 *    2) — dann gibt es nichts einzupassen.
 *
 * 4. **Das Icon wird als ELEMENT gebaut, nicht als HTML-Zeichenkette.**
 *    Name und Avatar-URL sind FREMDE EINGABEN (jedes Mitglied schreibt sie
 *    selbst). In eine `html:`-Zeichenkette gesteckt wären sie eine
 *    Einladung zum Einschleusen von Markup; `createElement` +
 *    `textContent`/`src` kann das per Konstruktion nicht. Leaflets `divIcon`
 *    nimmt beides entgegen — die sichere Form kostet nichts.
 *
 * 5. **Der Klick öffnet KEIN Leaflet-Popup**, sondern meldet die Auswahl nach
 *    oben. Ein Popup wäre fremdes HTML ausserhalb von Vue: es folgte weder
 *    dem Theme noch der Sprache, und in einem Test wäre es nur über
 *    Leaflet-internes Markup zu finden.
 */
const props = defineProps<{
  groups: MemberLocationGroup[]
  selectedKey: string | null
}>()

const emit = defineEmits<{ select: [key: string] }>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: LeafletMap | null = null
let layer: LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null
const markerElements = new Map<string, HTMLElement>()

/** Totale der Erde, wenn es nichts einzupassen gibt. */
const WORLD_CENTER: [number, number] = [20, 0]
const WORLD_ZOOM = 2
/** Näher als das ist bei Verzeichnis-Koordinaten (Stadt-Ebene) gelogen. */
const MAX_ZOOM = 12

/** Initialen für den Fall ohne Avatar — dieselbe Idee wie in UserAvatar. */
function initials(group: MemberLocationGroup): string {
  const first = group.members[0]
  const source = (first?.name || first?.handle || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const letters = parts.length > 1
    ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
    : source.slice(0, 2)
  return letters.toUpperCase() || '?'
}

/**
 * Das Marker-Element EINER Gruppe: Avatar (oder Initialen) im weissen Ring,
 * dazu ein Zähler, sobald mehr als ein Mensch an diesem Ort steht.
 *
 * FESTE FARBEN, kein `bg-primary`: die Kacheln sind eine fremde, immer helle
 * Fläche und folgen unserem Theme nicht — `--ui-primary` ist je nach Theme auch
 * mal `white` und der Marker damit unsichtbar (im Sitzungs-Dialog live
 * gemessen).
 */
function markerElement(group: MemberLocationGroup): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'relative size-9 cursor-pointer'
  wrapper.dataset.memberMarker = group.key

  const face = document.createElement('div')
  face.className = 'size-9 overflow-hidden rounded-full bg-slate-700 text-white shadow ring-2 ring-white flex items-center justify-center'

  const first = group.members[0]
  if (first?.avatarUrl) {
    const img = document.createElement('img')
    // `src` als PROPERTY gesetzt, nicht als Markup zusammengebaut: eine
    // Avatar-URL ist fremde Eingabe.
    img.src = first.avatarUrl
    img.alt = ''
    img.className = 'size-full object-cover'
    face.appendChild(img)
  }
  else {
    const text = document.createElement('span')
    text.className = 'text-[11px] font-semibold leading-none'
    text.textContent = initials(group)
    face.appendChild(text)
  }
  wrapper.appendChild(face)

  if (group.members.length > 1) {
    const badge = document.createElement('span')
    badge.className = 'absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white'
    badge.textContent = String(group.members.length)
    wrapper.appendChild(badge)
  }

  return wrapper
}

/** Die Auswahl sichtbar machen — ohne die Marker neu zu bauen. */
function paintSelection(): void {
  for (const [key, element] of markerElements) {
    element.classList.toggle('ring-4', key === props.selectedKey)
    element.classList.toggle('ring-red-500', key === props.selectedKey)
  }
}

async function mountMap(el: HTMLDivElement): Promise<void> {
  const [L] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
  ])

  // Zwischen `await` und hier kann die Seite längst verlassen sein.
  if (mapEl.value !== el) return

  // Auf echte Grösse warten (siehe Kopf) — BEIDE Dimensionen: die Höhe ist
  // per CSS fest (h-[28rem]) und damit sofort da, die BREITE kommt erst mit
  // dem Layout des Dashboard-Panels. Live erwischt (2026-08-23): Init bei
  // Breite 0 ⇒ fitBounds zoomt in die Boxmitte und malt einen Kachel-Streifen.
  // Begrenzt, damit ein nie sichtbarer Container keine Endlosschleife wird.
  for (let i = 0; i < 30 && (el.clientWidth === 0 || el.clientHeight === 0); i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  if (mapEl.value !== el) return

  destroyMap()
  map = L.map(el, {
    center: WORLD_CENTER,
    zoom: WORLD_ZOOM,
    minZoom: 2,
    maxZoom: MAX_ZOOM,
    scrollWheelZoom: true,
    worldCopyJump: false,
    // Die Welt EINMAL: `maxBounds` hält die Ansicht darin, `noWrap` (unten)
    // verhindert die Wiederholung der Kacheln.
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1,
    attributionControl: true,
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAX_ZOOM,
    noWrap: true,
    // Pflicht der OSM-Tile-Usage-Policy — Leaflet zeichnet sie in die Karte.
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  layer = L.layerGroup().addTo(map)
  renderMarkers(L)

  /**
   * GRÖSSENÄNDERUNGEN NACHZIEHEN: Leaflet vermisst den Container genau EINMAL
   * — klappt die Sidebar ein, ändert sich das Fenster oder war der Container
   * beim Init noch (fast) unsichtbar, malt es sonst für immer den alten Stand
   * (der Kachel-Streifen von oben). `invalidateSize` reicht im Normalfall;
   * NUR beim Sprung von „praktisch unsichtbar" auf „echt" wird zusätzlich neu
   * eingepasst — bei einem gewöhnlichen Resize würde das Re-Fit dem Menschen
   * seinen gewählten Ausschnitt wegnehmen.
   */
  let lastWidth = el.clientWidth
  resizeObserver = new ResizeObserver(() => {
    if (!map) return
    const width = el.clientWidth
    const wasTiny = lastWidth < 50
    lastWidth = width
    map.invalidateSize()
    if (wasTiny && width >= 50) fitToGroups()
  })
  resizeObserver.observe(el)
}

function destroyMap(): void {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
  layer = null
  markerElements.clear()
}

/** „Alle drauf" — geteilt von renderMarkers und dem Resize-Nachziehen. */
function fitToGroups(): void {
  if (!map) return
  const points = props.groups.map(group => [group.lat, group.lon] as [number, number])
  if (points.length > 0) {
    map.fitBounds(points, { padding: [48, 48], maxZoom: 8 })
  }
  else {
    map.setView(WORLD_CENTER, WORLD_ZOOM, { animate: false })
  }
}

function renderMarkers(L: typeof import('leaflet')): void {
  if (!map || !layer) return
  layer.clearLayers()
  markerElements.clear()

  for (const group of props.groups) {
    const element = markerElement(group)
    markerElements.set(group.key, element)

    const marker: Marker = L.marker([group.lat, group.lon], {
      keyboard: true,
      title: group.label,
      icon: L.divIcon({
        className: '',
        html: element,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    })
    marker.on('click', () => emit('select', group.key))
    marker.addTo(layer)
  }

  paintSelection()

  // „Alle drauf" statt eines festen Zooms — `fitToGroups` deckelt mit maxZoom
  // den Fall, dass alle am selben Ort stehen (Verzeichnis-Koordinaten geben
  // keine Strassen-Ebene her). Vorher nachmessen: zwischen Warte-Schleife und
  // hier kann das Layout noch gewachsen sein.
  map.invalidateSize()
  fitToGroups()
}

/**
 * Am ELEMENT hängen, nicht an einem Zustand: die Ref ist das einzige
 * verlässliche Signal „der Container steht jetzt".
 */
watch(mapEl, (el) => {
  if (!el) {
    destroyMap()
    return
  }
  void mountMap(el)
})

// Neue Daten (Refresh) ⇒ Marker neu zeichnen, aber die Karte NICHT neu bauen.
watch(() => props.groups, () => {
  if (!map) return
  void import('leaflet').then(L => renderMarkers(L))
})

watch(() => props.selectedKey, paintSelection)

onScopeDispose(destroyMap)
</script>

<template>
  <div
    ref="mapEl"
    class="h-[28rem] w-full overflow-hidden rounded-lg border border-default"
    data-members-map
  />
</template>
