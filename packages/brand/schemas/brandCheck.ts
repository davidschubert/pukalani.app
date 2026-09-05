import { z } from 'zod'
import { isBrandWebsiteUrl } from '../shared/brandStartCard'
import { normalizeBrandWaitlistWebsite } from './brandWaitlist'

/**
 * DER RUMPF VON `POST /api/brand/check` — die EINZIGE öffentliche Route des
 * Layers, die eine ausgehende Verbindung auslöst UND einen KI-Aufruf bezahlt.
 *
 * ── DAS SCHEMA IST HIER DIE ERSTE SICHERUNG ───────────────────────────────
 * Es gibt kein Konto davor (Davids Hybrid-Zugang: „Score sofort ohne
 * Anmeldung"). Was diese Route also an Grenzen hat, hat sie hier, in der
 * Drossel (`brand:check`, 3/min je IP), in den zwei Tages-Deckeln der Route
 * und im SSRF-Vertrag von `shared/brandSiteAnalysis.ts`. Ein offenes
 * `z.string()` wäre die Einladung, mit einer 10-MB-„Adresse" anzufangen.
 *
 * ── DAS SCHEMA WIRD ERGÄNZT, NICHT NUR GEPRÜFT ────────────────────────────
 * Wer in ein Prüf-Feld „kailua.coffee" tippt, hat die Frage beantwortet.
 * Das fehlende `https://` ergänzt DIESELBE Funktion wie in der Warteliste
 * (`normalizeBrandWaitlistWebsite`) — eine zweite Variante wäre eine, die
 * irgendwann anders normalisiert als die erste. Ein vorhandenes, aber falsches
 * Schema (`ftp://`) bleibt stehen, damit die Prüfung darunter es ABLEHNEN kann.
 *
 * ── `hp` IST DIE FALLE, KEIN DATENFELD ────────────────────────────────────
 * Dasselbe Muster wie in der Warteliste: erlaubt (sonst wiese `.strict()` den
 * Bot mit einem 400 ab und verriete ihm die Falle), in der Route ausgewertet,
 * nie gespeichert.
 */

/**
 * 512 ist der Deckel der Spalte `brand_checks.url`; 4 ist die kürzeste
 * Zeichenkette, aus der nach dem Ergänzen des Schemas überhaupt eine Adresse
 * mit Punkt werden kann (`a.de`).
 */
export const BRAND_CHECK_URL_MIN = 4
export const BRAND_CHECK_URL_MAX = 512
export const BRAND_CHECK_HONEYPOT_MAX = 256

/** http(s), parsebar UND mit einem Punkt im Hostnamen (wie die Warteliste). */
export function isBrandCheckUrl(value: string): boolean {
  if (!isBrandWebsiteUrl(value)) return false
  try {
    return new URL(value).hostname.includes('.')
  }
  catch {
    return false
  }
}

export function createBrandCheckSchema() {
  return z.object({
    url: z.string().trim()
      .min(BRAND_CHECK_URL_MIN, { message: 'brand.validation.websiteUrl' })
      .max(BRAND_CHECK_URL_MAX, { message: 'brand.validation.websiteUrl' })
      .transform(normalizeBrandWaitlistWebsite)
      // Nach dem Ergänzen kann der Wert acht Zeichen länger sein als die
      // Eingabe — die Spalte fasst 512, also wird HIER erneut gemessen.
      .refine(value => value.length <= BRAND_CHECK_URL_MAX, { message: 'brand.validation.websiteUrl' })
      .refine(isBrandCheckUrl, { message: 'brand.validation.websiteUrl' }),
    // Die Sprache der FRAGENDEN Seite. Sie entscheidet über die Sprache der
    // Ergebnis-Seite, NICHT über die der Belege: ein Zitat spricht die Sprache
    // der geprüften Seite, sonst wäre es kein Zitat mehr (Plan §2).
    locale: z.enum(['de', 'en']).default('en'),
    hp: z.string().max(BRAND_CHECK_HONEYPOT_MAX).optional(),
  }).strict()
}

export type BrandCheckInput = z.output<ReturnType<typeof createBrandCheckSchema>>

/**
 * DIE ANTWORT DES MODELLS auf die beurteilten Kriterien (Plan §2).
 *
 * ── JE EINTRAG GEPRÜFT, NICHT DIE GANZE LISTE ─────────────────────────────
 * Bewusst KEIN Schema über das ganze Array: fiele die Antwort als Ganzes
 * durch, weil EIN Eintrag eine `score: 3` trägt, verlöre der Check 23 gültige
 * Urteile wegen eines Ausrutschers — und der Mensch bekäme einen leeren
 * Bericht statt eines fast vollständigen. Der Aufrufer prüft deshalb Eintrag
 * für Eintrag; was durchfällt, ist „nicht bewertbar" (`null`), nicht 0.
 *
 * `id` wird hier NICHT gegen den Katalog geprüft — das tut der Aufrufer, der
 * ihn kennt. Hier steht nur die FORM.
 */
export const BRAND_CHECK_JUDGE_EVIDENCE_MAX = 160
export const BRAND_CHECK_JUDGE_NOTE_MAX = 240

export function createBrandCheckJudgementSchema() {
  return z.object({
    id: z.string().trim().min(1).max(8),
    // `z.coerce` wäre hier falsch: ein Modell, das "2" als Zeichenkette
    // schickt, hat die Form verfehlt — und aus einem "zwei" würde `NaN`, aus
    // einem "" eine 0. Lieber ein Eintrag weniger als eine erfundene Note.
    score: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    // Der BELEG ist Pflicht: ein Urteil ohne Zitat ist genau das „gefühlt",
    // gegen das der ganze Check gebaut ist (Plan §2).
    evidence: z.string().trim().min(1).max(BRAND_CHECK_JUDGE_EVIDENCE_MAX * 4)
      .transform(value => value.slice(0, BRAND_CHECK_JUDGE_EVIDENCE_MAX)),
    note: z.string().trim().max(BRAND_CHECK_JUDGE_NOTE_MAX * 4)
      .transform(value => value.slice(0, BRAND_CHECK_JUDGE_NOTE_MAX))
      .default(''),
  })
}

export type BrandCheckJudgementInput = z.output<ReturnType<typeof createBrandCheckJudgementSchema>>
