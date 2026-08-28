import { describe, expect, it } from 'vitest'
import { buildSystemManifest, pkgVersion } from '../build/systemManifest'

/**
 * Die Systemseite (/dashboard/system) zeigte in Produktion überall „unknown"
 * und „0 Dateien": sie löste Versionen und Layer-Inhalte zur LAUFZEIT aus dem
 * Dateisystem auf, deployt wird aber nur `.output/`. Seit 2026-08-28 wird das
 * Manifest zur BAUZEIT gebaut (`build/systemManifest.ts`) und in die
 * server-only runtimeConfig gelegt.
 *
 * Der Test läuft im Workspace, also genau dort, wo der BUILD läuft — er prüft
 * damit die Bedingung, unter der das Manifest entsteht. Er kann NICHT prüfen,
 * dass Produktion echte Werte zeigt (dafür fehlt hier ein `.output/`); dass
 * die Werte dort ankommen, hängt am Einbacken in `nuxt.config.ts`.
 */
describe('buildSystemManifest — echte Werte zur Bauzeit', () => {
  const manifest = buildSystemManifest()

  it('löst Paketversionen auf, statt „unknown" zu liefern', () => {
    const nuxt = manifest.dependencies.find(d => d.name === 'nuxt')
    expect(nuxt).toBeDefined()
    expect(nuxt?.version).not.toBe('unknown')
    // Erwartung steht FEST (nicht aus der Antwort abgeleitet): eine Semver.
    expect(nuxt?.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(nuxt?.category).toBe('Framework')
  })

  it('kennt kein Paket mit leerer Version', () => {
    for (const dep of manifest.dependencies) {
      expect(dep.version).not.toBe('')
    }
  })

  it('schlüsselt den Core-Layer mit Dateien auf', () => {
    const core = manifest.layers.find(l => l.name === '@pukalani/core')
    expect(core).toBeDefined()
    expect(core?.total).toBeGreaterThan(0)
    expect(core?.categories.length).toBeGreaterThan(0)
    // Die Summe der Kategorie-Zähler IST `total` — sonst zeigt die Karte
    // eingeklappt eine andere Zahl als aufgeklappt.
    const sum = (core?.categories ?? []).reduce((acc, c) => acc + c.count, 0)
    expect(sum).toBe(core?.total)
    // Und jede Kategorie trägt so viele Namen, wie sie zählt.
    for (const category of core?.categories ?? []) {
      expect(category.items).toHaveLength(category.count)
    }
  })

  it('liest die Layer-Version aus dem Layer-Paket selbst', () => {
    // `@pukalani/comments` steht NICHT in den Dependencies dieses Pakets —
    // über die App-node_modules wäre die Version „unknown". Die Wahrheit ist
    // die package.json des Layers (packages/comments), und die trägt Semver.
    const comments = manifest.layers.find(l => l.name === '@pukalani/comments')
    expect(comments).toBeDefined()
    expect(comments?.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('trägt Name und Bauzeitpunkt der App', () => {
    expect(manifest.app.name).not.toBe('')
    expect(Number.isNaN(Date.parse(manifest.builtAt))).toBe(false)
  })
})

describe('pkgVersion — Gegenprobe', () => {
  it('meldet „unknown" für ein Paket, das es nicht gibt', () => {
    // Ohne diese Gegenprobe wäre der Test oben auch dann grün, wenn
    // `pkgVersion` gar nicht mehr auflöst und irgendetwas zurückgäbe.
    expect(pkgVersion('paket-das-es-nicht-gibt-xyz')).toBe('unknown')
  })
})
