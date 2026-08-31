/**
 * DIE RECHNUNG HINTER DEM AUTOSAVE — was ist geändert, was ist ein No-op, und
 * wie bewegt sich der sichtbare Zustand (Plan §3e „Autosave-Client-Regel").
 *
 * PURE, ohne Nuxt und ohne `$fetch` — dasselbe Muster wie `brandJourney.ts`:
 * die Regel liegt in `shared/`, der Store und das Composable legen nur den
 * Transport darum. So ist sie ohne laufenden Server prüfbar, und die Fälle, die
 * im Browser Minuten kosten (zwei Tabs, Verbindungsabbruch, ein 409 mitten im
 * Tippen), sind hier drei Zeilen Test.
 *
 * ── NUR GEÄNDERTE SLOTS GEHEN RAUS ────────────────────────────────────────
 * §3e sagt es wörtlich. Der Grund ist nicht Sparsamkeit, sondern die
 * No-op-Regel der PATCH-Route: ein Rumpf, der jeden Slot mitschickt, sähe für
 * den Server nach Arbeit aus, erhöhte `revision` bei jedem Tick — und die
 * 409-Erkennung würde zum Zufallsgenerator, weil ein zweiter offener Tab dann
 * IMMER eine veraltete Fassung hätte. `diffBrandSlots` ist deshalb die Stelle,
 * an der „nichts getippt" auch wirklich „nichts gesendet" heisst.
 *
 * ── DER ANGEZEIGTE WERT IST NICHT `confirmed` ─────────────────────────────
 * Ein Slot trägt drei Fassungen (Versions-Vertrag, Schema-Anhang §2):
 * `firstDraft` (bleibt für immer stehen), `latestDraft` (jede Eingabe) und
 * `confirmed` (dem der Mensch zugestimmt hat). Der EDITOR zeigt den neuesten
 * Text, also `latestDraft`; `confirmed` ist ein Zustand daneben, kein anderer
 * Text. Wer hier `confirmed` bevorzugte, würde eine Bearbeitung NACH der
 * Bestätigung beim nächsten Laden stillschweigend zurücknehmen.
 *
 * ── EIN KONFLIKT IST KLEBRIG ──────────────────────────────────────────────
 * `nextBrandSyncState` verlässt `conflict` NUR über `resolve`. Das ist die
 * Durchsetzung von „bei 409 NIE automatisch überschreiben": eine verspätete
 * Antwort eines älteren Speicherversuchs (`ok`) darf den Konflikt nicht
 * wegwischen, sonst führe der nächste Tastendruck genau die Überschreibung
 * aus, die der 409 verhindert hat.
 */

import type { BrandSlotView } from './types/brand'

/** Was der Mensch im offenen Tab geändert hat, noch nicht gespeichert. */
export interface BrandLocalSlotEdit {
  /** Neuer Text. `''` ist eine echte Eingabe (leeren), nicht „nichts". */
  value?: string
  /** `true` bestätigen, `false` Bestätigung zurücknehmen. */
  confirmed?: boolean
}

/** Der Rumpf, den `PATCH /api/brand/profiles/:id/steps/:stepKey` erwartet. */
export interface BrandSlotPatch {
  value?: string
  confirmed?: boolean
}

/**
 * Der Text, den der Editor für diesen Slot zeigt. `latestDraft` führt (s. Kopf);
 * `confirmed` steht nur ein, solange es noch keinen Entwurf gab (ein Slot, der
 * ausschliesslich über die Bestätigungs-Route entstand).
 */
export function brandSlotDisplayValue(view: BrandSlotView | undefined): string {
  return view?.latestDraft ?? view?.firstDraft ?? view?.confirmed ?? ''
}

/** Hat der Mensch diesem Slot zugestimmt? (`confirmed` trägt den Text, nicht ein Flag.) */
export function brandSlotIsConfirmed(view: BrandSlotView | undefined): boolean {
  return (view?.confirmed ?? null) !== null
}

