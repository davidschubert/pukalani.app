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
