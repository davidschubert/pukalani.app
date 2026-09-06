import { describe, expect, it } from 'vitest'
import { MARKET_LIBRARY_ENTRIES, MARKET_LIBRARY_VERSION } from '../shared/library'
import {
  marketLibrary,
  marketLibraryDraftSchema,
  marketLibraryFields,
  marketLibrarySchema,
  marketLibraryVersion,
  type MarketLibraryEntry,
} from '../shared/marketLibrary'
import { MARKET_EVIDENCE_MAX, MARKET_FIELD_IDS } from '../shared/marketProfile'
import { marketLibraryFixtureEntry } from './fixtures/marketLibraryFixture'

/**
 * DIE BIBLIOTHEK (Plan §7.2 Nr. 3) — Mechanik und die Datei, die heute
 * ausgeliefert wird.
 *
 * ── DIE DATEI SELBST IST DER PRÜFLING ─────────────────────────────────────
 * `marketLibrary()` ist fail-closed: fällt die Datei durch das Schema, ist die
 * Bibliothek LEER. Das ist die richtige Vorsichtsmassnahme im Betrieb — und
 * genau deshalb ist der Test nötig: ohne ihn wäre eine kaputte Bibliothek
 * still, und ein Kandidat verschwände ohne Fehlermeldung.
 *
 * ── DIE SPERRE IST SEIT M6b UMGEDREHT (2026-09-06) ────────────────────────
 * Bis hierher verlangte dieser Test `.example`-Adressen: „die Bibliothek
 * enthält AUSSCHLIESSLICH erfundene Marken, M6 bringt die echten". Das war
 * richtig, solange die Mechanik ohne Inhalt lief — seit dem Gate-Flip standen
 * damit aber zwei erfundene Marken im Quellen-Wähler zahlender Kunden, und die
 * Sperre hielt zugleich die von Hand geprüften ECHTEN Einträge draussen. Sie
 * verlangt jetzt das Gegenteil und tut damit dieselbe Arbeit: was ausgeliefert
 * wird, muss eine Marke sein, die es GIBT, geprüft von einem Menschen mit
 * Datum und Zeichen, belegt mit einem Zitat von der Seite, die als Quelle
 * dasteht. Die zwei erfundenen Einträge sind Testvorlage geworden
 * (`fixtures/marketLibraryFixture.ts`).
 */

/**
 * DIE FÜNF REGELN AN DIE AUSGELIEFERTE DATEI — als reine Prädikate, damit
 * jede EINZELN eine Gegenprobe bekommt.
 *
 * Sie stehen bewusst hier und nicht im Zod-Schema: das Schema beschreibt die
 * FORM eines Bibliotheks-Eintrags (auch die eines erfundenen Testeintrags, den
 * `fixtures/` weiterhin braucht), diese fünf beschreiben die REDAKTIONSREGEL
 * für das, was das Produkt ausliefert. Ein Prädikat ohne Gegenprobe ist
 * wertlos — es könnte auf alles `true` sagen —, deshalb hat jedes hier unten
 * ein Beispiel UND ein Gegenbeispiel.
 */

/** Erfundene Adressen (RFC 2606/6761) und alles ohne echten Namen. */
function hasRealHost(url: string): boolean {
  let host: string
  try { host = new URL(url).hostname.toLowerCase() }
  catch { return false }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false
  if (/(^|\.)(example|invalid|test|local|localhost|onion)$/.test(host)) return false
  const labels = host.split('.')
  return labels.length >= 2 && labels.every(label => label.length > 0) && (labels.at(-1) ?? '').length >= 2
}

/** Ein Prüfdatum in der Zukunft ist keine Prüfung, sondern ein Versprechen. */
function isPastOrToday(date: string, today: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today
}

/** Beleg und Marke müssen derselbe Auftritt sein. */
function sameHost(a: string, b: string): boolean {
  try { return new URL(a).hostname.toLowerCase() === new URL(b).hostname.toLowerCase() }
  catch { return false }
}

const heute = new Date().toISOString().slice(0, 10)

