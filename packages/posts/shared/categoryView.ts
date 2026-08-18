/**
 * DREI ANSICHTEN AUF DIESELBE LISTE (Davids Entscheidung 2026-08-18).
 *
 * Der Owner ordnet die Kategorien (Ziehen im Dashboard) — das ist die
 * Voreinstellung und bleibt die Wahrheit. Ein Besucher darf trotzdem anders
 * schauen: nach Betrieb oder alphabetisch.
 *
 * ── WARUM DAS KEINE KONTO-EINSTELLUNG IST ─────────────────────────────────
 * Eine Navigationsliste lebt von BESTÄNDIGKEIT: „Preise ist das Dritte von
 * oben" ist eine Fähigkeit, die Mitglieder aufbauen — und die verlieren sie,
 * wenn die Liste je Konto anders steht. Der Gewinn wäre klein (zwanzig
 * Einträge, Suchfeld darüber), der Preis eine gespeicherte Präferenz samt der
 * Frage, ob sie für ALLE Communities gilt oder für diese eine. Die Wahl lebt
 * deshalb im Browser, wie Hell/Dunkel und die Seitenleiste.
 *
 * ── WARUM DIE VOREINSTELLUNG NICHT „AKTIVSTE" IST ─────────────────────────
 * Weil eine Liste, die sich von allein umsortiert, keine Adresse mehr ist.
 * Der Owner soll seine Struktur zeigen können; wer den Betrieb sehen will,
 * sagt es mit einem Klick.
 *
 * PURE (unit-getestet): sortiert wird NIE in der Route, sondern hier — die
 * Route liefert weiter die Reihenfolge des Owners, damit ein Besucher ohne
 * JavaScript und jeder Crawler genau die sieht.
 */

export const CATEGORY_VIEWS = ['recommended', 'active', 'az'] as const
export type CategoryView = typeof CATEGORY_VIEWS[number]

export const DEFAULT_CATEGORY_VIEW: CategoryView = 'recommended'

/** Fremde/alte Cookie-Werte fallen auf die Voreinstellung zurück. */
export function normalizeCategoryView(value: unknown): CategoryView {
  return (CATEGORY_VIEWS as readonly string[]).includes(value as string)
    ? value as CategoryView
    : DEFAULT_CATEGORY_VIEW
}

export interface CategoryViewRow {
  topicCount: number
}

/**
 * Die Liste in der gewählten Ansicht.
 *
 * `nameOf` kommt von aussen, weil der ANGEZEIGTE Name sortiert werden muss und
 * nicht die Grundfassung: in der englischen Fassung steht „General" unter G,
 * nicht unter A (categoryI18n.ts). Aus demselben Grund `localeCompare` mit der
 * Sprache der Seite — sonst landet „Ärger" hinter „Zusammenarbeit".
 *
 * NICHT AN ORT UND STELLE: die Eingabe bleibt unangetastet, damit die Ansicht
 * die geladene Liste nicht dauerhaft umstellt.
 */
export function sortCategoriesForView<T extends CategoryViewRow>(
  rows: readonly T[],
  view: CategoryView,
  nameOf: (row: T) => string,
  locale: string,
): T[] {
  if (view === 'recommended') return [...rows]

  const byName = (a: T, b: T) => nameOf(a).localeCompare(nameOf(b), locale, { sensitivity: 'base' })
  if (view === 'az') return [...rows].sort(byName)

  // 'active': viele Themen zuerst. Bei Gleichstand ALPHABETISCH und nicht in
  // der Reihenfolge des Owners — sonst sähe „Aktivste" in einer jungen
  // Community (alles 0) exakt aus wie „Empfohlen", und der Umschalter wirkte
  // kaputt.
  return [...rows].sort((a, b) => (b.topicCount - a.topicCount) || byName(a, b))
}
