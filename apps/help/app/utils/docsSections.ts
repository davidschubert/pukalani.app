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
 * Schneidet ein führendes `/en` ab — aber NUR, wenn danach ein `/` folgt oder
 * der Pfad endet.
 *
 * Der Lookahead ist kein Zierrat: der deutsche Abschnitt heißt `/entwickler`
 * und beginnt selbst mit den Zeichen `/en`. Ein schlichtes
 * `path.replace(/^\/en/, '')` machte daraus `twickler`, und der
 * Entwickler-Bereich fiele auf Deutsch stillschweigend in die Anleitung
 * zurück — Seitenleiste und Suche zeigten dann die falsche Sammlung, ohne
 * dass irgendwo ein Fehler entstünde.
 */
const SPRACH_PREFIX = /^\/en(?=\/|$)/

/** Pfad → Abschnitt, gleich in welcher Sprache. Alles außerhalb von `/entwickler` ist Anleitung. */
export function resolveDocsSection(path: string): DocsSectionKey {
  const ohneSprache = path.replace(SPRACH_PREFIX, '')
  return ohneSprache.startsWith('/entwickler') ? 'entwickler' : 'anleitung'
}

/** Ist das eine englische Route? Dieselbe Grenzregel wie oben. */
export function isEnglishDocsPath(path: string): boolean {
  return SPRACH_PREFIX.test(path)
}

/**
 * Abschnitt + Sprache → Sammlungsname (content.config.ts). Die einzige Stelle,
 * an der die vier Sammlungsnamen stehen; alles andere denkt in Abschnitten.
 */
export function docsCollection(section: DocsSectionKey, locale: string): DocsCollectionKey {
  if (!locale.startsWith('en')) return section
  return section === 'entwickler' ? 'entwicklerEn' : 'anleitungEn'
}

/** Startseiten-Sammlung je Sprache. */
export function docsLandingCollection(locale: string): 'landing' | 'landingEn' {
  return locale.startsWith('en') ? 'landingEn' : 'landing'
}

/** Pfad-Prefix eines Abschnitts inklusive Sprache — so wie ihn die Sammlung trägt. */
export function docsSectionPrefix(section: DocsSectionKey, locale: string): string {
  const prefix = DOCS_SECTIONS.find(entry => entry.key === section)?.prefix ?? '/anleitung'
  return locale.startsWith('en') ? `/en${prefix}` : prefix
}

/**
 * Sucht den Knoten mit genau diesem Pfad — auch TIEFER als auf der obersten
 * Ebene.
 *
 * Die Tiefe ist kein Vorratsdenken: die englischen Sammlungen liegen unter
 * `content/en/…`, ihr Navigationsbaum trägt deshalb `/en` als Wurzel und den
 * Abschnitt erst als dessen Kind. Ein `items.find(…)` auf der obersten Ebene
 * ging dort ins Leere und fiel auf den GANZEN Baum zurück — sichtbar wurde das
 * als Abschnitts-Zeile „En" über der Überschrift von `/en/anleitung` und
 * `/en/entwickler`: der Leser bekam den Ordnernamen zu sehen statt „Guide"
 * (2026-08-15 live gemessen). Deutsch war nicht betroffen, weil dort kein
 * Sprachordner dazwischenliegt — ein Fehler, den man also nur auf EINER der
 * beiden Sprachen sieht.
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
 * `/en/anleitung`) mit den Seiten als Kinder. Die Seitenleiste zeigt die
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