describe('die Regeln selbst — jede mit ihrer Gegenprobe', () => {
  it('`hasRealHost` nimmt einen echten Host und weist die erfundenen ab', () => {
    expect(hasRealHost('https://thebarn.de')).toBe(true)
    expect(hasRealHost('https://www.apple.com/mac/')).toBe(true)
    // GEGENPROBEN
    expect(hasRealHost('https://atlas-roasters.example')).toBe(false)
    expect(hasRealHost('https://x.example/about')).toBe(false)
    expect(hasRealHost('https://irgendwas.invalid')).toBe(false)
    expect(hasRealHost('http://localhost:3000/')).toBe(false)
    expect(hasRealHost('http://127.0.0.1/')).toBe(false)
    expect(hasRealHost('nicht mal eine Adresse')).toBe(false)
  })

  it('`isPastOrToday` lässt heute zu und die Zukunft nicht', () => {
    expect(isPastOrToday('2026-09-06', '2026-09-06')).toBe(true)
    expect(isPastOrToday('2020-01-01', '2026-09-06')).toBe(true)
    // GEGENPROBEN
    expect(isPastOrToday('2026-09-07', '2026-09-06')).toBe(false)
    expect(isPastOrToday('2030-01-01', '2026-09-06')).toBe(false)
    expect(isPastOrToday('', '2026-09-06')).toBe(false)
    expect(isPastOrToday('06.09.2026', '2026-09-06')).toBe(false)
  })

  it('`sameHost` erkennt denselben Auftritt und einen fremden', () => {
    expect(sameHost('https://thebarn.de/', 'https://thebarn.de')).toBe(true)
    expect(sameHost('https://www.apple.com/mac/', 'https://www.apple.com')).toBe(true)
    // GEGENPROBEN — ein Beleg von einer FREMDEN Seite ist kein Beleg für DIESE
    // Marke, und eine andere Subdomain ist ein anderer Auftritt mit einer
    // anderen robots.txt (der `about.meta.com`-Befund aus Anhang G).
    expect(sameHost('https://presse.example.org/artikel', 'https://thebarn.de')).toBe(false)
    expect(sameHost('https://shop.thebarn.de/', 'https://thebarn.de')).toBe(false)
    expect(sameHost('keine Adresse', 'https://thebarn.de')).toBe(false)
  })
})

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
    // aus wie eine kaputte, wenn man nur das Schema prüfte. KEINE feste Zahl:
    // die Bibliothek wächst Eintrag für Eintrag (je einer je Handprüfung), und
    // ein Zähler im Test wäre nur eine zweite Stelle, die man dabei anfasst.
    expect(marketLibrary().entries.length).toBe(MARKET_LIBRARY_ENTRIES.length)
    expect(marketLibrary().entries.length).toBeGreaterThan(0)
    expect(marketLibraryVersion()).toBe(MARKET_LIBRARY_VERSION)
  })

  it('enthält AUSSCHLIESSLICH ECHTE Marken — keine erfundene Adresse', () => {
    // Die umgedrehte Sperre (M6b). Eine erfundene Marke im Quellen-Wähler
    // eines zahlenden Kunden ist eine Lüge über einen Dritten, die es gar
    // nicht gibt — und sie sieht neben den echten Einträgen genauso aus.
    for (const entry of marketLibrary().entries) {
      expect(hasRealHost(entry.homepage), `${entry.key}: ${entry.homepage}`).toBe(true)
      for (const field of entry.fields) {
        expect(hasRealHost(field.sourceUrl), `${entry.key}/${field.fieldId}: ${field.sourceUrl}`).toBe(true)
      }
    }
  })

  it('belegt jedes Feld auf DEM Auftritt, den der Eintrag nennt', () => {
    for (const entry of marketLibrary().entries) {
      for (const field of entry.fields) {
        expect(
          sameHost(field.sourceUrl, entry.homepage),
          `${entry.key}/${field.fieldId}: ${field.sourceUrl} ≠ ${entry.homepage}`,
        ).toBe(true)
      }
    }
  })

  it('hat je Eintrag eine HANDPRÜFUNG mit Datum (nicht in der Zukunft) und Zeichen', () => {
    for (const entry of marketLibrary().entries) {
      expect(entry.status).toBe('verified')
      expect(isPastOrToday(entry.verifiedAt, heute), `${entry.key}: ${entry.verifiedAt}`).toBe(true)
      expect(entry.verifiedBy.trim().length, entry.key).toBeGreaterThanOrEqual(2)
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
        if (field.quote) expect(field.quote.length, `${entry.key}/${field.fieldId}`).toBeLessThanOrEqual(MARKET_EVIDENCE_MAX)
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

  it('nimmt eine HÄUFIGKEIT an — und nur als zwei ganze Zahlen (M6b)', () => {
    const mitZahl = { ...gut, fields: [{ ...gut.fields[0], frequency: { pages: 2, of: 3 } }] }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [mitZahl] }).success).toBe(true)
    // GEGENPROBEN: keine halben Seiten, keine negativen, kein Text.
    const halb = { ...gut, fields: [{ ...gut.fields[0], frequency: { pages: 1.5, of: 3 } }] }
    const negativ = { ...gut, fields: [{ ...gut.fields[0], frequency: { pages: -1, of: 3 } }] }
    const text = { ...gut, fields: [{ ...gut.fields[0], frequency: { pages: 'zwei', of: 3 } }] }
    const halbfertig = { ...gut, fields: [{ ...gut.fields[0], frequency: { pages: 2 } }] }
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [halb] }).success).toBe(false)
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [negativ] }).success).toBe(false)
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [text] }).success).toBe(false)
    expect(marketLibrarySchema.safeParse({ version: 'v1', entries: [halbfertig] }).success).toBe(false)
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

  it('darf eine gerechnete HÄUFIGKEIT mitbringen (M6b)', () => {
    // Das Werkzeug reicht sie aus dem Lauf durch — sie ist eine Messung und
    // gehört deshalb schon in den Entwurf, damit die Handprüfung sie sieht.
    const mitZahl = {
      ...entwurf,
      fields: [{ ...entwurf.fields[0], frequency: { pages: 3, of: 5 } }],
    }
    expect(marketLibraryDraftSchema.safeParse(mitZahl).success).toBe(true)
  })
})

