/**
 * DIE DATEI-REGISTRY DES KITS — EINE geschlossene Liste, EIN Erzeuger je
 * Datei (Konzept docs/plans/BRAND-BOOK-KIT.md §2.6/§2.9/§2.12, Paket K2).
 *
 * ── SIE IST DIE ALLOWLIST DER ROUTE ──────────────────────────────────────
 * §2.12 Nr. 4: „`:file` gegen eine feste Liste, kein Pfad." Der Router-Parameter
 * wird NIE zu einem Dateinamen zusammengesetzt und NIE zu einem Pfad — er wird
 * in dieser Liste GESUCHT. Was hier nicht steht, ist 404. Damit gibt es keinen
 * Weg, über `..` oder einen Bindestrich irgendwo hinzukommen.
 *
 * ── SIE IST DER ANDOCKPUNKT VON K3 UND K6 ────────────────────────────────
 * `brand.md`, `brand.json` (K3) und `README.md` (K6) stehen HEUTE schon in der
 * Liste — mit `available: false` und Grund `not_built_yet`. Das ist Absicht:
 * das Manifest sagt einem Menschen, was es geben WIRD, statt so zu tun, als
 * gäbe es das Kit nur aus drei Dateien; und die späteren Pakete hängen ihren
 * Erzeuger in dieselbe Karte, statt eine zweite Liste danebenzustellen (§2.6
 * nennt sieben Dateien, nicht drei).
 *
 * ── DER DATEINAME KOMMT AUS DEM SLUG, NIE AUS DER EINGABE ────────────────
 * Der Markenname ist Nutzertext. Für den Download wird daraus ein Slug aus
 * genau `[a-z0-9-]` gebaut (§2.12 Nr. 4) — der Rest fällt weg, nicht nur die
 * gefährlichen Zeichen. Der volle Name reist trotzdem mit, im `filename*`-Teil
 * nach RFC 5987, damit „Kailua Coffee Co." im Download-Ordner lesbar bleibt.
 *
 * DIESE DATEI IST PUR: kein H3, kein Appwrite, kein i18n-Modul.
 */

import { renderBrandLicenses } from './brandKitLicenses'
import { buildBrandTokens, renderBrandTokensJson } from './brandTokens'
import { renderBrandTokensCss } from './brandTokensCss'
import type { BrandKitFile, BrandKitFileId } from './types/brandKit'
import type { BrandDesignSnapshotPreset } from './types/brand'

/**
 * DIE SIEBEN DATEIEN DES KITS (§2.6). `marks/*.svg` fehlt hier bewusst: es ist
 * KEINE Datei, sondern eine je Setzung wechselnde Menge, und sie bekommt in K6
 * ihre eigene Route — eine Registry mit einem Platzhalter-Eintrag „mehrere
 * Dateien" wäre eine Liste, die für einen ihrer Einträge nicht gilt.
 */
export const BRAND_KIT_FILES: readonly BrandKitFile[] = [
  { id: 'tokens.json', filename: 'tokens.json', mime: 'application/json; charset=utf-8', needsDesign: true },
  { id: 'tokens.css', filename: 'tokens.css', mime: 'text/css; charset=utf-8', needsDesign: true },
  { id: 'licenses.md', filename: 'LICENSES.md', mime: 'text/markdown; charset=utf-8', needsDesign: true },
  { id: 'brand.md', filename: 'brand.md', mime: 'text/markdown; charset=utf-8', needsDesign: false },
  { id: 'brand.json', filename: 'brand.json', mime: 'application/json; charset=utf-8', needsDesign: false },
  { id: 'readme.md', filename: 'README.md', mime: 'text/markdown; charset=utf-8', needsDesign: false },
]

const BY_ID = new Map(BRAND_KIT_FILES.map(file => [file.id, file]))

/** `undefined` = kein Eintrag dieser Id. Die Route macht daraus 404. */
export function brandKitFile(id: string): BrandKitFile | undefined {
  return BY_ID.get(id as BrandKitFileId)
}

export function isBrandKitFileId(value: unknown): value is BrandKitFileId {
  return typeof value === 'string' && BY_ID.has(value as BrandKitFileId)
}

/** Was ein Erzeuger braucht. K3 erweitert die Form um die Foundation-Ansicht. */
export interface BrandKitBuildInput {
  /** `null`, solange Schicht 2 nicht steht. */
  preset: BrandDesignSnapshotPreset | null
  title: string
  /** ISO-Stempel des jüngsten beteiligten Kapitels; '' ist erlaubt. */
  stand: string
  /** Inhaltssprache der Marke. */
  locale: string
}

/** Der Inhalt einer Datei als Text — `null` heißt „diese Datei gibt es hier nicht". */
export type BrandKitBuilder = (input: BrandKitBuildInput) => string | null

/**
 * ERZEUGER JE DATEI — in K2 gefüllt für die drei, die aus dem Preset kommen.
 *
 * `null` ist die EHRLICHE Auskunft „noch nicht gebaut" und keine Lücke: das
 * Manifest liest genau dieses `null` und schreibt `reason: 'not_built_yet'`.
 * Wer K3 baut, ersetzt hier ein `null` durch eine Funktion — und die Route,
 * das Manifest und das Bündel ziehen ohne eine weitere Änderung nach.
 */
