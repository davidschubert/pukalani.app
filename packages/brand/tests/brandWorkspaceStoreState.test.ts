import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * JEDE Ref des Workspace-Stores gehört ins Return — sonst überlebt sie die
 * SSR-Hydration nicht.
 *
 * Pinia serialisiert in den SSR-Payload nur, was der Setup-Store ZURÜCKGIBT.
 * Eine private Ref wird server-seitig befüllt (der SSR-HTML-Strom zeigt den
 * richtigen Zustand), startet im Browser aber wieder bei ihrem Startwert —
 * und die Hydration nimmt den Zustand still zurück. Live erwischt am
 * 2026-09-03: `serverConfidence` war privat, die Konfidenz-Weiche zeigte die
 * gespeicherte Wahl nur bis zur Hydration (PATCH 200, GET trug den Wert,
 * Chip trotzdem leer).
 *
 * Der Store läuft nur in Nuxt (Auto-Imports), deshalb prüft dieser Wächter
 * den QUELLTEXT: jeder `const <name> = ref(…)` im Setup muss namentlich im
 * Return-Objekt stehen.
 */
describe('brandWorkspace store state', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../app/stores/brandWorkspace.ts', import.meta.url)),
    'utf8',
  )

  it('gibt jede Ref des Setups zurück (SSR-Payload-Pflicht)', () => {
    const refNames = [...source.matchAll(/^ {2}const (\w+) = ref[<(]/gm)].map(m => m[1]!)
    expect(refNames.length).toBeGreaterThanOrEqual(18)
    expect(refNames).toContain('serverConfidence')
    expect(refNames).toContain('localConfidence')

    const returnBlock = source.slice(source.lastIndexOf('  return {'))
    const missing = refNames.filter(name => !new RegExp(`^ {4}${name},$`, 'm').test(returnBlock))
    expect(missing).toEqual([])
  })
})
