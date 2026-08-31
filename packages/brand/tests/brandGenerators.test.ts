import { afterEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { slotById } from '../shared/slotRegistry'

/**
 * DIE GENERATOR-NAHT — wer schreibt, und was der Entwicklungs-Ersatz tut.
 *
 * Drei Aussagen, die man ohne diesen Test glauben müsste:
 *  1. Ein REGISTRIERTER Generator schlägt den Dev-Stub. Das ist die
 *     Sicherung dagegen, dass in Produktion ein Entwicklungstext im
 *     Brand-Dokument landet — und der Grund, warum der Stub ein RÜCKFALL ist
 *     und keine Registrierung in einem Plugin (dort entschiede die
 *     Plugin-Reihenfolge).
 *  2. Ohne Generator und ohne Schalter gibt es NICHTS — die Route meldet dann
 *     `no_generator`, statt still einen Platzhalter zu speichern.
 *  3. Der Stub hört auf ABBRUCH auf. Ein Generator, der weiterläuft, während
 *     der Mensch „Stopp" gedrückt hat, macht aus dem Abbruch eine Anzeige.
 */

const appConfig: { pukalani: { brand: { devStubGenerator: boolean } } } = {
  pukalani: { brand: { devStubGenerator: false } },
}
vi.stubGlobal('useAppConfig', () => appConfig)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appwriteDatabaseId: 'main' } }))
vi.stubGlobal('createError', (init: Record<string, unknown>) => Object.assign(new Error(String(init.statusText)), init))
vi.stubGlobal('createAdminClient', () => ({ tablesDB: {} }))
vi.stubGlobal('logEvent', () => {})
vi.stubGlobal('toH3Error', (error: unknown) => error)

const {
  brandDevStubGenerator,
  brandGenerationInputHash,
  clearBrandSlotGenerators,
  collectSlotDependencies,
  registerBrandSlotGenerator,
  resolveBrandSlotGenerator,
  acquireBrandGenerationLock,
} = await import('../server/utils/brandGenerators')

const event = {} as H3Event
const slot = slotById('b.purpose')!

afterEach(() => {
  clearBrandSlotGenerators()
  appConfig.pukalani.brand.devStubGenerator = false
})

function context(overrides: { hint?: string, signal?: AbortSignal, onDelta?: (text: string) => void } = {}) {
  return {
    event,
    stepKey: 'pvm' as const,
    slot,
    locale: 'de',
    pathKind: 'new' as const,
    hint: overrides.hint ?? '',
    dependencies: [
      { slotId: 'a.pitch', value: 'Wir bauen Werkzeug.' },
      { slotId: 'b.whyStarted', value: '' },
    ],
    signal: overrides.signal ?? new AbortController().signal,
    onDelta: overrides.onDelta ?? (() => {}),
  }
}

describe('Generator-Registry', () => {
  it('gibt OHNE Registrierung und OHNE Schalter nichts heraus', () => {
    expect(resolveBrandSlotGenerator('pvm')).toBeNull()
  })

  it('fällt mit Schalter auf den Dev-Stub zurück', () => {
    appConfig.pukalani.brand.devStubGenerator = true
    expect(resolveBrandSlotGenerator('pvm')).toBe(brandDevStubGenerator)
  })

  it('EIN REGISTRIERTER GENERATOR SCHLÄGT DEN STUB — auch mit Schalter', () => {
    appConfig.pukalani.brand.devStubGenerator = true
    const real = vi.fn()
    registerBrandSlotGenerator('pvm', real as never)
    expect(resolveBrandSlotGenerator('pvm')).toBe(real)
  })

  it('nimmt den Stern-Eintrag für Bausteine ohne eigenen', () => {
    const any = vi.fn()
    const own = vi.fn()
    registerBrandSlotGenerator('*', any as never)
    registerBrandSlotGenerator('values', own as never)
    expect(resolveBrandSlotGenerator('pvm')).toBe(any)
    expect(resolveBrandSlotGenerator('values')).toBe(own)
  })
})

