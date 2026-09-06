import { describe, expect, it } from 'vitest'
import { MARKET_LIBRARY_ENTRIES, MARKET_LIBRARY_VERSION } from '../shared/library'
import {
  marketLibrary,
  marketLibraryDraftSchema,
  marketLibraryEntry,
  marketLibraryFields,
  marketLibrarySchema,
  marketLibraryVersion,
} from '../shared/marketLibrary'
import { MARKET_EVIDENCE_MAX, MARKET_FIELD_IDS } from '../shared/marketProfile'

/**
 * DIE BIBLIOTHEK (Plan §7.2 Nr. 3) — Mechanik und die Datei, die heute
 * ausgeliefert wird.
 *
 * ── DIE DATEI SELBST IST DER PRÜFLING ─────────────────────────────────────
 * `marketLibrary()` ist fail-closed: fällt die Datei durch das Schema, ist die
 * Bibliothek LEER. Das ist die richtige Vorsichtsmassnahme im Betrieb — und
 * genau deshalb ist der Test nötig: ohne ihn wäre eine kaputte Bibliothek
 * still, und ein Kandidat verschwände ohne Fehlermeldung.
 */

describe('die ausgelieferte Bibliothek', () => {
  it('besteht ihr eigenes Schema', () => {
    const parsed = marketLibrarySchema.safeParse({
      version: MARKET_LIBRARY_VERSION,
      entries: MARKET_LIBRARY_ENTRIES,
    })
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [], null, 2)).toBe(true)
  })

  it('kommt geladen an — die Einträge sind NICHT weggefiltert', () => {
    // Die Gegenprobe zu „fail-closed": eine leere Bibliothek sähe hier genauso
    // aus wie eine kaputte, wenn man nur das Schema prüfte.
    expect(marketLibrary().entries.length).toBe(MARKET_LIBRARY_ENTRIES.length)
    expect(marketLibrary().entries.length).toBeGreaterThanOrEqual(2)
    expect(marketLibraryVersion()).toBe(MARKET_LIBRARY_VERSION)
  })

  it('enthält AUSSCHLIESSLICH erfundene Marken (M6 bringt die echten)', () => {
    // Eine reale Marke hier wäre eine Behauptung über einen Dritten, die
    // niemand von Hand geprüft und niemand rechtlich abgeklärt hat (§7.6).
    for (const entry of marketLibrary().entries) {
      expect(entry.homepage).toMatch(/\.example(\/|$)/)
      for (const field of entry.fields) expect(field.sourceUrl).toMatch(/\.example(\/|$)/)
    }
  })

  it('hat je Eintrag eine HANDPRÜFUNG mit Datum und Zeichen', () => {
    for (const entry of marketLibrary().entries) {
      expect(entry.status).toBe('verified')
      expect(entry.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.verifiedBy.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('hat eindeutige Schlüssel', () => {
    const keys = marketLibrary().entries.map(entry => entry.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('hält die Zitatschranke und kennt nur echte Feld-Ids', () => {
    for (const entry of marketLibrary().entries) {
      for (const field of entry.fields) {
        expect(MARKET_FIELD_IDS).toContain(field.fieldId)
        if (field.quote) expect(field.quote.length).toBeLessThanOrEqual(MARKET_EVIDENCE_MAX)
      }
    }
  })
})

describe('das Schema weist zurück, was es soll', () => {
  const gut = {
    key: 'demo-x',
    status: 'verified',
    name: 'X',
    homepage: 'https://x.example',
    category: '',
    verifiedAt: '2026-09-05',
    verifiedBy: 'jemand',
    fields: [{ fieldId: 'pitch', value: 'Etwas.', sourceUrl: 'https://x.example' }],
  }

  it('nimmt einen gültigen Eintrag an (GEGENPROBE zu allem darunter)', () => {
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [gut] }).success).toBe(true)
  })

  it('verlangt die Handprüfung', () => {
    const ohneDatum = { ...gut, verifiedAt: '' }
    const ohneZeichen = { ...gut, verifiedBy: '' }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [ohneDatum] }).success).toBe(false)
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [ohneZeichen] }).success).toBe(false)
  })

  it('verlangt je Feld eine Quell-Adresse', () => {
    const ohneQuelle = { ...gut, fields: [{ fieldId: 'pitch', value: 'Etwas.' }] }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [ohneQuelle] }).success).toBe(false)
  })

  it('hält die Zitatschranke von 200 Zeichen', () => {
    const zuLang = {
      ...gut,
      fields: [{ ...gut.fields[0], quote: 'a'.repeat(MARKET_EVIDENCE_MAX + 1) }],
    }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [zuLang] }).success).toBe(false)
  })

  it('lehnt eine erfundene Feld-Id ab', () => {
    const falschesFeld = { ...gut, fields: [{ ...gut.fields[0], fieldId: 'erfunden' }] }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [falschesFeld] }).success).toBe(false)
  })
})

