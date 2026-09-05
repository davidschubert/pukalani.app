import { z } from 'zod'
import { isBrandWebsiteUrl } from '../shared/brandStartCard'

/**
 * DIE WARTELISTE — der EINE Rumpf von `POST /api/brand/waitlist`.
 *
 * ── WOFÜR SIE DA IST ──────────────────────────────────────────────────────
 * branding.supply läuft in geschlossener Beta: ohne Einladungscode gibt es
 * heute keinen Weg, etwas zu hinterlassen — die Seite sagt „wir melden uns"
 * und meint niemanden. Dieses Schema beschreibt das kleinste ehrliche
 * Gegenteil davon: eine Adresse, ein paar freiwillige Angaben, und die
 * Herkunftsseite, damit später nachvollziehbar ist, WO jemand gefragt hat.
 *
 * ── NUR DIE ADRESSE IST PFLICHT ───────────────────────────────────────────
 * Jedes zusätzliche Pflichtfeld kostet Anfragen. Name, Firma und Website sind
 * deshalb optional und haben `''` als Vorgabewert — dasselbe `''` wie in der
 * Startkarte (`brandStartCard.ts`): ein leeres Feld ist ein GEANTWORTETES
 * Feld ohne Inhalt, kein fehlender Wert.
 *
 * ── DIE ADRESSE WIRD NORMALISIERT, NICHT NUR GEPRÜFT ──────────────────────
 * `trim` → `toLowerCase` → `email`, in dieser Reihenfolge. Der Kern-Helfer
 * (`packages/core/schemas/auth.ts`) prüft ZUERST und trimmt danach; hier ist
 * es umgekehrt, weil eine aus einer Mail kopierte Adresse regelmäßig mit einem
 * Leerzeichen ankommt und ein 400 an dieser Stelle einen Lead kostet. Der
 * gespeicherte Wert ist damit zugleich der Vergleichswert des UNIQUE-Index
 * (`emailLower`) — die Route muss nichts mehr daran tun.
 *
 * ── DIE WEB-ADRESSE DARF OHNE SCHEMA KOMMEN ───────────────────────────────
 * `isBrandWebsiteUrl` (Startkarte) verlangt `http://` oder `https://` — im
 * Wizard richtig, hier zu streng: wer in ein Lead-Formular „kailua.coffee"
 * tippt, hat die Frage beantwortet. Deshalb wird ein fehlendes Schema ERGÄNZT
 * (`https://`) statt abgelehnt, und erst das Ergebnis geprüft. Ein Punkt im
 * Hostnamen bleibt Pflicht: ohne ihn wäre jedes Wort („test") eine gültige
 * Adresse, und das Feld sagte nichts mehr aus.
 *
 * ── `hp` IST DIE FALLE, KEIN DATENFELD ────────────────────────────────────
 * Ein verstecktes Feld, das ein Mensch nie sieht und ein einfacher Bot immer
 * ausfüllt. Es ist hier ERLAUBT (sonst wiese `.strict()` den Bot mit einem
 * 400 ab und verriete ihm die Falle) und wird in der Route ausgewertet: gefüllt
 * ⇒ dieselbe 200-Antwort wie sonst, nur ohne Zeile. Gespeichert wird es nie.
 */

export const BRAND_WAITLIST_EMAIL_MAX = 256
export const BRAND_WAITLIST_NAME_MAX = 120
export const BRAND_WAITLIST_COMPANY_MAX = 160
export const BRAND_WAITLIST_WEBSITE_MAX = 256
export const BRAND_WAITLIST_SOURCE_MAX = 64
/** Der Honigtopf hat keinen Zweck außer „ist er leer?" — Deckel gegen Unfug. */
export const BRAND_WAITLIST_HONEYPOT_MAX = 256

/** Die Sprache, in der jemand gefragt hat — Grundlage der Antwort-Mail. */
export type BrandWaitlistLocale = 'de' | 'en'

/**
 * Ergänzt ein fehlendes Schema (s. Kopf). Ein bereits vorhandenes bleibt
 * unangetastet — auch ein falsches (`ftp://`), damit die Prüfung darunter es
 * ABLEHNEN kann, statt dass wir es still zu `https://ftp://…` verbiegen.
 */
export function normalizeBrandWaitlistWebsite(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** http(s), parsebar UND mit einem Punkt im Hostnamen (s. Kopf). */
export function isBrandWaitlistWebsite(value: string): boolean {
  if (!value) return true
  if (!isBrandWebsiteUrl(value)) return false
  try {
    return new URL(value).hostname.includes('.')
  }
  catch {
    return false
  }
}

export function createBrandWaitlistSchema() {
  return z.object({
    email: z.string().trim().toLowerCase().max(BRAND_WAITLIST_EMAIL_MAX).pipe(z.email()),
    name: z.string().trim().max(BRAND_WAITLIST_NAME_MAX).default(''),
    company: z.string().trim().max(BRAND_WAITLIST_COMPANY_MAX).default(''),
    website: z.string().trim().max(BRAND_WAITLIST_WEBSITE_MAX)
      .transform(normalizeBrandWaitlistWebsite)
      // Nach dem Ergänzen des Schemas kann der Wert acht Zeichen länger sein
      // als die Eingabe — die Spalte fasst 256, also wird HIER erneut gemessen.
      .refine(value => value.length <= BRAND_WAITLIST_WEBSITE_MAX, {
        message: 'brand.validation.websiteUrl',
      })
      .refine(isBrandWaitlistWebsite, { message: 'brand.validation.websiteUrl' })
      .default(''),
    // Die Oberflächen-Sprache der fragenden Seite. Kein freier String: sie
    // entscheidet später, in welcher Sprache geantwortet wird.
    locale: z.enum(['de', 'en']).default('en'),
    // WELCHE Seite gefragt hat ('about', 'team', 'invite', 'home', …). Bewusst
    // ein freier String mit Deckel und keine Aufzählung: eine neue Landeseite
    // soll eine Zeile im Formular sein, keine Migration und kein 400.
    source: z.string().trim().max(BRAND_WAITLIST_SOURCE_MAX).default(''),
    hp: z.string().max(BRAND_WAITLIST_HONEYPOT_MAX).optional(),
  }).strict()
}

export type BrandWaitlistInput = z.output<ReturnType<typeof createBrandWaitlistSchema>>
