<script setup lang="ts">
import type { Map as LeafletMap } from 'leaflet'

/**
 * EIN Ort, EIN Punkt — die kleine Karte auf der Mitglieder-Detailseite.
 *
 * Bewusst NICHT dasselbe Bauteil wie die Weltkarte: die kann Gruppen, Zähler,
 * Auswahl und `fitBounds`, und nichts davon wird hier gebraucht. Ein
 * gemeinsames Bauteil mit fünf Schaltern wäre schwerer zu lesen als zwei
 * kleine — geteilt wird das MUSTER (dynamischer Import, Init erst bei echter
 * Container-Höhe, `remove()` beim Verlassen, divIcon statt Marker-PNG), nicht
 * der Code.
 *
 * `scrollWheelZoom` ist AUS, wie im Sitzungs-Dialog: das hier ist ein Detail
 * neben Text, man scrollt die Seite und soll nicht in der Karte hängenbleiben.
 *
 * Zoom 12 = Stadt-Ebene. Näher wäre gelogen: die Koordinaten kommen aus einem
 * Orts-Verzeichnis, nicht aus einer Adresse.
 */
const props = defineProps<{ lat: number, lon: number }>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: LeafletMap | null = null

const MAP_ZOOM = 12

function destroyMap(): void {
  map?.remove()
  map = null
}

async function mountMap(el: HTMLDivElement, center: [number, number]): Promise<void> {
  const [L] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
  ])
  if (mapEl.value !== el) return

  for (let i = 0; i < 30 && el.clientHeight === 0; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  if (mapEl.value !== el) return

  destroyMap()
  map = L.map(el, { center, zoom: MAP_ZOOM, scrollWheelZoom: false, attributionControl: true })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  // Rot mit weissem Ring liest sich auf jeder Kachel und in jedem Theme gleich
  // (die Kacheln folgen unserem Theme nicht).
  L.marker(center, {
    keyboard: false,
    icon: L.divIcon({
      className: '',
      html: '<span class="block size-3 rounded-full bg-red-500 shadow ring-2 ring-white"></span>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
  }).addTo(map)

  requestAnimationFrame(() => {
    map?.invalidateSize()
    map?.setView(center, MAP_ZOOM, { animate: false })
  })
}

watch([mapEl, () => [props.lat, props.lon] as [number, number]], ([el, center]) => {
  if (!el) {
    destroyMap()
    return
  }
  void mountMap(el, center)
}, { immediate: true })

onScopeDispose(destroyMap)
</script>

<template>
  <div
    ref="mapEl"
    class="h-56 w-full overflow-hidden rounded-lg border border-default"
    data-member-mini-map
  />
</template>