/**
 * DER ENTWURF (MV1 M6) — die Grenze zwischen „gerechnet" und „geprüft".
 *
 * `scripts/market-library-compute.mjs` schreibt Entwürfe, und ein Entwurf ist
 * eine unbeglaubigte Aussage über eine fremde Marke. Er DARF die Bibliothek
 * nicht erreichen — auch nicht durch ein Kopieren der Datei nach `index.ts`,
 * auch nicht, wenn jemand `verifiedAt`/`verifiedBy` nachträglich füllt und den
 * Zustand vergisst.
 */
describe('ein Entwurf ist keine Bibliothek', () => {
  const entwurf = {
    key: 'demo-x',
    status: 'draft',
    name: 'X',
    homepage: 'https://x.example',
    category: '',
    verifiedAt: null,
    verifiedBy: null,
    fields: [{ fieldId: 'pitch', value: 'Etwas.', sourceUrl: 'https://x.example' }],
    computed: {
      at: '2026-09-05T10:00:00.000Z',
      mode: 'stub',
      tool: 'packages/market/scripts/market-library-compute.mjs',
      pages: ['https://x.example'],
    },
  }

  it('IST ein gültiger Entwurf (GEGENPROBE zu allem darunter)', () => {
    expect(marketLibraryDraftSchema.safeParse(entwurf).success).toBe(true)
  })

  it('fällt durch das BIBLIOTHEKS-Schema', () => {
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [entwurf] }).success).toBe(false)
  })

  it('kommt auch mit nachgetragenem Datum und Zeichen nicht durch, solange `status` auf draft steht', () => {
    // Genau der Fall, den ein Werkzeug erzeugen könnte: alles ausgefüllt, nur
    // niemand hat wirklich geprüft. `status` ist der eine Wert, den kein
    // Werkzeug setzt.
    const halbfertig = { ...entwurf, verifiedAt: '2026-09-05', verifiedBy: 'DS' }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [halbfertig] }).success).toBe(false)
  })

  it('wird zum Eintrag, sobald ein Mensch ihn beglaubigt (GEGENPROBE)', () => {
    const { computed: _computed, ...rest } = entwurf
    const geprueft = { ...rest, status: 'verified', verifiedAt: '2026-09-05', verifiedBy: 'DS' }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [geprueft] }).success).toBe(true)
  })

  it('ein GEPRÜFTER Eintrag ist umgekehrt kein Entwurf', () => {
    expect(marketLibraryDraftSchema.safeParse({ ...entwurf, status: 'verified' }).success).toBe(false)
  })
})

describe('marketLibraryFields', () => {
  const entry = marketLibraryEntry('demo-atlas-roasters')

  it('macht aus einem Eintrag ein Marktprofil mit Quelle `library`', () => {
    expect(entry).toBeDefined()
    const fields = marketLibraryFields(entry!)
    expect(fields.length).toBe(entry!.fields.length)
    for (const field of fields) expect(field.source).toBe('library')
  })

  it('trägt das PRÜFDATUM als `fetchedAt`, nicht das heutige', () => {
    const fields = marketLibraryFields(entry!)
    const belegt = fields.find(field => field.evidence)
    expect(belegt?.evidence?.fetchedAt).toBe(entry!.verifiedAt)
  })

  it('gibt einem Feld OHNE Zitat auch keinen Beleg', () => {
    const northline = marketLibraryEntry('demo-northline-supply')
    const tone = marketLibraryFields(northline!).find(field => field.fieldId === 'toneWords')
    expect(tone?.value).toBeTruthy()
    expect(tone?.evidence).toBeUndefined()
  })

  it('vergibt KEINE Häufigkeit — eine Handprüfung hat nichts gezählt', () => {
    for (const field of marketLibraryFields(entry!)) expect(field.frequency).toBeUndefined()
  })

  it('kennt einen erfundenen Schlüssel nicht', () => {
    expect(marketLibraryEntry('gibt-es-nicht')).toBeUndefined()
  })
})