/**
 * DIE GEÄNDERTEN SLOTS — Server-Fassung gegen lokale Eingabe.
 *
 * Ein Slot fällt raus, wenn die lokale Eingabe dem Server entspricht; ein
 * leeres Ergebnis heisst „nicht speichern". Slot-Ids, die der Server (noch)
 * nicht kennt, sind erlaubt: ein neu befüllter Slot hat dort keine Zeile.
 */
export function diffBrandSlots(
  server: Readonly<Record<string, BrandSlotView>>,
  local: Readonly<Record<string, BrandLocalSlotEdit>>,
): Record<string, BrandSlotPatch> {
  const changed: Record<string, BrandSlotPatch> = {}

  for (const [slotId, edit] of Object.entries(local)) {
    const view = server[slotId]
    const patch: BrandSlotPatch = {}

    if (edit.value !== undefined && edit.value !== brandSlotDisplayValue(view)) {
      patch.value = edit.value
    }

    if (edit.confirmed === true) {
      // Bestätigt wird der Text, der nach diesem Speichern gilt — bestätigt der
      // Server bereits genau ihn, ist nichts zu tun. Ohne diesen Vergleich
      // schickte jeder Tick ein `confirmed: true` für längst bestätigte Slots.
      const effective = patch.value ?? brandSlotDisplayValue(view)
      if ((view?.confirmed ?? null) !== effective) patch.confirmed = true
    }
    else if (edit.confirmed === false && brandSlotIsConfirmed(view)) {
      patch.confirmed = false
    }

    // Die Route lehnt einen Patch ohne Feld ab (`emptySlotPatch`) — er darf
    // also gar nicht erst entstehen.
    if (patch.value !== undefined || patch.confirmed !== undefined) changed[slotId] = patch
  }

  return changed
}

/**
 * Lokale Eingaben, die der Server inzwischen so trägt — sie werden nach jeder
 * Antwort verworfen, damit der nächste Tick nicht dieselbe Änderung erneut
 * sendet und ein „gespeichert" nicht sofort wieder zu „ungespeichert" wird.
 */
export function pruneSettledEdits(
  server: Readonly<Record<string, BrandSlotView>>,
  local: Readonly<Record<string, BrandLocalSlotEdit>>,
): Record<string, BrandLocalSlotEdit> {
  const open = diffBrandSlots(server, local)
  const kept: Record<string, BrandLocalSlotEdit> = {}
  for (const slotId of Object.keys(open)) {
    const edit = local[slotId]
    if (edit) kept[slotId] = edit
  }
  return kept
}

/** Die fünf sichtbaren Zustände (§3e). */
export type BrandSyncState = 'saving' | 'saved' | 'offline' | 'error' | 'conflict'

/**
 * Was dem Speichern zustösst. `resolve` ist der EINZIGE Ausgang aus `conflict`
 * und kommt ausschliesslich aus einer MENSCHLICHEN Entscheidung im 409-Dialog.
 */
export type BrandSyncEvent = 'start' | 'ok' | 'offline' | 'error' | 'conflict' | 'resolve'

export function nextBrandSyncState(current: BrandSyncState, event: BrandSyncEvent): BrandSyncState {
  if (event === 'resolve') return 'saved'
  if (event === 'conflict') return 'conflict'
  // Klebrig (s. Kopf): eine verspätete Antwort darf den Konflikt nicht lösen.
  if (current === 'conflict') return 'conflict'
  switch (event) {
    case 'start': return 'saving'
    case 'ok': return 'saved'
    case 'offline': return 'offline'
    case 'error': return 'error'
  }
}

/**
 * Darf jetzt gespeichert werden? Ein Konflikt hält den Autosave an — er wird
 * nicht „später nochmal versucht", sondern wartet auf die Entscheidung.
 */
export function brandAutosaveAllowed(state: BrandSyncState): boolean {
  return state !== 'conflict'
}
