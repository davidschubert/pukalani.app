import { describe, expect, it } from 'vitest'
import { MARKET_LIBRARY_ENTRIES, MARKET_LIBRARY_VERSION } from '../shared/library'
import {
  marketLibrary,
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
