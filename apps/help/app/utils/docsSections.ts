import type { InjectionKey, Ref } from 'vue'
import type { ContentNavigationItem } from '@nuxt/content'
import type { DocsCollectionKey, DocsNavigation, DocsSection, DocsSectionKey } from '../../shared/types/docs'

/**
 * Die zwei Abschnitte der Hilfe-Site. EINE Quelle für Kopfzeile, Seitenleiste
 * und Seiten-Abfrage — der Abschnitt wird immer aus dem Pfad abgeleitet, nie
 * geraten. Die Domänen-Typen dazu liegen in shared/types/docs.ts
 * (Projektregel), hier bleibt nur die Utility.
 *
 * Der `prefix` ist der Pfad OHNE Sprache; wer daraus einen Link macht, schickt
 * ihn durch `localePath()`.
 */
export const DOCS_SECTIONS = [
  { key: 'anleitung', prefix: '/anleitung', labelKey: 'docs.sections.anleitung', icon: 'i-ph-compass' },
  { key: 'entwickler', prefix: '/entwickler', labelKey: 'docs.sections.entwickler', icon: 'i-ph-code' },
] as const satisfies readonly DocsSection[]

export const docsNavigationKey = Symbol('docs-navigation') as InjectionKey<Ref<DocsNavigation | null | undefined>>

/**
 * Schneidet ein führendes `/de` ab — aber NUR, wenn danach ein `/` folgt oder
 * der Pfad endet.
 *
 * Der Lookahead ist kein Zierrat, sondern die Vorkehrung gegen eine Falle, die
 * hier schon EINMAL live zugeschlagen hat: Solange `/en` das Sprach-Prefix war,
 * begann der Abschnitt `/entwickler` selbst mit genau diesen Zeichen. Ein
 * schlichtes `path.replace(/^\/en/, '')` machte daraus `twickler`, und der
 * Entwickler-Bereich fiel stillschweigend in die Anleitung zurück —
 * Seitenleiste und Suche zeigten die falsche Sammlung, ohne dass irgendwo ein
 * Fehler entstand.
 *
 * Der Sprach-Tausch vom 2026-08-18 (`/en` → `/de`) entschärft diesen EINEN
 * Fall, nicht die Fallenklasse: heute beginnt kein Abschnitt mit `de`, aber ein
 * künftiger Pfad, der zufällig so weitergeht (`/design`, `/developers`), fiele
 * ohne die Grenzregel genauso lautlos um. Die Regel bleibt deshalb stehen.
 */
const SPRACH_PREFIX = /^\/de(?=\/|$)/

/** Pfad → Abschnitt, gleich in welcher Sprache. Alles außerhalb von `/entwickler` ist Anleitung. */
export function resolveDocsSection(path: string): DocsSectionKey {
  const ohneSprache = path.replace(SPRACH_PREFIX, '')
  return ohneSprache.startsWith('/entwickler') ? 'entwickler' : 'anleitung'
}

/** Ist das eine deutsche Route? Dieselbe Grenzregel wie oben. */
export function isGermanDocsPath(path: string): boolean {
  return SPRACH_PREFIX.test(path)
}

/**
 * Abschnitt + Sprache → Sammlungsname (content.config.ts). Die einzige Stelle,
 * an der die vier Sammlungsnamen stehen; alles andere denkt in Abschnitten.
 *
 * Die Vorgabe-Sprache (Englisch) trägt den nackten Abschnittsnamen, weil ihre
 * Sammlung an der Content-Wurzel liegt — nur Deutsch bekommt die Endung.
 */
export function docsCollection(section: DocsSectionKey, locale: string): DocsCollectionKey {
  if (!locale.startsWith('de')) return section
  return section === 'entwickler' ? 'entwicklerDe' : 'anleitungDe'
}

/** Startseiten-Sammlung je Sprache. */
export function docsLandingCollection(locale: string): 'landing' | 'landingDe' {
  return locale.startsWith('de') ? 'landingDe' : 'landing'
}

/** Pfad-Prefix eines Abschnitts inklusive Sprache — so wie ihn die Sammlung trägt. */
export function docsSectionPrefix(section: DocsSectionKey, locale: string): string {
  const prefix = DOCS_SECTIONS.find(entry => entry.key === section)?.prefix ?? '/anleitung'
  return locale.startsWith('de') ? `/de${prefix}` : prefix
}

/**
 * Sucht den Knoten mit genau diesem Pfad — auch TIEFER als auf der obersten
 * Ebene.
 *
 * Die Tiefe ist kein Vorratsdenken: die Sammlungen der NICHT-Vorgabe-Sprache
 * liegen in einem Sprachordner, ihr Navigationsbaum trägt deshalb dessen Pfad
 * als Wurzel und den Abschnitt erst als dessen Kind. Ein `items.find(…)` auf
 * der obersten Ebene ging dort ins Leere und fiel auf den GANZEN Baum zurück —
 * sichtbar wurde das als Abschnitts-Zeile mit dem blossen Ordnernamen über der
 * Überschrift des Abschnitts, statt „Anleitung"/„Guide" (2026-08-15 live
 * gemessen, damals mit `content/en/…`). Die Vorgabe-Sprache ist nie betroffen,
 * weil bei ihr kein Sprachordner dazwischenliegt — ein Fehler, den man also
 * immer nur auf EINER der beiden Sprachen sieht. Seit dem Sprach-Tausch vom
 * 2026-08-18 ist das die DEUTSCHE Seite (`content/de/…`, Wurzel `/de`).
 */
function findeKnoten(
  items: ContentNavigationItem[],
  pfad: string,
): ContentNavigationItem | undefined {
  for (const item of items) {
    if (item.path === pfad) return item
    const treffer = item.children?.length ? findeKnoten(item.children, pfad) : undefined
    if (treffer) return treffer
  }
  return undefined
}

/**
 * Prefix-Sammlungen liefern EINEN Wurzelknoten (`/anleitung` bzw.
 * `/de/anleitung`) mit den Seiten als Kinder. Die Seitenleiste zeigt die
 * Kinder, weil der Abschnitt schon in der Kopfzeile gewählt wird — sonst
 * stünde er doppelt da.
 */
export function docsSectionItems(
  navigation: DocsNavigation | null | undefined,
  section: DocsSectionKey,
  locale: string,
): ContentNavigationItem[] {
  const items = navigation?.[section] ?? []
  const root = findeKnoten(items, docsSectionPrefix(section, locale))
  return root?.children ?? items
}