describe('Dev-Stub', () => {
  it('liefert mehrere Deltas, deren Summe der Entwurf ist', async () => {
    const deltas: string[] = []
    const result = await brandDevStubGenerator(context({ onDelta: text => void deltas.push(text) }))
    expect(deltas.length).toBeGreaterThanOrEqual(4)
    expect(deltas.join('')).toBe(result.draft)
    expect(result.aborted).toBe(false)
    expect(result.promptVersion).toBe('stub-1')
  })

  it('ist deterministisch bei gleichem Stand', async () => {
    const a = await brandDevStubGenerator(context())
    const b = await brandDevStubGenerator(context())
    expect(a.draft).toBe(b.draft)
  })

  it('nimmt den Hinweis auf und sagt, dass er ein Ersatz ist', async () => {
    const result = await brandDevStubGenerator(context({ hint: 'wärmer' }))
    expect(result.draft).toContain('wärmer')
    expect(result.draft).toContain('Entwicklungs-Ersatz')
  })

  it('HÖRT AUF ABBRUCH AUF — und sagt es', async () => {
    const controller = new AbortController()
    const deltas: string[] = []
    const result = await brandDevStubGenerator(context({
      signal: controller.signal,
      onDelta: (text) => { deltas.push(text); controller.abort() },
    }))
    expect(deltas).toHaveLength(1)
    expect(result.aborted).toBe(true)
  })
})

describe('inputHash aus den Slot-Ständen', () => {
  it('nimmt den GELTENDEN Wert: bestätigt schlägt Entwurf', () => {
    const withDraft = collectSlotDependencies('b.purpose', {
      'a.pitch': { firstDraft: 'erst', latestDraft: 'zuletzt' },
    })
    const withConfirmed = collectSlotDependencies('b.purpose', {
      'a.pitch': { firstDraft: 'erst', latestDraft: 'zuletzt', confirmed: 'bestätigt' },
    })
    expect(withDraft.find(d => d.slotId === 'a.pitch')?.value).toBe('zuletzt')
    expect(withConfirmed.find(d => d.slotId === 'a.pitch')?.value).toBe('bestätigt')
  })

  it('trägt AUCH leere Abhängigkeiten — sonst bewegte ein Nachtrag den Hash nicht', () => {
    const empty = collectSlotDependencies('b.purpose', {})
    expect(empty.length).toBeGreaterThan(0)
    expect(empty.every(dependency => dependency.value === '')).toBe(true)

    const filled = collectSlotDependencies('b.purpose', { 'a.pitch': { latestDraft: 'da' } })
    expect(brandGenerationInputHash('b.purpose', 'de', filled))
      .not.toBe(brandGenerationInputHash('b.purpose', 'de', empty))
  })

  it('ist ein sha256 in Hex und stabil', () => {
    const deps = collectSlotDependencies('b.purpose', { 'a.pitch': { confirmed: 'x' } })
    const hash = brandGenerationInputHash('b.purpose', 'de', deps)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(brandGenerationInputHash('b.purpose', 'de', deps)).toBe(hash)
  })
})

describe('Sperre im Prozess', () => {
  it('lässt EINEN durch und weist den zweiten ab — bis der erste freigibt', () => {
    const first = acquireBrandGenerationLock('p1', 'pvm', 'g1')
    expect(first).not.toBeNull()
    expect(acquireBrandGenerationLock('p1', 'pvm', 'g2')).toBeNull()
    // Ein anderer Baustein desselben Profils bleibt frei.
    const other = acquireBrandGenerationLock('p1', 'values', 'g3')
    expect(other).not.toBeNull()

    first!.release()
    const third = acquireBrandGenerationLock('p1', 'pvm', 'g4')
    expect(third).not.toBeNull()
    third!.release()
    other!.release()
  })

  it('eine FREMDE Freigabe räumt die laufende Sperre nicht weg', () => {
    const held = acquireBrandGenerationLock('p9', 'pvm', 'g1')!
    held.release()
    const next = acquireBrandGenerationLock('p9', 'pvm', 'g2')!
    // Die Freigabe des alten Laufs darf den neuen nicht öffnen.
    held.release()
    expect(acquireBrandGenerationLock('p9', 'pvm', 'g3')).toBeNull()
    next.release()
  })
})