/**
 * DIE ABBILDUNG EINES EINTRAGS AUF EIN MARKTPROFIL — gegen die TESTVORLAGE.
 *
 * Sie läuft bewusst NICHT gegen die ausgelieferte Datei: die enthält seit M6b
 * echte Marken, und ein Test, der an ihrem Inhalt hängt („The Barn hat ein
 * Feld ohne Zitat"), bräche beim nächsten redaktionellen Eintrag, ohne dass am
 * Code etwas falsch wäre. Die Vorlage deckt die Form vollständig ab; die
 * ausgelieferte Datei prüft der Block ganz oben.
 */
describe('marketLibraryFields', () => {
  const entry: MarketLibraryEntry = marketLibraryFixtureEntry('demo-atlas-roasters')

  it('macht aus einem Eintrag ein Marktprofil mit Quelle `library`', () => {
    const fields = marketLibraryFields(entry)
    expect(fields.length).toBe(entry.fields.length)
    for (const field of fields) expect(field.source).toBe('library')
  })

  it('trägt das PRÜFDATUM als `fetchedAt`, nicht das heutige', () => {
    const fields = marketLibraryFields(entry)
    const belegt = fields.find(field => field.evidence)
    expect(belegt?.evidence?.fetchedAt).toBe(entry.verifiedAt)
  })

  it('gibt einem Feld OHNE Zitat auch keinen Beleg', () => {
    const northline = marketLibraryFixtureEntry('demo-northline-supply')
    const tone = marketLibraryFields(northline).find(field => field.fieldId === 'toneWords')
    expect(tone?.value).toBeTruthy()
    expect(tone?.evidence).toBeUndefined()
  })

  it('REICHT eine vorhandene Häufigkeit durch (M6b)', () => {
    const pitch = marketLibraryFields(entry).find(field => field.fieldId === 'pitch')
    expect(pitch?.frequency).toEqual({ pages: 2, of: 3 })
  })

  it('erfindet KEINE Häufigkeit, wo der Eintrag keine hat (GEGENPROBE)', () => {
    // Der Kern der Regel: eine Zahl ohne Messung sähe in der Zelle aus wie
    // eine Messung. Ohne diese Gegenprobe wäre der Durchreiche-Test auch dann
    // grün, wenn die Abbildung überall `{ pages: 1, of: 1 }` setzte.
    const ohne = marketLibraryFields(entry).filter(field => field.fieldId !== 'pitch')
    expect(ohne.length).toBeGreaterThan(0)
    for (const field of ohne) expect(field.frequency).toBeUndefined()
    const northline = marketLibraryFixtureEntry('demo-northline-supply')
    for (const field of marketLibraryFields(northline)) expect(field.frequency).toBeUndefined()
  })

  it('kennt einen erfundenen Schlüssel nicht', () => {
    expect(() => marketLibraryFixtureEntry('gibt-es-nicht')).toThrow()
  })
})
