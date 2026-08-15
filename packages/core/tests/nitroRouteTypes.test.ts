import { describe, expect, it } from 'vitest'
import { clearNitroRouteTypes } from '../build/nitroRouteTypes'

/**
 * DER WÄCHTER FÜR NITROS LEERE ROUTEN-MAP (2026-08-14).
 *
 * `packages/core/nuxt.config.ts` haengt genau diese Funktion in Nitros
 * `types:extend`-Hook. Sie ist die EINE Stelle, an der die Typprüfung des ganzen
 * Monorepos hängt — gemessen an `apps/platform`:
 *
 *   Instanziierungen   7.505.010  →  617.983   (−91,8 %)
 *   Check-Zeit             10,7 s →      5,4 s
 *
 * Ohne sie löst `$fetch` an JEDER Aufrufstelle den Routen-Literal gegen ALLE
 * Routen auf (Kosten `Aufrufstellen × Routen`), und TypeScript bricht bei
 * 5 Mio. Instanziierungen in einem Ausdruck mit `TS2589` ab — an einer
 * BELIEBIGEN, meist völlig unbeteiligten Datei. Genau das ist zweimal
 * passiert (U14, F57); zwölf zusätzliche Routen reichten zuletzt aus.
 *
 * WARUM ALS TEST UND NICHT ALS LINT-REGEL: das Risiko ist nicht, dass jemand
 * einen falschen `$fetch` schreibt — das Risiko ist, dass jemand diesen
 * unscheinbaren Hook „aufräumt". Eine gelöschte Zeile sieht kein Lint. Dieser
 * Test schon, und er läuft in `pnpm -r test`, also in einem Gate, das ohnehin
 * scharf ist.
 *
 * Geprüft wird das VERHALTEN (Hook aufrufen, Map nachmessen), nicht der
 * Dateitext: eine Textsuche wäre schon grün, wenn `types.routes` irgendwo in
 * einem Kommentar steht.
 */
describe('clearNitroRouteTypes', () => {
  it('leert die Routen-Map vollstaendig', () => {
    const types = {
      routes: {
        '/api/a': { get: ['X'] },
        '/api/b': { post: ['Y'] },
        '/api/c/:id': { get: ['Z'], delete: ['Z2'] },
      },
    }
    clearNitroRouteTypes(types)

    // DAS ist die Zusicherung: keine einzige Route bleibt stehen.
    expect(Object.keys(types.routes)).toHaveLength(0)
  })

  it('ist auf einer bereits leeren Map harmlos (idempotent)', () => {
    const types = { routes: {} }
    clearNitroRouteTypes(types)
    expect(Object.keys(types.routes)).toHaveLength(0)
  })
})
