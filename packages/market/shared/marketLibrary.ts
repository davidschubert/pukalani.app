import { z } from 'zod'
import type { MarketProfileField } from './marketProfile'
import { MARKET_EVIDENCE_MAX, MARKET_FIELD_IDS } from './marketProfile'
import { MARKET_MAX_PAGES } from './marketCrawlRules'
import { MARKET_LIBRARY_ENTRIES, MARKET_LIBRARY_VERSION } from './library'

/**
 * DIE KURATIERTE BIBLIOTHEK (Plan §7.2 Nr. 3) — die MECHANIK, nicht der
 * Inhalt.
 *
 * ── WAS SIE IST ───────────────────────────────────────────────────────────
 * Fertige Marktprofile bekannter Marken, VON HAND geprüft und im Repo
 * versioniert. Ein Kandidat mit `sourceKind: 'library'` wird beim Lauf NICHT
 * abgerufen — es gibt nichts zu holen, das Profil steht schon da. Zweck (§7.2):
 * Beispiele und Kalibrierung, ohne dass jeder Kunde dieselben fünf grossen
 * Websites erneut liest.
 *
 * ── WARUM SIE IM REPO LIEGT UND NICHT IN DER DATENBANK ───────────────────
 * Anhang B sagt es ausdrücklich: `market_library` geht nie in die Datenbank.
 * Ein Bibliotheks-Eintrag ist eine REDAKTIONELLE Aussage über eine fremde
 * Marke — sie gehört in die Versionsgeschichte, in ein Diff und in ein Review,
 * nicht in eine Zeile, die jemand nachts in der Konsole ändert. Und weil sie
 * versioniert ist, kann `MARKET_LIBRARY_VERSION` in den Bericht-Schlüssel
 * eingehen: eine korrigierte Bibliothek macht bestehende Berichte `stale`,
 * genau wie eine korrigierte eigene Aussage.
 *
 * ── WARUM SIE ZITATE TRAGEN DARF (§7.2 Nr. 3 gegen §7.6) ─────────────────
 * Der Prototyp zeigte Bibliotheks-Einträge nur mit NAMEN, ohne Beleg. Der Plan
 * verlangt für sie aber „nur wörtliche Zitate" — und beides zusammen ergibt
 * die Regel, die hier durchgesetzt wird: ein Bibliotheks-Feld MUSS eine
 * Quell-Adresse haben und DARF ein Zitat tragen; ohne Zitat bleibt es eine
 * Zusammenfassung ohne Beleg und ist damit genau das, was §1.4 dem Produkt
 * verbietet. Der Unterschied zur Website-Quelle ist NICHT die Beweislast,
 * sondern WER geprüft hat: dort eine Maschine gegen den Rohtext (`evidence ⊂
 * rawText`), hier ein MENSCH mit Datum und Namenszeichen (`verifiedAt`,
 * `verifiedBy`). Deshalb steht der Beleg-Riegel der Extraktion hier nicht zur
 * Verfügung — es gibt keinen Rohtext mehr, gegen den er prüfen könnte —, und
 * deshalb ist die Handprüfung Pflichtfeld statt Kür.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * ECHTE MARKEN. Die Einträge in `shared/library/index.ts` sind erfunden
 * (`.example`-Adressen). Die Paare aus §7.2 (adidas/Nike, Anthropic/OpenAI, …)
 * kommen erst, wenn ein MENSCH ihre Zitate am Original geprüft hat — eine
 * reale Marke einzutragen, bevor das passiert ist, wäre genau die Behauptung,
 * die der Marktvergleich nicht aufstellt.
 *
 * ── DER WEG DAHIN IST SEIT M6 GEBAUT, NICHT GEGANGEN ──────────────────────
 * `scripts/market-library-compute.mjs` rechnet Einträge vor (`--check`
 * Machbarkeit, `--compute` Rechnen, `--promote` Übernahme), das Runbook
 * `docs/runbooks/MARKTVERGLEICH-BIBLIOTHEK.md` führt die Handprüfung. Was das
 * Werkzeug erzeugt, ist ein ENTWURF (`marketLibraryDraftSchema`) und fällt
 * durch das Bibliotheks-Schema — `status: 'verified'` ist der eine Wert, den
 * kein Werkzeug setzt.
 */

const fieldIdSchema = z.enum(MARKET_FIELD_IDS)

