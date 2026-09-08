/**
 * DER SCHRIFTPAAR-KATALOG VON BRAND DESIGN (Konzept
 * docs/plans/BRAND-DESIGN.md §2.4, Paket D0).
 *
 * Sechs kuratierte Paare: die fünf aus docs/referenz/THEMES-CONCEPT-V2.md §3.5
 * plus das eine Paar des G4-Richtungs-Katalogs (`contrast`, Sora + Inter), das
 * dort kein Gegenstück hat. Übernommen aus dem freigegebenen Prototyp
 * (`.playground/app/utils/demoDesign.ts`, `DS_FONT_PAIRS`) — Ids und Stacks
 * wörtlich, damit der echte Bau dieselben Schriften zeigt wie der Dummy.
 *
 * ── DIE FALLE, DIE DIESER KATALOG NICHT ALLEIN LÖST (§2.17) ───────────────
 * `@nuxt/fonts` self-hostet nur, was der BUILD im CSS sieht. Eine Familie, die
 * hier steht und in keiner CSS-Datei der App deklariert ist, fällt in der
 * Vorschau STILL auf den Systemstack zurück — die Seite sähe dann aus wie G4
 * („eine Richtung, kein Rendering-Beweis"), obwohl sie genau das Gegenteil
 * beweisen soll. Kein Fehler, keine Warnung, kein roter Build.
 *
 * Deshalb steht neben dem Katalog `BRAND_DECLARED_FONT_FAMILIES`: die Liste
 * der Familien, die DEKLARIERT SIND. Sie ist von Hand gepflegt und spiegelt
 * seit D2c das LAYER-CSS `app/assets/css/brand-fonts.css` (vorher den Stand
 * des Playground-CSS) — es hängt über `nuxt.config.ts` im `css`-Array und
 * gilt damit für jede App, die den brand-Layer erbt, heute `apps/branding`.
 * **D4 macht dieses CSS zur QUELLE der Liste** (daraus gelesen oder gegen sie
 * geprüft). Bis dahin ist der Test in `tests/brandFontPairs.test.ts` der
 * Wächter: jede Familie des Katalogs muss in der Liste stehen.
 *
 * ── DIESE DATEI IST PUR ───────────────────────────────────────────────────
 * Kein i18n, kein H3, kein Appwrite, keine Layer-Importe. Die Namen sind
 * EIGENNAMEN von Schriften und laufen deshalb nicht über i18n (dieselbe Regel
 * wie bei den Theme-Namen, CLAUDE.md); die Beschreibungs-Zeile steht
 * zweisprachig daneben.
 *
 * D1: Inhalte sind Davids Gate — die Notizen sind aus dem Prototyp übernommen
 * und nicht gegengelesen.
 */

export interface BrandFontPair {
  /** Stabile Id — sie steht in `i.pair` und im Preset. Nie umbenennen. */
  readonly id: string
  readonly nameDe: string
  readonly nameEn: string
  /** Familienname, wie ihn ein Mensch liest — er steht auf der Karte. */
  readonly headingFamily: string
  /** Vollständiger CSS-Stack inklusive Rückfall. */
  readonly headingStack: string
  readonly bodyFamily: string
  readonly bodyStack: string
  /** Ein Satz, was dieses Paar tut — und was es kostet. */
  readonly noteDe: string
  readonly noteEn: string
}

export const BRAND_FONT_PAIRS: readonly BrandFontPair[] = [
  {
    id: 'editorial',
    nameDe: 'Redaktionell',
    nameEn: 'Editorial',
    headingFamily: 'Source Serif 4',
    headingStack: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    bodyFamily: 'Source Sans 3',
    bodyStack: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Serif oben, Grotesk unten — die Buch-Anmutung, die zu „fundiert" gehört.',
    noteEn: 'Serif above, sans below — the book-like feel that belongs to "well-founded".',
  },
  {
    id: 'humanist',
    nameDe: 'Humanistisch',
    nameEn: 'Humanist',
    headingFamily: 'Source Sans 3',
    headingStack: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    bodyFamily: 'Source Sans 3',
    bodyStack: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Eine Familie, zwei Rollen: ruhig, unaufdringlich, überall lesbar.',
    noteEn: 'One family, two roles: quiet, unobtrusive, readable everywhere.',
  },
  {
    id: 'inter',
    nameDe: 'Neutral',
    nameEn: 'Neutral',
    headingFamily: 'Inter',
    headingStack: "Inter, 'Helvetica Neue', Arial, sans-serif",
    bodyFamily: 'Inter',
    bodyStack: "Inter, 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Die Arbeitsschrift des Netzes — sagt nichts über euch, stört aber auch nie.',
    noteEn: 'The working typeface of the web — it says nothing about you, and never gets in the way.',
  },
  {
    id: 'geometric',
    nameDe: 'Geometrisch',
    nameEn: 'Geometric',
    headingFamily: 'Sora',
    headingStack: "Sora, 'Avenir Next', 'Helvetica Neue', Arial, sans-serif",
    bodyFamily: 'Nunito Sans',
    bodyStack: "'Nunito Sans', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Konstruierte Formen — moderner, aber weiter weg vom Handwerk.',
    noteEn: 'Constructed shapes — more modern, but further from the craft.',
  },
  {
    id: 'classic',
    nameDe: 'Klassisch',
    nameEn: 'Classic',
    headingFamily: 'PT Serif',
    headingStack: "'PT Serif', Georgia, 'Times New Roman', serif",
    bodyFamily: 'PT Sans',
    bodyStack: "'PT Sans', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Amtlich-solide: gut für Institutionen, etwas streng für kleine Marken.',
    noteEn: 'Officially solid: good for institutions, a little stern for small brands.',
  },
  {
    id: 'contrast',
    nameDe: 'Kontrastreich',
    nameEn: 'High contrast',
    headingFamily: 'Sora',
    headingStack: "Sora, 'Avenir Next', 'Helvetica Neue', Arial, sans-serif",
    bodyFamily: 'Inter',
    bodyStack: "Inter, 'Helvetica Neue', Arial, sans-serif",
    noteDe: 'Aus dem Richtungs-Katalog („Mutig & Kontrastreich") — laut, aber wach.',
    noteEn: 'From the directions catalogue ("bold and high-contrast") — loud, but awake.',
  },
]

