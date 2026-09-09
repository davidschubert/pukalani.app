/**
 * DIE PUREN REGELN DER STARTKARTE (Content-Spec §2.1) — Deckel und die eine
 * Adress-Prüfung, gelesen von BEIDEN Enden.
 *
 * ── WARUM NICHT IM ZOD-SCHEMA ─────────────────────────────────────────────
 * Das Anlage-Formular braucht dieselben Zahlen (`maxlength` an den Feldern)
 * und dieselbe Adress-Prüfung (der Absenden-Knopf bleibt sonst freigegeben,
 * bis der Server mit 400 antwortet). Läge beides in `schemas/brandProfile.ts`,
 * zöge jede Seite, die es braucht, `zod` ins Browser-Bündel — für vier Zahlen
 * und zwölf Zeilen. Das Schema importiert von HIER, nie umgekehrt.
 *
 * ── DIE ZAHLEN SIND ZUGLEICH DIE SPALTEN-GRÖSSEN ──────────────────────────
 * Migration brand-009 legt genau diese Grössen an (websiteUrl 256 ·
 * industry 120 · about 2.000 · audience 500). Wer eine ändert, ändert beide:
 * ein Zod-Deckel über der Spalte liefe in einen Appwrite-Fehler statt in eine
 * Formular-Meldung.
 */

export const BRAND_WEBSITE_URL_MAX = 256
export const BRAND_INDUSTRY_MAX = 120
export const BRAND_ABOUT_MAX = 2_000
export const BRAND_AUDIENCE_MAX = 500

/**
 * EINE ADRESSE ODER GAR KEINE — ein Zwischending gibt es nicht.
 *
 * `''` ist gültig (die URL ist laut §2.1 optional). Alles andere muss sich als
 * http(s)-URL parsen lassen: George bekommt das Feld als Tatsache in den
 * Prompt, und „irgendein Text, der wie eine Adresse aussieht" wäre dort eine
 * Behauptung, die niemand geprüft hat. Andere Schemata (mailto:, javascript:)
 * werden ABGEWIESEN statt normalisiert — ein Feld, das still etwas anderes
 * speichert als der Mensch getippt hat, ist schwerer zu erklären als ein 400.
 */
export function isBrandWebsiteUrl(value: string): boolean {
  if (!value) return true
  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * ── DIE ANLAGE ALS EIN DATENSATZ (Kailua-Befund 6, 2026-09-08) ────────────
 *
 * Bis heute erhob das Modal auf `/dashboard/brands` drei Dinge (Weiche, Titel,
 * Sprache) und reichte sie als Query an `/dashboard/brands/new` weiter, wo
 * dieselben drei Felder ein zweites Mal standen. Davids Entscheidung: das Modal
 * LEGT AN und springt in die Werkstatt; die Seite bleibt das Ziel direkter
 * Links und fragt jedes Feld genau einmal.
 *
 * Damit gibt es zwei Oberflächen für EINE Anlage — und deshalb liegt hier, was
 * beide brauchen: die Form des Entwurfs, sein Anfangswert, die Frage „ist er
 * vollständig" und die Übersetzung in den Rumpf der Route. Ein zweites Mal von
 * Hand gebaut wäre es die Stelle, an der Modal und Seite auseinanderlaufen —
 * und die Abweichung sähe man erst an einem Branding, dem ein Feld fehlt.
 *
 * PUR, damit ein Test sie ohne Formular prüfen kann.
 */
export interface BrandNewDraft {
  /** W2 (Katalog §2.2) — gilt nur auf dem Relaunch-Pfad. */
  relaunchScope: 'refine' | 'recut'
  /** „Name auf den Prüfstand" — nur beim Neuschnitt sichtbar, sonst immer false. */
  namingOpted: boolean
  title: string
  contentLocale: string
  team: 'solo' | 'team'
  websiteUrl: string
  industry: string
  about: string
  audience: string
}

export function emptyBrandNewDraft(contentLocale: string): BrandNewDraft {
  return {
    relaunchScope: 'refine',
    namingOpted: false,
    title: '',
    contentLocale,
    team: 'solo',
    websiteUrl: '',
    industry: '',
    about: '',
    audience: '',
  }
}

/**
 * Drei Pflichtfelder, eine freiwillige Adresse — und die Adresse muss, WENN sie
 * dasteht, eine sein. Dieselbe Rechnung wie im Anlage-Schema: der Knopf soll
 * nicht freigegeben aussehen, um dann mit „konnte nicht angelegt werden" zu
 * antworten.
 */
export function brandNewDraftComplete(draft: BrandNewDraft): boolean {
  return draft.industry.trim().length > 0
    && draft.about.trim().length > 0
    && draft.audience.trim().length > 0
    && isBrandWebsiteUrl(draft.websiteUrl.trim())
}

/**
 * Der Rumpf für `POST /api/brand/profiles`. `relaunchScope` gehört NUR auf den
 * Relaunch-Pfad (das Schema lehnt ihn sonst ab, statt ihn still zu schlucken),
 * und `namingOpted` fällt mit dem Feinschliff — die Weiche W2 friert es ein.
 */
export function brandNewDraftBody(
  pathKind: 'new' | 'relaunch',
  draft: BrandNewDraft,
): Record<string, unknown> {
  const recut = pathKind === 'relaunch' && draft.relaunchScope === 'recut'
  return {
    title: draft.title.trim(),
    contentLocale: draft.contentLocale,
    pathKind,
    ...(pathKind === 'relaunch' ? { relaunchScope: draft.relaunchScope } : {}),
    hasName: pathKind === 'relaunch',
    team: draft.team,
    subBrands: 'unknown',
    namingOpted: recut ? draft.namingOpted : false,
    websiteUrl: draft.websiteUrl.trim(),
    industry: draft.industry.trim(),
    about: draft.about.trim(),
    audience: draft.audience.trim(),
  }
}
