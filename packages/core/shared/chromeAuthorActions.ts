import type { PukalaniChromeAuthorAction, PukalaniChromeAuthorActionConfig } from './types/chrome'

/**
 * DIE AUSWAHL-REGEL DER AUTOREN-AKTIONEN (F56) — pur, damit sie prüfbar ist.
 *
 * `CoreAuthorActions` selbst soll nur noch rendern. Was hier entschieden
 * wird, sind drei Dinge, die alle drei still schiefgehen können:
 *
 *  1. **`false` heißt weg.** Die Registry ist eine Objekt-Map, damit eine App
 *     einen geerbten Eintrag ABSCHALTEN kann (Audit S9, Begründung in
 *     types/chrome.ts). Ein `false`, das man versehentlich als Eintrag
 *     durchreicht, ist zur Laufzeit ein `<component :is="undefined">` — kein
 *     Fehler, nur eine leere Stelle.
 *  2. **Beide Tore müssen offen sein.** `productKey` ist der Laufzeit-
 *     Schalter (F2), `planProduct` das Plan-Gate im Pool (P4). Sie sind
 *     UND-verknüpft und beide fail-closed nur, soweit der Aufrufer es sagt —
 *     die Prädikate kommen von außen herein, weil die reine Regel weder
 *     `useRuntimeFlags` noch `useTenantPlan` kennen darf.
 *  3. **Stabile Reihenfolge.** Gleiche `order` ⇒ alphabetisch nach Id, nicht
 *     nach Objekt-Einfügereihenfolge: die hängt an der Merge-Reihenfolge der
 *     Layer und wäre zwischen zwei Apps verschieden.
 */
export interface ResolvedAuthorAction extends PukalaniChromeAuthorAction {
  /** Die stabile Id aus der Map — Vue braucht sie als `:key`. */
  id: string
}

const DEFAULT_ORDER = 50

export function resolveAuthorActions(
  config: PukalaniChromeAuthorActionConfig | undefined,
  gates: {
    /** Läuft dieses Produkt gerade? (ohne `productKey`: immer ja) */
    productOn: (productKey?: string) => boolean
    /** Enthält der Plan dieses Produkt? (ohne `planProduct`: immer ja) */
    planAllows: (planProduct?: string) => boolean
  },
): ResolvedAuthorAction[] {
  return Object.entries(config ?? {})
    .filter((pair): pair is [string, PukalaniChromeAuthorAction] =>
      pair[1] !== false && !!pair[1] && typeof pair[1].component === 'string' && pair[1].component.length > 0)
    .map(([id, entry]) => ({ ...entry, id }))
    .filter(entry => gates.productOn(entry.productKey))
    .filter(entry => gates.planAllows(entry.planProduct))
    .sort((a, b) => (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER) || a.id.localeCompare(b.id))
}