/**
 * EIN FELD EINES BIBLIOTHEKS-EINTRAGS.
 *
 * `sourceUrl` ist PFLICHT, auch ohne Zitat: „woher wisst ihr das" muss immer
 * beantwortbar sein. `quote` ist optional, weil nicht jedes der zehn Felder
 * wörtlich auf einer Seite steht (Tonwörter sind eine Beobachtung), und
 * unterliegt derselben Zitatschranke wie überall (≤ 200 Zeichen).
 */
export const marketLibraryFieldSchema = z.object({
  fieldId: fieldIdSchema,
  value: z.string().trim().min(1).max(2000),
  items: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  sourceUrl: z.url().max(512),
  quote: z.string().trim().min(1).max(MARKET_EVIDENCE_MAX).optional(),
  confidence: z.enum(['stated', 'implied']).optional(),
})

export const marketLibraryEntrySchema = z.object({
  /** Der stabile Schlüssel — er steht in `market_competitors.sourceRef`. */
  key: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  /**
   * DER ZUSTAND — und er kennt hier genau EINEN erlaubten Wert (MV1 M6).
   *
   * Das Werkzeug `scripts/market-library-compute.mjs` rechnet Einträge
   * MASCHINELL vor und legt sie als ENTWURF unter `shared/library/drafts/`
   * ab (`status: 'draft'`, `verifiedAt`/`verifiedBy` null). Ein Entwurf ist
   * eine Behauptung über einen Dritten, die noch niemand am Original geprüft
   * hat — er darf die Bibliothek deshalb nicht erreichen, auch nicht durch
   * ein versehentliches Kopieren der Datei in `index.ts`.
   *
   * Vor M6 hing genau das an der Disziplin: `verifiedAt`/`verifiedBy` waren
   * Pflicht, aber ein Werkzeug, das sie mit dem heutigen Datum und seinem
   * eigenen Namen füllt, hätte das Schema bestanden. Ein Wert, den nur ein
   * MENSCH setzen darf, macht aus der Zusage eine Prüfung: `--promote`
   * verweigert die Übernahme, solange er auf `draft` steht.
   */
  status: z.literal('verified'),
  name: z.string().trim().min(1).max(200),
  /** Die Adresse der Marke — Herkunft der Belege, kein Abruf-Ziel. */
  homepage: z.url().max(512),
  /** Grobe Einordnung für den Quellen-Wähler (M4). */
  category: z.string().trim().max(120).default(''),
  /** WANN ein Mensch das geprüft hat — ohne Datum ist es keine Handprüfung. */
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** WER — ein Kürzel genügt, aber niemand darf es leer lassen. */
  verifiedBy: z.string().trim().min(2).max(80),
  fields: z.array(marketLibraryFieldSchema).min(1).max(MARKET_FIELD_IDS.length),
})

/**
 * DER ENTWURF — dieselbe Form, aber ausdrücklich UNGEPRÜFT (MV1 M6).
 *
 * Er ist das, was `scripts/market-library-compute.mjs --compute` schreibt: die
 * Felder stehen schon in Bibliotheks-Form, die Handprüfung fehlt. Die drei
 * Unterschiede sind ABSICHTLICH keine Auslassungen, sondern gesetzte Werte —
 * `null` sagt „hier war noch niemand", ein fehlendes Feld sagt nur „unbekannt",
 * und im Entwurf ist der Unterschied das Wesentliche.
 *
 * `computed` trägt die Herkunft der Rechnung (wann, womit, aus welchen
 * Seiten). Sie ist für die HANDPRÜFUNG da — wer ein Zitat gegen die Quelle
 * hält, will wissen, welcher Lauf es geholt hat — und wird beim Übernehmen
 * verworfen: in der Bibliothek steht, wer GEPRÜFT hat, nicht wer gerechnet hat.
 */
export const marketLibraryDraftSchema = marketLibraryEntrySchema.extend({
  status: z.literal('draft'),
  verifiedAt: z.null(),
  verifiedBy: z.null(),
  computed: z.object({
    at: z.string().min(1).max(40),
    /** `stub` = ohne bezahlten Aufruf gerechnet, `paid` = echter Modell-Lauf. */
    mode: z.enum(['stub', 'paid']),
    tool: z.string().min(1).max(120),
    /** Die Seiten, aus denen die Belege stammen — der Prüfpfad des Menschen. */
    pages: z.array(z.url().max(512)).max(MARKET_MAX_PAGES),
  }),
})