export const BRAND_KIT_BUILDERS: Readonly<Record<BrandKitFileId, BrandKitBuilder | null>> = {
  'tokens.json': ({ preset, title, stand, locale }) =>
    (preset ? renderBrandTokensJson(buildBrandTokens(preset, { title, stand, locale })) : null),
  'tokens.css': ({ preset, title, stand, locale }) =>
    (preset ? renderBrandTokensCss(buildBrandTokens(preset, { title, stand, locale })) : null),
  'licenses.md': ({ preset, locale }) => renderBrandLicenses(preset, locale),
  // K3 (Brand Context) und K6 (Bündel) hängen sich hier ein.
  'brand.md': null,
  'brand.json': null,
  'readme.md': null,
}

/** Ist diese Datei heute abrufbar — und wenn nein, warum nicht? */
export function brandKitAvailability(
  file: BrandKitFile,
  hasPreset: boolean,
): { available: true } | { available: false, reason: 'design_missing' | 'not_built_yet' } {
  if (!BRAND_KIT_BUILDERS[file.id]) return { available: false, reason: 'not_built_yet' }
  if (file.needsDesign && !hasPreset) return { available: false, reason: 'design_missing' }
  return { available: true }
}

/** Der maximale Slug — lang genug für einen Markennamen, kurz genug für jedes Dateisystem. */
export const BRAND_KIT_SLUG_MAX = 40

/**
 * MARKENNAME → SLUG, Allowlist `[a-z0-9-]` (§2.12 Nr. 4).
 *
 * Umlaute werden UMSCHRIEBEN und nicht weggeworfen: „Grünberg" soll
 * `gruenberg` heißen und nicht `grnberg`. Alles andere fällt weg; bleibt
 * nichts übrig (eine rein chinesische Marke), heißt der Stamm `brand` —
 * ein leerer Dateiname wäre ein Download namens `-tokens.json`.
 */
export function brandKitSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BRAND_KIT_SLUG_MAX)
    .replace(/-+$/g, '')
  return slug || 'brand'
}

/**
 * DER STAND ALS DATUM — `2026-09-09` aus dem ISO-Stempel, '' wenn keiner da
 * ist. Er steht im Dateinamen, damit zwei Downloads derselben Marke im
 * Ordner unterscheidbar bleiben; ohne Stand fällt der Teil weg, statt ein
 * „heute" zu behaupten.
 */
export function brandKitStandStamp(stand: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(stand.trim())
  return match?.[1] ?? ''
}

/**
 * DER DATEINAME DES DOWNLOADS — `kailua-coffee-tokens-2026-09-09.json`.
 *
 * Gebaut aus Slug, Datei-Stamm und Stand; die Endung kommt aus der REGISTRY
 * und nie aus der Eingabe.
 */
export function brandKitDownloadName(file: BrandKitFile, slug: string, stand: string): string {
  const dot = file.filename.lastIndexOf('.')
  const stem = (dot > 0 ? file.filename.slice(0, dot) : file.filename).toLowerCase()
  const ext = dot > 0 ? file.filename.slice(dot + 1).toLowerCase() : ''
  const stamp = brandKitStandStamp(stand)
  const parts = [slug, stem, ...(stamp ? [stamp] : [])]
  return ext ? `${parts.join('-')}.${ext}` : parts.join('-')
}

/**
 * DER LESBARE NAME — `Kailua Coffee Co. tokens 2026-09-09.json`.
 *
 * Er ist das, was ein Mensch im Download-Ordner sieht, wenn sein Browser
 * `filename*` liest. Der Markenname steht darin UNVERÄNDERT (er ist eine
 * Angabe über die Marke, keine Eingabe in einen Pfad) — sicher ist das, weil
 * er prozentkodiert reist und der ASCII-Rückfall daneben aus dem Slug kommt.
 */
export function brandKitReadableName(file: BrandKitFile, title: string, stand: string): string {
  const dot = file.filename.lastIndexOf('.')
  const stem = dot > 0 ? file.filename.slice(0, dot) : file.filename
  const ext = dot > 0 ? file.filename.slice(dot) : ''
  const stamp = brandKitStandStamp(stand)
  // Zeilenumbrüche und Anführungszeichen haben in einem Kopf nichts verloren —
  // die Kodierung erledigt das, der Schnitt hält den Namen zusätzlich kurz.
  const clean = title.replace(/[\r\n"\\]/g, ' ').trim().slice(0, 60) || 'Brand'
  return `${clean} ${stem}${stamp ? ` ${stamp}` : ''}${ext}`
}

/**
 * `Content-Disposition` mit ASCII-Rückfall UND `filename*` nach RFC 5987
 * (§2.12 Nr. 4).
 *
 * Beide Namen stehen da, weil alte Werkzeuge nur den ersten lesen und neue
 * den zweiten bevorzugen. Der ASCII-Teil ist schon der Slug-Name (er kann
 * keine Anführungszeichen und keine Zeilenumbrüche enthalten); der zweite
 * trägt den vollen, lesbaren Namen prozentkodiert.
 */
export function brandKitContentDisposition(asciiName: string, readableName: string): string {
  const encoded = encodeURIComponent(readableName).replace(/['()*]/g, char =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`
}
