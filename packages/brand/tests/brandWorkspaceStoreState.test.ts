import { readFileSync, readdirSync } from 'node:fs'
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

  /**
   * UND KEINE AKTION, DIE NIEMAND RUFT (Paket 8, 2026-09-05).
   *
   * `reopenStep()` stand ein Paket lang im Store, ohne dass irgendwo ein Knopf
   * daran hing: sein Aufrufer war mit 3c-ii auf die Abnahme-Seite gezogen und
   * heisst dort `restart`. Eine tote Aktion sieht aus wie ein vorhandener Weg
   * — sie verspricht der nächsten Sitzung eine Bedienung, die es nicht gibt,
   * und ihre `journey`-Nachführung prüft niemand mehr gegen.
   *
   * Gezählt wird über den ganzen Layer-Quelltext (`app/`): ein Name, der nur
   * an seiner Definition und in der Rückgabe steht, wird nirgends gerufen —
   * auch nicht vom Store selbst (so bleibt `clearGeorgeDraft` gültig, das
   * zwei interne Aufrufer hat).
   */
  it('gibt keine Funktion zurück, die im Layer niemand ruft', () => {
    const appDir = fileURLToPath(new URL('../app', import.meta.url))
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|vue)$/.test(entry.name)) files.push(full)
      }
    }
    walk(appDir)
    const blob = files.map(file => readFileSync(file, 'utf8')).join('\n')

    const returnBlock = source.slice(source.lastIndexOf('  return {'))
    const returned = [...returnBlock.matchAll(/^ {4}(\w+),$/gm)].map(match => match[1]!)
    const functions = returned.filter(name =>
      new RegExp(`^ {2}(?:async )?function ${name}\\b`, 'm').test(source))
    expect(functions.length).toBeGreaterThanOrEqual(35)

    // Definition + Rückgabe = 2 Vorkommen; alles darüber ist ein Aufruf.
    const dead = functions.filter(name =>
      (blob.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length <= 2)
    expect(dead).toEqual([])
  })
})