/**
 * DIE MONO-ROLLE IST FIX (Themes-Regel „maximal drei Schriften"): sie ist
 * keine dritte Marke, sondern eine Rolle — Herkunftsangaben, Preise, Code.
 * Deshalb steht sie NEBEN dem Katalog und nicht als Feld je Paar.
 */
export const BRAND_MONO_STACK = "'Geist Mono', ui-monospace, SFMono-Regular, monospace"

/**
 * DIE FAMILIEN, DIE WIRKLICH GELADEN WERDEN.
 *
 * Von Hand gepflegt (s. Kopf): sie spiegelt seit D2c die Deklaration im
 * Layer-CSS `app/assets/css/brand-fonts.css`. **D4 macht dieses CSS zur
 * Quelle** — die Liste wird daraus abgeleitet bzw. gegen sie geprüft. Bis
 * dahin gilt: wer ein Paar in den Katalog legt, trägt seine Familien HIER ein
 * UND deklariert sie dort — sonst zeigt die Vorschau still den Systemstack.
 */
export const BRAND_DECLARED_FONT_FAMILIES: readonly string[] = [
  'Inter',
  'Source Sans 3',
  'Source Serif 4',
  'Nunito Sans',
  'Sora',
  'PT Sans',
  'PT Serif',
]

const PAIRS_BY_ID = new Map(BRAND_FONT_PAIRS.map(pair => [pair.id, pair]))

/** `undefined` = kein Paar dieser Id — der Aufrufer entscheidet über den Rückfall. */
export function brandFontPair(id: string): BrandFontPair | undefined {
  return PAIRS_BY_ID.get(id)
}

/** Beide Familien eines Paares, ohne Doppelung (`humanist` nutzt eine für beides). */
export function brandFontPairFamilies(pair: BrandFontPair): readonly string[] {
  return [...new Set([pair.headingFamily, pair.bodyFamily])]
}

/**
 * DIE INVARIANTEN DES KATALOGS als prüfbare Funktion — keine doppelte Id, kein
 * leeres Feld, jede Familie im eigenen Stack genannt und in
 * `BRAND_DECLARED_FONT_FAMILIES` deklariert (§2.17). Nimmt beliebige Listen,
 * damit der Beweis mutierte Fassungen vorlegen kann.
 */
export function validateBrandFontPairs(
  pairs: readonly BrandFontPair[] = BRAND_FONT_PAIRS,
  declared: readonly string[] = BRAND_DECLARED_FONT_FAMILIES,
): readonly string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  const declaredSet = new Set(declared)

  for (const pair of pairs) {
    if (seen.has(pair.id)) problems.push(`doppelte Paar-Id: ${pair.id}`)
    seen.add(pair.id)
    if (!pair.nameDe.trim() || !pair.nameEn.trim()) problems.push(`${pair.id}: Name unvollständig`)
    if (!pair.noteDe.trim() || !pair.noteEn.trim()) problems.push(`${pair.id}: Notiz unvollständig`)
    for (const [family, stack, role] of [
      [pair.headingFamily, pair.headingStack, 'heading'] as const,
      [pair.bodyFamily, pair.bodyStack, 'body'] as const,
    ]) {
      if (!family.trim()) {
        problems.push(`${pair.id}: ${role} ohne Familie`)
        continue
      }
      // Der Stack muss mit seiner eigenen Familie ANFANGEN — ein Stack, in dem
      // sie fehlt, lädt sie nie, egal was der Katalog behauptet.
      if (!stack.includes(family)) {
        problems.push(`${pair.id}: ${role}-Stack nennt "${family}" nicht`)
      }
      if (!declaredSet.has(family)) {
        problems.push(`${pair.id}: "${family}" ist nicht deklariert (§2.17 — die Vorschau fiele still zurück)`)
      }
    }
  }
  return problems
}
