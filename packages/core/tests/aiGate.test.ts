import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * DAS KI-GATE MUSS ERWARTET WERDEN — strukturell geprüft, weil der Fehler
 * strukturell wäre.
 *
 * Bis 2026-08-18 hiess die Auskunft `isAiAvailable` und war SYNCHRON. Seit der
 * Schlüssel auch aus der Datenbank kommen kann (`instance_secrets`,
 * system-036), muss sie erwartet werden — und genau hier liegt die Falle: ein
 * vergessenes `await` an `if (!isAiAvailable(event))` ist KEIN Typfehler. Ein
 * Promise ist immer truthy, die Bedingung damit immer falsch, und das Gate
 * stünde still offen. Dieselbe Sorte Loch, die CLAUDE.md schon einmal
 * festhält („Das `await` ist Pflicht — ohne wäre der Gate fail-open").
 *
 * Die Umbenennung ist die eigentliche Sicherung (jede alte Aufrufstelle bricht
 * beim Übersetzen). Dieser Test hält sie fest, damit niemand sie im Zuge einer
 * „Vereinfachung" zurückdreht.
 */
const source = readFileSync(fileURLToPath(new URL('../server/utils/aiComplete.ts', import.meta.url)), 'utf8')

describe('KI-Gate', () => {
  it('bietet den alten SYNCHRONEN Namen nicht mehr an', () => {
    expect(source).not.toMatch(/export function isAiAvailable/)
  })

  it('ist asynchron — sonst wäre ein vergessenes await ein offenes Gate', () => {
    expect(source).toMatch(/export async function isAiConfigured\(event: H3Event\): Promise<boolean>/)
  })

  it('löst den Schlüssel über beide Quellen auf, DB vor Env', () => {
    expect(source).toMatch(/export async function resolveAiKey/)
    // Die Rangfolge steht im Code, nicht nur im Kommentar: erst die Ablage,
    // dann die Env. Andersherum hätte ein Eintrag über die Konsole auf einer
    // Instanz mit gesetzter Env keine Wirkung.
    const fn = source.slice(source.indexOf('export async function resolveAiKey'))
    const ablage = fn.indexOf('readInstanceSecret')
    const env = fn.indexOf('useRuntimeConfig')
    expect(ablage).toBeGreaterThan(-1)
    expect(env).toBeGreaterThan(ablage)
  })

  it('holt den Schlüssel im Transport über dieselbe Auflösung', () => {
    // Nicht mehr direkt aus der Env: sonst benutzte `aiComplete` einen anderen
    // Schlüssel als das Gate prüft.
    expect(source).toMatch(/options\.apiKey \|\| await resolveAiKey\(event\)/)
  })
})