export const marketLibrarySchema = z.object({
  /**
   * Die Fassung der Bibliothek. Sie geht in den Bericht-Schlüssel ein —
   * wer einen Eintrag ändert, hebt sie, sonst behält ein gespeicherter Bericht
   * seine alten Sätze und hält sich für aktuell.
   */
  version: z.string().trim().min(1).max(40),
  entries: z.array(marketLibraryEntrySchema).max(200),
})

export type MarketLibraryField = z.infer<typeof marketLibraryFieldSchema>
export type MarketLibraryEntry = z.infer<typeof marketLibraryEntrySchema>
export type MarketLibraryDraft = z.infer<typeof marketLibraryDraftSchema>
export type MarketLibrary = z.infer<typeof marketLibrarySchema>

/**
 * DIE GEPRÜFTE BIBLIOTHEK — EINMAL beim ersten Zugriff gegen das Schema
 * gehalten, danach gemerkt.
 *
 * FAIL-CLOSED: eine kaputte Bibliothek ist LEER, nicht „so gut wie möglich".
 * Ein halb gelesener Eintrag wäre ein Marktprofil ohne die Felder, die der
 * Redakteur für die wichtigsten hielt — und niemand sähe, dass etwas fehlt.
 * Der Unit-Test hält die ausgelieferte Datei gegen dasselbe Schema; sie kann
 * also nur kaputt sein, wenn jemand am Wächter vorbei committet.
 */
let cached: MarketLibrary | null = null

export function marketLibrary(): MarketLibrary {
  if (cached) return cached
  const parsed = marketLibrarySchema.safeParse({
    version: MARKET_LIBRARY_VERSION,
    entries: MARKET_LIBRARY_ENTRIES,
  })
  cached = parsed.success ? parsed.data : { version: MARKET_LIBRARY_VERSION, entries: [] }
  return cached
}

export function marketLibraryVersion(): string {
  return marketLibrary().version
}

export function marketLibraryEntry(key: string): MarketLibraryEntry | undefined {
  return marketLibrary().entries.find(entry => entry.key === key)
}

/**
 * ALLE EINTRÄGE — für den Quellen-Wähler (MV1 M4).
 *
 * Er braucht die LISTE, nicht einen Schlüssel; sie ist dieselbe geprüfte
 * Menge wie überall (`marketLibrary()` ist fail-closed: fällt die Datei durch
 * das Schema, ist die Bibliothek leer, und der Wähler zeigt dann eben
 * nichts). Eine zweite Leseroutine daneben wäre der zweite Ort, an dem eine
 * kaputte Datei anders behandelt wird.
 */
export function marketLibraryEntries(): readonly MarketLibraryEntry[] {
  return marketLibrary().entries
}

/**
 * EIN BIBLIOTHEKS-EINTRAG ALS MARKTPROFIL — dieselbe Form wie jede andere
 * Quelle (Plan §7.1: „ein Motor, drei Ansichten"; die gemeinsame Währung ist
 * das Marktprofil).
 *
 * OHNE `frequency`: „auf wie vielen Seiten steht das" hat ein handgeprüfter
 * Eintrag nicht gemessen, und eine erfundene Zahl sähe aus wie eine Messung
 * (dieselbe Begründung wie bei der Foundation-Quelle).
 *
 * `fetchedAt` ist das PRÜFDATUM. Es ist kein Abrufdatum, aber es beantwortet
 * dieselbe Frage — „wie alt ist diese Aussage" —, und ein leeres Feld an der
 * Stelle liesse die Oberfläche behaupten, der Beleg sei von heute.
 */
export function marketLibraryFields(entry: MarketLibraryEntry): MarketProfileField[] {
  return entry.fields.map((field) => {
    const base: MarketProfileField = {
      fieldId: field.fieldId,
      value: field.value,
      ...(field.items?.length ? { items: field.items } : {}),
      source: 'library',
    }
    if (!field.quote) return base
    return {
      ...base,
      evidence: {
        quote: field.quote,
        sourceUrl: field.sourceUrl,
        fetchedAt: entry.verifiedAt,
        confidence: field.confidence ?? 'stated',
      },
    }
  })
}
