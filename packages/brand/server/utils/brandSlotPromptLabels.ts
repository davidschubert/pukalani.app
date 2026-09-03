import type { BrandPathKind } from '../../shared/slotRegistry'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'

/**
 * DIE MENSCHLICHE BESCHRIFTUNG EINES SLOTS FÜR PROMPTS (2026-09-03, Davids
 * Live-Fund): die Eingabe-Blöcke reisten als `[a.customerPraise]` zum Modell,
 * und George sprach die internen Ids im Chat nach („Die Felder
 * a.customerPraise, a.oneThing … enthalten Platzhalter"). Ein Mensch kennt
 * diese Namen nicht — die Blöcke tragen jetzt die FRAGE bzw. das Label aus
 * dem Locale-Katalog, in der INHALTSSPRACHE des Profils.
 *
 * Der Katalog ist dieselbe Quelle wie die UI (`brand.q.<id>`, von
 * `questionKeyFor` adressiert): eine zweite Label-Liste hier wäre das fünfte
 * getrennte Regelwerk. Pfad-Varianten ({ new, relaunch }) löst `pathKind`
 * auf; fehlt ein Eintrag (deaktivierte Alt-Slots), bleibt die Id der
 * ehrliche Rückfall — besser ein interner Name als ein erfundenes Label.
 */

type CatalogNode = string | { [key: string]: CatalogNode }

const CATALOGS: Record<string, CatalogNode> = {
  de: (de as { brand: { q: CatalogNode } }).brand.q,
  en: (en as { brand: { q: CatalogNode } }).brand.q,
}

/** Dieselbe Beschriftung für eine ganze Dependency-Liste (Prompt-Aufbau). */
export function labelSlotDependencies<T extends { slotId: string }>(
  dependencies: readonly T[],
  contentLocale: string,
  pathKind: BrandPathKind,
): (T & { label: string })[] {
  return dependencies.map(dependency => ({
    ...dependency,
    label: brandSlotPromptLabel(dependency.slotId, contentLocale, pathKind),
  }))
}

export function brandSlotPromptLabel(
  slotId: string,
  contentLocale: string,
  pathKind: BrandPathKind,
): string {
  const catalog = CATALOGS[contentLocale] ?? CATALOGS.en!
  let node: CatalogNode | undefined = catalog
  for (const segment of slotId.split('.')) {
    if (typeof node !== 'object' || node === null) { node = undefined; break }
    node = node[segment]
  }
  if (typeof node === 'string') return node
  if (node && typeof node === 'object') {
    const variant = node[pathKind] ?? node.new ?? Object.values(node)[0]
    if (typeof variant === 'string') return variant
  }
  return slotId
}
