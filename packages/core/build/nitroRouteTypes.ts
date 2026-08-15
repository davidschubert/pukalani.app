/**
 * NITROS ROUTEN-TYPISIERUNG ABSCHALTEN (2026-08-14) — die Mechanik.
 *
 * Das WARUM steht ausführlich am Aufrufer (`packages/core/nuxt.config.ts`,
 * Hook `nitro:init`). Kurz: Nitro schreibt je Route einen Eintrag in die
 * `InternalApi`-Map, und `$fetch` löst an JEDER Aufrufstelle den
 * Routen-Literal gegen ALLE Schlüssel dieser Map auf. Die Kosten sind damit
 * `Aufrufstellen × Routen` — in `apps/platform` gemessen 6,9 der 7,5 Mio.
 * Typ-Instanziierungen (92 %) und die Ursache jedes `TS2589`, das zuletzt
 * unbeteiligte Dateien umwarf.
 *
 * Diese Datei liegt BEWUSST neben der `nuxt.config` und nicht in `shared/`:
 * sie läuft zur BAUZEIT, nicht zur Laufzeit, und gehört in kein Bundle. Sie
 * ist überhaupt eine eigene Datei, damit der Wächter sie aufrufen kann —
 * `nuxt.config.ts` selbst ist wegen `defineNuxtConfig` (Build-Makro) nicht
 * importierbar, ein Test dagegen also unmöglich.
 *
 * Beweis: `packages/core/tests/nitroRouteTypes.test.ts`.
 */

/**
 * Absichtlich NUR das eine Feld, und `unknown` statt Nitros konkretem
 * Routen-Typ: so bleibt die Funktion als `types:extend`-Handler annehmbar
 * (Parameter sind unter `strictFunctionTypes` kontravariant — Nitros
 * `NitroTypes` ist auf diese schmalere Sicht zuweisbar, umgekehrt nicht).
 * Ein eigener „Nitro-Attrappen"-Typ mit `hook(name: string, …)` war der erste
 * Versuch und ging schief: Nitros `hook` ist über `HookKeys<NitroHooks>`
 * generisch und damit auf eine `string`-Signatur NICHT zuweisbar.
 */
export interface NitroRouteTypes {
  routes: Record<string, unknown>
}

/**
 * Leert die Routen-Map, BEVOR Nitro `.nuxt/types/nitro-routes.d.ts` schreibt.
 * `generateRoutes()` liest `types.routes` erst beim Schreiben (lazy) — deshalb
 * wirkt das Leeren im Hook und ist kein Eingriff in eine fertige Datei.
 */
export function clearNitroRouteTypes(types: NitroRouteTypes): void {
  types.routes = {}
}
