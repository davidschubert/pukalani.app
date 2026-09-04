import { type BrandPathKind, type BrandSlot, partKeyFor, partLabelKeyFor } from '../../shared/slotRegistry'
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

/**
 * DIE GANZEN KATALOGE — für die Teile einer Sammel-Session (Paket 3a), die
 * NICHT unter `brand.q` liegen: die Frage eines Teils steht unter
 * `brand.part.<id>.<teil>`, sein kurzes Etikett unter `brand.partLabel.…`
 * (`slotRegistry.ts`, Begründung dort). Ein zweiter Zugriffspfad auf dieselbe
 * Datei, keine zweite Datei.
 */
const ROOTS: Record<string, CatalogNode> = {
  de: de as unknown as CatalogNode,
  en: en as unknown as CatalogNode,
}

function lookup(root: CatalogNode | undefined, key: string): string | null {
  let node: CatalogNode | undefined = root
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) return null
    node = node[segment]
  }
  return typeof node === 'string' ? node : null
}

/**
 * DIE FRAGE EINES TEILS einer Sammel-Session, in der gewünschten Sprache.
 *
 * Sie geht in Georges Prompt („frage jetzt genau nach diesem einen Teil") und
 * folgt damit derselben Regel wie `brandSlotPromptLabel`: kein erfundener Text,
 * sondern der Katalog-Satz, den die Oberfläche auch zeigt. Fehlt er, bleibt
 * die Teil-Id der ehrliche Rückfall.
 */
export function brandSessionPartQuestion(slot: BrandSlot, part: string, locale: string): string {
  return lookup(ROOTS[locale] ?? ROOTS.en, partKeyFor(slot, part)) ?? part
}

/**
 * DAS KURZE ETIKETT EINES TEILS — die Überschrift seines Blocks im
 * zusammengelegten `structured`-Wert („Team", „Seit", „Märkte").
 *
 * IMMER in der INHALTSSPRACHE der Marke, nie in der der Seite: der Wert gehört
 * dem Brand-Dokument, und das ist einsprachig (dieselbe Trennung wie bei
 * `contentLocale` gegenüber `uiLocale`).
 */
export function brandSessionPartLabel(slot: BrandSlot, part: string, contentLocale: string): string {
  return lookup(ROOTS[contentLocale] ?? ROOTS.en, partLabelKeyFor(slot, part)) ?? part
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
