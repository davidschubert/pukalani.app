import { baseLanguage } from '../../core/shared/localeAlternates'

/**
 * DIE SPRACH-REGELN DER BETREIBER-SEITEN — pur, damit sie an beiden Enden
 * (öffentliche Seite und Editor) dieselbe Antwort geben.
 *
 * Hintergrund F60: eine Seite hat seit `pages-001` je Sprache eine eigene
 * Zeile, und die öffentliche Route fällt auf eine andere Fassung zurück, wenn
 * es die gewünschte nicht gibt. Bis heute geschah das STUMM — der Leser bekam
 * unter `/imprint` deutschen Text, das Dokument behauptete `lang="en"`, und der
 * Kopf bewarb ein englisches Alternate, hinter dem nichts Englisches stand.
 * Diese Datei ist die eine Stelle, die „das ist eine Ersatzsprache" entscheidet.
 */

/**
 * Ist die gelieferte Fassung eine ERSATZSPRACHE?
 *
 * Verglichen wird die Sprache ohne Region (`de-DE` und `de` sind dieselbe
 * Fassung für den Leser). Fehlt eine der beiden Angaben, lautet die Antwort
 * NEIN: ein Hinweis, den wir nicht belegen können, wäre schlimmer als keiner.
 */
export function isFallbackLocale(requested: string | null | undefined, delivered: string | null | undefined): boolean {
  const want = baseLanguage(requested)
  const got = baseLanguage(delivered)
  if (!want || !got) return false
  return want !== got
}

/**
 * Die Sprachen der App in EINER Reihenfolge: Standardsprache zuerst, der Rest
 * wie in der Config. Der Editor zeigt seine Reiter danach — die Fassung, von
 * der übersetzt wird, steht links.
 */
export function orderedLocales(available: readonly string[], defaultLocale: string): string[] {
  const wanted = baseLanguage(defaultLocale)
  const first = available.filter(code => baseLanguage(code) === wanted)
  return [...first, ...available.filter(code => baseLanguage(code) !== wanted)]
}

/**
 * Aus welcher Fassung übersetzt der KI-Vorschlag?
 *
 * Die erste ANDERE Sprache, die überhaupt Inhalt hat — bevorzugt die
 * Standardsprache, weil dort im Regelfall die Urfassung steht. Gibt es keine,
 * ist `null` die richtige Antwort und der Knopf bleibt weg: aus dem Nichts
 * übersetzt niemand.
 */
export function translationSourceLocale(
  target: string,
  filled: readonly string[],
  defaultLocale: string,
): string | null {
  const candidates = orderedLocales(filled, defaultLocale)
    .filter(code => baseLanguage(code) !== baseLanguage(target))
  return candidates[0] ?? null
}
